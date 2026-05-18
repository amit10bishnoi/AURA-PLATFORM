from fastapi import APIRouter, Query, Body
from datetime import datetime, timedelta
import random, secrets, os, sys

ai_router = APIRouter(prefix="/api/ai", tags=["ai"])

# ── Try to use Claude API if key is set ───────────────────────────────────────
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
LLM_ENABLED = bool(ANTHROPIC_API_KEY)

def _call_claude(system_prompt: str, user_message: str, max_tokens: int = 1000) -> str:
    """Call Claude API directly."""
    import httpx
    headers = {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    body = {
        "model": "claude-sonnet-4-20250514",
        "max_tokens": max_tokens,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_message}],
    }
    try:
        with httpx.Client(timeout=30) as client:
            res = client.post("https://api.anthropic.com/v1/messages", json=body, headers=headers)
            if res.status_code == 200:
                return res.json()["content"][0]["text"]
            return None
    except Exception as e:
        print(f"Claude API error: {e}")
        return None

# ── Smart fallback responses ──────────────────────────────────────────────────
RISK_RESPONSES = [
    "Your risk score is elevated due to open critical vulnerabilities and missing MFA on admin accounts. Fixing these reduces your score significantly.\n\n**Top 3 actions:**\n1. Enable MFA for all admin accounts (Okta/Azure AD → Security → MFA)\n2. Patch critical CVEs within 72 hours\n3. Review SSH security group rules — remove 0.0.0.0/0",
    "Main risk contributors:\n1. **SSH open to 0.0.0.0/0** — AWS Console → EC2 → Security Groups → Edit inbound → Restrict to your office IP\n2. **DLP gaps on PII S3 buckets** — Enable S3 server-side encryption + bucket policies\n3. **Overdue vendor questionnaires** — escalate to PaymentGateway Pro immediately",
]
COMPLIANCE_RESPONSES = [
    "**SOC 2 Type II** — Biggest gaps:\n- CC7.1 System Monitoring: Set up CloudWatch/Datadog alerts\n- CC7.2 Vulnerability Management: Automate weekly scans\n- CC6.1 MFA: Enable for all users\n\nFixing these 3 controls pushes readiness above 85%.",
    "**ISO 27001** readiness gaps:\n- A.8.8 Vulnerability management (patch SLA missing)\n- A.5.15 Access control (privileged account reviews overdue)\n- A.5.16 Identity management (orphaned accounts exist)\n\nEstimated effort: 4–6 weeks to close these gaps.",
]
REMEDIATION_RESPONSES = [
    "**Fix SSH Port Exposure:**\n1. AWS Console → EC2 → Security Groups\n2. Find the group with port 22 open to 0.0.0.0/0\n3. Edit inbound rules → Delete the 0.0.0.0/0 rule\n4. Add new rule: Port 22, Source: Your office IP (e.g. 203.0.113.0/32)\n5. For remote access, use AWS Session Manager instead — no open ports needed",
    "**Fix Dependency Vulnerabilities:**\n1. Run `npm audit` to see all issues\n2. Run `npm audit fix` for auto-fixable ones\n3. For lodash: update to 4.17.21+ in package.json\n4. For critical CVEs: `npm install <package>@latest`\n5. Set up Dependabot: add `.github/dependabot.yml` with weekly checks\n6. Block PRs with critical vulnerabilities via GitHub branch protection",
    "**Fix MFA Gap:**\n1. Okta Admin → Security → Multifactor → Factor Enrollment\n2. Create enrollment policy: Required for 'All Users' group\n3. Grace period: 7 days (to avoid lockouts)\n4. Supported factors: Okta Verify + TOTP apps\n5. Monitor adoption: Reports → Users → MFA Usage\n6. Force re-enroll for users who haven't set up: Directory → People → Actions → Reset MFA",
]
DPDP_RESPONSES = [
    "**DPDP Act 2023 Compliance Steps:**\n1. **Consent Management**: Implement granular consent UI — users must opt-in explicitly\n2. **Data Principal Rights**: Build DSR (Data Subject Request) workflow — respond within 48 hours\n3. **Data Fiduciary Notice**: Publish privacy notice in plain language on website/app\n4. **Breach Notification**: Set up breach detection → notify DPBI within 72 hours\n5. **Data Minimisation**: Audit what PII you collect — delete what's not needed\n6. **Cross-border Transfers**: Map data flows — restrict transfers to non-approved countries\n\nDeadline: May 2027. Start now.",
]
RBI_RESPONSES = [
    "**RBI Cybersecurity Framework compliance:**\n1. **Board-approved CSP**: Document and get board sign-off on your Cyber Security Policy\n2. **VAPT**: Commission CERT-In empanelled auditor for annual penetration testing\n3. **Incident Reporting**: Configure 2-hour RBI reporting for cyber incidents\n4. **Data Localisation**: Ensure all payment data stored in India (RBI mandate)\n5. **C-SOC**: Set up 24x7 Security Operations Centre or outsource to CERT-In listed MSSP\n6. **Third-party oversight**: Vendor security assessments mandatory for all payment processors",
]
GENERAL_RESPONSES = [
    "**Your top 3 priorities:**\n1. Close the 2 critical findings (SSH port + dependency CVEs) — estimated 2 days\n2. Complete SOC 2 evidence for CC7.x controls — estimated 1 week\n3. Send overdue questionnaires to high-risk vendors — estimated 30 minutes\n\nAt current pace, you're ~6 weeks from audit-ready.",
    "**Compliance posture summary:**\n- SOC 2: 74% ready — CC7 controls are the gap\n- ISO 27001: 68% ready — A.8 controls need attention\n- RBI: 61% — Incident reporting workflow missing\n- DPDP: 15% — Consent management not yet implemented\n\n**Quick win**: Enable auto-evidence collection from AWS to jump SOC 2 to 82% this week.",
]

