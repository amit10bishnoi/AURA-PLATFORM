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




# ── PagerDuty ─────────────────────────────────────────────────────────────────
def pull_pagerduty(org_name: str):
    incidents = _rand(0, 20)
    critical = _rand(0, 5)
    mtta = _rand(2, 45)
    mttr = _rand(15, 480)
    return {
        "provider": "PagerDuty",
        "icon": "🚨",
        "color": "#06AC38",
        "status": "connected",
        "summary": f"{incidents} open incidents · {critical} critical · MTTA {mtta}min · MTTR {mttr}min",
        "findings": [
            {"severity": "HIGH" if critical > 2 else "MEDIUM",
             "title": f"{critical} critical incidents unresolved",
             "description": "Critical severity PagerDuty incidents requiring immediate attention.",
             "recommendation": "Assign on-call engineers and resolve critical incidents immediately."},
            {"severity": "MEDIUM" if mttr > 120 else "LOW",
             "title": f"Mean Time to Resolve: {mttr} minutes",
             "description": "MTTR exceeds target SLA of 120 minutes for security incidents.",
             "recommendation": "Review incident response runbooks and automate resolution steps."},
        ],
        "metrics": {"open_incidents": incidents, "critical_incidents": critical,
                    "mtta_minutes": mtta, "mttr_minutes": mttr, "services": _rand(5, 50)},
        "last_synced": _now(),
    }


# ── Qualys ────────────────────────────────────────────────────────────────────
def pull_qualys(org_name: str):
    critical = _rand(0, 30)
    high = _rand(5, 80)
    assets = _rand(50, 1000)
    patchable = _rand(5, 40)
    return {
        "provider": "Qualys",
        "icon": "🔬",
        "color": "#ED1C24",
        "status": "connected",
        "summary": f"{critical} critical CVEs · {high} high · {assets} assets scanned · {patchable} patchable",
        "findings": [
            {"severity": "CRITICAL" if critical > 10 else "HIGH",
             "title": f"{critical} critical vulnerabilities detected",
             "description": f"Qualys VMDR identified CVSS 9.0+ vulnerabilities across {assets} assets.",
             "recommendation": "Apply patches for critical CVEs within 24-hour SLA."},
            {"severity": "HIGH" if patchable > 20 else "MEDIUM",
             "title": f"{patchable} vulnerabilities have available patches",
             "description": "Patches available but not yet applied to vulnerable assets.",
             "recommendation": "Deploy available patches via patch management system immediately."},
        ],
        "metrics": {"critical_vulns": critical, "high_vulns": high,
                    "total_assets": assets, "patchable": patchable, "scan_coverage_pct": _rand(80, 100)},
        "last_synced": _now(),
    }


# ── SentinelOne ───────────────────────────────────────────────────────────────
def pull_sentinelone(org_name: str):
    threats = _rand(0, 20)
    endpoints = _rand(50, 500)
    mitigated = _rand(0, threats)
    return {
        "provider": "SentinelOne",
        "icon": "🤖",
        "color": "#6B00F5",
        "status": "connected",
        "summary": f"{threats} threats detected · {mitigated} auto-mitigated · {endpoints} endpoints",
        "findings": [
            {"severity": "HIGH" if (threats - mitigated) > 3 else "MEDIUM",
             "title": f"{threats - mitigated} unmitigated threats",
             "description": "Threats detected by SentinelOne Singularity not yet remediated.",
             "recommendation": "Review unmitigated threats in Singularity console and remediate."},
            {"severity": "LOW",
             "title": f"{mitigated} threats auto-mitigated by AI",
             "description": "SentinelOne autonomous AI successfully contained threats.",
             "recommendation": "Review mitigation actions to validate no false positives."},
        ],
        "metrics": {"threats_detected": threats, "auto_mitigated": mitigated,
                    "protected_endpoints": endpoints, "prevention_rate_pct": _rand(88, 99)},
        "last_synced": _now(),
    }


