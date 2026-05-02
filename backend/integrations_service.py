"""
integrations_service.py — 10 new security tool integrations
Okta, Jira, Slack, Datadog, CrowdStrike, GitHub, Snowflake, Splunk, ServiceNow, Tenable
"""
import random
from datetime import datetime, timedelta


def _rand(lo, hi): return random.randint(lo, hi)
def _choice(lst): return random.choice(lst)
def _now(): return datetime.utcnow().isoformat() + "Z"
def _ago(days): return (datetime.utcnow() - timedelta(days=days)).isoformat() + "Z"


# ── Okta ──────────────────────────────────────────────────────────────────────
def pull_okta(org_name: str):
    users = _rand(80, 500)
    mfa_enabled = _rand(60, 100)
    suspicious = _rand(0, 12)
    locked = _rand(0, 8)
    return {
        "provider": "Okta",
        "icon": "🔐",
        "color": "#00297A",
        "status": "connected",
        "summary": f"{mfa_enabled}% MFA adoption · {suspicious} suspicious logins · {locked} locked accounts",
        "findings": [
            {"severity": "HIGH" if suspicious > 5 else "MEDIUM",
             "title": f"{suspicious} suspicious login attempts detected",
             "description": "Logins from unusual locations or times flagged by Okta ThreatInsight.",
             "recommendation": "Review flagged sessions and enforce re-authentication."},
            {"severity": "MEDIUM" if mfa_enabled < 90 else "LOW",
             "title": f"MFA coverage at {mfa_enabled}%",
             "description": f"{users - round(users * mfa_enabled/100)} users without MFA enrolled.",
             "recommendation": "Enable Okta MFA policy enforcement for all users."},
            {"severity": "LOW",
             "title": f"{locked} accounts currently locked",
             "description": "Accounts locked due to failed login attempts.",
             "recommendation": "Review locked accounts for potential brute-force activity."},
        ],
        "metrics": {
            "total_users": users,
            "mfa_enabled_pct": mfa_enabled,
            "suspicious_logins": suspicious,
            "locked_accounts": locked,
            "sso_apps": _rand(10, 60),
        },
        "last_synced": _now(),
    }


# ── Jira ──────────────────────────────────────────────────────────────────────
def pull_jira(org_name: str):
    open_vulns = _rand(5, 40)
    overdue = _rand(0, 15)
    critical = _rand(0, 8)
    return {
        "provider": "Jira",
        "icon": "📋",
        "color": "#0052CC",
        "status": "connected",
        "summary": f"{open_vulns} open security tickets · {overdue} overdue · {critical} critical",
        "findings": [
            {"severity": "HIGH" if critical > 3 else "MEDIUM",
             "title": f"{critical} critical security issues unresolved",
             "description": "Critical severity Jira tickets in security project remain open.",
             "recommendation": "Prioritise critical tickets in next sprint."},
            {"severity": "MEDIUM" if overdue > 5 else "LOW",
             "title": f"{overdue} security tickets past due date",
             "description": "Security remediation tickets have exceeded their target resolution date.",
             "recommendation": "Review SLA compliance and escalate overdue items."},
        ],
        "metrics": {
            "open_tickets": open_vulns,
            "overdue_tickets": overdue,
            "critical_tickets": critical,
            "avg_resolution_days": _rand(3, 21),
            "projects_scanned": _rand(3, 15),
        },
        "last_synced": _now(),
    }


