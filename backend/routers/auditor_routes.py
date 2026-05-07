from fastapi import APIRouter, Query
from datetime import datetime, timedelta
from typing import Optional
import secrets, random

router = APIRouter(prefix="/api/auditor", tags=["auditor"])

DEMO_AUDIT_ROOMS = [
    {"id":"ar_001","name":"SOC2 Type II Audit 2025","framework":"SOC2","auditor_firm":"Deloitte & Touche","auditor_name":"Sarah Johnson","auditor_email":"sjohnson@deloitte.com","status":"IN_PROGRESS","period_start":(datetime.utcnow()-timedelta(days=180)).isoformat(),"period_end":datetime.utcnow().isoformat(),"due_date":(datetime.utcnow()+timedelta(days=30)).isoformat(),"progress":68,"controls_total":89,"controls_reviewed":61,"evidence_requested":24,"evidence_provided":19,"comments":7,"created_at":(datetime.utcnow()-timedelta(days=45)).isoformat()},
    {"id":"ar_002","name":"ISO 27001 Certification Audit","framework":"ISO27001","auditor_firm":"BSI Group","auditor_name":"Michael Chen","auditor_email":"m.chen@bsigroup.com","status":"PENDING","period_start":(datetime.utcnow()-timedelta(days=365)).isoformat(),"period_end":datetime.utcnow().isoformat(),"due_date":(datetime.utcnow()+timedelta(days=60)).isoformat(),"progress":15,"controls_total":114,"controls_reviewed":17,"evidence_requested":8,"evidence_provided":3,"comments":2,"created_at":(datetime.utcnow()-timedelta(days=10)).isoformat()},
]

DEMO_AUDIT_ITEMS = [
    {"id":1,"audit_room_id":"ar_001","control_id":"CC6.1","control_name":"Logical Access Controls","framework":"SOC2","status":"APPROVED","evidence_count":3,"auditor_comment":"Evidence satisfactory. MFA enforcement confirmed.","internal_note":"","priority":"HIGH","reviewed_at":(datetime.utcnow()-timedelta(days=5)).isoformat()},
    {"id":2,"audit_room_id":"ar_001","control_id":"CC6.2","control_name":"New User Provisioning","framework":"SOC2","status":"APPROVED","evidence_count":2,"auditor_comment":"User provisioning process documented and evidenced.","internal_note":"","priority":"MEDIUM","reviewed_at":(datetime.utcnow()-timedelta(days=8)).isoformat()},
    {"id":3,"audit_room_id":"ar_001","control_id":"CC7.1","control_name":"System Monitoring","framework":"SOC2","status":"NEEDS_EVIDENCE","evidence_count":1,"auditor_comment":"Please provide additional monitoring dashboard screenshots for Q3.","internal_note":"Assigned to Riya — due Friday","priority":"HIGH","reviewed_at":None},
    {"id":4,"audit_room_id":"ar_001","control_id":"CC7.2","control_name":"Vulnerability Management","framework":"SOC2","status":"IN_REVIEW","evidence_count":2,"auditor_comment":"Reviewing pentest report. Follow-up questions sent.","internal_note":"","priority":"CRITICAL","reviewed_at":None},
    {"id":5,"audit_room_id":"ar_001","control_id":"CC8.1","control_name":"Change Management","framework":"SOC2","status":"APPROVED","evidence_count":4,"auditor_comment":"Change management process well documented.","internal_note":"","priority":"MEDIUM","reviewed_at":(datetime.utcnow()-timedelta(days=12)).isoformat()},
    {"id":6,"audit_room_id":"ar_001","control_id":"A1.1","control_name":"Availability Commitments","framework":"SOC2","status":"NEEDS_EVIDENCE","evidence_count":0,"auditor_comment":"No uptime evidence provided yet. Please upload SLA reports.","internal_note":"Pull from Datadog","priority":"HIGH","reviewed_at":None},
    {"id":7,"audit_room_id":"ar_001","control_id":"CC9.1","control_name":"Risk Management","framework":"SOC2","status":"IN_REVIEW","evidence_count":1,"auditor_comment":"Risk assessment in progress.","internal_note":"","priority":"MEDIUM","reviewed_at":None},
    {"id":8,"audit_room_id":"ar_001","control_id":"CC6.7","control_name":"Data Transmission Encryption","framework":"SOC2","status":"APPROVED","evidence_count":2,"auditor_comment":"TLS 1.3 confirmed on all endpoints.","internal_note":"","priority":"HIGH","reviewed_at":(datetime.utcnow()-timedelta(days=3)).isoformat()},
]

