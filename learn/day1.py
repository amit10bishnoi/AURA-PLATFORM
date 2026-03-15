
org_name = "TechCorp Ltd"
employee_count = 150
has_mfa = True
risk_score = 72.5

print("Welcome to AURA Risk Engine")
print("================================")
print("Organization:", org_name)
print("Employees:", employee_count)
print("MFA Enabled:", has_mfa)
print("Risk Score:", risk_score)

print("\nRisk Assessment:")
if risk_score >= 75:
    print("Status: CRITICAL - Immediate action required!")
elif risk_score >= 55:
    print("Status: HIGH - Urgent attention needed")
elif risk_score >= 35:
    print("Status: MEDIUM - Monitor closely")
else:
    print("Status: LOW - Good security posture")