from fastapi import APIRouter, Query
from datetime import datetime, timedelta
import secrets, random

access_router = APIRouter(prefix="/api/access-reviews", tags=["access-reviews"])
comments_router = APIRouter(prefix="/api/comments", tags=["comments"])
history_router = APIRouter(prefix="/api/history", tags=["history"])
framework_router = APIRouter(prefix="/api/custom-frameworks", tags=["custom-frameworks"])
onboarding_router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])
webhooks_router = APIRouter(prefix="/api/webhooks-config", tags=["webhooks"])

DEMO_REVIEWS = [
    {"id":1,"title":"Q2 2025 User Access Review","status":"IN_PROGRESS","due_date":(datetime.utcnow()+timedelta(days=14)).isoformat(),"total_items":47,"approved":28,"revoked":3,"pending":16,"created_by":"Amit Shah","framework":"SOC2","control":"CC6.3","created_at":(datetime.utcnow()-timedelta(days=5)).isoformat()},
    {"id":2,"title":"Admin Access Quarterly Review","status":"COMPLETED","due_date":(datetime.utcnow()-timedelta(days=10)).isoformat(),"total_items":8,"approved":6,"revoked":2,"pending":0,"created_by":"Priya Nair","framework":"SOC2","control":"CC6.3","created_at":(datetime.utcnow()-timedelta(days=30)).isoformat()},
    {"id":3,"title":"Annual Privileged Access Review","status":"PENDING","due_date":(datetime.utcnow()+timedelta(days=45)).isoformat(),"total_items":156,"approved":0,"revoked":0,"pending":156,"created_by":"Amit Shah","framework":"ISO27001","control":"A.9.2.5","created_at":(datetime.utcnow()-timedelta(days=1)).isoformat()},
]
DEMO_REVIEW_ITEMS = [
    {"id":1,"review_id":1,"user":"Riya Mehta","email":"riya@acme.com","role":"Developer","resource":"AWS Production","access_level":"ReadWrite","last_used":(datetime.utcnow()-timedelta(days=2)).isoformat(),"risk":"LOW","status":"APPROVED","reviewer":"Amit Shah"},
    {"id":2,"review_id":1,"user":"Vikram Rao","email":"vikram@acme.com","role":"Viewer","resource":"GitHub Org","access_level":"Read","last_used":(datetime.utcnow()-timedelta(days=45)).isoformat(),"risk":"MEDIUM","status":"PENDING","reviewer":None},
    {"id":3,"review_id":1,"user":"External Contractor","email":"contractor@ext.com","role":"Contractor","resource":"Jira Projects","access_level":"ReadWrite","last_used":(datetime.utcnow()-timedelta(days=90)).isoformat(),"risk":"HIGH","status":"REVOKED","reviewer":"Priya Nair"},
    {"id":4,"review_id":1,"user":"Sneha Patel","email":"sneha@acme.com","role":"Auditor","resource":"Audit Logs","access_level":"Read","last_used":(datetime.utcnow()-timedelta(days=1)).isoformat(),"risk":"LOW","status":"PENDING","reviewer":None},
]

@access_router.get("")
def get_reviews(tenant_id:str=Query(...)): return {"reviews":DEMO_REVIEWS,"total":len(DEMO_REVIEWS)}

@access_router.post("")
def create_review(body:dict,tenant_id:str=Query(...)):
    r={"id":len(DEMO_REVIEWS)+1,"title":body.get("title"),"status":"PENDING","due_date":body.get("due_date"),"total_items":random.randint(20,100),"approved":0,"revoked":0,"pending":random.randint(20,100),"created_by":"Current User","framework":body.get("framework","SOC2"),"control":"CC6.3","created_at":datetime.utcnow().isoformat()}
    DEMO_REVIEWS.append(r)
    return {"message":"Review created","review":r}

@access_router.get("/{review_id}/items")
def get_items(review_id:int):
    items=[i for i in DEMO_REVIEW_ITEMS if i["review_id"]==review_id]
    return {"items":items,"total":len(items)}

