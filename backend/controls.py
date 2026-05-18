CONTROLS = [
    {"id": "MFA-01", "framework": "ISO27001", "function": "Protect", "control": "Multi-Factor Authentication enabled on all accounts", "risk_reduction": 25, "iso_ref": "A.9.4.2", "nist_ref": "PR.AC-7"},
    {"id": "MFA-02", "framework": "ISO27001", "function": "Protect", "control": "MFA coverage above 80% of all user accounts", "risk_reduction": 12, "iso_ref": "A.9.4.2", "nist_ref": "PR.AC-7"},
    {"id": "PM-01", "framework": "ISO27001", "function": "Protect", "control": "Automated patch management system in place", "risk_reduction": 15, "iso_ref": "A.12.6.1", "nist_ref": "PR.IP-12"},
    {"id": "PM-02", "framework": "ISO27001", "function": "Protect", "control": "Patches applied within 30 days of release", "risk_reduction": 10, "iso_ref": "A.12.6.1", "nist_ref": "PR.IP-12"},
    {"id": "AT-01", "framework": "ISO27001", "function": "Protect", "control": "Security awareness training completed by 80%+ staff", "risk_reduction": 15, "iso_ref": "A.7.2.2", "nist_ref": "PR.AT-1"},
    {"id": "AT-02", "framework": "ISO27001", "function": "Protect", "control": "Phishing simulation conducted in last 12 months", "risk_reduction": 8, "iso_ref": "A.7.2.2", "nist_ref": "PR.AT-1"},
    {"id": "IR-01", "framework": "ISO27001", "function": "Respond", "control": "Incident response plan documented and approved", "risk_reduction": 10, "iso_ref": "A.16.1.1", "nist_ref": "RS.RP-1"},
    {"id": "IR-02", "framework": "ISO27001", "function": "Respond", "control": "Incident response plan tested in last 12 months", "risk_reduction": 8, "iso_ref": "A.16.1.1", "nist_ref": "RS.RP-1"},
    {"id": "VM-01", "framework": "ISO27001", "function": "Identify", "control": "Vulnerability scanning conducted monthly", "risk_reduction": 10, "iso_ref": "A.12.6.1", "nist_ref": "ID.RA-1"},
    {"id": "VM-02", "framework": "ISO27001", "function": "Identify", "control": "Critical vulnerabilities remediated within 7 days", "risk_reduction": 12, "iso_ref": "A.12.6.1", "nist_ref": "ID.RA-1"},
    {"id": "AC-01", "framework": "ISO", "function": "Protect", "control": "Role-based access control implemented", "risk_reduction": 8, "iso_ref": "A.9.1.1", "nist_ref": "PR.AC-4"},
    {"id": "AC-02", "framework": "ISO", "function": "Protect", "control": "Privileged access reviews conducted quarterly", "risk_reduction": 7, "iso_ref": "A.9.2.5", "nist_ref": "PR.AC-4"},
    {"id": "BK-01", "framework": "ISO", "function": "Recover", "control": "Daily automated backups configured", "risk_reduction": 8, "iso_ref": "A.12.3.1", "nist_ref": "RC.RP-1"},
    {"id": "BK-02", "framework": "ISO", "function": "Recover", "control": "Backup restoration tested in last 6 months", "risk_reduction": 6, "iso_ref": "A.12.3.1", "nist_ref": "RC.RP-1"},
    {"id": "NW-01", "framework": "ISO", "function": "Protect", "control": "Network segmentation implemented", "risk_reduction": 8, "iso_ref": "A.13.1.1", "nist_ref": "PR.AC-5"},
    {"id": "NW-02", "framework": "ISO", "function": "Detect", "control": "Firewall and intrusion detection system active", "risk_reduction": 7, "iso_ref": "A.13.1.1", "nist_ref": "DE.CM-1"},
]


def calculate_checklist_score(implemented_ids: list):
    base_score = 100
    total_reduction = sum(
        c["risk_reduction"] for c in CONTROLS if c["id"] in implemented_ids
    )
    final_score = max(0, base_score - total_reduction)
    return round(final_score, 1)


def get_controls():
    return CONTROLS