import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Assessment, Task
from schemas import AssessmentCreate, AssessmentResponse, AssessmentListItem
from dependencies import get_current_user, require_role, CurrentUser
from services.assessment_service import (calculate_risk_score, estimate_financial_exposure,
                                          generate_recommendations, create_remediation_tasks,
                                          generate_ai_remediation)

router = APIRouter(tags=["Assessments"])


@router.post("/assess", response_model=AssessmentResponse)
async def create_assessment(
    data: AssessmentCreate,
    current_user: CurrentUser = Depends(require_role("developer")),
    db: Session = Depends(get_db),
):
    """Run a risk assessment. Only developers can do this."""
    risk_score, risk_level = calculate_risk_score(
        employees=data.employees,
        has_mfa=data.has_mfa,
        mfa_coverage=data.mfa_coverage,
        patch_days=data.patch_days,
        training_percent=data.training_percent,
        has_irp=data.has_irp,
        vulnerabilities=data.vulnerabilities,
        vuln_critical=data.vuln_critical or 0,
        vuln_high=data.vuln_high or 0,
        vuln_medium=data.vuln_medium or 0,
        vuln_low=data.vuln_low or 0,
    )
    financial_exposure = estimate_financial_exposure(risk_score, data.employees, data.industry)
    recommendations = generate_recommendations(
        has_mfa=data.has_mfa,
        mfa_coverage=data.mfa_coverage,
        patch_days=data.patch_days,
        training_percent=data.training_percent,
        has_irp=data.has_irp,
        vulnerabilities=data.vulnerabilities,
        vuln_critical=data.vuln_critical or 0,
        vuln_high=data.vuln_high or 0,
    )

    assessment = Assessment(
        tenant_id=current_user.tenant_id,
        created_by=current_user.id,
        org_name=data.org_name,
        industry=data.industry,
        employees=data.employees,
        has_mfa=data.has_mfa,
        mfa_coverage=data.mfa_coverage,
        patch_days=data.patch_days,
        training_percent=data.training_percent,
        has_irp=data.has_irp,
        vulnerabilities=data.vulnerabilities,
        vuln_critical=data.vuln_critical or 0,
        vuln_high=data.vuln_high or 0,
        vuln_medium=data.vuln_medium or 0,
        vuln_low=data.vuln_low or 0,
        vuln_source=data.vuln_source,
        risk_score=risk_score,
        risk_level=risk_level,
        financial_exposure=financial_exposure,
        recommendations=json.dumps(recommendations),
        model_version="rule-based-v2",
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    create_remediation_tasks(db, current_user.tenant_id, assessment.id,
                             recommendations, current_user.id)

    return AssessmentResponse(
        id=assessment.id,
        tenant_id=assessment.tenant_id,
        org_name=assessment.org_name,
        industry=assessment.industry,
        employees=assessment.employees,
        has_mfa=assessment.has_mfa,
        mfa_coverage=assessment.mfa_coverage,
        patch_days=assessment.patch_days,
        training_percent=assessment.training_percent,
        has_irp=assessment.has_irp,
        vulnerabilities=assessment.vulnerabilities,
        risk_score=assessment.risk_score,
        risk_level=assessment.risk_level,
        financial_exposure=assessment.financial_exposure,
        recommendations=recommendations,
        model_version=assessment.model_version,
        created_at=assessment.created_at,
    )


@router.post("/assess/ai-remediation")
async def ai_remediation(
    assessment_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate AI-powered remediation tasks for an existing assessment."""
    a = db.query(Assessment).filter(
        Assessment.id == assessment_id,
        Assessment.tenant_id == current_user.tenant_id,
    ).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assessment not found")

    ai_tasks = await generate_ai_remediation(
        org_name=a.org_name,
        industry=a.industry or "General",
        risk_score=a.risk_score,
        risk_level=a.risk_level,
        financial_exposure=a.financial_exposure,
        has_mfa=a.has_mfa,
        mfa_coverage=a.mfa_coverage,
        patch_days=a.patch_days,
        training_percent=a.training_percent,
        has_irp=a.has_irp,
        vulnerabilities=a.vulnerabilities,
        vuln_critical=a.vuln_critical,
        vuln_high=a.vuln_high,
        vuln_medium=a.vuln_medium,
    )

    if not ai_tasks:
        raise HTTPException(
            status_code=503,
            detail="AI service unavailable. Check ANTHROPIC_API_KEY is set correctly."
        )

    for t in ai_tasks:
        task = Task(
            tenant_id=current_user.tenant_id,
            title=t.get("title", "AI Remediation Task")[:200],
            description=f"{t.get('description', '')} | Impact: {t.get('impact', '')} | Est. effort: {t.get('effort_days', 7)} days",
            priority=t.get("priority", "MEDIUM"),
            status="open",
            source="ai-assessment",
            source_assessment_id=assessment_id,
            created_by=current_user.id,
        )
        db.add(task)
    db.commit()

    return {
        "assessment_id": assessment_id,
        "ai_tasks_generated": len(ai_tasks),
        "tasks": ai_tasks,
        "message": f"✅ {len(ai_tasks)} AI remediation tasks added to your board.",
    }


@router.get("/assessments", response_model=List[AssessmentListItem])
async def list_assessments(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all assessments for this tenant only."""
    rows = db.query(Assessment).filter(
        Assessment.tenant_id == current_user.tenant_id
    ).order_by(Assessment.created_at.asc()).all()
    return [AssessmentListItem(
        id=r.id, org_name=r.org_name, industry=r.industry,
        risk_score=r.risk_score, risk_level=r.risk_level,
        financial_exposure=r.financial_exposure, created_at=r.created_at,
    ) for r in rows]


@router.get("/assessments/{assessment_id}", response_model=AssessmentResponse)
async def get_assessment(
    assessment_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    a = db.query(Assessment).filter(
        Assessment.id == assessment_id,
        Assessment.tenant_id == current_user.tenant_id,
    ).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assessment not found")

    recs = []
    if a.recommendations:
        try: recs = json.loads(a.recommendations)
        except: pass

    return AssessmentResponse(
        id=a.id, tenant_id=a.tenant_id, org_name=a.org_name, industry=a.industry,
        employees=a.employees, has_mfa=a.has_mfa, mfa_coverage=a.mfa_coverage,
        patch_days=a.patch_days, training_percent=a.training_percent, has_irp=a.has_irp,
        vulnerabilities=a.vulnerabilities, risk_score=a.risk_score, risk_level=a.risk_level,
        financial_exposure=a.financial_exposure, recommendations=recs,
        model_version=a.model_version, created_at=a.created_at,
    )