SUGGESTIONS = [
    "Why is my risk score high?",
    "What should I fix first?",
    "How do I improve my SOC 2 score?",
    "What are my ISO 27001 gaps?",
    "How do I comply with the DPDP Act?",
    "What does RBI Cybersecurity Framework require?",
    "Which vendors need attention?",
    "How do I fix the open SSH port?",
    "What evidence is expiring soon?",
    "Am I ready for a SOC 2 audit?",
    "How do I set up MFA for all users?",
    "What is my CERT-In reporting obligation?",
]

AURA_SYSTEM_PROMPT = """You are AURA AI, an expert cybersecurity and compliance assistant for Indian enterprises.
You specialize in ISO 27001:2022, SOC 2 Type II, RBI Cybersecurity Framework, and DPDP Act 2023.

Your responses are:
- Specific and actionable — include exact tool names, menu paths, CLI commands
- Concise but complete — use numbered steps and bold headers
- India-aware — reference RBI, CERT-In, DPDP Act, Indian regulations where relevant
- Professional but clear — avoid jargon without explanation

Format your response with:
- Bold headers using **text**
- Numbered steps for actions
- Specific tool paths (e.g. "AWS Console → EC2 → Security Groups")
- Time estimates when relevant

Keep responses under 300 words unless the question requires detailed steps."""

