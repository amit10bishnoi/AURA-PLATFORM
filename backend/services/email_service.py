"""
email_service.py — Automated Email Alerts
Place at: backend/services/email_service.py

Sends alerts when:
  - Compliance score drops > 10 points
  - New CRITICAL vulnerability found
  - Weekly assessment summary

Configure in .env:
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your@gmail.com
  SMTP_PASSWORD=your_app_password
  ALERT_FROM_EMAIL=noreply@aura-platform.com
"""

import os, smtplib, json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone, timedelta, timezone, timedelta
from typing import List, Dict, Any, Optional

SMTP_HOST     = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER     = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL    = os.getenv("ALERT_FROM_EMAIL", "noreply@aura-platform.com")
EMAIL_ENABLED = bool(SMTP_USER and SMTP_PASSWORD)


def _send_email(to: str, subject: str, html_body: str) -> Dict[str, Any]:
    """Core send function. Returns status dict."""
    if not EMAIL_ENABLED:
        # Simulation mode — log to console
        print(f"[EMAIL SIMULATED] To: {to}")
        print(f"  Subject: {subject}")
        print(f"  Body preview: {html_body[:200]}...")
        return {"sent": False, "mode": "simulated", "to": to, "subject": subject}

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = FROM_EMAIL
        msg["To"]      = to
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, to, msg.as_string())

        return {"sent": True, "mode": "live", "to": to, "subject": subject}
    except Exception as e:
        return {"sent": False, "mode": "error", "error": str(e), "to": to}


def _risk_color(level: str) -> str:
    return {"CRITICAL": "#EF4444", "HIGH": "#F97316", "MEDIUM": "#EAB308", "LOW": "#22C55E"}.get(level, "#6366F1")


def send_score_drop_alert(
    to_email: str,
    org_name: str,
    previous_score: float,
    new_score: float,
    risk_level: str,
    top_findings: List[Dict],
) -> Dict[str, Any]:
    """Alert when compliance/risk score drops significantly."""
    drop = previous_score - new_score
    color = _risk_color(risk_level)

    findings_html = "".join([
        f'''<tr>
          <td style="padding:10px;border-bottom:1px solid #E4E7EF;">
            <span style="background:{_risk_color(f.get("severity","LOW"))}20;color:{_risk_color(f.get("severity","LOW"))};
              padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;">{f.get("severity","")}</span>
          </td>
          <td style="padding:10px;border-bottom:1px solid #E4E7EF;font-size:13px;">{f.get("control","")}</td>
          <td style="padding:10px;border-bottom:1px solid #E4E7EF;font-size:12px;color:#6B7280;">{f.get("finding","")[:100]}</td>
        </tr>'''
        for f in top_findings[:5]
    ])

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#F8F9FC;padding:20px;">
      <div style="background:{color};color:#fff;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="margin:0;font-size:24px;">⚠️ Risk Score Alert</h1>
        <p style="margin:8px 0 0;opacity:.85;">AURA Platform — {org_name}</p>
      </div>
      <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;box-shadow:0 4px 12px rgba(0,0,0,.08);">
        <p style="font-size:15px;color:#374151;">Your risk score has changed significantly:</p>
        <div style="display:flex;gap:16px;margin:20px 0;">
          <div style="flex:1;text-align:center;background:#F3F4F6;padding:16px;border-radius:8px;">
            <div style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:1px;">Previous Score</div>
            <div style="font-size:32px;font-weight:800;color:#374151;">{previous_score:.0f}</div>
          </div>
          <div style="flex:1;text-align:center;background:{color}15;padding:16px;border-radius:8px;border:2px solid {color};">
            <div style="font-size:11px;color:{color};text-transform:uppercase;letter-spacing:1px;">New Score</div>
            <div style="font-size:32px;font-weight:800;color:{color};">{new_score:.0f}</div>
          </div>
          <div style="flex:1;text-align:center;background:#FEF2F2;padding:16px;border-radius:8px;">
            <div style="font-size:11px;color:#EF4444;text-transform:uppercase;letter-spacing:1px;">Change</div>
            <div style="font-size:32px;font-weight:800;color:#EF4444;">+{drop:.0f}</div>
          </div>
        </div>
        <h3 style="color:#374151;margin:24px 0 12px;">Top Findings Requiring Action</h3>
        <table style="width:100%;border-collapse:collapse;background:#F9FAFB;border-radius:8px;overflow:hidden;">
          <thead><tr style="background:#E5E7EB;">
            <th style="padding:10px;text-align:left;font-size:11px;text-transform:uppercase;">Severity</th>
            <th style="padding:10px;text-align:left;font-size:11px;text-transform:uppercase;">Control</th>
            <th style="padding:10px;text-align:left;font-size:11px;text-transform:uppercase;">Finding</th>
          </tr></thead>
          <tbody>{findings_html}</tbody>
        </table>
        <div style="margin-top:24px;text-align:center;">
          <a href="http://localhost:3000" style="background:#4F46E5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
            View in AURA Dashboard →
          </a>
        </div>
        <p style="font-size:11px;color:#9CA3AF;margin-top:24px;text-align:center;">
          AURA Platform · Automated Security Alert · {(datetime.utcnow() + timedelta(hours=5, minutes=30)).strftime("%Y-%m-%d %H:%M IST")}
        </p>
      </div>
    </div>
    """
    return _send_email(to_email, f"⚠️ AURA Alert: Risk Score Increased by {drop:.0f} pts — {org_name}", html)


def send_weekly_summary(
    to_email: str,
    org_name: str,
    assessment_count: int,
    avg_score: float,
    risk_level: str,
    open_tasks: int,
    completed_tasks: int,
    critical_findings: int,
) -> Dict[str, Any]:
    """Weekly summary email sent every Monday."""
    color = _risk_color(risk_level)
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#F8F9FC;padding:20px;">
      <div style="background:linear-gradient(135deg,#1e1b4b,#4338ca);color:#fff;padding:24px;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;font-size:22px;">📊 Weekly Security Summary</h1>
        <p style="margin:6px 0 0;opacity:.75;">{org_name} · Week of {(datetime.utcnow() + timedelta(hours=5, minutes=30)).strftime("%B %d, %Y")}</p>
      </div>
      <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;box-shadow:0 4px 12px rgba(0,0,0,.08);">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
          {"".join([
            f'<div style="background:#F9FAFB;padding:16px;border-radius:8px;text-align:center;border-left:3px solid {c};">'
            f'<div style="font-size:24px;font-weight:800;color:{c};">{v}</div>'
            f'<div style="font-size:12px;color:#6B7280;margin-top:4px;">{l}</div></div>'
            for v, l, c in [
                (f"{avg_score:.0f}", "Avg Risk Score", color),
                (assessment_count, "Assessments Run", "#6366F1"),
                (open_tasks, "Open Tasks", "#F97316"),
                (completed_tasks, "Completed Tasks", "#22C55E"),
            ]
          ])}
        </div>
        {"'<div style=\"background:#FEF2F2;border:1px solid #FCA5A5;border-radius:8px;padding:12px;margin-bottom:16px;\">'" +
         f'<strong style=\"color:#EF4444;">⚠️ {critical_findings} Critical findings require immediate attention</strong>' +
         '</div>' if critical_findings > 0 else ""}
        <div style="margin-top:24px;text-align:center;">
          <a href="http://localhost:3000" style="background:#4F46E5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
            Open AURA Dashboard →
          </a>
        </div>
        <p style="font-size:11px;color:#9CA3AF;margin-top:24px;text-align:center;">
          AURA Platform · Weekly Digest · Auto-generated every Monday 9AM
        </p>
      </div>
    </div>
    """
    return _send_email(to_email, f"📊 AURA Weekly Summary — {org_name}", html)


