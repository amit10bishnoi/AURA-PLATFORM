"""
AURA Platform — main.py
MongoDB edition: SQLAlchemy/SQLite fully replaced with Motor/MongoDB
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Body as FBody
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import connect_db, disconnect_db

log = logging.getLogger("aura")

# ── Lifespan (replaces the old SQLAlchemy init_db + seed_controls) ────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting AURA Platform (MongoDB edition)...")
    await connect_db()          # connects Motor, creates indexes, seeds demo data
    try:
        from services.scheduler_service import start_scheduler
        start_scheduler()
        print("✅ Scheduler started")
    except Exception as e:
        print(f"⚠️  Scheduler skipped: {e}")
    print("✅ AURA Platform ready!")
    print("📍 API  → http://localhost:8000")
    print("📖 Docs → http://localhost:8000/docs")
    yield
    await disconnect_db()
    print("👋 Shutting down AURA Platform")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Unified Risk & Audit Platform — Multi-Tenant (MongoDB)",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "https://aura-platform.up.railway.app",
    "https://aura-platform-swart.vercel.app",
    "https://auragrc.in",
    "https://www.auragrc.in",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Tenant-ID", "X-Request-ID"],
)

# ── Security middleware ───────────────────────────────────────────────────────
try:
    from security import SecurityHeadersMiddleware, AuditLogMiddleware, RateLimitMiddleware
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(AuditLogMiddleware)
    app.add_middleware(RateLimitMiddleware)
    print("✅ Security middleware loaded")
except Exception as e:
    print(f"⚠️  Security middleware skipped: {e}")

# ── Core routers (fully MongoDB-native) ───────────────────────────────────────

from routers.auth_routes import router as auth_router
app.include_router(auth_router)

# ── Optional routers (may still use SQLAlchemy — wrapped in try/except) ───────

def _try_router(import_path: str, attr: str, label: str, prefix: str = ""):
    try:
        import importlib
        mod = importlib.import_module(import_path)
        r = getattr(mod, attr)
        app.include_router(r)
        print(f"✅ {label} loaded")
    except Exception as e:
        print(f"⚠️  {label} skipped: {e}")


_try_router("routers.assessment_routes",        "router", "Assessment routes")
_try_router("routers.task_routes",              "router", "Task routes")
_try_router("routers.user_routes",              "router", "User routes")
_try_router("routers.scanner_routes",           "router", "Scanner routes")
_try_router("routers.report_routes",            "router", "Report routes")
_try_router("routers.unified_compliance_routes","router", "Compliance routes")
_try_router("routers.integrations_routes",      "router", "Integrations routes")
_try_router("routers.auto_assessment_routes",   "router", "Auto-assessment routes")
_try_router("routers.priority2_routes",         "router", "Priority-2 routes")
_try_router("routes_automation",                "router", "Automation Hub routes")
_try_router("routers.advanced_routes",          "router", "Advanced routes")
_try_router("routers.evidence_routes",          "router", "Evidence routes")
_try_router("routers.trust_center_routes",      "router", "Trust Center routes")
_try_router("routers.audit_logs_routes",        "router", "Audit Logs routes")
_try_router("routers.policy_routes",            "router", "Policy routes")
_try_router("routers.vendor_routes",            "router", "Vendor routes")
_try_router("routers.notification_routes",      "router", "Notification routes")
_try_router("routers.auto_evidence_routes",     "router", "Auto-Evidence routes")
_try_router("routers.auditor_routes",           "router", "Auditor routes")
_try_router("routers.monitoring_routes",        "router", "Monitoring routes")
_try_router("routers.iso27001_routes",          "router", "ISO 27001 routes")
_try_router("routers.rbi_routes",               "router", "RBI routes")
_try_router("routers.dpdp_routes",              "router", "DPDP routes")
_try_router("routers.risk_engine",              "router", "Risk Engine routes")
_try_router("routers.unified_controls",         "router", "Unified Controls routes")
_try_router("routers.slack_bot",                "router", "Slack Bot routes")
_try_router("routers.msp_routes",               "router", "MSP routes")
_try_router("routers.continuous_checks_routes", "router", "Continuous Checks routes")
_try_router("routers.production_auth",          "router", "Auth v2 routes")
_try_router("routers.billing_routes",           "billing_router", "Billing routes")
_try_router("routers.test_engine",              "router", "Test Engine routes")

# AI routers
try:
    from routers.ai_assistant_routes import ai_router, q_router, sso_router
    app.include_router(ai_router)
    app.include_router(q_router)
    app.include_router(sso_router)
    print("✅ AI Assistant routes loaded")
except Exception as e:
    print(f"⚠️  AI Assistant routes skipped: {e}")

# Missing features bundle
try:
    from routers.missing_features import (
        access_router, comments_router, history_router,
        framework_router, onboarding_router, webhooks_router
    )
    for r in [access_router, comments_router, history_router,
              framework_router, onboarding_router, webhooks_router]:
        app.include_router(r)
    print("✅ Missing features loaded")
except Exception as e:
    print(f"⚠️  Missing features skipped: {e}")

# ── Health & utility endpoints ────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "database": "MongoDB",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    from database import get_client
    try:
        await get_client().admin.command("ping")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {e}"
    return {
        "status": "ok",
        "service": "AURA Platform",
        "version": "2.0",
        "database": db_status,
    }


@app.get("/api/security/status")
def security_status():
    try:
        from security import get_security_status
        return get_security_status()
    except Exception as e:
        return {"status": "active", "error": str(e)}


@app.get("/api/scores/live")
async def live_scores(tenant_id: str = "demo"):
    try:
        from services.live_score_engine import get_live_scores
        return get_live_scores(tenant_id)
    except Exception:
        # Fallback: pull from MongoDB compliance_results
        from database import compliance_results, assessments
        latest = await assessments().find_one(
            {"tenant_id": tenant_id}, sort=[("created_at", -1)]
        )
        if not latest:
            return {"overall_score": 65, "frameworks": {}}
        results = await compliance_results().find(
            {"assessment_id": latest["_id"]}
        ).to_list(length=20)
        fw = {r["framework"]: r["score"] for r in results}
        overall = round(sum(fw.values()) / len(fw), 1) if fw else 65
        return {"overall_score": overall, "frameworks": fw, "tenant_id": tenant_id}


@app.get("/api/scores/cached")
async def cached_scores(tenant_id: str = "demo"):
    return await live_scores(tenant_id)


@app.post("/api/alerts/test-email")
def test_email_alert(body: dict = FBody(...)):
    try:
        from services.email_alerts import alert_weekly_digest, EMAIL_ENABLED
        to = body.get("email", "")
        if not to:
            return {"error": "Email required"}
        sent = alert_weekly_digest(
            to=to,
            org_name=body.get("org_name", "Demo Corp"),
            scores={"SOC2": 74, "ISO27001": 68, "RBI": 61, "DPDP": 22},
            failed_checks=5,
            pending_evidence=3,
        )
        return {"sent": sent, "email_enabled": EMAIL_ENABLED}
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/alerts/status")
def alert_status():
    try:
        from services.email_alerts import EMAIL_ENABLED, SMTP_HOST, SMTP_USER
        return {
            "email_enabled": EMAIL_ENABLED,
            "smtp_host": SMTP_HOST or "not configured",
            "smtp_user": SMTP_USER[:3] + "***" if SMTP_USER else "not configured",
        }
    except Exception as e:
        return {"error": str(e)}


# ── OpenAPI public docs ───────────────────────────────────────────────────────
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import HTMLResponse

@app.get("/docs/api", include_in_schema=False)
async def api_docs():
    return get_swagger_ui_html(openapi_url="/openapi.json", title="AURA Public API")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)