# ── Microsoft Defender ────────────────────────────────────────────────────────
def pull_microsoft_defender(org_name: str):
    alerts = _rand(2, 40)
    high_alerts = _rand(0, 10)
    exposed_devices = _rand(0, 20)
    return {
        "provider": "Microsoft Defender",
        "icon": "🛡",
        "color": "#0078D4",
        "status": "connected",
        "summary": f"{alerts} alerts · {high_alerts} high · {exposed_devices} exposed devices",
        "findings": [
            {"severity": "HIGH" if high_alerts > 3 else "MEDIUM",
             "title": f"{high_alerts} high severity Defender alerts",
             "description": "Microsoft Defender for Endpoint raised high severity security alerts.",
             "recommendation": "Investigate alerts in Defender Security Centre and remediate."},
            {"severity": "HIGH" if exposed_devices > 10 else "MEDIUM",
             "title": f"{exposed_devices} devices with exposure score > 7",
             "description": "Devices with high exposure score increasing organisation attack surface.",
             "recommendation": "Apply security recommendations to reduce device exposure score."},
        ],
        "metrics": {"total_alerts": alerts, "high_alerts": high_alerts,
                    "exposed_devices": exposed_devices, "secure_score_pct": _rand(40, 85)},
        "last_synced": _now(),
    }


# ── Cloudflare ────────────────────────────────────────────────────────────────
def pull_cloudflare(org_name: str):
    threats_blocked = _rand(100, 10000)
    ddos_events = _rand(0, 5)
    bot_score = _rand(0, 30)
    return {
        "provider": "Cloudflare",
        "icon": "🌐",
        "color": "#F48120",
        "status": "connected",
        "summary": f"{threats_blocked:,} threats blocked · {ddos_events} DDoS events · {bot_score}% bot traffic",
        "findings": [
            {"severity": "HIGH" if ddos_events > 2 else "LOW",
             "title": f"{ddos_events} DDoS attack events detected",
             "description": "Cloudflare detected and mitigated distributed denial-of-service attacks.",
             "recommendation": "Review DDoS rules and consider enabling Under Attack mode."},
            {"severity": "MEDIUM" if bot_score > 20 else "LOW",
             "title": f"{bot_score}% of traffic identified as bot traffic",
             "description": "Significant bot traffic detected on protected domains.",
             "recommendation": "Enable Cloudflare Bot Management to filter malicious bots."},
        ],
        "metrics": {"threats_blocked": threats_blocked, "ddos_events": ddos_events,
                    "bot_traffic_pct": bot_score, "bandwidth_saved_gb": _rand(10, 1000)},
        "last_synced": _now(),
    }


# ── HashiCorp Vault ───────────────────────────────────────────────────────────
def pull_hashicorp_vault(org_name: str):
    secrets = _rand(50, 500)
    expiring = _rand(0, 20)
    leaked = _rand(0, 3)
    return {
        "provider": "HashiCorp Vault",
        "icon": "🔑",
        "color": "#000000",
        "status": "connected",
        "summary": f"{secrets} secrets managed · {expiring} expiring · {leaked} potentially leaked",
        "findings": [
            {"severity": "CRITICAL" if leaked > 0 else "LOW",
             "title": f"{leaked} secrets potentially leaked",
             "description": "Vault audit logs indicate secrets may have been exposed outside Vault.",
             "recommendation": "Rotate leaked secrets immediately and audit access logs."},
            {"severity": "MEDIUM" if expiring > 10 else "LOW",
             "title": f"{expiring} secrets expiring within 7 days",
             "description": "Secrets approaching expiry may cause service disruptions if not rotated.",
             "recommendation": "Rotate expiring secrets before they expire to prevent outages."},
        ],
        "metrics": {"total_secrets": secrets, "expiring_secrets": expiring,
                    "leaked_secrets": leaked, "policies": _rand(10, 100)},
        "last_synced": _now(),
    }


# ── Elastic Security ──────────────────────────────────────────────────────────
def pull_elastic_security(org_name: str):
    alerts = _rand(5, 60)
    critical = _rand(0, 10)
    rules = _rand(50, 500)
    return {
        "provider": "Elastic Security",
        "icon": "🔎",
        "color": "#FEC514",
        "status": "connected",
        "summary": f"{alerts} SIEM alerts · {critical} critical · {rules} detection rules active",
        "findings": [
            {"severity": "HIGH" if critical > 3 else "MEDIUM",
             "title": f"{critical} critical SIEM alerts triggered",
             "description": "Elastic Security SIEM detection rules triggered critical alerts.",
             "recommendation": "Investigate critical alerts in Elastic Kibana Security dashboard."},
            {"severity": "LOW",
             "title": f"{rules} detection rules active",
             "description": "Elastic Security running detection rules across all log sources.",
             "recommendation": "Review and tune detection rules to reduce false positive rate."},
        ],
        "metrics": {"total_alerts": alerts, "critical_alerts": critical,
                    "detection_rules": rules, "logs_indexed_gb": _rand(10, 500)},
        "last_synced": _now(),
    }


