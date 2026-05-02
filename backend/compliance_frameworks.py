from typing import Dict, List, Any

SOC2_CONTROLS: List[Dict[str, Any]] = [
    {"id":"CC1.1","name":"Control Environment — Commitment to Integrity",    "description":"Management demonstrates commitment to integrity and ethical values.",        "assessment_fields":["has_irp","training_percent"],   "weight":10},
    {"id":"CC1.2","name":"Control Environment — Board Oversight",           "description":"Board demonstrates independence and exercises oversight of controls.",       "assessment_fields":["has_irp"],                      "weight":10},
    {"id":"CC1.3","name":"Control Environment — Organisational Structure",  "description":"Management establishes structures and authorities to achieve objectives.",   "assessment_fields":["has_irp","training_percent"],   "weight":8},
    {"id":"CC1.4","name":"Control Environment — Competence",                "description":"Commitment to attract, develop and retain competent individuals.",           "assessment_fields":["training_percent"],             "weight":8},
    {"id":"CC1.5","name":"Control Environment — Accountability",            "description":"Individuals held accountable for control responsibilities.",                 "assessment_fields":["has_irp","training_percent"],   "weight":8},
    {"id":"CC2.1","name":"Communication — Information Quality",             "description":"Quality information generated and used to support internal control.",        "assessment_fields":["has_irp"],                      "weight":10},
    {"id":"CC2.2","name":"Communication — Internal Communication",          "description":"Internally communicates information needed for control functioning.",        "assessment_fields":["training_percent"],             "weight":8},
    {"id":"CC2.3","name":"Communication — External Communication",          "description":"Communicates with external parties about matters affecting controls.",       "assessment_fields":["has_irp"],                      "weight":8},
    {"id":"CC3.1","name":"Risk Assessment — Objectives",                    "description":"Specifies objectives clearly to identify risks related to them.",            "assessment_fields":["has_irp","vulnerabilities"],    "weight":12},
    {"id":"CC3.2","name":"Risk Assessment — Identification & Analysis",     "description":"Identifies and analyses risks across the entity.",                          "assessment_fields":["vulnerabilities","patch_days"], "weight":12},
    {"id":"CC3.3","name":"Risk Assessment — Fraud Risk",                    "description":"Considers potential for fraud in assessing risk.",                          "assessment_fields":["has_irp"],                      "weight":10},
    {"id":"CC3.4","name":"Risk Assessment — Significant Changes",           "description":"Identifies and assesses changes that could impact internal control.",       "assessment_fields":["patch_days","has_irp"],         "weight":10},
    {"id":"CC4.1","name":"Monitoring — Ongoing & Separate Evaluations",     "description":"Ongoing and separate evaluations used to ascertain controls are present.",  "assessment_fields":["vulnerabilities"],              "weight":12},
    {"id":"CC4.2","name":"Monitoring — Deficiency Communication",           "description":"Control deficiencies communicated to responsible parties.",                 "assessment_fields":["has_irp"],                      "weight":10},
    {"id":"CC5.1","name":"Control Activities — Mitigation Actions",         "description":"Selects and develops control activities that mitigate risks.",              "assessment_fields":["has_irp","vulnerabilities"],    "weight":12},
    {"id":"CC5.2","name":"Control Activities — Technology Controls",        "description":"Selects and develops general technology controls.",                         "assessment_fields":["patch_days","has_mfa"],         "weight":12},
    {"id":"CC5.3","name":"Control Activities — Policies & Procedures",      "description":"Deploys control activities through policies and procedures.",              "assessment_fields":["has_irp","training_percent"],   "weight":10},
    {"id":"CC6.1","name":"Logical Access — Security Software",              "description":"Logical access security software, infrastructure implemented.",             "assessment_fields":["has_mfa","mfa_coverage"],       "weight":15},
    {"id":"CC6.2","name":"Logical Access — User Registration",              "description":"Prior to access, users registered and authorised.",                        "assessment_fields":["has_mfa","mfa_coverage"],       "weight":12},
    {"id":"CC6.3","name":"Logical Access — Role-Based Access",              "description":"Role-based access controls implemented and maintained.",                   "assessment_fields":["has_mfa","mfa_coverage"],       "weight":12},
    {"id":"CC6.4","name":"Logical Access — Physical Access Restriction",    "description":"Physical access to facilities and protected information restricted.",      "assessment_fields":["has_mfa"],                      "weight":10},
    {"id":"CC6.5","name":"Logical Access — Account Termination",            "description":"Access removed when no longer required (terminations).",                   "assessment_fields":["has_mfa","training_percent"],   "weight":10},
    {"id":"CC6.6","name":"Logical Access — External Threats",               "description":"Logical access to assets from outside restricted.",                        "assessment_fields":["has_mfa","patch_days"],         "weight":12},
    {"id":"CC6.7","name":"Logical Access — Data Transmission",              "description":"Transmission, movement and removal of information restricted.",            "assessment_fields":["has_mfa"],                      "weight":12},
    {"id":"CC6.8","name":"Logical Access — Malware Prevention",             "description":"Controls implemented to prevent or detect unauthorised/malicious software.","assessment_fields":["patch_days","vulnerabilities"], "weight":15},
    {"id":"CC7.1","name":"System Operations — Configuration Management",    "description":"Infrastructure and software managed to support achievement of objectives.","assessment_fields":["patch_days"],                  "weight":12},
    {"id":"CC7.2","name":"System Operations — Anomaly Detection",           "description":"Environmental, physical, and logical security anomalies detected.",        "assessment_fields":["vulnerabilities","patch_days"], "weight":12},
    {"id":"CC7.3","name":"System Operations — Event Evaluation",            "description":"Detected events evaluated to determine whether incidents have occurred.",   "assessment_fields":["has_irp","vulnerabilities"],    "weight":12},
    {"id":"CC7.4","name":"System Operations — Incident Response",           "description":"Security incidents identified and responded to according to plan.",        "assessment_fields":["has_irp"],                      "weight":15},
    {"id":"CC7.5","name":"System Operations — Recovery",                    "description":"Identified security incidents addressed to meet objectives.",              "assessment_fields":["has_irp"],                      "weight":12},
    {"id":"CC8.1","name":"Change Management — Infrastructure Changes",      "description":"Infrastructure, data, software and procedures managed via change control.","assessment_fields":["patch_days","has_irp"],         "weight":12},
    {"id":"CC9.1","name":"Risk Mitigation — Vendor & Business Partner Risk","description":"Vendor and business partner risk identified and managed.",                 "assessment_fields":["has_irp","training_percent"],   "weight":10},
    {"id":"CC9.2","name":"Risk Mitigation — Business Disruption Risk",      "description":"Business disruption risk and residual risk identified and managed.",       "assessment_fields":["has_irp"],                      "weight":10},
    {"id":"A1.1", "name":"Availability — Capacity Management",              "description":"Current processing capacity and usage monitored to meet availability.",    "assessment_fields":["vulnerabilities","patch_days"], "weight":12},
    {"id":"A1.2", "name":"Availability — Environmental Threats",            "description":"Environmental and technological threats to availability monitored.",       "assessment_fields":["has_irp","patch_days"],         "weight":10},
    {"id":"A1.3", "name":"Availability — Recovery Plan",                   "description":"Recovery plan procedures to support restoration of system.",               "assessment_fields":["has_irp"],                      "weight":12},
    {"id":"PI1.1","name":"Processing Integrity — Inputs",                   "description":"Inputs are complete, accurate and authorised.",                            "assessment_fields":["has_irp","training_percent"],   "weight":10},
    {"id":"PI1.2","name":"Processing Integrity — System Processing",        "description":"System processing complete, accurate, timely, authorised.",               "assessment_fields":["patch_days","has_irp"],         "weight":10},
    {"id":"C1.1", "name":"Confidentiality — Identify & Maintain",           "description":"Confidential information is identified and maintained.",                  "assessment_fields":["has_mfa","training_percent"],   "weight":12},
    {"id":"C1.2", "name":"Confidentiality — Dispose",                      "description":"Confidential information disposed of to meet entity objectives.",          "assessment_fields":["has_irp"],                      "weight":10},
    {"id":"P1.1", "name":"Privacy — Notice & Communication",                "description":"Privacy notice communicated to data subjects at collection.",              "assessment_fields":["training_percent"],             "weight":10},
    {"id":"P2.1", "name":"Privacy — Choice & Consent",                      "description":"Choices and consent obtained from individuals on use of personal data.",   "assessment_fields":["training_percent","has_irp"],   "weight":10},
    {"id":"P3.1", "name":"Privacy — Collection Limitation",                 "description":"Personal information collected only for identified purposes.",             "assessment_fields":["has_irp"],                      "weight":10},
    {"id":"P4.1", "name":"Privacy — Use, Retention & Disposal",             "description":"Personal information used, retained and disposed per commitments.",        "assessment_fields":["has_irp","training_percent"],   "weight":10},
    {"id":"P5.1", "name":"Privacy — Access & Correction",                   "description":"Access to personal information provided to data subjects on request.",     "assessment_fields":["has_irp"],                      "weight":8},
    {"id":"P6.1", "name":"Privacy — Disclosure & Notification",             "description":"Personal information disclosed only per commitments and law.",             "assessment_fields":["has_irp","training_percent"],   "weight":10},
    {"id":"P7.1", "name":"Privacy — Quality",                               "description":"Personal information accurate, complete and relevant.",                    "assessment_fields":["has_irp"],                      "weight":8},
    {"id":"P8.1", "name":"Privacy — Monitoring & Enforcement",              "description":"Privacy commitments monitored and enforced.",                              "assessment_fields":["has_irp","training_percent"],   "weight":10},
]
ISO27001_CONTROLS: List[Dict[str, Any]] = [
    {"id":"A.5.1",  "name":"Policies for information security",            "description":"Management direction for information security via policies.", "assessment_fields":["has_irp","training_percent"],      "weight":10},
    {"id":"A.5.2",  "name":"Information security roles & responsibilities", "description":"All security responsibilities are defined and allocated.",   "assessment_fields":["has_irp"],                         "weight":10},
    {"id":"A.5.3",  "name":"Segregation of duties",                        "description":"Conflicting duties segregated to prevent fraud.",             "assessment_fields":["has_irp","training_percent"],      "weight":8},
    {"id":"A.5.4",  "name":"Management responsibilities",                  "description":"Management requires staff to apply information security.",    "assessment_fields":["training_percent"],                "weight":8},
    {"id":"A.5.5",  "name":"Contact with authorities",                     "description":"Contacts with relevant authorities maintained.",              "assessment_fields":["has_irp"],                         "weight":6},
    {"id":"A.5.15", "name":"Access control",                               "description":"Rules to control physical and logical access to assets.",     "assessment_fields":["has_mfa","mfa_coverage"],          "weight":15},
    {"id":"A.5.16", "name":"Identity management",                          "description":"Full lifecycle of identities is managed.",                    "assessment_fields":["has_mfa","mfa_coverage"],          "weight":12},
    {"id":"A.5.17", "name":"Authentication information",                   "description":"Management of authentication secrets.",                      "assessment_fields":["has_mfa"],                         "weight":12},
    {"id":"A.5.18", "name":"Access rights",                                "description":"Access rights provisioned, reviewed, removed appropriately.", "assessment_fields":["has_mfa","mfa_coverage"],          "weight":12},
    {"id":"A.5.24", "name":"Incident management planning",                 "description":"Organisation plans and prepares for incident management.",    "assessment_fields":["has_irp"],                         "weight":15},
    {"id":"A.5.25", "name":"Assessment of security events",                "description":"Security events assessed and classified as incidents.",       "assessment_fields":["has_irp","vulnerabilities"],       "weight":12},
    {"id":"A.5.26", "name":"Response to incidents",                        "description":"Incidents responded to per documented procedures.",           "assessment_fields":["has_irp"],                         "weight":15},
    {"id":"A.5.27", "name":"Learning from incidents",                      "description":"Knowledge from incidents used to strengthen controls.",       "assessment_fields":["has_irp"],                         "weight":10},
    {"id":"A.6.1",  "name":"Screening",                                    "description":"Background verification checks on all candidates.",           "assessment_fields":["training_percent"],                "weight":8},
    {"id":"A.6.3",  "name":"Security awareness & training",                "description":"Staff receive awareness training and regular updates.",       "assessment_fields":["training_percent"],                "weight":15},
    {"id":"A.6.5",  "name":"Responsibilities after termination",           "description":"Security responsibilities remain after job change.",          "assessment_fields":["has_irp","training_percent"],      "weight":8},
    {"id":"A.7.1",  "name":"Physical security perimeters",                 "description":"Security perimeters protect information and assets.",         "assessment_fields":["has_mfa"],                         "weight":10},
    {"id":"A.7.2",  "name":"Physical entry controls",                      "description":"Secure areas protected by appropriate entry controls.",       "assessment_fields":["has_mfa"],                         "weight":10},
    {"id":"A.8.1",  "name":"User endpoint devices",                        "description":"Information on user endpoint devices is protected.",          "assessment_fields":["patch_days","has_mfa"],            "weight":12},
    {"id":"A.8.2",  "name":"Privileged access rights",                     "description":"Privileged access rights restricted and managed.",            "assessment_fields":["has_mfa","mfa_coverage"],          "weight":15},
    {"id":"A.8.5",  "name":"Secure authentication",                        "description":"Secure authentication technologies and procedures used.",     "assessment_fields":["has_mfa","mfa_coverage"],          "weight":15},
    {"id":"A.8.7",  "name":"Protection against malware",                   "description":"Protection against malware implemented and supported.",       "assessment_fields":["patch_days","vulnerabilities"],    "weight":15},
    {"id":"A.8.8",  "name":"Management of technical vulnerabilities",      "description":"Technical vulnerabilities identified and remediated.",        "assessment_fields":["patch_days","vulnerabilities"],    "weight":15},
    {"id":"A.8.9",  "name":"Configuration management",                     "description":"Configurations established, documented and monitored.",       "assessment_fields":["patch_days"],                      "weight":12},
    {"id":"A.8.12", "name":"Data leakage prevention",                      "description":"Measures applied to prevent data leakage.",                  "assessment_fields":["has_mfa","vulnerabilities"],       "weight":12},
    {"id":"A.8.13", "name":"Information backup",                           "description":"Backup copies maintained and tested regularly.",              "assessment_fields":["has_irp"],                         "weight":12},
    {"id":"A.8.15", "name":"Logging",                                      "description":"Logs that record activity produced and stored.",              "assessment_fields":["vulnerabilities"],                 "weight":12},
    {"id":"A.8.16", "name":"Monitoring activities",                        "description":"Networks, systems and applications monitored.",               "assessment_fields":["vulnerabilities","patch_days"],    "weight":12},
    {"id":"A.8.20", "name":"Network security",                             "description":"Networks secured, managed and controlled.",                   "assessment_fields":["patch_days","has_mfa"],            "weight":12},
    {"id":"A.8.24", "name":"Use of cryptography",                          "description":"Rules for effective use of cryptography implemented.",        "assessment_fields":["has_mfa"],                         "weight":15},
    {"id":"A.8.25", "name":"Secure development lifecycle",                 "description":"Security integrated into development lifecycle.",             "assessment_fields":["patch_days","vulnerabilities"],    "weight":12},
    {"id":"A.8.28", "name":"Secure coding",                                "description":"Secure coding principles applied in development.",            "assessment_fields":["patch_days"],                      "weight":10},
    {"id":"A.8.29", "name":"Security testing in development",              "description":"Security testing processes defined and implemented.",         "assessment_fields":["vulnerabilities","patch_days"],    "weight":10},
    {"id":"A.8.32", "name":"Change management",                            "description":"Changes to systems managed with security controls.",          "assessment_fields":["patch_days","has_irp"],            "weight":10},
]
NIST_CSF_CONTROLS: List[Dict[str, Any]] = [
    {"id":"GV.OC-01","name":"Organisational cybersecurity mission",         "description":"Organisation's mission and risk strategy understood.",      "assessment_fields":["has_irp"],                         "weight":8},
    {"id":"GV.PO-01","name":"Cybersecurity policy established",             "description":"Cybersecurity policy communicated across organisation.",    "assessment_fields":["has_irp","training_percent"],      "weight":10},
    {"id":"GV.PO-02","name":"Cybersecurity roles known",                    "description":"Roles, responsibilities and authorities established.",      "assessment_fields":["has_irp"],                         "weight":8},
    {"id":"GV.RM-01","name":"Risk management objectives established",       "description":"Risk management objectives set and communicated.",          "assessment_fields":["has_irp","vulnerabilities"],       "weight":10},
    {"id":"GV.RM-02","name":"Risk appetite determined",                     "description":"Risk appetite and tolerance determined and communicated.",   "assessment_fields":["has_irp"],                         "weight":8},
    {"id":"GV.RM-06","name":"Risk reported to leadership",                  "description":"Cybersecurity risk reported to executives and board.",       "assessment_fields":["has_irp"],                         "weight":10},
    {"id":"GV.RR-01","name":"Leadership accountable for cybersecurity",     "description":"Senior leaders accountable for cybersecurity outcomes.",    "assessment_fields":["has_irp","training_percent"],      "weight":10},
    {"id":"GV.RR-02","name":"Roles & responsibilities established",         "description":"Cybersecurity roles, responsibilities defined.",             "assessment_fields":["training_percent"],                "weight":8},
    {"id":"GV.SC-06","name":"Cybersecurity in supply chain",                "description":"Cybersecurity requirements included in supply chain.",       "assessment_fields":["has_irp"],                         "weight":8},
    {"id":"ID.AM-01","name":"Hardware asset inventories",                   "description":"Inventories of hardware managed and maintained.",            "assessment_fields":["patch_days"],                      "weight":10},
    {"id":"ID.AM-02","name":"Software asset inventories",                   "description":"Inventories of software managed and maintained.",            "assessment_fields":["patch_days"],                      "weight":10},
    {"id":"ID.AM-07","name":"Data & service inventories",                   "description":"Inventories of data and services maintained.",               "assessment_fields":["has_irp"],                         "weight":8},
    {"id":"ID.RA-01","name":"Vulnerabilities identified",                   "description":"Vulnerabilities in assets identified and documented.",       "assessment_fields":["vulnerabilities","patch_days"],    "weight":15},
    {"id":"ID.RA-02","name":"Threat intelligence received",                 "description":"Cyber threat intelligence received and analysed.",           "assessment_fields":["vulnerabilities"],                 "weight":10},
    {"id":"ID.RA-05","name":"Threats & vulnerabilities prioritised",        "description":"Threats, vulnerabilities and impacts prioritised.",          "assessment_fields":["vulnerabilities","patch_days"],    "weight":12},
    {"id":"PR.AA-01","name":"Identities & credentials managed",             "description":"Identities and credentials managed for users and devices.", "assessment_fields":["has_mfa","mfa_coverage"],          "weight":12},
    {"id":"PR.AA-03","name":"Users & hardware authenticated",               "description":"Users, services, and hardware authenticated.",              "assessment_fields":["has_mfa","mfa_coverage"],          "weight":15},
    {"id":"PR.AA-05","name":"Access permissions managed",                   "description":"Access permissions and authorisations managed.",             "assessment_fields":["has_mfa","mfa_coverage"],          "weight":15},
    {"id":"PR.AT-01","name":"Users trained on cybersecurity",               "description":"Users informed and trained on security responsibilities.",   "assessment_fields":["training_percent"],                "weight":15},
    {"id":"PR.DS-01","name":"Data-at-rest protected",                       "description":"Data-at-rest protected using appropriate controls.",         "assessment_fields":["has_mfa"],                         "weight":15},
    {"id":"PR.DS-02","name":"Data-in-transit protected",                    "description":"Data-in-transit protected using appropriate controls.",      "assessment_fields":["has_mfa"],                         "weight":15},
    {"id":"PR.DS-11","name":"Backups created & tested",                     "description":"Backups created, protected and tested periodically.",        "assessment_fields":["has_irp"],                         "weight":12},
    {"id":"PR.IR-01","name":"Networks & environments protected",            "description":"Networks and environments protected from unauthorised access.","assessment_fields":["has_mfa","patch_days"],          "weight":12},
    {"id":"PR.IR-04","name":"Adequate resource capacity",                   "description":"Adequate resource capacity maintained for resilience.",      "assessment_fields":["has_irp"],                         "weight":8},
    {"id":"PR.PS-01","name":"Configuration management",                     "description":"Configuration management practices established.",            "assessment_fields":["patch_days"],                      "weight":12},
    {"id":"PR.PS-02","name":"Software maintained & updated",                "description":"Software maintained, replaced and removed appropriately.",   "assessment_fields":["patch_days"],                      "weight":12},
    {"id":"PR.PS-04","name":"Logs generated & reviewed",                    "description":"Logs generated and reviewed for anomalies.",                 "assessment_fields":["vulnerabilities"],                 "weight":12},
    {"id":"DE.AE-02","name":"Adverse events analysed",                      "description":"Potentially adverse events analysed to characterise them.",  "assessment_fields":["vulnerabilities","has_irp"],       "weight":10},
    {"id":"DE.CM-01","name":"Networks monitored",                           "description":"Networks monitored to detect adverse events.",               "assessment_fields":["vulnerabilities","patch_days"],    "weight":12},
    {"id":"DE.CM-09","name":"Hardware & software monitored",                "description":"Computing hardware and software monitored.",                 "assessment_fields":["patch_days","vulnerabilities"],    "weight":10},
    {"id":"RS.MA-01","name":"Incident response plan executed",              "description":"Incident response plan executed when incidents detected.",   "assessment_fields":["has_irp"],                         "weight":15},
    {"id":"RS.MA-02","name":"Incidents categorised & prioritised",          "description":"Incidents categorised and prioritised per response plans.",  "assessment_fields":["has_irp"],                         "weight":12},
    {"id":"RS.CO-02","name":"Stakeholders notified",                        "description":"Internal and external stakeholders notified of incidents.",  "assessment_fields":["has_irp","training_percent"],      "weight":10},
    {"id":"RC.RP-01","name":"Recovery plan executed",                       "description":"Recovery plan executed to restore systems after incident.",  "assessment_fields":["has_irp"],                         "weight":12},
]
FRAMEWORKS: Dict[str, List[Dict[str, Any]]] = {
    "SOC2": SOC2_CONTROLS,
    "ISO27001": ISO27001_CONTROLS,
    "NIST_CSF": NIST_CSF_CONTROLS,
}

