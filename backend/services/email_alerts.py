"""
email_alerts.py — Real email notifications via SMTP
Sends alerts for: failed checks, expiring evidence, overdue questionnaires, audit requests
Configure in .env:
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your@gmail.com
  SMTP_PASS=your_app_password
  ALERT_EMAIL=ciso@yourcompany.com
"""
import os, smtplib, logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

logger = logging.getLogger("aura.alerts")

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
ALERT_EMAIL = os.getenv("ALERT_EMAIL", SMTP_USER)
EMAIL_ENABLED = bool(SMTP_HOST and SMTP_USER and SMTP_PASS)

def send_email(to: str, subject: str, html: str) -> bool:
    """Send an email. Returns True if sent, False if failed/disabled."""
    if not EMAIL_ENABLED:
        logger.info(f"📧 [DEMO] Email to {to}: {subject}")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"AURA GRC Platform <{SMTP_USER}>"
        msg["To"] = to
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, to, msg.as_string())
        logger.info(f"✅ Email sent to {to}: {subject}")
        return True
    except Exception as e:
        logger.error(f"❌ Email failed: {e}")
        return False

def _base_template(title: str, body: str, cta_text: str = None, cta_url: str = None) -> str:
    cta = f'<div style="text-align:center;margin:24px 0"><a href="{cta_url}" style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">{cta_text}</a></div>' if cta_text else ""
    return f"""
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#07050F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:580px;margin:40px auto;background:#111827;border-radius:16px;overflow:hidden;border:1px solid rgba(139,92,246,0.2)">
  <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:28px 32px">
    <div style="font-size:22px;font-weight:800;color:#fff">🛡️ AURA GRC Platform</div>
    <div style="font-size:14px;color:rgba(255,255,255,0.7);margin-top:4px">{title}</div>
  </div>
  <div style="padding:28px 32px;color:#e2e8f0">{body}</div>
  {cta}
  <div style="padding:16px 32px;border-top:1px solid rgba(139,92,246,0.1);font-size:11px;color:#475569;text-align:center">
    AURA GRC Platform · AI-Native Compliance for Indian Enterprises · <a href="https://app.aura.io" style="color:#8b5cf6">app.aura.io</a>
  </div>
</div>
</body></html>"""

def alert_check_failed(to: str, check_name: str, framework: str, severity: str, remediation: str):
    body = f"""
<div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:10px;padding:16px;margin-bottom:20px">
  <div style="font-size:13px;font-weight:700;color:#ef4444">⚠️ {severity} — Automated Check Failed</div>
  <div style="font-size:20px;font-weight:800;color:#e2e8f0;margin-top:8px">{check_name}</div>
  <div style="font-size:13px;color:#94a3b8;margin-top:4px">{framework} Framework</div>
</div>
<p style="color:#94a3b8;font-size:14px;line-height:1.7">An automated compliance check has failed and requires your attention.</p>
<div style="background:#1a2235;border-radius:10px;padding:16px;margin-top:16px">
  <div style="font-size:11px;font-weight:700;color:#a78bfa;margin-bottom:8px;text-transform:uppercase">Recommended Action</div>
  <div style="font-size:13px;color:#e2e8f0;line-height:1.6">{remediation}</div>
</div>"""
    return send_email(to, f"🔴 {severity} Alert: {check_name} Failed — AURA GRC",
        _base_template(f"{framework} Compliance Alert", body, "View in AURA", "http://localhost:3000"))

def alert_evidence_expiring(to: str, evidence_name: str, days_left: int, control_id: str):
    color = "#ef4444" if days_left < 7 else "#f59e0b"
    body = f"""
<div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:10px;padding:16px;margin-bottom:20px">
  <div style="font-size:13px;font-weight:700;color:{color}">⏰ Evidence Expiring in {days_left} Days</div>
  <div style="font-size:20px;font-weight:800;color:#e2e8f0;margin-top:8px">{evidence_name}</div>
  <div style="font-size:13px;color:#94a3b8;margin-top:4px">Control: {control_id}</div>
</div>
<p style="color:#94a3b8;font-size:14px;line-height:1.7">
  This compliance evidence will expire in <strong style="color:{color}">{days_left} days</strong>. 
  Please upload an updated version to maintain your compliance score.
</p>"""
    return send_email(to, f"⏰ Evidence Expiring: {evidence_name} — {days_left} days left",
        _base_template("Evidence Renewal Required", body, "Upload Evidence", "http://localhost:3000"))

