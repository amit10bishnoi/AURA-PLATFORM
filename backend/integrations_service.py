"""
integrations_service.py — Real API integrations with smart fallbacks
AWS, GitHub, Okta pull REAL data when API keys are configured.
All others use intelligent simulation.
"""
import os, random, requests
from datetime import datetime, timedelta

def _now(): return datetime.utcnow().isoformat() + "Z"
def _rand(lo, hi): return random.randint(lo, hi)

# ── AWS REAL INTEGRATION ──────────────────────────────────────────────────────
def pull_aws(org_name: str):
    key = os.getenv("AWS_ACCESS_KEY_ID", "")
    secret = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    region = os.getenv("AWS_DEFAULT_REGION", "ap-south-1")

    if not key or not secret:
        # Smart simulation
        return _aws_simulated(org_name)

    try:
        import boto3
        session = boto3.Session(
            aws_access_key_id=key,
            aws_secret_access_key=secret,
            region_name=region
        )
        findings = []
        metrics = {}

        # ── IAM checks ────────────────────────────────────────────────────────
        iam = session.client("iam")
        try:
            # Root account MFA
            summary = iam.get_account_summary()["SummaryMap"]
            root_mfa = summary.get("AccountMFAEnabled", 0)
            metrics["root_mfa_enabled"] = bool(root_mfa)
            if not root_mfa:
                findings.append({"severity":"CRITICAL","title":"Root account MFA not enabled","description":"AWS root account does not have MFA enabled — highest risk finding.","recommendation":"Enable MFA on root account immediately: AWS Console → My Account → Security Credentials → MFA"})

            # IAM users without MFA
            users = iam.list_users()["Users"]
            mfa_devices = iam.list_virtual_mfa_devices()["VirtualMFADevices"]
            mfa_user_ids = {d["User"]["UserId"] for d in mfa_devices if "User" in d}
            users_without_mfa = [u for u in users if u["UserId"] not in mfa_user_ids]
            metrics["total_iam_users"] = len(users)
            metrics["users_without_mfa"] = len(users_without_mfa)
            mfa_pct = round((1 - len(users_without_mfa)/max(len(users),1))*100)
            metrics["mfa_coverage_pct"] = mfa_pct
            if users_without_mfa:
                findings.append({"severity":"HIGH" if len(users_without_mfa)>3 else "MEDIUM","title":f"{len(users_without_mfa)} IAM users without MFA","description":f"Users: {', '.join(u['UserName'] for u in users_without_mfa[:5])}","recommendation":"IAM Console → Users → Select user → Security credentials → Assign MFA device"})

            # Access keys older than 90 days
            old_keys = []
            for user in users:
                keys = iam.list_access_keys(UserName=user["UserName"])["AccessKeyMetadata"]
                for k in keys:
                    if k["Status"] == "Active":
                        age = (datetime.utcnow() - k["CreateDate"].replace(tzinfo=None)).days
                        if age > 90:
                            old_keys.append({"user": user["UserName"], "age": age})
            metrics["old_access_keys"] = len(old_keys)
            if old_keys:
                findings.append({"severity":"HIGH","title":f"{len(old_keys)} access keys older than 90 days","description":f"Keys: {', '.join(f['user'] for f in old_keys[:3])}","recommendation":"Rotate access keys: IAM → Users → Security credentials → Create new key → Delete old"})

            # Password policy
            try:
                policy = iam.get_account_password_policy()["PasswordPolicy"]
                metrics["min_password_length"] = policy.get("MinimumPasswordLength", 0)
                if policy.get("MinimumPasswordLength", 0) < 14:
                    findings.append({"severity":"MEDIUM","title":"Weak IAM password policy","description":f"Minimum password length is {policy.get('MinimumPasswordLength')} — recommend 14+","recommendation":"IAM → Account settings → Edit password policy → Set minimum 14 characters"})
            except: pass

        except Exception as e:
            metrics["iam_error"] = str(e)[:100]

        # ── S3 checks ─────────────────────────────────────────────────────────
        s3 = session.client("s3")
        try:
            buckets = s3.list_buckets()["Buckets"]
            public_buckets, unencrypted_buckets, no_versioning = [], [], []

            for bucket in buckets[:20]:  # limit to first 20
                name = bucket["Name"]
                # Public access
                try:
                    acl = s3.get_bucket_acl(Bucket=name)
                    for grant in acl.get("Grants", []):
                        if "AllUsers" in str(grant.get("Grantee", {})):
                            public_buckets.append(name)
                            break
                except: pass
                # Encryption
                try:
                    s3.get_bucket_encryption(Bucket=name)
                except s3.exceptions.ClientError:
                    unencrypted_buckets.append(name)
                except: pass
                # Versioning
                try:
                    v = s3.get_bucket_versioning(Bucket=name)
                    if v.get("Status") != "Enabled":
                        no_versioning.append(name)
                except: pass

            metrics["total_buckets"] = len(buckets)
            metrics["public_buckets"] = len(public_buckets)
            metrics["unencrypted_buckets"] = len(unencrypted_buckets)

            if public_buckets:
                findings.append({"severity":"CRITICAL","title":f"{len(public_buckets)} public S3 buckets","description":f"Public: {', '.join(public_buckets[:3])}","recommendation":"S3 Console → Bucket → Permissions → Block all public access → Enable"})
            if unencrypted_buckets:
                findings.append({"severity":"HIGH","title":f"{len(unencrypted_buckets)} unencrypted S3 buckets","description":f"Not encrypted: {', '.join(unencrypted_buckets[:3])}","recommendation":"S3 → Bucket → Properties → Default encryption → Enable SSE-S3 or SSE-KMS"})
        except Exception as e:
            metrics["s3_error"] = str(e)[:100]

        # ── CloudTrail checks ─────────────────────────────────────────────────
        try:
            ct = session.client("cloudtrail")
            trails = ct.describe_trails()["trailList"]
            active_trails = [t for t in trails if t.get("IsMultiRegionTrail")]
            metrics["cloudtrail_trails"] = len(trails)
            metrics["multiregion_trails"] = len(active_trails)
            if not active_trails:
                findings.append({"severity":"HIGH","title":"No multi-region CloudTrail enabled","description":"CloudTrail is not enabled across all regions — gaps in audit logging.","recommendation":"CloudTrail Console → Create trail → Apply to all regions → Enable"})
        except Exception as e:
            metrics["cloudtrail_error"] = str(e)[:100]

        # ── Security Groups (open SSH/RDP) ────────────────────────────────────
        try:
            ec2 = session.client("ec2")
            sgs = ec2.describe_security_groups()["SecurityGroups"]
            open_ssh, open_rdp = [], []
            for sg in sgs:
                for rule in sg.get("IpPermissions", []):
                    for ip in rule.get("IpRanges", []):
                        if ip.get("CidrIp") == "0.0.0.0/0":
                            if rule.get("FromPort") == 22:
                                open_ssh.append(sg["GroupId"])
                            elif rule.get("FromPort") == 3389:
                                open_rdp.append(sg["GroupId"])
            metrics["open_ssh_groups"] = len(open_ssh)
            metrics["open_rdp_groups"] = len(open_rdp)
            if open_ssh:
                findings.append({"severity":"HIGH","title":f"SSH open to 0.0.0.0/0 in {len(open_ssh)} security group(s)","description":f"Security groups: {', '.join(open_ssh[:3])}","recommendation":"EC2 → Security Groups → Edit inbound → Remove 0.0.0.0/0 on port 22 → Use office IP or AWS SSM"})
            if open_rdp:
                findings.append({"severity":"HIGH","title":f"RDP open to 0.0.0.0/0 in {len(open_rdp)} security group(s)","description":f"Security groups: {', '.join(open_rdp[:3])}","recommendation":"EC2 → Security Groups → Edit inbound → Remove 0.0.0.0/0 on port 3389"})
        except Exception as e:
            metrics["ec2_error"] = str(e)[:100]

        sev_order = {"CRITICAL":0,"HIGH":1,"MEDIUM":2,"LOW":3}
        findings.sort(key=lambda x: sev_order.get(x["severity"],4))

        return {
            "provider":"AWS","icon":"☁️","color":"#FF9900",
            "status":"connected","real_data":True,
            "summary":f"{metrics.get('total_iam_users',0)} IAM users · {metrics.get('mfa_coverage_pct',0)}% MFA · {metrics.get('total_buckets',0)} S3 buckets · {len(findings)} findings",
            "findings":findings[:8],
            "metrics":metrics,
            "last_synced":_now(),
            "region":region,
        }
    except Exception as e:
        return {**_aws_simulated(org_name), "error": str(e)[:200], "real_data":False}


