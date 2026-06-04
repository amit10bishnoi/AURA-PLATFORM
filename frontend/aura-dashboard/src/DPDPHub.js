import { useState, useEffect, useCallback } from "react";
import {
  Lock, RefreshCw, AlertTriangle, Plus, Clock, ListChecks, ShieldCheck,
  Inbox, Database, CircleCheck, CircleDot, Circle,
} from "lucide-react";

const API = "http://localhost:8000";

/* ─── Theme tokens (aligned with App.js + SOC2Hub + RBIHub) ─────────────── */
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

const STATUS = {
  IMPLEMENTED: { color: "#16a34a", bg: "rgba(22,163,74,.08)", label: "Implemented", Icon: CircleCheck },
  IN_PROGRESS: { color: "#d97706", bg: "rgba(217,119,6,.08)", label: "In Progress", Icon: CircleDot },
  NOT_STARTED: { color: "#e11d48", bg: "rgba(225,29,72,.06)", label: "Not Started", Icon: Circle },
};
const SENS_COLOR = { CRITICAL: "#e11d48", HIGH: "#ea580c", MEDIUM: "#d97706", LOW: "#16a34a" };

function ScoreRing({ score, size = 120 }) {
  const r = 42, circ = 2 * Math.PI * r, offset = circ - (score / 100) * circ;
  const color = score >= 80 ? T.green : score >= 60 ? T.amber : T.red;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(124,58,237,.1)" strokeWidth="7" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 50 50)" style={{ transition: "stroke-dashoffset 1.2s ease" }} />
      <text x="50" y="47" textAnchor="middle" fontSize="20" fontWeight="800" fontFamily={T.display} fill={color}>{score}%</text>
      <text x="50" y="61" textAnchor="middle" fontSize="7.5" letterSpacing="0.5" fill={T.muted} fontFamily="'DM Sans',sans-serif">DPDP READY</text>
    </svg>
  );
}

