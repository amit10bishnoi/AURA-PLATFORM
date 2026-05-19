from security import SecurityHeadersMiddleware, RateLimitMiddleware, AuditLogMiddleware, get_security_status
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import init_db, SessionLocal
from models import seed_controls

from routers.auth_routes        import router as auth_router
from routers.assessment_routes  import router as assessment_router
from routers.task_routes        import router as task_router
from routers.user_routes        import router as user_router
from routers.scanner_routes     import router as scanner_router
from routers.report_routes      import router as report_router
from routers.unified_compliance_routes import router as compliance_router
from routers.integrations_routes import router as integrations_router
from routers.auto_assessment_routes import router as auto_router
from services.scheduler_service import start_scheduler, stop_scheduler
from routers.priority2_routes import router as p2_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting AURA Platform...")
    init_db()
    db = SessionLocal()
    try:
        seed_controls(db)
    finally:
        db.close()
    start_scheduler()
    print("✅ AURA Platform ready!")
    print("📍 API  → http://localhost:8000")
    print("📖 Docs → http://localhost:8000/docs")
    yield
    print("👋 Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Unified Risk & Audit Platform — Multi-Tenant",
    lifespan=lifespan,
)

# ── CORS — locked to known origins only ──────────────────────────────────
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "https://aura-platform.up.railway.app",  # production
    "https://aura.io",                        # future domain
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Tenant-ID", "X-Request-ID"],
)
# ── Security middleware stack (order matters — outermost first) ───────────
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(AuditLogMiddleware)
app.add_middleware(RateLimitMiddleware)

app.include_router(auth_router)
app.include_router(assessment_router)
app.include_router(task_router)
app.include_router(user_router)
app.include_router(scanner_router)
app.include_router(report_router)
app.include_router(compliance_router)
app.include_router(integrations_router)
app.include_router(auto_router)
from routers.advanced_routes import router as advanced_router
app.include_router(advanced_router)
# from routers.extra_compliance_routes import extra_router  # Merged into unified_compliance_routes
# app.include_router(extra_router)  # Merged into unified_compliance_routes
from routers.evidence_routes import router as evidence_router
app.include_router(evidence_router)
from routers.trust_center_routes import router as trust_router
from routers.ai_assistant_routes import ai_router, q_router, sso_router
app.include_router(trust_router)
app.include_router(p2_router)

