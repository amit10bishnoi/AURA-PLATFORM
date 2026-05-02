"""
evidence_routes.py — Automated Evidence Collection Endpoints
Place at: backend/routers/evidence_routes.py

Wire in main.py:
  from routers.evidence_routes import router as evidence_router
  app.include_router(evidence_router)
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
from models import Assessment
from services.evidence_service import generate_evidence_package, format_evidence_for_auditor
from services.identity_service import pull_identity_data
from services.patch_service import pull_patch_data
from services.asset_service import pull_asset_data

router = APIRouter(prefix="/api/evidence", tags=["Automated Evidence Collection"])


@router.post(
    "/generate/{assessment_id}",
    summary="Generate automated evidence package for auditor",
    description=(
        "Pulls latest data from all connected providers and generates "
        "a structured evidence package with pass/fail verdicts for each control. "
        "Covers SOC 2, ISO 27001, HIPAA, GDPR, PCI DSS, RBI, and DPDP Act."
    ),
)
def generate_evidence(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    assessment = (
        db.query(Assessment)
        .filter(
            Assessment.id == assessment_id,
            Assessment.tenant_id == current_user.tenant_id,
        )
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Pull latest data
    employees = assessment.employees or 100
    identity  = pull_identity_data(assessment.org_name, employees)
    patch     = pull_patch_data(assessment.org_name, employees)
    assets    = pull_asset_data(assessment.org_name, employees)

    # Generate evidence
    evidence_list = generate_evidence_package(assessment, identity, patch, assets)
    package = format_evidence_for_auditor(evidence_list)

    return {
        "assessment_id": assessment_id,
        "org_name":      assessment.org_name,
        **package,
    }


@router.get(
    "/summary/{assessment_id}",
    summary="Quick evidence readiness summary",
)
def evidence_summary(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    assessment = (
        db.query(Assessment)
        .filter(
            Assessment.id == assessment_id,
            Assessment.tenant_id == current_user.tenant_id,
        )
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    employees = assessment.employees or 100
    identity  = pull_identity_data(assessment.org_name, employees)
    patch     = pull_patch_data(assessment.org_name, employees)
    assets    = pull_asset_data(assessment.org_name, employees)

    evidence_list = generate_evidence_package(assessment, identity, patch, assets)

    return {
        "assessment_id":    assessment_id,
        "org_name":         assessment.org_name,
        "total_items":      len(evidence_list),
        "pass":             sum(1 for e in evidence_list if e["status"] == "PASS"),
        "fail":             sum(1 for e in evidence_list if e["status"] == "FAIL"),
        "partial":          sum(1 for e in evidence_list if e["status"] == "PARTIAL"),
        "readiness_pct":    round(sum(1 for e in evidence_list if e["status"] == "PASS") / max(len(evidence_list), 1) * 100, 1),
        "automated_sources": ["Azure AD", "Intune", "AWS", "NVD CVE Feed"],
        "manual_items":     [e["id"] for e in evidence_list if "Self-Attested" in e.get("source", "")],
    }
