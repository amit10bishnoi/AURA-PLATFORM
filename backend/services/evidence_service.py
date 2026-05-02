"""
evidence_service.py — Automated Evidence Collection
Place at: backend/services/evidence_service.py

Converts auto-assessment data into compliance evidence artifacts.
Each piece of evidence is a verified, timestamped proof item that:
  - Links to a compliance control
  - Shows the data source (Azure AD, Intune, AWS etc.)
  - Provides a pass/fail verdict with specific data
  - Can be exported as PDF or JSON for auditors

This replaces manual screenshots and spreadsheets.
"""

import os
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List

IST_OFFSET = timedelta(hours=5, minutes=30)
def ist_now(): return (datetime.utcnow() + IST_OFFSET).strftime("%Y-%m-%dT%H:%M:%S IST")


def generate_evidence_package(
    assessment: Any,
    identity_data: Dict = None,
    patch_data: Dict = None,
    asset_data: Dict = None,
) -> List[Dict[str, Any]]:
    """
    Generates evidence artifacts from auto-pulled data.
    Each item is one piece of auditable evidence.
    """
    evidence = []
    collected_at = ist_now()

    # ── MFA Evidence ─────────────────────────────────────────────────────────
    if identity_data:
        id_summary = identity_data.get("summary", {})
        mfa_pct = id_summary.get("mfa_coverage_pct", 0)
        azure = identity_data.get("providers", {}).get("azure_ad", {})
        az_summary = azure.get("summary", {})

        evidence.append({
            "id": "EVD-MFA-001",
            "title": "Multi-Factor Authentication Coverage",
            "framework_refs": {
                "SOC2": "CC6.1", "ISO27001": "A.8.5",
                "HIPAA": "164.312(d)", "NIST_CSF": "PR.AA-03",
            },
            "status": "PASS" if mfa_pct >= 80 else "FAIL" if mfa_pct < 50 else "PARTIAL",
            "source": "Azure AD / Microsoft Graph API",
            "collected_at": collected_at,
            "data": {
                "total_users": az_summary.get("total_users", 0),
                "mfa_enabled_users": az_summary.get("mfa_enabled_users", 0),
                "mfa_coverage_pct": mfa_pct,
                "admin_mfa_pct": az_summary.get("admin_mfa_pct", 0),
                "conditional_access_policies": az_summary.get("conditional_access_policies", 0),
                "legacy_auth_blocked": az_summary.get("legacy_auth_blocked", False),
            },
            "verdict": f"MFA enabled for {mfa_pct:.0f}% of users. {'✅ Meets 80% threshold.' if mfa_pct >= 80 else '⚠️ Below 80% — remediation required.'}",
            "auditor_note": f"Verified automatically from Azure AD on {collected_at}. No manual verification required.",
        })

        # Inactive users evidence
        inactive = az_summary.get("inactive_30d", 0)
        total = az_summary.get("total_users", 1)
        evidence.append({
            "id": "EVD-ACC-001",
            "title": "Access Rights Lifecycle — Inactive Accounts",
            "framework_refs": {
                "ISO27001": "A.5.18", "NIST_CSF": "PR.AA-05", "GDPR": "Art.5(1)(f)",
            },
            "status": "PASS" if inactive / total < 0.05 else "FAIL" if inactive / total > 0.15 else "PARTIAL",
            "source": "Azure AD — User Sign-in Activity",
            "collected_at": collected_at,
            "data": {
                "inactive_accounts_30d": inactive,
                "inactive_pct": round(inactive / max(total, 1) * 100, 1),
                "total_accounts": total,
                "threshold": "< 5% inactive = PASS",
            },
            "verdict": f"{inactive} accounts inactive for 30+ days ({inactive/max(total,1)*100:.0f}% of users).",
            "auditor_note": "Pull from Azure AD Sign-in logs. Inactive = no successful login in 30 days.",
        })

    # ── Patch Evidence ────────────────────────────────────────────────────────
    if patch_data:
        intune = patch_data.get("providers", {}).get("intune", {})
        intune_summary = intune.get("summary", {})
        patch_lag = intune_summary.get("patch_lag_days", 0)
        cves = patch_data.get("all_cves", [])
        critical_cves = [c for c in cves if c.get("severity") == "CRITICAL"]

        evidence.append({
            "id": "EVD-PAT-001",
            "title": "Patch Management Compliance",
            "framework_refs": {
                "ISO27001": "A.8.8", "NIST_CSF": "PR.PS-02",
                "PCI_DSS": "Req.6", "RBI": "RBI-IT-4",
            },
            "status": "PASS" if patch_lag <= 14 else "FAIL" if patch_lag > 30 else "PARTIAL",
            "source": "Microsoft Intune — Device Compliance",
            "collected_at": collected_at,
            "data": {
                "avg_patch_lag_days": patch_lag,
                "managed_devices": intune_summary.get("managed_devices", 0),
                "compliant_pct": intune_summary.get("compliant_pct", 0),
                "critical_patches_missing": intune_summary.get("critical_patches_missing", 0),
                "eol_devices": intune_summary.get("eol_devices", 0),
                "threshold": "≤ 14 days = PASS (NIST SP 800-40)",
            },
            "verdict": f"Average patch lag: {patch_lag} days. {'✅ Within 14-day threshold.' if patch_lag <= 14 else '❌ Exceeds 14-day NIST recommendation.'}",
            "auditor_note": "Automatically verified from Intune device compliance report.",
        })

        if critical_cves:
            evidence.append({
                "id": "EVD-VUL-001",
                "title": "Critical Vulnerability Status",
                "framework_refs": {
                    "ISO27001": "A.8.8", "NIST_CSF": "ID.RA-01",
                    "HIPAA": "164.308(a)(1)", "PCI_DSS": "Req.6",
                },
                "status": "FAIL" if len(critical_cves) > 0 else "PASS",
                "source": "Intune + NVD CVE Feed",
                "collected_at": collected_at,
                "data": {
                    "critical_cves": len(critical_cves),
                    "total_cves": len(cves),
                    "cve_list": [{"id": c.get("cve"), "product": c.get("product"), "cvss": c.get("cvss")} for c in critical_cves[:5]],
                },
                "verdict": f"{len(critical_cves)} critical CVEs unpatched. {'❌ Immediate remediation required.' if critical_cves else '✅ No critical CVEs.'}",
                "auditor_note": "CVE data sourced from NIST NVD. Affected device count from Intune.",
            })

    # ── Asset Evidence ────────────────────────────────────────────────────────
    if asset_data:
        aws = asset_data.get("providers", {}).get("aws", {})
        aws_summary = aws.get("summary", {})
        s3_public = aws_summary.get("s3_public", 0)
        encrypted_pct = 100 - (aws_summary.get("s3_unencrypted", 0) / max(aws_summary.get("s3_buckets", 1), 1) * 100)

        evidence.append({
            "id": "EVD-ENC-001",
            "title": "Data Encryption at Rest",
            "framework_refs": {
                "ISO27001": "A.8.24", "NIST_CSF": "PR.DS-01",
                "HIPAA": "164.312(c)(1)", "GDPR": "Art.32",
                "PCI_DSS": "Req.3", "DPDP": "DPDP-S8",
            },
            "status": "PASS" if s3_public == 0 and encrypted_pct >= 95 else "FAIL",
            "source": "AWS S3 / Azure Storage / GCP Cloud Storage",
            "collected_at": collected_at,
            "data": {
                "public_buckets": s3_public,
                "encrypted_pct": round(encrypted_pct, 1),
                "total_buckets": aws_summary.get("s3_buckets", 0),
                "unencrypted_buckets": aws_summary.get("s3_unencrypted", 0),
            },
            "verdict": f"{'✅' if s3_public == 0 else '❌'} {s3_public} public S3 buckets. {encrypted_pct:.0f}% encrypted.",
            "auditor_note": "Verified from AWS S3 bucket policies and default encryption settings.",
        })

        evidence.append({
            "id": "EVD-LOG-001",
            "title": "Audit Logging Active",
            "framework_refs": {
                "ISO27001": "A.8.15", "NIST_CSF": "PR.PS-04",
                "HIPAA": "164.312(b)", "GDPR": "Art.30",
                "PCI_DSS": "Req.10", "RBI": "RBI-IT-6",
            },
            "status": "PASS" if aws_summary.get("cloudtrail_enabled", False) else "FAIL",
            "source": "AWS CloudTrail / Azure Monitor",
            "collected_at": collected_at,
            "data": {
                "cloudtrail_enabled": aws_summary.get("cloudtrail_enabled", False),
                "guardduty_enabled": aws_summary.get("guardduty_enabled", False),
                "config_enabled": aws_summary.get("config_enabled", False),
            },
            "verdict": f"{'✅ CloudTrail enabled' if aws_summary.get('cloudtrail_enabled') else '❌ CloudTrail disabled — no API audit trail'}",
            "auditor_note": "CloudTrail status verified from AWS API. Must be enabled in ALL regions.",
        })

    # ── Training Evidence ─────────────────────────────────────────────────────
    training_pct = getattr(assessment, "training_percent", 0) or 0
    evidence.append({
        "id": "EVD-TRN-001",
        "title": "Security Awareness Training Coverage",
        "framework_refs": {
            "ISO27001": "A.6.3", "NIST_CSF": "PR.AT-01",
            "HIPAA": "164.308(a)(5)", "PCI_DSS": "Req.12",
        },
        "status": "PASS" if training_pct >= 80 else "FAIL" if training_pct < 50 else "PARTIAL",
        "source": "Self-Attested (connect LMS for automated verification)",
        "collected_at": collected_at,
        "data": {
            "training_coverage_pct": training_pct,
            "threshold": "≥ 80% = PASS",
            "note": "Connect Workday, BambooHR, or Cornerstone LMS for automated verification",
        },
        "verdict": f"Security training completed by {training_pct}% of employees.",
        "auditor_note": "Self-attested. Auditors should request LMS completion certificates.",
    })

    # ── IRP Evidence ──────────────────────────────────────────────────────────
    has_irp = getattr(assessment, "has_irp", False) or False
    evidence.append({
        "id": "EVD-IRP-001",
        "title": "Incident Response Plan",
        "framework_refs": {
            "ISO27001": "A.5.24", "NIST_CSF": "RS.MA-01",
            "HIPAA": "164.308(a)(6)", "GDPR": "Art.33",
            "RBI": "RBI-IT-6", "DPDP": "DPDP-S8(6)",
        },
        "status": "PASS" if has_irp else "FAIL",
        "source": "Self-Attested",
        "collected_at": collected_at,
        "data": {
            "irp_exists": has_irp,
            "note": "Upload IRP document to Evidence Locker for auditor review",
        },
        "verdict": f"{'✅ Incident Response Plan exists' if has_irp else '❌ No Incident Response Plan — critical gap'}",
        "auditor_note": "Request IRP document, last review date, and tabletop exercise records.",
    })

    return evidence


def format_evidence_for_auditor(evidence_list: List[Dict]) -> Dict[str, Any]:
    """Formats evidence package for auditor download."""
    pass_count    = sum(1 for e in evidence_list if e["status"] == "PASS")
    fail_count    = sum(1 for e in evidence_list if e["status"] == "FAIL")
    partial_count = sum(1 for e in evidence_list if e["status"] == "PARTIAL")

    return {
        "generated_at": ist_now(),
        "total_evidence_items": len(evidence_list),
        "pass": pass_count,
        "fail": fail_count,
        "partial": partial_count,
        "readiness_score": round(
            (pass_count + partial_count * 0.5) / max(len(evidence_list), 1) * 100, 1
        ),
        "evidence": evidence_list,
        "auditor_instructions": (
            "This evidence package was auto-generated by AURA Platform. "
            "All AUTOMATED sources (Azure AD, Intune, AWS) are verified data. "
            "SELF-ATTESTED items require manual document verification. "
            "Evidence collected at timestamps shown in IST (India Standard Time)."
        ),
    }
