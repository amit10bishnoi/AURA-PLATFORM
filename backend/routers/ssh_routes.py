"""
ssh_routes.py — AURA SSH Integration
Allows tenants to connect their servers via SSH so AURA can:
- Pull logs (auth, syslog, app logs)
- Run compliance commands (users, file perms, services)
- Store results as evidence automatically
Credentials: SSH private key only (encrypted at rest with ENCRYPTION_KEY)
"""
import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth_routes import get_current_user
from database import col

log = logging.getLogger("aura.ssh")
router = APIRouter(prefix="/api/ssh", tags=["SSH Integration"])


# ── Pydantic models ───────────────────────────────────────────────────────────

class SSHConnectionCreate(BaseModel):
    name: str                        # friendly name e.g. "Prod Web Server"
    host: str                        # IP or hostname
    port: int = 22
    username: str                    # SSH user e.g. "ubuntu", "ec2-user"
    private_key: str                 # PEM private key (stored encrypted)
    description: Optional[str] = ""

class SSHConnectionUpdate(BaseModel):
    name: Optional[str] = None
    host: Optional[str] = None
    port: Optional[int] = None
    username: Optional[str] = None
    private_key: Optional[str] = None
    description: Optional[str] = None

class SSHCommandRequest(BaseModel):
    connection_id: str
    commands: Optional[list[str]] = None  # custom commands, or use presets


# ── Compliance command presets ────────────────────────────────────────────────

COMPLIANCE_COMMANDS = {
    "users": {
        "label": "User Accounts",
        "commands": [
            "cat /etc/passwd | cut -d: -f1,3,4,7",
            "sudo cat /etc/shadow | cut -d: -f1,2 2>/dev/null || echo 'shadow: permission denied'",
            "awk -F: '($3 == 0) {print}' /etc/passwd",           # root-equivalent users
            "lastlog | grep -v 'Never logged in' | tail -20",     # recent logins
            "who",                                                  # current sessions
        ]
    },
    "file_permissions": {
        "label": "File Permissions",
        "commands": [
            "find /etc -maxdepth 1 -type f -perm /o+w 2>/dev/null | head -20",
            "find / -perm -4000 -type f 2>/dev/null | head -20",  # SUID files
            "find / -perm -2000 -type f 2>/dev/null | head -20",  # SGID files
            "ls -la /etc/ssh/sshd_config",
            "stat /etc/passwd /etc/shadow /etc/sudoers 2>/dev/null",
        ]
    },
    "services": {
        "label": "Running Services",
        "commands": [
            "systemctl list-units --type=service --state=running 2>/dev/null || service --status-all 2>/dev/null",
            "ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null",  # open ports
            "ps aux --no-headers | sort -rn -k3 | head -20",      # top processes
            "systemctl is-enabled ssh ufw firewalld 2>/dev/null",
        ]
    },
    "logs": {
        "label": "System Logs",
        "commands": [
            "tail -100 /var/log/auth.log 2>/dev/null || tail -100 /var/log/secure 2>/dev/null",
            "tail -50 /var/log/syslog 2>/dev/null || tail -50 /var/log/messages 2>/dev/null",
            "last -20",                                            # login history
            "journalctl -p err --since '24 hours ago' --no-pager 2>/dev/null | tail -50",
        ]
    },
    "system_info": {
        "label": "System Info",
        "commands": [
            "uname -a",
            "cat /etc/os-release 2>/dev/null",
            "uptime",
            "df -h",
            "free -h",
            "cat /proc/cpuinfo | grep 'model name' | head -1",
        ]
    },
    "security": {
        "label": "Security Posture",
        "commands": [
            "ufw status 2>/dev/null || firewall-cmd --state 2>/dev/null || iptables -L -n 2>/dev/null | head -30",
            "cat /etc/ssh/sshd_config | grep -E 'PermitRootLogin|PasswordAuthentication|PubkeyAuthentication|Port'",
            "apt list --upgradable 2>/dev/null | head -20 || yum check-update 2>/dev/null | head -20",
            "crontab -l 2>/dev/null",
            "ls /etc/cron* 2>/dev/null",
        ]
    }
}


