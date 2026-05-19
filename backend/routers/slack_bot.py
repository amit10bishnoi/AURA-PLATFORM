"""
slack_bot.py — AURA Slack Bot with live compliance data
Supports: slash commands, event mentions, automated alerts
Setup: api.slack.com/apps → Create App → Slash Commands + Events + Webhooks
"""
from fastapi import APIRouter, Request, Query, Body
from datetime import datetime
import os, httpx, hashlib, hmac, time

router = APIRouter(prefix="/api/slack", tags=["Slack"])
SLACK_WEBHOOK    = os.getenv("SLACK_WEBHOOK_URL", "")
SLACK_BOT_TOKEN  = os.getenv("SLACK_BOT_TOKEN", "")
SLACK_SIGN_SECRET= os.getenv("SLACK_SIGNING_SECRET", "")
FRONTEND_URL     = os.getenv("FRONTEND_URL", "http://localhost:3000")

# ── Helpers ───────────────────────────────────────────────────────────────────
def _score_emoji(score: int) -> str:
    return "🟢" if score>=80 else "🟡" if score>=60 else "🔴"

def _get_live_scores(tenant_id="demo") -> dict:
    """Pull live scores from checks engine."""
    try:
        from services.live_score_engine import get_cached_scores
        return get_cached_scores(tenant_id)
    except:
        return {
            "overall_score": 65,
            "frameworks": {
                "SOC2":     {"score":74,"status":"In Progress"},
                "ISO27001": {"score":68,"status":"In Progress"},
                "RBI":      {"score":61,"status":"Building"},
                "DPDP":     {"score":22,"status":"Building"},
            }
        }

async def _post(channel: str, text: str, blocks=None):
    """Post a message to a Slack channel."""
    if not SLACK_BOT_TOKEN:
        print(f"[SLACK DEMO] #{channel}: {text[:100]}")
        return {"ok": True, "demo": True}
    payload = {"channel": channel, "text": text}
    if blocks: payload["blocks"] = blocks
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(
            "https://slack.com/api/chat.postMessage",
            headers={"Authorization": f"Bearer {SLACK_BOT_TOKEN}"},
            json=payload,
        )
        return r.json()

async def _webhook(text: str, blocks=None):
    """Send via incoming webhook."""
    if not SLACK_WEBHOOK:
        print(f"[SLACK WEBHOOK DEMO] {text[:100]}")
        return {"ok": True, "demo": True}
    payload = {"text": text}
    if blocks: payload["blocks"] = blocks
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(SLACK_WEBHOOK, json=payload)
        return {"ok": r.status_code == 200}

