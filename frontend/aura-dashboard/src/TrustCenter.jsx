import React, { useState, useEffect } from "react";

const API = "http://localhost:8000";

function TrustCenter() {
  const tenantId = window.location.pathname.split("/trust/")[1]?.split("/")[0] || "";
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    if (!tenantId) { setError("No organisation ID in URL."); setLoading(false); return; }
    fetch(`${API}/trust/${tenantId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load trust data."); setLoading(false); });
  }, [tenantId]);

  const statusColor = (s) =>
    s === "compliant" ? "#34D399" : s === "in_progress" ? "#FBBF24" : "#F87171";
  const statusLabel = (s) =>
    s === "compliant" ? "Compliant" : s === "in_progress" ? "In Progress" : "Needs Attention";
  const riskColor = (l) =>
    ({ CRITICAL:"#F87171", HIGH:"#FB923C", MEDIUM:"#FBBF24", LOW:"#34D399" })[l] || "#6366F1";

  const G = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',sans-serif; background:#0F1117; color:#F0F2F8; min-height:100vh; }
    .tc-root { max-width:860px; margin:0 auto; padding:40px 20px 80px; }
    .tc-header { text-align:center; margin-bottom:48px; }
    .tc-logo { display:inline-flex; align-items:center; gap:10px; margin-bottom:24px; }
    .tc-logo-mark { width:40px; height:40px; background:linear-gradient(135deg,#6366F1,#818CF8); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px; box-shadow:0 0 20px rgba(99,102,241,.4); }
    .tc-logo-text { font-size:18px; font-weight:700; color:#F0F2F8; }
    .tc-org { font-size:28px; font-weight:700; color:#F0F2F8; letter-spacing:-0.5px; margin-bottom:8px; }
    .tc-sub { font-size:14px; color:#6B7190; }
    .tc-verified { display:inline-flex; align-items:center; gap:6px; background:rgba(52,211,153,.1); border:1px solid rgba(52,211,153,.3); border-radius:20px; padding:4px 14px; font-size:12px; font-weight:600; color:#34D399; margin-top:12px; }
    .tc-score-card { background:linear-gradient(135deg,#1A1D27,#222536); border:1px solid rgba(255,255,255,.08); border-radius:16px; padding:32px; text-align:center; margin-bottom:24px; }
    .tc-score-val { font-size:64px; font-weight:700; letter-spacing:-3px; color:#F0F2F8; line-height:1; }
    .tc-score-lbl { font-size:13px; color:#6B7190; margin-top:6px; }
    .tc-score-date { font-size:11px; color:#6B7190; margin-top:12px; }
    .tc-frameworks { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:24px; }
    @media(max-width:600px){ .tc-frameworks{grid-template-columns:1fr;} }
    .tc-fw-card { background:#1A1D27; border:1px solid rgba(255,255,255,.08); border-radius:12px; padding:18px; }
    .tc-fw-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
    .tc-fw-name { font-size:13px; font-weight:600; color:#F0F2F8; }
    .tc-fw-desc { font-size:11px; color:#6B7190; margin-top:2px; }
    .tc-fw-badge { font-size:10px; font-weight:700; padding:3px 9px; border-radius:20px; flex-shrink:0; }
    .tc-fw-bar-wrap { background:#222536; border-radius:20px; height:6px; overflow:hidden; }
    .tc-fw-bar-fill { height:100%; border-radius:20px; transition:width .8s cubic-bezier(.4,0,.2,1); }
    .tc-fw-score { font-size:11px; color:#6B7190; margin-top:6px; text-align:right; }
    .tc-highlights { background:#1A1D27; border:1px solid rgba(255,255,255,.08); border-radius:12px; padding:20px; margin-bottom:24px; }
    .tc-hl-title { font-size:13px; font-weight:600; color:#F0F2F8; margin-bottom:14px; }
    .tc-hl-item { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid rgba(255,255,255,.05); font-size:13px; color:#9EA3B8; }
    .tc-hl-item:last-child { border-bottom:none; }
    .tc-hl-dot { width:8px; height:8px; border-radius:50%; background:#34D399; flex-shrink:0; }
    .tc-stats { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:32px; }
    .tc-stat { background:#1A1D27; border:1px solid rgba(255,255,255,.08); border-radius:12px; padding:18px; text-align:center; }
    .tc-stat-val { font-size:28px; font-weight:700; color:#F0F2F8; letter-spacing:-1px; }
    .tc-stat-lbl { font-size:11px; color:#6B7190; margin-top:4px; }
    .tc-footer { text-align:center; font-size:11px; color:#6B7190; border-top:1px solid rgba(255,255,255,.06); padding-top:24px; margin-top:32px; }
    .tc-footer a { color:#818CF8; text-decoration:none; }
    .tc-loading { text-align:center; padding:80px 20px; color:#6B7190; font-size:14px; }
    .tc-error  { text-align:center; padding:80px 20px; color:#F87171; font-size:14px; }
  `;

  if (loading) return (
    <>
      <style>{G}</style>
      <div className="tc-loading">Loading trust center data...</div>
    </>
  );

  if (error || !data) return (
    <>
      <style>{G}</style>
      <div className="tc-error">{error || "Organisation not found."}</div>
    </>
  );

  return (
    <>
      <style>{G}</style>
      <div className="tc-root">

        {/* Header */}
        <div className="tc-header">
          <div className="tc-logo">
            <div className="tc-logo-mark">🛡</div>
            <div className="tc-logo-text">AURA Trust Center</div>
          </div>
          <div className="tc-org">{data.org_name}</div>
          <div className="tc-sub">Security &amp; Compliance Posture — Public Report</div>
          {data.verified && (
            <div style={{display:"flex",justifyContent:"center",marginTop:"12px"}}>
              <span className="tc-verified">✓ Verified by AURA Platform</span>
            </div>
          )}
        </div>

        {/* Overall score */}
        <div className="tc-score-card">
          <div className="tc-score-val">{data.overall_score}%</div>
          <div className="tc-score-lbl">Overall Compliance Score</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",marginTop:"12px"}}>
            <span style={{fontSize:"12px",fontWeight:"700",color:riskColor(data.risk_level),
              background:`${riskColor(data.risk_level)}20`,padding:"3px 10px",borderRadius:"20px"}}>
              Risk Level: {data.risk_level}
            </span>
          </div>
          <div className="tc-score-date">
            Last assessed: {data.last_assessed} &nbsp;·&nbsp; Updated: {data.last_updated}
          </div>
        </div>

        {/* Frameworks grid */}
        <div style={{fontSize:"13px",fontWeight:"600",color:"#9EA3B8",marginBottom:"12px",
          textTransform:"uppercase",letterSpacing:"1px"}}>
          Compliance Frameworks
        </div>
        <div className="tc-frameworks">
          {data.frameworks.map(fw => (
            <div className="tc-fw-card" key={fw.key}>
              <div className="tc-fw-top">
                <div>
                  <div className="tc-fw-name">{fw.name}</div>
                  <div className="tc-fw-desc">{fw.description}</div>
                </div>
                <span className="tc-fw-badge" style={{
                  color: statusColor(fw.status),
                  background: `${statusColor(fw.status)}15`,
                  border: `1px solid ${statusColor(fw.status)}40`
                }}>
                  {statusLabel(fw.status)}
                </span>
              </div>
              <div className="tc-fw-bar-wrap">
                <div className="tc-fw-bar-fill"
                  style={{width:`${fw.score}%`, background: fw.color}} />
              </div>
              <div className="tc-fw-score">{fw.score}%</div>
            </div>
          ))}
        </div>

        {/* Security highlights */}
        <div className="tc-highlights">
          <div className="tc-hl-title">Security Highlights</div>
          {data.security_highlights.map((h, i) => (
            <div className="tc-hl-item" key={i}>
              <div className="tc-hl-dot" />
              {h.text}
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="tc-stats">
          <div className="tc-stat">
            <div className="tc-stat-val" style={{color:"#34D399"}}>{data.completed_remediations}</div>
            <div className="tc-stat-lbl">Issues Resolved</div>
          </div>
          <div className="tc-stat">
            <div className="tc-stat-val" style={{color:"#FBBF24"}}>{data.open_remediations}</div>
            <div className="tc-stat-lbl">In Remediation</div>
          </div>
        </div>

        {/* Footer */}
        <div className="tc-footer">
          <div style={{marginBottom:"8px"}}>
            This trust report is automatically generated and updated by{" "}
            <a href="http://localhost:3000">AURA Platform</a> — AI-Powered GRC.
          </div>
          <div>Data verified from Azure AD · Intune · AWS · GCP · {data.last_updated}</div>
        </div>

      </div>
    </>
  );
}

export default TrustCenter;
