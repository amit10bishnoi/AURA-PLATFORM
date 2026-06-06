"""
AURA Platform — MongoDB Database Layer
Replaces SQLAlchemy/SQLite with Motor (async MongoDB driver)
"""
import os
import uuid
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import IndexModel, ASCENDING, DESCENDING
import logging

log = logging.getLogger("aura.db")

IST = timezone(timedelta(hours=5, minutes=30))

def ist_now():
    return datetime.now(IST).replace(tzinfo=None)

def gen_uuid():
    return str(uuid.uuid4())

def gen_tenant_id():
    return f"tenant_{uuid.uuid4().hex[:12]}"

# ── Connection state ──────────────────────────────────────────────────────────

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGODB_DB", "aura")

_client: AsyncIOMotorClient = None
_db = None


def get_client() -> AsyncIOMotorClient:
    return _client


def get_db():
    """Return the Motor database handle."""
    return _db


# Shortcut collection accessors
def col(name: str):
    return _db[name]


def tenants():    return _db["tenants"]
def users():      return _db["users"]
def assessments():return _db["assessments"]
def tasks():      return _db["tasks"]
def controls():   return _db["controls"]
def compliance_results(): return _db["compliance_results"]
def vendors():    return _db["vendors"]
def policies():   return _db["policies"]
def evidence():   return _db["evidence"]
def audit_logs(): return _db["audit_logs"]
def risk_items(): return _db["risk_items"]
def incidents():  return _db["incidents"]
def notifications(): return _db["notifications"]
def integrations_col(): return _db["integrations"]
def automation_results(): return _db["automation_results"]


# ── Connect / Disconnect ──────────────────────────────────────────────────────

async def connect_db():
    global _client, _db
    log.info("[DB] Connecting to MongoDB...")
    _client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=10000)
    _db = _client[DB_NAME]
    # Ping to confirm connection
    await _client.admin.command("ping")
    log.info(f"[DB] Connected to MongoDB — database: '{DB_NAME}'")
    await create_indexes()
    await seed_demo_data()


async def disconnect_db():
    global _client
    if _client:
        _client.close()
        log.info("[DB] Disconnected from MongoDB")


# ── Indexes ───────────────────────────────────────────────────────────────────

async def create_indexes():
    db = _db

    # tenants
    await db.tenants.create_indexes([
        IndexModel([("name", ASCENDING)], unique=True),
        IndexModel([("slug", ASCENDING)], unique=True, sparse=True),
        IndexModel([("is_active", ASCENDING)]),
    ])

    # users
    await db.users.create_indexes([
        IndexModel([("tenant_id", ASCENDING), ("email", ASCENDING)], unique=True),
        IndexModel([("email", ASCENDING)]),
        IndexModel([("tenant_id", ASCENDING)]),
    ])

    # assessments
    await db.assessments.create_indexes([
        IndexModel([("tenant_id", ASCENDING), ("created_at", DESCENDING)]),
    ])

    # tasks
    await db.tasks.create_indexes([
        IndexModel([("tenant_id", ASCENDING), ("status", ASCENDING)]),
        IndexModel([("tenant_id", ASCENDING), ("created_at", DESCENDING)]),
    ])

    # controls
    await db.controls.create_indexes([
        IndexModel([("control_id", ASCENDING)], unique=True),
        IndexModel([("framework", ASCENDING)]),
    ])

    # compliance_results
    await db.compliance_results.create_indexes([
        IndexModel([("assessment_id", ASCENDING)]),
        IndexModel([("tenant_id", ASCENDING), ("framework", ASCENDING)]),
    ])

    # vendors
    await db.vendors.create_indexes([
        IndexModel([("tenant_id", ASCENDING)]),
    ])

    # policies
    await db.policies.create_indexes([
        IndexModel([("tenant_id", ASCENDING)]),
        IndexModel([("tenant_id", ASCENDING), ("type", ASCENDING)]),
    ])

    # evidence
    await db.evidence.create_indexes([
        IndexModel([("tenant_id", ASCENDING)]),
        IndexModel([("tenant_id", ASCENDING), ("control_id", ASCENDING)]),
    ])

    # audit_logs
    await db.audit_logs.create_indexes([
        IndexModel([("tenant_id", ASCENDING), ("created_at", DESCENDING)]),
    ])

    # risk_items
    await db.risk_items.create_indexes([
        IndexModel([("tenant_id", ASCENDING)]),
        IndexModel([("tenant_id", ASCENDING), ("severity", ASCENDING)]),
    ])

    # incidents
    await db.incidents.create_indexes([
        IndexModel([("tenant_id", ASCENDING)]),
        IndexModel([("tenant_id", ASCENDING), ("status", ASCENDING)]),
    ])

    # notifications
    await db.notifications.create_indexes([
        IndexModel([("tenant_id", ASCENDING), ("read", ASCENDING)]),
    ])

    # integrations
    await db.integrations.create_indexes([
        IndexModel([("tenant_id", ASCENDING), ("provider", ASCENDING)], unique=True),
    ])

    # automation_results
    await db.automation_results.create_indexes([
        IndexModel([("tenant_id", ASCENDING), ("scanned_at", DESCENDING)]),
    ])

    log.info("[DB] Indexes created / verified")