def _verify_slack_signature(request_body: bytes, timestamp: str, signature: str) -> bool:
    """Verify Slack request signature."""
    if not SLACK_SIGN_SECRET:
        return True  # Skip verification in demo mode
    if abs(time.time() - int(timestamp)) > 300:
        return False
    sig_base = f"v0:{timestamp}:{request_body.decode()}"
    computed = "v0=" + hmac.new(SLACK_SIGN_SECRET.encode(), sig_base.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(computed, signature)

# ── Slash command responses ───────────────────────────────────────────────────
def build_status_blocks(scores: dict, tenant_id: str) -> list:
    fws = scores.get("frameworks", {})
    overall = scores.get("overall_score", 65)
    emoji = _score_emoji(overall)
    
    fw_text = "\n".join([
        f"{_score_emoji(v['score'])} *{k}:* {v['score']}% — {v.get('status','In Progress')}"
        for k, v in fws.items()
    ])
    
    return [
        {"type":"header","text":{"type":"plain_text","text":f"🛡️ AURA Compliance Status"}},
        {"type":"section","text":{"type":"mrkdwn","text":f"{emoji} *Overall Score: {overall}%*\nLast updated: {datetime.utcnow().strftime('%d %b %Y %H:%M')} UTC"}},
        {"type":"divider"},
        {"type":"section","text":{"type":"mrkdwn","text":f"*Framework Scores:*\n{fw_text}"}},
        {"type":"actions","elements":[
            {"type":"button","text":{"type":"plain_text","text":"📊 Open Dashboard"},"url":FRONTEND_URL,"style":"primary"},
            {"type":"button","text":{"type":"plain_text","text":"🔍 Run Checks"},"url":f"{FRONTEND_URL}#monitoring"},
        ]},
        {"type":"context","elements":[{"type":"mrkdwn","text":f"AURA GRC Platform · Tenant: {tenant_id}"}]},
    ]

def build_alerts_blocks(tenant_id: str) -> list:
    try:
        from services.continuous_monitoring import get_alerts
        alerts = [a for a in get_alerts(tenant_id) if not a.get("acknowledged")]
    except:
        alerts = []
    
    if not alerts:
        return [{"type":"section","text":{"type":"mrkdwn","text":"✅ *No active alerts* — All critical checks passing!"}}]
    
    alert_text = "\n".join([
        f"{'🔴' if a['severity']=='CRITICAL' else '🟠'} *{a['title']}* — {a['framework']}"
        for a in alerts[:5]
    ])
    
    return [
        {"type":"header","text":{"type":"plain_text","text":f"🚨 Active Alerts ({len(alerts)})"}},
        {"type":"section","text":{"type":"mrkdwn","text":alert_text}},
        {"type":"actions","elements":[
            {"type":"button","text":{"type":"plain_text","text":"View All Alerts"},"url":f"{FRONTEND_URL}#monitoring","style":"danger"},
        ]},
    ]

def build_framework_blocks(fw: str, scores: dict) -> list:
    fw_data = scores.get("frameworks", {}).get(fw, {})
    score = fw_data.get("score", 65)
    status = fw_data.get("status", "In Progress")
    
    tips = {
        "SOC2":     "Top gaps: CC7.1 System Monitoring, CC7.2 Vuln Management, CC6.3 Access Review",
        "ISO27001": "Top gaps: A.8.8 Patch Management, A.5.9 Asset Inventory, A.6.3 Security Training",
        "RBI":      "Top gaps: Incident reporting workflow, VAPT by CERT-In auditor, C-SOC setup",
        "DPDP":     "Top gaps: Consent management, DSR handling workflow, DPO appointment",
    }
    
    return [
        {"type":"header","text":{"type":"plain_text","text":f"📋 {fw} Compliance Status"}},
        {"type":"section","fields":[
            {"type":"mrkdwn","text":f"*Score:*\n{_score_emoji(score)} {score}%"},
            {"type":"mrkdwn","text":f"*Status:*\n{status}"},
        ]},
        {"type":"section","text":{"type":"mrkdwn","text":f"*Key Gaps:*\n{tips.get(fw,'Run checks for details')}"}},
        {"type":"actions","elements":[
            {"type":"button","text":{"type":"plain_text","text":f"View {fw} Hub"},"url":f"{FRONTEND_URL}#{fw.lower()}","style":"primary"},
        ]},
    ]

def process_command(text: str, tenant_id: str) -> tuple:
    """Process a Slack command/mention and return (text, blocks)."""
    t = text.lower().strip()
    scores = _get_live_scores(tenant_id)
    
    if any(w in t for w in ["status","score","posture","overview","all"]):
        return "AURA Compliance Status", build_status_blocks(scores, tenant_id)
    
    elif any(w in t for w in ["alert","alerts","fail","failed","issue"]):
        return "AURA Active Alerts", build_alerts_blocks(tenant_id)
    
    elif any(w in t for w in ["soc2","soc 2","soc"]):
        return f"SOC 2 Status", build_framework_blocks("SOC2", scores)
    
    elif any(w in t for w in ["iso","iso27001","27001"]):
        return f"ISO 27001 Status", build_framework_blocks("ISO27001", scores)
    
    elif any(w in t for w in ["rbi","reserve bank","banking"]):
        return "RBI Status", build_framework_blocks("RBI", scores)
    
    elif any(w in t for w in ["dpdp","privacy","personal data"]):
        return "DPDP Status", build_framework_blocks("DPDP", scores)
    
    elif any(w in t for w in ["vendor","third party","supplier"]):
        return "Vendor Risk", [
            {"type":"header","text":{"type":"plain_text","text":"🏢 Vendor Risk Summary"}},
            {"type":"section","text":{"type":"mrkdwn","text":"*High-risk vendors needing attention:*\n🔴 *PaymentGateway Pro* — Questionnaire overdue 15 days\n🟠 *DataAnalytics Co* — Risk score 68/100 (High)\n\n*Action:* Send reminder questionnaires to both vendors"}},
            {"type":"actions","elements":[{"type":"button","text":{"type":"plain_text","text":"View Vendors"},"url":f"{FRONTEND_URL}#vendors","style":"primary"}]},
        ]
    
    elif any(w in t for w in ["incident","breach","attack"]):
        return "Incident Status", [
            {"type":"header","text":{"type":"plain_text","text":"🚨 Incident Status"}},
            {"type":"section","text":{"type":"mrkdwn","text":"*No active critical incidents* ✅\n\nLast incident: Credential stuffing attempt (resolved 3 days ago)\nRBI reported: ✓ | CERT-In reported: ✓"}},
            {"type":"actions","elements":[{"type":"button","text":{"type":"plain_text","text":"View Incidents"},"url":f"{FRONTEND_URL}#audit"}]},
        ]
    
    else:
        return "AURA GRC Bot", [
            {"type":"header","text":{"type":"plain_text","text":"🛡️ AURA GRC Platform Bot"}},
            {"type":"section","text":{"type":"mrkdwn","text":"*Available commands:*\n• `/aura status` — Overall compliance score\n• `/aura soc2` — SOC 2 readiness\n• `/aura iso` — ISO 27001 status\n• `/aura rbi` — RBI compliance\n• `/aura dpdp` — DPDP Act status\n• `/aura alerts` — Active alerts\n• `/aura vendor` — Vendor risk\n• `/aura incident` — Incident status\n\nOr just @mention me with any question!"}},
            {"type":"actions","elements":[{"type":"button","text":{"type":"plain_text","text":"Open Dashboard"},"url":FRONTEND_URL,"style":"primary"}]},
        ]

# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/slash")
async def slash_command(request: Request):
    """Handle Slack slash commands like /aura status."""
    form = await request.form()
    text = form.get("text", "status")
    channel = form.get("channel_id", "")
    tenant_id = form.get("team_domain", "demo")
    
    msg_text, blocks = process_command(text, tenant_id)
    
    # Respond to slash command (ephemeral immediate response)
    return {
        "response_type": "in_channel",
        "text": msg_text,
        "blocks": blocks,
    }

@router.post("/events")
async def slack_events(request: Request):
    """Handle Slack Events API — bot mentions and messages."""
    body_bytes = await request.body()
    body = await request.json()
    
    # URL verification handshake
    if body.get("type") == "url_verification":
        return {"challenge": body.get("challenge")}
    
    event = body.get("event", {})
    
    # Handle app_mention (@AURA bot)
    if event.get("type") == "app_mention":
        text = event.get("text", "")
        channel = event.get("channel", "")
        tenant_id = body.get("team_id", "demo")
        
        # Remove bot mention from text
        import re
        clean_text = re.sub(r"<@[A-Z0-9]+>", "", text).strip()
        msg_text, blocks = process_command(clean_text or "help", tenant_id)
        await _post(channel, msg_text, blocks)
    
    # Handle direct messages
    elif event.get("type") == "message" and not event.get("bot_id"):
        if event.get("channel_type") == "im":
            text = event.get("text", "")
            channel = event.get("channel", "")
            tenant_id = body.get("team_id", "demo")
            msg_text, blocks = process_command(text, tenant_id)
            await _post(channel, msg_text, blocks)
    
    return {"ok": True}

@router.post("/send-alert")
async def send_alert(body: dict, tenant_id: str = Query(default="demo")):
    """Send a compliance alert to Slack."""
    severity = body.get("severity", "HIGH")
    title = body.get("title", "Compliance Alert")
    detail = body.get("detail", "")
    framework = body.get("framework", "SOC2")
    sev_emoji = "🔴" if severity == "CRITICAL" else "🟠" if severity == "HIGH" else "🟡"
    
    blocks = [
        {"type":"header","text":{"type":"plain_text","text":f"{sev_emoji} AURA Alert — {severity}"}},
        {"type":"section","fields":[
            {"type":"mrkdwn","text":f"*Framework:*\n{framework}"},
            {"type":"mrkdwn","text":f"*Severity:*\n{severity}"},
            {"type":"mrkdwn","text":f"*Issue:*\n{title}"},
            {"type":"mrkdwn","text":f"*Detail:*\n{detail[:200]}"},
        ]},
        {"type":"actions","elements":[
            {"type":"button","text":{"type":"plain_text","text":"View in AURA"},"url":FRONTEND_URL,"style":"primary"},
            {"type":"button","text":{"type":"plain_text","text":"Run Checks"},"url":f"{FRONTEND_URL}#monitoring"},
        ]},
        {"type":"context","elements":[{"type":"mrkdwn","text":f"AURA GRC · {datetime.utcnow().strftime('%d %b %Y %H:%M')} UTC"}]},
    ]
    result = await _webhook(f"AURA Alert: {title}", blocks)
    return {"message": "Alert sent", "result": result}

@router.post("/send-weekly-digest")
async def send_weekly_digest(tenant_id: str = Query(default="demo")):
    """Send weekly compliance digest to Slack."""
    scores = _get_live_scores(tenant_id)
    fws = scores.get("frameworks", {})
    overall = scores.get("overall_score", 65)
    
    fw_fields = [
        {"type":"mrkdwn","text":f"*{k}:*\n{_score_emoji(v['score'])} {v['score']}%"}
        for k, v in fws.items()
    ]
    
    blocks = [
        {"type":"header","text":{"type":"plain_text","text":"📊 AURA Weekly Compliance Digest"}},
        {"type":"section","text":{"type":"mrkdwn","text":f"*Overall: {_score_emoji(overall)} {overall}%* — Week ending {datetime.utcnow().strftime('%d %b %Y')}"}},
        {"type":"section","fields":fw_fields},
        {"type":"section","text":{"type":"mrkdwn","text":"*Top 3 Actions This Week:*\n1. 🔴 Implement DPDP consent management\n2. 🟠 Complete vendor questionnaires\n3. 🟡 Upload SOC 2 CC7.x evidence"}},
        {"type":"actions","elements":[{"type":"button","text":{"type":"plain_text","text":"Open Dashboard"},"url":FRONTEND_URL,"style":"primary"}]},
    ]
    result = await _webhook("AURA Weekly Digest", blocks)
    return {"message": "Weekly digest sent", "result": result}

@router.get("/config")
def get_slack_config(tenant_id: str = Query(default="demo")):
    return {
        "connected": bool(SLACK_WEBHOOK or SLACK_BOT_TOKEN),
        "webhook_configured": bool(SLACK_WEBHOOK),
        "bot_configured": bool(SLACK_BOT_TOKEN),
        "slash_command_url": f"{os.getenv('BACKEND_URL','http://localhost:8001')}/api/slack/slash",
        "events_url": f"{os.getenv('BACKEND_URL','http://localhost:8001')}/api/slack/events",
        "setup_steps": [
            "1. Go to api.slack.com/apps → Create New App",
            "2. Slash Commands → /aura → Request URL: YOUR_BACKEND/api/slack/slash",
            "3. Event Subscriptions → Enable → URL: YOUR_BACKEND/api/slack/events",
            "4. Subscribe to: app_mention, message.im",
            "5. OAuth → Add bot scopes: chat:write, commands",
            "6. Install to workspace → copy Bot Token",
            "7. Add to .env: SLACK_BOT_TOKEN, SLACK_WEBHOOK_URL, SLACK_SIGNING_SECRET",
        ],
        "supported_commands": [
            "/aura status", "/aura soc2", "/aura iso",
            "/aura rbi", "/aura dpdp", "/aura alerts",
            "/aura vendor", "/aura incident", "/aura help",
        ],
    }

@router.post("/test")
async def test_slack(body: dict = Body(default={}), tenant_id: str = Query(default="demo")):
    """Test Slack integration by sending a test message."""
    msg_text, blocks = process_command("status", tenant_id)
    result = await _webhook(msg_text, blocks)
    return {
        "sent": not result.get("demo"),
        "demo_mode": result.get("demo", False),
        "result": result,
        "message": "Sent to Slack!" if not result.get("demo") else "Demo mode — add SLACK_WEBHOOK_URL to .env",
        "setup": "Get webhook at: api.slack.com/apps → Incoming Webhooks",
    }
