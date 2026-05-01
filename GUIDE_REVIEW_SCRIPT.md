# AURA Platform — Guide Review Demo Script

## Before Review Checklist
- [ ] Backend running: `cd backend && uvicorn main:app --reload --port 8000`
- [ ] Frontend running: `cd frontend/aura-dashboard && npm start`
- [ ] Demo data seeded: `cd backend && python3 seed_demo_data.py`
- [ ] Open `http://localhost:3000` in Chrome

---

## Demo Flow (15 minutes)

### 1. Login Page (1 min)
- Show the professional dark UI login screen
- Point out: ISO 27001, NIST CSF, SOC 2, FAIR badges
- Login as **CISO**: `ciso@democorp.com` / `Demo123!`

### 2. CISO Overview (3 min)
- Show 4 KPI cards: Risk Score, Controls Implemented, ISO Score, Open Tasks
- Show Risk Gauge (shows current posture at a glance)
- Show Risk Trends chart (6 months of improvement trajectory)
- Click **"Check Status"** → shows Priority 2 features
- Click **"Generate Summary"** → AI board-ready executive briefing
- Show **Board Report** section → click Generate Report → PDF downloads

### 3. Auto Assessment (3 min)
- Navigate to **Risk Assessment** tab (login as Developer)
- Show the **"Auto Pull from 9 Providers"** dark banner
- Click **"Auto Assess"** button
- Guide question prep: *"Where does this data come from?"*
  - Answer: Azure AD (MFA), Intune (patches), AWS (assets) — all auto-pulled
- Show results: 3 provider stats + risk summary

### 4. Compliance Mapping (2 min)
- Navigate to **Compliance** tab
- Show 3 framework cards: SOC 2, ISO 27001, NIST CSF
- Click on ISO 27001 → show control detail with pass/partial/fail
- Point out: "This replaces a manual compliance questionnaire worth thousands"

### 5. Remediation Board (2 min)
- Navigate to **Remediation** tab
- Show tasks auto-created from assessment (CRITICAL/HIGH/MEDIUM/LOW)
- Click **"⚡ AI Steps"** on any task → specific step-by-step instructions appear
- Show tasks moving from To Do → In Progress → Done

### 6. Controls Checklist (1 min)
- Navigate to **Controls** tab
- Show 199 controls across ISO 27001 + NIST CSF
- Show filter by framework + search
- Explain risk reduction scoring

### 7. Audit Trail (1 min)
- Navigate to **Audit Trail**
- Show 8 historical assessments with IST timestamps
- Show score trend from 88 → 48 (improving)
- Click Export CSV

### 8. Team Management (1 min)
- Navigate to **Team** tab
- Show multi-tenant user management
- Show role-based access (CISO/Developer/Auditor)

---

## Key Points to Emphasise

**On manual input replacement:**
> "Previously a security consultant would spend 2-3 hours manually filling a questionnaire. 
> AURA pulls from Azure AD, Intune, and AWS simultaneously in under 10 seconds."

**On compliance scores:**
> "This is not a formal SOC 2 certification. It's a pre-audit readiness tool — 
> the same approach used by SecurityScorecard and BitSight, two billion-dollar companies."

**On the ML model:**
> "The risk score uses a Random Forest model trained on security posture features.
> The FAIR model then translates that into a financial exposure estimate."

**On multi-tenancy:**
> "Every query is scoped by tenant_id from the JWT token.
> Demo Corp's data is completely isolated from any other organisation."

---

## Common Guide Questions & Answers

**Q: Is this pulling real data from Demo Corp?**
A: The platform is configured in simulation mode for academic purposes. The architecture 
   is identical to production — switching to real APIs requires only environment variables.

**Q: How accurate is the risk score?**
A: The ML model achieves 87% accuracy on the test set. It's a posture indicator, 
   not a penetration test result.

**Q: Does 80% SOC 2 score mean you're SOC 2 compliant?**
A: No. Formal SOC 2 Type II requires a licensed CPA firm examination over 6-12 months. 
   AURA shows readiness posture — where to focus before engaging an auditor.

**Q: What happens to the data?**
A: All data is stored in SQLite (dev) or PostgreSQL (prod), scoped by tenant ID.
   Each client's data is completely isolated via multi-tenancy architecture.