# ── Seed data ─────────────────────────────────────────────────────────────────

async def seed_demo_data():
    """Idempotent — only runs if collections are empty."""
    from passlib.context import CryptContext
    pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

    # ── Seed controls ─────────────────────────────────────────────────────────
    if await _db.controls.count_documents({}) == 0:
        control_data = [
            dict(framework="NIST", function="Identify", control_id="ID.AM-1",  name="Asset inventory management",           nist_ref="ID.AM-1", iso_ref="A.8.1.1",  risk_reduction=5),
            dict(framework="NIST", function="Identify", control_id="ID.BE-1",  name="Business environment & risk strategy", nist_ref="ID.BE-1", iso_ref="A.6.1.1",  risk_reduction=4),
            dict(framework="NIST", function="Identify", control_id="ID.RA-1",  name="Information security risk assessment", nist_ref="ID.RA-1", iso_ref="A.6.1.2",  risk_reduction=8),
            dict(framework="NIST", function="Protect",  control_id="PR.AC-1",  name="Access control & identity management", nist_ref="PR.AC-1", iso_ref="A.9.1.1",  risk_reduction=8),
            dict(framework="NIST", function="Protect",  control_id="PR.AC-2",  name="Physical & environmental security",    nist_ref="PR.AC-2", iso_ref="A.11.1.1", risk_reduction=5),
            dict(framework="NIST", function="Protect",  control_id="PR.DS-1",  name="Data security & encryption at rest",  nist_ref="PR.DS-1", iso_ref="A.10.1.1", risk_reduction=7),
            dict(framework="NIST", function="Protect",  control_id="PR.DS-2",  name="Cryptographic controls policy",       nist_ref="PR.DS-2", iso_ref="A.10.1.1", risk_reduction=7),
            dict(framework="NIST", function="Protect",  control_id="PR.AT-1",  name="Security awareness training",         nist_ref="PR.AT-1", iso_ref="A.7.2.2",  risk_reduction=6),
            dict(framework="NIST", function="Detect",   control_id="DE.AE-1",  name="Anomalous activity detection",        nist_ref="DE.AE-1", iso_ref="A.12.4.1", risk_reduction=7),
            dict(framework="NIST", function="Detect",   control_id="DE.CM-1",  name="Monitoring & event logging",          nist_ref="DE.CM-1", iso_ref="A.12.4.1", risk_reduction=6),
            dict(framework="NIST", function="Respond",  control_id="RS.RP-1",  name="Incident response plan",              nist_ref="RS.RP-1", iso_ref="A.16.1.1", risk_reduction=9),
            dict(framework="NIST", function="Recover",  control_id="RC.RP-1",  name="Recovery planning & improvements",    nist_ref="RC.RP-1", iso_ref="A.17.1.1", risk_reduction=6),
            dict(framework="ISO",  function="Protect",  control_id="ISO.10.1", name="ISO cryptographic policy",            nist_ref="PR.DS-2", iso_ref="A.10.1",   risk_reduction=7),
            dict(framework="ISO",  function="Identify", control_id="ISO.6.1",  name="ISO risk assessment",                 nist_ref="ID.RA-1", iso_ref="A.6.1.2",  risk_reduction=8),
            dict(framework="ISO",  function="Protect",  control_id="ISO.11.1", name="ISO physical security",               nist_ref="PR.AC-2", iso_ref="A.11.1.1", risk_reduction=5),
            dict(framework="ISO",  function="Detect",   control_id="ISO.12.4", name="ISO monitoring & logging",            nist_ref="DE.CM-1", iso_ref="A.12.4.1", risk_reduction=6),
            # RBI Controls
            dict(framework="RBI",  function="Govern",   control_id="RBI.GV-1", name="IT governance & board oversight",     nist_ref="ID.GV-1", iso_ref="A.5.1.1",  risk_reduction=8),
            dict(framework="RBI",  function="Protect",  control_id="RBI.PR-1", name="Network security & perimeter control",nist_ref="PR.AC-5", iso_ref="A.13.1.1", risk_reduction=7),
            dict(framework="RBI",  function="Protect",  control_id="RBI.PR-2", name="Customer data protection",            nist_ref="PR.DS-5", iso_ref="A.8.2.3",  risk_reduction=9),
            dict(framework="RBI",  function="Respond",  control_id="RBI.RS-1", name="CERT-In 6-hour breach reporting",     nist_ref="RS.CO-2", iso_ref="A.16.1.2", risk_reduction=9),
            dict(framework="RBI",  function="Detect",   control_id="RBI.DE-1", name="Real-time fraud detection",           nist_ref="DE.CM-7", iso_ref="A.12.4.1", risk_reduction=8),
            # DPDP Controls
            dict(framework="DPDP", function="Protect",  control_id="DPDP.P-1", name="Data principal consent management",  nist_ref="PR.AC-1", iso_ref="A.18.1.4", risk_reduction=9),
            dict(framework="DPDP", function="Protect",  control_id="DPDP.P-2", name="Data minimisation & purpose limitation",nist_ref="PR.DS-5",iso_ref="A.8.2.1",risk_reduction=8),
            dict(framework="DPDP", function="Respond",  control_id="DPDP.R-1", name="Data principal rights fulfilment",    nist_ref="RS.CO-3", iso_ref="A.18.1.4", risk_reduction=7),
            dict(framework="DPDP", function="Protect",  control_id="DPDP.P-3", name="Aadhaar/PAN data protection",        nist_ref="PR.DS-1", iso_ref="A.10.1.1", risk_reduction=9),
        ]
        for c in control_data:
            c["_id"] = c["control_id"]
            c["created_at"] = ist_now()
        await _db.controls.insert_many(control_data)
        log.info(f"[DB] Seeded {len(control_data)} security controls")

    # ── Seed demo tenant ──────────────────────────────────────────────────────
    existing_tenant = await _db.tenants.find_one({"slug": "democorp"})
    if not existing_tenant:
        tenant_id = "tenant_democorp001"
        tenant = {
            "_id": tenant_id,
            "id": tenant_id,
            "name": "Demo Corporation",
            "slug": "democorp",
            "industry": "Financial Services",
            "plan": "enterprise",
            "max_users": 50,
            "is_active": True,
            "is_msp": False,
            "brand_primary": "#7c3aed",
            "brand_secondary": "#db2777",
            "msp_plan": "enterprise",
            "max_sub_tenants": 10,
            "revenue_share": 0.20,
            "created_at": ist_now(),
        }
        await _db.tenants.insert_one(tenant)
        log.info("[DB] Seeded demo tenant: democorp")

        # ── Seed demo users ───────────────────────────────────────────────────
        hashed_pw = pwd_ctx.hash("Demo123!")
        demo_users = [
            {
                "_id": gen_uuid(),
                "tenant_id": tenant_id,
                "email": "ciso@democorp.com",
                "name": "Demo CISO",
                "hashed_password": hashed_pw,
                "role": "ciso",
                "is_active": True,
                "created_at": ist_now(),
            },
            {
                "_id": gen_uuid(),
                "tenant_id": tenant_id,
                "email": "developer@democorp.com",
                "name": "Demo Developer",
                "hashed_password": hashed_pw,
                "role": "developer",
                "is_active": True,
                "created_at": ist_now(),
            },
            {
                "_id": gen_uuid(),
                "tenant_id": tenant_id,
                "email": "auditor@democorp.com",
                "name": "Demo Auditor",
                "hashed_password": hashed_pw,
                "role": "auditor",
                "is_active": True,
                "created_at": ist_now(),
            },
        ]
        for u in demo_users:
            u["id"] = u["_id"]
        await _db.users.insert_many(demo_users)
        log.info("[DB] Seeded demo users: ciso@democorp.com / developer@democorp.com / auditor@democorp.com")

        # ── Seed demo risk items ──────────────────────────────────────────────
        risk_data = [
            {"title": "Unpatched critical CVEs in production", "severity": "CRITICAL", "status": "open",
             "framework": "NIST", "control_id": "DE.CM-1", "financial_impact_inr": 5000000,
             "reported_to_rbi": False, "owner": "security-team@democorp.com"},
            {"title": "MFA not enforced for privileged accounts", "severity": "HIGH", "status": "in_progress",
             "framework": "ISO", "control_id": "PR.AC-1", "financial_impact_inr": 2000000,
             "reported_to_rbi": False, "owner": "it-admin@democorp.com"},
            {"title": "Customer PII stored without encryption", "severity": "CRITICAL", "status": "open",
             "framework": "DPDP", "control_id": "DPDP.P-3", "financial_impact_inr": 10000000,
             "reported_to_rbi": True, "owner": "dpo@democorp.com"},
            {"title": "Vendor access review overdue (90 days)", "severity": "MEDIUM", "status": "open",
             "framework": "RBI", "control_id": "RBI.PR-1", "financial_impact_inr": 500000,
             "reported_to_rbi": False, "owner": "compliance@democorp.com"},
            {"title": "Incident response plan not tested in 12 months", "severity": "HIGH", "status": "open",
             "framework": "NIST", "control_id": "RS.RP-1", "financial_impact_inr": 1500000,
             "reported_to_rbi": False, "owner": "ciso@democorp.com"},
        ]
        for r in risk_data:
            r["_id"] = gen_uuid()
            r["id"] = r["_id"]
            r["tenant_id"] = tenant_id
            r["created_at"] = ist_now()
            r["updated_at"] = ist_now()
        await _db.risk_items.insert_many(risk_data)
        log.info(f"[DB] Seeded {len(risk_data)} demo risk items")

        # ── Seed demo tasks ───────────────────────────────────────────────────
        task_data = [
            {"title": "Enable MFA for all IAM users", "status": "open", "priority": "HIGH",
             "source": "automation", "assignee_email": "it-admin@democorp.com"},
            {"title": "Update incident response plan", "status": "in_progress", "priority": "HIGH",
             "source": "manual", "assignee_email": "ciso@democorp.com"},
            {"title": "Complete vendor risk assessments", "status": "open", "priority": "MEDIUM",
             "source": "manual", "assignee_email": "compliance@democorp.com"},
            {"title": "Encrypt customer PII database columns", "status": "open", "priority": "CRITICAL",
             "source": "automation", "assignee_email": "developer@democorp.com"},
            {"title": "Conduct security awareness training", "status": "done", "priority": "MEDIUM",
             "source": "manual", "assignee_email": "hr@democorp.com"},
        ]
        for t in task_data:
            t["_id"] = gen_uuid()
            t["id"] = t["_id"]
            t["tenant_id"] = tenant_id
            t["created_at"] = ist_now()
            t["updated_at"] = ist_now()
        await _db.tasks.insert_many(task_data)
        log.info(f"[DB] Seeded {len(task_data)} demo tasks")

        # ── Seed compliance scores ────────────────────────────────────────────
        assessment_id = gen_uuid()
        assessment = {
            "_id": assessment_id,
            "id": assessment_id,
            "tenant_id": tenant_id,
            "org_name": "Demo Corporation",
            "industry": "Financial Services",
            "employees": 250,
            "has_mfa": False,
            "mfa_coverage": 45,
            "patch_days": 14,
            "training_percent": 60,
            "has_irp": True,
            "vulnerabilities": 23,
            "vuln_critical": 3,
            "vuln_high": 8,
            "vuln_medium": 12,
            "vuln_low": 0,
            "risk_score": 62.5,
            "risk_level": "MEDIUM",
            "financial_exposure": 8500000.0,
            "created_at": ist_now(),
        }
        await _db.assessments.insert_one(assessment)

        compliance_scores = [
            {"framework": "SOC2",     "score": 74.0, "controls_detail": []},
            {"framework": "ISO27001", "score": 68.0, "controls_detail": []},
            {"framework": "RBI",      "score": 61.0, "controls_detail": []},
            {"framework": "DPDP",     "score": 22.0, "controls_detail": []},
        ]
        for cr in compliance_scores:
            cr["_id"] = gen_uuid()
            cr["id"] = cr["_id"]
            cr["assessment_id"] = assessment_id
            cr["tenant_id"] = tenant_id
            cr["created_at"] = ist_now()
            cr["updated_at"] = ist_now()
        await _db.compliance_results.insert_many(compliance_scores)
        log.info("[DB] Seeded demo compliance scores: SOC2=74, ISO=68, RBI=61, DPDP=22")

    log.info("[DB] Seed complete ✅")


