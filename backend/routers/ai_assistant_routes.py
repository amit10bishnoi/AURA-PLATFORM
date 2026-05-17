from fastapi import APIRouter, Query
from datetime import datetime, timedelta
import random, secrets

ai_router = APIRouter(prefix="/api/ai", tags=["ai"])

RISK_RESPONSES = [
    "Your risk score is elevated due to 2 open critical vulnerabilities and missing MFA on 3 admin accounts. Fixing these reduces your score by ~35 points.",
    "Main risk contributors: (1) SSH open to 0.0.0.0/0, (2) DLP gaps on PII S3 buckets, (3) overdue vendor questionnaires. Address in that order.",
    "Risk is degrading — 3 controls that passed last week are now failing: dependency scanning, failed login threshold, and vulnerability SLA.",
]
COMPLIANCE_RESPONSES = [
    "SOC2 readiness is 74%. Biggest gaps: CC7.1 (System Monitoring) and CC7.2 (Vulnerability Management). Fixing these pushes you above 80%.",
]
REMEDIATION_RESPONSES = [
    "Fix SSH port: AWS Console → EC2 → Security Groups → sg-0abc123 → Edit inbound rules → Remove 0.0.0.0/0 on port 22. Replace with your office IP.",
    "Fix dependency vulnerability: run `npm audit fix`. If unresolved, update lodash to 4.17.21+ in package.json.",
    "Fix MFA gap: Okta Admin → Security → Multifactor → Factor Enrollment → set Required for All Users group.",
]
GENERAL_RESPONSES = [
    "Focus on: (1) Close 2 critical pentest findings, (2) Complete SOC2 evidence for CC7.x, (3) Send overdue questionnaires to Zendesk and PaymentGateway Pro.",
    "Compliance improved 7% this month. SOC2 Type II audit-ready in ~6 weeks. Critical path: evidence collection and vendor questionnaires.",
    "Cloud security improving, vendor risk increasing. Prioritize PaymentGateway Pro audit — Critical rated, handles payment data.",
]
CHAT_HISTORY = []
SUGGESTIONS = [
    "Why is my risk score high?","What should I fix first?","How do I improve my SOC2 score?",
    "Which vendors need attention?","What evidence is expiring?","How do I fix the open SSH port?",
    "What are my biggest compliance gaps?","Am I ready for a SOC2 audit?",
]

def ai_response(question):
    q=question.lower()
    if any(w in q for w in ["risk","score","high","critical"]):
        return random.choice(RISK_RESPONSES),"Risk Analysis",[{"label":"View Risk","tab":"risk"},{"label":"Run Checks","tab":"monitoring"}]
    elif any(w in q for w in ["fix","remediate","resolve","how","port","ssh","vulnerability"]):
        return random.choice(REMEDIATION_RESPONSES),"Remediation Guide",[{"label":"View Monitoring","tab":"monitoring"}]
    elif any(w in q for w in ["soc2","hipaa","gdpr","compliance","audit","ready"]):
        return random.choice(COMPLIANCE_RESPONSES),"Compliance Insights",[{"label":"View Compliance","tab":"compliance"},{"label":"Auditor Portal","tab":"auditor"}]
    elif any(w in q for w in ["vendor","questionnaire","third"]):
        return "2 critical vendors need immediate attention: PaymentGateway Pro (score: 82, questionnaire overdue) and DataAnalytics Co (score: 68, sent but incomplete). Escalate both this week.","Vendor Risk",[{"label":"View Vendors","tab":"vendors"}]
    elif any(w in q for w in ["evidence","expir","upload"]):
    else:
        return random.choice(GENERAL_RESPONSES),"General Insights",[{"label":"Dashboard","tab":"overview"},{"label":"Reports","tab":"reports"}]

@ai_router.post("/chat")
def chat(body:dict,tenant_id:str=Query(...)):
    q=body.get("message","")
    if not q: return {"error":"No message"}
    resp,cat,actions=ai_response(q)
    now=datetime.utcnow().isoformat()
    CHAT_HISTORY.extend([{"id":len(CHAT_HISTORY)+1,"role":"user","content":q,"timestamp":now},{"id":len(CHAT_HISTORY)+2,"role":"assistant","content":resp,"category":cat,"actions":actions,"confidence":random.randint(85,98),"timestamp":now}])
    return {"response":resp,"category":cat,"actions":actions,"confidence":random.randint(85,98),"sources":["Monitoring","Evidence","Vendors","Compliance"],"timestamp":now}