# ── Wiz ───────────────────────────────────────────────────────────────────────
def pull_wiz(org_name: str):
    critical_issues = _rand(0, 30)
    toxic_combos = _rand(0, 10)
    cloud_resources = _rand(100, 5000)
    return {
        "provider": "Wiz",
        "icon": "🌩",
        "color": "#2B6CB0",
        "status": "connected",
        "summary": f"{critical_issues} critical issues · {toxic_combos} toxic combinations · {cloud_resources:,} resources",
        "findings": [
            {"severity": "CRITICAL" if toxic_combos > 3 else "HIGH",
             "title": f"{toxic_combos} toxic security combinations detected",
             "description": "Wiz identified attack path combinations that could lead to critical breach.",
             "recommendation": "Prioritise toxic combinations — these represent highest breach risk."},
            {"severity": "HIGH" if critical_issues > 10 else "MEDIUM",
             "title": f"{critical_issues} critical cloud security issues",
             "description": "Critical misconfigurations and vulnerabilities across cloud infrastructure.",
             "recommendation": "Remediate critical Wiz issues using built-in fix guidance."},
        ],
        "metrics": {"critical_issues": critical_issues, "toxic_combinations": toxic_combos,
                    "cloud_resources": cloud_resources, "compliance_score_pct": _rand(50, 90)},
        "last_synced": _now(),
    }


# ── SonarQube ─────────────────────────────────────────────────────────────────
def pull_sonarqube(org_name: str):
    bugs = _rand(0, 100)
    vulnerabilities = _rand(0, 40)
    code_smells = _rand(10, 500)
    coverage = _rand(30, 90)
    return {
        "provider": "SonarQube",
        "icon": "📝",
        "color": "#4E9BCD",
        "status": "connected",
        "summary": f"{vulnerabilities} code vulnerabilities · {bugs} bugs · {coverage}% test coverage",
        "findings": [
            {"severity": "HIGH" if vulnerabilities > 10 else "MEDIUM",
             "title": f"{vulnerabilities} security vulnerabilities in code",
             "description": "SonarQube SAST detected security vulnerabilities in application source code.",
             "recommendation": "Fix security vulnerabilities before deploying to production."},
            {"severity": "MEDIUM" if coverage < 60 else "LOW",
             "title": f"Test coverage at {coverage}%",
             "description": "Low test coverage increases risk of undetected security bugs.",
             "recommendation": "Increase test coverage to minimum 80% for security-critical code."},
        ],
        "metrics": {"vulnerabilities": vulnerabilities, "bugs": bugs,
                    "code_smells": code_smells, "test_coverage_pct": coverage},
        "last_synced": _now(),
    }


# ── Rapid7 InsightVM ──────────────────────────────────────────────────────────
def pull_rapid7(org_name: str):
    critical = _rand(0, 25)
    exploitable = _rand(0, 15)
    assets = _rand(50, 800)
    return {
        "provider": "Rapid7 InsightVM",
        "icon": "🎯",
        "color": "#E3170A",
        "status": "connected",
        "summary": f"{critical} critical vulns · {exploitable} exploitable · {assets} assets",
        "findings": [
            {"severity": "CRITICAL" if exploitable > 5 else "HIGH",
             "title": f"{exploitable} vulnerabilities actively exploitable",
             "description": "Rapid7 threat intelligence confirms these CVEs are actively exploited.",
             "recommendation": "Prioritise exploitable vulnerabilities — patch within 24 hours."},
            {"severity": "HIGH" if critical > 10 else "MEDIUM",
             "title": f"{critical} critical severity vulnerabilities",
             "description": "CVSS 9.0+ vulnerabilities detected across your asset inventory.",
             "recommendation": "Schedule emergency patching cycle for critical vulnerabilities."},
        ],
        "metrics": {"critical_vulns": critical, "exploitable_vulns": exploitable,
                    "total_assets": assets, "risk_score": _rand(400, 900)},
        "last_synced": _now(),
    }


