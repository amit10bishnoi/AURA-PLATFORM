"""
unified_compliance_routes.py — MongoDB edition
"""
from fastapi import APIRouter, Depends, HTTPException
from database import col
from dependencies import get_current_user
from compliance_frameworks import score_all_frameworks, build_assessment_dict

router = APIRouter(prefix="/api/compliance", tags=["Compliance"])

def _assessments(): return col("assessments")

async def get_all_8(assessment: dict):
    assessment_dict = build_assessment_dict(assessment)
    results = list(score_all_frameworks(assessment_dict))
    try:
        from extra_frameworks import score_extra_framework, EXTRA_FRAMEWORK_META
        for key in EXTRA_FRAMEWORK_META.keys():
            r = score_extra_framework(key, assessment)
            if r and isinstance(r, dict) and r.get("score") is not None:
                results.append(r)
    except Exception as e:
        print(f"extra error: {e}")
    return results


@router.post("/assessments/{assessment_id}")
async def run_compliance_mapping(assessment_id: str, current_user=Depends(get_current_user)):
    a = await _assessments().find_one(
        {"$or":[{"_id":assessment_id},{"id":assessment_id}],"tenant_id":current_user.tenant_id}
    )
    if not a:
        raise HTTPException(status_code=404, detail="Not found")
    return await get_all_8(a)


@router.get("/assessments/{assessment_id}")
async def get_compliance_results(assessment_id: str, current_user=Depends(get_current_user)):
    a = await _assessments().find_one(
        {"$or":[{"_id":assessment_id},{"id":assessment_id}],"tenant_id":current_user.tenant_id}
    )
    if not a:
        raise HTTPException(status_code=404, detail="Not found")
    return await get_all_8(a)


@router.get("/summary")
async def get_compliance_summary(current_user=Depends(get_current_user)):
    assessments = await _assessments().find(
        {"tenant_id":current_user.tenant_id}
    ).sort("created_at",-1).limit(10).to_list(10)
    out = []
    for a in assessments:
        for r in await get_all_8(a):
            out.append({"assessment_id":str(a.get("_id",a.get("id",""))), "org_name":a.get("org_name",""), "framework":r.get("framework") or r.get("key"), "score":r.get("score",0), "created_at":str(a.get("created_at",""))})
    return out