@ai_router.get("/history")
def get_history(tenant_id:str=Query(...)): return {"history":CHAT_HISTORY[-30:]}

@ai_router.get("/suggestions")
def get_suggestions(tenant_id:str=Query(...)): return {"suggestions":SUGGESTIONS}

@ai_router.get("/summary")
def get_summary(tenant_id:str=Query(...)):
    return {"summary":"Your compliance posture is improving but needs attention in 3 areas. Risk score 42/100 (Medium), 2 critical findings open. SOC2 readiness 74% — ~6 weeks from audit-ready at current pace. Top priority: close open SSH port and complete PaymentGateway Pro questionnaire.","highlights":[{"type":"positive","text":"SOC2 score improved 7% this month"},{"type":"positive","text":"MFA enforced for all 47 users"},{"type":"warning","text":"2 critical vulnerabilities unpatched"},{"type":"warning","text":"PaymentGateway Pro questionnaire overdue"},{"type":"negative","text":"Open SSH port on production security group"}],"risk_score":42,"trend":"improving","audit_ready_in":"~6 weeks","generated_at":datetime.utcnow().isoformat()}

@ai_router.get("/recommendations")
def get_recommendations(tenant_id:str=Query(...)):
    return {"recommendations":[
        {"priority":1,"title":"Close Open SSH Port","effort":"Low","impact":"High","framework":"SOC2","control":"CC6.6","tab":"monitoring"},
        {"priority":3,"title":"Update Lodash Dependency","effort":"Low","impact":"High","framework":"SOC2","control":"CC7.1","tab":"monitoring"},
        {"priority":4,"title":"Pull Fresh AWS Evidence","effort":"Low","impact":"Medium","framework":"SOC2","control":"CC6.6","tab":"auto-evidence"},
    ]}

# ── QUESTIONNAIRE ──────────────────────────────────────────────────────────────
q_router = APIRouter(prefix="/api/questionnaires", tags=["questionnaires"])

DEMO_QUESTIONNAIRES = [
    {"id":"q_002","title":"Vendor Security Assessment","description":"Third-party vendor risk assessment questionnaire","status":"ACTIVE","questions_count":15,"responses_count":7,"created_by":"Priya Nair","created_at":(datetime.utcnow()-timedelta(days=60)).isoformat(),"frameworks":["SOC2","ISO27001"]},
]

DEMO_QUESTIONS = [
    {"id":1,"section":"Access Control","question":"Do you enforce MFA for all user accounts?","type":"yes_no","required":True,"framework_ref":"SOC2 CC6.1"},
    {"id":2,"section":"Access Control","question":"How frequently do you review user access permissions?","type":"multiple_choice","options":["Monthly","Quarterly","Annually","Never"],"required":True,"framework_ref":"SOC2 CC6.3"},
    {"id":3,"section":"Access Control","question":"Do you have a formal offboarding process to revoke access?","type":"yes_no","required":True,"framework_ref":"SOC2 CC6.2"},
    {"id":4,"section":"Data Security","question":"Is all data encrypted at rest using AES-256 or equivalent?","type":"yes_no","required":True,"framework_ref":"SOC2 CC6.7"},
    {"id":5,"section":"Data Security","question":"Is all data encrypted in transit using TLS 1.2 or higher?","type":"yes_no","required":True,"framework_ref":"SOC2 CC6.7"},
    {"id":6,"section":"Data Security","question":"Do you have a data classification policy?","type":"yes_no","required":True,"framework_ref":"ISO27001 A.8.2"},
    {"id":7,"section":"Vulnerability Management","question":"How often do you perform vulnerability scans?","type":"multiple_choice","options":["Continuously","Weekly","Monthly","Quarterly","Annually"],"required":True,"framework_ref":"SOC2 CC7.1"},
    {"id":8,"section":"Vulnerability Management","question":"What is your SLA for patching critical vulnerabilities?","type":"multiple_choice","options":["24 hours","72 hours","7 days","30 days","No SLA"],"required":True,"framework_ref":"SOC2 CC7.1"},
    {"id":9,"section":"Incident Response","question":"Do you have a documented Incident Response Plan?","type":"yes_no","required":True,"framework_ref":"SOC2 CC7.4"},
    {"id":10,"section":"Incident Response","question":"When was your last incident response tabletop exercise?","type":"multiple_choice","options":["Last 6 months","Last year","2+ years ago","Never"],"required":False,"framework_ref":"SOC2 CC7.4"},
    {"id":11,"section":"Business Continuity","question":"Do you have a Business Continuity Plan (BCP)?","type":"yes_no","required":True,"framework_ref":"SOC2 A1.2"},
    {"id":12,"section":"Business Continuity","question":"What is your RTO for critical systems?","type":"multiple_choice","options":["< 1 hour","1-4 hours","4-24 hours","24+ hours","Not defined"],"required":True,"framework_ref":"SOC2 A1.2"},
    {"id":15,"section":"Compliance","question":"Are you SOC2 Type II certified?","type":"yes_no","required":True,"framework_ref":"SOC2"},
]