# ── Carbon Black ──────────────────────────────────────────────────────────────
def pull_carbon_black(org_name: str):
    alerts = _rand(0, 25)
    policy_violations = _rand(0, 15)
    endpoints = _rand(50, 500)
    return {
        "provider": "VMware Carbon Black",
        "icon": "⚫",
        "color": "#1A1A1A",
        "status": "connected",
        "summary": f"{alerts} alerts · {policy_violations} policy violations · {endpoints} endpoints protected",
        "findings": [
            {"severity": "HIGH" if alerts > 10 else "MEDIUM",
             "title": f"{alerts} Carbon Black EDR alerts",
             "description": "Carbon Black detected suspicious endpoint behaviour requiring investigation.",
             "recommendation": "Review alerts in Carbon Black console and isolate affected endpoints."},
            {"severity": "MEDIUM" if policy_violations > 5 else "LOW",
             "title": f"{policy_violations} security policy violations",
             "description": "Endpoints violating Carbon Black security policies detected.",
             "recommendation": "Enforce policy and remediate violations on non-compliant endpoints."},
        ],
        "metrics": {"total_alerts": alerts, "policy_violations": policy_violations,
                    "protected_endpoints": endpoints, "blocked_attacks": _rand(10, 200)},
        "last_synced": _now(),
    }


# ── Trend Micro ───────────────────────────────────────────────────────────────
def pull_trend_micro(org_name: str):
    threats = _rand(0, 30)
    ransomware_attempts = _rand(0, 5)
    endpoints = _rand(50, 500)
    return {
        "provider": "Trend Micro",
        "icon": "📡",
        "color": "#D71920",
        "status": "connected",
        "summary": f"{threats} threats blocked · {ransomware_attempts} ransomware attempts · {endpoints} protected",
        "findings": [
            {"severity": "CRITICAL" if ransomware_attempts > 0 else "LOW",
             "title": f"{ransomware_attempts} ransomware execution attempts blocked",
             "description": "Trend Micro detected and blocked ransomware execution attempts.",
             "recommendation": "Investigate ransomware source and strengthen email/web filtering."},
            {"severity": "MEDIUM" if threats > 15 else "LOW",
             "title": f"{threats} threats blocked this period",
             "description": "Trend Micro blocked various malware, phishing and exploit attempts.",
             "recommendation": "Review threat reports and update detection signatures."},
        ],
        "metrics": {"threats_blocked": threats, "ransomware_attempts": ransomware_attempts,
                    "protected_endpoints": endpoints, "detection_rate_pct": _rand(94, 99)},
        "last_synced": _now(),
    }


# ── Lacework ──────────────────────────────────────────────────────────────────
def pull_lacework(org_name: str):
    anomalies = _rand(0, 20)
    critical = _rand(0, 8)
    accounts = _rand(1, 10)
    return {
        "provider": "Lacework",
        "icon": "🏔",
        "color": "#00B4D8",
        "status": "connected",
        "summary": f"{anomalies} cloud anomalies · {critical} critical · {accounts} cloud accounts",
        "findings": [
            {"severity": "HIGH" if critical > 3 else "MEDIUM",
             "title": f"{critical} critical cloud security anomalies",
             "description": "Lacework ML detected critical unusual behaviour in cloud environment.",
             "recommendation": "Investigate anomalies in Lacework console and remediate root cause."},
            {"severity": "MEDIUM" if anomalies > 10 else "LOW",
             "title": f"{anomalies} total anomalies detected",
             "description": "Behavioural anomalies across cloud accounts flagged by Lacework ML.",
             "recommendation": "Review and classify anomalies to identify true positives."},
        ],
        "metrics": {"anomalies": anomalies, "critical_anomalies": critical,
                    "cloud_accounts": accounts, "resources_monitored": _rand(100, 5000)},
        "last_synced": _now(),
    }


# ── Prisma Cloud ──────────────────────────────────────────────────────────────
def pull_prisma_cloud(org_name: str):
    alerts = _rand(5, 80)
    critical = _rand(0, 15)
    compliance_pct = _rand(50, 95)
    return {
        "provider": "Prisma Cloud",
        "icon": "🔷",
        "color": "#00C0E8",
        "status": "connected",
        "summary": f"{alerts} alerts · {critical} critical · {compliance_pct}% compliance",
        "findings": [
            {"severity": "HIGH" if critical > 5 else "MEDIUM",
             "title": f"{critical} critical cloud security alerts",
             "description": "Palo Alto Prisma Cloud detected critical misconfigurations and threats.",
             "recommendation": "Remediate critical alerts using Prisma Cloud guided remediation."},
            {"severity": "MEDIUM" if compliance_pct < 75 else "LOW",
             "title": f"Cloud compliance at {compliance_pct}%",
             "description": "Cloud infrastructure compliance below target across monitored frameworks.",
             "recommendation": "Apply auto-remediation for compliant resource configurations."},
        ],
        "metrics": {"total_alerts": alerts, "critical_alerts": critical,
                    "compliance_pct": compliance_pct, "resources": _rand(100, 10000)},
        "last_synced": _now(),
    }


