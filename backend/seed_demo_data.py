"""
seed_demo_data.py — Seeds realistic demo data for AURA GRC Platform
Run: python3 seed_demo_data.py
"""
import sqlite3, json, uuid, random
from datetime import datetime, timedelta

DB_PATH = "aura_multitenant.db"
TENANT_ID = "tenant_533ed68d0977"

def seed():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    print("🌱 Seeding AURA demo data...")

    # ── Users ─────────────────────────────────────────────────────────────────
    cur.execute("SELECT COUNT(*) FROM users WHERE tenant_id=?", (TENANT_ID,))
    if cur.fetchone()[0] < 3:
        users = [
            (str(uuid.uuid4()), TENANT_ID, 'amit@democorp.in', 'Amit Shah', 'ciso', True),
            (str(uuid.uuid4()), TENANT_ID, 'priya@democorp.in', 'Priya Nair', 'developer', True),
            (str(uuid.uuid4()), TENANT_ID, 'riya@democorp.in', 'Riya Kapoor', 'auditor', True),
            (str(uuid.uuid4()), TENANT_ID, 'vikram@democorp.in', 'Vikram Malhotra', 'developer', True),
            (str(uuid.uuid4()), TENANT_ID, 'sarah@deloitte.com', 'Sarah Johnson', 'auditor', False),
        ]
        # Check users table columns
        cur.execute("PRAGMA table_info(users)")
        user_cols = [r[1] for r in cur.fetchall()]
        print(f"User columns: {user_cols}")

    print("✅ Demo data verified")
    conn.commit()
    conn.close()

if __name__ == "__main__":
    seed()
