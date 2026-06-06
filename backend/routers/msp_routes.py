"""
msp_routes.py — White-label MSP Partner Portal API (MongoDB-compatible)
All data is demo/in-memory — no DB calls needed.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from datetime import datetime, timedelta
from dependencies import get_current_user
import secrets

router = APIRouter(prefix="/api/msp", tags=["MSP White-Label"])

DEMO_MSP_PARTNERS = [
    {"id":"msp_001","brand_name":"SecureShield Compliance","contact_name":"Rahul Sharma","contact_email":"rahul@secureshield.in","custom_domain":"compliance.secureshield.in","brand_primary":"#1d4ed8","brand_secondary":"#7c3aed","brand_logo_url":"","plan":"growth","max_clients":25,"active_clients":12,"revenue_share":0.20,"monthly_revenue":144000,"status":"active","joined":(datetime.utcnow()-timedelta(days=45)).isoformat(),"industries":["Fintech","SaaS","Healthcare"]},
    {"id":"msp_002","brand_name":"ComplianceOS by TechAudit","contact_name":"Priya Nair","contact_email":"priya@techaudit.co.in","custom_domain":"app.techaudit.co.in","brand_primary":"#059669","brand_secondary":"#0891b2","brand_logo_url":"","plan":"enterprise","max_clients":100,"active_clients":31,"revenue_share":0.25,"monthly_revenue":372000,"status":"active","joined":(datetime.utcnow()-timedelta(days=120)).isoformat(),"industries":["Banking","NBFC","Insurance"]},
    {"id":"msp_003","brand_name":"AuditEdge Pro","contact_name":"Vikram Malhotra","contact_email":"vikram@auditedge.in","custom_domain":"portal.auditedge.in","brand_primary":"#dc2626","brand_secondary":"#ea580c","brand_logo_url":"","plan":"starter","max_clients":10,"active_clients":4,"revenue_share":0.20,"monthly_revenue":48000,"status":"pending_setup","joined":(datetime.utcnow()-timedelta(days=7)).isoformat(),"industries":["Manufacturing","IT Services"]},
]

DEMO_SUB_TENANTS = [
    {"id":"st_001","msp_id":"msp_001","name":"PayFast India","industry":"Fintech","plan":"growth","compliance_score":74,"frameworks":["SOC2","ISO27001"],"status":"active","joined":(datetime.utcnow()-timedelta(days=30)).isoformat()},
    {"id":"st_002","msp_id":"msp_001","name":"MediTrack Health","industry":"Healthcare","plan":"starter","compliance_score":58,"frameworks":["ISO27001","DPDP"],"status":"active","joined":(datetime.utcnow()-timedelta(days=25)).isoformat()},
    {"id":"st_003","msp_id":"msp_001","name":"CloudStack SaaS","industry":"SaaS","plan":"growth","compliance_score":82,"frameworks":["SOC2"],"status":"active","joined":(datetime.utcnow()-timedelta(days=15)).isoformat()},
    {"id":"st_004","msp_id":"msp_002","name":"FirstBank NBFC","industry":"Banking","plan":"enterprise","compliance_score":91,"frameworks":["RBI","ISO27001","SOC2"],"status":"active","joined":(datetime.utcnow()-timedelta(days=90)).isoformat()},
    {"id":"st_005","msp_id":"msp_002","name":"InsureTech Pro","industry":"Insurance","plan":"growth","compliance_score":67,"frameworks":["ISO27001","DPDP"],"status":"active","joined":(datetime.utcnow()-timedelta(days=60)).isoformat()},
]

MSP_PLANS = [
    {"id":"starter","name":"MSP Starter","max_clients":10,"revenue_share":0.20,"features":["White-label branding","Custom domain","10 client workspaces","Email support","Basic analytics"],"color":"#8b5cf6"},
    {"id":"growth","name":"MSP Growth","max_clients":25,"revenue_share":0.22,"features":["Everything in Starter","25 client workspaces","Priority support","Advanced analytics","API access","Slack alerts"],"color":"#3b82f6","popular":True},
    {"id":"enterprise","name":"MSP Enterprise","max_clients":100,"revenue_share":0.25,"features":["Everything in Growth","Unlimited clients","Dedicated CSM","Custom SLA","Co-marketing","Training sessions"],"color":"#10b981"},
]

@router.get("/dashboard")
def msp_dashboard(tenant_id:str=Query(default="demo")):
    total_clients = sum(p["active_clients"] for p in DEMO_MSP_PARTNERS)
    total_revenue = sum(p["monthly_revenue"] for p in DEMO_MSP_PARTNERS)
    avg_score = round(sum(t["compliance_score"] for t in DEMO_SUB_TENANTS)/max(len(DEMO_SUB_TENANTS),1))
    return {"stats":{"total_partners":len(DEMO_MSP_PARTNERS),"total_client_workspaces":total_clients,"monthly_platform_revenue":total_revenue,"avg_client_compliance_score":avg_score,"active_partners":sum(1 for p in DEMO_MSP_PARTNERS if p["status"]=="active"),"pending_setup":sum(1 for p in DEMO_MSP_PARTNERS if p["status"]=="pending_setup")},"revenue_trend":[{"month":"Jan","revenue":280000,"partners":1},{"month":"Feb","revenue":340000,"partners":2},{"month":"Mar","revenue":420000,"partners":2},{"month":"Apr","revenue":510000,"partners":3},{"month":"May","revenue":564000,"partners":3}],"top_partners":sorted(DEMO_MSP_PARTNERS,key=lambda x:x["monthly_revenue"],reverse=True)[:3]}

@router.get("/partners")
def get_partners(tenant_id:str=Query(default="demo")):
    return {"partners":DEMO_MSP_PARTNERS,"total":len(DEMO_MSP_PARTNERS)}

@router.post("/partners")
def create_partner(body:dict=Body(...),tenant_id:str=Query(default="demo")):
    plan = body.get("plan","starter")
    partner = {"id":f"msp_{secrets.token_hex(4)}","brand_name":body.get("brand_name","New Partner"),"contact_name":body.get("contact_name",""),"contact_email":body.get("contact_email",""),"custom_domain":body.get("custom_domain",""),"brand_primary":body.get("brand_primary","#7c3aed"),"brand_secondary":body.get("brand_secondary","#db2777"),"brand_logo_url":body.get("brand_logo_url",""),"plan":plan,"max_clients":{"starter":10,"growth":25,"enterprise":100}.get(plan,10),"active_clients":0,"revenue_share":{"starter":0.20,"growth":0.22,"enterprise":0.25}.get(plan,0.20),"monthly_revenue":0,"status":"pending_setup","joined":datetime.utcnow().isoformat(),"industries":body.get("industries",[])}
    DEMO_MSP_PARTNERS.append(partner)
    setup_token = secrets.token_urlsafe(32)
    return {"message":"MSP partner created","partner":partner,"setup_link":f"https://app.aura.io/msp/setup/{setup_token}","login_url":f"https://{partner['custom_domain'] or 'app.aura.io'}/login"}

@router.get("/partners/{partner_id}")
def get_partner(partner_id:str):
    p = next((x for x in DEMO_MSP_PARTNERS if x["id"]==partner_id),None)
    if not p: raise HTTPException(404,"Partner not found")
    clients = [t for t in DEMO_SUB_TENANTS if t["msp_id"]==partner_id]
    return {"partner":p,"clients":clients}

@router.patch("/partners/{partner_id}/branding")
def update_branding(partner_id:str,body:dict=Body(...)):
    p = next((x for x in DEMO_MSP_PARTNERS if x["id"]==partner_id),None)
    if not p: raise HTTPException(404,"Partner not found")
    for field in ["brand_name","brand_primary","brand_secondary","brand_logo_url","custom_domain"]:
        if field in body: p[field]=body[field]
    return {"message":"Branding updated","partner":p}

@router.get("/clients")
def get_all_clients(tenant_id:str=Query(default="demo")):
    return {"clients":DEMO_SUB_TENANTS,"total":len(DEMO_SUB_TENANTS)}

@router.post("/clients")
def create_client(body:dict=Body(...),tenant_id:str=Query(default="demo")):
    client = {"id":f"st_{secrets.token_hex(4)}","msp_id":body.get("msp_id",""),"name":body.get("name","New Client"),"industry":body.get("industry","Technology"),"plan":body.get("plan","starter"),"compliance_score":0,"frameworks":body.get("frameworks",["ISO27001"]),"status":"active","joined":datetime.utcnow().isoformat()}
    DEMO_SUB_TENANTS.append(client)
    return {"message":"Client workspace created","client":client,"login_url":f"https://app.aura.io/login?workspace={client['id']}"}

@router.get("/plans")
def get_plans():
    return {"plans":MSP_PLANS}

@router.get("/revenue")
def get_revenue(tenant_id:str=Query(default="demo")):
    total = sum(p["monthly_revenue"] for p in DEMO_MSP_PARTNERS)
    aura_share = round(total*0.78)
    partner_share = total-aura_share
    return {"total_platform_revenue":total,"aura_revenue":aura_share,"partner_payouts":partner_share,"by_partner":[{"name":p["brand_name"],"revenue":p["monthly_revenue"],"share":round(p["monthly_revenue"]*p["revenue_share"])} for p in DEMO_MSP_PARTNERS],"by_plan":{"starter":sum(p["monthly_revenue"] for p in DEMO_MSP_PARTNERS if p["plan"]=="starter"),"growth":sum(p["monthly_revenue"] for p in DEMO_MSP_PARTNERS if p["plan"]=="growth"),"enterprise":sum(p["monthly_revenue"] for p in DEMO_MSP_PARTNERS if p["plan"]=="enterprise")}}
