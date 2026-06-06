"""
production_auth.py — MongoDB edition
Password reset / email verify flows.
Uses Motor for user lookups; reset tokens stay in-memory (fine for single-instance).
"""
from fastapi import APIRouter, BackgroundTasks, HTTPException
from datetime import datetime, timedelta
import secrets, os, smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

try:
    import jwt, bcrypt
    JWT_AVAILABLE = True
except ImportError:
    JWT_AVAILABLE = False

from database import users, ist_now

router = APIRouter(prefix="/api/auth/v2", tags=["auth-v2"])

SECRET_KEY   = os.getenv("SECRET_KEY", "aura-dev-secret-change-in-production-64chars")
ALGORITHM    = "HS256"
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
SMTP_HOST    = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT    = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER    = os.getenv("SMTP_USER", "")
SMTP_PASS    = os.getenv("SMTP_PASS", "")
FROM_EMAIL   = os.getenv("FROM_EMAIL", "noreply@auragrc.in")

# In-memory token stores (resets on restart — acceptable for demo/early prod)
RESET_TOKENS  = {}
VERIFY_TOKENS = {}


def send_email(to: str, subject: str, html: str):
    if not SMTP_USER:
        print(f"[EMAIL] {subject} -> {to}")
        return
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = FROM_EMAIL
        msg["To"]      = to
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
            s.starttls()
            s.login(SMTP_USER, SMTP_PASS)
            s.sendmail(FROM_EMAIL, to, msg.as_string())
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")


@router.post("/forgot-password")
async def forgot_password(body: dict, background_tasks: BackgroundTasks):
    email = body.get("email", "").lower().strip()
    token = secrets.token_urlsafe(32)
    RESET_TOKENS[token] = {
        "email":   email,
        "expires": datetime.utcnow() + timedelta(hours=1),
    }
    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
    html = f"""
    <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px">
      <div style="background:linear-gradient(135deg,#7c3aed,#db2777);border-radius:12px;
                  padding:24px;text-align:center;margin-bottom:24px">
        <h1 style="color:#fff;margin:0">AURA</h1>
      </div>
      <h2 style="color:#1a0a3a">Reset your password</h2>
      <p style="color:#6b5b9e">You requested a password reset for your AURA account.</p>
      <a href="{reset_url}"
         style="display:inline-block;margin:20px 0;padding:12px 28px;
                background:linear-gradient(135deg,#7c3aed,#db2777);
                color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
        Reset Password
      </a>
      <p style="color:#a89dc8;font-size:12px">
        Expires in 1 hour. If you didn't request this, ignore this email.
      </p>
    </div>"""
    background_tasks.add_task(send_email, email, "Reset your AURA password", html)
    return {"message": "If that email exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(body: dict):
    token        = body.get("token", "")
    new_password = body.get("password", "")

    if len(new_password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")

    data = RESET_TOKENS.get(token)
    if not data or datetime.utcnow() > data["expires"]:
        raise HTTPException(400, "Invalid or expired reset token")

    del RESET_TOKENS[token]

    if JWT_AVAILABLE:
        hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
        await users().update_one(
            {"email": data["email"]},
            {"$set": {"hashed_password": hashed, "updated_at": ist_now()}},
        )

    return {"message": "Password reset successfully. Please log in."}


@router.get("/health")
def auth_health():
    return {
        "status":           "ok",
        "jwt_available":    JWT_AVAILABLE,
        "smtp_configured":  bool(SMTP_USER),
    }