def _aws_simulated(org_name):
    unenc = _rand(0,8); pub = _rand(0,4); no_mfa = _rand(0,12); old_keys = _rand(0,6)
    return {
        "provider":"AWS","icon":"☁️","color":"#FF9900","status":"demo_mode","real_data":False,
        "summary":f"{no_mfa} users without MFA · {pub} public buckets · {unenc} unencrypted buckets",
        "findings":[
            {"severity":"HIGH","title":f"{no_mfa} IAM users without MFA","description":"IAM users lack MFA — vulnerable to credential theft.","recommendation":"IAM Console → Users → Security credentials → Assign MFA"},
            {"severity":"HIGH" if pub>0 else "LOW","title":f"{pub} public S3 buckets detected","description":"S3 buckets with public access enabled.","recommendation":"S3 → Block all public access → Enable for all buckets"},
            {"severity":"MEDIUM","title":f"{unenc} unencrypted S3 buckets","description":"S3 buckets without default encryption.","recommendation":"S3 → Properties → Default encryption → Enable SSE-S3"},
            {"severity":"MEDIUM","title":f"{old_keys} access keys older than 90 days","description":"Old access keys increase breach risk.","recommendation":"IAM → Security credentials → Rotate access keys"},
        ],
        "metrics":{"total_iam_users":_rand(10,100),"users_without_mfa":no_mfa,"mfa_coverage_pct":_rand(60,95),"total_buckets":_rand(5,30),"public_buckets":pub,"unencrypted_buckets":unenc,"old_access_keys":old_keys},
        "last_synced":_now(),
        "note":"Add AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY to .env for real data",
    }