DEMO_COMMENTS = [
    {"id":1,"audit_room_id":"ar_001","control_id":"CC7.1","author":"Sarah Johnson","author_type":"auditor","message":"Could you provide the CloudWatch dashboard screenshots for July-September?","created_at":(datetime.utcnow()-timedelta(days=3)).isoformat(),"resolved":False},
    {"id":2,"audit_room_id":"ar_001","control_id":"CC7.1","author":"Amit Shah","author_type":"internal","message":"Working on it — will upload by EOD Thursday.","created_at":(datetime.utcnow()-timedelta(days=2)).isoformat(),"resolved":False},
    {"id":3,"audit_room_id":"ar_001","control_id":"CC7.2","author":"Sarah Johnson","author_type":"auditor","message":"The pentest report covers scope — but I need the remediation tracking for the 3 high findings.","created_at":(datetime.utcnow()-timedelta(days=1)).isoformat(),"resolved":False},
]

@router.get("/rooms")
def get_audit_rooms(tenant_id:str=Query(...)):
    return {"rooms":DEMO_AUDIT_ROOMS,"total":len(DEMO_AUDIT_ROOMS)}

@router.post("/rooms")
def create_audit_room(body:dict,tenant_id:str=Query(...)):
    room={"id":f"ar_{secrets.token_hex(4)}","name":body.get("name"),"framework":body.get("framework","SOC2"),"auditor_firm":body.get("auditor_firm"),"auditor_name":body.get("auditor_name"),"auditor_email":body.get("auditor_email"),"status":"PENDING","period_start":body.get("period_start",(datetime.utcnow()-timedelta(days=365)).isoformat()),"period_end":body.get("period_end",datetime.utcnow().isoformat()),"due_date":body.get("due_date"),"progress":0,"controls_total":89,"controls_reviewed":0,"evidence_requested":0,"evidence_provided":0,"comments":0,"created_at":datetime.utcnow().isoformat()}
    DEMO_AUDIT_ROOMS.append(room)
    return {"message":"Audit room created","room":room,"portal_link":f"https://app.aura.io/auditor/{room['id']}?token={secrets.token_urlsafe(32)}"}

@router.get("/rooms/{room_id}/items")
def get_audit_items(room_id:str,status:Optional[str]=Query(None)):
    items=[i for i in DEMO_AUDIT_ITEMS if i["audit_room_id"]==room_id]
    if status: items=[i for i in items if i["status"]==status]
    return {"items":items,"total":len(items)}

@router.patch("/rooms/{room_id}/items/{item_id}")
def update_audit_item(room_id:str,item_id:int,body:dict):
    for item in DEMO_AUDIT_ITEMS:
        if item["id"]==item_id and item["audit_room_id"]==room_id:
            if "internal_note" in body: item["internal_note"]=body["internal_note"]
            if "status" in body: item["status"]=body["status"]
    return {"message":"Updated"}

@router.get("/rooms/{room_id}/comments")
def get_comments(room_id:str,control_id:Optional[str]=Query(None)):
    comments=[c for c in DEMO_COMMENTS if c["audit_room_id"]==room_id]
    if control_id: comments=[c for c in comments if c["control_id"]==control_id]
    return {"comments":comments}

@router.post("/rooms/{room_id}/comments")
def add_comment(room_id:str,body:dict):
    comment={"id":len(DEMO_COMMENTS)+1,"audit_room_id":room_id,"control_id":body.get("control_id"),"author":body.get("author","Current User"),"author_type":body.get("author_type","internal"),"message":body.get("message"),"created_at":datetime.utcnow().isoformat(),"resolved":False}
    DEMO_COMMENTS.append(comment)
    return {"message":"Comment added","comment":comment}

@router.get("/rooms/{room_id}/stats")
def get_room_stats(room_id:str):
    items=[i for i in DEMO_AUDIT_ITEMS if i["audit_room_id"]==room_id]
    return {"total":len(items),"approved":len([i for i in items if i["status"]=="APPROVED"]),"in_review":len([i for i in items if i["status"]=="IN_REVIEW"]),"needs_evidence":len([i for i in items if i["status"]=="NEEDS_EVIDENCE"]),"not_started":len([i for i in items if i["status"]=="NOT_STARTED"])}
