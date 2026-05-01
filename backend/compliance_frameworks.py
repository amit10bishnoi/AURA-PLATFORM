from typing import Dict, List, Any

SOC2_CONTROLS: List[Dict[str, Any]] = [
    {"id": "CC6.1", "name": "Logical and Physical Access Controls", "description": "The entity implements logical access security measures to protect against threats from sources outside its system boundaries.", "assessment_fields": ["mfa_enabled", "access_control_policy"], "weight": 15},
    {"id": "CC7.1", "name": "System Monitoring", "description": "The entity uses detection and monitoring procedures to identify changes to configurations or the environment.", "assessment_fields": ["monitoring_tools", "siem_enabled"], "weight": 10},
    {"id": "CC8.1", "name": "Change Management", "description": "The entity authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes.", "assessment_fields": ["change_management_process", "patch_management"], "weight": 10},
    {"id": "CC9.1", "name": "Risk Mitigation", "description": "The entity identifies, selects, and develops risk mitigation activities for risks arising from potential business disruptions.", "assessment_fields": ["incident_response_plan", "business_continuity_plan"], "weight": 15},
    {"id": "A1.1", "name": "Availability", "description": "The entity maintains, monitors, and evaluates current processing capacity and use of system components.", "assessment_fields": ["backup_strategy", "disaster_recovery"], "weight": 10},
    {"id": "PI1.1", "name": "Processing Integrity", "description": "System processing is complete, valid, accurate, timely, and authorized.", "assessment_fields": ["data_validation", "audit_logging"], "weight": 10},
    {"id": "C1.1", "name": "Confidentiality", "description": "Information designated as confidential is protected during the system processing phase.", "assessment_fields": ["data_encryption", "data_classification"], "weight": 15},
    {"id": "P1.1", "name": "Privacy", "description": "The entity provides notice to data subjects about its privacy practices.", "assessment_fields": ["privacy_policy", "data_retention_policy"], "weight": 15},
]

ISO27001_CONTROLS: List[Dict[str, Any]] = [
    {"id": "A.5", "name": "Information Security Policies", "description": "Management direction and support for information security in accordance with business requirements.", "assessment_fields": ["security_policy_document", "policy_review_cycle"], "weight": 10},
    {"id": "A.6", "name": "Organization of Information Security", "description": "Establishing a management framework to initiate and control the implementation of information security.", "assessment_fields": ["security_roles_defined", "segregation_of_duties"], "weight": 10},
    {"id": "A.8", "name": "Asset Management", "description": "Identifying organizational assets and defining appropriate protection responsibilities.", "assessment_fields": ["asset_inventory", "data_classification"], "weight": 10},
    {"id": "A.9", "name": "Access Control", "description": "Limiting access to information and information processing facilities.", "assessment_fields": ["mfa_enabled", "access_control_policy", "privileged_access_management"], "weight": 15},
    {"id": "A.10", "name": "Cryptography", "description": "Ensuring proper and effective use of cryptography to protect confidentiality, authenticity, and integrity.", "assessment_fields": ["data_encryption", "encryption_key_management"], "weight": 10},
    {"id": "A.12", "name": "Operations Security", "description": "Ensuring correct and secure operations of information processing facilities.", "assessment_fields": ["patch_management", "malware_protection", "audit_logging"], "weight": 15},
    {"id": "A.16", "name": "Information Security Incident Management", "description": "Ensuring a consistent and effective approach to the management of information security incidents.", "assessment_fields": ["incident_response_plan", "incident_reporting_process"], "weight": 15},
    {"id": "A.17", "name": "Business Continuity Management", "description": "Business continuity management should be embedded in the organization's processes and structures.", "assessment_fields": ["business_continuity_plan", "disaster_recovery", "backup_strategy"], "weight": 15},
]

