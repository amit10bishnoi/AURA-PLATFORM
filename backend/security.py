"""
security.py — AURA Platform Security Hardening
Covers: Rate limiting, brute force protection, CORS lockdown,
        security headers, audit logging, field encryption, JWT refresh
"""
import os, time, hashlib, hmac, base64, json, logging
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Optional
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from cryptography.fernet import Fernet

logger = logging.getLogger("aura.security")

# ── Encryption ─────────────────────────────────────────────────────────────
_RAW_KEY = os.getenv("AURA_ENCRYPTION_KEY", "")
if _RAW_KEY:
    try:
        FERNET = Fernet(_RAW_KEY.encode())
    except Exception:
        _derived = base64.urlsafe_b64encode(hashlib.sha256(_RAW_KEY.encode()).digest())
        FERNET = Fernet(_derived)
else:
    _derived = base64.urlsafe_b64encode(hashlib.sha256(b"aura-dev-key-change-in-prod").digest())
    FERNET = Fernet(_derived)

def encrypt_field(value: str) -> str:
    """Encrypt a sensitive string field for DB storage."""
    if not value:
        return value
    return FERNET.encrypt(value.encode()).decode()

def decrypt_field(value: str) -> str:
    """Decrypt an encrypted DB field."""
    if not value:
        return value
    try:
        return FERNET.decrypt(value.encode()).decode()
    except Exception:
        return value  # Return as-is if not encrypted

# ── Rate limiting store ────────────────────────────────────────────────────
class RateLimitStore:
    def __init__(self):
        self.requests: dict = defaultdict(list)      # ip -> [timestamps]
        self.blocked: dict = {}                       # ip -> unblock_time
        self.failed_logins: dict = defaultdict(list) # ip -> [timestamps]
        self.lockouts: dict = {}                      # ip -> unblock_time

    def is_blocked(self, ip: str) -> bool:
        if ip in self.blocked:
            if time.time() < self.blocked[ip]:
                return True
            del self.blocked[ip]
        return False

    def is_locked_out(self, ip: str) -> bool:
        if ip in self.lockouts:
            if time.time() < self.lockouts[ip]:
                return True
            del self.lockouts[ip]
            self.failed_logins[ip] = []
        return False

    def record_request(self, ip: str, window: int = 60, limit: int = 100) -> bool:
        """Return True if request allowed, False if rate limited."""
        now = time.time()
        self.requests[ip] = [t for t in self.requests[ip] if now - t < window]
        if len(self.requests[ip]) >= limit:
            self.blocked[ip] = now + window
            return False
        self.requests[ip].append(now)
        return True

    def record_failed_login(self, ip: str, max_attempts: int = 5, lockout_mins: int = 15):
        """Track failed logins and lock out after max_attempts."""
        now = time.time()
        self.failed_logins[ip] = [t for t in self.failed_logins[ip] if now - t < 900]
        self.failed_logins[ip].append(now)
        if len(self.failed_logins[ip]) >= max_attempts:
            self.lockouts[ip] = now + lockout_mins * 60
            self.failed_logins[ip] = []
            logger.warning(f"🔒 IP {ip} locked out after {max_attempts} failed logins")

    def record_success_login(self, ip: str):
        """Clear failed login count on success."""
        self.failed_logins[ip] = []
        if ip in self.lockouts:
            del self.lockouts[ip]

    def get_remaining(self, ip: str, window: int = 60, limit: int = 100) -> int:
        now = time.time()
        recent = [t for t in self.requests[ip] if now - t < window]
        return max(0, limit - len(recent))

rate_store = RateLimitStore()

# ── Security Headers Middleware ────────────────────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' http://localhost:8000 https://api.anthropic.com;"
        )
        # Remove server info
        if "server" in response.headers:
            del response.headers["server"]
        if "x-powered-by" in response.headers:
            del response.headers["x-powered-by"]
        return response

# ── Rate Limit Middleware ──────────────────────────────────────────────────
class RateLimitMiddleware(BaseHTTPMiddleware):
    # Per-route limits: (window_seconds, max_requests)
    ROUTE_LIMITS = {
        "/login":          (300, 30),  # 30 login attempts per 5 min
        "/register":       (3600, 20), # 20 registrations per hour
        "/api/ai/chat":    (60, 60),   # 60 AI messages per minute
        "/api/reports":    (60, 40),   # 40 report requests per minute
        "default":         (60, 300),  # 300 requests per minute default
    }

    async def dispatch(self, request: Request, call_next):
        ip = request.client.host if request.client else "unknown"
        path = request.url.path

        # Whitelist localhost from rate limiting
        if ip in ("127.0.0.1", "::1", "localhost"):
            return await call_next(request)

        # Check if IP is blocked
        if rate_store.is_blocked(ip):
            return JSONResponse(
                status_code=429,
                content={"error": "Too many requests. Please wait before retrying."},
                headers={"Retry-After": "60"}
            )

        # Check login lockout
        if "/login" in path and rate_store.is_locked_out(ip):
            return JSONResponse(
                status_code=429,
                content={"error": "Account temporarily locked due to too many failed attempts. Try again in 15 minutes."},
                headers={"Retry-After": "900"}
            )

        # Get route-specific limit
        window, limit = self.ROUTE_LIMITS.get(path, self.ROUTE_LIMITS["default"])
        for route_prefix, limits in self.ROUTE_LIMITS.items():
            if route_prefix != "default" and path.startswith(route_prefix):
                window, limit = limits
                break

        if not rate_store.record_request(ip, window, limit):
            logger.warning(f"⚠️  Rate limit hit: {ip} on {path}")
            return JSONResponse(
                status_code=429,
                content={"error": f"Rate limit exceeded. Max {limit} requests per {window}s."},
                headers={"Retry-After": str(window), "X-RateLimit-Limit": str(limit), "X-RateLimit-Remaining": "0"}
            )

        response = await call_next(request)

        # Add rate limit headers
        remaining = rate_store.get_remaining(ip, window, limit)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Window"] = str(window)

        return response

