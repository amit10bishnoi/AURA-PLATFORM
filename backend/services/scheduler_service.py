"""
scheduler_service.py — Automated Weekly Assessment Scheduler
Place at: backend/services/scheduler_service.py

Runs auto-assessment for every tenant every Monday at 9AM UTC.
Sends email alert if risk score changes by > 10 points.

Requires:
  pip install apscheduler

Add to main.py lifespan:
  from services.scheduler_service import start_scheduler, stop_scheduler
  start_scheduler()
  yield
  stop_scheduler()
"""

import os
import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger("aura.scheduler")

try:
    from apscheduler.schedulers.background import BackgroundScheduler
    from apscheduler.triggers.cron import CronTrigger
    SCHEDULER_AVAILABLE = True
except ImportError:
    SCHEDULER_AVAILABLE = False
    logger.warning("APScheduler not installed. Run: pip install apscheduler")

_scheduler: Optional[object] = None
SCHEDULER_ENABLED = os.getenv("SCHEDULER_ENABLED", "true").lower() == "true"


def _run_weekly_assessments():
    """Runs every Monday 9AM UTC for all tenants."""
    logger.info(f"[Scheduler] Running weekly assessments — {datetime.utcnow()}")

    try:
        from database import SessionLocal
        from models import User, Assessment
        from services.identity_service import pull_identity_data
        from services.patch_service import pull_patch_data
        from services.asset_service import pull_asset_data
        from services.email_service import send_weekly_summary, send_score_drop_alert
        import json

        db = SessionLocal()

        # Get unique tenants
        tenants = db.execute(
            "SELECT DISTINCT tenant_id FROM users"
        ).fetchall() if hasattr(db, "execute") else []

        # Fallback: get from assessments
        from sqlalchemy import text
        rows = db.execute(text("SELECT DISTINCT tenant_id FROM users")).fetchall()
        tenant_ids = [r[0] for r in rows]

        for tenant_id in tenant_ids:
            try:
                # Get most recent assessment for this tenant
                last = db.query(Assessment).filter(
                    Assessment.tenant_id == tenant_id
                ).order_by(Assessment.created_at.desc()).first()

                if not last:
                    logger.info(f"[Scheduler] No previous assessment for tenant {tenant_id}, skipping")
                    continue

                org_name = last.org_name
                employees = last.employees or 100
                prev_score = last.risk_score or 50

                # Pull fresh data
                identity = pull_identity_data(org_name, employees)
                patch    = pull_patch_data(org_name, employees)
                assets   = pull_asset_data(org_name, employees)

                # Compute new risk score
                af = {}
                af.update(identity.get("aura_fields", {}))
                af.update(patch.get("aura_fields", {}))

                mfa_cov   = af.get("mfa_coverage", 0)
                patch_days = af.get("patch_days", 30)
                vuln_crit = af.get("vuln_critical", 0)

                new_score = 50
                if mfa_cov < 50:   new_score += 20
                elif mfa_cov < 80: new_score += 10
                if patch_days > 60: new_score += 15
                elif patch_days > 30: new_score += 8
                new_score += min(vuln_crit * 5, 20)
                new_score = max(0, min(100, new_score))

                # Get CISO email for this tenant
                from models import User
                ciso = db.query(User).filter(
                    User.tenant_id == tenant_id,
                    User.role == "ciso"
                ).first()

                if not ciso:
                    logger.info(f"[Scheduler] No CISO found for tenant {tenant_id}")
                    continue

                to_email = ciso.email

                # Gather all findings for alert
                all_findings = (
                    identity.get("all_risk_indicators", []) +
                    patch.get("all_risk_indicators", []) +
                    assets.get("all_risk_indicators", [])
                )

                # Send score drop alert if significant change
                score_diff = new_score - prev_score
                if score_diff >= 10:
                    result = send_score_drop_alert(
                        to_email=to_email,
                        org_name=org_name,
                        previous_score=prev_score,
                        new_score=new_score,
                        risk_level="CRITICAL" if new_score >= 75 else "HIGH",
                        top_findings=all_findings[:5],
                    )
                    logger.info(f"[Scheduler] Score drop alert sent: {result}")

                # Always send weekly summary
                from models import Task
                open_tasks = db.query(Task).filter(
                    Task.tenant_id == tenant_id,
                    Task.status != "done"
                ).count()
                done_tasks = db.query(Task).filter(
                    Task.tenant_id == tenant_id,
                    Task.status == "done"
                ).count()
                assessments_this_week = db.query(Assessment).filter(
                    Assessment.tenant_id == tenant_id
                ).count()

                result = send_weekly_summary(
                    to_email=to_email,
                    org_name=org_name,
                    assessment_count=assessments_this_week,
                    avg_score=new_score,
                    risk_level="CRITICAL" if new_score >= 75 else "HIGH" if new_score >= 50 else "MEDIUM",
                    open_tasks=open_tasks,
                    completed_tasks=done_tasks,
                    critical_findings=sum(1 for f in all_findings if f.get("severity") == "CRITICAL"),
                )
                logger.info(f"[Scheduler] Weekly summary sent to {to_email}: {result}")

            except Exception as e:
                logger.error(f"[Scheduler] Error for tenant {tenant_id}: {e}")
                continue

        db.close()
        logger.info("[Scheduler] Weekly run complete")

    except Exception as e:
        logger.error(f"[Scheduler] Fatal error: {e}")


def start_scheduler():
    """Call this from main.py lifespan startup."""
    global _scheduler

    if not SCHEDULER_AVAILABLE:
        logger.warning("[Scheduler] APScheduler not available — install with: pip install apscheduler")
        return

    if not SCHEDULER_ENABLED:
        logger.info("[Scheduler] Disabled via SCHEDULER_ENABLED=false")
        return

    _scheduler = BackgroundScheduler(timezone="Asia/Kolkata")

    # Every Monday at 9:00 AM UTC
    _scheduler.add_job(
        _run_weekly_assessments,
        CronTrigger(day_of_week="mon", hour=9, minute=0, timezone="Asia/Kolkata"),
        id="weekly_assessment",
        replace_existing=True,
        name="Weekly Auto-Assessment for All Tenants",
    )

    _scheduler.start()
    logger.info("[Scheduler] ✅ Started — weekly assessments every Monday 9AM IST")
    print("⏰ Scheduler started — weekly assessments every Monday 9AM IST (Asia/Kolkata)")


def stop_scheduler():
    """Call this from main.py lifespan shutdown."""
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown()
        logger.info("[Scheduler] Stopped")


def trigger_now(tenant_id: Optional[str] = None):
    """
    Manually trigger the weekly job immediately.
    Useful for testing without waiting for Monday.
    """
    logger.info(f"[Scheduler] Manual trigger for tenant: {tenant_id or 'ALL'}")
    _run_weekly_assessments()

def run_continuous_checks():
    """Run automated compliance checks every hour."""
    try:
        from services.continuous_monitoring import run_all_checks
        run_all_checks("demo")
        print(f"⏰ Hourly checks completed at {__import__('datetime').datetime.utcnow().isoformat()}")
    except Exception as e:
        print(f"⚠️  Hourly checks failed: {e}")