# ── Compatibility shim — keeps old SQLAlchemy-style get_db working ────────────
# Some routers still call `db = next(get_db())` synchronously.
# This shim lets them import without crashing; they'll need updating to async.

class _SyncDBShim:
    """Temporary shim — routes using this should be migrated to async Motor calls."""
    def __getattr__(self, name):
        raise RuntimeError(
            f"Attempted synchronous DB access via shim (attr: {name}). "
            "Migrate this route to async Motor: from database import users, tasks, etc."
        )

def get_db_sync():
    """Deprecated sync shim — use async collection accessors instead."""
    return _SyncDBShim()


# ── Keep 'Base' importable so old imports don't crash immediately ─────────────
class Base:
    """Stub — SQLAlchemy Base replaced by MongoDB. Remove once all routers migrated."""
    metadata = type("_Meta", (), {"create_all": staticmethod(lambda *a, **kw: None)})()


# ── SessionLocal stub ─────────────────────────────────────────────────────────
class SessionLocal:
    """Stub — kept for import compatibility during migration."""
    def __init__(self): pass
    def query(self, *a): raise RuntimeError("SQLAlchemy removed. Use Motor async accessors.")
    def close(self): pass
    def __enter__(self): return self
    def __exit__(self, *a): pass


def init_db():
    """Stub — kept for import compatibility. Real init is connect_db() in lifespan."""
    log.info("[DB] init_db() called (no-op — using connect_db() in lifespan)")