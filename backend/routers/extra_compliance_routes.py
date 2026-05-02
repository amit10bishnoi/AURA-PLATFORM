"""
Addition to compliance_routes.py — add these endpoints

Wire by adding to your existing compliance_routes.py imports:
  from extra_frameworks import score_extra_framework, EXTRA_FRAMEWORK_META
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from dependencies import get_current_user
from models import Assessment
from extra_frameworks import score_extra_framework, EXTRA_FRAMEWORK_META

# Add this to your existing compliance router
extra_router = APIRouter(prefix="/api/extra-compliance", tags=["Extra Frameworks — HIPAA, GDPR, PCI DSS, RBI, DPDP"])


@extra_router.get("/frameworks", summary="List all 5 extra compliance frameworks")
def list_extra_frameworks(_=Depends(get_current_user)):
    """Returns metadata for HIPAA, GDPR, PCI DSS, RBI, and DPDP Act 2023."""
    return [
        {
            "key":      k,
            "label":    v["label"],
            "full_name": v["full_name"],
            "region":   v["region"],
            "for":      v["for"],
            "color":    v["color"],
            "controls": len(v["controls"]),
        }
        for k, v in EXTRA_FRAMEWORK_META.items()
    ]


@extra_router.post(
    "/assessments/{assessment_id}",
    summary="Score assessment against all 5 extra frameworks",
)
def score_all_extra(
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

    results = []
    for framework_key in EXTRA_FRAMEWORK_META.keys():
        result = score_extra_framework(framework_key, assessment)
        results.append(result)

    return {
        "assessment_id": assessment_id,
        "org_name":      assessment.org_name,
        "frameworks":    results,
        "total_frameworks": len(results),
    }


@extra_router.get(
    "/assessments/{assessment_id}/{framework}",
    summary="Score against specific framework (HIPAA/GDPR/PCI_DSS/RBI/DPDP)",
)
def score_one_framework(
    assessment_id: str,
    framework: str,
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

    framework = framework.upper()
    if framework not in EXTRA_FRAMEWORK_META:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown framework. Choose from: {list(EXTRA_FRAMEWORK_META.keys())}",
        )

    return score_extra_framework(framework, assessment)