def _field_passes(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, bool):
        return value
    if isinstance(value, int):
        return value > 0
    if isinstance(value, str):
        return value.strip().lower() not in ("", "no", "none", "false", "n/a")
    return bool(value)

def score_framework(framework_name: str, assessment_data: Dict[str, Any]) -> Dict[str, Any]:
    controls = FRAMEWORKS.get(framework_name, [])
    if not controls:
        raise ValueError(f"Unknown framework: {framework_name}")
    scored_controls = []
    total_earned = 0.0
    for control in controls:
        passing_fields = []
        failing_fields = []
        for field in control["assessment_fields"]:
            val = assessment_data.get(field)
            if _field_passes(val):
                passing_fields.append(field)
            else:
                failing_fields.append(field)
        total_fields = len(control["assessment_fields"])
        passing_count = len(passing_fields)
        ratio = passing_count / total_fields if total_fields > 0 else 0.0
        earned = round(control["weight"] * ratio, 2)
        total_earned += earned
        status = "pass" if ratio == 1.0 else "fail" if ratio == 0.0 else "partial"
        scored_controls.append({"id": control["id"], "name": control["name"], "description": control["description"], "status": status, "passing_fields": passing_fields, "failing_fields": failing_fields, "weight": control["weight"], "earned": earned})
    return {"framework": framework_name, "score": round(total_earned, 2), "controls": scored_controls}

