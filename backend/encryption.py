"""
encryption.py — HIPAA-Grade Field-Level Encryption
AES-256-GCM encryption for all PHI/PII fields stored in MongoDB.
"""
import os
import base64
import logging
import secrets
import hmac
import hashlib
from typing import Any
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

log = logging.getLogger("aura.encryption")

_ENCRYPTION_KEY_RAW = os.getenv("ENCRYPTION_KEY", "")
_SALT = b"aura-hipaa-v1-salt-2025"

def _derive_key(raw_key: str) -> bytes:
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=_SALT, iterations=100_000)
    return kdf.derive(raw_key.encode())

ENCRYPTION_ENABLED = bool(_ENCRYPTION_KEY_RAW)
_AES_KEY = _derive_key(_ENCRYPTION_KEY_RAW) if ENCRYPTION_ENABLED else None

if ENCRYPTION_ENABLED:
    log.info("[Encryption] HIPAA field-level encryption ENABLED (AES-256-GCM)")
else:
    log.warning("[Encryption] ENCRYPTION_KEY not set — PHI stored in plaintext.")

PHI_FIELDS = {
    "users":         {"email", "name", "hashed_password"},
    "tenants":       {"name", "contact_email", "custom_domain"},
    "vendors":       {"name", "contact_email", "website", "notes"},
    "risk_items":    {"title", "owner"},
    "audit_logs":    {"user_email", "user_name", "resource"},
    "assessments":   {"org_name"},
    "policies":      {"title", "owner", "description"},
    "evidence":      {"name", "uploaded_by", "description"},
    "tasks":         {"title", "description", "assignee_email"},
    "notifications": {"title", "message"},
}

_ENC_PREFIX = "aura_enc_v1:"

def encrypt_field(value: Any) -> str:
    if not ENCRYPTION_ENABLED or value is None:
        return value
    if not isinstance(value, str):
        value = str(value)
    if value.startswith(_ENC_PREFIX):
        return value
    try:
        aesgcm = AESGCM(_AES_KEY)
        nonce = secrets.token_bytes(12)
        ct = aesgcm.encrypt(nonce, value.encode("utf-8"), None)
        encoded = base64.b64encode(nonce + ct).decode("utf-8")
        return f"{_ENC_PREFIX}{encoded}"
    except Exception as e:
        log.error(f"[Encryption] Encrypt failed: {e}")
        return value

def decrypt_field(value: Any) -> Any:
    if not ENCRYPTION_ENABLED or value is None:
        return value
    if not isinstance(value, str) or not value.startswith(_ENC_PREFIX):
        return value
    try:
        encoded = value[len(_ENC_PREFIX):]
        raw = base64.b64decode(encoded)
        nonce, ct = raw[:12], raw[12:]
        aesgcm = AESGCM(_AES_KEY)
        return aesgcm.decrypt(nonce, ct, None).decode("utf-8")
    except Exception as e:
        log.error(f"[Encryption] Decrypt failed: {e}")
        return value

def encrypt_doc(doc: dict, collection: str) -> dict:
    if not ENCRYPTION_ENABLED or not doc:
        return doc
    fields = PHI_FIELDS.get(collection, set())
    result = dict(doc)
    for field in fields:
        if field in result and result[field] is not None:
            result[field] = encrypt_field(result[field])
    return result

def decrypt_doc(doc: dict, collection: str) -> dict:
    if not ENCRYPTION_ENABLED or not doc:
        return doc
    fields = PHI_FIELDS.get(collection, set())
    result = dict(doc)
    for field in fields:
        if field in result and result[field] is not None:
            result[field] = decrypt_field(result[field])
    return result

def decrypt_docs(docs: list, collection: str) -> list:
    return [decrypt_doc(doc, collection) for doc in docs]

def make_search_index(value: str) -> str:
    if not ENCRYPTION_ENABLED or not value:
        return value.lower() if value else ""
    key_bytes = _AES_KEY if _AES_KEY else b"fallback"
    return hmac.new(key_bytes, str(value).lower().encode(), hashlib.sha256).hexdigest()

def get_encryption_status() -> dict:
    return {
        "enabled": ENCRYPTION_ENABLED,
        "algorithm": "AES-256-GCM",
        "key_derivation": "PBKDF2-SHA256 (100,000 iterations)",
        "phi_collections": list(PHI_FIELDS.keys()),
        "compliance": ["HIPAA", "DPDP", "SOC2 CC6.7", "ISO 27001 A.8.24"],
    }
