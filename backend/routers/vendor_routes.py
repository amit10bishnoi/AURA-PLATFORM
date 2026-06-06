from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime, timedelta
from typing import Optional
import json, random

from database import col, ist_now, gen_uuid
from dependencies import get_current_user

router = APIRouter(prefix="/api/vendors", tags=["vendors"])

def _vendors(): return col("vendors")

DEMO_VENDORS = [
    {"name":"Okta","category":"SaaS","website":"okta.com","contact_email":"security@okta.com","risk_score":22,"risk_level":"LOW","status":"ACTIVE","data_access":["Identity","Authentication"],"frameworks":["SOC2","ISO27001"],"questionnaire_status":"COMPLETED","notes":"Identity provider. SOC2 Type II certified."},
    {"name":"Zendesk","category":"SaaS","website":"zendesk.com","contact_email":"security@zendesk.com","risk_score":42,"risk_level":"MEDIUM","status":"UNDER_REVIEW","data_access":["Customer PII","Support Tickets","Email"],"frameworks":["SOC2"],"questionnaire_status":"OVERDUE","notes":"Support platform. Questionnaire overdue."},
    {"name":"DataAnalytics Co","category":"Professional Services","website":"dataanalytics.co","contact_email":"info@dataanalytics.co","risk_score":68,"risk_level":"HIGH","status":"UNDER_REVIEW","data_access":["Financial Data","Customer PII","Analytics"],"frameworks":[],"questionnaire_status":"SENT","notes":"High data access — needs review."},
    {"name":"CloudBackup Ltd","category":"Infrastructure","website":"cloudbackup.io","contact_email":"security@cloudbackup.io","risk_score":55,"risk_level":"HIGH","status":"ACTIVE","data_access":["All Data","Backups","Encryption Keys"],"frameworks":["ISO27001"],"questionnaire_status":"COMPLETED","notes":"Backup provider with broad data access."},
    {"name":"Slack","category":"SaaS","website":"slack.com","contact_email":"security@slack.com","risk_score":28,"risk_level":"LOW","status":"ACTIVE","data_access":["Internal Communications","Files"],"frameworks":["SOC2","ISO27001"],"questionnaire_status":"COMPLETED","notes":"Internal comms tool. DPA in place."},
    {"name":"PenTest Partners","category":"Professional Services","website":"pentestpartners.com","contact_email":"hello@pentestpartners.com","risk_score":30,"risk_level":"MEDIUM","status":"ACTIVE","data_access":["System Access","Vulnerability Data"],"frameworks":["ISO27001"],"questionnaire_status":"NOT_SENT","notes":"Annual pentest vendor. NDA signed."},
]

def _fmt(v, i=0):
    now = datetime.utcnow()
    return {"id":str(i+1),"name":v["name"],"category":v["category"],"website":v.get("website"),"contact_email":v.get("contact_email"),"risk_score":v["risk_score"],"risk_level":v["risk_level"],"status":v["status"],"data_access":v.get("data_access",[]),"frameworks":v.get("frameworks",[]),"questionnaire_status":v["questionnaire_status"],"questionnaire_sent":(now-timedelta(days=30)).isoformat() if v["questionnaire_status"]!="NOT_SENT" else None,"questionnaire_due":(now-timedelta(days=5)).isoformat() if v["questionnaire_status"]=="OVERDUE" else (now+timedelta(days=25)).isoformat() if v["questionnaire_status"]=="SENT" else None,"last_reviewed":(now-timedelta(days=i*20+30)).isoformat(),"next_review":(now+timedelta(days=365-i*20)).isoformat(),"notes":v.get("notes",""),"created_at":(now-timedelta(days=i*30+60)).isoformat(),"updated_at":(now-timedelta(days=i*3+1)).isoformat()}

def _clean(doc):
    doc = dict(doc)
    doc["id"] = str(doc.get("_id", doc.get("id", "")))
    doc.pop("_id", None)
    for f in ["created_at","updated_at","last_reviewed","next_review","questionnaire_sent","questionnaire_due"]:
        if isinstance(doc.get(f), datetime):
            doc[f] = doc[f].isoformat()
    return doc

@router.get("")
async def get_vendors(tenant_id:str=Query(...),risk_level:Optional[str]=Query(None),status:Optional[str]=Query(None),search:Optional[str]=Query(None),_=Depends(get_current_user)):
    filt = {"tenant_id": tenant_id}
    if risk_level: filt["risk_level"] = risk_level
    if status: filt["status"] = status
    if search: filt["$or"] = [{"name":{"$regex":search,"$options":"i"}},{"category":{"$regex":search,"$options":"i"}}]
    docs = await _vendors().find(filt).to_list(500)
    if not docs:
        filtered = DEMO_VENDORS[:]
        if risk_level: filtered = [v for v in filtered if v["risk_level"]==risk_level]
        if status: filtered = [v for v in filtered if v["status"]==status]
        if search:
            s = search.lower()
            filtered = [v for v in filtered if s in v["name"].lower() or s in v["category"].lower()]
        return {"vendors":[_fmt(v,i) for i,v in enumerate(filtered)],"total":len(filtered)}
    return {"vendors":[_clean(d) for d in docs],"total":len(docs)}

@router.post("")
async def create_vendor(body:dict,tenant_id:str=Query(...),_=Depends(get_current_user)):
    uid = gen_uuid()
    doc = {"_id":uid,"id":uid,"tenant_id":tenant_id,"name":body.get("name"),"category":body.get("category","SaaS"),"website":body.get("website"),"contact_email":body.get("contact_email"),"risk_score":body.get("risk_score",0),"risk_level":body.get("risk_level","LOW"),"status":body.get("status","ACTIVE"),"data_access":body.get("data_access",[]),"frameworks":body.get("frameworks",[]),"questionnaire_status":"NOT_SENT","notes":body.get("notes",""),"created_at":ist_now(),"updated_at":ist_now()}
    await _vendors().insert_one(doc)
    return {"message":"Vendor added","id":uid}

@router.patch("/{vendor_id}/questionnaire")
async def send_questionnaire(vendor_id:str,_=Depends(get_current_user)):
    result = await _vendors().update_one(
        {"$or":[{"_id":vendor_id},{"id":vendor_id}]},
        {"$set":{"questionnaire_status":"SENT","questionnaire_sent":ist_now(),"questionnaire_due":datetime.utcnow()+timedelta(days=30),"updated_at":ist_now()}}
    )
    if result.matched_count == 0:
        return {"message":"Demo mode"}
    return {"message":"Questionnaire sent"}

@router.delete("/{vendor_id}")
async def delete_vendor(vendor_id:str,_=Depends(get_current_user)):
    result = await _vendors().delete_one({"$or":[{"_id":vendor_id},{"id":vendor_id}]})
    if result.deleted_count == 0:
        raise HTTPException(404,"Not found")
    return {"message":"Deleted"}
