import os
from typing import Optional


class Settings:
    APP_NAME: str = "AURA Platform"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    # ── Database — MongoDB replaces SQLite ────────────────────────────────────
    MONGODB_URI: str = os.getenv(
        "MONGODB_URI",
        "mongodb://localhost:27017"
    )
    MONGODB_DB: str = os.getenv("MONGODB_DB", "aura")

    # Keep DATABASE_URL for any legacy references (unused now)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # ── Auth ──────────────────────────────────────────────────────────────────
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "aura-super-secret-key-change-in-production-2024"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "https://aura-platform-swart.vercel.app",
        "https://auragrc.in",
        "https://www.auragrc.in",
    ]

    # ── API Keys ──────────────────────────────────────────────────────────────
    PROXY_API_KEY: str = os.getenv("PROXY_API_KEY", "aura-dev-key-change-in-production")
    NVD_API_KEY: Optional[str] = os.getenv("NVD_API_KEY", None)
    VULNERS_API_KEY: Optional[str] = os.getenv("VULNERS_API_KEY", None)
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY", None)

    # ── Email (Gmail SMTP) ────────────────────────────────────────────────────
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "your.gmail@gmail.com")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "your-16-char-app-password")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "your.gmail@gmail.com")
    MAIL_FROM_NAME: str = os.getenv("MAIL_FROM_NAME", "AURA Platform")
    MAIL_SERVER: str = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", "587"))
    MAIL_TLS: bool = True
    MAIL_SSL: bool = False
    MAIL_ENABLED: bool = (
        os.getenv("MAIL_USERNAME", "your.gmail@gmail.com") != "your.gmail@gmail.com"
    )


settings = Settings()