def alert_weekly_digest(to: str, org_name: str, scores: dict, failed_checks: int, pending_evidence: int):
    fw_rows = "".join([
        f'<tr><td style="padding:10px 14px;color:#e2e8f0;font-size:13px">{fw}</td>'
        f'<td style="padding:10px 14px"><div style="background:rgba(255,255,255,0.06);border-radius:4px;height:8px;overflow:hidden"><div style="width:{score}%;height:100%;background:{"#10b981" if score>=80 else "#f59e0b" if score>=60 else "#ef4444"};border-radius:4px"></div></div></td>'
        f'<td style="padding:10px 14px;font-weight:700;color:{"#10b981" if score>=80 else "#f59e0b" if score>=60 else "#ef4444"};font-size:14px">{score}%</td></tr>'
        for fw, score in scores.items()
    ])
    body = f"""
<p style="color:#94a3b8;font-size:14px;line-height:1.7">Good morning! Here's your weekly compliance summary for <strong style="color:#e2e8f0">{org_name}</strong>.</p>
<div style="background:#1a2235;border-radius:12px;overflow:hidden;margin:20px 0">
  <table style="width:100%;border-collapse:collapse">
    <thead><tr style="background:rgba(139,92,246,0.1)"><th style="padding:10px 14px;text-align:left;font-size:11px;color:#a78bfa;text-transform:uppercase;letter-spacing:.5px">Framework</th><th style="padding:10px 14px;text-align:left;font-size:11px;color:#a78bfa;text-transform:uppercase">Progress</th><th style="padding:10px 14px;text-align:left;font-size:11px;color:#a78bfa;text-transform:uppercase">Score</th></tr></thead>
    <tbody>{fw_rows}</tbody>
  </table>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px">
  <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:10px;padding:14px;text-align:center">
    <div style="font-size:28px;font-weight:800;color:#ef4444">{failed_checks}</div>
    <div style="font-size:11px;color:#94a3b8;margin-top:4px">Failed Checks</div>
  </div>
  <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:14px;text-align:center">
    <div style="font-size:28px;font-weight:800;color:#f59e0b">{pending_evidence}</div>
    <div style="font-size:11px;color:#94a3b8;margin-top:4px">Pending Evidence</div>
  </div>
</div>"""
    return send_email(to, f"📊 Weekly Compliance Digest — {org_name} — {datetime.utcnow().strftime('%d %b %Y')}",
        _base_template("Weekly Compliance Summary", body, "View Full Dashboard", "http://localhost:3000"))

def send_auditor_invite(to: str, org_name: str, audit_name: str, portal_link: str):
    body = f"""
<p style="color:#94a3b8;font-size:14px;line-height:1.7">
  You have been invited to access the audit portal for <strong style="color:#e2e8f0">{org_name}</strong>.
</p>
<div style="background:#1a2235;border-radius:12px;padding:20px;margin:20px 0">
  <div style="font-size:13px;font-weight:700;color:#a78bfa;margin-bottom:4px">Audit Engagement</div>
  <div style="font-size:18px;font-weight:800;color:#e2e8f0">{audit_name}</div>
</div>
<p style="color:#94a3b8;font-size:13px;line-height:1.7">
  Through this secure portal you can: view evidence, request additional documentation, 
  approve controls, and communicate directly with the compliance team.
</p>"""
    return send_email(to, f"🔐 Audit Portal Access: {audit_name} — {org_name}",
        _base_template("Auditor Portal Invitation", body, "Access Audit Portal", portal_link))
