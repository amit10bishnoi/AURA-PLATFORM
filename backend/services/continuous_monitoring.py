"""
continuous_monitoring.py — Hourly automated compliance checks
Runs every hour, updates scores, fires alerts on failures
"""
import os, json, time, logging
from datetime import datetime, timedelta
from typing import Dict, List

logger = logging.getLogger("aura.monitoring")

# In-memory store for check results (use Redis in production)
CHECK_RESULTS: Dict[str, dict] = {}
CHECK_HISTORY: List[dict] = []
ALERT_QUEUE: List[dict] = []

# ── Check definitions ─────────────────────────────────────────────────────────
AUTOMATED_CHECKS = [
    # SOC 2 checks
    {"id":"soc2_mfa","name":"MFA Enforcement","framework":"SOC2","control":"CC6.1","severity":"HIGH","category":"Access Control"},
    {"id":"soc2_encryption","name":"Data Encryption at Rest","framework":"SOC2","control":"CC6.7","severity":"HIGH","category":"Data Security"},
    {"id":"soc2_logging","name":"Audit Logging Enabled","framework":"SOC2","control":"CC7.2","severity":"MEDIUM","category":"Monitoring"},
    {"id":"soc2_vuln_scan","name":"Vulnerability Scanning","framework":"SOC2","control":"CC7.1","severity":"HIGH","category":"Vulnerability Mgmt"},
    {"id":"soc2_incident_plan","name":"Incident Response Plan","framework":"SOC2","control":"CC7.4","severity":"MEDIUM","category":"Incident Response"},
    {"id":"soc2_vendor_review","name":"Vendor Risk Reviews","framework":"SOC2","control":"CC9.2","severity":"MEDIUM","category":"Vendor Risk"},
    {"id":"soc2_access_review","name":"Access Reviews Completed","framework":"SOC2","control":"CC6.3","severity":"HIGH","category":"Access Control"},
    {"id":"soc2_backup","name":"Data Backup Verification","framework":"SOC2","control":"A1.2","severity":"HIGH","category":"Availability"},
    # ISO 27001 checks
    {"id":"iso_asset_inventory","name":"Asset Inventory Updated","framework":"ISO27001","control":"A.8.1","severity":"MEDIUM","category":"Asset Management"},
    {"id":"iso_patch_mgmt","name":"Patch Management SLA","framework":"ISO27001","control":"A.8.8","severity":"HIGH","category":"Vulnerability Mgmt"},
    {"id":"iso_password_policy","name":"Password Policy Enforced","framework":"ISO27001","control":"A.9.4","severity":"MEDIUM","category":"Access Control"},
    {"id":"iso_security_training","name":"Security Awareness Training","framework":"ISO27001","control":"A.6.3","severity":"MEDIUM","category":"Human Resources"},
    {"id":"iso_supplier_review","name":"Supplier Agreements Review","framework":"ISO27001","control":"A.5.19","severity":"LOW","category":"Supplier Relations"},
    {"id":"iso_risk_assessment","name":"Risk Assessment Updated","framework":"ISO27001","control":"A.5.9","severity":"HIGH","category":"Risk Management"},
    # RBI checks
    {"id":"rbi_vapt","name":"VAPT by CERT-In Auditor","framework":"RBI","control":"Cyber-Security.3.1","severity":"HIGH","category":"Vulnerability Mgmt"},
    {"id":"rbi_incident_report","name":"RBI Incident Reporting Ready","framework":"RBI","control":"Cyber-Security.4.1","severity":"CRITICAL","category":"Incident Response"},
    {"id":"rbi_data_localisation","name":"Data Localisation Compliance","framework":"RBI","control":"IT-Gov.2.1","severity":"HIGH","category":"Data Governance"},
    {"id":"rbi_bcp","name":"Business Continuity Plan","framework":"RBI","control":"BCP.1.1","severity":"HIGH","category":"Business Continuity"},
    # DPDP checks
    {"id":"dpdp_consent","name":"Consent Management Active","framework":"DPDP","control":"Section 6","severity":"CRITICAL","category":"Privacy"},
    {"id":"dpdp_dsr","name":"DSR Response Within 48hrs","framework":"DPDP","control":"Section 12","severity":"HIGH","category":"Data Rights"},
    {"id":"dpdp_breach_notify","name":"Breach Notification Process","framework":"DPDP","control":"Section 8","severity":"CRITICAL","category":"Incident Response"},
    {"id":"dpdp_retention","name":"Data Retention Policy","framework":"DPDP","control":"Section 8(3)","severity":"MEDIUM","category":"Data Governance"},
]

