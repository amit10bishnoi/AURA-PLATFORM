import { useState, useEffect, useCallback } from "react";
import {
  ScanLine, FileText, Paperclip, Sparkles, Zap, RefreshCw, X, AlertTriangle,
  Undo2, CircleCheck, CircleDot, Circle, ShieldCheck, Cloud, Download, Play,
} from "lucide-react";

const API = "https://web-production-320c3.up.railway.app";

/* ─── Theme tokens (aligned with App.js + the hubs) ─────────────── */
const T = {
  accent: "#7c3aed",
  pink: "#db2777",
  ink: "#1a0a3a",
  muted: "#a89dc8",
  text2: "#6b5b9e",
  green: "#16a34a",
  amber: "#d97706",
  orange: "#ea580c",
  red: "#e11d48",
  border: "rgba(124,58,237,.1)",
  borderHi: "rgba(124,58,237,.22)",
  card: "#fff",
  mono: "'JetBrains Mono',ui-monospace,monospace",
  display: "'Syne',sans-serif",
};

const PROVIDER_LABEL = {
  aws: "AWS", gcp: "GCP", azure: "Azure", okta: "Okta",
  google_workspace: "Google Workspace", github: "GitHub", m365: "Microsoft 365",
  jira: "Jira", slack: "Slack", datadog: "Datadog", cloudflare: "Cloudflare",
  snyk: "Snyk", jamf: "Jamf", kandji: "Kandji", auth0: "Auth0",
  pagerduty: "PagerDuty", zoom: "Zoom", salesforce: "Salesforce", notion: "Notion",
};
const provLabel = p => PROVIDER_LABEL[p] || p;

const STATE = {
  PASS: { color: T.green, bg: "rgba(22,163,74,.08)", label: "Passing", Icon: CircleCheck },
  PARTIAL: { color: T.amber, bg: "rgba(217,119,6,.08)", label: "Partial", Icon: CircleDot },
  FAIL: { color: T.red, bg: "rgba(225,29,72,.06)", label: "Failing", Icon: Circle },
  UNKNOWN: { color: T.muted, bg: "rgba(168,157,200,.1)", label: "Unknown", Icon: Circle },
};
const RISK = { LOW: T.green, MEDIUM: T.amber, HIGH: T.red };

const cardBase = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 16 };
const authHdr = token => ({ Authorization: `Bearer ${token}` });

