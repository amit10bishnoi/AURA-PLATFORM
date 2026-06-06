"""
extra_compliance_routes.py — MongoDB edition
Assessment lookups use Motor; scoring logic (extra_frameworks) unchanged.
"""
from fastapi import APIRouter, Depends, HTTPException

from database import get_collection
from dependencies import get_current_user
from extra_frameworks import score_extra_framework, EXTRA_FRAMEWORK_META

extra_router = APIRouter(prefix="/api/extra-compliance", tags=["extra-compliance"])


def _assessments():
    return get_collection("assessments")


@extra_router.get("/frameworks", summary="List all 5 extra compliance frameworks")
def list_extra_frameworks(_=Depends(get_current_user)):
    return [
        {
            "key":       k,
            "label":     v["label"],
            "full_name": v["full_name"],
            "region":    v["region"],
            "for":       v["for"],
            "color":     v["color"],
            "controls":  len(v["controls"]),
        }
        for k, v in EXTRA_FRAMEWORK_META.items()
    ]


@extra_router.post(
    "/assessments/{assessment_id}",
    summary="Score assessment against all 5 extra frameworks",
)
async def score_all_extra(
    assessment_id: str,
    current_user=Depends(get_current_user),
):
    assessment = await _assessments().find_one(
        {"$or": [{"_id": assessment_id}, {"id": assessment_id}],
         "tenant_id": current_user.tenant_id}
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    results = []
    for framework_key in EXTRA_FRAMEWORK_META.keys():
        result = score_extra_framework(framework_key, assessment)
        results.append(result)

    return {
        "assessment_id":    assessment_id,
        "org_name":         assessment.get("org_name", ""),
        "frameworks":       results,
        "total_frameworks": len(results),
    }


@extra_router.get("/assessments/{assessment_id}/{framework}")
async def score_one_framework(
    assessment_id: str,
    framework:     str,
    current_user=Depends(get_current_user),
):
    assessment = await _assessments().find_one(
        {"$or": [{"_id": assessment_id}, {"id": assessment_id}],
         "tenant_id": current_user.tenant_id}
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
