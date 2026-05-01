"""
llm_service.py — Claude API Remediation Advice
Place at: backend/services/llm_service.py

Uses Claude claude-sonnet-4-20250514 to generate specific, actionable remediation
steps based on the organisation's actual findings.

Configure in .env:
  ANTHROPIC_API_KEY=sk-ant-...

Without API key: returns intelligent template-based advice (no AI needed).
"""

import os
import json
import httpx
from typing import List, Dict, Any, Optional

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
LLM_ENABLED = bool(ANTHROPIC_API_KEY)

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
MODEL = "claude-sonnet-4-20250514"


def _call_claude(prompt: str, max_tokens: int = 1500) -> str:
    """Call Claude API and return text response."""
    headers = {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    body = {
        "model": MODEL,
        "max_tokens": max_tokens,
        "messages": [{"role": "user", "content": prompt}],
        "system": (
            "You are a senior cybersecurity consultant specialising in GRC "
            "(Governance, Risk & Compliance). You give precise, actionable, "
            "step-by-step remediation advice. Be specific — name exact tools, "
            "menu paths, commands, and policies. Be concise but complete. "
            "Format as numbered steps. No generic advice."
        ),
    }
    try:
        with httpx.Client(timeout=30) as client:
            res = client.post(ANTHROPIC_URL, json=body, headers=headers)
            if res.status_code == 200:
                return res.json()["content"][0]["text"]
            else:
                return f"API error {res.status_code}: {res.text[:200]}"
    except Exception as e:
        return f"Connection error: {e}"


def _smart_template(finding: Dict, org_name: str, industry: str) -> str:
    """
    Intelligent template-based advice when Claude API not configured.
    Produces specific, useful guidance without requiring API key.
    """
    control = finding.get("control", "")
    severity = finding.get("severity", "MEDIUM")
    nist_ref = finding.get("nist_ref", "")
    iso_ref = finding.get("iso_ref", "")

    templates = {
        "MFA": f"""Step-by-step MFA remediation for {org_name}:

1. **Azure AD (Priority 1)**: Admin Centre → Azure AD → Security → Authentication Methods → Enable Microsoft Authenticator for all users
2. **Create Conditional Access Policy**: Named "Require MFA for All Users" — Assignments: All users → Cloud apps: All apps → Grant: Require MFA
3. **Block Legacy Authentication**: Create CA policy "Block Legacy Auth" — Conditions: Client apps = Exchange ActiveSync + Other clients → Block
4. **Set 14-day rollout target**: Report on MFA adoption via Azure AD → Monitoring → Sign-in logs → filter by MFA status
5. **AWS IAM**: IAM Console → Users → select each → Security credentials → Assign MFA device (Virtual MFA recommended)
6. **Google Workspace**: Admin Console → Security → 2-Step Verification → Allow users to turn on → Enforcement: On (grace period: 1 week)

Framework alignment: NIST {nist_ref} requires "users, services and hardware to be authenticated." ISO {iso_ref} requires secure authentication information management.
Expected timeline: 2 weeks to full deployment.""",

        "Patch": f"""Step-by-step patch management remediation for {org_name}:

1. **Intune Compliance Policy**: Endpoint Manager → Devices → Compliance policies → Create policy → Windows 10+ → Require device compliance within 3 days of patch release
2. **Update Rings**: Endpoint Manager → Devices → Windows → Update rings → Create ring: "Critical Patches" → Quality update deferral: 0 days, Feature: 30 days
3. **Pilot → Broad deployment**: Tag 5% of devices as pilot ring, deploy to all after 48hr validation
4. **WSUS / Windows Update for Business**: GPO: Computer → Admin Templates → Windows → Windows Update → Configure Automatic Updates = 4 (Auto download + schedule install), Schedule: Daily 2AM
5. **Jamf (macOS)**: Jamf Pro → Policies → New → Patch Management → Software Title: macOS → Enforce update within 7 days
6. **Monitoring**: Create Azure Monitor alert when Intune compliance drops below 90%

NIST {nist_ref} target: Patch critical vulnerabilities within 72 hours of release. ISO {iso_ref}: All technical vulnerabilities must be managed systematically.""",

        "Encryption": f"""Step-by-step encryption remediation for {org_name}:

1. **BitLocker (Windows)**: Intune → Endpoint Security → Disk Encryption → Create policy → BitLocker → Enable BitLocker: Yes, Encrypt: Required, Recovery key: Azure AD escrow
2. **S3 Encryption**: AWS Console → S3 → Each bucket → Properties → Default encryption → SSE-S3 (AES-256) or SSE-KMS. Apply to all buckets via AWS Config rule: s3-bucket-server-side-encryption-enabled
3. **Azure Storage**: Storage Account → Encryption → Microsoft-managed keys (default on) OR Customer-managed keys for GDPR compliance
4. **RDS**: Existing unencrypted RDS: Create snapshot → Restore snapshot with encryption enabled → Point DNS to new instance
5. **FileVault (macOS)**: Jamf → Configuration Profiles → FileVault → Enable FileVault: Yes → Recovery key: Institutional
6. **Verify coverage**: Run AWS Config rule "encrypted-volumes" weekly; Intune Encryption report under Devices → Monitor

ISO {iso_ref}: All data at rest must be encrypted. Target: 100% encryption coverage within 30 days.""",

        "Access": f"""Step-by-step access control remediation for {org_name}:

1. **IAM Access Analyzer (AWS)**: IAM Console → Access Analyzer → Create analyzer → Review all findings → Remove unused permissions → Enable in all regions
2. **Azure PIM**: Azure AD → Privileged Identity Management → Azure AD roles → Enable for all admin roles → Require justification + MFA for activation
3. **Least Privilege Review**: Export IAM credential report (AWS CLI: aws iam generate-credential-report) → Identify roles with AdministratorAccess → Replace with specific policies
4. **Access Review**: Azure AD → Identity Governance → Access reviews → Create monthly review for all privileged roles → Auto-apply results
5. **Stale Access Keys**: AWS CLI: aws iam list-access-keys → Disable keys older than 90 days → Migrate workloads to IAM roles (no long-term credentials needed)
6. **Google Workspace**: Admin Console → Directory → Users → Review super admins → Reduce to ≤ 3 accounts → Enable admin activity audit logs

NIST {nist_ref}: Access permissions must be managed and enforced on a least-privilege basis.""",

        "Logging": f"""Step-by-step audit logging remediation for {org_name}:

1. **AWS CloudTrail**: CloudTrail Console → Trails → Create trail → Multi-region: Yes → S3 bucket with Object Lock → CloudWatch Logs integration → Enable log file validation
2. **Azure Monitor**: Azure Portal → Monitor → Activity log → Export to Log Analytics workspace → Retention: 90 days minimum
3. **Microsoft Sentinel (SIEM)**: Azure Portal → Sentinel → Create workspace → Connect data sources: Azure AD + O365 + AWS → Enable built-in analytics rules
4. **Google Cloud Audit Logs**: GCP Console → IAM → Audit Logs → Enable Data Access logs for all services (Admin activity always on)
5. **Log Alerting**: Create alerts for: Multiple failed logins (> 5 in 10 min), Admin role assignment, Bulk data download, After-hours privileged access
6. **Retention Policy**: Set CloudTrail S3 lifecycle: 90 days standard → 1 year Glacier → 7 years delete (adjust for {industry} compliance requirements)

NIST {nist_ref}: Log records must be created to enable monitoring and incident investigation.""",
    }

    # Match template by control name keywords
    for keyword, template in templates.items():
        if keyword.lower() in control.lower():
            return template

    # Generic fallback
    return f"""Remediation steps for {control} ({severity}) — {org_name}:

1. **Assess current state**: Document current implementation status of {control}
2. **Gap analysis**: Compare against {iso_ref} requirements and {nist_ref} subcategory
3. **Assign owner**: Designate responsible team member with clear deadline
4. **Implement fix**: {finding.get("recommendation", "Apply recommended configuration changes")}
5. **Test and verify**: Confirm fix using relevant compliance tooling
6. **Document evidence**: Capture screenshots/logs as audit evidence
7. **Set review date**: Schedule quarterly review to ensure control remains effective

Priority: {severity} — Target completion: {"72 hours" if severity == "CRITICAL" else "7 days" if severity == "HIGH" else "30 days"}"""


def get_remediation_advice(
    findings: List[Dict],
    org_name: str,
    industry: str = "Technology",
    employees: int = 100,
) -> List[Dict[str, Any]]:
    """
    Main function: generates specific remediation advice for each finding.
    Uses Claude API if configured, falls back to smart templates.
    """
    results = []

    for finding in findings[:10]:  # limit to top 10 to avoid rate limits
        severity = finding.get("severity", "MEDIUM")
        control = finding.get("control", "")

        if LLM_ENABLED:
            prompt = f"""Organisation: {org_name}
Industry: {industry}
Employees: {employees}
Security Finding:
  - Severity: {severity}
  - Control: {control}
  - Finding: {finding.get("finding", "")}
  - NIST Reference: {finding.get("nist_ref", "")}
  - ISO 27001 Reference: {finding.get("iso_ref", "")}

Provide specific, step-by-step remediation instructions for this exact finding.
Include: exact tool names, menu paths, CLI commands, configuration settings, and timeline.
Be specific to their industry ({industry}) and size ({employees} employees).
Format as numbered steps. Maximum 8 steps."""

            advice_text = _call_claude(prompt)
            source = "claude-ai"
        else:
            advice_text = _smart_template(finding, org_name, industry)
            source = "smart-template"

        results.append({
            "control": control,
            "severity": severity,
            "nist_ref": finding.get("nist_ref", ""),
            "iso_ref": finding.get("iso_ref", ""),
            "original_finding": finding.get("finding", ""),
            "original_recommendation": finding.get("recommendation", ""),
            "detailed_steps": advice_text,
            "source": source,
            "estimated_effort": {
                "CRITICAL": "1-3 days",
                "HIGH": "1-2 weeks",
                "MEDIUM": "2-4 weeks",
                "LOW": "1-3 months",
            }.get(severity, "2-4 weeks"),
        })

    return results


def get_executive_summary(
    org_name: str,
    risk_score: float,
    risk_level: str,
    industry: str,
    top_findings: List[Dict],
    implemented_controls: int,
    total_controls: int,
) -> str:
    """Generate board-ready executive summary."""

    if LLM_ENABLED:
        findings_text = "\n".join([
            f"- {f.get('severity', '')} | {f.get('control', '')} | {f.get('finding', '')[:100]}"
            for f in top_findings[:5]
        ])
        prompt = f"""Write a concise board-level cybersecurity executive summary for {org_name}.

Data:
- Industry: {industry}
- Overall Risk Score: {risk_score:.0f}/100 ({risk_level})
- Controls Implemented: {implemented_controls}/{total_controls} ({implemented_controls/max(total_controls,1)*100:.0f}%)
- Top Findings:
{findings_text}

Requirements:
- 3 paragraphs maximum
- Non-technical language suitable for board presentation
- Include business impact and financial risk context
- End with 3 specific recommended board-level actions
- Tone: professional, urgent where appropriate, solution-focused"""
        return _call_claude(prompt, max_tokens=600)

    # Smart template
    level_text = {
        "CRITICAL": "requires immediate board attention and emergency resource allocation",
        "HIGH": "requires urgent remediation and increased security investment",
        "MEDIUM": "indicates moderate risk requiring structured improvement programme",
        "LOW": "demonstrates a mature security posture with minor improvements needed",
    }.get(risk_level, "requires attention")

    critical_count = sum(1 for f in top_findings if f.get("severity") == "CRITICAL")
    high_count = sum(1 for f in top_findings if f.get("severity") == "HIGH")

    return f"""Executive Summary — {org_name} Cybersecurity Posture

{org_name}'s current cybersecurity risk score of {risk_score:.0f}/100 ({risk_level}) {level_text}. An automated assessment across identity management, patch compliance, and cloud asset security identified {critical_count} critical and {high_count} high-severity findings that expose the organisation to potential data breach, regulatory non-compliance, and operational disruption.

Of {total_controls} security controls evaluated across ISO 27001:2022 and NIST CSF v2.0 frameworks, {implemented_controls} ({implemented_controls/max(total_controls,1)*100:.0f}%) are currently implemented. The primary gaps involve {"multi-factor authentication coverage, " if any("MFA" in f.get("control","") for f in top_findings) else ""}{"patch management cadence, " if any("Patch" in f.get("control","") for f in top_findings) else ""}{"and cloud asset security controls" if any("Cloud" in f.get("control","") or "S3" in f.get("control","") for f in top_findings) else "access controls and monitoring"}. The estimated financial exposure using the FAIR risk model is significant given {org_name}'s profile in the {industry} sector.

Recommended board actions: (1) Approve emergency remediation budget for the {critical_count} critical findings, targeting resolution within 72 hours; (2) Commission quarterly AURA assessments to track improvement trajectory; (3) Review and approve the organisation's Incident Response Plan to ensure executive readiness for potential security incidents."""