def send_critical_vuln_alert(
    to_email: str,
    org_name: str,
    cve_id: str,
    product: str,
    cvss_score: float,
    affected_devices: int,
    recommendation: str,
) -> Dict[str, Any]:
    """Instant alert when a new CRITICAL CVE affects the org."""
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#F8F9FC;padding:20px;">
      <div style="background:#EF4444;color:#fff;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="margin:0;font-size:22px;">🚨 Critical Vulnerability Detected</h1>
        <p style="margin:6px 0 0;opacity:.85;">{org_name}</p>
      </div>
      <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;box-shadow:0 4px 12px rgba(0,0,0,.08);">
        <div style="background:#FEF2F2;border:2px solid #EF4444;border-radius:8px;padding:16px;margin-bottom:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:18px;font-weight:800;color:#EF4444;">{cve_id}</div>
              <div style="font-size:14px;color:#374151;margin-top:4px;">Affects: <strong>{product}</strong></div>
            </div>
            <div style="text-align:center;background:#EF4444;color:#fff;padding:12px 16px;border-radius:8px;">
              <div style="font-size:24px;font-weight:800;">{cvss_score}</div>
              <div style="font-size:10px;opacity:.85;">CVSS Score</div>
            </div>
          </div>
        </div>
        <p><strong>Affected Devices:</strong> {affected_devices}</p>
        <p><strong>Recommended Action:</strong> {recommendation}</p>
        <div style="margin-top:24px;text-align:center;">
          <a href="http://localhost:3000" style="background:#EF4444;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
            View Remediation Tasks →
          </a>
        </div>
        <p style="font-size:11px;color:#9CA3AF;margin-top:24px;text-align:center;">
          AURA Platform · Critical Alert · {(datetime.utcnow() + timedelta(hours=5, minutes=30)).strftime("%Y-%m-%d %H:%M IST")}
        </p>
      </div>
    </div>
    """
    return _send_email(to_email, f"🚨 CRITICAL: {cve_id} affects {affected_devices} devices — {org_name}", html)


def send_invite_email(to_email: str, org_name: str, temp_password: str = "ChangeMe123!") -> Dict[str, Any]:
    """Sends workspace invitation email. Called by user_routes.py"""
    html = (
        "<div style='font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;'>"
        "<div style='background:#4F46E5;color:#fff;padding:20px;border-radius:12px 12px 0 0;text-align:center;'>"
        "<h1 style='margin:0;font-size:20px;'>You have been invited to AURA</h1>"
        "</div>"
        "<div style='background:#fff;padding:24px;border-radius:0 0 12px 12px;'>"
        f"<p>You have been invited to join <strong>{org_name}</strong> on AURA Security Platform.</p>"
        f"<p><strong>Temporary Password:</strong> {temp_password}</p>"
        "<p>Please change your password after first login.</p>"
        "<div style='text-align:center;margin-top:20px;'>"
        "<a href='http://localhost:3000' style='background:#4F46E5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;'>"
        "Sign In to AURA</a>"
        "</div></div></div>"
    )
    return _send_email(to_email, f"You have been invited to {org_name} on AURA", html)
