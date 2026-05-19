from fastapi import APIRouter, Query, Body
from services.continuous_monitoring import run_all_checks, get_latest_results, get_alerts, acknowledge_alert, CHECK_HISTORY
from datetime import datetime

router = APIRouter(prefix="/api/checks", tags=["Continuous Monitoring"])

@router.post("/run")
def trigger_checks(tenant_id: str = Query(default="demo")):
    """Manually trigger all automated checks."""
    return run_all_checks(tenant_id)

@router.get("/latest")
def get_results(tenant_id: str = Query(default="demo")):
    """Get latest check results."""
    return get_latest_results(tenant_id)

@router.get("/alerts")
def get_check_alerts(tenant_id: str = Query(default="demo")):
    return {"alerts": get_alerts(tenant_id)}

@router.post("/alerts/{alert_id}/acknowledge")
def ack_alert(alert_id: str):
    return {"acknowledged": acknowledge_alert(alert_id)}

@router.get("/history")
def get_history(tenant_id: str = Query(default="demo")):
    history = [h for h in CHECK_HISTORY if h["tenant_id"] == tenant_id]
    return {"history": history[-30:]}

@router.get("/schedule")
def get_schedule(tenant_id: str = Query(default="demo")):
    return {
        "frequency": "Every 1 hour",
        "last_run": datetime.utcnow().isoformat(),
        "next_run": datetime.utcnow().isoformat(),
        "total_checks": 22,
        "frameworks": ["SOC2","ISO27001","RBI","DPDP"],
        "status": "active",
    }
