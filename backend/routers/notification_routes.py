from fastapi import APIRouter, Depends, Query
from datetime import datetime, timedelta
from typing import Optional

from database import col, ist_now, gen_uuid
from dependencies import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

def _notifs(): return col("notifications")

now = datetime.utcnow()
DEMO_NOTIFICATIONS = [
    {"title":"Evidence Expiring Soon","message":"3 evidence items will expire within 30 days.","type":"WARNING","category":"Evidence","action_url":"/evidence","action_label":"View Evidence","is_read":False,"created_at":(now-timedelta(minutes=15)).isoformat()},
    {"title":"Critical Vendor Risk Detected","message":"PaymentGateway Pro has a risk score of 82 (Critical).","type":"ALERT","category":"Vendor","action_url":"/vendors","action_label":"View Vendor","is_read":False,"created_at":(now-timedelta(hours=1)).isoformat()},
    {"title":"Policy Review Overdue","message":"Vendor Management Policy review date has passed.","type":"ALERT","category":"Policy","action_url":"/policies","action_label":"View Policy","is_read":False,"created_at":(now-timedelta(hours=3)).isoformat()},
    {"title":"Questionnaire Overdue","message":"Zendesk security questionnaire is 5 days overdue.","type":"WARNING","category":"Vendor","action_url":"/vendors","action_label":"View Vendor","is_read":True,"created_at":(now-timedelta(hours=6)).isoformat()},
    {"title":"Risk Scan Completed","message":"Full platform risk scan completed. 12 findings identified.","type":"INFO","category":"Risk","action_url":"/risk","action_label":"View Results","is_read":True,"created_at":(now-timedelta(hours=12)).isoformat()},
    {"title":"New Team Member Joined","message":"Sneha Patel accepted the invitation and joined as Auditor.","type":"SUCCESS","category":"System","action_url":"/users","action_label":"View Team","is_read":True,"created_at":(now-timedelta(days=1)).isoformat()},
    {"title":"SOC2 Control Deadline","message":"CC6.1 Logical Access control implementation is due in 7 days.","type":"WARNING","category":"Compliance","action_url":"/compliance","action_label":"View Control","is_read":False,"created_at":(now-timedelta(days=1,hours=2)).isoformat()},
    {"title":"MFA Not Enabled","message":"3 team members have not enabled MFA.","type":"ALERT","category":"System","action_url":"/users","action_label":"View Team","is_read":False,"created_at":(now-timedelta(days=2,hours=5)).isoformat()},
]

DEMO_RULES = [
    {"id":"1","name":"Evidence Expiring","trigger":"evidence_expiring","channels":["in_app","email"],"threshold":30,"enabled":True},
    {"id":"2","name":"Control Overdue","trigger":"control_overdue","channels":["in_app","email","slack"],"threshold":7,"enabled":True},
    {"id":"3","name":"Vendor Questionnaire Overdue","trigger":"vendor_questionnaire_overdue","channels":["in_app","email"],"threshold":0,"enabled":True},
    {"id":"4","name":"High Risk Vendor Added","trigger":"vendor_high_risk","channels":["in_app","slack"],"threshold":None,"enabled":True},
    {"id":"5","name":"Policy Review Due","trigger":"policy_review_due","channels":["in_app","email"],"threshold":14,"enabled":True},
    {"id":"6","name":"MFA Not Enabled","trigger":"mfa_not_enabled","channels":["in_app"],"threshold":None,"enabled":False},
    {"id":"7","name":"Integration Disconnected","trigger":"integration_disconnected","channels":["in_app","slack"],"threshold":None,"enabled":True},
    {"id":"8","name":"Weekly Compliance Report","trigger":"weekly_report","channels":["email"],"threshold":None,"enabled":True},
]

def _clean(doc):
    doc = dict(doc)
    doc["id"] = str(doc.get("_id", doc.get("id", "")))
    doc.pop("_id", None)
    if isinstance(doc.get("created_at"), datetime):
        doc["created_at"] = doc["created_at"].isoformat()
    return doc

@router.get("")
async def get_notifications(tenant_id:str=Query(...),is_read:Optional[bool]=Query(None),category:Optional[str]=Query(None),_=Depends(get_current_user)):
    filt = {"tenant_id": tenant_id}
    if is_read is not None: filt["is_read"] = is_read
    if category: filt["category"] = category
    docs = await _notifs().find(filt).sort("created_at",-1).to_list(200)
    if not docs:
        filtered = DEMO_NOTIFICATIONS[:]
        if is_read is not None: filtered = [n for n in filtered if n["is_read"]==is_read]
        if category: filtered = [n for n in filtered if n["category"]==category]
        result = [{**n,"id":str(i+1),"is_archived":False} for i,n in enumerate(filtered)]
        return {"notifications":result,"unread":sum(1 for n in result if not n["is_read"])}
    return {"notifications":[_clean(d) for d in docs],"unread":sum(1 for d in docs if not d.get("is_read",False))}

@router.patch("/{notif_id}/read")
async def mark_read(notif_id:str,_=Depends(get_current_user)):
    await _notifs().update_one({"$or":[{"_id":notif_id},{"id":notif_id}]},{"$set":{"is_read":True}})
    return {"message":"Marked as read"}

@router.patch("/read-all")
async def mark_all_read(tenant_id:str=Query(...),_=Depends(get_current_user)):
    await _notifs().update_many({"tenant_id":tenant_id},{"$set":{"is_read":True}})
    return {"message":"All marked as read"}

@router.get("/rules")
async def get_rules(tenant_id:str=Query(...),_=Depends(get_current_user)):
    return {"rules":DEMO_RULES}

@router.patch("/rules/{rule_id}")
async def update_rule(rule_id:str,body:dict,tenant_id:str=Query(...),_=Depends(get_current_user)):
    for r in DEMO_RULES:
        if r["id"]==rule_id:
            if "enabled" in body: r["enabled"]=body["enabled"]
    return {"message":"Rule updated"}
