import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw, AlertTriangle, Download, Landmark, ListChecks, Zap, Siren,
  CircleCheck, CircleDot, Circle, Clock,
} from "lucide-react";

const API = "https://web-production-320c3.up.railway.app";

/* ─── Theme tokens (aligned with App.js + SOC2Hub) ─────────────── */
const T = {
  accent: "#7c3aed",
  amber: "#d97706",
  amber2: "#ea580c",
  ink: "#1a0a3a",
  muted: "#a89dc8",
  text2: "#6b5b9e",
  green: "#16a34a",
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
const PRI = { CRITICAL: "#e11d48", HIGH: "#ea580c", MEDIUM: "#d97706", LOW: "#16a34a" };

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
      <text x="50" y="61" textAnchor="middle" fontSize="7.5" letterSpacing="0.5" fill={T.muted} fontFamily="'DM Sans',sans-serif">RBI READY</text>
    </svg>
  );
}

export default function RBIHub({ token, tenantId }) {
  const [tab, setTab] = useState("overview");
  const [controls, setControls] = useState([]);
  const [summary, setSummary] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [certIn, setCertIn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, rRes, ciRes] = await Promise.all([
        fetch(`${API}/api/rbi/controls?tenant_id=${tenantId || "tenant_533ed68d0977"}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/rbi/readiness?tenant_id=${tenantId || "tenant_533ed68d0977"}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/rbi/cert-in?tenant_id=${tenantId || "tenant_533ed68d0977"}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const cData = await cRes.json();
      const rData = await rRes.json();
      const ciData = await ciRes.json();
      setControls(cData.controls || []);
      setSummary(cData.summary || {});
      setReadiness(rData);
      setCertIn(ciData);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [token, tenantId]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const frameworks = [...new Set(controls.map(c => c.framework))];

  const TABS = [
    { id: "overview", label: "Overview", Icon: Landmark },
    { id: "controls", label: "Controls", Icon: ListChecks },
    { id: "cert-in", label: "CERT-In", Icon: Zap },
    { id: "reporting", label: "Incident Reporting", Icon: Siren },
  ];

  const cardBase = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 16 };

  return (
    <div style={{ padding: "28px 32px", fontFamily: "'DM Sans',sans-serif" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#d97706,#ea580c)", borderRadius: 7, padding: "4px 11px", fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: ".3px" }}>
              <Landmark size={12} /> RBI COMPLIANCE
            </span>
            {readiness && (
              <span style={{ background: `${readiness.color}14`, color: readiness.color, border: `1px solid ${readiness.color}30`, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                {readiness.label}
              </span>
            )}
          </div>
          <h2 style={{ fontFamily: T.display, fontSize: 25, fontWeight: 800, color: T.ink, marginBottom: 4, letterSpacing: "-.3px" }}>RBI Compliance Center</h2>
          <p style={{ color: T.muted, fontSize: 13 }}>RBI Cyber Security Framework · IT Governance · Digital Lending · CERT-In Directions 2022</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={fetch_}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.borderHi}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(124,58,237,.15)"}
            style={{ padding: "10px 16px", background: "#fff", border: "1px solid rgba(124,58,237,.15)", borderRadius: 10, color: T.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "border-color .15s" }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "none"}
            style={{ padding: "10px 18px", background: "linear-gradient(135deg,#d97706,#ea580c)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(217,119,6,.28)", transition: "transform .15s" }}>
            <Download size={14} /> RBI Report
          </button>
        </div>
      </div>

      {/* ── Tab bar ── */}
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

      {loading && (
        <div style={{ textAlign: "center", padding: 60, color: T.muted }}>
          <RefreshCw size={22} style={{ animation: "spin 1s linear infinite" }} />
          <div style={{ marginTop: 12, fontSize: 13 }}>Loading RBI compliance data…</div>
        </div>
      )}

      {/* ════════ OVERVIEW ════════ */}
      {!loading && tab === "overview" && readiness && summary && (
        <div>
          <div style={{ ...cardBase, display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr 1fr", gap: 20, marginBottom: 18, padding: 26, alignItems: "center" }}>
            <div style={{ paddingRight: 24, borderRight: `1px solid ${T.border}` }}>
              <ScoreRing score={readiness.score || 0} />
            </div>
            {[
              { label: "Implemented", value: summary.implemented || 0, color: T.green },
              { label: "In Progress", value: summary.in_progress || 0, color: T.amber },
              { label: "Not Started", value: summary.not_started || 0, color: T.red },
              { label: "CERT-In Score", value: `${certIn?.score || 0}%`, color: T.accent },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: T.display, fontSize: 38, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: ".5px", marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 18 }}>
            {[
              { fw: "RBI CSF 2016", desc: "Cyber Security Framework", color: "#d97706" },
              { fw: "RBI IT Governance", desc: "IT Governance Guidelines", color: "#7c3aed" },
              { fw: "RBI Digital Lending", desc: "Digital Lending Guidelines", color: "#0891b2" },
            ].map(f => {
              const fwControls = controls.filter(c => c.framework === f.fw);
              const done = fwControls.filter(c => c.status === "IMPLEMENTED").length;
              const pct = fwControls.length ? Math.round(done / fwControls.length * 100) : 0;
              return (
                <div key={f.fw} onClick={() => setTab("controls")}
                  style={{ background: T.card, border: `1px solid ${f.color}20`, borderRadius: 14, padding: 20, cursor: "pointer", position: "relative", overflow: "hidden", transition: "all .2s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = `${f.color}45`; e.currentTarget.style.boxShadow = `0 6px 18px ${f.color}1a`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = `${f.color}20`; e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${f.color},${f.color}50)` }} />
                  <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 4 }}>{f.fw}</div>
                  <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>{f.desc}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: T.text2 }}>{done}/{fwControls.length} done</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: f.color }}>{pct}%</span>
                  </div>
                  <div style={{ height: 5, background: `${f.color}15`, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: f.color, borderRadius: 2, transition: "width 1s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {(Array.isArray(readiness.critical_gaps) ? readiness.critical_gaps.length : readiness.critical_gaps || 0) > 0 && (
            <div style={{ background: "rgba(225,29,72,.04)", border: "1px solid rgba(225,29,72,.15)", borderRadius: 16, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <AlertTriangle size={16} color={T.red} />
                <span style={{ fontFamily: T.display, fontSize: 14, fontWeight: 700, color: T.ink }}>Critical RBI gaps — must fix immediately</span>
              </div>
              {(Array.isArray(readiness.critical_gaps) ? readiness.critical_gaps : readiness.critical_gaps_list || []).map(gap => (
                <div key={gap.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#fff", borderRadius: 9, marginBottom: 8, border: "1px solid rgba(225,29,72,.1)" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>{gap.name}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>{gap.category} · {gap.id}</div>
                  </div>
                  <button onClick={() => setTab("controls")} style={{ padding: "5px 12px", background: "rgba(225,29,72,.08)", border: "1px solid rgba(225,29,72,.2)", borderRadius: 6, color: T.red, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Fix →</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════ CONTROLS ════════ */}
      {!loading && tab === "controls" && (
        <div>
          {frameworks.map(fw => (
            <div key={fw} style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>{fw}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {controls.filter(c => c.framework === fw).map(c => {
                  const st = STATUS[c.status] || STATUS.NOT_STARTED;
                  const StIcon = st.Icon;
                  return (
                    <div key={c.id} onClick={() => setExpanded(e => ({ ...e, [c.id]: !e[c.id] }))}
                      style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 11, padding: "12px 16px", cursor: "pointer", transition: "border-color .15s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(124,58,237,.25)"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, minWidth: 90 }}>{c.id}</span>
                        <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: T.ink }}>{c.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: PRI[c.priority], background: `${PRI[c.priority]}14`, borderRadius: 4, padding: "2px 6px" }}>{c.priority}</span>
                          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, background: st.bg, color: st.color, borderRadius: 100, padding: "4px 11px", fontSize: 11, fontWeight: 700, minWidth: 116 }}>
                            <StIcon size={12} /> {st.label}
                          </span>
                        </div>
                      </div>
                      {expanded[c.id] && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed rgba(124,58,237,.12)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                          <div><div style={{ fontSize: 10, color: T.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: ".4px" }}>Owner</div><div style={{ fontSize: 13, color: T.ink, fontWeight: 500 }}>{c.owner}</div></div>
                          <div><div style={{ fontSize: 10, color: T.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: ".4px" }}>Category</div><div style={{ fontSize: 13, color: T.ink, fontWeight: 500 }}>{c.category}</div></div>
                          <div><div style={{ fontSize: 10, color: T.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: ".4px" }}>Evidence</div><div style={{ fontSize: 13, color: T.ink, fontWeight: 500 }}>{c.evidence_count} items</div></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════════ CERT-In ════════ */}
      {!loading && tab === "cert-in" && certIn && (
        <div>
          <div style={{ background: "rgba(124,58,237,.04)", border: `1px solid ${T.borderHi}`, borderRadius: 12, padding: "14px 18px", marginBottom: 20, fontSize: 13, color: T.text2, lineHeight: 1.5 }}>
            CERT-In Directions 2022 — all organisations with a digital presence in India must comply. Non-compliance carries criminal liability.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Requirements", value: certIn.total, color: T.accent },
              { label: "Implemented", value: certIn.implemented, color: T.green },
              { label: "CERT-In Score", value: `${certIn.score}%`, color: certIn.score >= 80 ? T.green : certIn.score >= 60 ? T.amber : T.red },
            ].map(s => (
              <div key={s.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ fontFamily: T.display, fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: ".5px", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {certIn.requirements?.map(r => {
              const st = STATUS[r.status] || STATUS.NOT_STARTED;
              const StIcon = st.Icon;
              return (
                <div key={r.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 4 }}>{r.name}</div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <span style={{ fontSize: 11, color: T.muted }}>Owner: {r.owner}</span>
                      <span style={{ fontSize: 11, color: T.muted }}>Deadline: {r.deadline}</span>
                    </div>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: st.bg, color: st.color, borderRadius: 100, padding: "5px 12px", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    <StIcon size={12} /> {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════ INCIDENT REPORTING ════════ */}
      {!loading && tab === "reporting" && (
        <div>
          <div style={{ background: "rgba(225,29,72,.04)", border: "1px solid rgba(225,29,72,.15)", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", gap: 12, alignItems: "center" }}>
            <AlertTriangle size={16} color={T.red} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: T.ink, lineHeight: 1.5 }}><strong>Mandatory:</strong> cyber incidents must be reported to RBI within 2–6 hours and CERT-In within 6 hours. Failure carries criminal liability under IT Act 2000.</span>
          </div>
          <div style={{ ...cardBase, padding: 22, marginBottom: 16 }}>
            <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 16 }}>Emergency contacts</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { name: "RBI CISO", contact: "chiefgm@rbi.org.in", type: "Email", when: "All cyber incidents" },
                { name: "CERT-In Hotline", contact: "+91-1800-11-4949", type: "Phone", when: "Within 6 hours" },
                { name: "CERT-In Email", contact: "incident@cert-in.org.in", type: "Email", when: "Structured incident report" },
                { name: "RBI Cybercrime", contact: "cybercrime.gov.in", type: "Web", when: "FIR + regulatory report" },
              ].map((contact, i) => (
                <div key={i} style={{ background: "rgba(124,58,237,.04)", border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 4 }}>{contact.name}</div>
                  <div style={{ fontSize: 13, color: T.accent, fontFamily: T.mono, marginBottom: 4 }}>{contact.contact}</div>
                  <div style={{ fontSize: 10, color: T.muted }}>{contact.type} · {contact.when}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...cardBase, padding: 22 }}>
            <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={16} color={T.accent} /> Reporting timeline
            </div>
            {[
              { time: "0–2 hrs", action: "Detect, contain, assess severity and scope.", color: "#e11d48" },
              { time: "2–6 hrs", action: "Report to RBI CISO via email. Report to CERT-In via portal/email.", color: "#ea580c" },
              { time: "6–24 hrs", action: "Submit structured incident report. File FIR if fraud involved.", color: "#d97706" },
              { time: "24–72 hrs", action: "Submit detailed forensic report. Begin root cause analysis.", color: "#16a34a" },
              { time: "Post-incident", action: "Submit final report with remediation actions taken.", color: "#7c3aed" },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ minWidth: 84, background: `${r.color}14`, color: r.color, borderRadius: 6, padding: "4px 8px", fontSize: 10, fontWeight: 700, textAlign: "center", flexShrink: 0 }}>{r.time}</div>
                <div style={{ fontSize: 13, color: T.ink, paddingTop: 3, lineHeight: 1.45 }}>{r.action}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