@app.get("/")
async def root():
    return {"name": settings.APP_NAME, "version": settings.APP_VERSION,
            "status": "running", "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
# ── New: Audit Logs & Evidence ─────────────────────────────────────────────────
from routers import audit_logs_routes, evidence_routes
app.include_router(audit_logs_routes.router)
app.include_router(evidence_routes.router)

# ── Policy Management ──────────────────────────────────────────────────────────
from routers import policy_routes
app.include_router(policy_routes.router)

# ── High Priority Features ─────────────────────────────────────────────────────
from routers import vendor_routes, user_routes, notification_routes, report_routes
app.include_router(vendor_routes.router)
app.include_router(user_routes.router)
app.include_router(notification_routes.router)
app.include_router(report_routes.router)

# ── Critical Gap Features ──────────────────────────────────────────────────────
from routers import auto_evidence_routes, auditor_routes, monitoring_routes
import logging
app.include_router(auto_evidence_routes.router)
app.include_router(auditor_routes.router)
app.include_router(monitoring_routes.router)
app.include_router(ai_router)
app.include_router(q_router)
app.include_router(sso_router)

# ── Production Auth v2 ─────────────────────────────────────────────────────────
try:
    from routers.production_auth import router as auth_v2_router
    app.include_router(auth_v2_router)
    print("✅ Auth v2 loaded")
except Exception as e:
    print(f"⚠️  Auth v2 skipped: {e}")

# ── Billing (Stripe) ───────────────────────────────────────────────────────────
try:
    from routers.billing_routes import billing_router
    app.include_router(billing_router)
    print("✅ Billing loaded")
except Exception as e:
    print(f"⚠️  Billing skipped: {e}")

# ── Missing Features ───────────────────────────────────────────────────────────
try:
    from routers.missing_features import (
        access_router, comments_router, history_router,
        framework_router, onboarding_router, webhooks_router
    )
    app.include_router(access_router)
    app.include_router(comments_router)
    app.include_router(history_router)
    app.include_router(framework_router)
    app.include_router(onboarding_router)
    app.include_router(webhooks_router)
    print("✅ Missing features loaded")
except Exception as e:
    print(f"⚠️  Missing features skipped: {e}")

# ── OpenAPI / Swagger public docs ──────────────────────────────────────────────
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import HTMLResponse

@app.get("/docs/api", include_in_schema=False)
async def api_docs():
    return get_swagger_ui_html(openapi_url="/openapi.json", title="AURA Public API")

# ── Test Engine ────────────────────────────────────────────────────────────────
try:
    from routers.test_engine import router as test_engine_router
    app.include_router(test_engine_router)
    print("✅ Test Engine loaded")
except Exception as e:
    print(f"⚠️  Test Engine skipped: {e}")

# ── ISO 27001 Module ───────────────────────────────────────────────────────────
try:
    from routers.iso27001_routes import router as iso27001_router
    app.include_router(iso27001_router)
    print("✅ ISO 27001 loaded")
except Exception as e:
    print(f"⚠️  ISO 27001 skipped: {e}")

# ── RBI Compliance Center ──────────────────────────────────────────────────────
try:
    from routers.rbi_routes import router as rbi_router
    app.include_router(rbi_router)
    print("✅ RBI module loaded")
except Exception as e:
    print(f"⚠️  RBI skipped: {e}")

# ── DPDP Privacy Management ────────────────────────────────────────────────────
try:
    from routers.dpdp_routes import router as dpdp_router
    app.include_router(dpdp_router)
    print("✅ DPDP module loaded")
except Exception as e:
    print(f"⚠️  DPDP skipped: {e}")

# ── Risk Engine + Incidents ────────────────────────────────────────────────────
try:
    from routers.risk_engine import router as risk_engine_router
    app.include_router(risk_engine_router)
    print("✅ Risk Engine loaded")
except Exception as e:
    print(f"⚠️  Risk Engine skipped: {e}")

# ── Unified Control Library ────────────────────────────────────────────────────
try:
    from routers.unified_controls import router as unified_router
    app.include_router(unified_router)
    print("✅ Unified Controls loaded")
except Exception as e:
    print(f"⚠️  Unified Controls skipped: {e}")

# ── Slack Bot ──────────────────────────────────────────────────────────────────
try:
    from routers.slack_bot import router as slack_router
    app.include_router(slack_router)
    print("✅ Slack Bot loaded")
except Exception as e:
    print(f"⚠️  Slack Bot skipped: {e}")

# ── Health & Security endpoints ────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "service": "AURA Platform", "version": "2.0"}

@app.get("/api/security/status")
def security_status():
    try:
        from security import get_security_status
        return get_security_status()
    except Exception as e:
        return {"status": "active", "error": str(e)}

# ── MSP White-Label Portal ─────────────────────────────────────────────────────
try:
    from routers.msp_routes import router as msp_router
    app.include_router(msp_router)
    print("✅ MSP White-Label module loaded")
except Exception as e:
    print(f"⚠️  MSP skipped: {e}")

# ── Continuous Monitoring Checks ───────────────────────────────────────────────
try:
    from routers.continuous_checks_routes import router as checks_router
    app.include_router(checks_router)
    print("✅ Continuous checks loaded")
except Exception as e:
    print(f"⚠️  Checks skipped: {e}")

# ── Live Score Engine ──────────────────────────────────────────────────────────
@app.get("/api/scores/live")
def live_scores(tenant_id: str = "demo"):
    try:
        from services.live_score_engine import get_live_scores
        return get_live_scores(tenant_id)
    except Exception as e:
        return {"error": str(e), "overall_score": 65, "frameworks": {}}

@app.get("/api/scores/cached")
def cached_scores(tenant_id: str = "demo"):
    try:
        from services.live_score_engine import get_cached_scores
        return get_cached_scores(tenant_id)
    except Exception as e:
        return {"error": str(e), "overall_score": 65, "frameworks": {}}

# ── Email Alerts ───────────────────────────────────────────────────────────────
from fastapi import Body as FBody

@app.post("/api/alerts/test-email")
def test_email_alert(body: dict = FBody(...)):
    """Send a test alert email."""
    from services.email_alerts import alert_weekly_digest, EMAIL_ENABLED
    to = body.get("email", "")
    if not to:
        return {"error": "Email required"}
    sent = alert_weekly_digest(
        to=to,
        org_name=body.get("org_name", "Demo Corp"),
        scores={"SOC2":74,"ISO27001":68,"RBI":61,"DPDP":22},
        failed_checks=5,
        pending_evidence=3,
    )
    return {
        "sent": sent,
        "email_enabled": EMAIL_ENABLED,
        "message": "Email sent!" if sent else "Demo mode — add SMTP credentials to .env to send real emails",
        "setup_instructions": {
            "SMTP_HOST": "smtp.gmail.com",
            "SMTP_PORT": "587",
            "SMTP_USER": "your@gmail.com",
            "SMTP_PASS": "Use Gmail App Password (not your login password)",
            "ALERT_EMAIL": "ciso@yourcompany.com",
        }
    }

@app.get("/api/alerts/status")
def alert_status():
    from services.email_alerts import EMAIL_ENABLED, SMTP_HOST, SMTP_USER
    return {
        "email_enabled": EMAIL_ENABLED,
        "smtp_host": SMTP_HOST or "not configured",
        "smtp_user": SMTP_USER[:3]+"***" if SMTP_USER else "not configured",
        "to_enable": "Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALERT_EMAIL to .env",
    }