DEMO_RESPONSES = [
    {"id":"r_001","questionnaire_id":"q_001","respondent_name":"TechCorp Inc","respondent_email":"security@techcorp.com","status":"COMPLETED","score":82,"submitted_at":(datetime.utcnow()-timedelta(days=5)).isoformat(),"answers":15},
    {"id":"r_002","questionnaire_id":"q_001","respondent_name":"DataFlow Ltd","respondent_email":"ciso@dataflow.io","status":"IN_PROGRESS","score":None,"submitted_at":None,"answers":8},
    {"id":"r_003","questionnaire_id":"q_002","respondent_name":"CloudVendor Pro","respondent_email":"compliance@cloudvendor.com","status":"COMPLETED","score":91,"submitted_at":(datetime.utcnow()-timedelta(days=12)).isoformat(),"answers":15},
]

@q_router.get("")
def get_questionnaires(tenant_id:str=Query(...)): return {"questionnaires":DEMO_QUESTIONNAIRES,"total":len(DEMO_QUESTIONNAIRES)}

@q_router.post("")
def create_questionnaire(body:dict,tenant_id:str=Query(...)):
    q={"id":f"q_{secrets.token_hex(4)}","title":body.get("title"),"description":body.get("description",""),"status":"DRAFT","questions_count":15,"responses_count":0,"created_by":"Current User","created_at":datetime.utcnow().isoformat(),"frameworks":body.get("frameworks",[])}
    DEMO_QUESTIONNAIRES.append(q)
    return {"message":"Created","questionnaire":q}

@q_router.get("/{qid}/questions")
def get_questions(qid:str): return {"questions":DEMO_QUESTIONS,"total":len(DEMO_QUESTIONS)}

@q_router.get("/{qid}/responses")
def get_responses(qid:str):
    return {"responses":[r for r in DEMO_RESPONSES if r["questionnaire_id"]==qid]}

@q_router.post("/{qid}/send")
def send_questionnaire(qid:str,body:dict):
    emails=body.get("emails",[])
    return {"message":f"Sent to {len(emails)} recipients","links":[{"email":e,"link":f"https://app.aura.io/q/{qid}?token={secrets.token_urlsafe(16)}"} for e in emails]}

# ── SSO ────────────────────────────────────────────────────────────────────────
sso_router = APIRouter(prefix="/api/sso", tags=["sso"])

SSO_PROVIDERS = [
    {"id":"google","name":"Google Workspace","color":"#4285F4","connected":False,"description":"Sign in with Google accounts"},
    {"id":"microsoft","name":"Microsoft Azure AD","color":"#0078D4","connected":False,"description":"Sign in with Microsoft/Office 365"},
    {"id":"okta","name":"Okta","color":"#007DC1","connected":True,"description":"Sign in with Okta identity provider","connected_at":(datetime.utcnow()-timedelta(days=45)).isoformat()},
    {"id":"github","name":"GitHub","color":"#E2E8F0","connected":False,"description":"Sign in with GitHub accounts"},
]

@sso_router.get("/providers")
def get_providers(tenant_id:str=Query(...)): return {"providers":SSO_PROVIDERS}

@sso_router.post("/providers/{pid}/connect")
def connect_provider(pid:str,body:dict,tenant_id:str=Query(...)):
    for p in SSO_PROVIDERS:
        if p["id"]==pid: p["connected"]=True;p["connected_at"]=datetime.utcnow().isoformat()
    return {"message":f"{pid} SSO connected","redirect_uri":f"https://app.aura.io/auth/callback/{pid}"}

@sso_router.post("/providers/{pid}/disconnect")
def disconnect_provider(pid:str,tenant_id:str=Query(...)):
    for p in SSO_PROVIDERS:
        if p["id"]==pid: p["connected"]=False
    return {"message":"Disconnected"}