# ── GITHUB REAL INTEGRATION ───────────────────────────────────────────────────
def pull_github(org_name: str):
    token = os.getenv("GITHUB_TOKEN", "")
    github_org = os.getenv("GITHUB_ORG", "")

    if not token:
        return _github_simulated(org_name)

    try:
        from github import Github
        g = Github(token)
        findings = []
        metrics = {}

        target = g.get_organization(github_org) if github_org else None
        repos = list(target.get_repos()[:20] if target else g.get_user().get_repos()[:20])
        metrics["total_repos"] = len(repos)

        public_repos = [r for r in repos if not r.private]
        metrics["public_repos"] = len(public_repos)
        if len(public_repos) > 5:
            findings.append({"severity":"MEDIUM","title":f"{len(public_repos)} public repositories","description":f"Public: {', '.join(r.name for r in public_repos[:5])}","recommendation":"Review public repos — make private if they contain internal code"})

        # Branch protection
        unprotected = []
        for repo in repos[:10]:
            try:
                branch = repo.get_branch(repo.default_branch)
                if not branch.protected:
                    unprotected.append(repo.name)
            except: pass
        metrics["unprotected_repos"] = len(unprotected)
        if unprotected:
            findings.append({"severity":"HIGH","title":f"{len(unprotected)} repos without branch protection","description":f"Repos: {', '.join(unprotected[:5])}","recommendation":"Settings → Branches → Add rule → Require PR reviews before merging"})

        # Secret scanning alerts
        secret_count = 0
        for repo in repos[:10]:
            try:
                alerts = list(repo.get_secret_scanning_alerts())
                secret_count += len([a for a in alerts if a.state == "open"])
            except: pass
        metrics["secret_alerts"] = secret_count
        if secret_count > 0:
            findings.append({"severity":"CRITICAL","title":f"{secret_count} exposed secrets in code","description":"GitHub secret scanning detected API keys or credentials in repositories.","recommendation":"Rotate exposed secrets immediately → Add to .gitignore → Use GitHub Secrets"})

        # Dependabot
        dep_count = 0
        for repo in repos[:10]:
            try:
                alerts = list(repo.get_dependabot_alerts())
                dep_count += len([a for a in alerts if a.state == "open" and a.security_advisory.severity in ["critical","high"]])
            except: pass
        metrics["critical_dependabot_alerts"] = dep_count
        if dep_count > 0:
            findings.append({"severity":"HIGH","title":f"{dep_count} critical/high dependency vulnerabilities","description":"Dependabot detected critical CVEs in project dependencies.","recommendation":"Enable auto-merge for Dependabot PRs or manually update vulnerable packages"})

        # Org 2FA
        if target:
            try:
                members_no_2fa = list(target.get_members(filter_="2fa_disabled"))
                metrics["members_no_2fa"] = len(members_no_2fa)
                if members_no_2fa:
                    findings.append({"severity":"HIGH","title":f"{len(members_no_2fa)} org members without 2FA","description":f"Members: {', '.join(m.login for m in members_no_2fa[:5])}","recommendation":"Org Settings → Authentication → Require 2FA for all members"})
            except: pass

        findings.sort(key=lambda x: {"CRITICAL":0,"HIGH":1,"MEDIUM":2,"LOW":3}.get(x["severity"],4))

        return {
            "provider":"GitHub","icon":"🐙","color":"#24292E","status":"connected","real_data":True,
            "summary":f"{metrics['total_repos']} repos · {metrics.get('secret_alerts',0)} secrets · {metrics.get('unprotected_repos',0)} unprotected branches",
            "findings":findings[:6],"metrics":metrics,"last_synced":_now(),
        }
    except Exception as e:
        return {**_github_simulated(org_name), "error":str(e)[:200], "real_data":False}


