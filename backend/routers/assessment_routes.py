"""
assessment_routes.py — MongoDB edition
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional

from database import col, ist_now, gen_uuid
from dependencies import get_current_user

router = APIRouter(prefix="/api", tags=["Assessment"])

def _assessments(): return col("assessments")

class AssessmentCreate(BaseModel):
    org_name: str
    industry: str = "Technology"
    employees: int = 100
    has_mfa: bool = False
    mfa_coverage: int = 0
    patch_days: int = 30
    training_percent: int = 0
    has_irp: bool = False
    vulnerabilities: int = 0
    vuln_critical: int = 0
    vuln_high: int = 0
    vuln_medium: int = 0
    vuln_low: int = 0

def _compute_risk(a: dict) -> tuple:
    score = 50
    mfa_cov = a.get("mfa_coverage", 0)
    if not a.get("has_mfa"): score += 15
    elif mfa_cov < 50: score += 10
    elif mfa_cov >= 90: score -= 5
    patch_days = a.get("patch_days", 30)
    if patch_days > 60: score += 15
    elif patch_days > 30: score += 8
    score += min(a.get("vuln_critical", 0) * 5, 20)
    score += min(a.get("vuln_high", 0) * 2, 10)
    if not a.get("has_irp"): score += 10
    if a.get("training_percent", 0) < 50: score += 8
    score = max(0, min(100, score))
    if score >= 75: level = "CRITICAL"
    elif score >= 50: level = "HIGH"
    elif score >= 25: level = "MEDIUM"
    else: level = "LOW"
    return round(score, 1), level

def _clean(doc):
    doc = dict(doc)
    doc["id"] = str(doc.get("_id", doc.get("id","")))
    doc.pop("_id", None)
    for f in ["created_at","updated_at"]:
        if isinstance(doc.get(f), datetime):
            doc[f] = doc[f].isoformat()
    return doc

@router.post("/assess")
async def create_assessment(body: AssessmentCreate, current_user=Depends(get_current_user)):
    data = body.dict()
    risk_score, risk_level = _compute_risk(data)
    uid = gen_uuid()
    doc = {"_id":uid,"id":uid,"tenant_id":current_user.tenant_id,"created_by":current_user.id,"risk_score":risk_score,"risk_level":risk_level,"financial_exposure":float(data.get("employees",100)*9200),"created_at":ist_now(),"updated_at":ist_now(),**data}
    await _assessments().insert_one(doc)
    return {"id":uid,"risk_score":risk_score,"risk_level":risk_level,"financial_exposure":doc["financial_exposure"]}

@router.get("/assessments")
async def list_assessments(current_user=Depends(get_current_user)):
    docs = await _assessments().find({"tenant_id":current_user.tenant_id}).sort("created_at",-1).limit(20).to_list(20)
    return [_clean(d) for d in docs]

@router.get("/assessments/{assessment_id}")
async def get_assessment(assessment_id:str, current_user=Depends(get_current_user)):
    doc = await _assessments().find_one(
        {"$or":[{"_id":assessment_id},{"id":assessment_id}],"tenant_id":current_user.tenant_id}
    )
    if not doc:
        raise HTTPException(404,"Assessment not found")
    return _clean(doc)

@router.delete("/assessments/{assessment_id}")
async def delete_assessment(assessment_id:str, current_user=Depends(get_current_user)):
    result = await _assessments().delete_one(
        {"$or":[{"_id":assessment_id},{"id":assessment_id}],"tenant_id":current_user.tenant_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(404,"Not found")
    return {"message":"Deleted"}