# ── Encrypt/decrypt SSH key ───────────────────────────────────────────────────

def _encrypt_key(private_key: str) -> str:
    """Encrypt the SSH private key before storing in MongoDB."""
    try:
        from encryption import encrypt_field
        return encrypt_field(private_key)
    except Exception:
        return private_key  # fallback if encryption not configured

def _decrypt_key(encrypted_key: str) -> str:
    """Decrypt the SSH private key for use."""
    try:
        from encryption import decrypt_field
        return decrypt_field(encrypted_key)
    except Exception:
        return encrypted_key


# ── SSH executor ──────────────────────────────────────────────────────────────

async def _run_ssh_commands(host: str, port: int, username: str,
                             private_key_pem: str, commands: list[str]) -> dict:
    """
    Execute commands on a remote server via SSH using asyncssh.
    Returns {command: output} dict.
    """
    try:
        import asyncssh
    except ImportError:
        return {"error": "asyncssh not installed — add 'asyncssh>=2.14.0' to requirements.txt"}

    import tempfile, os

    # Write key to temp file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.pem', delete=False) as f:
        f.write(private_key_pem)
        key_path = f.name
    os.chmod(key_path, 0o600)

    results = {}
    try:
        async with asyncssh.connect(
            host, port=port, username=username,
            client_keys=[key_path],
            known_hosts=None,          # Trust on first connect (TOFU)
            connect_timeout=15,
        ) as conn:
            for cmd in commands:
                try:
                    result = await conn.run(cmd, timeout=30)
                    results[cmd] = {
                        "stdout": result.stdout.strip(),
                        "stderr": result.stderr.strip(),
                        "exit_code": result.exit_status,
                    }
                except Exception as e:
                    results[cmd] = {"error": str(e)}
    except Exception as e:
        results["_connection_error"] = str(e)
    finally:
        os.unlink(key_path)

    return results


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/connections")
async def add_connection(data: SSHConnectionCreate, user=Depends(get_current_user)):
    """Register a new SSH server connection for this tenant."""
    conn_id = str(uuid.uuid4())
    doc = {
        "id": conn_id,
        "tenant_id": user["tenant_id"],
        "name": data.name,
        "host": data.host,
        "port": data.port,
        "username": data.username,
        "private_key_enc": _encrypt_key(data.private_key),  # encrypted
        "description": data.description,
        "status": "untested",
        "last_scan": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["email"],
    }
    await col("ssh_connections").insert_one(doc)
    doc.pop("private_key_enc")  # never return key
    return {"success": True, "connection": doc}


@router.get("/connections")
async def list_connections(user=Depends(get_current_user)):
    """List all SSH connections for this tenant."""
    docs = await col("ssh_connections").find(
        {"tenant_id": user["tenant_id"]}, {"private_key_enc": 0}
    ).to_list(100)
    for d in docs:
        d.pop("_id", None)
    return {"connections": docs}


@router.delete("/connections/{conn_id}")
async def delete_connection(conn_id: str, user=Depends(get_current_user)):
    conn = await col("ssh_connections").find_one(
        {"id": conn_id, "tenant_id": user["tenant_id"]}
    )
    if not conn:
        raise HTTPException(404, "Connection not found")
    await col("ssh_connections").delete_one({"id": conn_id})
    return {"success": True}