# ── Veracode ──────────────────────────────────────────────────────────────────
def pull_veracode(org_name: str):
    flaws = _rand(0, 50)
    very_high = _rand(0, 10)
    apps_scanned = _rand(1, 20)
    return {
        "provider": "Veracode",
        "icon": "🧪",
        "color": "#009BDE",
        "status": "connected",
        "summary": f"{flaws} security flaws · {very_high} very high severity · {apps_scanned} apps scanned",
        "findings": [
            {"severity": "HIGH" if very_high > 3 else "MEDIUM",
             "title": f"{very_high} very high severity application flaws",
             "description": "Veracode SAST/DAST identified critical security flaws in applications.",
             "recommendation": "Fix very high severity flaws before next production deployment."},
            {"severity": "MEDIUM" if flaws > 20 else "LOW",
             "title": f"{flaws} total security flaws across {apps_scanned} applications",
             "description": "Application security flaws detected across scanned codebases.",
             "recommendation": "Create remediation tickets for all detected flaws by severity."},
        ],
        "metrics": {"total_flaws": flaws, "very_high_severity": very_high,
                    "apps_scanned": apps_scanned, "policy_pass_rate_pct": _rand(40, 90)},
        "last_synced": _now(),
    }


# ── Nessus / Tenable.sc ───────────────────────────────────────────────────────
def pull_nessus(org_name: str):
    critical = _rand(0, 20)
    high = _rand(5, 60)
    plugins = _rand(50000, 80000)
    return {
        "provider": "Nessus Pro",
        "icon": "🔭",
        "color": "#00B388",
        "status": "connected",
        "summary": f"{critical} critical · {high} high · {plugins:,} plugins active",
        "findings": [
            {"severity": "CRITICAL" if critical > 5 else "HIGH",
             "title": f"{critical} critical vulnerabilities found",
             "description": "Nessus scanner identified critical severity vulnerabilities in network.",
             "recommendation": "Prioritise critical findings and patch within emergency SLA."},
            {"severity": "HIGH" if high > 20 else "MEDIUM",
             "title": f"{high} high severity vulnerabilities",
             "description": "High severity CVEs detected requiring remediation within standard SLA.",
             "recommendation": "Schedule patching for high severity findings within 7 days."},
        ],
        "metrics": {"critical_vulns": critical, "high_vulns": high,
                    "active_plugins": plugins, "hosts_scanned": _rand(50, 500)},
        "last_synced": _now(),
    }


# ── Duo Security ──────────────────────────────────────────────────────────────
def pull_duo(org_name: str):
    users = _rand(50, 500)
    mfa_pct = _rand(70, 100)
    failed_auths = _rand(0, 30)
    bypass_codes = _rand(0, 10)
    return {
        "provider": "Duo Security",
        "icon": "👥",
        "color": "#6BBB47",
        "status": "connected",
        "summary": f"{mfa_pct}% MFA coverage · {failed_auths} failed auths · {bypass_codes} bypass codes",
        "findings": [
            {"severity": "MEDIUM" if mfa_pct < 90 else "LOW",
             "title": f"MFA coverage at {mfa_pct}%",
             "description": f"{round(users * (100-mfa_pct)/100)} users not enrolled in Duo MFA.",
             "recommendation": "Enforce Duo MFA policy for all users — no exceptions."},
            {"severity": "HIGH" if failed_auths > 15 else "MEDIUM",
             "title": f"{failed_auths} failed authentication attempts",
             "description": "Multiple failed Duo authentications — potential account takeover attempts.",
             "recommendation": "Review failed auth sources and block suspicious IP addresses."},
        ],
        "metrics": {"total_users": users, "mfa_coverage_pct": mfa_pct,
                    "failed_auths": failed_auths, "bypass_codes_active": bypass_codes},
        "last_synced": _now(),
    }