def smart_response(question: str):
    """Smart keyword-based fallback when Claude API not available."""
    q = question.lower()

    # Handle greetings and general conversation
    if any(w in q for w in ["hey","hello","hi","hii","good morning","good evening","how are you","what's up","wassup","sup","namaste","hola"]):
        return (
            "Hello! I am AURA AI, your compliance copilot. I can help you with:\n\n"
            "• **ISO 27001** — Control gaps, evidence requirements, audit readiness\n"
            "• **SOC 2 Type II** — TSC mapping, CC controls, readiness score\n"
            "• **RBI Cybersecurity** — CSF requirements, CERT-In reporting, incident workflows\n"
            "• **DPDP Act 2023** — Consent management, DSR rights, May 2027 deadline\n"
            "• **Risk Analysis** — Risk scoring, financial exposure, remediation steps\n"
            "• **Vendor Risk** — Third-party assessments, questionnaires\n\n"
            "Ask me anything like: *'Why is my SOC 2 score low?'* or *'How do I comply with DPDP Act?'*"
        ), "General Insights", [{"label":"Dashboard","tab":"overview"},{"label":"Compliance","tab":"compliance"}]

    # Handle what/who questions about AURA
    if any(w in q for w in ["what can you do","help me","what do you do","who are you","what are you","your capabilities","how can you","what is aura"]):
        return (
            "I am AURA AI — your AI compliance copilot for Indian enterprises. Here is what I can do:\n\n"
            "**1. Answer compliance questions** — ISO 27001, SOC 2, RBI, DPDP Act\n"
            "**2. Explain your risk score** — Why it is high, what is contributing, how to fix it\n"
            "**3. Give remediation steps** — Exact commands, tool paths, step-by-step fixes\n"
            "**4. Audit readiness** — Am I ready for SOC 2? What evidence is missing?\n"
            "**5. India-specific guidance** — RBI CSF, CERT-In reporting, DPDP consent\n\n"
            "Try asking: *'What should I fix first?'* or *'How do I get ISO 27001 certified?'*"
        ), "General Insights", [{"label":"ISO 27001","tab":"iso27001"},{"label":"SOC 2","tab":"soc2"}]

    if any(w in q for w in ["dpdp", "privacy", "consent", "data protection", "personal data"]):
        return random.choice(DPDP_RESPONSES), "DPDP Compliance", [{"label":"DPDP Hub","tab":"dpdp"},{"label":"Privacy Policies","tab":"policies"}]
    elif any(w in q for w in ["rbi", "cert-in", "reserve bank", "banking", "nbfc", "fintech"]):
        return random.choice(RBI_RESPONSES), "RBI Compliance", [{"label":"RBI Hub","tab":"rbi"},{"label":"Incidents","tab":"audit"}]
    elif any(w in q for w in ["fix","remediate","resolve","how","port","ssh","vulnerability","patch","mfa","multifactor"]):
        return random.choice(REMEDIATION_RESPONSES), "Remediation Guide", [{"label":"Live Checks","tab":"test-engine"},{"label":"Risk Register","tab":"risk-register"}]
    elif any(w in q for w in ["soc2","soc 2","iso","iso27001","compliance","audit","ready","framework","control"]):
        return random.choice(COMPLIANCE_RESPONSES), "Compliance Insights", [{"label":"Compliance Map","tab":"compliance"},{"label":"ISO 27001","tab":"iso27001"},{"label":"SOC 2","tab":"soc2"}]
    elif any(w in q for w in ["risk","score","high","critical","exposure","vulnerability"]):
        return random.choice(RISK_RESPONSES), "Risk Analysis", [{"label":"Risk Register","tab":"risk-register"},{"label":"Live Checks","tab":"test-engine"}]
    elif any(w in q for w in ["vendor","questionnaire","third","supplier"]):
        return "**Vendor Risk Summary:**\n\nHigh-risk vendors needing attention:\n1. **PaymentGateway Pro** — Risk score 82 (Critical), questionnaire overdue 15 days\n2. **DataAnalytics Co** — Risk score 68 (High), questionnaire in progress\n\n**Actions:**\n1. Go to Third-Party Risk → Select vendor → Send Questionnaire\n2. Set 7-day deadline with automatic reminders\n3. Escalate to CISO if no response after 72 hours", "Vendor Risk", [{"label":"Vendor Risk","tab":"vendors"}]
    elif any(w in q for w in ["evidence","expir","upload","collect","document"]):
        return "**Evidence Status:**\n\n3 evidence items expiring within 30 days:\n1. **Penetration Test Report** — expires in 12 days → Renew or upload new report\n2. **Access Control Policy** — expires in 24 days → Send for re-approval\n3. **MFA Screenshot** — expires in 28 days → Recapture from admin console\n\n**Quick action:** Enable Auto Evidence Collection to automatically refresh AWS, GitHub, and Okta evidence.", "Evidence", [{"label":"Evidence","tab":"evidence"},{"label":"Auto Evidence","tab":"auto-evidence"}]
    else:
        return random.choice(GENERAL_RESPONSES), "General Insights", [{"label":"Dashboard","tab":"overview"},{"label":"Compliance","tab":"compliance"},{"label":"Risk Register","tab":"risk-register"}]

