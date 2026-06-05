"""
AURA — AI Policy Engine
=======================
Drafts compliance policies from the company's live context (its detected stack,
chosen frameworks, and data types) instead of handing over blank templates.

Two modes, picked automatically:
  * LIVE  — if the `anthropic` SDK is importable AND an API key is present, the
            policy is drafted by the model from the company context.
  * TEMPLATE — otherwise, a high-quality structured template is filled from the
            same context. Always available, zero dependencies, never fails.

The route layer doesn't care which mode ran — the response shape is identical,
with a `generated_by` field of "ai" or "template".
"""

from __future__ import annotations

import os
from datetime import datetime, timezone


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%d %B %Y")


# --------------------------------------------------------------------------- #
#  Catalogue of policies AURA can generate, each with its section skeleton.
# --------------------------------------------------------------------------- #
POLICY_CATALOG: dict[str, dict] = {
    "information_security": {
        "title": "Information Security Policy",
        "frameworks": ["SOC2", "ISO27001"],
        "sections": ["Purpose & Scope", "Roles & Responsibilities", "Acceptable Use",
                     "Access Control", "Data Classification", "Incident Response",
                     "Review & Enforcement"],
    },
    "access_control": {
        "title": "Access Control Policy",
        "frameworks": ["SOC2", "ISO27001", "RBI"],
        "sections": ["Purpose & Scope", "Account Provisioning", "Authentication & MFA",
                     "Least Privilege", "Access Reviews", "Deprovisioning"],
    },
    "incident_response": {
        "title": "Incident Response Policy",
        "frameworks": ["SOC2", "RBI", "DPDP"],
        "sections": ["Purpose & Scope", "Incident Classification", "Detection & Triage",
                     "Containment & Eradication", "Regulatory Reporting", "Post-Incident Review"],
    },
    "data_retention": {
        "title": "Data Retention Policy",
        "frameworks": ["DPDP", "ISO27001"],
        "sections": ["Purpose & Scope", "Retention Periods", "Storage & Minimisation",
                     "Secure Disposal", "Legal Holds"],
    },
    "data_protection": {
        "title": "Data Protection Policy (DPDP)",
        "frameworks": ["DPDP"],
        "sections": ["Purpose & Scope", "Lawful Processing & Consent", "Data Principal Rights",
                     "Cross-Border Transfers", "Breach Notification", "Grievance Redressal"],
    },
    "vendor_risk": {
        "title": "Vendor & Third-Party Risk Policy",
        "frameworks": ["SOC2", "ISO27001", "RBI"],
        "sections": ["Purpose & Scope", "Vendor Onboarding & Due Diligence",
                     "Risk Tiering", "Contractual Safeguards", "Ongoing Monitoring", "Offboarding"],
    },
}


DEFAULT_CONTEXT = {
    "company_name": "Your Company",
    "industry": "Technology / SaaS",
    "frameworks": ["SOC2", "ISO27001", "RBI", "DPDP"],
    "detected_stack": ["aws", "okta", "github", "google_workspace"],
    "data_types": ["customer PII", "authentication data", "financial records"],
    "jurisdiction": "India",
}


def list_policies() -> list[dict]:
    return [{"key": k, "title": v["title"], "frameworks": v["frameworks"],
             "section_count": len(v["sections"])} for k, v in POLICY_CATALOG.items()]


# --------------------------------------------------------------------------- #
#  LIVE mode — Anthropic-drafted
# --------------------------------------------------------------------------- #
def _try_ai(policy_key: str, spec: dict, ctx: dict) -> dict | None:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    try:
        import anthropic  # type: ignore
    except Exception:
        return None
    try:
        client = anthropic.Anthropic(api_key=api_key)
        prompt = (
            f"You are a compliance writer. Draft a {spec['title']} for "
            f"{ctx['company_name']}, a {ctx['industry']} company operating in "
            f"{ctx.get('jurisdiction','India')}. Target frameworks: "
            f"{', '.join(spec['frameworks'])}. The company uses these systems: "
            f"{', '.join(ctx.get('detected_stack', []))}, and handles: "
            f"{', '.join(ctx.get('data_types', []))}.\n\n"
            f"Produce exactly these sections, each 2-4 sentences, concrete and "
            f"audit-ready: {', '.join(spec['sections'])}.\n"
            f"Return as 'Section Name: body' lines, one per section."
        )
        msg = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        text = "".join(b.text for b in msg.content if getattr(b, "type", "") == "text")
        sections = _parse_sections(text, spec["sections"])
        if not sections:
            return None
        return {"sections": sections, "generated_by": "ai"}
    except Exception:
        # Any API hiccup → fall through to the template. Never fail the request.
        return None


def _parse_sections(text: str, wanted: list[str]) -> list[dict]:
    out = []
    for name in wanted:
        body = ""
        for line in text.splitlines():
            if line.strip().lower().startswith(name.lower()):
                body = line.split(":", 1)[1].strip() if ":" in line else line.strip()
                break
        if body:
            out.append({"heading": name, "body": body})
    return out


