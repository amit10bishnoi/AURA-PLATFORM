from fastapi import APIRouter, Query
from datetime import datetime, timedelta
import secrets, random

router = APIRouter(prefix="/api/risk", tags=["risk"])

RISK_REGISTER = [
    {"id":"RISK-001","title":"Open SSH port on production security group","category":"Technical","likelihood":4,"impact":5,"inherent_score":20,"residual_score":16,"treatment":"MITIGATE","owner":"IT","status":"OPEN","financial_impact_inr":50000000,"framework_refs":["SOC2 CC6.6","ISO A.8.20"],"created_at":(datetime.utcnow()-timedelta(days=5)).isoformat(),"due_date":(datetime.utcnow()+timedelta(days=7)).isoformat()},
    {"id":"RISK-002","title":"Critical dependency vulnerabilities (lodash, axios)","category":"Technical","likelihood":3,"impact":4,"inherent_score":12,"residual_score":9,"treatment":"MITIGATE","owner":"Engineering","status":"OPEN","financial_impact_inr":25000000,"framework_refs":["SOC2 CC7.1","ISO A.8.8"],"created_at":(datetime.utcnow()-timedelta(days=8)).isoformat(),"due_date":(datetime.utcnow()+timedelta(days=3)).isoformat()},
    {"id":"RISK-003","title":"No DPO appointed for DPDP compliance","category":"Regulatory","likelihood":5,"impact":5,"inherent_score":25,"residual_score":25,"treatment":"MITIGATE","owner":"Legal","status":"OPEN","financial_impact_inr":1500000000,"framework_refs":["DPDP Section 10","RBI IT Gov"],"created_at":(datetime.utcnow()-timedelta(days=30)).isoformat(),"due_date":(datetime.utcnow()+timedelta(days=60)).isoformat()},
    {"id":"RISK-004","title":"PaymentGateway Pro questionnaire overdue 45 days","category":"Third Party","likelihood":3,"impact":4,"inherent_score":12,"residual_score":9,"treatment":"MITIGATE","owner":"Procurement","status":"OPEN","financial_impact_inr":20000000,"framework_refs":["SOC2 CC9.2","ISO A.5.19"],"created_at":(datetime.utcnow()-timedelta(days=45)).isoformat(),"due_date":(datetime.utcnow()+timedelta(days=1)).isoformat()},
    {"id":"RISK-005","title":"Weak IAM password policy — min 8 chars","category":"Technical","likelihood":3,"impact":3,"inherent_score":9,"residual_score":6,"treatment":"MITIGATE","owner":"IT","status":"IN_PROGRESS","financial_impact_inr":10000000,"framework_refs":["SOC2 CC6.1","RBI CSF 3.1"],"created_at":(datetime.utcnow()-timedelta(days=12)).isoformat(),"due_date":(datetime.utcnow()+timedelta(days=14)).isoformat()},
    {"id":"RISK-006","title":"No BCP test conducted in last 12 months","category":"Operational","likelihood":2,"impact":5,"inherent_score":10,"residual_score":8,"treatment":"MITIGATE","owner":"CTO","status":"OPEN","financial_impact_inr":100000000,"framework_refs":["RBI ITG 3.1","SOC2 A1.2"],"created_at":(datetime.utcnow()-timedelta(days=60)).isoformat(),"due_date":(datetime.utcnow()+timedelta(days=30)).isoformat()},
    {"id":"RISK-008","title":"CERT-In 6-hour incident reporting not automated","category":"Regulatory","likelihood":3,"impact":5,"inherent_score":15,"residual_score":12,"treatment":"MITIGATE","owner":"CISO","status":"IN_PROGRESS","financial_impact_inr":500000000,"framework_refs":["CERT-In 2022","RBI CSF 6.1"],"created_at":(datetime.utcnow()-timedelta(days=20)).isoformat(),"due_date":(datetime.utcnow()+timedelta(days=20)).isoformat()},
    {"id":"RISK-009","title":"Annual VAPT by CERT-In empanelled firm pending","category":"Compliance","likelihood":2,"impact":4,"inherent_score":8,"residual_score":6,"treatment":"MITIGATE","owner":"Security","status":"OPEN","financial_impact_inr":15000000,"framework_refs":["RBI CSF 4.3","CERT-In"],"created_at":(datetime.utcnow()-timedelta(days=90)).isoformat(),"due_date":(datetime.utcnow()+timedelta(days=60)).isoformat()},
    {"id":"RISK-010","title":"Children data collection without parental consent check","category":"Regulatory","likelihood":4,"impact":5,"inherent_score":20,"residual_score":20,"treatment":"MITIGATE","owner":"Product","status":"OPEN","financial_impact_inr":2000000000,"framework_refs":["DPDP Section 9"],"created_at":(datetime.utcnow()-timedelta(days=10)).isoformat(),"due_date":(datetime.utcnow()+timedelta(days=30)).isoformat()},
]