# ── Routes ────────────────────────────────────────────────────────────────────
@ai_router.post("/chat")
async def chat(body: dict = Body(...), tenant_id: str = Query(default="demo")):
    q = body.get("message", "").strip()
    if not q:
        return {"error": "No message provided"}

    now = datetime.utcnow().isoformat()

    if LLM_ENABLED:
        ai_text = _call_claude(AURA_SYSTEM_PROMPT, q, max_tokens=600)
        if ai_text:
            # Determine category from question
            ql = q.lower()
            if any(w in ql for w in ["dpdp","privacy","consent"]): cat = "DPDP Compliance"
            elif any(w in ql for w in ["rbi","cert-in","banking"]): cat = "RBI Compliance"
            elif any(w in ql for w in ["fix","remediate","how to","ssh","mfa","patch"]): cat = "Remediation Guide"
            elif any(w in ql for w in ["soc","iso","compliance","audit","framework"]): cat = "Compliance Insights"
            elif any(w in ql for w in ["risk","score","vulnerability"]): cat = "Risk Analysis"
            elif any(w in ql for w in ["vendor","third-party"]): cat = "Vendor Risk"
            else: cat = "General Insights"

            actions = [{"label":"Dashboard","tab":"overview"},{"label":"Reports","tab":"reports"}]
            return {
                "response": ai_text,
                "category": cat,
                "actions": actions,
                "confidence": 97,
                "source": "claude-ai",
                "sources": ["ISO 27001:2022","SOC 2 TSC","RBI CSF","DPDP Act 2023"],
                "timestamp": now,
            }

    # Fallback to smart templates
    resp, cat, actions = smart_response(q)
    return {
        "response": resp,
        "category": cat,
        "actions": actions,
        "confidence": random.randint(85, 95),
        "source": "smart-template",
        "sources": ["ISO 27001:2022","SOC 2 TSC","RBI CSF","DPDP Act 2023"],
        "timestamp": now,
    }

@ai_router.get("/suggestions")
def get_suggestions(tenant_id: str = Query(default="demo")):
    return {"suggestions": SUGGESTIONS}

@ai_router.get("/summary")
def get_summary(tenant_id: str = Query(default="demo")):
    if LLM_ENABLED:
        text = _call_claude(
            "You are AURA AI, a GRC compliance assistant for Indian enterprises.",
            "Generate a 2-sentence executive summary of a company with SOC2 readiness 74%, ISO 27001 68%, RBI 61%, DPDP 15%. Risk score 42/100. Top issues: open SSH port, missing MFA, DPDP consent not implemented.",
            max_tokens=200
        )
        summary_text = text if text else "Your compliance posture requires attention across 4 frameworks."
    else:
        summary_text = "Your compliance posture is improving but needs attention in 3 key areas. SOC 2 readiness at 74% — ~6 weeks from audit-ready at current pace. Critical path: close open SSH port, complete vendor questionnaires, and implement DPDP consent management."

    return {
        "summary": summary_text,
        "highlights": [
            {"type":"positive","text":"SOC 2 score improved 7% this month"},
            {"type":"positive","text":"MFA enforced for all 47 users"},
            {"type":"warning","text":"2 critical vulnerabilities unpatched (SSH, Log4j)"},
            {"type":"warning","text":"PaymentGateway Pro questionnaire 15 days overdue"},
            {"type":"negative","text":"DPDP consent management not implemented — May 2027 deadline"},
            {"type":"negative","text":"RBI incident reporting workflow missing"},
        ],
        "risk_score": 42,
        "trend": "improving",
        "audit_ready_in": "~6 weeks",
        "generated_at": datetime.utcnow().isoformat(),
    }