def score_all_frameworks(assessment_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    return [score_framework(name, assessment_data) for name in FRAMEWORKS]

def build_assessment_dict(assessment) -> Dict[str, Any]:
    """Map Assessment model fields to compliance field names."""
    a = assessment
    def g(field, default=None):
        return getattr(a, field, default)
    return {
        "mfa_enabled": g("has_mfa", False),
        "access_control_policy": "yes" if (g("mfa_coverage", 0) or 0) >= 50 else None,
        "privileged_access_management": "yes" if (g("mfa_coverage", 0) or 0) >= 80 else None,
        "segregation_of_duties": False,
        "patch_management": "yes" if (g("patch_days", 99) or 99) <= 30 else None,
        "malware_protection": False,
        "change_management_process": "yes" if (g("patch_days", 99) or 99) <= 14 else None,
        "monitoring_tools": False,
        "siem_enabled": False,
        "audit_logging": True if (g("vuln_critical", 99) or 99) == 0 else False,
        "vulnerability_scanning": "yes" if (g("vulnerabilities", 0) or 0) > 0 else None,
        "incident_response_plan": g("has_irp", False),
        "incident_reporting_process": "yes" if g("has_irp", False) else None,
        "business_continuity_plan": False,
        "disaster_recovery": False,
        "backup_strategy": False,
        "data_encryption": False,
        "data_classification": False,
        "data_retention_policy": False,
        "encryption_key_management": False,
        "security_awareness_training": True if (g("training_percent", 0) or 0) >= 70 else False,
        "phishing_simulation": True if (g("training_percent", 0) or 0) >= 85 else False,
        "security_policy_document": False,
        "policy_review_cycle": False,
        "security_roles_defined": False,
        "privacy_policy": False,
        "asset_inventory": False,
        "risk_assessment_process": False,
        "data_validation": False,
    }
