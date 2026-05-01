"""
priority2_routes.py — Priority 2 API Endpoints
Place at: backend/routers/priority2_routes.py

Endpoints:
  POST /api/p2/remediation-advice     — LLM-powered step-by-step remediation
  POST /api/p2/executive-summary      — Board-ready AI summary
  POST /api/p2/test-email             — Test email configuration
  POST /api/p2/send-alert             — Manually trigger score drop alert
  GET  /api/p2/scheduler/status       — Check scheduler status
  POST /api/p2/scheduler/trigger      — Manually run weekly job now
  GET  /api/p2/status                 — All Priority 2 feature status

Wire in main.py:
  from routers.priority2_routes import router as p2_router
  app.include_router(p2_router)
"""

import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import Assessment, Task

router = APIRouter(prefix="/api/p2", tags=["Priority 2 — AI + Alerts + Scheduler"])


class RemediationRequest(BaseModel):
    findings: List[Dict[str, Any]]
    org_name: str
    industry: str = "Technology"
    employees: int = 100


class ExecutiveSummaryRequest(BaseModel):
    org_name: str
    risk_score: float
    risk_level: str
    industry: str = "Technology"
    top_findings: List[Dict[str, Any]] = []
    implemented_controls: int = 0
    total_controls: int = 199


class TestEmailRequest(BaseModel):
    to_email: str
    org_name: str = "Test Organisation"


class AlertRequest(BaseModel):
    to_email: str
    org_name: str
    previous_score: float
    new_score: float
    risk_level: str = "HIGH"
    findings: List[Dict[str, Any]] = []


@router.post("/remediation-advice", summary="Get AI-powered remediation steps")
def get_remediation_advice(
    req: RemediationRequest,
    _=Depends(get_current_user),
):
    """
    Returns specific, step-by-step remediation instructions for each finding.
    Uses Claude API if ANTHROPIC_API_KEY is set, otherwise uses smart templates.
    """
    from services.llm_service import get_remediation_advice, LLM_ENABLED

    if not req.findings:
        raise HTTPException(status_code=400, detail="No findings provided")

    advice = get_remediation_advice(
        findings=req.findings,
        org_name=req.org_name,
        industry=req.industry,
        employees=req.employees,
    )

    return {
        "org_name": req.org_name,
        "generated_at": (datetime.utcnow() + timedelta(hours=5, minutes=30)).strftime('%Y-%m-%dT%H:%M:%S IST'),
        "source": "claude-ai" if LLM_ENABLED else "smart-template",
        "model": "claude-sonnet-4-20250514" if LLM_ENABLED else "template-engine-v2",
        "advice_count": len(advice),
        "advice": advice,
    }


@router.post("/executive-summary", summary="Generate board-ready executive summary")
def get_executive_summary(
    req: ExecutiveSummaryRequest,
    _=Depends(get_current_user),
):
    """Generates a non-technical board-level summary of the security posture."""
    from services.llm_service import get_executive_summary, LLM_ENABLED

    summary = get_executive_summary(
        org_name=req.org_name,
        risk_score=req.risk_score,
        risk_level=req.risk_level,
        industry=req.industry,
        top_findings=req.top_findings,
        implemented_controls=req.implemented_controls,
        total_controls=req.total_controls,
    )

    return {
        "org_name": req.org_name,
        "generated_at": (datetime.utcnow() + timedelta(hours=5, minutes=30)).strftime('%Y-%m-%dT%H:%M:%S IST'),
        "source": "claude-ai" if LLM_ENABLED else "smart-template",
        "executive_summary": summary,
    }


@router.post("/test-email", summary="Send a test email to verify SMTP configuration")
def send_test_email(
    req: TestEmailRequest,
    _=Depends(get_current_user),
):
    """Sends a test email. Works in simulation mode even without SMTP config."""
    from services.email_service import send_weekly_summary, EMAIL_ENABLED

    result = send_weekly_summary(
        to_email=req.to_email,
        org_name=req.org_name,
        assessment_count=5,
        avg_score=72.0,
        risk_level="HIGH",
        open_tasks=8,
        completed_tasks=12,
        critical_findings=2,
    )

    return {
        "email_enabled": EMAIL_ENABLED,
        "mode": "LIVE" if EMAIL_ENABLED else "SIMULATED",
        "result": result,
        "message": "Email sent!" if result.get("sent") else
                   "Simulated (no SMTP config) — set SMTP_USER + SMTP_PASSWORD in .env to send real emails",
        "to_enable": "Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD in .env file",
    }