@ai_router.get("/recommendations")
def get_recommendations(tenant_id: str = Query(default="demo")):
    return {"recommendations": [
        {"priority":1,"title":"Close Open SSH Port (0.0.0.0/0)","effort":"Low","impact":"Critical","framework":"SOC 2","control":"CC6.6","tab":"test-engine","estimated_time":"30 minutes"},
        {"priority":2,"title":"Implement DPDP Consent Management","effort":"High","impact":"Critical","framework":"DPDP","control":"Section 6","tab":"dpdp","estimated_time":"2-3 weeks"},
        {"priority":3,"title":"Set Up RBI Incident Reporting Workflow","effort":"Medium","impact":"High","framework":"RBI","control":"Incident Management","tab":"rbi","estimated_time":"1 week"},
        {"priority":4,"title":"Complete SOC 2 Evidence for CC7.x","effort":"Medium","impact":"High","framework":"SOC 2","control":"CC7.1-CC7.4","tab":"evidence","estimated_time":"3-5 days"},
        {"priority":5,"title":"Update Lodash Dependency (CVE-2021-23337)","effort":"Low","impact":"High","framework":"ISO 27001","control":"A.8.8","tab":"test-engine","estimated_time":"1 hour"},
        {"priority":6,"title":"Send Overdue Vendor Questionnaires","effort":"Low","impact":"Medium","framework":"SOC 2","control":"CC9.2","tab":"vendors","estimated_time":"30 minutes"},
    ]}

# ── Questionnaire routes ──────────────────────────────────────────────────────
q_router = APIRouter(prefix="/api/questionnaires", tags=["questionnaires"])
DEMO_QUESTIONNAIRES = [
    {"id":"q_001","title":"SOC 2 Vendor Security Assessment","description":"Comprehensive vendor security questionnaire aligned to SOC 2 Trust Service Criteria","status":"ACTIVE","questions_count":15,"responses_count":3,"created_by":"Amit Shah","created_at":(datetime.utcnow()-timedelta(days=90)).isoformat(),"frameworks":["SOC2","ISO27001"]},
    {"id":"q_002","title":"DPDP Data Processing Assessment","description":"Questionnaire for data processors under DPDP Act 2023","status":"ACTIVE","questions_count":12,"responses_count":1,"created_by":"Priya Nair","created_at":(datetime.utcnow()-timedelta(days=30)).isoformat(),"frameworks":["DPDP"]},
]
DEMO_QUESTIONS = [
    {"id":1,"section":"Access Control","question":"Do you enforce MFA for all user accounts?","type":"yes_no","required":True,"framework_ref":"SOC2 CC6.1"},
    {"id":2,"section":"Access Control","question":"How frequently do you review user access permissions?","type":"multiple_choice","options":["Monthly","Quarterly","Annually","Never"],"required":True,"framework_ref":"SOC2 CC6.3"},
    {"id":3,"section":"Data Security","question":"Is all data encrypted at rest using AES-256 or equivalent?","type":"yes_no","required":True,"framework_ref":"SOC2 CC6.7"},
    {"id":4,"section":"Data Security","question":"Is all data encrypted in transit using TLS 1.2 or higher?","type":"yes_no","required":True,"framework_ref":"SOC2 CC6.7"},
    {"id":5,"section":"Vulnerability Management","question":"How often do you perform vulnerability scans?","type":"multiple_choice","options":["Continuously","Weekly","Monthly","Quarterly","Annually"],"required":True,"framework_ref":"SOC2 CC7.1"},
    {"id":6,"section":"Vulnerability Management","question":"What is your SLA for patching critical vulnerabilities?","type":"multiple_choice","options":["24 hours","72 hours","7 days","30 days","No SLA"],"required":True,"framework_ref":"SOC2 CC7.1"},
    {"id":7,"section":"Incident Response","question":"Do you have a documented Incident Response Plan?","type":"yes_no","required":True,"framework_ref":"SOC2 CC7.4"},
    {"id":8,"section":"Incident Response","question":"When was your last incident response tabletop exercise?","type":"multiple_choice","options":["Last 6 months","Last year","2+ years ago","Never"],"required":False,"framework_ref":"SOC2 CC7.4"},
    {"id":9,"section":"Business Continuity","question":"Do you have a Business Continuity Plan?","type":"yes_no","required":True,"framework_ref":"SOC2 A1.2"},
    {"id":10,"section":"DPDP","question":"Do you have a mechanism to obtain explicit consent before collecting personal data?","type":"yes_no","required":True,"framework_ref":"DPDP Section 6"},
    {"id":11,"section":"DPDP","question":"Can data principals withdraw consent and request data deletion?","type":"yes_no","required":True,"framework_ref":"DPDP Section 13"},
    {"id":12,"section":"Compliance","question":"Are you ISO 27001 certified?","type":"yes_no","required":True,"framework_ref":"ISO27001"},
]
DEMO_RESPONSES = [
    {"id":"r_001","questionnaire_id":"q_001","respondent_name":"TechCorp Inc","respondent_email":"security@techcorp.com","status":"COMPLETED","score":82,"submitted_at":(datetime.utcnow()-timedelta(days=5)).isoformat(),"answers":12},
    {"id":"r_002","questionnaire_id":"q_001","respondent_name":"DataFlow Ltd","respondent_email":"ciso@dataflow.io","status":"IN_PROGRESS","score":None,"submitted_at":None,"answers":7},
    {"id":"r_003","questionnaire_id":"q_001","respondent_name":"CloudVendor Pro","respondent_email":"compliance@cloudvendor.com","status":"COMPLETED","score":91,"submitted_at":(datetime.utcnow()-timedelta(days=12)).isoformat(),"answers":12},
]
@q_router.get("")
def get_questionnaires(tenant_id: str = Query(default="demo")):
    return {"questionnaires": DEMO_QUESTIONNAIRES, "total": len(DEMO_QUESTIONNAIRES)}