def _github_simulated(org_name):
    secrets = _rand(0,8); deps = _rand(0,25); pub = _rand(0,10); unprot = _rand(0,5)
    return {
        "provider":"GitHub","icon":"🐙","color":"#24292E","status":"demo_mode","real_data":False,
        "summary":f"{secrets} secret alerts · {deps} dependency alerts · {pub} public repos",
        "findings":[
            {"severity":"CRITICAL" if secrets>3 else "HIGH","title":f"{secrets} exposed secrets detected","description":"GitHub secret scanning found API keys in code.","recommendation":"Rotate all exposed secrets immediately"},
            {"severity":"HIGH","title":f"{deps} critical dependency vulnerabilities","description":"Dependabot detected critical CVEs in dependencies.","recommendation":"Update via Dependabot PRs or npm/pip upgrade"},
            {"severity":"MEDIUM","title":f"{unprot} repos without branch protection","description":"Direct commits to main branch possible.","recommendation":"Add branch protection rules requiring PR reviews"},
        ],
        "metrics":{"total_repos":_rand(10,100),"public_repos":pub,"secret_alerts":secrets,"critical_dependabot_alerts":deps,"unprotected_repos":unprot},
        "last_synced":_now(),
        "note":"Add GITHUB_TOKEN to .env for real data",
    }


