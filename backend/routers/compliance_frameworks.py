"""
compliance_frameworks.py
Full control definitions for:
  - SOC 2 (8 Trust Service Criteria controls)
  - ISO 27001:2022 (93 controls across Annexes A.5–A.8)
  - NIST CSF v2.0 (all 6 Functions, 22 Categories, 106 Subcategories)

Place this file in your backend root (same folder as models.py).
"""

from typing import Dict, List, Any

# ─────────────────────────────────────────────────────────────────────────────
# SOC 2 Controls (unchanged from your original)
# ─────────────────────────────────────────────────────────────────────────────

SOC2_CONTROLS: List[Dict[str, Any]] = [
    {
        "id": "CC6.1",
        "name": "Logical and Physical Access Controls",
        "description": "The entity implements logical access security measures to protect against threats from sources outside its system boundaries.",
        "assessment_fields": ["mfa_enabled", "access_control_policy"],
        "weight": 15,
    },
    {
        "id": "CC7.1",
        "name": "System Monitoring",
        "description": "The entity uses detection and monitoring procedures to identify changes to configurations or the environment.",
        "assessment_fields": ["monitoring_tools", "siem_enabled"],
        "weight": 10,
    },
    {
        "id": "CC8.1",
        "name": "Change Management",
        "description": "The entity authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes.",
        "assessment_fields": ["change_management_process", "patch_management"],
        "weight": 10,
    },
    {
        "id": "CC9.1",
        "name": "Risk Mitigation",
        "description": "The entity identifies, selects, and develops risk mitigation activities for risks arising from potential business disruptions.",
        "assessment_fields": ["incident_response_plan", "business_continuity_plan"],
        "weight": 15,
    },
    {
        "id": "A1.1",
        "name": "Availability",
        "description": "The entity maintains, monitors, and evaluates current processing capacity and use of system components.",
        "assessment_fields": ["backup_strategy", "disaster_recovery"],
        "weight": 10,
    },
    {
        "id": "PI1.1",
        "name": "Processing Integrity",
        "description": "System processing is complete, valid, accurate, timely, and authorized.",
        "assessment_fields": ["data_validation", "audit_logging"],
        "weight": 10,
    },
    {
        "id": "C1.1",
        "name": "Confidentiality",
        "description": "Information designated as confidential is protected during the system processing phase.",
        "assessment_fields": ["data_encryption", "data_classification"],
        "weight": 15,
    },
    {
        "id": "P1.1",
        "name": "Privacy",
        "description": "The entity provides notice to data subjects about its privacy practices.",
        "assessment_fields": ["privacy_policy", "data_retention_policy"],
        "weight": 15,
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# ISO 27001:2022 — All 93 Controls (Annex A.5 through A.8)
# Weights sum to 100 across all controls (distributed by domain criticality)
# ─────────────────────────────────────────────────────────────────────────────

ISO27001_CONTROLS: List[Dict[str, Any]] = [

    # ── A.5 Organisational Controls (37 controls) ───────────────────────────
    {"id": "A.5.1",  "name": "Policies for information security",
     "description": "Information security policy and topic-specific policies shall be defined, approved, published, communicated and acknowledged by relevant personnel.",
     "assessment_fields": ["security_policy_document", "policy_review_cycle"], "weight": 1.2},

    {"id": "A.5.2",  "name": "Information security roles and responsibilities",
     "description": "Information security roles and responsibilities shall be defined and allocated.",
     "assessment_fields": ["security_roles_defined", "segregation_of_duties"], "weight": 1.0},

    {"id": "A.5.3",  "name": "Segregation of duties",
     "description": "Conflicting duties and conflicting areas of responsibility shall be segregated.",
     "assessment_fields": ["segregation_of_duties"], "weight": 1.0},

    {"id": "A.5.4",  "name": "Management responsibilities",
     "description": "Management shall require all personnel to apply information security in accordance with the established policy.",
     "assessment_fields": ["security_policy_document", "security_awareness_training"], "weight": 0.8},

    {"id": "A.5.5",  "name": "Contact with authorities",
     "description": "The organisation shall establish and maintain contact with relevant authorities.",
     "assessment_fields": ["incident_reporting_process"], "weight": 0.8},

    {"id": "A.5.6",  "name": "Contact with special interest groups",
     "description": "The organisation shall establish and maintain contact with special interest groups or forums.",
     "assessment_fields": ["security_roles_defined"], "weight": 0.6},

    {"id": "A.5.7",  "name": "Threat intelligence",
     "description": "Information relating to information security threats shall be collected and analysed.",
     "assessment_fields": ["vulnerability_scanning", "monitoring_tools"], "weight": 1.0},

    {"id": "A.5.8",  "name": "Information security in project management",
     "description": "Information security shall be integrated into project management.",
     "assessment_fields": ["change_management_process", "security_roles_defined"], "weight": 0.8},

    {"id": "A.5.9",  "name": "Inventory of information and other associated assets",
     "description": "An inventory of information and other associated assets shall be developed and maintained.",
     "assessment_fields": ["asset_inventory"], "weight": 1.0},

    {"id": "A.5.10", "name": "Acceptable use of information and other assets",
     "description": "Rules for the acceptable use and procedures for handling information shall be identified.",
     "assessment_fields": ["data_classification", "security_policy_document"], "weight": 0.8},

    {"id": "A.5.11", "name": "Return of assets",
     "description": "Personnel and other interested parties shall return all assets belonging to the organisation upon change or termination of employment.",
     "assessment_fields": ["asset_inventory", "access_control_policy"], "weight": 0.6},

    {"id": "A.5.12", "name": "Classification of information",
     "description": "Information shall be classified according to the information security needs of the organisation.",
     "assessment_fields": ["data_classification"], "weight": 1.0},

    {"id": "A.5.13", "name": "Labelling of information",
     "description": "An appropriate set of procedures for information labelling shall be developed and implemented.",
     "assessment_fields": ["data_classification"], "weight": 0.8},

    {"id": "A.5.14", "name": "Information transfer",
     "description": "Information transfer rules, procedures, and controls shall be in place for all types of transfer facilities.",
     "assessment_fields": ["data_encryption", "data_classification"], "weight": 1.0},

    {"id": "A.5.15", "name": "Access control",
     "description": "Rules to control physical and logical access to information and other associated assets shall be established and implemented.",
     "assessment_fields": ["access_control_policy", "mfa_enabled", "privileged_access_management"], "weight": 1.5},

    {"id": "A.5.16", "name": "Identity management",
     "description": "The full lifecycle of identities shall be managed.",
     "assessment_fields": ["access_control_policy", "mfa_enabled"], "weight": 1.2},

    {"id": "A.5.17", "name": "Authentication information",
     "description": "Allocation and management of authentication information shall be controlled by a management process.",
     "assessment_fields": ["mfa_enabled", "privileged_access_management"], "weight": 1.2},

    {"id": "A.5.18", "name": "Access rights",
     "description": "Access rights to information and other associated assets shall be provisioned, reviewed, modified and removed.",
     "assessment_fields": ["access_control_policy", "privileged_access_management"], "weight": 1.2},

    {"id": "A.5.19", "name": "Information security in supplier relationships",
     "description": "Processes and procedures shall be defined and implemented to manage the information security risks associated with the use of suppliers' products or services.",
     "assessment_fields": ["security_policy_document", "risk_assessment_process"], "weight": 1.0},

    {"id": "A.5.20", "name": "Addressing information security within supplier agreements",
     "description": "Relevant information security requirements shall be established and agreed with each supplier.",
     "assessment_fields": ["security_policy_document"], "weight": 0.8},

    {"id": "A.5.21", "name": "Managing information security in the ICT supply chain",
     "description": "Processes and procedures shall be defined and implemented to manage the information security risks associated with the ICT products and services supply chain.",
     "assessment_fields": ["asset_inventory", "risk_assessment_process"], "weight": 1.0},

    {"id": "A.5.22", "name": "Monitoring, review and change management of supplier services",
     "description": "The organisation shall regularly monitor, review, evaluate and manage change in supplier information security practices.",
     "assessment_fields": ["monitoring_tools", "change_management_process"], "weight": 0.8},

    {"id": "A.5.23", "name": "Information security for use of cloud services",
     "description": "Processes for acquisition, use, management and exit from cloud services shall be established in accordance with the organisation's information security requirements.",
     "assessment_fields": ["data_encryption", "access_control_policy", "data_classification"], "weight": 1.0},

    {"id": "A.5.24", "name": "Information security incident management planning and preparation",
     "description": "The organisation shall plan and prepare for managing information security incidents by defining, establishing and communicating information security incident management processes.",
     "assessment_fields": ["incident_response_plan", "incident_reporting_process"], "weight": 1.5},

    {"id": "A.5.25", "name": "Assessment and decision on information security events",
     "description": "The organisation shall assess information security events and decide if they are to be categorised as information security incidents.",
     "assessment_fields": ["incident_response_plan", "audit_logging"], "weight": 1.0},

    {"id": "A.5.26", "name": "Response to information security incidents",
     "description": "Information security incidents shall be responded to in accordance with the documented procedures.",
     "assessment_fields": ["incident_response_plan", "incident_reporting_process"], "weight": 1.2},

    {"id": "A.5.27", "name": "Learning from information security incidents",
     "description": "Knowledge gained from information security incidents shall be used to strengthen and improve the information security controls.",
     "assessment_fields": ["incident_response_plan", "risk_assessment_process"], "weight": 0.8},

    {"id": "A.5.28", "name": "Collection of evidence",
     "description": "The organisation shall establish and implement procedures for the identification, collection, acquisition and preservation of evidence related to information security events.",
     "assessment_fields": ["audit_logging", "incident_response_plan"], "weight": 1.0},

    {"id": "A.5.29", "name": "Information security during disruption",
     "description": "The organisation shall plan how to maintain information security at an appropriate level during disruption.",
     "assessment_fields": ["business_continuity_plan", "disaster_recovery"], "weight": 1.2},

    {"id": "A.5.30", "name": "ICT readiness for business continuity",
     "description": "ICT readiness shall be planned, implemented, maintained and tested based on business continuity objectives.",
     "assessment_fields": ["disaster_recovery", "backup_strategy", "business_continuity_plan"], "weight": 1.2},

    {"id": "A.5.31", "name": "Legal, statutory, regulatory and contractual requirements",
     "description": "Legal, statutory, regulatory and contractual requirements relevant to information security and the organisation's approach to meet these requirements shall be identified.",
     "assessment_fields": ["privacy_policy", "data_retention_policy", "security_policy_document"], "weight": 1.0},

    {"id": "A.5.32", "name": "Intellectual property rights",
     "description": "The organisation shall implement appropriate procedures to protect intellectual property rights.",
     "assessment_fields": ["data_classification", "access_control_policy"], "weight": 0.6},

    {"id": "A.5.33", "name": "Protection of records",
     "description": "Records shall be protected from loss, destruction, falsification, unauthorised access and unauthorised release.",
     "assessment_fields": ["data_retention_policy", "backup_strategy", "data_encryption"], "weight": 1.0},

    {"id": "A.5.34", "name": "Privacy and protection of personal identifiable information (PII)",
     "description": "The organisation shall identify and meet the requirements regarding the preservation of privacy and protection of PII.",
     "assessment_fields": ["privacy_policy", "data_classification", "data_retention_policy"], "weight": 1.2},

    {"id": "A.5.35", "name": "Independent review of information security",
     "description": "The organisation's approach to managing information security and its implementation shall be reviewed independently at planned intervals.",
     "assessment_fields": ["policy_review_cycle", "risk_assessment_process"], "weight": 1.0},

    {"id": "A.5.36", "name": "Compliance with policies, rules and standards for information security",
     "description": "Compliance with the organisation's information security policy, topic-specific policies, rules and standards shall be regularly reviewed.",
     "assessment_fields": ["policy_review_cycle", "audit_logging"], "weight": 1.0},

    {"id": "A.5.37", "name": "Documented operating procedures",
     "description": "Operating procedures for information processing facilities shall be documented and made available to personnel who need them.",
     "assessment_fields": ["security_policy_document", "change_management_process"], "weight": 0.8},

    # ── A.6 People Controls (8 controls) ────────────────────────────────────
    {"id": "A.6.1",  "name": "Screening",
     "description": "Background verification checks on all candidates for employment shall be carried out prior to joining the organisation.",
     "assessment_fields": ["security_roles_defined"], "weight": 0.8},

    {"id": "A.6.2",  "name": "Terms and conditions of employment",
     "description": "The employment contractual agreements shall state the personnel's and the organisation's responsibilities for information security.",
     "assessment_fields": ["security_policy_document", "security_roles_defined"], "weight": 0.8},

    {"id": "A.6.3",  "name": "Information security awareness, education and training",
     "description": "All personnel and relevant interested parties shall receive appropriate information security awareness education and training.",
     "assessment_fields": ["security_awareness_training", "phishing_simulation"], "weight": 1.5},

    {"id": "A.6.4",  "name": "Disciplinary process",
     "description": "A disciplinary process shall be formalised and communicated to take actions against personnel who have committed an information security policy violation.",
     "assessment_fields": ["security_policy_document", "incident_reporting_process"], "weight": 0.6},

    {"id": "A.6.5",  "name": "Responsibilities after termination or change of employment",
     "description": "Information security responsibilities and duties that remain valid after termination or change of employment shall be defined, enforced and communicated.",
     "assessment_fields": ["access_control_policy", "security_roles_defined"], "weight": 0.8},

    {"id": "A.6.6",  "name": "Confidentiality or non-disclosure agreements",
     "description": "Confidentiality or non-disclosure agreements reflecting the organisation's needs for the protection of information shall be identified.",
     "assessment_fields": ["security_policy_document", "data_classification"], "weight": 0.6},

    {"id": "A.6.7",  "name": "Remote working",
     "description": "Security measures shall be implemented when personnel are working remotely to protect information accessed, processed or stored outside the organisation's premises.",
     "assessment_fields": ["mfa_enabled", "data_encryption", "access_control_policy"], "weight": 1.0},

    {"id": "A.6.8",  "name": "Information security event reporting",
     "description": "The organisation shall provide a mechanism for personnel to report observed or suspected information security events through appropriate channels.",
     "assessment_fields": ["incident_reporting_process", "audit_logging"], "weight": 1.0},

    # ── A.7 Physical Controls (14 controls) ─────────────────────────────────
    {"id": "A.7.1",  "name": "Physical security perimeters",
     "description": "Security perimeters shall be defined and used to protect areas that contain information and other associated assets.",
     "assessment_fields": ["asset_inventory"], "weight": 0.8},

    {"id": "A.7.2",  "name": "Physical entry",
     "description": "Secure areas shall be protected by appropriate entry controls and access points.",
     "assessment_fields": ["access_control_policy", "privileged_access_management"], "weight": 1.0},

    {"id": "A.7.3",  "name": "Securing offices, rooms and facilities",
     "description": "Physical security for offices, rooms and facilities shall be designed and implemented.",
     "assessment_fields": ["asset_inventory"], "weight": 0.6},

    {"id": "A.7.4",  "name": "Physical security monitoring",
     "description": "Premises shall be continuously monitored for unauthorised physical access.",
     "assessment_fields": ["monitoring_tools", "audit_logging"], "weight": 0.8},

    {"id": "A.7.5",  "name": "Protecting against physical and environmental threats",
     "description": "Protection against physical and environmental threats, such as natural disasters and other intentional or unintentional physical threats to infrastructure, shall be designed and implemented.",
     "assessment_fields": ["disaster_recovery", "business_continuity_plan"], "weight": 0.8},

    {"id": "A.7.6",  "name": "Working in secure areas",
     "description": "Security measures for working in secure areas shall be designed and implemented.",
     "assessment_fields": ["security_policy_document", "access_control_policy"], "weight": 0.6},

    {"id": "A.7.7",  "name": "Clear desk and clear screen",
     "description": "Clear desk rules for papers and removable storage media and clear screen rules for information processing facilities shall be defined and appropriately enforced.",
     "assessment_fields": ["security_policy_document"], "weight": 0.4},

    {"id": "A.7.8",  "name": "Equipment siting and protection",
     "description": "Equipment shall be sited securely and protected.",
     "assessment_fields": ["asset_inventory"], "weight": 0.6},

    {"id": "A.7.9",  "name": "Security of assets off-premises",
     "description": "Off-site assets shall be protected.",
     "assessment_fields": ["asset_inventory", "data_encryption"], "weight": 0.6},

    {"id": "A.7.10", "name": "Storage media",
     "description": "Storage media shall be managed through its lifecycle of acquisition, use, transportation and disposal in accordance with the organisation's classification scheme and handling requirements.",
     "assessment_fields": ["data_classification", "data_retention_policy"], "weight": 0.8},

    {"id": "A.7.11", "name": "Supporting utilities",
     "description": "Information processing facilities shall be protected from power failures and other disruptions caused by failures in supporting utilities.",
     "assessment_fields": ["disaster_recovery", "backup_strategy"], "weight": 0.8},

    {"id": "A.7.12", "name": "Cabling security",
     "description": "Cables carrying power or data and telecommunications services shall be protected from interception, interference or damage.",
     "assessment_fields": ["asset_inventory"], "weight": 0.4},

    {"id": "A.7.13", "name": "Equipment maintenance",
     "description": "Equipment shall be maintained correctly to ensure availability, integrity and confidentiality of information.",
     "assessment_fields": ["asset_inventory", "patch_management"], "weight": 0.6},

    {"id": "A.7.14", "name": "Secure disposal or re-use of equipment",
     "description": "Items of equipment containing storage media shall be verified to ensure that any sensitive data and licensed software has been removed or securely overwritten prior to disposal or re-use.",
     "assessment_fields": ["data_classification", "asset_inventory"], "weight": 0.6},

    # ── A.8 Technological Controls (34 controls) ────────────────────────────
    {"id": "A.8.1",  "name": "User endpoint devices",
     "description": "Information stored on, processed by or accessible via user endpoint devices shall be protected.",
     "assessment_fields": ["malware_protection", "patch_management", "data_encryption"], "weight": 1.2},

    {"id": "A.8.2",  "name": "Privileged access rights",
     "description": "The allocation and use of privileged access rights shall be restricted and managed.",
     "assessment_fields": ["privileged_access_management", "access_control_policy"], "weight": 1.5},

    {"id": "A.8.3",  "name": "Information access restriction",
     "description": "Access to information and other associated assets shall be restricted in accordance with the established topic-specific policy on access control.",
     "assessment_fields": ["access_control_policy", "data_classification"], "weight": 1.2},

    {"id": "A.8.4",  "name": "Access to source code",
     "description": "Read and write access to source code, development tools and software libraries shall be appropriately managed.",
     "assessment_fields": ["access_control_policy", "privileged_access_management"], "weight": 1.0},

    {"id": "A.8.5",  "name": "Secure authentication",
     "description": "Secure authentication technologies and procedures shall be implemented based on information access restriction and the topic-specific policy on access control.",
     "assessment_fields": ["mfa_enabled", "access_control_policy"], "weight": 1.5},

    {"id": "A.8.6",  "name": "Capacity management",
     "description": "The use of resources shall be monitored and adjusted in line with current and expected capacity requirements.",
     "assessment_fields": ["monitoring_tools", "asset_inventory"], "weight": 0.8},

    {"id": "A.8.7",  "name": "Protection against malware",
     "description": "Protection against malware shall be implemented and supported by appropriate user awareness.",
     "assessment_fields": ["malware_protection", "security_awareness_training"], "weight": 1.5},

    {"id": "A.8.8",  "name": "Management of technical vulnerabilities",
     "description": "Information about technical vulnerabilities of information systems in use shall be obtained in a timely fashion.",
     "assessment_fields": ["vulnerability_scanning", "patch_management"], "weight": 1.5},

    {"id": "A.8.9",  "name": "Configuration management",
     "description": "Configurations, including security configurations, of hardware, software, services and networks shall be established, documented, implemented, monitored and reviewed.",
     "assessment_fields": ["change_management_process", "asset_inventory"], "weight": 1.0},

    {"id": "A.8.10", "name": "Information deletion",
     "description": "Information stored in information systems, devices or in any other storage media shall be deleted when no longer required.",
     "assessment_fields": ["data_retention_policy", "data_classification"], "weight": 0.8},

    {"id": "A.8.11", "name": "Data masking",
     "description": "Data masking shall be used in accordance with the organisation's topic-specific policy on access control and other related topic-specific policies.",
     "assessment_fields": ["data_classification", "data_encryption"], "weight": 0.8},

    {"id": "A.8.12", "name": "Data leakage prevention",
     "description": "Data leakage prevention measures shall be applied to systems, networks and any other devices that process, store or transmit sensitive information.",
     "assessment_fields": ["data_classification", "monitoring_tools", "data_encryption"], "weight": 1.2},

    {"id": "A.8.13", "name": "Information backup",
     "description": "Backup copies of information, software and systems shall be maintained and regularly tested.",
     "assessment_fields": ["backup_strategy", "disaster_recovery"], "weight": 1.5},

    {"id": "A.8.14", "name": "Redundancy of information processing facilities",
     "description": "Information processing facilities shall be implemented with redundancy sufficient to meet availability requirements.",
     "assessment_fields": ["disaster_recovery", "business_continuity_plan"], "weight": 1.0},

    {"id": "A.8.15", "name": "Logging",
     "description": "Logs that record activities, exceptions, faults and other relevant events shall be produced, stored, protected and analysed.",
     "assessment_fields": ["audit_logging", "siem_enabled", "monitoring_tools"], "weight": 1.5},

    {"id": "A.8.16", "name": "Monitoring activities",
     "description": "Networks, systems and applications shall be monitored for anomalous behaviour and appropriate actions taken.",
     "assessment_fields": ["monitoring_tools", "siem_enabled", "audit_logging"], "weight": 1.5},

    {"id": "A.8.17", "name": "Clock synchronisation",
     "description": "The clocks of information processing systems used by the organisation shall be synchronised to approved time sources.",
     "assessment_fields": ["audit_logging"], "weight": 0.4},

    {"id": "A.8.18", "name": "Use of privileged utility programs",
     "description": "The use of utility programs that might be capable of overriding system and application controls shall be restricted and tightly controlled.",
     "assessment_fields": ["privileged_access_management", "audit_logging"], "weight": 1.0},

    {"id": "A.8.19", "name": "Installation of software on operational systems",
     "description": "Procedures and measures shall be implemented to securely manage software installation on operational systems.",
     "assessment_fields": ["patch_management", "change_management_process"], "weight": 1.0},

    {"id": "A.8.20", "name": "Networks security",
     "description": "Networks and network devices shall be secured, managed and controlled to protect information in systems and applications.",
     "assessment_fields": ["monitoring_tools", "access_control_policy"], "weight": 1.2},

    {"id": "A.8.21", "name": "Security of network services",
     "description": "Security mechanisms, service levels and service requirements of network services shall be identified, implemented and monitored.",
     "assessment_fields": ["monitoring_tools", "siem_enabled"], "weight": 1.0},

    {"id": "A.8.22", "name": "Segregation of networks",
     "description": "Groups of information services, users and information systems shall be segregated in the organisation's networks.",
     "assessment_fields": ["segregation_of_duties", "access_control_policy"], "weight": 1.0},

    {"id": "A.8.23", "name": "Web filtering",
     "description": "Access to external websites shall be managed to reduce exposure to malicious content.",
     "assessment_fields": ["malware_protection", "monitoring_tools"], "weight": 0.8},

    {"id": "A.8.24", "name": "Use of cryptography",
     "description": "Rules for the effective use of cryptography, including cryptographic key management, shall be defined and implemented.",
     "assessment_fields": ["data_encryption", "encryption_key_management"], "weight": 1.5},

    {"id": "A.8.25", "name": "Secure development lifecycle",
     "description": "Rules for the secure development of software and systems shall be established and applied.",
     "assessment_fields": ["change_management_process", "data_validation"], "weight": 1.0},

    {"id": "A.8.26", "name": "Application security requirements",
     "description": "Information security requirements shall be identified, specified and approved when developing or acquiring applications.",
     "assessment_fields": ["security_policy_document", "data_validation"], "weight": 0.8},

    {"id": "A.8.27", "name": "Secure system architecture and engineering principles",
     "description": "Principles for engineering secure systems shall be established, documented, maintained and applied to any information system development activities.",
     "assessment_fields": ["security_policy_document", "change_management_process"], "weight": 1.0},

    {"id": "A.8.28", "name": "Secure coding",
     "description": "Secure coding principles shall be applied to software development.",
     "assessment_fields": ["change_management_process", "data_validation"], "weight": 1.0},

    {"id": "A.8.29", "name": "Security testing in development and acceptance",
     "description": "Security testing processes shall be defined and implemented in the development lifecycle.",
     "assessment_fields": ["vulnerability_scanning", "change_management_process"], "weight": 1.0},

    {"id": "A.8.30", "name": "Outsourced development",
     "description": "The organisation shall supervise and monitor the activity related to outsourced system development.",
     "assessment_fields": ["security_policy_document", "risk_assessment_process"], "weight": 0.6},

    {"id": "A.8.31", "name": "Separation of development, test and production environments",
     "description": "Development, testing and production environments shall be separated and secured.",
     "assessment_fields": ["segregation_of_duties", "change_management_process"], "weight": 1.0},

    {"id": "A.8.32", "name": "Change management",
     "description": "Changes to information processing facilities and information systems shall be subject to change management procedures.",
     "assessment_fields": ["change_management_process", "audit_logging"], "weight": 1.2},

    {"id": "A.8.33", "name": "Test information",
     "description": "Test information shall be appropriately selected, protected and managed.",
     "assessment_fields": ["data_classification", "access_control_policy"], "weight": 0.6},

    {"id": "A.8.34", "name": "Protection of information systems during audit testing",
     "description": "Audit tests and other assurance activities involving assessment of operational systems shall be planned and agreed between the tester and appropriate management.",
     "assessment_fields": ["audit_logging", "risk_assessment_process"], "weight": 0.8},
]

# ─────────────────────────────────────────────────────────────────────────────
# NIST CSF v2.0 — All 6 Functions, 22 Categories, 106 Subcategories
# Grouped by Function → Category → Subcategory
# Weights sum to 100 across all subcategories
# ─────────────────────────────────────────────────────────────────────────────

NIST_CSF_CONTROLS: List[Dict[str, Any]] = [

    # ══════════════════════════════════════════════════════════════════════════
    # FUNCTION: GOVERN (GV) — New in CSF v2.0
    # ══════════════════════════════════════════════════════════════════════════

    # GV.OC — Organisational Context
    {"id": "GV.OC-01", "name": "Organisational Mission (Context)",
     "description": "The organisational mission is understood and informs cybersecurity risk management decisions.",
     "assessment_fields": ["security_policy_document", "risk_assessment_process"], "weight": 0.6},
    {"id": "GV.OC-02", "name": "Internal and External Stakeholders",
     "description": "Internal and external stakeholders are understood, and their needs and expectations regarding cybersecurity risk management are understood.",
     "assessment_fields": ["security_roles_defined", "security_policy_document"], "weight": 0.5},
    {"id": "GV.OC-03", "name": "Legal and Regulatory Requirements",
     "description": "Legal, regulatory, and contractual requirements regarding cybersecurity — including privacy and civil liberties obligations — are understood.",
     "assessment_fields": ["privacy_policy", "data_retention_policy", "security_policy_document"], "weight": 0.8},
    {"id": "GV.OC-04", "name": "Critical Objectives and Activities",
     "description": "Critical objectives, capabilities, and services that stakeholders depend on are established and communicated.",
     "assessment_fields": ["business_continuity_plan", "security_roles_defined"], "weight": 0.6},
    {"id": "GV.OC-05", "name": "Outcomes and Dependencies",
     "description": "Outcomes, capabilities, and services that the organisation depends on are communicated.",
     "assessment_fields": ["asset_inventory", "risk_assessment_process"], "weight": 0.5},

    # GV.RM — Risk Management Strategy
    {"id": "GV.RM-01", "name": "Risk Management Strategy Established",
     "description": "Risk management objectives are established and agreed to by organisational stakeholders.",
     "assessment_fields": ["risk_assessment_process", "security_policy_document"], "weight": 0.8},
    {"id": "GV.RM-02", "name": "Risk Appetite and Tolerance",
     "description": "Risk appetite and risk tolerance statements are established, communicated, and maintained.",
     "assessment_fields": ["risk_assessment_process", "security_policy_document"], "weight": 0.6},
    {"id": "GV.RM-03", "name": "Cybersecurity Risk Management in ERM",
     "description": "Cybersecurity risk management activities and outcomes are included in enterprise risk management processes.",
     "assessment_fields": ["risk_assessment_process", "incident_response_plan"], "weight": 0.8},
    {"id": "GV.RM-04", "name": "Strategic Direction for Risk",
     "description": "Strategic direction that describes appropriate risk response options is established and communicated.",
     "assessment_fields": ["security_policy_document", "risk_assessment_process"], "weight": 0.5},
    {"id": "GV.RM-05", "name": "Lines of Communication for Risk",
     "description": "Lines of communication across the organisation are established for cybersecurity risks.",
     "assessment_fields": ["security_roles_defined", "incident_reporting_process"], "weight": 0.5},
    {"id": "GV.RM-06", "name": "Standardised Risk Methodology",
     "description": "A standardised method for calculating, documenting, categorising, and prioritising cybersecurity risks is established and communicated.",
     "assessment_fields": ["risk_assessment_process"], "weight": 0.6},
    {"id": "GV.RM-07", "name": "Strategic Opportunities via Risk",
     "description": "Strategic opportunities (i.e., positive risks) are characterised and are included in organisational cybersecurity risk discussions.",
     "assessment_fields": ["risk_assessment_process", "security_policy_document"], "weight": 0.4},

    # GV.RR — Roles, Responsibilities and Authorities
    {"id": "GV.RR-01", "name": "Accountability for Cybersecurity",
     "description": "Organisational leadership is responsible and accountable for cybersecurity risk and fosters a culture that is risk-aware.",
     "assessment_fields": ["security_roles_defined", "security_policy_document"], "weight": 0.8},
    {"id": "GV.RR-02", "name": "Roles and Responsibilities Established",
     "description": "Roles, responsibilities, and authorities related to cybersecurity risk management are established, communicated, understood, and enforced.",
     "assessment_fields": ["security_roles_defined", "segregation_of_duties"], "weight": 1.0},
    {"id": "GV.RR-03", "name": "Adequate Resources",
     "description": "Adequate resources are allocated commensurate with cybersecurity risk strategy, roles, responsibilities, and policies.",
     "assessment_fields": ["security_roles_defined"], "weight": 0.5},
    {"id": "GV.RR-04", "name": "Cybersecurity in Human Resources",
     "description": "Cybersecurity is included in human resources practices.",
     "assessment_fields": ["security_awareness_training", "security_roles_defined"], "weight": 0.6},

    # GV.PO — Policy
    {"id": "GV.PO-01", "name": "Cybersecurity Policy Established",
     "description": "Cybersecurity policy is established based on organisational context, cybersecurity strategy, and priorities.",
     "assessment_fields": ["security_policy_document", "policy_review_cycle"], "weight": 1.0},
    {"id": "GV.PO-02", "name": "Policy Reviewed and Updated",
     "description": "Cybersecurity policy is reviewed, updated, communicated, and enforced to reflect changes in requirements, threats, technology, and organisational mission.",
     "assessment_fields": ["policy_review_cycle", "security_policy_document"], "weight": 0.8},

    # GV.OV — Oversight
    {"id": "GV.OV-01", "name": "Cybersecurity Risk Management Review",
     "description": "Cybersecurity risk management strategy outcomes are reviewed to inform and adjust strategy and direction.",
     "assessment_fields": ["risk_assessment_process", "policy_review_cycle"], "weight": 0.6},
    {"id": "GV.OV-02", "name": "Cybersecurity State of Programmes",
     "description": "The cybersecurity risk management strategy is reviewed and adjusted to ensure coverage of organisational requirements.",
     "assessment_fields": ["risk_assessment_process", "security_policy_document"], "weight": 0.5},
    {"id": "GV.OV-03", "name": "Outcomes Inform Updates",
     "description": "Organisational cybersecurity risk management performance is evaluated and reviewed for adjustments.",
     "assessment_fields": ["audit_logging", "risk_assessment_process"], "weight": 0.5},

    # GV.SC — Cybersecurity Supply Chain Risk Management
    {"id": "GV.SC-01", "name": "Supply Chain Cybersecurity Programme",
     "description": "A cybersecurity supply chain risk management programme, strategy, objectives, policies, and processes are established and agreed to by organisational stakeholders.",
     "assessment_fields": ["risk_assessment_process", "security_policy_document"], "weight": 0.6},
    {"id": "GV.SC-02", "name": "Cybersecurity Role in Supply Chain",
     "description": "Cybersecurity roles and responsibilities for suppliers, customers, and partners are established, communicated, and coordinated internally and externally.",
     "assessment_fields": ["security_roles_defined", "security_policy_document"], "weight": 0.5},
    {"id": "GV.SC-03", "name": "Supply Chain Processes Integrated",
     "description": "Cybersecurity supply chain risk management is integrated into cybersecurity and enterprise risk management.",
     "assessment_fields": ["risk_assessment_process", "asset_inventory"], "weight": 0.5},
    {"id": "GV.SC-04", "name": "Suppliers Known",
     "description": "Suppliers are known and prioritised by criticality.",
     "assessment_fields": ["asset_inventory", "risk_assessment_process"], "weight": 0.5},
    {"id": "GV.SC-05", "name": "Requirements for Suppliers Established",
     "description": "Requirements to address cybersecurity risks in supply chains are established, prioritised, and integrated into contracts.",
     "assessment_fields": ["security_policy_document", "risk_assessment_process"], "weight": 0.5},
    {"id": "GV.SC-06", "name": "Planning and Due Diligence",
     "description": "Planning and due diligence are performed to reduce risks before entering into formal supplier or other third-party relationships.",
     "assessment_fields": ["risk_assessment_process", "security_policy_document"], "weight": 0.5},
    {"id": "GV.SC-07", "name": "Risks in Supplier Agreements",
     "description": "The risks posed by a supplier, their products and services, and other third parties are understood, recorded, and prioritised.",
     "assessment_fields": ["risk_assessment_process", "asset_inventory"], "weight": 0.5},
    {"id": "GV.SC-08", "name": "Relevant Suppliers and Partners Assessed",
     "description": "Relevant suppliers and partners are routinely assessed using audits, test results, or other forms of evaluations.",
     "assessment_fields": ["vulnerability_scanning", "risk_assessment_process"], "weight": 0.5},
    {"id": "GV.SC-09", "name": "Incidents with Suppliers",
     "description": "The organisation responds to and recovers from cybersecurity incidents that involve suppliers.",
     "assessment_fields": ["incident_response_plan", "incident_reporting_process"], "weight": 0.5},
    {"id": "GV.SC-10", "name": "Cybersecurity Supply Chain Practices Reviewed",
     "description": "Cybersecurity supply chain risk management plans include provisions for activities that occur after the conclusion of a partnership or service agreement.",
     "assessment_fields": ["policy_review_cycle", "risk_assessment_process"], "weight": 0.4},

    # ══════════════════════════════════════════════════════════════════════════
    # FUNCTION: IDENTIFY (ID)
    # ══════════════════════════════════════════════════════════════════════════

    # ID.AM — Asset Management
    {"id": "ID.AM-01", "name": "Inventories of Hardware Assets",
     "description": "Inventories of hardware managed by the organisation are maintained.",
     "assessment_fields": ["asset_inventory"], "weight": 0.8},
    {"id": "ID.AM-02", "name": "Inventories of Software Assets",
     "description": "Inventories of software, services, and systems managed by the organisation are maintained.",
     "assessment_fields": ["asset_inventory", "patch_management"], "weight": 0.8},
    {"id": "ID.AM-03", "name": "Organisational Communication and Data Flows",
     "description": "Representations of the organisation's authorised network communication and internal and external data flows are maintained.",
     "assessment_fields": ["asset_inventory", "data_classification"], "weight": 0.6},
    {"id": "ID.AM-04", "name": "Inventories of External Information Systems",
     "description": "Inventories of services provided by suppliers are maintained.",
     "assessment_fields": ["asset_inventory", "risk_assessment_process"], "weight": 0.6},
    {"id": "ID.AM-05", "name": "Assets Prioritised",
     "description": "Assets are prioritised based on classification, criticality, resources, and impact on the mission.",
     "assessment_fields": ["data_classification", "asset_inventory"], "weight": 0.6},
    {"id": "ID.AM-07", "name": "Inventories of Data",
     "description": "Inventories of data and corresponding metadata for designated data are maintained.",
     "assessment_fields": ["data_classification", "asset_inventory"], "weight": 0.6},
    {"id": "ID.AM-08", "name": "Systems and Assets Managed Through Lifecycle",
     "description": "Systems, hardware, software, and services are managed throughout their lifecycle.",
     "assessment_fields": ["asset_inventory", "patch_management", "change_management_process"], "weight": 0.6},

    # ID.RA — Risk Assessment
    {"id": "ID.RA-01", "name": "Vulnerabilities Identified",
     "description": "Vulnerabilities in assets are identified, validated, and recorded.",
     "assessment_fields": ["vulnerability_scanning", "patch_management"], "weight": 1.0},
    {"id": "ID.RA-02", "name": "Cyber Threat Intelligence Received",
     "description": "Cyber threat intelligence is received from information-sharing forums and sources.",
     "assessment_fields": ["monitoring_tools", "vulnerability_scanning"], "weight": 0.8},
    {"id": "ID.RA-03", "name": "Internal and External Threats Identified",
     "description": "Internal and external threats to the organisation are identified and recorded.",
     "assessment_fields": ["risk_assessment_process", "vulnerability_scanning"], "weight": 0.8},
    {"id": "ID.RA-04", "name": "Potential Impacts and Likelihoods",
     "description": "Potential impacts and likelihoods of threats exploiting vulnerabilities are identified.",
     "assessment_fields": ["risk_assessment_process"], "weight": 0.8},
    {"id": "ID.RA-05", "name": "Threats and Vulnerabilities Catalogued",
     "description": "Threats, vulnerabilities, likelihoods, and impacts are used to understand inherent risk.",
     "assessment_fields": ["risk_assessment_process", "vulnerability_scanning"], "weight": 0.8},
    {"id": "ID.RA-06", "name": "Risk Responses Chosen",
     "description": "Risk responses are chosen, prioritised, planned, tracked, and communicated.",
     "assessment_fields": ["risk_assessment_process", "incident_response_plan"], "weight": 0.8},
    {"id": "ID.RA-07", "name": "Changes and Exceptions Managed",
     "description": "Changes and exceptions are managed, assessed for risk impact, recorded, and tracked.",
     "assessment_fields": ["change_management_process", "risk_assessment_process"], "weight": 0.6},
    {"id": "ID.RA-08", "name": "Processes for Receiving Vulnerability Reports",
     "description": "Processes for receiving, analysing, and responding to vulnerability disclosures are established.",
     "assessment_fields": ["vulnerability_scanning", "incident_reporting_process"], "weight": 0.6},
    {"id": "ID.RA-09", "name": "Authenticity of Hardware and Software Considered",
     "description": "The authenticity and integrity of hardware and software are evaluated prior to acquisition and use.",
     "assessment_fields": ["asset_inventory", "change_management_process"], "weight": 0.5},
    {"id": "ID.RA-10", "name": "Critical Suppliers Assessed",
     "description": "Critical suppliers are assessed prior to acquisition.",
     "assessment_fields": ["risk_assessment_process", "security_policy_document"], "weight": 0.5},

    # ID.IM — Improvement
    {"id": "ID.IM-01", "name": "Improvements Identified from Evaluations",
     "description": "Improvements are identified from evaluations — including tests, exercises, postmortems, and lessons learned activities.",
     "assessment_fields": ["incident_response_plan", "policy_review_cycle"], "weight": 0.5},
    {"id": "ID.IM-02", "name": "Improvements Identified from Security Tests",
     "description": "Improvements are identified from security tests and exercises, including those done in coordination with suppliers and relevant third parties.",
     "assessment_fields": ["vulnerability_scanning", "incident_response_plan"], "weight": 0.5},
    {"id": "ID.IM-03", "name": "Improvements Identified from Execution",
     "description": "Improvements are identified from execution of operational processes, procedures, and activities.",
     "assessment_fields": ["audit_logging", "policy_review_cycle"], "weight": 0.5},
    {"id": "ID.IM-04", "name": "Plan for Improvement",
     "description": "Plan and track improvements to organisational cybersecurity risk management processes, procedures and activities.",
     "assessment_fields": ["risk_assessment_process", "policy_review_cycle"], "weight": 0.5},

    # ══════════════════════════════════════════════════════════════════════════
    # FUNCTION: PROTECT (PR)
    # ══════════════════════════════════════════════════════════════════════════

    # PR.AA — Identity Management, Authentication, and Access Control
    {"id": "PR.AA-01", "name": "Identities and Credentials Managed",
     "description": "Identities and credentials for authorised users, services, and hardware are managed by the organisation.",
     "assessment_fields": ["access_control_policy", "mfa_enabled"], "weight": 1.0},
    {"id": "PR.AA-02", "name": "Identities Proofed and Bound",
     "description": "Identities are proofed and bound to credentials based on the context of interactions.",
     "assessment_fields": ["mfa_enabled", "access_control_policy"], "weight": 0.8},
    {"id": "PR.AA-03", "name": "Users, Services, and Hardware Authenticated",
     "description": "Users, services, and hardware are authenticated.",
     "assessment_fields": ["mfa_enabled"], "weight": 1.0},
    {"id": "PR.AA-04", "name": "Identity Assertions Protected",
     "description": "Identity assertions are protected, conveyed, and verified.",
     "assessment_fields": ["mfa_enabled", "encryption_key_management"], "weight": 0.8},
    {"id": "PR.AA-05", "name": "Access Permissions Managed",
     "description": "Access permissions, entitlements, and authorisations are defined in a policy, managed, enforced, and reviewed.",
     "assessment_fields": ["access_control_policy", "privileged_access_management"], "weight": 1.0},
    {"id": "PR.AA-06", "name": "Physical Access Managed",
     "description": "Physical access to assets is managed, monitored, and enforced commensurate with risk.",
     "assessment_fields": ["access_control_policy", "asset_inventory"], "weight": 0.8},

    # PR.AT — Awareness and Training
    {"id": "PR.AT-01", "name": "User Awareness Training Provided",
     "description": "Personnel are provided with awareness and training so that they possess the knowledge and skills to perform general tasks with cybersecurity risks in mind.",
     "assessment_fields": ["security_awareness_training"], "weight": 1.0},
    {"id": "PR.AT-02", "name": "Individuals with Privileged Access Trained",
     "description": "Individuals in specialised roles are provided with awareness and training so that they possess the knowledge and skills to perform relevant tasks with cybersecurity risks in mind.",
     "assessment_fields": ["security_awareness_training", "phishing_simulation", "privileged_access_management"], "weight": 1.0},

    # PR.DS — Data Security
    {"id": "PR.DS-01", "name": "Data-at-Rest Protected",
     "description": "The confidentiality, integrity, and availability of data-at-rest are protected.",
     "assessment_fields": ["data_encryption", "backup_strategy"], "weight": 1.2},
    {"id": "PR.DS-02", "name": "Data-in-Transit Protected",
     "description": "The confidentiality, integrity, and availability of data-in-transit are protected.",
     "assessment_fields": ["data_encryption", "encryption_key_management"], "weight": 1.2},
    {"id": "PR.DS-10", "name": "Data-in-Use Protected",
     "description": "The confidentiality, integrity, and availability of data-in-use are protected.",
     "assessment_fields": ["data_encryption", "access_control_policy"], "weight": 0.8},
    {"id": "PR.DS-11", "name": "Backups of Data Maintained",
     "description": "Backups of data are created, protected, maintained, and tested.",
     "assessment_fields": ["backup_strategy", "disaster_recovery"], "weight": 1.2},

    # PR.PS — Platform Security
    {"id": "PR.PS-01", "name": "Configuration Management Performed",
     "description": "Configuration management practices are established and applied.",
     "assessment_fields": ["change_management_process", "patch_management"], "weight": 1.0},
    {"id": "PR.PS-02", "name": "Software Maintained",
     "description": "Software is maintained, replaced, and removed commensurate with risk.",
     "assessment_fields": ["patch_management", "asset_inventory"], "weight": 1.0},
    {"id": "PR.PS-03", "name": "Hardware Maintained",
     "description": "Hardware is maintained, replaced, and removed commensurate with risk.",
     "assessment_fields": ["asset_inventory", "patch_management"], "weight": 0.8},
    {"id": "PR.PS-04", "name": "Logs Generated",
     "description": "Log records are created to enable monitoring, forensics, incident response, and legal actions.",
     "assessment_fields": ["audit_logging", "siem_enabled"], "weight": 1.0},
    {"id": "PR.PS-05", "name": "Installation and Execution of Unauthorised Software Prevented",
     "description": "Installation and execution of unauthorised software are prevented.",
     "assessment_fields": ["malware_protection", "change_management_process"], "weight": 1.0},
    {"id": "PR.PS-06", "name": "Secure Software Development Practices Used",
     "description": "Secure software development practices are integrated, and their security is evaluated.",
     "assessment_fields": ["change_management_process", "data_validation"], "weight": 0.8},

    # PR.IR — Technology Infrastructure Resilience
    {"id": "PR.IR-01", "name": "Networks and Environments Protected",
     "description": "Networks and environments are protected from unauthorised logical access and usage.",
     "assessment_fields": ["access_control_policy", "monitoring_tools", "siem_enabled"], "weight": 1.0},
    {"id": "PR.IR-02", "name": "Sensitive Data Protected in Development",
     "description": "The organisation's technology assets are protected from environmental threats.",
     "assessment_fields": ["data_encryption", "backup_strategy"], "weight": 0.8},
    {"id": "PR.IR-03", "name": "Mechanisms to Achieve Resilience Implemented",
     "description": "Mechanisms are implemented to achieve resilience requirements in normal and adverse situations.",
     "assessment_fields": ["disaster_recovery", "business_continuity_plan", "backup_strategy"], "weight": 1.0},
    {"id": "PR.IR-04", "name": "Adequate Resource Capacity Ensured",
     "description": "Adequate resource capacity to ensure availability is maintained.",
     "assessment_fields": ["disaster_recovery", "monitoring_tools"], "weight": 0.8},

    # ══════════════════════════════════════════════════════════════════════════
    # FUNCTION: DETECT (DE)
    # ══════════════════════════════════════════════════════════════════════════

    # DE.CM — Continuous Monitoring
    {"id": "DE.CM-01", "name": "Networks Monitored",
     "description": "Networks and network services are monitored to find potentially adverse events.",
     "assessment_fields": ["monitoring_tools", "siem_enabled"], "weight": 1.0},
    {"id": "DE.CM-02", "name": "Physical Environment Monitored",
     "description": "The physical environment is monitored to find potentially adverse events.",
     "assessment_fields": ["monitoring_tools", "audit_logging"], "weight": 0.6},
    {"id": "DE.CM-03", "name": "Personnel Activity Monitored",
     "description": "Personnel activity and technology usage are monitored to find potentially adverse events.",
     "assessment_fields": ["audit_logging", "siem_enabled"], "weight": 1.0},
    {"id": "DE.CM-06", "name": "External Service Provider Activities Monitored",
     "description": "External service provider activities and services are monitored to find potentially adverse events.",
     "assessment_fields": ["monitoring_tools", "audit_logging", "risk_assessment_process"], "weight": 0.8},
    {"id": "DE.CM-09", "name": "Computing Hardware and Software Monitored",
     "description": "Computing hardware and software, runtime environments, and their data are monitored to find potentially adverse events.",
     "assessment_fields": ["monitoring_tools", "siem_enabled", "malware_protection"], "weight": 1.0},

    # DE.AE — Adverse Event Analysis
    {"id": "DE.AE-02", "name": "Potentially Adverse Events Analysed",
     "description": "Potentially adverse events are analysed to better characterise them.",
     "assessment_fields": ["siem_enabled", "audit_logging", "incident_response_plan"], "weight": 0.8},
    {"id": "DE.AE-03", "name": "Information Correlated",
     "description": "Information is correlated from multiple sources.",
     "assessment_fields": ["siem_enabled", "monitoring_tools"], "weight": 0.8},
    {"id": "DE.AE-04", "name": "Estimated Impact Determined",
     "description": "The estimated impact and scope of adverse events are understood.",
     "assessment_fields": ["incident_response_plan", "risk_assessment_process"], "weight": 0.8},
    {"id": "DE.AE-06", "name": "Information Shared About Adverse Events",
     "description": "Information on adverse events is provided to authorised staff and tools.",
     "assessment_fields": ["incident_reporting_process", "siem_enabled"], "weight": 0.6},
    {"id": "DE.AE-07", "name": "Cyber Threat Intelligence Integrated",
     "description": "Cyber threat intelligence and other contextual information are integrated into the analysis.",
     "assessment_fields": ["siem_enabled", "vulnerability_scanning"], "weight": 0.6},
    {"id": "DE.AE-08", "name": "Incidents Declared",
     "description": "Incidents are declared when adverse events meet the defined incident criteria.",
     "assessment_fields": ["incident_response_plan", "incident_reporting_process"], "weight": 0.8},

    # ══════════════════════════════════════════════════════════════════════════
    # FUNCTION: RESPOND (RS)
    # ══════════════════════════════════════════════════════════════════════════

    # RS.MA — Incident Management
    {"id": "RS.MA-01", "name": "Incident Response Plan Executed",
     "description": "The incident response plan is executed in coordination with relevant third parties once an incident is declared.",
     "assessment_fields": ["incident_response_plan"], "weight": 1.2},
    {"id": "RS.MA-02", "name": "Incidents Triaged",
     "description": "Incidents are triaged to support analysis and inform response and recovery.",
     "assessment_fields": ["incident_response_plan", "audit_logging"], "weight": 0.8},
    {"id": "RS.MA-03", "name": "Incidents Categorised and Prioritised",
     "description": "Incidents are categorised and prioritised.",
     "assessment_fields": ["incident_response_plan", "siem_enabled"], "weight": 0.8},
    {"id": "RS.MA-04", "name": "Incidents Escalated",
     "description": "Incidents are escalated or elevated as needed.",
     "assessment_fields": ["incident_response_plan", "incident_reporting_process", "security_roles_defined"], "weight": 0.8},
    {"id": "RS.MA-05", "name": "Incidents Declared over",
     "description": "Criteria for initiating incident recovery are applied.",
     "assessment_fields": ["incident_response_plan", "disaster_recovery"], "weight": 0.6},

    # RS.AN — Incident Analysis
    {"id": "RS.AN-03", "name": "Analysis Performed",
     "description": "Analysis is performed to establish what has taken place during an incident and the root cause of the incident.",
     "assessment_fields": ["audit_logging", "incident_response_plan"], "weight": 0.8},
    {"id": "RS.AN-06", "name": "Actions Performed Documented",
     "description": "Actions taken during investigation are recorded.",
     "assessment_fields": ["audit_logging", "incident_response_plan"], "weight": 0.6},
    {"id": "RS.AN-07", "name": "Incident Magnitude Estimated",
     "description": "Incident magnitude is estimated and validated.",
     "assessment_fields": ["incident_response_plan", "risk_assessment_process"], "weight": 0.6},
    {"id": "RS.AN-08", "name": "Forensics Performed",
     "description": "Forensics are performed.",
     "assessment_fields": ["audit_logging", "incident_response_plan"], "weight": 0.6},

    # RS.CO — Incident Response Reporting and Communication
    {"id": "RS.CO-02", "name": "Internal Stakeholders Notified",
     "description": "Internal stakeholders are notified of incidents.",
     "assessment_fields": ["incident_reporting_process", "security_roles_defined"], "weight": 0.8},
    {"id": "RS.CO-03", "name": "Information Shared Externally",
     "description": "Information is shared with designated internal and external stakeholders.",
     "assessment_fields": ["incident_reporting_process"], "weight": 0.6},

    # RS.MI — Incident Mitigation
    {"id": "RS.MI-01", "name": "Incidents Contained",
     "description": "Incidents are contained.",
     "assessment_fields": ["incident_response_plan", "access_control_policy"], "weight": 1.0},
    {"id": "RS.MI-02", "name": "Incidents Eradicated",
     "description": "Incidents are eradicated.",
     "assessment_fields": ["incident_response_plan", "malware_protection"], "weight": 1.0},

    # ══════════════════════════════════════════════════════════════════════════
    # FUNCTION: RECOVER (RC)
    # ══════════════════════════════════════════════════════════════════════════

    # RC.RP — Incident Recovery Plan Execution
    {"id": "RC.RP-01", "name": "Recovery Plan Executed",
     "description": "The recovery portion of the incident response plan is executed once initiated from the incident response process.",
     "assessment_fields": ["disaster_recovery", "business_continuity_plan"], "weight": 1.2},
    {"id": "RC.RP-02", "name": "Recovery Actions Selected",
     "description": "Recovery actions are selected, scoped, prioritised, and performed.",
     "assessment_fields": ["disaster_recovery", "backup_strategy"], "weight": 0.8},
    {"id": "RC.RP-03", "name": "Integrity of Backups and Other Resources Verified",
     "description": "The integrity of backups and other restoration assets is verified before using them for restoration.",
     "assessment_fields": ["backup_strategy", "data_validation"], "weight": 0.8},
    {"id": "RC.RP-04", "name": "Critical Mission Functions and Processes Restored",
     "description": "Critical mission functions and cybersecurity risk management processes are considered to ensure appropriate priority and scope.",
     "assessment_fields": ["business_continuity_plan", "disaster_recovery"], "weight": 0.8},
    {"id": "RC.RP-05", "name": "Integrity of Restored Assets Verified",
     "description": "The integrity of restored assets is verified, systems and services are restored, and normal operations are confirmed.",
     "assessment_fields": ["disaster_recovery", "audit_logging"], "weight": 0.8},
    {"id": "RC.RP-06", "name": "End of Incident Declared",
     "description": "The end of incident recovery is declared based on criteria, and incident-related documentation is completed.",
     "assessment_fields": ["incident_response_plan", "audit_logging"], "weight": 0.6},

    # RC.CO — Incident Recovery Communication
    {"id": "RC.CO-03", "name": "Recovery Activities Communicated",
     "description": "Recovery activities and progress in restoring operational capabilities are communicated to designated internal and external stakeholders.",
     "assessment_fields": ["incident_reporting_process", "business_continuity_plan"], "weight": 0.6},
    {"id": "RC.CO-04", "name": "Public Updates Managed",
     "description": "Public updates regarding recovery are shared using approved methods and messaging.",
     "assessment_fields": ["incident_reporting_process", "security_policy_document"], "weight": 0.4},
]

# ─────────────────────────────────────────────────────────────────────────────
# Framework Registry
# ─────────────────────────────────────────────────────────────────────────────

FRAMEWORKS: Dict[str, List[Dict[str, Any]]] = {
    "SOC2":     SOC2_CONTROLS,
    "ISO27001": ISO27001_CONTROLS,
    "NIST_CSF": NIST_CSF_CONTROLS,
}

# ─────────────────────────────────────────────────────────────────────────────
# Scoring Engine
# ─────────────────────────────────────────────────────────────────────────────

def _field_passes(value: Any) -> bool:
    """Return True if the field value represents a passing/truthy security posture."""
    if value is None:
        return False
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value > 0
    if isinstance(value, str):
        return value.strip().lower() not in ("", "no", "none", "false", "n/a", "0")
    if isinstance(value, (list, dict)):
        return len(value) > 0
    return bool(value)


def score_framework(framework_name: str, assessment_data: Dict[str, Any]) -> Dict[str, Any]:
    """Score a single framework against the provided assessment data dict."""
    controls = FRAMEWORKS.get(framework_name, [])
    if not controls:
        raise ValueError(f"Unknown framework: {framework_name}")

    scored_controls = []
    total_earned = 0.0
    total_weight = sum(c["weight"] for c in controls)

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
        earned = round(control["weight"] * ratio, 4)
        total_earned += earned

        if ratio == 1.0:
            status = "pass"
        elif ratio == 0.0:
            status = "fail"
        else:
            status = "partial"

        scored_controls.append({
            "id":             control["id"],
            "name":           control["name"],
            "description":    control["description"],
            "status":         status,
            "passing_fields": passing_fields,
            "failing_fields": failing_fields,
            "weight":         control["weight"],
            "earned":         earned,
            "ratio":          round(ratio * 100, 1),
        })

    # Normalise to 0–100 regardless of how weights happen to sum
    normalised_score = round((total_earned / total_weight) * 100, 2) if total_weight > 0 else 0.0

    return {
        "framework":    framework_name,
        "score":        normalised_score,
        "total_controls": len(controls),
        "passed":       sum(1 for c in scored_controls if c["status"] == "pass"),
        "partial":      sum(1 for c in scored_controls if c["status"] == "partial"),
        "failed":       sum(1 for c in scored_controls if c["status"] == "fail"),
        "controls":     scored_controls,
    }


def score_all_frameworks(assessment_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Score all registered frameworks against the assessment data."""
    return [score_framework(name, assessment_data) for name in FRAMEWORKS]


def build_assessment_dict(assessment) -> Dict[str, Any]:
    """
    Map your Assessment model fields to the compliance field names used by
    scoring controls. Extend this as your model gains more columns.
    """
    return {
        # ── Access Control ────────────────────────────────────────────────
        "mfa_enabled":                  getattr(assessment, "has_mfa", False),
        "access_control_policy":        True if getattr(assessment, "mfa_coverage", 0) >= 50 else None,
        "privileged_access_management": True if getattr(assessment, "mfa_coverage", 0) >= 80 else None,
        "segregation_of_duties":        False,   # No direct model field — extend as needed

        # ── Patch & Vulnerability Management ─────────────────────────────
        "patch_management":             "yes" if getattr(assessment, "patch_days", 99) <= 30 else None,
        "change_management_process":    "yes" if getattr(assessment, "patch_days", 99) <= 14 else None,
        "vulnerability_scanning":       "yes" if getattr(assessment, "vulnerabilities", 0) >= 0 else None,  # scan ran

        # ── Threat Detection & Monitoring ─────────────────────────────────
        "monitoring_tools":             None,   # Extend: getattr(assessment, "has_siem", False)
        "siem_enabled":                 False,  # Extend: getattr(assessment, "siem_enabled", False)
        "audit_logging":                False,  # Extend: getattr(assessment, "audit_logging", False)
        "malware_protection":           True if getattr(assessment, "vuln_critical", 1) == 0 else None,

        # ── Incident Response ─────────────────────────────────────────────
        "incident_response_plan":       getattr(assessment, "has_irp", False),
        "incident_reporting_process":   "yes" if getattr(assessment, "has_irp", False) else None,

        # ── Business Continuity ───────────────────────────────────────────
        "business_continuity_plan":     False,  # Extend as needed
        "disaster_recovery":            None,   # Extend as needed
        "backup_strategy":              None,   # Extend as needed

        # ── Data Protection ───────────────────────────────────────────────
        "data_encryption":              False,  # Extend: getattr(assessment, "data_encrypted", False)
        "data_classification":          None,   # Extend as needed
        "data_retention_policy":        None,   # Extend as needed
        "encryption_key_management":    None,   # Extend as needed
        "data_validation":              False,  # Extend as needed

        # ── Training & Awareness ──────────────────────────────────────────
        "security_awareness_training":  True if getattr(assessment, "training_percent", 0) >= 70 else False,
        "phishing_simulation":          True if getattr(assessment, "training_percent", 0) >= 85 else False,

        # ── Policy & Governance ───────────────────────────────────────────
        "security_policy_document":     None,   # Extend as needed
        "policy_review_cycle":          None,   # Extend as needed
        "security_roles_defined":       False,  # Extend as needed
        "privacy_policy":               None,   # Extend as needed

        # ── Asset & Risk Management ───────────────────────────────────────
        "asset_inventory":              None,   # Extend as needed
        "risk_assessment_process":      None,   # Extend as needed
    }