@access_router.patch("/{review_id}/items/{item_id}")
def update_item(review_id:int,item_id:int,body:dict):
    for item in DEMO_REVIEW_ITEMS:
        if item["id"]==item_id: item["status"]=body.get("status",item["status"]);item["reviewer"]=body.get("reviewer","Current User")
    return {"message":"Updated"}

DEMO_COMMENTS = [
    {"id":1,"resource_type":"control","resource_id":"CC6.1","author":"Priya Nair","author_email":"priya@acme.com","content":"MFA evidence uploaded. Waiting for CISO sign-off.","mentions":["amit@acme.com"],"resolved":False,"created_at":(datetime.utcnow()-timedelta(hours=3)).isoformat()},
    {"id":2,"resource_type":"control","resource_id":"CC6.1","author":"Amit Shah","author_email":"amit@acme.com","content":"@priya Approved — evidence looks good.","mentions":["priya@acme.com"],"resolved":True,"created_at":(datetime.utcnow()-timedelta(hours=1)).isoformat()},
]

@comments_router.get("")
def get_comments(resource_type:str=Query(...),resource_id:str=Query(...)):
    return {"comments":[c for c in DEMO_COMMENTS if c["resource_type"]==resource_type and c["resource_id"]==resource_id]}

@comments_router.post("")
def add_comment(body:dict,tenant_id:str=Query(...)):
    import re
    content=body.get("content","")
    mentions=re.findall(r'@(\S+@\S+)',content)
    c={"id":len(DEMO_COMMENTS)+1,"resource_type":body.get("resource_type"),"resource_id":body.get("resource_id"),"author":body.get("author","Current User"),"author_email":body.get("author_email",""),"content":content,"mentions":mentions,"resolved":False,"created_at":datetime.utcnow().isoformat()}
    DEMO_COMMENTS.append(c)
    return {"message":"Comment added","comment":c}

DEMO_HISTORY = [
    {"id":1,"resource_type":"control","resource_id":"CC6.1","field":"status","old_value":"IN_PROGRESS","new_value":"IMPLEMENTED","changed_by":"Amit Shah","reason":"Evidence uploaded","created_at":(datetime.utcnow()-timedelta(hours=1)).isoformat()},
    {"id":2,"resource_type":"policy","resource_id":"1","field":"status","old_value":"DRAFT","new_value":"APPROVED","changed_by":"Priya Nair","reason":"Board approved","created_at":(datetime.utcnow()-timedelta(days=2)).isoformat()},
    {"id":3,"resource_type":"vendor","resource_id":"1","field":"risk_level","old_value":"MEDIUM","new_value":"HIGH","changed_by":"System","reason":"Questionnaire overdue","created_at":(datetime.utcnow()-timedelta(days=3)).isoformat()},
]

@history_router.get("")
def get_history(resource_type:str=Query(None),resource_id:str=Query(None),tenant_id:str=Query(...)):
    h=DEMO_HISTORY[:]
    if resource_type: h=[x for x in h if x["resource_type"]==resource_type]
    if resource_id: h=[x for x in h if x["resource_id"]==resource_id]
    return {"history":h,"total":len(h)}

DEMO_CUSTOM_FRAMEWORKS = [{"id":"cf_001","name":"ACME Internal Security Policy","description":"Custom internal security requirements","controls_count":3,"status":"ACTIVE","created_by":"Amit Shah","created_at":(datetime.utcnow()-timedelta(days=45)).isoformat()}]
DEMO_CUSTOM_CONTROLS = [
    {"id":1,"framework_id":"cf_001","control_id":"ACME-1.1","name":"Password Complexity","category":"Access Control","description":"Passwords must be 14+ characters","status":"IMPLEMENTED"},
    {"id":2,"framework_id":"cf_001","control_id":"ACME-1.2","name":"VPN Enforcement","category":"Network Security","description":"All remote access must use company VPN","status":"IN_PROGRESS"},
]

@framework_router.get("")
def get_frameworks(tenant_id:str=Query(...)): return {"frameworks":DEMO_CUSTOM_FRAMEWORKS}

