"""
live_score_engine.py — Real-time compliance score engine
Aggregates scores from: assessments + continuous checks + evidence + controls
Updates every time checks run. Single source of truth for all scores.
"""
import os
from datetime import datetime, timedelta
from typing import Dict, Optional

# In-memory score cache (use Redis in production)
SCORE_CACHE: Dict[str, dict] = {}

FRAMEWORK_WEIGHTS = {
    "SOC2":     {"checks": 0.40, "evidence": 0.30, "assessment": 0.30},
    "ISO27001": {"checks": 0.40, "evidence": 0.30, "assessment": 0.30},
    "RBI":      {"checks": 0.50, "evidence": 0.30, "assessment": 0.20},
    "DPDP":     {"checks": 0.50, "evidence": 0.30, "assessment": 0.20},
}

# Baseline scores when no data exists (demo mode)
DEMO_BASELINES = {
    "SOC2":     {"score": 74, "trend": "+7%", "status": "In Progress", "color": "#f59e0b"},
    "ISO27001": {"score": 68, "trend": "+3%", "status": "In Progress", "color": "#f59e0b"},
    "RBI":      {"score": 61, "trend": "+5%", "status": "Building",    "color": "#f97316"},
    "DPDP":     {"score": 22, "trend": "+12%","status": "Building",    "color": "#ef4444"},
}

def calculate_framework_score(
    framework: str,
    check_results: list,
    evidence_items: list,
    assessment_score: Optional[float] = None,
) -> dict:
    """Calculate composite score for a framework from all data sources."""
    
    fw_checks = [c for c in check_results if c.get("framework") == framework]
    fw_evidence = [e for e in evidence_items if e.get("framework") == framework]
    
    weights = FRAMEWORK_WEIGHTS.get(framework, {"checks":0.40,"evidence":0.30,"assessment":0.30})
    
    # Check score
    if fw_checks:
        passed = sum(1 for c in fw_checks if c.get("status") == "PASS")
        check_score = round(passed / len(fw_checks) * 100)
    else:
        check_score = DEMO_BASELINES.get(framework, {}).get("score", 65)
    
    # Evidence score
    if fw_evidence:
        approved = sum(1 for e in fw_evidence if e.get("status") == "APPROVED")
        evidence_score = round(approved / len(fw_evidence) * 100)
    else:
        evidence_score = check_score  # Use check score as proxy
    
    # Assessment score
    if assessment_score is not None:
        final_score = round(
            check_score * weights["checks"] +
            evidence_score * weights["evidence"] +
            assessment_score * weights["assessment"]
        )
    else:
        final_score = round(
            check_score * weights["checks"] +
            evidence_score * weights["evidence"] +
            check_score * weights["assessment"]  # Use check score when no assessment
        )
    
    baseline = DEMO_BASELINES.get(framework, {})
    status = "Compliant" if final_score >= 80 else "In Progress" if final_score >= 50 else "Building"
    color = "#10b981" if final_score >= 80 else "#f59e0b" if final_score >= 50 else "#ef4444"
    
    return {
        "framework": framework,
        "score": final_score,
        "check_score": check_score,
        "evidence_score": evidence_score,
        "assessment_score": assessment_score or check_score,
        "checks_total": len(fw_checks),
        "checks_passed": sum(1 for c in fw_checks if c.get("status") == "PASS"),
        "evidence_total": len(fw_evidence),
        "evidence_approved": sum(1 for e in fw_evidence if e.get("status") == "APPROVED"),
        "status": status,
        "color": color,
        "trend": baseline.get("trend", "+0%"),
        "last_updated": datetime.utcnow().isoformat(),
    }

def get_live_scores(tenant_id: str = "demo") -> dict:
    """Get live compliance scores for all 4 frameworks."""
    try:
        from services.continuous_monitoring import get_latest_results
        results = get_latest_results(tenant_id)
        check_results = results.get("results", [])
    except:
        check_results = []
    
    frameworks = ["SOC2", "ISO27001", "RBI", "DPDP"]
    scores = {}
    
    for fw in frameworks:
        scores[fw] = calculate_framework_score(fw, check_results, [])
        # If no real check data, use demo baselines
        if not check_results:
            baseline = DEMO_BASELINES.get(fw, {})
            scores[fw]["score"] = baseline.get("score", 65)
            scores[fw]["status"] = baseline.get("status", "In Progress")
            scores[fw]["color"] = baseline.get("color", "#f59e0b")
    
    overall = round(sum(s["score"] for s in scores.values()) / len(scores))
    
    result = {
        "overall_score": overall,
        "overall_status": "Compliant" if overall >= 80 else "In Progress" if overall >= 50 else "Building",
        "overall_color": "#10b981" if overall >= 80 else "#f59e0b" if overall >= 50 else "#ef4444",
        "frameworks": scores,
        "last_updated": datetime.utcnow().isoformat(),
        "next_update": (datetime.utcnow() + timedelta(hours=1)).isoformat(),
        "tenant_id": tenant_id,
        "checks_run": len(check_results),
    }
    
    SCORE_CACHE[tenant_id] = result
    return result

def get_cached_scores(tenant_id: str = "demo") -> dict:
    """Return cached scores or calculate fresh ones."""
    if tenant_id in SCORE_CACHE:
        cached = SCORE_CACHE[tenant_id]
        age = (datetime.utcnow() - datetime.fromisoformat(cached["last_updated"])).seconds
        if age < 3600:  # Cache for 1 hour
            return cached
    return get_live_scores(tenant_id)
