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

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
app.include_router(auto_evidence_routes.router)
app.include_router(auditor_routes.router)
app.include_router(monitoring_routes.router)
