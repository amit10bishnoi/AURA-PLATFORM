from fastapi import APIRouter, Request, Query
from datetime import datetime
import os, httpx

router = APIRouter(prefix="/api/slack", tags=["slack"])
SLACK_WEBHOOK = os.getenv("SLACK_WEBHOOK_URL", "")
SLACK_BOT_TOKEN = os.getenv("SLACK_BOT_TOKEN", "")

async def send_slack_message(text: str, blocks=None):
    if not SLACK_WEBHOOK:
        print(f"[SLACK] Would send: {text[:80]}")
        return {"ok": True, "demo": True}
    payload = {"text": text}
    if blocks: payload["blocks"] = blocks
    async with httpx.AsyncClient() as client:
        resp = await client.post(SLACK_WEBHOOK, json=payload)
        return {"ok": resp.status_code==200}

@router.post("/send-alert")
async def send_alert(body: dict, tenant_id: str = Query(...)):
    severity = body.get("severity","HIGH")
    title = body.get("title","Compliance Alert")
    detail = body.get("detail","")
    framework = body.get("framework","SOC2")
    color = "#e11d48" if severity=="CRITICAL" else "#ea580c" if severity=="HIGH" else "#d97706"
    blocks = [
        {"type":"header","text":{"type":"plain_text","text":f"🚨 AURA Alert — {severity}"}},
        {"type":"section","fields":[
            {"type":"mrkdwn","text":f"*Framework:*\n{framework}"},
            {"type":"mrkdwn","text":f"*Severity:*\n{severity}"},
            {"type":"mrkdwn","text":f"*Issue:*\n{title}"},
            {"type":"mrkdwn","text":f"*Detail:*\n{detail}"},
        ]},
        {"type":"actions","elements":[
            {"type":"button","text":{"type":"plain_text","text":"View in AURA"},"url":os.getenv("FRONTEND_URL","http://localhost:3000"),"style":"primary"},
            {"type":"button","text":{"type":"plain_text","text":"Run Checks"},"url":f"{os.getenv('FRONTEND_URL','http://localhost:3000')}/index.html#test-engine"},
        ]},
        {"type":"context","elements":[{"type":"mrkdwn","text":f"Sent by AURA · {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC"}]}
    ]
    result = await send_slack_message(f"AURA Alert: {title}", blocks)
    return {"message":"Alert sent","result":result}

@router.post("/send-weekly-digest")
async def send_weekly_digest(tenant_id: str = Query(...)):
    blocks = [
        {"type":"header","text":{"type":"plain_text","text":"📊 AURA Weekly Compliance Digest"}},
        {"type":"section","text":{"type":"mrkdwn","text":"Here's your compliance posture for the week:"}},
        {"type":"section","fields":[
            {"type":"mrkdwn","text":"*Overall Risk Score:*\n🟡 42/100 (Medium)"},
            {"type":"mrkdwn","text":"*ISO 27001:*\n🟢 68% compliant"},
            {"type":"mrkdwn","text":"*SOC 2:*\n🟡 74% compliant"},
            {"type":"mrkdwn","text":"*RBI CSF:*\n🟡 61% compliant"},
            {"type":"mrkdwn","text":"*DPDP:*\n🔴 15% compliant"},
            {"type":"mrkdwn","text":"*Open Risks:*\n🔴 10 (3 Critical)"},
        ]},
        {"type":"section","text":{"type":"mrkdwn","text":"*Top 3 Actions This Week:*\n1. 🔴 Fix open SSH port on sg-web-servers\n2. 🔴 Appoint Data Protection Officer (DPO)\n3. 🟡 Complete PaymentGateway Pro vendor review"}},
        {"type":"actions","elements":[{"type":"button","text":{"type":"plain_text","text":"Open AURA Dashboard"},"url":os.getenv("FRONTEND_URL","http://localhost:3000"),"style":"primary"}]},
    ]
    result = await send_slack_message("AURA Weekly Digest", blocks)
    return {"message":"Weekly digest sent","result":result}

@router.post("/events")
async def slack_events(request: Request):
    body = await request.json()
    if body.get("type") == "url_verification":
        return {"challenge": body.get("challenge")}
    event = body.get("event",{})
    if event.get("type") == "message" and not event.get("bot_id"):
        text = event.get("text","").lower()
        channel = event.get("channel")
        response_text = ""
        if "score" in text or "risk" in text:
            response_text = "📊 *Current AURA Risk Score: 42/100 (Medium)*\n• ISO 27001: 68% • SOC 2: 74% • RBI: 61% • DPDP: 15%\n• 10 open risks, 3 critical"
        elif "iso" in text:
            response_text = "🛡️ *ISO 27001 Status: 68% (34/50 controls)*\n• 4 themes tracked • 8 weeks to audit-ready\n• Critical gap: A.5.9 Asset Inventory"
        elif "soc" in text:
            response_text = "📋 *SOC 2 Status: 74% (20/40 controls)*\n• 5 TSC categories • 4 weeks to audit-ready\n• Blockers: CC7.5, CC3.3, P5.1"
        elif "rbi" in text:
            response_text = "🏛️ *RBI Compliance: 61% (16/26 controls)*\n• Critical: CERT-In 6-hour reporting not automated\n• Due: Annual VAPT by CERT-In firm"
        elif "dpdp" in text:
            response_text = "🔒 *DPDP Status: 15% (3/20 obligations)*\n• Deadline: May 2027\n• URGENT: No DPO appointed, No consent withdrawal mechanism"
        elif "incident" in text:
            response_text = "🚨 *Open Incidents: 2*\n• CRITICAL: PII exposed in logs (INC-002) — reported to RBI ✓\n• HIGH: Credential stuffing attack (INC-001) — under investigation"
        elif "vendor" in text:
            response_text = "🏢 *Vendor Risk: 2 critical vendors*\n• PaymentGateway Pro: Questionnaire overdue 45 days\n• DataAnalytics Co: Risk score 68 (High)"
        else:
            response_text = "👋 Hi! I'm AURA Bot. Ask me about:\n• `risk score` — Overall compliance posture\n• `iso 27001` — ISO certification status\n• `soc 2` — SOC 2 readiness\n• `rbi` — RBI compliance status\n• `dpdp` — DPDP obligations\n• `incident` — Active incidents\n• `vendor` — Vendor risk status"
        if response_text and SLACK_BOT_TOKEN:
            async with httpx.AsyncClient() as client:
                await client.post("https://slack.com/api/chat.postMessage",headers={"Authorization":f"Bearer {SLACK_BOT_TOKEN}"},json={"channel":channel,"text":response_text})
    return {"ok":True}

@router.get("/config")
def get_slack_config(tenant_id: str = Query(...)):
    return {"connected":bool(SLACK_WEBHOOK),"webhook_configured":bool(SLACK_WEBHOOK),"bot_configured":bool(SLACK_BOT_TOKEN),"setup_steps":["Go to api.slack.com/apps","Create new app","Add Incoming Webhooks","Add bot with chat:write permission","Set SLACK_WEBHOOK_URL and SLACK_BOT_TOKEN in .env","Point Event Subscriptions to: /api/slack/events"],"commands":["risk score","iso 27001","soc 2","rbi","dpdp","incident","vendor"]}
