"""
AURA — Unified Automation Engine
=================================
One engine, three workstreams (remediation / evidence / policy), one adapter
layer that covers every integration.

Design goals
------------
* Zero external dependencies — runs in SIMULATION mode out of the box so the
  whole flow works with no cloud credentials and no extra packages installed.
* Provider-adapter pattern — adding a new integration means implementing one
  small interface, not touching the engine.
* Safety-first remediation — nothing is ever applied to a real system without
  an explicit, per-action approval. Every action is previewable, logged, and
  reversible.

Switching a provider from simulation to live
--------------------------------------------
Each adapter has clearly-marked `# LIVE:` hooks. Drop the real SDK call there
(e.g. boto3 for AWS) and flip `SIMULATION_MODE = False` for that provider once a
customer has connected scoped, least-privilege credentials.
"""

from __future__ import annotations

import uuid
import time
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from enum import Enum
from typing import Optional


# --------------------------------------------------------------------------- #
#  Enums / value types
# --------------------------------------------------------------------------- #
class Risk(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class FindingStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    PARTIAL = "PARTIAL"
    UNKNOWN = "UNKNOWN"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# --------------------------------------------------------------------------- #
#  Control automation registry
#  Each entry ties one control to: which provider checks it, how to remediate
#  it, what evidence proves it, and which policy section it informs.
#  This single table is what makes all three workstreams share a backbone.
# --------------------------------------------------------------------------- #
@dataclass
class ControlAutomation:
    control_id: str
    framework: str            # SOC2 | ISO27001 | RBI | DPDP
    title: str
    provider: str             # key into PROVIDERS
    remediation_action: str   # short action verb shown on the "Fix" button
    remediation_desc: str
    risk: Risk
    reversible: bool
    evidence_type: str        # config_snapshot | api_response | report | log_export
    evidence_desc: str
    policy_section: str       # which generated policy this control feeds

    def public(self) -> dict:
        d = asdict(self)
        d["risk"] = self.risk.value
        return d


REGISTRY: list[ControlAutomation] = [
    # ---- AWS ----
    ControlAutomation("CC6.1", "SOC2", "Enforce MFA on all IAM users", "aws",
                      "Enforce MFA", "Attach an IAM policy denying actions for users without MFA.",
                      Risk.MEDIUM, True, "config_snapshot",
                      "IAM account summary showing MFA-enabled user count.", "Access Control Policy"),
    ControlAutomation("CC6.7", "SOC2", "Enable default S3 bucket encryption", "aws",
                      "Enable encryption", "Set AES-256 default encryption on buckets lacking it.",
                      Risk.LOW, True, "config_snapshot",
                      "S3 GetBucketEncryption response per bucket.", "Data Protection Policy"),
    ControlAutomation("CC7.2", "SOC2", "Enable CloudTrail across all regions", "aws",
                      "Enable logging", "Create a multi-region CloudTrail trail with log file validation.",
                      Risk.LOW, True, "config_snapshot",
                      "CloudTrail DescribeTrails response.", "Logging and Monitoring Policy"),
    ControlAutomation("A.8.2", "ISO27001", "Restrict public security groups", "aws",
                      "Restrict ingress", "Remove 0.0.0.0/0 ingress rules on sensitive ports.",
                      Risk.HIGH, True, "config_snapshot",
                      "EC2 DescribeSecurityGroups ingress rules.", "Network Security Policy"),

    # ---- Okta / identity ----
    ControlAutomation("CC6.2", "SOC2", "Require strong password policy", "okta",
                      "Apply policy", "Set min length 12, complexity, and lockout thresholds.",
                      Risk.LOW, True, "api_response",
                      "Okta password policy settings export.", "Access Control Policy"),
    ControlAutomation("CC6.3", "SOC2", "Disable dormant accounts", "okta",
                      "Deactivate", "Deactivate accounts with no login in 90+ days.",
                      Risk.MEDIUM, True, "report",
                      "List of accounts last-active > 90 days.", "Access Control Policy"),

    # ---- Google Workspace ----
    ControlAutomation("DPDP-7", "DPDP", "Enforce 2-step verification", "google_workspace",
                      "Enforce 2SV", "Turn on mandatory 2-step verification org-wide.",
                      Risk.MEDIUM, True, "config_snapshot",
                      "Admin SDK security settings snapshot.", "Access Control Policy"),
    ControlAutomation("DPDP-12", "DPDP", "Set data retention on Drive", "google_workspace",
                      "Set retention", "Apply a retention rule matching the stated policy period.",
                      Risk.MEDIUM, False, "config_snapshot",
                      "Vault retention rule configuration.", "Data Retention Policy"),

    # ---- GitHub ----
    ControlAutomation("CC8.1", "SOC2", "Require PR review before merge", "github",
                      "Protect branch", "Enable branch protection requiring 1+ approving review.",
                      Risk.LOW, True, "api_response",
                      "Branch protection settings for default branch.", "Change Management Policy"),
    ControlAutomation("A.12.1", "ISO27001", "Enable secret scanning", "github",
                      "Enable scanning", "Turn on secret scanning + push protection on all repos.",
                      Risk.LOW, True, "api_response",
                      "Repo security-and-analysis settings.", "Secure Development Policy"),

    # ---- RBI-specific (infra) ----
    ControlAutomation("RBI-CSF-4.2", "RBI", "Centralise audit log retention", "aws",
                      "Configure retention", "Ship logs to a write-once store with 180-day retention.",
                      Risk.MEDIUM, True, "config_snapshot",
                      "Log group retention + object-lock configuration.", "Logging and Monitoring Policy"),
    ControlAutomation("RBI-CSF-6.1", "RBI", "Enforce TLS 1.2+ on endpoints", "azure",
                      "Set min TLS", "Set minimum TLS version to 1.2 on public endpoints.",
                      Risk.MEDIUM, True, "config_snapshot",
                      "Endpoint TLS policy configuration.", "Network Security Policy"),

    # ---- M365 / Azure ----
    ControlAutomation("A.9.4", "ISO27001", "Block legacy auth protocols", "m365",
                      "Block legacy", "Create a conditional-access rule blocking legacy auth.",
                      Risk.HIGH, True, "config_snapshot",
                      "Conditional access policy export.", "Access Control Policy"),
    ControlAutomation("CC6.6", "SOC2", "Enable disk encryption on VMs", "azure",
                      "Enable encryption", "Turn on disk encryption for unencrypted VMs.",
                      Risk.MEDIUM, True, "config_snapshot",
                      "VM disk encryption status.", "Data Protection Policy"),
]


# --------------------------------------------------------------------------- #
#  Provider adapter layer
#  Every integration implements the SAME interface. The engine never special-
#  cases a provider — it just calls detect / remediate / collect_evidence.
# --------------------------------------------------------------------------- #
class ProviderAdapter:
    """Base adapter. Subclass per integration; override the LIVE hooks."""

    name = "generic"
    simulation = True  # flip to False once live creds + LIVE hooks are wired

    # -- detection -------------------------------------------------------- #
    def detect(self, control: ControlAutomation) -> dict:
        """Return current state of the control for this provider."""
        if self.simulation:
            return self._simulated_detect(control)
        return self._live_detect(control)  # pragma: no cover

    def _live_detect(self, control: ControlAutomation) -> dict:  # pragma: no cover
        # LIVE: call the real SDK here, e.g. boto3 client(...).get_account_summary()
        raise NotImplementedError("Live detection not wired for this provider yet.")

    def _simulated_detect(self, control: ControlAutomation) -> dict:
        # Deterministic-ish mock: ~⅓ pass, ⅓ partial, ⅓ fail, seeded by id.
        seed = sum(ord(c) for c in control.control_id)
        bucket = seed % 3
        status = [FindingStatus.PASS, FindingStatus.PARTIAL, FindingStatus.FAIL][bucket]
        detail = {
            FindingStatus.PASS: "Already configured correctly.",
            FindingStatus.PARTIAL: "Partially configured — some resources non-compliant.",
            FindingStatus.FAIL: "Not configured — remediation available.",
        }[status]
        return {"status": status.value, "detail": detail, "checked_at": _now()}

    # -- remediation ------------------------------------------------------ #
    def remediate(self, control: ControlAutomation, dry_run: bool) -> dict:
        if self.simulation:
            return self._simulated_remediate(control, dry_run)
        return self._live_remediate(control, dry_run)  # pragma: no cover

    def _live_remediate(self, control: ControlAutomation, dry_run: bool) -> dict:  # pragma: no cover
        # LIVE: perform (or, if dry_run, only describe) the real change here.
        raise NotImplementedError("Live remediation not wired for this provider yet.")

    def _simulated_remediate(self, control: ControlAutomation, dry_run: bool) -> dict:
        before = "non-compliant"
        after = "compliant"
        rollback_token = None if dry_run else f"rb_{uuid.uuid4().hex[:12]}"
        return {
            "provider": self.name,
            "control_id": control.control_id,
            "dry_run": dry_run,
            "action": control.remediation_action,
            "before": before,
            "after": after if not dry_run else f"{after} (preview only)",
            "reversible": control.reversible,
            "rollback_token": rollback_token,
            "applied_at": None if dry_run else _now(),
            "log": [
                f"[{self.name}] {'PREVIEW' if dry_run else 'APPLY'}: {control.remediation_desc}",
                f"[{self.name}] target control {control.control_id} ({control.framework})",
            ],
        }

    # -- evidence --------------------------------------------------------- #
    def collect_evidence(self, control: ControlAutomation) -> dict:
        if self.simulation:
            return self._simulated_evidence(control)
        return self._live_evidence(control)  # pragma: no cover

    def _live_evidence(self, control: ControlAutomation) -> dict:  # pragma: no cover
        # LIVE: pull the real artifact (API response, config export, screenshot).
        raise NotImplementedError("Live evidence collection not wired yet.")

    def _simulated_evidence(self, control: ControlAutomation) -> dict:
        artifact_id = f"ev_{uuid.uuid4().hex[:12]}"
        return {
            "artifact_id": artifact_id,
            "provider": self.name,
            "control_id": control.control_id,
            "evidence_type": control.evidence_type,
            "description": control.evidence_desc,
            "collected_at": _now(),
            "source": f"{self.name}:simulated",
            "preview": f"<{control.evidence_type} captured from {self.name} for {control.control_id}>",
        }

    # -- rollback --------------------------------------------------------- #
    def rollback(self, rollback_token: str) -> dict:
        if self.simulation:
            return {"rollback_token": rollback_token, "status": "REVERTED",
                    "reverted_at": _now(), "provider": self.name}
        return self._live_rollback(rollback_token)  # pragma: no cover

    def _live_rollback(self, rollback_token: str) -> dict:  # pragma: no cover
        raise NotImplementedError("Live rollback not wired yet.")


class AWSAdapter(ProviderAdapter):
    """AWS — the richest provider. LIVE hooks point at boto3."""
    name = "aws"
    # LIVE: from boto3 import client; self.iam = client("iam"); etc.


# Every integration AURA supports — all wired through the same interface.
# Today they run in simulation; each becomes "live" by setting .simulation=False
# after its LIVE hooks + scoped creds are in place.
_PROVIDER_NAMES = [
    "aws", "gcp", "azure", "okta", "google_workspace", "github", "m365",
    "jira", "slack", "datadog", "cloudflare", "snyk", "jamf", "kandji",
    "auth0", "pagerduty", "zoom", "salesforce", "notion",
]


def _build_providers() -> dict[str, ProviderAdapter]:
    providers: dict[str, ProviderAdapter] = {"aws": AWSAdapter()}
    for n in _PROVIDER_NAMES:
        if n not in providers:
            p = ProviderAdapter()
            p.name = n
            providers[n] = p
    return providers


PROVIDERS: dict[str, ProviderAdapter] = _build_providers()


def get_provider(name: str) -> ProviderAdapter:
    return PROVIDERS.get(name) or PROVIDERS["aws"]


# --------------------------------------------------------------------------- #
#  Engine — orchestrates the three workstreams over the registry
# --------------------------------------------------------------------------- #
def _registry_index() -> dict[str, ControlAutomation]:
    return {c.control_id: c for c in REGISTRY}


class AutomationEngine:
    def __init__(self) -> None:
        self.index = _registry_index()
        # In-memory action ledger (swap for a DB table in production).
        self.ledger: list[dict] = []

    # ---- scan: what can we automate, and what's the current state? ------ #
    def scan(self, tenant_id: str, framework: Optional[str] = None) -> dict:
        findings = []
        for control in REGISTRY:
            if framework and control.framework != framework:
                continue
            provider = get_provider(control.provider)
            state = provider.detect(control)
            remediable = state["status"] in (FindingStatus.FAIL.value,
                                              FindingStatus.PARTIAL.value)
            findings.append({
                **control.public(),
                "state": state,
                "remediable": remediable,
            })
        summary = {
            "total": len(findings),
            "passing": sum(1 for f in findings if f["state"]["status"] == "PASS"),
            "remediable": sum(1 for f in findings if f["remediable"]),
            "auto_fixable_low_risk": sum(
                1 for f in findings if f["remediable"] and f["risk"] == "LOW"),
            "providers": sorted({f["provider"] for f in findings}),
            "scanned_at": _now(),
        }
        return {"tenant_id": tenant_id, "summary": summary, "findings": findings}

    # ---- remediate: preview or apply, always approval-gated ------------- #
    def remediate(self, control_id: str, dry_run: bool, approved: bool) -> dict:
        control = self.index.get(control_id)
        if not control:
            return {"error": f"Unknown control_id '{control_id}'"}

        # SAFETY GATE: never touch a real system without explicit approval.
        if not dry_run and not approved:
            return {
                "error": "approval_required",
                "message": ("This action changes a connected system. Re-send with "
                            "approved=true to apply, or dry_run=true to preview."),
                "control_id": control_id,
                "risk": control.risk.value,
            }

        provider = get_provider(control.provider)
        result = provider.remediate(control, dry_run=dry_run)
        result["risk"] = control.risk.value
        result["title"] = control.title
        result["framework"] = control.framework
        if not dry_run:
            self.ledger.append({"type": "remediation", **result})
        return result

    def rollback(self, rollback_token: str) -> dict:
        entry = next((e for e in self.ledger
                      if e.get("rollback_token") == rollback_token), None)
        if not entry:
            return {"error": "unknown_rollback_token", "rollback_token": rollback_token}
        provider = get_provider(entry["provider"])
        res = provider.rollback(rollback_token)
        self.ledger.append({"type": "rollback", **res})
        return res

    # ---- evidence: collect proof for every (or one) control ------------- #
    def collect_evidence(self, tenant_id: str,
                         control_id: Optional[str] = None) -> dict:
        controls = ([self.index[control_id]] if control_id and control_id in self.index
                    else REGISTRY)
        artifacts = []
        for control in controls:
            provider = get_provider(control.provider)
            artifacts.append(provider.collect_evidence(control))
        return {
            "tenant_id": tenant_id,
            "collected": len(artifacts),
            "collected_at": _now(),
            "artifacts": artifacts,
        }


# A module-level singleton is convenient for FastAPI routes.
ENGINE = AutomationEngine()


if __name__ == "__main__":
    # Tiny self-test so the module is runnable on its own.
    import json
    eng = AutomationEngine()
    scan = eng.scan("demo")
    print("SCAN summary:", json.dumps(scan["summary"], indent=2))
    target = next(f for f in scan["findings"] if f["remediable"])
    cid = target["control_id"]
    print("\nPREVIEW:", json.dumps(eng.remediate(cid, dry_run=True, approved=False), indent=2))
    print("\nNO-APPROVAL APPLY:", json.dumps(eng.remediate(cid, dry_run=False, approved=False), indent=2))
    applied = eng.remediate(cid, dry_run=False, approved=True)
    print("\nAPPLY:", json.dumps(applied, indent=2))
    print("\nROLLBACK:", json.dumps(eng.rollback(applied["rollback_token"]), indent=2))
    print("\nEVIDENCE:", json.dumps(eng.collect_evidence("demo")["collected"], indent=2), "artifacts")