# ── OKTA REAL INTEGRATION ─────────────────────────────────────────────────────
def pull_okta(org_name: str):
    domain = os.getenv("OKTA_DOMAIN", "")
    token = os.getenv("OKTA_API_TOKEN", "")

    if not domain or not token:
        return _okta_simulated(org_name)

    try:
        base = f"https://{domain}/api/v1"
        headers = {"Authorization": f"SSWS {token}", "Accept": "application/json"}
        findings = []
        metrics = {}

        # Users
        users_resp = requests.get(f"{base}/users?limit=200", headers=headers, timeout=10)
        users = users_resp.json() if users_resp.ok else []
        metrics["total_users"] = len(users)

        # MFA factors
        no_mfa = []
        for user in users[:50]:
            factors = requests.get(f"{base}/users/{user['id']}/factors", headers=headers, timeout=5)
            if factors.ok and len(factors.json()) == 0:
                no_mfa.append(user.get("profile",{}).get("login","unknown"))

        metrics["users_without_mfa"] = len(no_mfa)
        mfa_pct = round((1 - len(no_mfa)/max(len(users),1))*100)
        metrics["mfa_coverage_pct"] = mfa_pct

        if no_mfa:
            findings.append({"severity":"HIGH" if len(no_mfa)>5 else "MEDIUM","title":f"{len(no_mfa)} users without MFA","description":f"Users: {', '.join(no_mfa[:5])}","recommendation":"Okta Admin → Security → Multifactor → Create policy → Required for All Users"})

        # Suspicious activity
        logs_resp = requests.get(f"{base}/logs?filter=eventType eq \"user.authentication.auth_via_mfa\" and outcome.result eq \"FAILURE\"&limit=50", headers=headers, timeout=10)
        failed_mfa = len(logs_resp.json()) if logs_resp.ok else 0
        metrics["failed_mfa_attempts"] = failed_mfa
        if failed_mfa > 10:
            findings.append({"severity":"HIGH","title":f"{failed_mfa} failed MFA attempts","description":"Multiple failed MFA attempts — possible account takeover.","recommendation":"Review failed attempts in Okta System Log and block suspicious IPs"})

        # Inactive users
        inactive = [u for u in users if u.get("status") == "STAGED"]
        metrics["inactive_staged_users"] = len(inactive)

        return {
            "provider":"Okta","icon":"🔐","color":"#007DC1","status":"connected","real_data":True,
            "summary":f"{metrics['total_users']} users · {mfa_pct}% MFA · {failed_mfa} failed auths",
            "findings":findings,"metrics":metrics,"last_synced":_now(),
        }
    except Exception as e:
        return {**_okta_simulated(org_name), "error":str(e)[:200], "real_data":False}


def _okta_simulated(org_name):
    users = _rand(80,500); mfa = _rand(70,100); susp = _rand(0,12); locked = _rand(0,8)
    return {
        "provider":"Okta","icon":"🔐","color":"#007DC1","status":"demo_mode","real_data":False,
        "summary":f"{mfa}% MFA adoption · {susp} suspicious logins · {locked} locked accounts",
        "findings":[
            {"severity":"HIGH" if susp>5 else "MEDIUM","title":f"{susp} suspicious login attempts","description":"Logins from unusual locations flagged by Okta ThreatInsight.","recommendation":"Review flagged sessions and enforce re-authentication"},
            {"severity":"MEDIUM" if mfa<90 else "LOW","title":f"MFA coverage at {mfa}%","description":f"{users-round(users*mfa/100)} users without MFA.","recommendation":"Enable Okta MFA enforcement for all users"},
        ],
        "metrics":{"total_users":users,"mfa_enabled_pct":mfa,"suspicious_logins":susp,"locked_accounts":locked,"sso_apps":_rand(10,60)},
        "last_synced":_now(),
        "note":"Add OKTA_DOMAIN + OKTA_API_TOKEN to .env for real data",
    }


# ── Keep all other integrations as smart simulation ───────────────────────────
def _sim(provider, icon, color, org_name):
    """Generic smart simulation for tools without real API integration yet."""
    critical = _rand(0,8); high = _rand(2,20); assets = _rand(50,500)
    return {
        "provider":provider,"icon":icon,"color":color,"status":"demo_mode","real_data":False,
        "summary":f"{critical} critical · {high} high severity · {assets} assets monitored",
        "findings":[
            {"severity":"HIGH" if critical>3 else "MEDIUM","title":f"{critical} critical security issues","description":f"{provider} detected critical security issues requiring attention.","recommendation":f"Review {provider} console and remediate critical findings first"},
            {"severity":"MEDIUM" if high>10 else "LOW","title":f"{high} high severity findings","description":f"High severity security findings detected by {provider}.","recommendation":f"Schedule remediation within 7 days per security SLA"},
        ],
        "metrics":{"critical_issues":critical,"high_issues":high,"assets_monitored":assets,"last_scan_hours_ago":_rand(0,24)},
        "last_synced":_now(),
    }