INCIDENTS = [
    {"id":"INC-001","title":"Failed login spike — possible credential stuffing","severity":"HIGH","status":"INVESTIGATING","category":"Security","detected_at":(datetime.utcnow()-timedelta(hours=6)).isoformat(),"reported_to_rbi":False,"reported_to_cert_in":False,"affected_users":0,"data_breach":False,"description":"3,400 failed login attempts in 2 hours from 12 different IPs. Accounts temporarily locked."},
    {"id":"INC-002","title":"Third-party API exposed customer PII in logs","severity":"CRITICAL","status":"CONTAINED","category":"Data Breach","detected_at":(datetime.utcnow()-timedelta(days=2)).isoformat(),"reported_to_rbi":True,"reported_to_cert_in":True,"affected_users":142,"data_breach":True,"description":"Payment gateway API was logging full card numbers in plain text. Logs secured and rotated."},
    {"id":"INC-003","title":"Phishing email campaign targeting employees","severity":"MEDIUM","status":"RESOLVED","category":"Social Engineering","detected_at":(datetime.utcnow()-timedelta(days=7)).isoformat(),"reported_to_rbi":False,"reported_to_cert_in":False,"affected_users":0,"data_breach":False,"description":"12 employees received phishing emails. None clicked. Security awareness training triggered."},
]

RISK_TRENDS = []
base_score = 68
for i in range(30):
    date = datetime.utcnow() - timedelta(days=29-i)
    score = base_score + random.randint(-3,3)
    base_score = max(30, min(100, score))
    RISK_TRENDS.append({"date":date.strftime("%Y-%m-%d"),"score":base_score,"open_risks":random.randint(8,15),"critical":random.randint(2,5)})

@router.get("/register")
def get_risk_register(tenant_id: str = Query(...), category: str = Query(None), status: str = Query(None)):
    risks = RISK_REGISTER[:]
    if category: risks = [r for r in risks if r["category"]==category]
    if status: risks = [r for r in risks if r["status"]==status]
    total_financial = sum(r["financial_impact_inr"] for r in RISK_REGISTER)
    return {"risks":risks,"total":len(risks),"open":len([r for r in RISK_REGISTER if r["status"]=="OPEN"]),"critical":len([r for r in RISK_REGISTER if r["inherent_score"]>=16]),"total_financial_exposure_inr":total_financial,"total_financial_exposure_cr":round(total_financial/10000000,1)}

@router.post("/register")
def add_risk(body: dict, tenant_id: str = Query(...)):
    risk = {"id":f"RISK-{secrets.token_hex(3).upper()}","title":body.get("title"),"category":body.get("category","Technical"),"likelihood":body.get("likelihood",3),"impact":body.get("impact",3),"inherent_score":body.get("likelihood",3)*body.get("impact",3),"residual_score":body.get("likelihood",3)*body.get("impact",3),"treatment":"MITIGATE","owner":body.get("owner","CISO"),"status":"OPEN","financial_impact_inr":body.get("financial_impact",0),"framework_refs":body.get("framework_refs",[]),"created_at":datetime.utcnow().isoformat(),"due_date":(datetime.utcnow()+timedelta(days=30)).isoformat()}
    RISK_REGISTER.append(risk)
    return {"message":"Risk added","risk":risk}

@router.get("/score")
def get_risk_score(tenant_id: str = Query(...)):
    open_risks = [r for r in RISK_REGISTER if r["status"]=="OPEN"]
    critical = [r for r in open_risks if r["inherent_score"]>=16]
    high = [r for r in open_risks if 10<=r["inherent_score"]<16]
    score = 100 - len(critical)*8 - len(high)*4 - len([r for r in open_risks if r["inherent_score"]<10])*1
    score = max(0, min(100, score))
    return {"score":score,"label":"Critical" if score<40 else "High" if score<60 else "Medium" if score<80 else "Low","color":"#e11d48" if score<40 else "#ea580c" if score<60 else "#d97706" if score<80 else "#16a34a","open_risks":len(open_risks),"critical_risks":len(critical),"high_risks":len(high),"total_exposure_cr":round(sum(r["financial_impact_inr"] for r in RISK_REGISTER)/10000000,1)}

@router.get("/trends")
def get_risk_trends(tenant_id: str = Query(...)):
    return {"trends":RISK_TRENDS,"current_score":RISK_TRENDS[-1]["score"],"trend":"improving" if RISK_TRENDS[-1]["score"]>RISK_TRENDS[-7]["score"] else "degrading"}

@router.get("/incidents")
def get_incidents(tenant_id: str = Query(...)):
    return {"incidents":INCIDENTS,"total":len(INCIDENTS),"open":len([i for i in INCIDENTS if i["status"]!="RESOLVED"]),"data_breaches":len([i for i in INCIDENTS if i["data_breach"]]),"requires_rbi_report":len([i for i in INCIDENTS if i["severity"] in ["CRITICAL","HIGH"] and not i["reported_to_rbi"]])}

@router.post("/incidents")
def create_incident(body: dict, tenant_id: str = Query(...)):
    inc = {"id":f"INC-{secrets.token_hex(3).upper()}","title":body.get("title"),"severity":body.get("severity","MEDIUM"),"status":"OPEN","category":body.get("category","Security"),"detected_at":datetime.utcnow().isoformat(),"reported_to_rbi":False,"reported_to_cert_in":False,"affected_users":body.get("affected_users",0),"data_breach":body.get("data_breach",False),"description":body.get("description","")}
    INCIDENTS.append(inc)
    return {"message":"Incident logged","incident":inc,"rbi_reporting_required":inc["severity"]=="CRITICAL","cert_in_deadline":"Within 6 hours"}
