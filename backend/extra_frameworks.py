"""
extra_frameworks.py — Full controls for HIPAA, GDPR, PCI DSS, RBI, DPDP
"""

EXTRA_FRAMEWORK_META = {
    "HIPAA":   {"label": "HIPAA",                "color": "#F59E0B"},
    "GDPR":    {"label": "GDPR",                 "color": "#EC4899"},
    "PCI_DSS": {"label": "PCI DSS v4.0",         "color": "#14B8A6"},
    "RBI":     {"label": "RBI Cybersecurity",    "color": "#8B5CF6"},
    "DPDP":    {"label": "DPDP Act 2023",        "color": "#F97316"},
}

EXTRA_FRAMEWORKS = {
    "HIPAA": [
        {"id": "HIPAA.164.308.a.1", "name": "Security Management Process",           "weight": 15, "fields": [("has_mfa","bool",True),("has_irp","bool",True)]},
        {"id": "HIPAA.164.308.a.2", "name": "Assigned Security Responsibility",      "weight": 10, "fields": [("has_irp","bool",True)]},
        {"id": "HIPAA.164.308.a.3", "name": "Workforce Security",                    "weight": 12, "fields": [("training_percent","gte",70)]},
        {"id": "HIPAA.164.308.a.4", "name": "Information Access Management",         "weight": 15, "fields": [("has_mfa","bool",True),("mfa_coverage","gte",80)]},
        {"id": "HIPAA.164.308.a.5", "name": "Security Awareness & Training",         "weight": 12, "fields": [("training_percent","gte",60)]},
        {"id": "HIPAA.164.308.a.6", "name": "Security Incident Procedures",          "weight": 15, "fields": [("has_irp","bool",True)]},
        {"id": "HIPAA.164.308.a.7", "name": "Contingency Plan",                      "weight": 12, "fields": [("has_irp","bool",True)]},
        {"id": "HIPAA.164.308.a.8", "name": "Evaluation",                            "weight": 10, "fields": [("vulnerabilities","lte",5)]},
        {"id": "HIPAA.164.310.a.1", "name": "Facility Access Controls",              "weight": 10, "fields": [("has_mfa","bool",True)]},
        {"id": "HIPAA.164.310.b",   "name": "Workstation Use Policy",                "weight": 8,  "fields": [("training_percent","gte",50)]},
        {"id": "HIPAA.164.310.c",   "name": "Workstation Security",                  "weight": 8,  "fields": [("patch_days","lte",30)]},
        {"id": "HIPAA.164.310.d.1", "name": "Device & Media Controls",               "weight": 10, "fields": [("patch_days","lte",14)]},
        {"id": "HIPAA.164.312.a.1", "name": "Access Control — ePHI",                 "weight": 15, "fields": [("has_mfa","bool",True),("mfa_coverage","gte",90)]},
        {"id": "HIPAA.164.312.b",   "name": "Audit Controls",                        "weight": 12, "fields": [("vulnerabilities","lte",10)]},
        {"id": "HIPAA.164.312.c.1", "name": "Integrity Controls",                    "weight": 12, "fields": [("has_irp","bool",True)]},
        {"id": "HIPAA.164.312.d",   "name": "Person or Entity Authentication",       "weight": 15, "fields": [("has_mfa","bool",True),("mfa_coverage","gte",95)]},
        {"id": "HIPAA.164.312.e.1", "name": "Transmission Security",                 "weight": 15, "fields": [("has_mfa","bool",True)]},
    ],
    "GDPR": [
        {"id": "GDPR.Art.5",  "name": "Principles of data processing",               "weight": 12, "fields": [("has_irp","bool",True)]},
        {"id": "GDPR.Art.6",  "name": "Lawfulness of processing",                    "weight": 15, "fields": [("has_irp","bool",True),("training_percent","gte",50)]},
        {"id": "GDPR.Art.7",  "name": "Conditions for consent",                      "weight": 12, "fields": [("training_percent","gte",60)]},
        {"id": "GDPR.Art.12", "name": "Transparent information & communication",     "weight": 10, "fields": [("training_percent","gte",50)]},
        {"id": "GDPR.Art.13", "name": "Information to be provided at collection",    "weight": 10, "fields": [("training_percent","gte",40)]},
        {"id": "GDPR.Art.15", "name": "Right of access by the data subject",         "weight": 10, "fields": [("has_irp","bool",True)]},
        {"id": "GDPR.Art.17", "name": "Right to erasure (right to be forgotten)",    "weight": 12, "fields": [("has_irp","bool",True)]},
        {"id": "GDPR.Art.20", "name": "Right to data portability",                   "weight": 8,  "fields": [("has_irp","bool",True)]},
        {"id": "GDPR.Art.25", "name": "Data protection by design & by default",      "weight": 15, "fields": [("has_mfa","bool",True),("mfa_coverage","gte",70)]},
        {"id": "GDPR.Art.28", "name": "Processor obligations & contracts",            "weight": 12, "fields": [("has_irp","bool",True)]},
        {"id": "GDPR.Art.30", "name": "Records of processing activities",             "weight": 10, "fields": [("vulnerabilities","lte",10)]},
        {"id": "GDPR.Art.32", "name": "Security of processing — technical measures", "weight": 15, "fields": [("has_mfa","bool",True),("patch_days","lte",30)]},
        {"id": "GDPR.Art.33", "name": "Notification of breach to supervisory body",  "weight": 15, "fields": [("has_irp","bool",True)]},
        {"id": "GDPR.Art.35", "name": "Data protection impact assessment (DPIA)",    "weight": 12, "fields": [("has_irp","bool",True),("vulnerabilities","lte",5)]},
        {"id": "GDPR.Art.37", "name": "Data Protection Officer (DPO)",               "weight": 10, "fields": [("has_irp","bool",True)]},
    ],
    "PCI_DSS": [
        {"id": "PCI.1",  "name": "Install & maintain network security controls",       "weight": 15, "fields": [("has_mfa","bool",True),("patch_days","lte",30)]},
        {"id": "PCI.2",  "name": "Apply secure configurations to all systems",         "weight": 15, "fields": [("patch_days","lte",14)]},
        {"id": "PCI.3",  "name": "Protect stored account data",                        "weight": 15, "fields": [("has_mfa","bool",True)]},
        {"id": "PCI.4",  "name": "Protect cardholder data in transit",                 "weight": 15, "fields": [("has_mfa","bool",True)]},
        {"id": "PCI.5",  "name": "Protect all systems against malware",                "weight": 15, "fields": [("patch_days","lte",30),("vulnerabilities","lte",10)]},
        {"id": "PCI.6",  "name": "Develop & maintain secure systems & software",       "weight": 12, "fields": [("patch_days","lte",21)]},
        {"id": "PCI.7",  "name": "Restrict access by need-to-know",                    "weight": 15, "fields": [("has_mfa","bool",True),("mfa_coverage","gte",80)]},
        {"id": "PCI.8",  "name": "Identify users & authenticate access",               "weight": 15, "fields": [("has_mfa","bool",True),("mfa_coverage","gte",90)]},
        {"id": "PCI.9",  "name": "Restrict physical access to cardholder data",        "weight": 10, "fields": [("has_mfa","bool",True)]},
        {"id": "PCI.10", "name": "Log & monitor all access to networks",               "weight": 12, "fields": [("vulnerabilities","lte",10)]},
        {"id": "PCI.11", "name": "Test security of systems & networks regularly",      "weight": 12, "fields": [("vulnerabilities","lte",5)]},
        {"id": "PCI.12", "name": "Support information security with policies",         "weight": 10, "fields": [("training_percent","gte",70),("has_irp","bool",True)]},
    ],
    "RBI": [
        {"id": "RBI.IT.1",  "name": "IT Governance Framework",                         "weight": 12, "fields": [("has_irp","bool",True)]},
        {"id": "RBI.IT.2",  "name": "Information & Cyber Security Policy",             "weight": 15, "fields": [("has_irp","bool",True),("training_percent","gte",60)]},
        {"id": "RBI.IT.3",  "name": "IT Infrastructure & Services Management",         "weight": 10, "fields": [("patch_days","lte",30)]},
        {"id": "RBI.IT.4",  "name": "IT & Cyber Risk Management",                      "weight": 15, "fields": [("has_irp","bool",True),("vulnerabilities","lte",10)]},
        {"id": "RBI.IT.5",  "name": "Business Continuity Planning",                    "weight": 12, "fields": [("has_irp","bool",True)]},
        {"id": "RBI.IT.6",  "name": "Customer Data Privacy & Protection",              "weight": 15, "fields": [("has_mfa","bool",True),("mfa_coverage","gte",80)]},
        {"id": "RBI.IT.7",  "name": "Cyber Security Incident Reporting to RBI",       "weight": 15, "fields": [("has_irp","bool",True)]},
        {"id": "RBI.IT.8",  "name": "Third Party & Vendor Risk Management",            "weight": 12, "fields": [("has_irp","bool",True)]},
        {"id": "RBI.IT.9",  "name": "Security Operations Centre (SOC)",               "weight": 12, "fields": [("vulnerabilities","lte",5)]},
        {"id": "RBI.IT.10", "name": "Vulnerability Assessment & Pen Testing",          "weight": 12, "fields": [("vulnerabilities","lte",10),("patch_days","lte",30)]},
        {"id": "RBI.IT.11", "name": "Network & Application Security",                  "weight": 12, "fields": [("patch_days","lte",14),("has_mfa","bool",True)]},
        {"id": "RBI.IT.12", "name": "Patch & Change Management",                       "weight": 10, "fields": [("patch_days","lte",30)]},
    ],
    "DPDP": [
        {"id": "DPDP.S.4",  "name": "Lawful processing of personal data",              "weight": 15, "fields": [("has_irp","bool",True)]},
        {"id": "DPDP.S.5",  "name": "Notice to data principals",                       "weight": 12, "fields": [("training_percent","gte",50)]},
        {"id": "DPDP.S.6",  "name": "Consent from data principal",                     "weight": 15, "fields": [("has_irp","bool",True),("training_percent","gte",60)]},
        {"id": "DPDP.S.8",  "name": "Obligations of data fiduciary",                   "weight": 15, "fields": [("has_irp","bool",True)]},
        {"id": "DPDP.S.9",  "name": "Processing of children's data",                  "weight": 12, "fields": [("training_percent","gte",70)]},
        {"id": "DPDP.S.10", "name": "Security safeguards for personal data",           "weight": 15, "fields": [("has_mfa","bool",True),("patch_days","lte",30)]},
        {"id": "DPDP.S.11", "name": "Notification of personal data breach",            "weight": 15, "fields": [("has_irp","bool",True)]},
        {"id": "DPDP.S.12", "name": "Right to access information",                     "weight": 10, "fields": [("has_irp","bool",True)]},
        {"id": "DPDP.S.13", "name": "Right to correction & erasure",                   "weight": 10, "fields": [("has_irp","bool",True)]},
        {"id": "DPDP.S.14", "name": "Right to grievance redressal",                    "weight": 8,  "fields": [("has_irp","bool",True)]},
        {"id": "DPDP.S.16", "name": "Significant data fiduciary obligations",          "weight": 12, "fields": [("has_mfa","bool",True),("has_irp","bool",True)]},
        {"id": "DPDP.S.19", "name": "Data Protection Board compliance",                "weight": 10, "fields": [("has_irp","bool",True)]},
    ],
}