# ── Audit Log Middleware ───────────────────────────────────────────────────
SKIP_AUDIT_PATHS = {"/docs", "/openapi.json", "/redoc", "/health", "/favicon.ico"}

class AuditLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip non-important routes
        if request.url.path in SKIP_AUDIT_PATHS:
            return await call_next(request)
        if request.url.path.startswith("/static"):
            return await call_next(request)

        start = time.time()
        ip = request.client.host if request.client else "unknown"

        # Extract user from JWT if present
        user_id = "anonymous"
        auth = request.headers.get("authorization", "")
        if auth.startswith("Bearer "):
            try:
                import jwt as pyjwt
                token = auth.split(" ")[1]
                payload = pyjwt.decode(token, options={"verify_signature": False})
                user_id = payload.get("sub", payload.get("email", "unknown"))
            except Exception:
                pass

        response = await call_next(request)
        duration_ms = round((time.time() - start) * 1000)

        # Log the audit entry
        entry = {
            "ts": datetime.utcnow().isoformat(),
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "ip": ip,
            "user": user_id,
            "duration_ms": duration_ms,
            "query": str(request.query_params) if request.query_params else None,
        }

        # Log failed logins for brute force tracking
        if "/login" in request.url.path:
            if response.status_code in (401, 403, 422):
                rate_store.record_failed_login(ip)
                logger.warning(f"🔑 Failed login from {ip} (status {response.status_code})")
            elif response.status_code == 200:
                rate_store.record_success_login(ip)

        # Write to audit log
        if response.status_code >= 400:
            logger.warning(f"AUDIT | {entry['method']} {entry['path']} → {entry['status']} | {ip} | {user_id} | {duration_ms}ms")
        else:
            logger.info(f"AUDIT | {entry['method']} {entry['path']} → {entry['status']} | {ip} | {user_id} | {duration_ms}ms")

        return response

# ── Input Sanitization ─────────────────────────────────────────────────────
import re

DANGEROUS_PATTERNS = [
    r"<script[^>]*>.*?</script>",
    r"javascript:",
    r"on\w+\s*=",
    r"data:text/html",
    r"vbscript:",
    r"expression\s*\(",
]

def sanitize_string(value: str) -> str:
    """Remove potentially dangerous content from string inputs."""
    if not isinstance(value, str):
        return value
    for pattern in DANGEROUS_PATTERNS:
        value = re.sub(pattern, "", value, flags=re.IGNORECASE | re.DOTALL)
    return value.strip()

def sanitize_dict(data: dict) -> dict:
    """Recursively sanitize all string values in a dict."""
    result = {}
    for k, v in data.items():
        if isinstance(v, str):
            result[k] = sanitize_string(v)
        elif isinstance(v, dict):
            result[k] = sanitize_dict(v)
        elif isinstance(v, list):
            result[k] = [sanitize_string(i) if isinstance(i, str) else i for i in v]
        else:
            result[k] = v
    return result

# ── JWT Refresh Token Support ──────────────────────────────────────────────
import secrets as _secrets

REFRESH_TOKEN_STORE: dict = {}  # token -> {user_id, tenant_id, expires}

def create_refresh_token(user_id: str, tenant_id: str) -> str:
    token = _secrets.token_urlsafe(48)
    REFRESH_TOKEN_STORE[token] = {
        "user_id": user_id,
        "tenant_id": tenant_id,
        "expires": time.time() + 7 * 86400,  # 7 days
        "created": datetime.utcnow().isoformat()
    }
    return token

def validate_refresh_token(token: str) -> Optional[dict]:
    data = REFRESH_TOKEN_STORE.get(token)
    if not data:
        return None
    if time.time() > data["expires"]:
        del REFRESH_TOKEN_STORE[token]
        return None
    return data

def revoke_refresh_token(token: str):
    REFRESH_TOKEN_STORE.pop(token, None)

def revoke_all_user_tokens(user_id: str):
    to_delete = [t for t, d in REFRESH_TOKEN_STORE.items() if d["user_id"] == user_id]
    for t in to_delete:
        del REFRESH_TOKEN_STORE[t]

# ── Security summary endpoint data ─────────────────────────────────────────
def get_security_status() -> dict:
    now = time.time()
    active_lockouts = sum(1 for t in rate_store.lockouts.values() if now < t)
    active_blocks = sum(1 for t in rate_store.blocked.values() if now < t)
    return {
        "rate_limiting": "active",
        "brute_force_protection": "active",
        "security_headers": "active",
        "audit_logging": "active",
        "field_encryption": "active",
        "jwt_refresh_tokens": "active",
        "active_ip_lockouts": active_lockouts,
        "active_ip_blocks": active_blocks,
        "encryption_mode": "Fernet AES-128-CBC",
    }