@router.post("/send-alert", summary="Manually trigger a score drop alert email")
def send_alert(
    req: AlertRequest,
    _=Depends(get_current_user),
):
    """Manually sends a risk score drop alert email."""
    from services.email_service import send_score_drop_alert

    result = send_score_drop_alert(
        to_email=req.to_email,
        org_name=req.org_name,
        previous_score=req.previous_score,
        new_score=req.new_score,
        risk_level=req.risk_level,
        top_findings=req.findings[:5],
    )
    return result


@router.get("/scheduler/status", summary="Check weekly scheduler status")
def get_scheduler_status(_=Depends(get_current_user)):
    """Returns whether the weekly scheduler is running."""
    try:
        from services.scheduler_service import _scheduler, SCHEDULER_ENABLED, SCHEDULER_AVAILABLE
        running = _scheduler is not None and hasattr(_scheduler, "running") and _scheduler.running
        jobs = []
        if running and _scheduler:
            for job in _scheduler.get_jobs():
                jobs.append({
                    "id": job.id,
                    "name": job.name,
                    "next_run": str(job.next_run_time) if job.next_run_time else "Not scheduled",
                })
        return {
            "scheduler_available": SCHEDULER_AVAILABLE,
            "scheduler_enabled": SCHEDULER_ENABLED,
            "running": running,
            "jobs": jobs,
            "install_command": "pip install apscheduler" if not SCHEDULER_AVAILABLE else None,
        }
    except Exception as e:
        return {"running": False, "error": str(e)}


@router.post("/scheduler/trigger", summary="Manually trigger the weekly assessment job now")
def trigger_scheduler(_=Depends(get_current_user)):
    """Runs the weekly assessment job immediately without waiting for Monday."""
    try:
        from services.scheduler_service import trigger_now
        trigger_now()
        return {
            "triggered": True,
            "message": "Weekly assessment job triggered. Check server logs for progress.",
            "ran_at": (datetime.utcnow() + timedelta(hours=5, minutes=30)).strftime('%Y-%m-%dT%H:%M:%S IST'),
        }
    except Exception as e:
        return {"triggered": False, "error": str(e)}


@router.get("/status", summary="Priority 2 feature status overview")
def get_p2_status(_=Depends(get_current_user)):
    """Shows which Priority 2 features are active vs simulated."""
    from services.email_service import EMAIL_ENABLED
    from services.llm_service import LLM_ENABLED

    try:
        from services.scheduler_service import SCHEDULER_AVAILABLE, SCHEDULER_ENABLED
        sched_ok = SCHEDULER_AVAILABLE and SCHEDULER_ENABLED
    except:
        sched_ok = False

    return {
        "features": {
            "email_alerts": {
                "status": "LIVE" if EMAIL_ENABLED else "SIMULATED",
                "description": "Score drop alerts + weekly summaries + critical CVE notifications",
                "enable_with": "Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD in .env",
            },
            "scheduler": {
                "status": "ACTIVE" if sched_ok else "NEEDS_INSTALL",
                "description": "Weekly auto-assessments every Monday 9:00 AM IST (Asia/Kolkata)",
                "enable_with": "pip install apscheduler — then restart backend",
            },
            "llm_remediation": {
                "status": "LIVE" if LLM_ENABLED else "SMART_TEMPLATE",
                "description": "AI-powered step-by-step remediation + board executive summaries",
                "enable_with": "Set ANTHROPIC_API_KEY in .env",
                "model": "claude-sonnet-4-20250514" if LLM_ENABLED else "template-engine-v2",
            },
        },
        "summary": f"{sum([EMAIL_ENABLED, sched_ok, LLM_ENABLED])}/3 features fully live",
    }
