"""
compliance_router.py — MongoDB edition
ComplianceResult is stored as a sub-document in the assessments collection
(field: compliance_results — a dict keyed by framework name).
No separate collection needed; upsert logic preserved.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from database import get_collection, ist_now
from dependencies import get_current_user

try:
    from compliance_frameworks import build_assessment_dict, score_all_frameworks, score_framework, FRAMEWORKS
except ImportError:
    # Graceful degradation if compliance_frameworks not present
    def build_assessment_dict(a): return dict(a)
    def score_all_frameworks(a): return []
    def score_framework(fw, a): return {}
    FRAMEWORKS = {}

router = APIRouter(tags=["Compliance"])


def _assessments():
    return get_collection("assessments")


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class ControlDetail(BaseModel):
    id:             str
    name:           str
    description:    str
    status:         str
    passing_fields: List[str]
    failing_fields: List[str]
    weight:         float
    earned:         float


class FrameworkResult(BaseModel):
    framework:  str
    score:      float
    controls:   List[ControlDetail]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ComplianceSummaryItem(BaseModel):
    assessment_id: str
    framework:     str
    score:         float
    updated_at:    Optional[datetime] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_assessment_or_404(assessment_id: str, tenant_id: str) -> dict:
    doc = await _assessments().find_one(
        {"$or": [{"_id": assessment_id}, {"id": assessment_id}],
         "tenant_id": tenant_id}
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assessment {assessment_id} not found.",
        )
    return doc


async def _run_and_save(
    assessment: dict,
    framework:  Optional[str] = None,
) -> List[dict]:
    assessment_dict = build_assessment_dict(assessment)
    assessment_id   = str(assessment.get("_id", assessment.get("id", "")))

    if framework:
        results_data = [score_framework(framework, assessment_dict)]
    else:
        results_data = list(score_all_frameworks(assessment_dict))

    now = ist_now()
    saved = []
    set_ops: dict = {}

    for result in results_data:
        fw  = result.get("framework", "unknown")
        key = f"compliance_results.{fw}"
        entry = {
            "framework":       fw,
            "score":           result.get("score", 0),
            "controls_detail": result.get("controls", []),
            "updated_at":      now,
        }
        existing = assessment.get("compliance_results", {}).get(fw)
        if not existing:
            entry["created_at"] = now
        else:
            entry["created_at"] = existing.get("created_at", now)
        set_ops[key] = entry
        saved.append(entry)

    if set_ops:
        await _assessments().update_one(
            {"$or": [{"_id": assessment_id}, {"id": assessment_id}]},
            {"$set": set_ops},
        )

    return saved


def _to_schema(entry: dict) -> FrameworkResult:
    controls_raw = entry.get("controls_detail") or []
    controls = []
    for c in controls_raw:
        try:
            controls.append(ControlDetail(**c))
        except Exception:
            pass
    return FrameworkResult(
        framework=entry.get("framework", ""),
        score=entry.get("score", 0),
        controls=controls,
        created_at=entry.get("created_at"),
        updated_at=entry.get("updated_at"),
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post(
    "/assessments/{assessment_id}/compliance",
    response_model=List[FrameworkResult],
    summary="Run compliance mapping for an assessment",
)
async def run_compliance_mapping(
    assessment_id: str,
    framework:     Optional[str] = None,
    current_user=Depends(get_current_user),
) -> List[FrameworkResult]:
    if framework and FRAMEWORKS and framework not in FRAMEWORKS:
        raise HTTPException(400, f"Unknown framework '{framework}'. Valid: {list(FRAMEWORKS.keys())}")

    assessment = await _get_assessment_or_404(assessment_id, current_user.tenant_id)
    saved = await _run_and_save(assessment, framework=framework)
    return [_to_schema(e) for e in saved]


@router.get(
    "/assessments/{assessment_id}/compliance",
    response_model=List[FrameworkResult],
    summary="Get saved compliance results for an assessment",
)
async def get_compliance_results(
    assessment_id: str,
    current_user=Depends(get_current_user),
) -> List[FrameworkResult]:
    assessment = await _get_assessment_or_404(assessment_id, current_user.tenant_id)
    existing   = assessment.get("compliance_results", {})

    if not existing:
        saved = await _run_and_save(assessment)
        return [_to_schema(e) for e in saved]

    return [_to_schema(v) for v in existing.values()]


@router.get(
    "/compliance/summary",
    response_model=List[ComplianceSummaryItem],
    summary="Tenant-wide compliance summary",
)
async def get_compliance_summary(current_user=Depends(get_current_user)) -> List[ComplianceSummaryItem]:
    docs = await _assessments().find(
        {"tenant_id": current_user.tenant_id}
    ).sort("created_at", -1).to_list(50)

    out = []
    for doc in docs:
        aid = str(doc.get("_id", doc.get("id", "")))
        for fw, entry in (doc.get("compliance_results") or {}).items():
            out.append(ComplianceSummaryItem(
                assessment_id=aid,
                framework=fw,
                score=entry.get("score", 0),
                updated_at=entry.get("updated_at"),
            ))
    return out
