# AURA Platform
### AI-Powered Unified Risk & Audit Platform

Enterprise-grade GRC (Governance, Risk & Compliance) SaaS platform for MSPs and security consultants.

---

## Quick Start (Development)

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend/aura-dashboard
npm install
npm start
```

Open `http://localhost:3000`

Default credentials:
- CISO: `ciso@demo.com` / `Demo123!`
- Developer: `dev@demo.com` / `Demo123!`

---

## Quick Start (Docker — Production)

```bash
cp .env.example .env
# Edit .env with your values

docker-compose up --build -d
```

Open `http://localhost:3000`

---

## Features

### Core Platform
- Multi-tenant SaaS with JWT authentication
- Role-based access: CISO / Security Engineer / Auditor
- ML-powered risk scoring (Random Forest)
- FAIR financial exposure model

### Priority 1 — Real World Data (9 Integrations)
| Category | Providers |
|---|---|
| Identity | Azure AD, AWS IAM, Google Workspace |
| Patch Management | Microsoft Intune, Jamf Pro, WSUS |
| Asset Inventory | AWS, Microsoft Azure, Google Cloud |

### Priority 2 — AI + Automation
- **AI Remediation** — Step-by-step fix instructions (Claude API or smart templates)
- **Executive Summary** — Board-ready briefing generator
- **Email Alerts** — Score drop notifications + weekly digest
- **Scheduler** — Weekly auto-assessments (Monday 9AM IST)

### Compliance Frameworks
- SOC 2 Type II (Trust Service Criteria)
- ISO 27001:2022 (93 controls)
- NIST CSF v2.0 (106 subcategories)

---

## Architecture

```
frontend/          React 18 (dark UI, Vanta-inspired)
backend/
  main.py          FastAPI entry point
  models.py        SQLAlchemy ORM (SQLite/PostgreSQL)
  routers/         API endpoints
  services/        Business logic + integrations
  predict.py       ML risk model (scikit-learn)
```

---

## API Documentation

Running: `http://localhost:8000/docs`

Key endpoints:
- `POST /api/auto/assess` — Fully automatic assessment (9 providers)
- `POST /api/p2/remediation-advice` — AI remediation steps
- `GET  /api/p2/status` — Feature status overview
- `POST /api/compliance/assessments/{id}` — Run compliance mapping

---

## Environment Variables

See `.env.example` for full list.

Minimum required for full functionality:
```
SECRET_KEY=...            # JWT signing key
ANTHROPIC_API_KEY=...     # Claude AI features
SMTP_USER=...             # Email alerts
SMTP_PASSWORD=...         # Gmail App Password
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Inter font, Lucide icons |
| Backend | FastAPI, SQLAlchemy, JWT |
| ML Model | scikit-learn Random Forest |
| Database | SQLite (dev) / PostgreSQL (prod) |
| AI | Anthropic Claude claude-sonnet-4-20250514 |
| Scheduler | APScheduler |
| Container | Docker + Docker Compose |

---

## Academic Project Notes

This platform was built as an academic GRC project demonstrating:
1. Multi-tenant SaaS architecture
2. ML-based risk quantification (FAIR model)
3. Real-world API integrations (simulated in academic mode)
4. Compliance framework automation (SOC 2, ISO 27001, NIST CSF)
5. AI-powered security recommendations

> Note: All cloud/identity integrations run in simulation mode unless real API keys are configured. Compliance scores indicate readiness posture, not formal certification.

---

Built with FastAPI + React | IST Timestamps | v2.0