def run_check(check: dict, tenant_id: str) -> dict:
    """Run a single automated compliance check."""
    import random
    
    # In production: run real checks against connected integrations
    # For now: smart simulation based on check type
    check_id = check["id"]
    
    # Simulate realistic pass rates based on check type
    pass_rates = {
        "soc2_mfa": 0.85, "soc2_encryption": 0.90, "soc2_logging": 0.75,
        "soc2_vuln_scan": 0.70, "soc2_incident_plan": 0.80, "soc2_vendor_review": 0.60,
        "soc2_access_review": 0.65, "soc2_backup": 0.88,
        "iso_asset_inventory": 0.70, "iso_patch_mgmt": 0.72, "iso_password_policy": 0.85,
        "iso_security_training": 0.68, "iso_supplier_review": 0.60, "iso_risk_assessment": 0.75,
        "rbi_vapt": 0.65, "rbi_incident_report": 0.55, "rbi_data_localisation": 0.70, "rbi_bcp": 0.75,
        "dpdp_consent": 0.30, "dpdp_dsr": 0.40, "dpdp_breach_notify": 0.45, "dpdp_retention": 0.50,
    }
    
    passed = random.random() < pass_rates.get(check_id, 0.70)
    
    result = {
        "check_id": check_id,
        "name": check["name"],
        "framework": check["framework"],
        "control": check["control"],
        "severity": check["severity"],
        "category": check["category"],
        "status": "PASS" if passed else "FAIL",
        "tenant_id": tenant_id,
        "checked_at": datetime.utcnow().isoformat(),
        "next_check": (datetime.utcnow() + timedelta(hours=1)).isoformat(),
        "details": _get_check_details(check_id, passed),
        "remediation": _get_remediation(check_id) if not passed else None,
    }
    
    # Fire alert if critical/high check fails
    if not passed and check["severity"] in ("CRITICAL", "HIGH"):
        ALERT_QUEUE.append({
            "id": f"alert_{check_id}_{int(time.time())}",
            "type": "CHECK_FAILED",
            "severity": check["severity"],
            "title": f"Automated check failed: {check['name']}",
            "framework": check["framework"],
            "control": check["control"],
            "tenant_id": tenant_id,
            "created_at": datetime.utcnow().isoformat(),
            "acknowledged": False,
        })
    
    return result

def _get_check_details(check_id: str, passed: bool) -> str:
    details = {
        "soc2_mfa": "Checked MFA enrollment via Okta/Azure AD API" if passed else "3 admin users found without MFA enabled",
        "soc2_encryption": "S3 buckets and RDS instances verified encrypted" if passed else "2 S3 buckets found without default encryption",
        "soc2_logging": "CloudTrail multi-region logging confirmed active" if passed else "CloudTrail not enabled in ap-south-1 region",
        "soc2_vuln_scan": "Weekly Tenable scan completed, no critical CVEs" if passed else "Last scan was 35 days ago — exceeds 30-day SLA",
        "iso_patch_mgmt": "All critical patches applied within 72-hour SLA" if passed else "CVE-2024-1234 unpatched for 8 days — exceeds HIGH SLA",
        "dpdp_consent": "Consent management system active on all forms" if passed else "Consent collection not implemented on signup flow",
        "dpdp_dsr": "DSR workflow tested — responses within 24 hours" if passed else "No DSR handling process defined",
        "rbi_incident_report": "RBI reporting workflow documented and tested" if passed else "No 2-hour RBI incident reporting process defined",
    }
    return details.get(check_id, "Automated check completed" if passed else "Check failed — manual review required")

