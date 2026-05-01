"""
compliance_router.py
─────────────────────
FastAPI router exposing 3 compliance endpoints.

Place this file in your backend root (same folder as main.py).

Then in main.py add:
    from compliance_router import router as compliance_router
    app.include_router(compliance_router, prefix="/api")
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user          # your existing auth dependency
from models import Assessment, ComplianceResult     # ComplianceResult added in previous step
from backend.routers.compliance_frameworks import (
    build_assessment_dict,
    score_all_frameworks,
    score_framework,
    FRAMEWORKS,
)

router = APIRouter(tags=["Compliance"])


# ─────────────────────────────────────────────
# Pydantic Schemas
# ─────────────────────────────────────────────

class ControlDetail(BaseModel):
    id: str
    name: str
    description: str
    status: str                    # "pass" | "fail" | "partial"
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
    assessment_id: int
    framework: str
    score: float
    updated_at: Optional[datetime] = None


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def _get_assessment_or_404(
    assessment_id: int,
    tenant_id: int,
    db: Session,
) -> Assessment:
    assessment = (
        db.query(Assessment)
        .filter(
            Assessment.id == assessment_id,
            Assessment.tenant_id == tenant_id,   # enforce tenant isolation
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
    """
    Score the assessment (one framework or all) and upsert into compliance_results.
    Returns the list of saved ComplianceResult ORM objects.
    """
    assessment_dict = build_assessment_dict(assessment)

    if framework:
        results_data = [score_framework(framework, assessment_dict)]
    else:
        results_data = score_all_frameworks(assessment_dict)

    saved = []
    for result in results_data:
        # Upsert: update existing row or create a new one
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

@router.post(
    "/assessments/{assessment_id}/compliance",
    response_model=List[FrameworkResult],
    summary="Run compliance mapping for an assessment",
    description=(
        "Scores the assessment against SOC2, ISO 27001, and NIST CSF. "
        "Results are saved/updated in the database and returned. "
        "Optionally pass ?framework=SOC2 to score a single framework."
    ),
)
def run_compliance_mapping(
    assessment_id: int,
    framework: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> List[FrameworkResult]:
    if framework and framework not in FRAMEWORKS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown framework '{framework}'. Valid: {list(FRAMEWORKS.keys())}",
        )

    assessment = _get_assessment_or_404(assessment_id, current_user.tenant_id, db)
    saved = _run_and_save(assessment, db, framework=framework)
    return [_orm_to_schema(cr) for cr in saved]


@router.get(
    "/assessments/{assessment_id}/compliance",
    response_model=List[FrameworkResult],
    summary="Get saved compliance results for an assessment",
    description=(
        "Returns previously saved compliance results. "
        "If no results exist yet, automatically runs the scoring and returns fresh results."
    ),
)
def get_compliance_results(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> List[FrameworkResult]:
    assessment = _get_assessment_or_404(assessment_id, current_user.tenant_id, db)

    existing = (
        db.query(ComplianceResult)
        .filter(ComplianceResult.assessment_id == assessment_id)
        .all()
    )

    # Auto-run if no results exist yet
    if not existing:
        existing = _run_and_save(assessment, db)

    return [_orm_to_schema(cr) for cr in existing]


@router.get(
    "/compliance/summary",
    response_model=List[ComplianceSummaryItem],
    summary="Tenant-wide compliance summary",
    description=(
        "Returns the latest compliance scores for all assessments "
        "belonging to the current user's tenant — one row per (assessment, framework) pair."
    ),
)
def get_compliance_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> List[ComplianceSummaryItem]:
    # Fetch all assessments for this tenant
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