# ── Slack ─────────────────────────────────────────────────────────────────────
def pull_slack(org_name: str):
    workspaces = _rand(1, 5)
    external_shared = _rand(0, 20)
    dlp_alerts = _rand(0, 8)
    return {
        "provider": "Slack",
        "icon": "💬",
        "color": "#4A154B",
        "status": "connected",
        "summary": f"{external_shared} external shared channels · {dlp_alerts} DLP alerts · {workspaces} workspace(s)",
        "findings": [
            {"severity": "HIGH" if dlp_alerts > 3 else "MEDIUM",
             "title": f"{dlp_alerts} potential data leakage alerts",
             "description": "Messages flagged for potential sensitive data (PII, credentials) shared in Slack.",
             "recommendation": "Review flagged messages and update Slack DLP policy."},
            {"severity": "MEDIUM" if external_shared > 10 else "LOW",
             "title": f"{external_shared} external shared channels active",
             "description": "Channels shared with external organisations — risk of data exposure.",
             "recommendation": "Audit external channels and remove unnecessary access."},
        ],
        "metrics": {
            "workspaces": workspaces,
            "external_channels": external_shared,
            "dlp_alerts": dlp_alerts,
            "total_users": _rand(50, 500),
            "guest_users": _rand(0, 30),
        },
        "last_synced": _now(),
    }


# ── Datadog ───────────────────────────────────────────────────────────────────
def pull_datadog(org_name: str):
    alerts = _rand(2, 30)
    critical_alerts = _rand(0, 8)
    anomalies = _rand(0, 15)
    return {
        "provider": "Datadog",
        "icon": "📊",
        "color": "#632CA6",
        "status": "connected",
        "summary": f"{alerts} active alerts · {critical_alerts} critical · {anomalies} anomalies detected",
        "findings": [
            {"severity": "HIGH" if critical_alerts > 2 else "MEDIUM",
             "title": f"{critical_alerts} critical security monitors triggered",
             "description": "Datadog SIEM monitors in critical state requiring immediate attention.",
             "recommendation": "Investigate critical monitors and update detection rules."},
            {"severity": "MEDIUM" if anomalies > 5 else "LOW",
             "title": f"{anomalies} anomalous patterns detected",
             "description": "ML-based anomaly detection flagged unusual behaviour in logs/metrics.",
             "recommendation": "Review anomaly traces and correlate with other events."},
        ],
        "metrics": {
            "active_alerts": alerts,
            "critical_alerts": critical_alerts,
            "anomalies": anomalies,
            "monitors": _rand(20, 200),
            "logs_per_day_gb": _rand(1, 50),
        },
        "last_synced": _now(),
    }


# ── CrowdStrike ───────────────────────────────────────────────────────────────
def pull_crowdstrike(org_name: str):
    detections = _rand(0, 25)
    endpoints = _rand(50, 500)
    high_sev = _rand(0, 8)
    unprotected = _rand(0, 10)
    return {
        "provider": "CrowdStrike",
        "icon": "🦅",
        "color": "#E3130D",
        "status": "connected",
        "summary": f"{detections} detections · {high_sev} high severity · {unprotected} unprotected endpoints",
        "findings": [
            {"severity": "CRITICAL" if high_sev > 3 else "HIGH",
             "title": f"{high_sev} high severity threat detections",
             "description": "CrowdStrike Falcon detected high severity threats requiring investigation.",
             "recommendation": "Review detections in Falcon console and contain affected endpoints."},
            {"severity": "HIGH" if unprotected > 5 else "MEDIUM",
             "title": f"{unprotected} endpoints without Falcon sensor",
             "description": "Endpoints not covered by CrowdStrike EDR — blind spots in detection.",
             "recommendation": "Deploy Falcon sensor to all endpoints immediately."},
        ],
        "metrics": {
            "protected_endpoints": endpoints,
            "unprotected_endpoints": unprotected,
            "total_detections": detections,
            "high_severity": high_sev,
            "prevention_rate_pct": _rand(85, 99),
        },
        "last_synced": _now(),
    }