@q_router.post("")
def create_questionnaire(body: dict = Body(...), tenant_id: str = Query(default="demo")):
    q = {"id":f"q_{secrets.token_hex(4)}","title":body.get("title"),"description":body.get("description",""),"status":"DRAFT","questions_count":12,"responses_count":0,"created_by":"Current User","created_at":datetime.utcnow().isoformat(),"frameworks":body.get("frameworks",[])}
    DEMO_QUESTIONNAIRES.append(q)
    return {"message":"Created","questionnaire":q}
@q_router.get("/{qid}/questions")
def get_questions(qid: str):
    return {"questions": DEMO_QUESTIONS, "total": len(DEMO_QUESTIONS)}
@q_router.get("/{qid}/responses")
def get_responses(qid: str):
    return {"responses": [r for r in DEMO_RESPONSES if r["questionnaire_id"]==qid]}
@q_router.post("/{qid}/send")
def send_questionnaire(qid: str, body: dict = Body(...)):
    emails = body.get("emails", [])
    return {"message":f"Sent to {len(emails)} recipients","links":[{"email":e,"link":f"https://app.aura.io/q/{qid}?token={secrets.token_urlsafe(16)}"} for e in emails]}

# ── SSO routes ────────────────────────────────────────────────────────────────
sso_router = APIRouter(prefix="/api/sso", tags=["sso"])
SSO_PROVIDERS = [
    {"id":"google","name":"Google Workspace","color":"#4285F4","connected":False,"description":"Sign in with Google accounts"},
    {"id":"microsoft","name":"Microsoft Azure AD","color":"#0078D4","connected":False,"description":"Sign in with Microsoft/Office 365"},
    {"id":"okta","name":"Okta","color":"#007DC1","connected":True,"description":"Sign in with Okta identity provider","connected_at":(datetime.utcnow()-timedelta(days=45)).isoformat()},
    {"id":"github","name":"GitHub","color":"#E2E8F0","connected":False,"description":"Sign in with GitHub accounts"},
]
@sso_router.get("/providers")
def get_providers(tenant_id: str = Query(default="demo")):
    return {"providers": SSO_PROVIDERS}
@sso_router.post("/providers/{pid}/connect")
def connect_provider(pid: str, body: dict = Body(default={}), tenant_id: str = Query(default="demo")):
    for p in SSO_PROVIDERS:
        if p["id"]==pid: p["connected"]=True; p["connected_at"]=datetime.utcnow().isoformat()
    return {"message":f"{pid} SSO connected"}
@sso_router.post("/providers/{pid}/disconnect")
def disconnect_provider(pid: str, tenant_id: str = Query(default="demo")):
    for p in SSO_PROVIDERS:
        if p["id"]==pid: p["connected"]=False
    return {"message":"Disconnected"}