# --------------------------------------------------------------------------- #
#  TEMPLATE mode — always available
# --------------------------------------------------------------------------- #
def _template_section(name: str, spec: dict, ctx: dict) -> str:
    company = ctx["company_name"]
    fw = ", ".join(spec["frameworks"])
    stack = ", ".join(ctx.get("detected_stack", [])) or "its production systems"
    data = ", ".join(ctx.get("data_types", [])) or "personal and operational data"
    juris = ctx.get("jurisdiction", "India")

    bank = {
        "Purpose & Scope":
            f"This policy establishes how {company} protects {data} in line with "
            f"{fw}. It applies to all employees, contractors, and systems including {stack}.",
        "Roles & Responsibilities":
            f"The CISO owns this policy. System owners maintain controls within {stack}; "
            f"all staff are responsible for adherence and for reporting deviations.",
        "Acceptable Use":
            f"{company} resources are for authorised business use only. Credentials must "
            f"not be shared, and security controls must not be bypassed.",
        "Access Control":
            f"Access to systems handling {data} follows least privilege, requires MFA, and "
            f"is reviewed at least quarterly. Provisioning and deprovisioning are logged.",
        "Account Provisioning":
            f"Accounts are created only on approved request, scoped to role, and tracked in "
            f"the identity provider across {stack}.",
        "Authentication & MFA":
            f"Multi-factor authentication is mandatory for all access to {stack}. Password "
            f"policy enforces minimum length 12 and complexity.",
        "Least Privilege":
            f"Permissions are granted at the minimum level required for the role and removed "
            f"when no longer needed.",
        "Access Reviews":
            f"Access rights are reviewed at least quarterly by system owners, with results "
            f"retained as audit evidence.",
        "Deprovisioning":
            f"Access is revoked within 24 hours of role change or termination across all of {stack}.",
        "Data Classification":
            f"Data is classified (public, internal, confidential, restricted). {data} are treated "
            f"as confidential or restricted and encrypted in transit and at rest.",
        "Incident Response":
            f"Suspected incidents are reported immediately and handled per the Incident Response "
            f"Policy, including regulatory notification where required.",
        "Incident Classification":
            f"Incidents are rated by severity and data impact, with criteria for what constitutes "
            f"a reportable event under {fw}.",
        "Detection & Triage":
            f"Alerts from {stack} are triaged by the security team; confirmed incidents are "
            f"escalated and timestamped.",
        "Containment & Eradication":
            f"Affected systems are isolated, the root cause removed, and integrity verified before "
            f"restoration.",
        "Regulatory Reporting":
            f"Where {juris} regulations apply, breaches are reported to the relevant authority "
            f"(e.g. CERT-In within 6 hours, RBI as applicable) and to affected data principals.",
        "Post-Incident Review":
            f"Every incident is followed by a documented review capturing root cause and corrective "
            f"actions, retained as evidence.",
        "Retention Periods":
            f"{data} are retained only as long as necessary for the stated purpose or legal "
            f"requirement, then securely disposed.",
        "Storage & Minimisation":
            f"Only the minimum data needed is collected and stored, segregated by sensitivity within {stack}.",
        "Secure Disposal":
            f"Data past its retention period is irreversibly deleted, and disposal is logged.",
        "Legal Holds":
            f"Retention may be extended under a documented legal hold, overriding routine disposal.",
        "Lawful Processing & Consent":
            f"{company} processes {data} only on a lawful basis, primarily explicit consent obtained "
            f"through clear notice, recorded and revocable.",
        "Data Principal Rights":
            f"Data principals may access, correct, and erase their data and withdraw consent; requests "
            f"are fulfilled within the statutory window.",
        "Cross-Border Transfers":
            f"Transfers outside {juris} occur only to permitted jurisdictions with adequate safeguards.",
        "Breach Notification":
            f"Personal-data breaches are notified to the Data Protection Board and affected principals "
            f"without undue delay.",
        "Grievance Redressal":
            f"A named Data Protection Officer handles grievances within the timeline set by the DPDP Act.",
        "Vendor Onboarding & Due Diligence":
            f"New vendors complete a security assessment before handling {data}; evidence is retained.",
        "Risk Tiering":
            f"Vendors are tiered by data access and criticality, driving the depth of review.",
        "Contractual Safeguards":
            f"Contracts include security, confidentiality, breach-notification, and audit clauses.",
        "Ongoing Monitoring":
            f"High-tier vendors are reassessed at least annually and on material change.",
        "Offboarding":
            f"On termination, vendor access is revoked and data return or destruction is confirmed.",
        "Review & Enforcement":
            f"This policy is reviewed annually and after major changes. Violations may result in "
            f"disciplinary action.",
    }
    return bank.get(name, f"{company} maintains controls for {name.lower()} consistent with {fw}.")


def _template(policy_key: str, spec: dict, ctx: dict) -> dict:
    sections = [{"heading": s, "body": _template_section(s, spec, ctx)}
                for s in spec["sections"]]
    return {"sections": sections, "generated_by": "template"}


# --------------------------------------------------------------------------- #
#  Public entry point
# --------------------------------------------------------------------------- #
def generate_policy(policy_key: str, company_context: dict | None = None) -> dict:
    spec = POLICY_CATALOG.get(policy_key)
    if not spec:
        return {"error": "unknown_policy",
                "available": list(POLICY_CATALOG.keys())}

    ctx = {**DEFAULT_CONTEXT, **(company_context or {})}
    drafted = _try_ai(policy_key, spec, ctx) or _template(policy_key, spec, ctx)

    return {
        "policy_key": policy_key,
        "title": spec["title"],
        "frameworks": spec["frameworks"],
        "company": ctx["company_name"],
        "version": "1.0",
        "effective_date": _today(),
        "generated_by": drafted["generated_by"],
        "sections": drafted["sections"],
    }


if __name__ == "__main__":
    import json
    print("Available policies:")
    print(json.dumps(list_policies(), indent=2))
    print("\nSample generation (information_security):")
    out = generate_policy("information_security",
                          {"company_name": "DemoCorp", "industry": "Fintech"})
    print("mode:", out["generated_by"], "| sections:", len(out["sections"]))
    for s in out["sections"][:2]:
        print(f"\n## {s['heading']}\n{s['body']}")