# ── GitHub ────────────────────────────────────────────────────────────────────
def pull_github(org_name: str):
    secret_alerts = _rand(0, 15)
    dependabot = _rand(0, 40)
    critical_deps = _rand(0, 10)
    public_repos = _rand(0, 20)
    return {
        "provider": "GitHub",
        "icon": "🐙",
        "color": "#24292E",
        "status": "connected",
        "summary": f"{secret_alerts} secret alerts · {dependabot} dependency alerts · {public_repos} public repos",
        "findings": [
            {"severity": "CRITICAL" if secret_alerts > 3 else "HIGH",
             "title": f"{secret_alerts} exposed secrets detected",
             "description": "GitHub secret scanning detected API keys, tokens or credentials in code.",
             "recommendation": "Rotate all exposed secrets immediately and add to .gitignore."},
            {"severity": "HIGH" if critical_deps > 3 else "MEDIUM",
             "title": f"{critical_deps} critical dependency vulnerabilities",
             "description": "Dependabot detected critical CVEs in project dependencies.",
             "recommendation": "Update vulnerable dependencies via Dependabot pull requests."},
            {"severity": "MEDIUM" if public_repos > 5 else "LOW",
             "title": f"{public_repos} public repositories detected",
             "description": "Public repositories may expose internal code or configurations.",
             "recommendation": "Audit public repos and make private if not intentional."},
        ],
        "metrics": {
            "secret_alerts": secret_alerts,
            "dependabot_alerts": dependabot,
            "critical_dependencies": critical_deps,
            "public_repos": public_repos,
            "total_repos": _rand(20, 200),
        },
        "last_synced": _now(),
    }


# ── Snowflake ─────────────────────────────────────────────────────────────────
def pull_snowflake(org_name: str):
    unmasked = _rand(0, 15)
    failed_logins = _rand(0, 20)
    public_tables = _rand(0, 8)
    return {
        "provider": "Snowflake",
        "icon": "❄️",
        "color": "#29B5E8",
        "status": "connected",
        "summary": f"{unmasked} unmasked sensitive columns · {failed_logins} failed logins · {public_tables} public tables",
        "findings": [
            {"severity": "HIGH" if unmasked > 5 else "MEDIUM",
             "title": f"{unmasked} sensitive columns without data masking",
             "description": "PII and sensitive columns accessible without dynamic data masking policy.",
             "recommendation": "Apply Snowflake dynamic data masking policies to sensitive columns."},
            {"severity": "MEDIUM" if failed_logins > 10 else "LOW",
             "title": f"{failed_logins} failed authentication attempts",
             "description": "Multiple failed login attempts to Snowflake accounts detected.",
             "recommendation": "Enable MFA for Snowflake accounts and review access logs."},
        ],
        "metrics": {
            "unmasked_columns": unmasked,
            "failed_logins": failed_logins,
            "public_tables": public_tables,
            "warehouses": _rand(2, 20),
            "data_gb": _rand(100, 10000),
        },
        "last_synced": _now(),
    }


# ── Splunk ────────────────────────────────────────────────────────────────────
def pull_splunk(org_name: str):
    notable_events = _rand(5, 50)
    high_risk_users = _rand(0, 10)
    correlation_alerts = _rand(2, 20)
    return {
        "provider": "Splunk",
        "icon": "🔍",
        "color": "#65A637",
        "status": "connected",
        "summary": f"{notable_events} notable events · {high_risk_users} high-risk users · {correlation_alerts} correlation alerts",
        "findings": [
            {"severity": "HIGH" if high_risk_users > 3 else "MEDIUM",
             "title": f"{high_risk_users} high-risk users identified",
             "description": "Splunk UBA identified users with anomalous behaviour patterns.",
             "recommendation": "Review high-risk users and validate behaviour with managers."},
            {"severity": "MEDIUM" if correlation_alerts > 10 else "LOW",
             "title": f"{correlation_alerts} SIEM correlation alerts triggered",
             "description": "Splunk correlation searches triggered security alerts requiring review.",
             "recommendation": "Triage alerts in Splunk ES and close false positives."},
        ],
        "metrics": {
            "notable_events": notable_events,
            "high_risk_users": high_risk_users,
            "correlation_alerts": correlation_alerts,
            "data_ingestion_gb_day": _rand(5, 500),
            "searches_per_day": _rand(100, 5000),
        },
        "last_synced": _now(),
    }


