"""
compliance_routes.py
─────────────────────
Place this file at:  backend/routers/compliance_routes.py
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import Assessment, ComplianceResult
from compliance_frameworks import (
    build_assessment_dict,
    score_all_frameworks,
    score_framework,
    FRAMEWORKS,
)

router = APIRouter(prefix="/api/compliance", tags=["Compliance"])


# ─────────────────────────────────────────────
# Pydantic Schemas
# ─────────────────────────────────────────────

class ControlDetail(BaseModel):
    id: str
    name: str
    description: str
    status: str
    passing_fields: List[str]
    failing_fields: List[str]
    weight: float
    earned: float


class FrameworkResult(BaseModel):
    framework: str
    score: float
    controls: List[ControlDetail]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ComplianceSummaryItem(BaseModel):
    assessment_id: str
    framework: str
    score: float
    updated_at: Optional[datetime] = None


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def _get_assessment_or_404(assessment_id: str, tenant_id: str, db: Session) -> Assessment:
    assessment = (
        db.query(Assessment)
        .filter(
            Assessment.id == assessment_id,
            Assessment.tenant_id == tenant_id,
        )
        .first()
    )
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assessment {assessment_id} not found.",
        )
    return assessment


def _run_and_save(
    assessment: Assessment,
    db: Session,
    framework: Optional[str] = None,
) -> List[ComplianceResult]:
    assessment_dict = build_assessment_dict(assessment)

    results_data = (
        [score_framework(framework, assessment_dict)]
        if framework
        else score_all_frameworks(assessment_dict)
    )

    saved = []
    for result in results_data:
        existing = (
            db.query(ComplianceResult)
            .filter(
                ComplianceResult.assessment_id == assessment.id,
                ComplianceResult.framework == result["framework"],
            )
            .first()
        )
        if existing:
            existing.score = result["score"]
            existing.controls_detail = result["controls"]
            existing.updated_at = datetime.utcnow()
            saved.append(existing)
        else:
            new_result = ComplianceResult(
                assessment_id=assessment.id,
                framework=result["framework"],
                score=result["score"],
                controls_detail=result["controls"],
            )
            db.add(new_result)
            saved.append(new_result)

    db.commit()
    for obj in saved:
        db.refresh(obj)
    return saved


def _orm_to_schema(cr: ComplianceResult) -> FrameworkResult:
    return FrameworkResult(
        framework=cr.framework,
        score=cr.score,
        controls=[ControlDetail(**c) for c in (cr.controls_detail or [])],
        created_at=cr.created_at,
        updated_at=cr.updated_at,
    )


# ─────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────

@router.post("/assessments/{assessment_id}", response_model=List[FrameworkResult])
def run_compliance_mapping(
    assessment_id: str,
    framework: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Run compliance scoring for an assessment. ?framework=SOC2 for a single framework."""
    if framework and framework not in FRAMEWORKS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown framework '{framework}'. Valid: {list(FRAMEWORKS.keys())}",
        )
    assessment = _get_assessment_or_404(assessment_id, current_user.tenant_id, db)
    saved = _run_and_save(assessment, db, framework=framework)
    return [_orm_to_schema(cr) for cr in saved]


@router.get("/assessments/{assessment_id}", response_model=List[FrameworkResult])
def get_compliance_results(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get saved compliance results. Auto-runs scoring if none exist yet."""
    assessment = _get_assessment_or_404(assessment_id, current_user.tenant_id, db)

    existing = (
        db.query(ComplianceResult)
        .filter(ComplianceResult.assessment_id == assessment_id)
        .all()
    )

    if not existing:
        existing = _run_and_save(assessment, db)

    return [_orm_to_schema(cr) for cr in existing]


@router.get("/summary", response_model=List[ComplianceSummaryItem])
def get_compliance_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """All compliance scores across all assessments for the current tenant."""
    assessment_ids = (
        db.query(Assessment.id)
        .filter(Assessment.tenant_id == current_user.tenant_id)
        .subquery()
    )

    rows = (
        db.query(ComplianceResult)
        .filter(ComplianceResult.assessment_id.in_(assessment_ids))
        .order_by(ComplianceResult.assessment_id, ComplianceResult.framework)
        .all()
    )

    return [
        ComplianceSummaryItem(
            assessment_id=row.assessment_id,
            framework=row.framework,
            score=row.score,
            updated_at=row.updated_at,
        )
        for row in rows
    ]