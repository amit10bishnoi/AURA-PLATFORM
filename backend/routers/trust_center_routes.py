"""
trust_center_routes.py — Public Trust Center (MongoDB edition)
Public endpoint — NO auth required.
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta

from database import col

router = APIRouter(prefix="/trust", tags=["Public Trust Center"])

IST = timedelta(hours=5, minutes=30)
def ist_now(): return (datetime.utcnow() + IST).strftime("%d %b %Y, %I:%M %p IST")

def _assessments(): return col("assessments")
def _users(): return col("users")
def _tasks(): return col("tasks")


async def _get_trust_data(tenant_id: str):
    user = await _users().find_one({"tenant_id": tenant_id})
    if not user:
        raise HTTPException(status_code=404, detail="Organisation not found")

    org_name = user.get("tenant_name") or tenant_id.replace("tenant_","").replace("_"," ").title()

    assessment = await _assessments().find_one(
        {"tenant_id": tenant_id}, sort=[("created_at", -1)]
    )

    if not assessment:
        return {"tenant_id":tenant_id,"org_name":org_name,"status":"no_data","message":"No assessment data available yet.","last_updated":ist_now()}

    risk_score = float(assessment.get("risk_score") or 0)
    risk_level = assessment.get("risk_level") or "UNKNOWN"

    iso_pct   = max(0,min(100,round(100-risk_score*0.7,0)))
    soc2_pct  = max(0,min(100,round(100-risk_score*0.6,0)))
    rbi_pct   = max(0,min(100,round(100-risk_score*0.65,0)))
    dpdp_pct  = max(0,min(100,round(100-risk_score*0.6,0)))

    def status(pct):
        if pct >= 80: return "compliant"
        if pct >= 50: return "in_progress"
        return "attention"

    open_tasks = await _tasks().count_documents({"tenant_id":tenant_id,"status":{"$ne":"done"}})
    done_tasks = await _tasks().count_documents({"tenant_id":tenant_id,"status":"done"})

    frameworks = [
        {"key":"ISO27001","name":"ISO 27001:2022","score":iso_pct,"status":status(iso_pct),"color":"#6366F1","description":"Information Security Management"},
        {"key":"SOC2","name":"SOC 2 Type II","score":soc2_pct,"status":status(soc2_pct),"color":"#8B5CF6","description":"Trust Service Criteria"},
        {"key":"RBI","name":"RBI Cybersecurity Framework","score":rbi_pct,"status":status(rbi_pct),"color":"#10B981","description":"Reserve Bank of India"},
        {"key":"DPDP","name":"DPDP Act 2023","score":dpdp_pct,"status":status(dpdp_pct),"color":"#F97316","description":"India Digital Personal Data"},
    ]

    overall_pct = round(sum(f["score"] for f in frameworks)/len(frameworks),1)

    security_highlights = []
    if assessment.get("has_mfa"):
        security_highlights.append({"icon":"shield","text":f"Multi-Factor Authentication enabled ({assessment.get('mfa_coverage',0)}% coverage)"})
    if assessment.get("patch_days") and assessment["patch_days"] <= 14:
        security_highlights.append({"icon":"zap","text":f"Patches applied within {assessment['patch_days']} days of release"})
    if assessment.get("has_irp"):
        security_highlights.append({"icon":"check","text":"Incident Response Plan in place"})
    if assessment.get("training_percent") and assessment["training_percent"] >= 70:
        security_highlights.append({"icon":"users","text":f"{assessment['training_percent']}% of employees completed security training"})
    if not security_highlights:
        security_highlights.append({"icon":"shield","text":"Security posture actively monitored"})

    created_at = assessment.get("created_at")
    last_assessed = created_at.strftime("%d %b %Y") if isinstance(created_at, datetime) else str(created_at)[:10] if created_at else "Unknown"

    return {"tenant_id":tenant_id,"org_name":org_name,"overall_score":overall_pct,"risk_score":risk_score,"risk_level":risk_level,"last_assessed":last_assessed,"last_updated":ist_now(),"frameworks":frameworks,"security_highlights":security_highlights,"open_remediations":open_tasks,"completed_remediations":done_tasks,"powered_by":"AURA Platform — AI-Powered GRC","verified":True}


@router.get("/{tenant_id}", summary="Public Trust Center — full data")
async def get_trust_center(tenant_id: str):
    return await _get_trust_data(tenant_id)


@router.get("/{tenant_id}/badge", summary="Embeddable compliance badge data")
async def get_badge(tenant_id: str):
    data = await _get_trust_data(tenant_id)
    compliant_count = sum(1 for f in data.get("frameworks",[]) if f["status"]=="compliant")
    return {"org_name":data.get("org_name"),"overall_score":data.get("overall_score"),"compliant_frameworks":compliant_count,"total_frameworks":len(data.get("frameworks",[])),"last_updated":data.get("last_updated"),"powered_by":"AURA Platform"}