@router.post("/connections/{conn_id}/test")
async def test_connection(conn_id: str, user=Depends(get_current_user)):
    """Test connectivity and update status."""
    conn = await col("ssh_connections").find_one(
        {"id": conn_id, "tenant_id": user["tenant_id"]}
    )
    if not conn:
        raise HTTPException(404, "Connection not found")

    key = _decrypt_key(conn["private_key_enc"])
    results = await _run_ssh_commands(
        conn["host"], conn["port"], conn["username"], key,
        ["echo 'AURA_PING_OK'", "uname -a", "whoami"]
    )

    success = "_connection_error" not in results
    status = "connected" if success else "failed"
    error = results.get("_connection_error", "")

    await col("ssh_connections").update_one(
        {"id": conn_id},
        {"$set": {"status": status, "last_tested": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": success, "status": status, "error": error, "details": results}


@router.post("/connections/{conn_id}/scan")
async def run_compliance_scan(conn_id: str, user=Depends(get_current_user),
                               categories: Optional[list[str]] = None):
    """
    Run a full compliance scan on the connected server.
    Pulls logs, checks users, file permissions, services, security posture.
    Results are stored as evidence in AURA automatically.
    """
    conn = await col("ssh_connections").find_one(
        {"id": conn_id, "tenant_id": user["tenant_id"]}
    )
    if not conn:
        raise HTTPException(404, "Connection not found")

    run_cats = categories or list(COMPLIANCE_COMMANDS.keys())
    all_commands = []
    for cat in run_cats:
        if cat in COMPLIANCE_COMMANDS:
            all_commands.extend(COMPLIANCE_COMMANDS[cat]["commands"])

    key = _decrypt_key(conn["private_key_enc"])
    raw_results = await _run_ssh_commands(
        conn["host"], conn["port"], conn["username"], key, all_commands
    )

    if "_connection_error" in raw_results:
        await col("ssh_connections").update_one(
            {"id": conn_id}, {"$set": {"status": "failed"}}
        )
        raise HTTPException(502, f"SSH connection failed: {raw_results['_connection_error']}")

    # ── Organise results by category ─────────────────────────────────────────
    organised = {}
    cmd_index = 0
    for cat in run_cats:
        if cat not in COMPLIANCE_COMMANDS:
            continue
        cat_cmds = COMPLIANCE_COMMANDS[cat]["commands"]
        organised[cat] = {
            "label": COMPLIANCE_COMMANDS[cat]["label"],
            "results": {cmd: raw_results.get(cmd, {}) for cmd in cat_cmds}
        }

    # ── Auto-store as evidence ────────────────────────────────────────────────
    scan_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    evidence_doc = {
        "id": scan_id,
        "tenant_id": user["tenant_id"],
        "type": "ssh_scan",
        "name": f"SSH Compliance Scan — {conn['name']} — {now[:10]}",
        "source": f"{conn['username']}@{conn['host']}:{conn['port']}",
        "categories": run_cats,
        "results": organised,
        "collected_at": now,
        "collected_by": user["email"],
        "connection_id": conn_id,
        "connection_name": conn["name"],
        "frameworks": ["SOC2", "ISO27001", "HIPAA", "DPDP"],
    }
    await col("ssh_evidence").insert_one(evidence_doc)
    evidence_doc.pop("_id", None)

    # Update connection last scan time
    await col("ssh_connections").update_one(
        {"id": conn_id},
        {"$set": {"status": "connected", "last_scan": now}}
    )

    return {
        "success": True,
        "scan_id": scan_id,
        "server": f"{conn['username']}@{conn['host']}",
        "categories_scanned": run_cats,
        "results": organised,
        "evidence_stored": True,
    }


@router.get("/evidence")
async def list_ssh_evidence(user=Depends(get_current_user)):
    """List all stored SSH scan evidence for this tenant."""
    docs = await col("ssh_evidence").find(
        {"tenant_id": user["tenant_id"]}
    ).sort("collected_at", -1).to_list(200)
    for d in docs:
        d.pop("_id", None)
    return {"evidence": docs}


@router.get("/evidence/{scan_id}")
async def get_ssh_evidence(scan_id: str, user=Depends(get_current_user)):
    """Get full results of a specific SSH scan."""
    doc = await col("ssh_evidence").find_one(
        {"id": scan_id, "tenant_id": user["tenant_id"]}
    )
    if not doc:
        raise HTTPException(404, "Scan not found")
    doc.pop("_id", None)
    return doc


@router.get("/presets")
async def get_command_presets():
    """Return available compliance scan categories."""
    return {
        "categories": {
            k: {"label": v["label"], "command_count": len(v["commands"])}
            for k, v in COMPLIANCE_COMMANDS.items()
        }
    }