export default function AutomationHub({ token, tenantId }) {
  const [tab, setTab] = useState("scan");

  // scan state
  const [summary, setSummary] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlyRemediable, setOnlyRemediable] = useState(false);
  const [fixed, setFixed] = useState({}); // control_id -> rollback_token

  // remediation modal
  const [modal, setModal] = useState(null); // {finding, preview, applying, applied}

  // policies
  const [policyTypes, setPolicyTypes] = useState([]);
  const [genPolicy, setGenPolicy] = useState(null);
  const [genKey, setGenKey] = useState(null);

  // evidence
  const [artifacts, setArtifacts] = useState([]);
  const [collecting, setCollecting] = useState(false);

  const scan = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/automation/scan?tenant_id=${tenantId || "demo"}`, { headers: authHdr(token) }).then(x => x.json());
      setSummary(r.summary); setFindings(r.findings || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [token, tenantId]);

  const loadPolicyTypes = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/automation/policies/types`, { headers: authHdr(token) }).then(x => x.json());
      setPolicyTypes(r.policies || []);
    } catch (e) { console.error(e); }
  }, [token]);

  useEffect(() => { scan(); loadPolicyTypes(); }, [scan, loadPolicyTypes]);

  // ── remediation flow ──
  const openFix = async finding => {
    setModal({ finding, preview: null, applying: false, applied: null });
    try {
      const preview = await fetch(`${API}/api/automation/remediate`, {
        method: "POST", headers: { ...authHdr(token), "Content-Type": "application/json" },
        body: JSON.stringify({ control_id: finding.control_id, dry_run: true, approved: false }),
      }).then(x => x.json());
      setModal(m => m && { ...m, preview });
    } catch { setModal(m => m && { ...m, preview: { error: "Preview failed" } }); }
  };

  const applyFix = async () => {
    if (!modal) return;
    setModal(m => ({ ...m, applying: true }));
    try {
      const applied = await fetch(`${API}/api/automation/remediate`, {
        method: "POST", headers: { ...authHdr(token), "Content-Type": "application/json" },
        body: JSON.stringify({ control_id: modal.finding.control_id, dry_run: false, approved: true }),
      }).then(x => x.json());
      setModal(m => ({ ...m, applying: false, applied }));
      if (applied.rollback_token) setFixed(f => ({ ...f, [modal.finding.control_id]: applied.rollback_token }));
    } catch { setModal(m => ({ ...m, applying: false, applied: { error: "Apply failed" } })); }
  };

  const undoFix = async (controlId) => {
    const tokenRb = fixed[controlId];
    if (!tokenRb) return;
    try {
      await fetch(`${API}/api/automation/rollback`, {
        method: "POST", headers: { ...authHdr(token), "Content-Type": "application/json" },
        body: JSON.stringify({ rollback_token: tokenRb }),
      });
      setFixed(f => { const n = { ...f }; delete n[controlId]; return n; });
    } catch (e) { console.error(e); }
  };

  // ── policy flow ──
  const generate = async key => {
    setGenKey(key); setGenPolicy(null);
    try {
      const p = await fetch(`${API}/api/automation/policies/generate`, {
        method: "POST", headers: { ...authHdr(token), "Content-Type": "application/json" },
        body: JSON.stringify({ policy_key: key, company_context: { company_name: "DemoCorp Technologies" } }),
      }).then(x => x.json());
      setGenPolicy(p);
    } catch { setGenPolicy({ error: "Generation failed" }); }
    setGenKey(null);
  };

  // ── evidence flow ──
  const collectEvidence = async () => {
    setCollecting(true);
    try {
      const r = await fetch(`${API}/api/automation/evidence?tenant_id=${tenantId || "demo"}`, { headers: authHdr(token) }).then(x => x.json());
      setArtifacts(r.artifacts || []);
    } catch (e) { console.error(e); }
    setCollecting(false);
  };

  const TABS = [
    { id: "scan", label: "Scan & Fix", Icon: ScanLine },
    { id: "policies", label: "AI Policies", Icon: FileText },
    { id: "evidence", label: "Evidence", Icon: Paperclip },
  ];

  const shown = onlyRemediable ? findings.filter(f => f.remediable) : findings;

  return (
    <div style={{ padding: "28px 32px", fontFamily: "'DM Sans',sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#7c3aed,#db2777)", borderRadius: 7, padding: "4px 11px", fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: ".3px" }}>
              <Sparkles size={12} /> AUTOMATION
            </span>
            <span style={{ background: "rgba(22,163,74,.1)", color: T.green, border: "1px solid rgba(22,163,74,.2)", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>Live engine</span>
          </div>
          <h2 style={{ fontFamily: T.display, fontSize: 25, fontWeight: 800, color: T.ink, marginBottom: 4, letterSpacing: "-.3px" }}>Automation Hub</h2>
          <p style={{ color: T.muted, fontSize: 13 }}>One-click remediation · AI-drafted policies · auto-collected evidence — across every integration</p>
        </div>
        <button onClick={scan}
          onMouseEnter={e => e.currentTarget.style.borderColor = T.borderHi}
          onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(124,58,237,.15)"}
          style={{ padding: "10px 16px", background: "#fff", border: "1px solid rgba(124,58,237,.15)", borderRadius: 10, color: T.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "border-color .15s" }}>
          <RefreshCw size={14} style={loading ? { animation: "spin 1s linear infinite" } : undefined} /> Re-scan
        </button>
      </div>

      {/* Stat cards */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Controls scanned", value: summary.total, color: T.accent },
            { label: "Passing", value: summary.passing, color: T.green },
            { label: "Remediable", value: summary.remediable, color: T.amber },
            { label: "Auto-fix (low risk)", value: summary.auto_fixable_low_risk, color: T.green },
            { label: "Integrations", value: summary.providers?.length || 0, color: T.accent },
          ].map(s => (
            <div key={s.label} style={{ ...cardBase, borderRadius: 12, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: s.color }} />
              <div style={{ fontFamily: T.display, fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: ".5px", marginTop: 5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, borderBottom: `1px solid ${T.border}` }}>
        {TABS.map(({ id, label, Icon }) => {
          const on = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: on ? T.accent : T.text2, borderBottom: `2px solid ${on ? T.accent : "transparent"}`, marginBottom: -1, transition: "color .15s" }}>
              <Icon size={15} /> {label}
            </button>
          );
        })}
      </div>

      {/* ═══════ SCAN & FIX ═══════ */}
      {tab === "scan" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <button onClick={() => setOnlyRemediable(v => !v)}
              style={{ padding: "6px 13px", borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid", borderColor: onlyRemediable ? "rgba(124,58,237,.4)" : "rgba(124,58,237,.12)", background: onlyRemediable ? "rgba(124,58,237,.1)" : "#fff", color: onlyRemediable ? T.accent : T.text2 }}>
              {onlyRemediable ? "Showing remediable only" : "Show remediable only"}
            </button>
            <span style={{ fontSize: 12, color: T.muted }}>{shown.length} controls</span>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: T.muted }}><RefreshCw size={22} style={{ animation: "spin 1s linear infinite" }} /><div style={{ marginTop: 12, fontSize: 13 }}>Scanning all integrations…</div></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {shown.map(f => {
                const stt = STATE[f.state?.status] || STATE.UNKNOWN;
                const StIcon = stt.Icon;
                const isFixed = !!fixed[f.control_id];
                return (
                  <div key={f.control_id} style={{ ...cardBase, borderRadius: 11, padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color: T.accent, background: "rgba(124,58,237,.07)", borderRadius: 5, padding: "3px 8px" }}>
                        <Cloud size={11} /> {provLabel(f.provider)}
                      </span>
                      <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, minWidth: 64 }}>{f.control_id}</span>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{f.title}</div>
                        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{f.framework} · {f.state?.detail}</div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: RISK[f.risk], background: `${RISK[f.risk]}14`, borderRadius: 4, padding: "2px 7px" }}>{f.risk}</span>
                      {isFixed ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(22,163,74,.1)", color: T.green, borderRadius: 100, padding: "4px 11px", fontSize: 11, fontWeight: 700 }}><CircleCheck size={12} /> Fixed</span>
                          <button onClick={() => undoFix(f.control_id)} title="Undo" style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "1px solid rgba(124,58,237,.15)", borderRadius: 8, padding: "4px 9px", fontSize: 11, color: T.text2, fontWeight: 600, cursor: "pointer" }}><Undo2 size={12} /> Undo</button>
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, background: stt.bg, color: stt.color, borderRadius: 100, padding: "4px 11px", fontSize: 11, fontWeight: 700, minWidth: 96 }}><StIcon size={12} /> {stt.label}</span>
                          {f.remediable && (
                            <button onClick={() => openFix(f)} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "linear-gradient(135deg,#7c3aed,#db2777)", border: "none", borderRadius: 8, padding: "6px 13px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 3px 10px rgba(124,58,237,.25)" }}><Zap size={12} /> Fix</button>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════ AI POLICIES ═══════ */}
      {tab === "policies" && (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {policyTypes.map(p => (
              <div key={p.key} style={{ ...cardBase, padding: "16px 18px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 4 }}>{p.title}</div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>{p.frameworks.join(" · ")} · {p.section_count} sections</div>
                <button onClick={() => generate(p.key)} disabled={genKey === p.key}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, background: genKey === p.key ? "rgba(124,58,237,.4)" : "linear-gradient(135deg,#7c3aed,#db2777)", border: "none", borderRadius: 8, padding: "7px 14px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: genKey === p.key ? "default" : "pointer" }}>
                  {genKey === p.key ? <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> Drafting…</> : <><Sparkles size={12} /> Generate with AI</>}
                </button>
              </div>
            ))}
          </div>

          <div style={{ ...cardBase, padding: 28, minHeight: 320 }}>
            {!genPolicy && (
              <div style={{ textAlign: "center", color: T.muted, paddingTop: 70 }}>
                <FileText size={32} style={{ opacity: .3 }} />
                <p style={{ marginTop: 12, fontSize: 13 }}>Pick a policy on the left and AURA drafts it from your live stack.</p>
              </div>
            )}
            {genPolicy?.error && <div style={{ color: T.red }}>{genPolicy.error}</div>}
            {genPolicy && !genPolicy.error && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, gap: 12, flexWrap: "wrap" }}>
                  <h3 style={{ fontFamily: T.display, fontSize: 20, fontWeight: 800, color: T.ink, margin: 0 }}>{genPolicy.title}</h3>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, borderRadius: 100, padding: "4px 10px", background: genPolicy.generated_by === "ai" ? "rgba(124,58,237,.1)" : "rgba(168,157,200,.14)", color: genPolicy.generated_by === "ai" ? T.accent : T.text2 }}>
                    {genPolicy.generated_by === "ai" ? <><Sparkles size={11} /> AI-drafted</> : "Template"}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: T.muted, marginBottom: 18 }}>{genPolicy.company} · v{genPolicy.version} · effective {genPolicy.effective_date} · {genPolicy.frameworks?.join(", ")}</div>
                {genPolicy.sections?.map((s, i) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: T.display, fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 5 }}>{i + 1}. {s.heading}</div>
                    <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.6, margin: 0 }}>{s.body}</p>
                  </div>
                ))}
                <button style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, background: "#fff", border: "1px solid rgba(124,58,237,.15)", borderRadius: 9, padding: "8px 14px", color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}><Download size={13} /> Export</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ EVIDENCE ═══════ */}
      {tab === "evidence" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, color: T.text2 }}>{artifacts.length ? `${artifacts.length} evidence artifacts collected` : "Auto-collect evidence for every control in one click."}</div>
            <button onClick={collectEvidence} disabled={collecting}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#7c3aed,#db2777)", border: "none", borderRadius: 9, padding: "9px 16px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: collecting ? "default" : "pointer", boxShadow: "0 4px 14px rgba(124,58,237,.25)" }}>
              {collecting ? <><RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> Collecting…</> : <><Play size={13} /> Collect all evidence</>}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {artifacts.map(a => (
              <div key={a.artifact_id} style={{ ...cardBase, borderRadius: 11, padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <Paperclip size={15} color={T.accent} style={{ flexShrink: 0 }} />
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color: T.accent, background: "rgba(124,58,237,.07)", borderRadius: 5, padding: "3px 8px" }}><Cloud size={11} /> {provLabel(a.provider)}</span>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, minWidth: 64 }}>{a.control_id}</span>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>{a.description}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2, fontFamily: T.mono }}>{a.preview}</div>
                </div>
                <span style={{ fontSize: 10, color: T.text2, background: "rgba(124,58,237,.06)", borderRadius: 5, padding: "3px 8px", fontWeight: 600 }}>{a.evidence_type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════ REMEDIATION MODAL ═══════ */}
      {modal && (
        <div onClick={e => e.target === e.currentTarget && setModal(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(26,10,58,0.45)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", border: `1px solid ${T.borderHi}`, borderRadius: 16, padding: 26, width: "100%", maxWidth: 520, boxShadow: "0 20px 60px rgba(26,10,58,.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: T.accent, fontWeight: 700 }}>{modal.finding.control_id}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: RISK[modal.finding.risk], background: `${RISK[modal.finding.risk]}14`, borderRadius: 4, padding: "2px 7px" }}>{modal.finding.risk} RISK</span>
                </div>
                <h3 style={{ fontFamily: T.display, fontSize: 17, fontWeight: 800, color: T.ink, margin: 0 }}>{modal.finding.title}</h3>
              </div>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><X size={18} /></button>
            </div>

            <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>{provLabel(modal.finding.provider)} · {modal.finding.framework}</div>

            {!modal.applied && (
              <>
                <div style={{ background: "rgba(124,58,237,.04)", border: `1px solid ${T.border}`, borderRadius: 11, padding: "14px 16px", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.text2, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>Proposed action</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 4 }}>{modal.finding.remediation_action}</div>
                  <div style={{ fontSize: 12, color: T.text2, lineHeight: 1.5 }}>{modal.finding.remediation_desc}</div>
                </div>

                {!modal.preview && <div style={{ textAlign: "center", color: T.muted, padding: "10px 0 16px" }}><RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} /><div style={{ fontSize: 12, marginTop: 8 }}>Generating preview…</div></div>}

                {modal.preview && !modal.preview.error && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, fontSize: 13 }}>
                    <span style={{ background: "rgba(225,29,72,.08)", color: T.red, borderRadius: 8, padding: "8px 14px", fontWeight: 600, flex: 1, textAlign: "center" }}>{modal.preview.before}</span>
                    <span style={{ color: T.muted }}>→</span>
                    <span style={{ background: "rgba(22,163,74,.1)", color: T.green, borderRadius: 8, padding: "8px 14px", fontWeight: 600, flex: 1, textAlign: "center" }}>{modal.preview.after}</span>
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: modal.finding.reversible ? T.green : T.amber, marginBottom: 16 }}>
                  {modal.finding.reversible ? <CircleCheck size={13} /> : <AlertTriangle size={13} />}
                  {modal.finding.reversible ? "Reversible — you can undo this instantly after applying." : "Not auto-reversible — review carefully before applying."}
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button onClick={() => setModal(null)} style={{ background: "#fff", border: "1px solid rgba(124,58,237,.15)", borderRadius: 9, padding: "9px 16px", color: T.text2, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                  <button onClick={applyFix} disabled={!modal.preview || modal.applying || modal.preview?.error}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, background: (!modal.preview || modal.applying) ? "rgba(124,58,237,.4)" : "linear-gradient(135deg,#7c3aed,#db2777)", border: "none", borderRadius: 9, padding: "9px 18px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: (!modal.preview || modal.applying) ? "default" : "pointer" }}>
                    {modal.applying ? <><RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> Applying…</> : <><ShieldCheck size={14} /> Approve & apply</>}
                  </button>
                </div>
              </>
            )}

            {modal.applied && !modal.applied.error && (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(22,163,74,.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}><CircleCheck size={28} color={T.green} /></div>
                <h3 style={{ fontFamily: T.display, fontSize: 17, fontWeight: 800, color: T.ink, marginBottom: 6 }}>Remediation applied</h3>
                <p style={{ fontSize: 13, color: T.text2, marginBottom: 16 }}>{modal.finding.title} is now compliant. This action is logged and reversible.</p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button onClick={() => { undoFix(modal.finding.control_id); setModal(null); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid rgba(124,58,237,.15)", borderRadius: 9, padding: "9px 16px", color: T.text2, fontSize: 13, fontWeight: 600, cursor: "pointer" }}><Undo2 size={13} /> Undo</button>
                  <button onClick={() => setModal(null)} style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)", border: "none", borderRadius: 9, padding: "9px 18px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Done</button>
                </div>
              </div>
            )}
            {modal.applied?.error && <div style={{ color: T.red, textAlign: "center" }}>{modal.applied.error}</div>}
          </div>
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
