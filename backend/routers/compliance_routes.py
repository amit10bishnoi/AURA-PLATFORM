"""
compliance_routes.py — MongoDB edition
Assessment and compliance result lookups via Motor.
"""
from fastapi import APIRouter, Depends, HTTPException

from database import get_collection
from dependencies import get_current_user
from compliance_frameworks import score_all_frameworks

router = APIRouter(prefix="/api/compliance", tags=["Compliance"])


def _assessments():
    return get_collection("assessments")


def _extra_score(assessment: dict) -> list:
    results = list(score_all_frameworks(assessment))
    try:
        from extra_frameworks import score_extra_framework, EXTRA_FRAMEWORK_META
        for key in EXTRA_FRAMEWORK_META.keys():
            r = score_extra_framework(key, assessment)
            if r and isinstance(r, dict):
                results.append(r)
    except Exception as e:
        print(f"extra_frameworks error: {e}")
    return results


@router.post("/assessments/{assessment_id}")
async def run_compliance_mapping(
    assessment_id: str,
    current_user=Depends(get_current_user),
):
    a = await _assessments().find_one(
        {"$or": [{"_id": assessment_id}, {"id": assessment_id}],
         "tenant_id": current_user.tenant_id}
    )
    if not a:
        raise HTTPException(status_code=404, detail="Not found")
    return _extra_score(a)


@router.get("/assessments/{assessment_id}")
async def get_compliance_results(
    assessment_id: str,
    current_user=Depends(get_current_user),
):
    a = await _assessments().find_one(
        {"$or": [{"_id": assessment_id}, {"id": assessment_id}],
         "tenant_id": current_user.tenant_id}
    )
    if not a:
        raise HTTPException(status_code=404, detail="Not found")
    return _extra_score(a)


@router.get("/summary")
async def get_compliance_summary(current_user=Depends(get_current_user)):
    docs = await _assessments().find(
        {"tenant_id": current_user.tenant_id}
    ).sort("created_at", -1).limit(10).to_list(10)

    out = []
    for a in docs:
        for r in _extra_score(a):
            out.append({
                "assessment_id": str(a.get("_id", a.get("id", ""))),
                "org_name":      a.get("org_name", ""),
                "framework":     r.get("framework") or r.get("key"),
                "score":         r.get("score", 0),
                "created_at":    str(a.get("created_at", "")),
            })
    return out