@framework_router.post("")
def create_framework(body:dict,tenant_id:str=Query(...)):
    fw={"id":f"cf_{secrets.token_hex(4)}","name":body.get("name"),"description":body.get("description",""),"controls_count":0,"status":"DRAFT","created_by":"Current User","created_at":datetime.utcnow().isoformat()}
    DEMO_CUSTOM_FRAMEWORKS.append(fw)
    return {"message":"Framework created","framework":fw}

@framework_router.get("/{fw_id}/controls")
def get_fw_controls(fw_id:str):
    return {"controls":[c for c in DEMO_CUSTOM_CONTROLS if c["framework_id"]==fw_id]}

@framework_router.post("/{fw_id}/controls")
def add_fw_control(fw_id:str,body:dict):
    c={"id":len(DEMO_CUSTOM_CONTROLS)+1,"framework_id":fw_id,"control_id":body.get("control_id",f"CTRL-{len(DEMO_CUSTOM_CONTROLS)+1}"),"name":body.get("name"),"category":body.get("category","General"),"description":body.get("description",""),"status":"NOT_STARTED"}
    DEMO_CUSTOM_CONTROLS.append(c)
    return {"message":"Control added","control":c}

ONBOARDING_STEPS = [
    {"id":1,"key":"profile","title":"Complete your profile","description":"Add your company name, industry, and team size","action":"Go to Settings","tab":"overview","completed":True},
    {"id":2,"key":"framework","title":"Choose your first framework","description":"Select the compliance framework you're working towards","action":"Choose Framework","tab":"compliance","completed":True},
    {"id":3,"key":"integration","title":"Connect an integration","description":"Connect AWS, Okta, or GitHub to start auto-collecting evidence","action":"Connect Integration","tab":"integrations","completed":False},
    {"id":4,"key":"team","title":"Invite your team","description":"Add your security team members and assign roles","action":"Invite Team","tab":"team-mgmt","completed":False},
    {"id":5,"key":"evidence","title":"Upload first evidence","description":"Upload or auto-pull your first piece of compliance evidence","action":"Upload Evidence","tab":"evidence","completed":False},
    {"id":6,"key":"policy","title":"Create a policy","description":"Add your Information Security Policy","action":"Create Policy","tab":"policies","completed":False},
    {"id":7,"key":"audit","title":"Run your first assessment","description":"Get your baseline compliance score","action":"Run Assessment","tab":"risk","completed":False},
]

@onboarding_router.get("")
def get_onboarding(tenant_id:str=Query(...)):
    completed=len([s for s in ONBOARDING_STEPS if s["completed"]])
    return {"steps":ONBOARDING_STEPS,"total":len(ONBOARDING_STEPS),"completed":completed,"progress":int(completed/len(ONBOARDING_STEPS)*100)}

@onboarding_router.patch("/{step_key}")
def complete_step(step_key:str,tenant_id:str=Query(...)):
    for s in ONBOARDING_STEPS:
        if s["key"]==step_key: s["completed"]=True
    return {"message":f"Step {step_key} completed"}

WEBHOOK_EVENTS=["control.updated","evidence.uploaded","risk.detected","compliance.score_changed","vendor.questionnaire_completed","audit.started","policy.approved"]
REGISTERED_WEBHOOKS=[]

@webhooks_router.get("/events")
def get_events(): return {"events":WEBHOOK_EVENTS}

@webhooks_router.get("")
def list_webhooks(tenant_id:str=Query(...)): return {"webhooks":[w for w in REGISTERED_WEBHOOKS if w.get("tenant_id")==tenant_id]}

@webhooks_router.post("")
def register_webhook(body:dict,tenant_id:str=Query(...)):
    wh={"id":f"wh_{secrets.token_hex(8)}","tenant_id":tenant_id,"url":body.get("url"),"events":body.get("events",["*"]),"secret":secrets.token_urlsafe(32),"status":"active","created_at":datetime.utcnow().isoformat()}
    REGISTERED_WEBHOOKS.append(wh)
    return {"message":"Webhook registered","webhook":wh}

@webhooks_router.post("/test")
def test_webhook(body:dict,tenant_id:str=Query(...)):
    return {"message":"Test event fired","event":body.get("event","control.updated"),"timestamp":datetime.utcnow().isoformat()}