export default function DPDPHub({ token, tenantId }) {
  const [tab, setTab] = useState("overview");
  const [obligations, setObligations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [consent, setConsent] = useState(null);
  const [dsr, setDsr] = useState(null);
  const [dataCategories, setDataCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const [oRes, rRes, cRes, dsrRes, dcRes] = await Promise.all([
        fetch(`${API}/api/dpdp/obligations?tenant_id=${tenantId || "tenant_533ed68d0977"}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/dpdp/readiness?tenant_id=${tenantId || "tenant_533ed68d0977"}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/dpdp/consent?tenant_id=${tenantId || "tenant_533ed68d0977"}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/dpdp/dsr?tenant_id=${tenantId || "tenant_533ed68d0977"}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/dpdp/data-categories?tenant_id=${tenantId || "tenant_533ed68d0977"}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const oData = await oRes.json(); const rData = await rRes.json(); const cData = await cRes.json(); const dsrData = await dsrRes.json(); const dcData = await dcRes.json();
      setObligations(oData.obligations || []); setSummary(oData.summary || {}); setReadiness(rData); setConsent(cData); setDsr(dsrData); setDataCategories(dcData.categories || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [token, tenantId]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const TABS = [
    { id: "overview", label: "Overview", Icon: Lock },
    { id: "obligations", label: "Obligations", Icon: ListChecks },
    { id: "consent", label: "Consent", Icon: ShieldCheck },
    { id: "dsr", label: "Data Requests", Icon: Inbox },
    { id: "data", label: "Data Inventory", Icon: Database },
  ];

  const cardBase = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 16 };

  return (
    <div style={{ padding: "28px 32px", fontFamily: "'DM Sans',sans-serif" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#7c3aed,#db2777)", borderRadius: 7, padding: "4px 11px", fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: ".3px" }}>
              <Lock size={12} /> DPDP ACT 2023
            </span>
            <span style={{ background: "rgba(225,29,72,.1)", color: T.red, border: "1px solid rgba(225,29,72,.2)", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>Deadline: May 2027</span>
          </div>
          <h2 style={{ fontFamily: T.display, fontSize: 25, fontWeight: 800, color: T.ink, marginBottom: 4, letterSpacing: "-.3px" }}>DPDP Privacy Management</h2>
          <p style={{ color: T.muted, fontSize: 13 }}>Digital Personal Data Protection Act 2023 · Consent Management · Data Principal Rights · Breach Notification</p>
        </div>
        <button onClick={fetch_}
          onMouseEnter={e => e.currentTarget.style.borderColor = T.borderHi}
          onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(124,58,237,.15)"}
          style={{ padding: "10px 16px", background: "#fff", border: "1px solid rgba(124,58,237,.15)", borderRadius: 10, color: T.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "border-color .15s" }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Penalty banner ── */}
      <div style={{ background: "rgba(225,29,72,.04)", border: "1px solid rgba(225,29,72,.15)", borderRadius: 12, padding: "12px 18px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={16} color={T.red} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: T.ink, lineHeight: 1.5 }}><strong>Maximum penalty: ₹250 crore per violation.</strong> Rules enforced from May 2027. Start compliance now.</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.red }}>~104 weeks left</span>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, borderBottom: `1px solid ${T.border}`, flexWrap: "wrap" }}>
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

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: T.muted }}>
          <RefreshCw size={22} style={{ animation: "spin 1s linear infinite" }} />
          <div style={{ marginTop: 12, fontSize: 13 }}>Loading DPDP compliance data…</div>
        </div>
      ) : (
        <>
          {/* ════════ OVERVIEW ════════ */}
          {tab === "overview" && readiness && summary && (
            <div>
              <div style={{ ...cardBase, display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr 1fr", gap: 20, marginBottom: 18, padding: 26, alignItems: "center" }}>
                <div style={{ paddingRight: 24, borderRight: `1px solid ${T.border}` }}><ScoreRing score={readiness.score || 0} /></div>
                {[
                  { label: "Implemented", value: summary.implemented || 0, color: T.green },
                  { label: "In Progress", value: summary.in_progress || 0, color: T.amber },
                  { label: "Not Started", value: summary.not_started || 0, color: T.red },
                  { label: "Max Penalty", value: "₹250Cr", color: T.red },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: T.display, fontSize: 32, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: ".5px", marginTop: 6 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {dsr && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
                  {[
                    { label: "Pending DSRs", value: dsr.pending, color: T.amber },
                    { label: "Overdue DSRs", value: dsr.overdue, color: T.red },
                    { label: "SLA Window", value: "48 hrs", color: T.accent },
                    { label: "Consent Withdrawals", value: consent?.total_withdrawals || 0, color: T.orange },
                  ].map(s => (
                    <div key={s.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: s.color }} />
                      <div style={{ fontFamily: T.display, fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: ".5px", marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {readiness.critical_gaps?.length > 0 && (
                <div style={{ background: "rgba(225,29,72,.04)", border: "1px solid rgba(225,29,72,.15)", borderRadius: 16, padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <AlertTriangle size={16} color={T.red} />
                    <span style={{ fontFamily: T.display, fontSize: 14, fontWeight: 700, color: T.ink }}>Critical DPDP gaps — high penalty risk</span>
                  </div>
                  {(readiness.top_gaps || []).map(g => (
                    <div key={g.id} style={{ background: "#fff", border: "1px solid rgba(225,29,72,.1)", borderRadius: 9, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 2 }}>{g.obligation}</div>
                        <div style={{ fontSize: 10, color: T.muted }}>{g.id} · Penalty: {g.penalty}</div>
                      </div>
                      <button onClick={() => setTab("obligations")} style={{ padding: "5px 12px", background: "rgba(225,29,72,.08)", border: "1px solid rgba(225,29,72,.2)", borderRadius: 6, color: T.red, fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0, marginLeft: 12 }}>Fix →</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════════ OBLIGATIONS ════════ */}
          {tab === "obligations" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {obligations.map(o => {
                const st = STATUS[o.status] || STATUS.NOT_STARTED;
                const StIcon = st.Icon;
                return (
                  <div key={o.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 11, padding: "14px 18px", transition: "border-color .15s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(124,58,237,.25)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <span style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, minWidth: 70, flexShrink: 0, paddingTop: 2 }}>{o.id}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: T.ink, marginBottom: 5 }}>{o.obligation}</div>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, color: T.accent, fontWeight: 600 }}>{o.section}</span>
                          <span style={{ fontSize: 10, color: T.red }}>Penalty: {o.penalty}</span>
                          <span style={{ fontSize: 10, color: T.muted }}>Owner: {o.owner}</span>
                        </div>
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, background: st.bg, color: st.color, borderRadius: 100, padding: "4px 11px", fontSize: 11, fontWeight: 700, minWidth: 116, flexShrink: 0 }}>
                        <StIcon size={12} /> {st.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ════════ CONSENT ════════ */}
          {tab === "consent" && consent && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Total Data Principals", value: consent.total_data_principals?.toLocaleString("en-IN"), color: T.accent },
                  { label: "Consent Withdrawals", value: consent.total_withdrawals, color: T.orange },
                  { label: "Withdrawal Rate", value: `${consent.withdrawal_rate}%`, color: consent.withdrawal_rate > 5 ? T.red : T.green },
                ].map(s => (
                  <div key={s.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px" }}>
                    <div style={{ fontFamily: T.display, fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: ".5px", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {consent.records?.map(r => (
                  <div key={r.id} style={{ background: T.card, border: `1px solid ${r.status === "REVIEW_NEEDED" ? "rgba(217,119,6,.2)" : T.border}`, borderRadius: 12, padding: "16px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, marginBottom: 2 }}>{r.purpose}</div>
                        <div style={{ fontSize: 11, color: T.muted }}>Active since: {new Date(r.consent_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                      </div>
                      <span style={{ background: r.status === "ACTIVE" ? "rgba(22,163,74,.1)" : "rgba(217,119,6,.1)", color: r.status === "ACTIVE" ? T.green : T.amber, borderRadius: 100, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{r.status === "ACTIVE" ? "Active" : "Review Needed"}</span>
                    </div>
                    <div style={{ display: "flex", gap: 20 }}>
                      <span style={{ fontSize: 12, color: T.text2 }}>{r.data_principals?.toLocaleString("en-IN")} principals</span>
                      <span style={{ fontSize: 12, color: T.orange }}>{r.withdrawal_requests} withdrawals</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════ DATA REQUESTS (DSR) ════════ */}
          {tab === "dsr" && dsr && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
                <div style={{ fontSize: 13, color: T.text2 }}>{dsr.pending} pending requests · SLA: {dsr.sla_hours} hours · {dsr.overdue} overdue</div>
                <button style={{ padding: "9px 16px", background: "linear-gradient(135deg,#7c3aed,#db2777)", border: "none", borderRadius: 9, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 14px rgba(124,58,237,.25)" }}><Plus size={12} /> New Request</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {dsr.requests?.map(r => {
                  const overdue = r.status === "PENDING" && r.deadline < new Date().toISOString();
                  const hoursLeft = Math.round((new Date(r.deadline) - new Date()) / 3600000);
                  const st = STATUS[r.status];
                  const StIcon = st?.Icon || Circle;
                  return (
                    <div key={r.id} style={{ background: T.card, border: `1px solid ${overdue ? "rgba(225,29,72,.2)" : T.border}`, borderRadius: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted }}>{r.id}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{r.type}</span>
                          {overdue && <span style={{ background: "rgba(225,29,72,.1)", color: T.red, borderRadius: 4, padding: "2px 6px", fontSize: 9, fontWeight: 700 }}>OVERDUE</span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.muted }}>
                          <Clock size={11} />{overdue ? "Overdue" : `${Math.max(0, hoursLeft)}h remaining`}
                        </div>
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: st?.bg || "#f5f3ff", color: st?.color || T.accent, borderRadius: 100, padding: "5px 12px", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        <StIcon size={12} /> {r.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════════ DATA INVENTORY ════════ */}
          {tab === "data" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {dataCategories.map(dc => (
                <div key={dc.id} style={{ background: T.card, border: `1px solid ${dc.status === "NEEDS_ATTENTION" ? "rgba(225,29,72,.2)" : dc.status === "REVIEW_NEEDED" ? "rgba(217,119,6,.2)" : T.border}`, borderRadius: 12, padding: "18px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 2 }}>{dc.category}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>{dc.examples}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                      <span style={{ background: `${SENS_COLOR[dc.sensitivity]}14`, color: SENS_COLOR[dc.sensitivity], borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{dc.sensitivity}</span>
                      <span style={{ background: dc.status === "MAPPED" ? "rgba(22,163,74,.1)" : dc.status === "REVIEW_NEEDED" ? "rgba(217,119,6,.1)" : "rgba(225,29,72,.1)", color: dc.status === "MAPPED" ? T.green : dc.status === "REVIEW_NEEDED" ? T.amber : T.red, borderRadius: 100, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{dc.status.replace("_", " ")}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: T.text2 }}>Volume: {dc.volume_estimate}</span>
                    <span style={{ fontSize: 11, color: T.text2 }}>Retention: {dc.retention_policy}</span>
                    <span style={{ fontSize: 11, color: T.text2 }}>Basis: {dc.legal_basis}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