def _passes(value, op, threshold):
    """Check if a field value passes the control condition."""
    if value is None:
        return False
    if op == "bool":
        return bool(value) == threshold
    if op == "gte":
        try: return float(value) >= threshold
        except: return False
    if op == "lte":
        try: return float(value) <= threshold
        except: return False
    return False


def score_extra_framework(framework_key, assessment):
    """Score an assessment against an extra compliance framework.
    
    assessment: SQLAlchemy Assessment ORM object
    """
    if framework_key not in EXTRA_FRAMEWORKS:
        return None

    meta    = EXTRA_FRAMEWORK_META[framework_key]
    rules   = EXTRA_FRAMEWORKS[framework_key]
    controls = []
    total_weight  = 0
    earned_weight = 0

    for rule in rules:
        weight  = rule["weight"]
        total_weight += weight

        # Check all conditions for this control
        all_pass = True
        any_fail = False
        partial  = False

        for field, op, threshold in rule["fields"]:
            val = getattr(assessment, field, None)
            if not _passes(val, op, threshold):
                all_pass = False
            else:
                partial = True

        if all_pass:
            status = "pass"
            earned = weight
        elif partial:
            status = "partial"
            earned = weight * 0.5
        else:
            status = "fail"
            earned = 0

        earned_weight += earned
        controls.append({
            "id":          rule["id"],
            "name":        rule["name"],
            "status":      status,
            "weight":      weight,
            "earned":      earned,
            "description": f"{meta['label']} control: {rule['name']}",
        })

    score = round((earned_weight / total_weight * 100), 1) if total_weight > 0 else 0

    return {
        "framework": framework_key,
        "label":     meta["label"],
        "score":     score,
        "controls":  controls,
    }
