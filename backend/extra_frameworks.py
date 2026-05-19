"""
extra_frameworks.py — RBI Cybersecurity and DPDP Act 2023 controls
"""

EXTRA_FRAMEWORK_META = {
    "RBI":  {"label": "RBI Cybersecurity", "color": "#8B5CF6"},
    "DPDP": {"label": "DPDP Act 2023",     "color": "#F97316"},
}

EXTRA_FRAMEWORKS = {
    "RBI": [
        {"id":"RBI-1",  "name":"Board-approved Cyber Security Policy",          "weight":12, "fields":[("has_irp","bool",True)]},
        {"id":"RBI-2",  "name":"Multi-factor Authentication on critical systems","weight":12, "fields":[("has_mfa","bool",True),("mfa_coverage","gte",80)]},
        {"id":"RBI-3",  "name":"Privileged Access Management (PAM)",             "weight":10, "fields":[("has_mfa","bool",True)]},
        {"id":"RBI-4",  "name":"Security patch management SLA",                  "weight":10, "fields":[("patch_days","lte",30)]},
        {"id":"RBI-5",  "name":"VAPT by CERT-In empanelled auditors",            "weight":10, "fields":[("has_vapt","bool",True)]},
        {"id":"RBI-6",  "name":"Data encryption in transit and at rest",         "weight":12, "fields":[("has_mfa","bool",True)]},
        {"id":"RBI-7",  "name":"Incident response and RBI reporting (2-6 hrs)",  "weight":12, "fields":[("has_irp","bool",True),("has_rbi_reporting","bool",True)]},
        {"id":"RBI-8",  "name":"Customer data localisation in India",            "weight":10, "fields":[("has_data_localisation","bool",True)]},
        {"id":"RBI-9",  "name":"24x7 network monitoring and C-SOC",             "weight":6,  "fields":[("vulnerabilities","lte",20)]},
        {"id":"RBI-10", "name":"Security awareness training for staff",           "weight":6,  "fields":[("training_percent","gte",60)]},
    ],
    "DPDP": [
        {"id":"DPDP-1", "name":"Obtain free and informed consent from users",    "weight":15, "fields":[("has_consent_mgmt","bool",True)]},
        {"id":"DPDP-2", "name":"Notice to data principals in plain language",    "weight":10, "fields":[("has_privacy_notice","bool",True)]},
        {"id":"DPDP-3", "name":"Data minimisation — collect only what is needed","weight":12, "fields":[("has_data_minimisation","bool",True)]},
        {"id":"DPDP-4", "name":"Data accuracy and completeness",                 "weight":8,  "fields":[("has_irp","bool",True)]},
        {"id":"DPDP-5", "name":"Erase data when purpose fulfilled",              "weight":10, "fields":[("has_retention_policy","bool",True)]},
        {"id":"DPDP-6", "name":"Personal data breach notification to DPBI",      "weight":15, "fields":[("has_irp","bool",True),("has_breach_notify","bool",True)]},
        {"id":"DPDP-7", "name":"Right of access — provide data within 48 hours", "weight":10, "fields":[("has_dsr_workflow","bool",True)]},
        {"id":"DPDP-8", "name":"Right to correction and erasure",                "weight":10, "fields":[("has_dsr_workflow","bool",True)]},
        {"id":"DPDP-9", "name":"Cross-border data transfer restrictions",        "weight":5,  "fields":[("has_data_localisation","bool",True)]},
        {"id":"DPDP-10","name":"Publish privacy policy on website/app",          "weight":5,  "fields":[("training_percent","gte",50)]},
    ],
}

def _check_field(val, op, expected):
    if val is None: return False
    if op == "bool": return bool(val) == expected
    if op == "gte":  return float(val or 0) >= expected
    if op == "lte":  return float(val or 999) <= expected
    return False

def score_extra_framework(key: str, assessment) -> dict:
    controls = EXTRA_FRAMEWORKS.get(key, [])
    meta = EXTRA_FRAMEWORK_META.get(key, {})
    if not controls:
        return {}

    scored = []
    total_weight = sum(c["weight"] for c in controls)
    earned = 0.0

    for control in controls:
        fields = control.get("fields", [])
        passing = []
        failing = []
        for field_def in fields:
            # Support both 3-tuple (field, op, expected) and 2-tuple (field, op)
            if len(field_def) == 3:
                field, op, expected = field_def
            else:
                field, op = field_def
                expected = True
            # Get value from assessment object or dict
            if isinstance(assessment, dict):
                val = assessment.get(field)
            else:
                val = getattr(assessment, field, None)
            if _check_field(val, op, expected):
                passing.append(field)
            else:
                failing.append(field)

        total_fields = len(fields)
        pass_count = len(passing)
        ratio = pass_count / total_fields if total_fields > 0 else 0.0
        ctrl_earned = round(control["weight"] * ratio, 2)
        earned += ctrl_earned

        status = "pass" if ratio == 1.0 else "fail" if ratio == 0.0 else "partial"
        scored.append({
            "id": control["id"],
            "name": control["name"],
            "status": status,
            "passing_fields": passing,
            "failing_fields": failing,
            "weight": control["weight"],
            "earned": ctrl_earned,
        })

    score = round((earned / total_weight) * 100, 1) if total_weight > 0 else 0.0
    return {
        "framework": key,
        "label": meta.get("label", key),
        "color": meta.get("color", "#7c3aed"),
        "score": score,
        "total_earned": round(earned, 2),
        "total_possible": total_weight,
        "controls": scored,
    }