NIST_CSF_CONTROLS: List[Dict[str, Any]] = [
    {"id": "ID.AM", "name": "Asset Management (Identify)", "description": "The data, personnel, devices, systems, and facilities that enable the organization to achieve business purposes are identified.", "assessment_fields": ["asset_inventory", "data_classification"], "weight": 10},
    {"id": "ID.RA", "name": "Risk Assessment (Identify)", "description": "The organization understands the cybersecurity risk to organizational operations, assets, and individuals.", "assessment_fields": ["risk_assessment_process", "vulnerability_scanning"], "weight": 10},
    {"id": "PR.AC", "name": "Identity Management & Access Control (Protect)", "description": "Access to physical and logical assets is limited to authorized users and managed consistently.", "assessment_fields": ["mfa_enabled", "access_control_policy", "privileged_access_management"], "weight": 15},
    {"id": "PR.AT", "name": "Awareness and Training (Protect)", "description": "The organization's personnel and partners are provided cybersecurity awareness education.", "assessment_fields": ["security_awareness_training", "phishing_simulation"], "weight": 10},
    {"id": "PR.DS", "name": "Data Security (Protect)", "description": "Information and records are managed consistent with the organization's risk strategy.", "assessment_fields": ["data_encryption", "data_retention_policy", "backup_strategy"], "weight": 15},
    {"id": "DE.CM", "name": "Security Continuous Monitoring (Detect)", "description": "The information system and assets are monitored at discrete intervals to identify cybersecurity events.", "assessment_fields": ["monitoring_tools", "siem_enabled", "audit_logging"], "weight": 15},
    {"id": "RS.RP", "name": "Response Planning (Respond)", "description": "Response processes and procedures are executed and maintained to ensure timely response.", "assessment_fields": ["incident_response_plan", "incident_reporting_process"], "weight": 15},
    {"id": "RC.RP", "name": "Recovery Planning (Recover)", "description": "Recovery processes and procedures are executed and maintained to ensure restoration of systems.", "assessment_fields": ["disaster_recovery", "business_continuity_plan"], "weight": 10},
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
    return {
        "mfa_enabled": getattr(assessment, "mfa_enabled", False),
        "access_control_policy": getattr(assessment, "access_control_policy", None),
        "privileged_access_management": getattr(assessment, "privileged_access_management", None),
        "segregation_of_duties": getattr(assessment, "segregation_of_duties", False),
        "patch_management": getattr(assessment, "patch_management", None),
        "malware_protection": getattr(assessment, "malware_protection", None),
        "change_management_process": getattr(assessment, "change_management_process", None),
        "monitoring_tools": getattr(assessment, "monitoring_tools", None),
        "siem_enabled": getattr(assessment, "siem_enabled", False),
        "audit_logging": getattr(assessment, "audit_logging", False),
        "vulnerability_scanning": getattr(assessment, "vulnerability_scanning", None),
        "incident_response_plan": getattr(assessment, "incident_response_plan", False),
        "incident_reporting_process": getattr(assessment, "incident_reporting_process", None),
        "business_continuity_plan": getattr(assessment, "business_continuity_plan", False),
        "disaster_recovery": getattr(assessment, "disaster_recovery", None),
        "backup_strategy": getattr(assessment, "backup_strategy", None),
        "data_encryption": getattr(assessment, "data_encryption", False),
        "data_classification": getattr(assessment, "data_classification", None),
        "data_retention_policy": getattr(assessment, "data_retention_policy", None),
        "encryption_key_management": getattr(assessment, "encryption_key_management", None),
        "security_awareness_training": getattr(assessment, "security_awareness_training", False),
        "phishing_simulation": getattr(assessment, "phishing_simulation", False),
        "security_policy_document": getattr(assessment, "security_policy_document", None),
        "policy_review_cycle": getattr(assessment, "policy_review_cycle", None),
        "security_roles_defined": getattr(assessment, "security_roles_defined", False),
        "privacy_policy": getattr(assessment, "privacy_policy", None),
        "asset_inventory": getattr(assessment, "asset_inventory", None),
        "risk_assessment_process": getattr(assessment, "risk_assessment_process", None),
        "data_validation": getattr(assessment, "data_validation", False),
    }
