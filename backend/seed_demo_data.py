"""
seed_demo_data.py — Populate demo data for guide review
Run: python3 seed_demo_data.py
"""
import sys, os, json, random
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, init_db
from models import User, Assessment, Task, ComplianceResult
from auth import get_password_hash
from datetime import datetime, timedelta

IST = timedelta(hours=5, minutes=30)
def ist_now(days_ago=0): return datetime.now() + IST - timedelta(days=days_ago)

init_db()
db = SessionLocal()

TENANT_ID = "tenant_533ed68d0977"

# ── Users ─────────────────────────────────────────────────────────────────────
users_data = [
    {"email": "ciso@democorp.com",  "name": "Priya Sharma",    "role": "ciso",      "password": "Demo123!"},
    {"email": "dev@democorp.com",   "name": "Arjun Mehta",     "role": "developer", "password": "Demo123!"},
    {"email": "audit@democorp.com", "name": "Neha Patel",      "role": "auditor",   "password": "Demo123!"},
]
for u in users_data:
    if not db.query(User).filter(User.email == u["email"]).first():
        db.add(User(email=u["email"], name=u["name"], role=u["role"],
                    hashed_password=get_password_hash(u["password"]),
                    tenant_id=TENANT_ID))

# ── Assessments (last 6 months) ───────────────────────────────────────────────
assessment_history = [
    {"org": "Demo Corp Ltd", "industry": "Technology", "score": 88, "level": "CRITICAL", "vuln": 12, "days": 180},
    {"org": "Demo Corp Ltd", "industry": "Technology", "score": 82, "level": "CRITICAL", "vuln": 10, "days": 150},
    {"org": "Demo Corp Ltd", "industry": "Technology", "score": 79, "level": "HIGH",     "vuln": 8,  "days": 120},
    {"org": "Demo Corp Ltd", "industry": "Technology", "score": 74, "level": "HIGH",     "vuln": 7,  "days": 90},
    {"org": "Demo Corp Ltd", "industry": "Technology", "score": 68, "level": "HIGH",     "vuln": 6,  "days": 60},
    {"org": "Demo Corp Ltd", "industry": "Technology", "score": 61, "level": "HIGH",     "vuln": 5,  "days": 30},
    {"org": "Demo Corp Ltd", "industry": "Technology", "score": 55, "level": "MEDIUM",   "vuln": 4,  "days": 7},
    {"org": "Demo Corp Ltd", "industry": "Technology", "score": 48, "level": "MEDIUM",   "vuln": 3,  "days": 0},
]

existing = db.query(Assessment).filter(Assessment.tenant_id == TENANT_ID).count()
if existing < 4:
    admin = db.query(User).filter(User.tenant_id == TENANT_ID).first()
    user_id = admin.id if admin else "demo-user"
    
    for a in assessment_history:
        assess = Assessment(
            tenant_id=TENANT_ID,
            created_by=user_id,
            org_name=a["org"],
            industry=a["industry"],
            employees=150,
            has_mfa=True,
            mfa_coverage=72 + random.randint(-10, 15),
            patch_days=18 + random.randint(-5, 15),
            training_percent=68 + random.randint(-10, 15),
            has_irp=True,
            vulnerabilities=a["vuln"],
            vuln_critical=random.randint(0, 2),
            vuln_high=random.randint(1, 4),
            vuln_medium=random.randint(1, 4),
            vuln_low=random.randint(0, 3),
            vuln_source="Intune+NVD (Auto)",
            risk_score=float(a["score"]),
            risk_level=a["level"],
            financial_exposure=float(a["score"] * 15000),
            recommendations=json.dumps([
                "Enable MFA enforcement via Conditional Access for all users",
                "Deploy critical patches — target 72hr window for CRITICAL severity",
                "Conduct phishing simulation for all 150 employees",
                "Review and update Incident Response Plan quarterly",
            ]),
            model_version="auto-v2",
            created_at=ist_now(a["days"]),
        )
        db.add(assess)

# ── Remediation Tasks ─────────────────────────────────────────────────────────
tasks_data = [
    {"title": "[CRITICAL] Block legacy authentication protocols (SMTP/IMAP/POP3)", "priority": "CRITICAL", "status": "open",        "assignee": "dev@democorp.com"},
    {"title": "[CRITICAL] Rotate 4 AWS access keys older than 90 days",            "priority": "CRITICAL", "status": "in-progress",  "assignee": "dev@democorp.com"},
    {"title": "[HIGH] Enable BitLocker on 12 unencrypted Windows devices",          "priority": "HIGH",     "status": "open",        "assignee": "dev@democorp.com"},
    {"title": "[HIGH] Close RDP port 3389 — move to Azure Bastion",                "priority": "HIGH",     "status": "in-progress",  "assignee": "dev@democorp.com"},
    {"title": "[HIGH] Update 3 critical Dependabot alerts (log4j, lodash, axios)",  "priority": "HIGH",     "status": "open",        "assignee": "dev@democorp.com"},
    {"title": "[HIGH] Enable AWS GuardDuty in all regions",                         "priority": "HIGH",     "status": "open",        "assignee": "dev@democorp.com"},
    {"title": "[HIGH] Restrict 8 overprivileged IAM roles to least privilege",      "priority": "HIGH",     "status": "open",        "assignee": "dev@democorp.com"},
    {"title": "[MEDIUM] Configure 5 DLP rules in Google Workspace",                 "priority": "MEDIUM",   "status": "open",        "assignee": "audit@democorp.com"},
    {"title": "[MEDIUM] Enable S3 default encryption on 3 unencrypted buckets",     "priority": "MEDIUM",   "status": "done",        "assignee": "dev@democorp.com"},
    {"title": "[MEDIUM] Implement security awareness training — Q2 2026 cohort",    "priority": "MEDIUM",   "status": "done",        "assignee": "ciso@democorp.com"},
    {"title": "[LOW] Clock synchronisation — configure NTP on 5 servers",           "priority": "LOW",      "status": "done",        "assignee": "dev@democorp.com"},
    {"title": "[LOW] Document acceptable use policy for remote workers",            "priority": "LOW",      "status": "done",        "assignee": "ciso@democorp.com"},
]

existing_tasks = db.query(Task).filter(Task.tenant_id == TENANT_ID).count()
if existing_tasks < 5:
    admin = db.query(User).filter(User.tenant_id == TENANT_ID).first()
    user_id = admin.id if admin else "demo-user"
    for t in tasks_data:
        db.add(Task(
            tenant_id=TENANT_ID,
            created_by=user_id,
            title=t["title"],
            priority=t["priority"],
            status=t["status"],
            assignee_email=t["assignee"],
            source="auto_assessment", description=t["title"],
        ))

db.commit()
db.close()
print("Demo data seeded successfully!")
print("Login with: ciso@democorp.com / Demo123!")
print("           dev@democorp.com  / Demo123!")
print("           audit@democorp.com / Demo123!")