# ── Snyk ──────────────────────────────────────────────────────────────────────
def pull_snyk(org_name: str):
    critical_vulns = _rand(0, 20)
    total_vulns = _rand(10, 100)
    projects = _rand(5, 50)
    fixable = _rand(5, 60)
    return {
        "provider": "Snyk",
        "icon": "🐛",
        "color": "#4C4A73",
        "status": "connected",
        "summary": f"{critical_vulns} critical · {total_vulns} total vulns · {fixable}% fixable · {projects} projects",
        "findings": [
            {"severity": "HIGH" if critical_vulns > 5 else "MEDIUM",
             "title": f"{critical_vulns} critical open source vulnerabilities",
             "description": "Snyk detected critical CVEs in open source dependencies.",
             "recommendation": "Run snyk fix to automatically upgrade vulnerable packages."},
            {"severity": "MEDIUM",
             "title": f"{fixable}% of vulnerabilities auto-fixable",
             "description": "Snyk can automatically fix majority of detected vulnerabilities.",
             "recommendation": "Run snyk fix or open Snyk PRs to fix vulnerabilities automatically."},
        ],
        "metrics": {"critical_vulns": critical_vulns, "total_vulns": total_vulns,
                    "projects_monitored": projects, "auto_fixable_pct": fixable},
        "last_synced": _now(),
    }


# ── BeyondTrust ───────────────────────────────────────────────────────────────
def pull_beyondtrust(org_name: str):
    privileged_accounts = _rand(10, 100)
    password_age_old = _rand(0, 20)
    sessions = _rand(0, 50)
    return {
        "provider": "BeyondTrust",
        "icon": "🏰",
        "color": "#E31837",
        "status": "connected",
        "summary": f"{privileged_accounts} privileged accounts · {password_age_old} aged passwords · {sessions} active sessions",
        "findings": [
            {"severity": "HIGH" if password_age_old > 10 else "MEDIUM",
             "title": f"{password_age_old} privileged accounts with aged passwords",
             "description": "Privileged account passwords not rotated within policy timeframe.",
             "recommendation": "Rotate aged privileged account passwords using BeyondTrust PAM."},
            {"severity": "MEDIUM" if sessions > 20 else "LOW",
             "title": f"{sessions} active privileged sessions",
             "description": "Concurrent privileged sessions — review for unneeded access.",
             "recommendation": "Audit active privileged sessions and terminate unnecessary ones."},
        ],
        "metrics": {"privileged_accounts": privileged_accounts, "aged_passwords": password_age_old,
                    "active_sessions": sessions, "policy_compliance_pct": _rand(60, 95)},
        "last_synced": _now(),
    }


# ── Darktrace ─────────────────────────────────────────────────────────────────
def pull_darktrace(org_name: str):
    ai_alerts = _rand(0, 30)
    critical = _rand(0, 8)
    autonomous_actions = _rand(0, 20)
    return {
        "provider": "Darktrace",
        "icon": "🧠",
        "color": "#6236FF",
        "status": "connected",
        "summary": f"{ai_alerts} AI alerts · {critical} critical · {autonomous_actions} autonomous responses",
        "findings": [
            {"severity": "HIGH" if critical > 3 else "MEDIUM",
             "title": f"{critical} critical AI-detected threats",
             "description": "Darktrace AI identified critical unusual behaviour in network traffic.",
             "recommendation": "Review critical model breaches in Darktrace Threat Visualiser."},
            {"severity": "LOW",
             "title": f"{autonomous_actions} threats autonomously contained by Antigena",
             "description": "Darktrace Antigena autonomously responded to detected threats.",
             "recommendation": "Review autonomous actions to confirm appropriate responses."},
        ],
        "metrics": {"ai_alerts": ai_alerts, "critical_alerts": critical,
                    "autonomous_responses": autonomous_actions, "devices_monitored": _rand(100, 2000)},
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
    "pagerduty":         pull_pagerduty,
    "qualys":            pull_qualys,
    "sentinelone":       pull_sentinelone,
    "microsoft_defender":pull_microsoft_defender,
    "cloudflare":        pull_cloudflare,
    "hashicorp_vault":   pull_hashicorp_vault,
    "elastic_security":  pull_elastic_security,
    "wiz":               pull_wiz,
    "sonarqube":         pull_sonarqube,
    "rapid7":            pull_rapid7,
    "carbon_black":      pull_carbon_black,
    "trend_micro":       pull_trend_micro,
    "lacework":          pull_lacework,
    "prisma_cloud":      pull_prisma_cloud,
    "veracode":          pull_veracode,
    "nessus":            pull_nessus,
    "duo":               pull_duo,
    "snyk":              pull_snyk,
    "beyondtrust":       pull_beyondtrust,
    "darktrace":         pull_darktrace,

}


def pull_integration(provider: str, org_name: str = "Organisation"):
    handler = INTEGRATION_HANDLERS.get(provider.lower())
    if not handler:
        return {"error": f"Unknown provider: {provider}"}
    return handler(org_name)


def pull_all_integrations(org_name: str = "Organisation"):
    return {k: v(org_name) for k, v in INTEGRATION_HANDLERS.items()}
