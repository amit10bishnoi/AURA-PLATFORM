"""
scheduler_service.py — MongoDB edition
Runs auto-assessment for every tenant every Monday at 9AM IST.
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
    """Runs every Monday 9AM IST for all tenants."""
    import asyncio
    logger.info(f"[Scheduler] Running weekly assessments — {datetime.utcnow()}")
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(_async_weekly_assessments())
        loop.close()
    except Exception as e:
        logger.error(f"[Scheduler] Fatal error: {e}")


async def _async_weekly_assessments():
    from database import col
    from services.identity_service import pull_identity_data
    from services.patch_service import pull_patch_data
    from services.asset_service import pull_asset_data
    from services.email_service import send_weekly_summary, send_score_drop_alert

    users_col      = col("users")
    assessments_col = col("assessments")
    tasks_col      = col("tasks")

    # Get unique tenant IDs
    tenant_ids = await assessments_col.distinct("tenant_id")

    for tenant_id in tenant_ids:
        try:
            last = await assessments_col.find_one(
                {"tenant_id": tenant_id}, sort=[("created_at", -1)]
            )
            if not last:
                continue

            org_name   = last.get("org_name", "")
            employees  = last.get("employees", 100)
            prev_score = last.get("risk_score", 50)

            identity = pull_identity_data(org_name, employees)
            patch    = pull_patch_data(org_name, employees)
            assets   = pull_asset_data(org_name, employees)

            af = {}
            af.update(identity.get("aura_fields", {}))
            af.update(patch.get("aura_fields", {}))

            mfa_cov    = af.get("mfa_coverage", 0)
            patch_days = af.get("patch_days", 30)
            vuln_crit  = af.get("vuln_critical", 0)

            new_score = 50
            if mfa_cov < 50:    new_score += 20
            elif mfa_cov < 80:  new_score += 10
            if patch_days > 60: new_score += 15
            elif patch_days > 30: new_score += 8
            new_score += min(vuln_crit * 5, 20)
            new_score = max(0, min(100, new_score))

            ciso = await users_col.find_one({"tenant_id": tenant_id, "role": "ciso"})
            if not ciso:
                continue

            to_email     = ciso["email"]
            all_findings = (identity.get("all_risk_indicators", []) +
                            patch.get("all_risk_indicators", []) +
                            assets.get("all_risk_indicators", []))

            if new_score - prev_score >= 10:
                result = send_score_drop_alert(
                    to_email=to_email, org_name=org_name,
                    previous_score=prev_score, new_score=new_score,
                    risk_level="CRITICAL" if new_score >= 75 else "HIGH",
                    top_findings=all_findings[:5],
                )
                logger.info(f"[Scheduler] Score drop alert sent: {result}")

            open_tasks = await tasks_col.count_documents({"tenant_id": tenant_id, "status": {"$ne": "done"}})
            done_tasks = await tasks_col.count_documents({"tenant_id": tenant_id, "status": "done"})
            total_assessments = await assessments_col.count_documents({"tenant_id": tenant_id})

            result = send_weekly_summary(
                to_email=to_email, org_name=org_name,
                assessment_count=total_assessments, avg_score=new_score,
                risk_level="CRITICAL" if new_score >= 75 else "HIGH" if new_score >= 50 else "MEDIUM",
                open_tasks=open_tasks, completed_tasks=done_tasks,
                critical_findings=sum(1 for f in all_findings if f.get("severity") == "CRITICAL"),
            )
            logger.info(f"[Scheduler] Weekly summary sent to {to_email}: {result}")

        except Exception as e:
            logger.error(f"[Scheduler] Error for tenant {tenant_id}: {e}")
            continue

    logger.info("[Scheduler] Weekly run complete")


def start_scheduler():
    global _scheduler
    if not SCHEDULER_AVAILABLE:
        logger.warning("[Scheduler] APScheduler not available — install with: pip install apscheduler")
        return
    if not SCHEDULER_ENABLED:
        logger.info("[Scheduler] Disabled via SCHEDULER_ENABLED=false")
        return
    _scheduler = BackgroundScheduler(timezone="Asia/Kolkata")
    _scheduler.add_job(
        _run_weekly_assessments,
        CronTrigger(day_of_week="mon", hour=9, minute=0, timezone="Asia/Kolkata"),
        id="weekly_assessment", replace_existing=True,
        name="Weekly Auto-Assessment for All Tenants",
    )
    _scheduler.start()
    logger.info("[Scheduler] ✅ Started — weekly assessments every Monday 9AM IST")
    print("⏰ Scheduler started — weekly assessments every Monday 9AM IST")


def stop_scheduler():
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown()
        logger.info("[Scheduler] Stopped")


def trigger_now(tenant_id: Optional[str] = None):
    logger.info(f"[Scheduler] Manual trigger for tenant: {tenant_id or 'ALL'}")
    _run_weekly_assessments()


def run_continuous_checks():
    try:
        from services.continuous_monitoring import run_all_checks
        run_all_checks("demo")
        print(f"⏰ Hourly checks completed at {datetime.utcnow().isoformat()}")
    except Exception as e:
        print(f"⚠️  Hourly checks failed: {e}")