def pull_jira(org): return _sim("Jira","📋","#0052CC",org)
def pull_slack(org): return _sim("Slack","💬","#4A154B",org)
def pull_datadog(org): return _sim("Datadog","📊","#632CA6",org)
def pull_crowdstrike(org): return _sim("CrowdStrike","🦅","#E3130D",org)
def pull_snowflake(org): return _sim("Snowflake","❄️","#29B5E8",org)
def pull_splunk(org): return _sim("Splunk","🔍","#65A637",org)
def pull_servicenow(org): return _sim("ServiceNow","⚙️","#81B5A1",org)
def pull_tenable(org): return _sim("Tenable","🛡️","#00B388",org)
def pull_pagerduty(org): return _sim("PagerDuty","🚨","#06AC38",org)
def pull_qualys(org): return _sim("Qualys","🔬","#ED1C24",org)
def pull_sentinelone(org): return _sim("SentinelOne","🤖","#6B00F5",org)
def pull_microsoft_defender(org): return _sim("Microsoft Defender","🛡","#0078D4",org)
def pull_cloudflare(org): return _sim("Cloudflare","🌐","#F48120",org)
def pull_hashicorp_vault(org): return _sim("HashiCorp Vault","🔑","#000000",org)
def pull_elastic_security(org): return _sim("Elastic Security","🔎","#FEC514",org)
def pull_wiz(org): return _sim("Wiz","🌩","#2B6CB0",org)
def pull_sonarqube(org): return _sim("SonarQube","📝","#4E9BCD",org)
def pull_rapid7(org): return _sim("Rapid7","🎯","#E3170A",org)
def pull_carbon_black(org): return _sim("Carbon Black","⚫","#1A1A1A",org)
def pull_trend_micro(org): return _sim("Trend Micro","📡","#D71920",org)
def pull_lacework(org): return _sim("Lacework","🏔","#00B4D8",org)
def pull_prisma_cloud(org): return _sim("Prisma Cloud","🔷","#00C0E8",org)
def pull_veracode(org): return _sim("Veracode","🧪","#009BDE",org)
def pull_nessus(org): return _sim("Nessus Pro","🔭","#00B388",org)
def pull_duo(org): return _sim("Duo Security","👥","#6BBB47",org)
def pull_snyk(org): return _sim("Snyk","🐛","#4C4A73",org)
def pull_beyondtrust(org): return _sim("BeyondTrust","🏰","#E31837",org)
def pull_darktrace(org): return _sim("Darktrace","🧠","#6236FF",org)

# ── NEW: AWS added to handler map ─────────────────────────────────────────────
INTEGRATION_HANDLERS = {
    "aws":               pull_aws,
    "okta":              pull_okta,
    "github":            pull_github,
    "jira":              pull_jira,
    "slack":             pull_slack,
    "datadog":           pull_datadog,
    "crowdstrike":       pull_crowdstrike,
    "snowflake":         pull_snowflake,
    "splunk":            pull_splunk,
    "servicenow":        pull_servicenow,
    "tenable":           pull_tenable,
    "pagerduty":         pull_pagerduty,
    "qualys":            pull_qualys,
    "sentinelone":       pull_sentinelone,
    "microsoft_defender":pull_microsoft_defender,
    "cloudflare":        pull_cloudflare,
    "hashicorp_vault":   pull_hashicorp_vault,
    "elastic_security":  pull_elastic_security,
    "wiz":               pull_wiz,
    "sonarqube":         pull_sonarqube,
    "rapid7":            pull_rapid7,
    "carbon_black":      pull_carbon_black,
    "trend_micro":       pull_trend_micro,
    "lacework":          pull_lacework,
    "prisma_cloud":      pull_prisma_cloud,
    "veracode":          pull_veracode,
    "nessus":            pull_nessus,
    "duo":               pull_duo,
    "snyk":              pull_snyk,
    "beyondtrust":       pull_beyondtrust,
    "darktrace":         pull_darktrace,
}

def pull_integration(provider: str, org_name: str = "Organisation"):
    handler = INTEGRATION_HANDLERS.get(provider.lower())
    if not handler:
        return {"error": f"Unknown provider: {provider}"}
    return handler(org_name)

def pull_all_integrations(org_name: str = "Organisation"):
    return {k: v(org_name) for k, v in INTEGRATION_HANDLERS.items()}