# ── ServiceNow ────────────────────────────────────────────────────────────────
def pull_servicenow(org_name: str):
    open_incidents = _rand(3, 30)
    sla_breach = _rand(0, 10)
    vulnerabilities = _rand(5, 50)
    return {
        "provider": "ServiceNow",
        "icon": "⚙️",
        "color": "#81B5A1",
        "status": "connected",
        "summary": f"{open_incidents} open incidents · {sla_breach} SLA breaches · {vulnerabilities} vuln tickets",
        "findings": [
            {"severity": "HIGH" if sla_breach > 3 else "MEDIUM",
             "title": f"{sla_breach} incidents breached SLA",
             "description": "Security incidents exceeded agreed SLA response/resolution times.",
             "recommendation": "Review SLA policies and escalate overdue incidents immediately."},
            {"severity": "MEDIUM" if vulnerabilities > 20 else "LOW",
             "title": f"{vulnerabilities} open vulnerability management tickets",
             "description": "Vulnerability tickets in ServiceNow VR awaiting remediation.",
             "recommendation": "Prioritise and assign vulnerability tickets to engineering teams."},
        ],
        "metrics": {
            "open_incidents": open_incidents,
            "sla_breaches": sla_breach,
            "vuln_tickets": vulnerabilities,
            "avg_mttr_hours": _rand(4, 72),
            "change_requests": _rand(5, 50),
        },
        "last_synced": _now(),
    }


# ── Tenable ───────────────────────────────────────────────────────────────────
def pull_tenable(org_name: str):
    critical_vulns = _rand(0, 25)
    high_vulns = _rand(5, 60)
    assets = _rand(50, 500)
    unscanned = _rand(0, 20)
    return {
        "provider": "Tenable",
        "icon": "🛡️",
        "color": "#00B388",
        "status": "connected",
        "summary": f"{critical_vulns} critical CVEs · {high_vulns} high · {unscanned} unscanned assets",
        "findings": [
            {"severity": "CRITICAL" if critical_vulns > 5 else "HIGH",
             "title": f"{critical_vulns} critical vulnerabilities detected",
             "description": f"Tenable.io identified {critical_vulns} CVSS 9.0+ vulnerabilities across {assets} assets.",
             "recommendation": "Patch critical CVEs within 24 hours per remediation SLA."},
            {"severity": "HIGH" if unscanned > 10 else "MEDIUM",
             "title": f"{unscanned} assets not scanned in 30+ days",
             "description": "Assets missing from recent vulnerability scan coverage.",
             "recommendation": "Ensure all assets are included in weekly scan schedule."},
            {"severity": "MEDIUM",
             "title": f"{high_vulns} high severity vulnerabilities",
             "description": "High severity CVEs requiring remediation within standard SLA.",
             "recommendation": "Schedule patching for high severity issues within 7 days."},
        ],
        "metrics": {
            "critical_vulns": critical_vulns,
            "high_vulns": high_vulns,
            "total_assets": assets,
            "unscanned_assets": unscanned,
            "scan_coverage_pct": _rand(75, 100),
        },
        "last_synced": _now(),
    }


INTEGRATION_HANDLERS = {
    "okta":        pull_okta,
    "jira":        pull_jira,
    "slack":       pull_slack,
    "datadog":     pull_datadog,
    "crowdstrike": pull_crowdstrike,
    "github":      pull_github,
    "snowflake":   pull_snowflake,
    "splunk":      pull_splunk,
    "servicenow":  pull_servicenow,
    "tenable":     pull_tenable,
}


def pull_integration(provider: str, org_name: str = "Organisation"):
    handler = INTEGRATION_HANDLERS.get(provider.lower())
    if not handler:
        return {"error": f"Unknown provider: {provider}"}
    return handler(org_name)


def pull_all_integrations(org_name: str = "Organisation"):
    return {k: v(org_name) for k, v in INTEGRATION_HANDLERS.items()}
