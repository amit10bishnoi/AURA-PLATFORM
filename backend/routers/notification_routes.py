from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timedelta
from typing import Optional
import json

router = APIRouter(prefix="/api/notifications", tags=["notifications"])
Base = declarative_base()

def get_db():
    from database import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

now = datetime.utcnow()
DEMO_NOTIFICATIONS = [
    {"title":"Evidence Expiring Soon","message":"3 evidence items will expire within 30 days. Review and renew before they lapse.","type":"WARNING","category":"Evidence","action_url":"/evidence","action_label":"View Evidence","is_read":False,"created_at":(now-timedelta(minutes=15)).isoformat()},
    {"title":"Critical Vendor Risk Detected","message":"PaymentGateway Pro has a risk score of 82 (Critical). PCI compliance evidence not received.","type":"ALERT","category":"Vendor","action_url":"/vendors","action_label":"View Vendor","is_read":False,"created_at":(now-timedelta(hours=1)).isoformat()},
    {"title":"Policy Review Overdue","message":"Vendor Management Policy review date has passed. Assign an owner to complete the review.","type":"ALERT","category":"Policy","action_url":"/policies","action_label":"View Policy","is_read":False,"created_at":(now-timedelta(hours=3)).isoformat()},
    {"title":"Questionnaire Overdue","message":"Zendesk security questionnaire is 5 days overdue. Send a follow-up to security@zendesk.com.","type":"WARNING","category":"Vendor","action_url":"/vendors","action_label":"View Vendor","is_read":True,"created_at":(now-timedelta(hours=6)).isoformat()},
    {"title":"Risk Scan Completed","message":"Full platform risk scan completed. 12 findings identified, 2 critical issues require immediate attention.","type":"INFO","category":"Risk","action_url":"/risk","action_label":"View Results","is_read":True,"created_at":(now-timedelta(hours=12)).isoformat()},
    {"title":"New Team Member Joined","message":"Sneha Patel accepted the invitation and joined as Auditor.","type":"SUCCESS","category":"System","action_url":"/users","action_label":"View Team","is_read":True,"created_at":(now-timedelta(days=1)).isoformat()},
    {"title":"SOC2 Control Deadline","message":"CC6.1 Logical Access control implementation is due in 7 days. Current status: In Progress.","type":"WARNING","category":"Compliance","action_url":"/compliance","action_label":"View Control","is_read":False,"created_at":(now-timedelta(days=1,hours=2)).isoformat()},
    {"title":"MFA Not Enabled","message":"3 team members have not enabled MFA. This is a SOC2 CC6.1 requirement.","type":"ALERT","category":"System","action_url":"/users","action_label":"View Team","is_read":False,"created_at":(now-timedelta(days=2,hours=5)).isoformat()},
    {"title":"Integration Disconnected","message":"GitHub integration disconnected. Evidence auto-collection for code security controls is paused.","type":"ALERT","category":"System","action_url":"/integrations","action_label":"Reconnect","is_read":True,"created_at":(now-timedelta(days=3)).isoformat()},
    {"title":"New Evidence Uploaded","message":"Priya Nair uploaded Penetration Test Report 2025 linked to SOC2 CC7.1.","type":"SUCCESS","category":"Evidence","action_url":"/evidence","action_label":"View Evidence","is_read":True,"created_at":(now-timedelta(days=3,hours=2)).isoformat()},
    {"title":"Compliance Score Improved","message":"Your SOC2 compliance score improved from 67% to 74% this week. Keep it up!","type":"SUCCESS","category":"Compliance","action_url":"/compliance","action_label":"View Dashboard","is_read":True,"created_at":(now-timedelta(days=4)).isoformat()},
]

DEMO_RULES = [
    {"id":1,"name":"Evidence Expiring","trigger":"evidence_expiring","channels":["in_app","email"],"threshold":30,"enabled":True},
    {"id":2,"name":"Control Overdue","trigger":"control_overdue","channels":["in_app","email","slack"],"threshold":7,"enabled":True},
    {"id":3,"name":"Vendor Questionnaire Overdue","trigger":"vendor_questionnaire_overdue","channels":["in_app","email"],"threshold":0,"enabled":True},
    {"id":4,"name":"High Risk Vendor Added","trigger":"vendor_high_risk","channels":["in_app","slack"],"threshold":None,"enabled":True},
    {"id":5,"name":"Policy Review Due","trigger":"policy_review_due","channels":["in_app","email"],"threshold":14,"enabled":True},
    {"id":6,"name":"MFA Not Enabled","trigger":"mfa_not_enabled","channels":["in_app"],"threshold":None,"enabled":False},
    {"id":7,"name":"Integration Disconnected","trigger":"integration_disconnected","channels":["in_app","slack"],"threshold":None,"enabled":True},
    {"id":8,"name":"Weekly Compliance Report","trigger":"weekly_report","channels":["email"],"threshold":None,"enabled":True},
]

@router.get("")
def get_notifications(tenant_id:str=Query(...),is_read:Optional[bool]=Query(None),category:Optional[str]=Query(None),db:Session=Depends(get_db)):
    try:
        raise Exception("use demo")
    except Exception:
        filtered=DEMO_NOTIFICATIONS[:]
        if is_read is not None: filtered=[n for n in filtered if n["is_read"]==is_read]
        if category: filtered=[n for n in filtered if n["category"]==category]
        result=[{**n,"id":i+1,"is_archived":False} for i,n in enumerate(filtered)]
        return {"notifications":result,"unread":sum(1 for n in result if not n["is_read"])}

@router.patch("/{notif_id}/read")
def mark_read(notif_id:int,db:Session=Depends(get_db)):
    return {"message":"Marked as read"}

@router.patch("/read-all")
def mark_all_read(tenant_id:str=Query(...),db:Session=Depends(get_db)):
    return {"message":"All marked as read"}

@router.get("/rules")
def get_rules(tenant_id:str=Query(...),db:Session=Depends(get_db)):
    return {"rules":DEMO_RULES}

@router.patch("/rules/{rule_id}")
def update_rule(rule_id:int,body:dict,tenant_id:str=Query(...),db:Session=Depends(get_db)):
    for r in DEMO_RULES:
        if r["id"]==rule_id:
            if "enabled" in body: r["enabled"]=body["enabled"]
    return {"message":"Rule updated"}