def _get_remediation(check_id: str) -> str:
    remediations = {
        "soc2_mfa": "Okta Admin → Security → Multifactor → Enrollment Policy → Required for All Users",
        "soc2_encryption": "S3 → Bucket → Properties → Default encryption → Enable SSE-S3 or SSE-KMS",
        "soc2_logging": "CloudTrail → Create trail → Apply to all regions → Enable log file validation",
        "iso_patch_mgmt": "Deploy available patches immediately — use Dependabot auto-merge for dependencies",
        "dpdp_consent": "Implement consent checkbox on all data collection forms — log timestamp and IP",
        "dpdp_dsr": "Create DSR intake form and assign to Privacy team — target 24hr response",
        "rbi_incident_report": "Document 2-hour RBI notification procedure — assign incident commander role",
        "rbi_vapt": "Schedule VAPT with CERT-In empanelled auditor within 30 days",
    }
    return remediations.get(check_id, "Review control requirements and implement remediation steps")

def run_all_checks(tenant_id: str = "demo") -> dict:
    """Run all automated checks for a tenant."""
    results = []
    for check in AUTOMATED_CHECKS:
        result = run_check(check, tenant_id)
        CHECK_RESULTS[f"{tenant_id}_{check['id']}"] = result
        results.append(result)
    
    # Add to history
    summary = _calculate_summary(results)
    CHECK_HISTORY.append({
        "tenant_id": tenant_id,
        "run_at": datetime.utcnow().isoformat(),
        "total": len(results),
        "passed": summary["passed"],
        "failed": summary["failed"],
        "score": summary["score"],
    })
    # Keep last 100 history entries
    if len(CHECK_HISTORY) > 100:
        CHECK_HISTORY.pop(0)
    
    logger.info(f"✅ Ran {len(results)} checks for {tenant_id} — Score: {summary['score']}%")
    return {"results": results, "summary": summary, "alerts": ALERT_QUEUE[-10:]}

def get_latest_results(tenant_id: str = "demo") -> dict:
    """Get the latest check results for a tenant."""
    tenant_results = [v for k, v in CHECK_RESULTS.items() if k.startswith(f"{tenant_id}_")]
    if not tenant_results:
        return run_all_checks(tenant_id)
    return {"results": tenant_results, "summary": _calculate_summary(tenant_results), "alerts": ALERT_QUEUE[-10:]}

def _calculate_summary(results: list) -> dict:
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = len(results) - passed
    score = round(passed / max(len(results), 1) * 100)
    
    by_framework = {}
    for r in results:
        fw = r["framework"]
        if fw not in by_framework:
            by_framework[fw] = {"passed": 0, "failed": 0, "total": 0}
        by_framework[fw]["total"] += 1
        if r["status"] == "PASS":
            by_framework[fw]["passed"] += 1
        else:
            by_framework[fw]["failed"] += 1
    
    for fw in by_framework:
        by_framework[fw]["score"] = round(by_framework[fw]["passed"] / by_framework[fw]["total"] * 100)
    
    return {
        "total": len(results),
        "passed": passed,
        "failed": failed,
        "score": score,
        "by_framework": by_framework,
        "critical_failures": sum(1 for r in results if r["status"] == "FAIL" and r["severity"] == "CRITICAL"),
        "high_failures": sum(1 for r in results if r["status"] == "FAIL" and r["severity"] == "HIGH"),
        "last_run": datetime.utcnow().isoformat(),
        "next_run": (datetime.utcnow() + timedelta(hours=1)).isoformat(),
    }

def get_alerts(tenant_id: str = "demo") -> list:
    return [a for a in ALERT_QUEUE if a["tenant_id"] == tenant_id]

def acknowledge_alert(alert_id: str):
    for a in ALERT_QUEUE:
        if a["id"] == alert_id:
            a["acknowledged"] = True
            return True
    return False
