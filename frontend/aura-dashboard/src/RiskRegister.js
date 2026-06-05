import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, RefreshCw, Plus, X, Shield, TrendingUp, TrendingDown, Siren, ListChecks, Activity } from "lucide-react";

const API = "https://web-production-320c3.up.railway.app";

/* ─── Theme tokens (aligned with App.js + the compliance hubs) ─────────────── */
const T = {
  accent: "#7c3aed",
  accent2: "#8b5cf6",
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

const SEV = {
  CRITICAL: { c: "#e11d48", bg: "rgba(225,29,72,.08)" },
  HIGH: { c: "#ea580c", bg: "rgba(234,88,12,.08)" },
  MEDIUM: { c: "#d97706", bg: "rgba(217,119,6,.08)" },
  LOW: { c: "#16a34a", bg: "rgba(22,163,74,.08)" },
};
const STATUS = {
  OPEN: { c: "#e11d48", l: "Open" },
  IN_PROGRESS: { c: "#d97706", l: "In Progress" },
  ACCEPTED: { c: "#7c3aed", l: "Accepted" },
  CLOSED: { c: "#16a34a", l: "Closed" },
};

const s = {
  wrap: { padding: "28px 32px", fontFamily: "'DM Sans',sans-serif" },
  hdr: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 },
  h2: { fontFamily: T.display, fontSize: 25, fontWeight: 800, color: T.ink, display: "flex", alignItems: "center", gap: 10, margin: 0, letterSpacing: "-.3px" },
  sub: { color: T.muted, fontSize: 13, marginTop: 6 },
  btnRow: { display: "flex", gap: 10 },
  btnGhost: { display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", background: "#fff", border: "1px solid rgba(124,58,237,.15)", borderRadius: 10, color: T.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "border-color .15s" },
  btnPrimary: { display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", background: "linear-gradient(135deg,#7c3aed,#db2777)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(124,58,237,.28)" },
  statGrid: { display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 },
  statCard: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 18px", position: "relative", overflow: "hidden" },
  statTop: { position: "absolute", top: 0, left: 0, right: 0, height: 3 },
  statVal: { fontFamily: T.display, fontSize: 24, fontWeight: 800, marginBottom: 2, lineHeight: 1.1 },
  statLbl: { fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: ".6px" },
  riskCard: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 14 },
  riskIcon: (col) => ({ width: 36, height: 36, borderRadius: 8, background: col + "1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }),
  badge: (c, bg) => ({ background: bg, color: c, borderRadius: 100, padding: "3px 10px", fontSize: 11, fontWeight: 700, display: "inline-block" }),
  modal: { position: "fixed", inset: 0, background: "rgba(26,10,58,0.45)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modalBox: { background: "#fff", border: `1px solid ${T.borderHi}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(26,10,58,.25)" },
  field: { marginBottom: 16 },
  lbl: { display: "block", fontSize: 11, fontWeight: 700, color: T.text2, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".5px" },
  input: { width: "100%", background: "#faf9ff", border: "1px solid rgba(124,58,237,.15)", borderRadius: 9, padding: "10px 14px", color: T.ink, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
};

export default function RiskRegister({ token, tenantId }) {
  const [risks, setRisks] = useState([]);
  const [score, setScore] = useState(null);
  const [trends, setTrends] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("register");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", category: "Technical", likelihood: 3, impact: 3, owner: "CISO", description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const h = { Authorization: `Bearer ${token}` };
      const tid = tenantId || "demo";
      const [r, sc, tr, inc] = await Promise.all([
        fetch(`${API}/api/risk/register?tenant_id=${tid}`, { headers: h }).then(x => x.json()),
        fetch(`${API}/api/risk/score?tenant_id=${tid}`, { headers: h }).then(x => x.json()),
        fetch(`${API}/api/risk/trends?tenant_id=${tid}`, { headers: h }).then(x => x.json()),
        fetch(`${API}/api/risk/incidents?tenant_id=${tid}`, { headers: h }).then(x => x.json()),
      ]);
      setRisks(r.risks || []); setScore(sc); setTrends(tr.trends || []); setIncidents(inc.incidents || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [token, tenantId]);

  useEffect(() => { load(); }, [load]);

  const addRisk = async () => {
    try {
      await fetch(`${API}/api/risk/register?tenant_id=${tenantId || "demo"}`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setShowAdd(false); setForm({ title: "", category: "Technical", likelihood: 3, impact: 3, owner: "CISO", description: "" }); load();
    } catch { alert("Failed to add risk"); }
  };

  const getSev = score => score >= 16 ? "CRITICAL" : score >= 10 ? "HIGH" : score >= 5 ? "MEDIUM" : "LOW";
  const maxTrend = Math.max(...trends.map(t => t.score), 1);

  const statCards = [
    { l: "Risk Score", v: score ? `${score.score}/100` : "—", c: score?.color || T.accent },
    { l: "Open Risks", v: score?.open_risks ?? 0, c: T.red },
    { l: "Critical", v: score?.critical_risks ?? 0, c: T.red },
    { l: "High Risks", v: score?.high_risks ?? 0, c: T.orange },
    { l: "Financial Exposure", v: score ? `₹${score.total_exposure_cr}Cr` : "—", c: T.accent },
  ];

  const TABS = [
    { id: "register", label: "Risk Register", Icon: ListChecks },
    { id: "incidents", label: "Incidents", Icon: Siren },
    { id: "trends", label: "Trends", Icon: Activity },
  ];

  return (
    <div style={s.wrap}>
      <div style={s.hdr}>
        <div>
          <h2 style={s.h2}><AlertTriangle size={22} color={T.red} />Risk Register & Incident Tracker</h2>
          <p style={s.sub}>FAIR-based risk quantification · financial impact in ₹Cr · RBI & CERT-In incident reporting</p>
        </div>
        <div style={s.btnRow}>
          <button onClick={load} style={s.btnGhost}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.borderHi}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(124,58,237,.15)"}><RefreshCw size={13} />Refresh</button>
          <button onClick={() => setShowAdd(true)} style={s.btnPrimary}><Plus size={13} />Add Risk</button>
        </div>
      </div>

      <div style={s.statGrid}>
        {statCards.map(st => (
          <div key={st.l} style={s.statCard}>
            <div style={{ ...s.statTop, background: st.c }} />
            <div style={{ ...s.statVal, color: st.c }}>{st.v}</div>
            <div style={s.statLbl}>{st.l}</div>
          </div>
        ))}
      </div>

      {/* Tab bar — underline style matching the hubs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, borderBottom: `1px solid ${T.border}` }}>
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
        <div style={{ textAlign: "center", padding: 60, color: T.muted }}><RefreshCw size={22} style={{ animation: "spin 1s linear infinite" }} /><p style={{ marginTop: 12, fontSize: 13 }}>Loading risks…</p></div>
      ) : (
        <>
          {tab === "register" && (
            <div>
              {risks.length === 0 && <div style={{ textAlign: "center", padding: 60, color: T.muted }}><Shield size={32} style={{ opacity: .3 }} /><p style={{ marginTop: 12 }}>No risks yet. Add your first risk above.</p></div>}
              {risks.map(r => {
                const sv = getSev(r.inherent_score); const sc_cfg = SEV[sv] || SEV.LOW; const st_cfg = STATUS[r.status] || STATUS.OPEN;
                return (
                  <div key={r.id} style={s.riskCard}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(124,58,237,.25)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                    <div style={s.riskIcon(sc_cfg.c)}><AlertTriangle size={16} color={sc_cfg.c} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.muted }}>{r.id}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{r.title}</span>
                      </div>
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: T.text2 }}>
                        <span>Category: {r.category}</span>
                        <span>Owner: {r.owner}</span>
                        <span style={{ color: T.orange }}>₹{(r.financial_impact_inr / 10000000).toFixed(1)}Cr exposure</span>
                        {(r.framework_refs || []).map(f => (
                          <span key={f} style={{ background: "rgba(124,58,237,.08)", color: T.accent, borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 600 }}>{f}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <span style={s.badge(sc_cfg.c, sc_cfg.bg)}>{sv}</span>
                      <span style={{ background: st_cfg.c + "1a", color: st_cfg.c, borderRadius: 100, padding: "2px 10px", fontSize: 10, fontWeight: 600 }}>{st_cfg.l}</span>
                      <span style={{ fontSize: 10, color: T.muted }}>Score: {r.inherent_score}/25</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "incidents" && (
            <div>
              {incidents.length === 0 && <div style={{ textAlign: "center", padding: 60, color: T.muted }}><Siren size={32} style={{ opacity: .3 }} /><p style={{ marginTop: 12 }}>No incidents recorded.</p></div>}
              {incidents.map(inc => {
                const sc_cfg = SEV[inc.severity] || SEV.MEDIUM;
                return (
                  <div key={inc.id} style={{ ...s.riskCard, flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: T.mono, fontSize: 10, color: T.muted }}>{inc.id}</span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{inc.title}</span>
                          {inc.data_breach && <span style={{ background: "rgba(225,29,72,.1)", color: T.red, borderRadius: 4, padding: "2px 8px", fontSize: 9, fontWeight: 700 }}>DATA BREACH</span>}
                        </div>
                        <div style={{ fontSize: 12, color: T.muted }}>{inc.category} · {new Date(inc.detected_at).toLocaleString("en-IN")}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                        <span style={s.badge(sc_cfg.c, sc_cfg.bg)}>{inc.severity}</span>
                        <span style={{ fontSize: 11, color: inc.status === "RESOLVED" ? T.green : inc.status === "CONTAINED" ? T.amber : T.red, fontWeight: 600 }}>{inc.status}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: T.text2, margin: 0, lineHeight: 1.6 }}>{inc.description}</p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {[["reported_to_rbi", "RBI"], ["reported_to_cert_in", "CERT-In"]].map(([k, lbl]) => (
                        <span key={k} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: inc[k] ? "rgba(22,163,74,.1)" : "rgba(225,29,72,.08)", color: inc[k] ? T.green : T.red, fontWeight: 600 }}>
                          {inc[k] ? `✓ ${lbl} Reported` : `⚠ ${lbl}: Not Reported`}
                        </span>
                      ))}
                      {inc.affected_users > 0 && <span style={{ fontSize: 11, color: T.orange, fontWeight: 600 }}>{inc.affected_users} users affected</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "trends" && (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 4 }}>30-day risk score trend</div>
                  <div style={{ fontSize: 12, color: T.muted }}>Current: {trends[trends.length - 1]?.score} · 30 days ago: {trends[0]?.score}</div>
                </div>
                {trends.length > 1 && (
                  trends[trends.length - 1]?.score < trends[0]?.score
                    ? <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.green, fontWeight: 700, fontSize: 13 }}><TrendingDown size={16} />Improving</div>
                    : <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.red, fontWeight: 700, fontSize: 13 }}><TrendingUp size={16} />Increasing</div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 140 }}>
                {trends.map((t, i) => {
                  const h = Math.round(t.score / maxTrend * 100);
                  const color = t.score >= 80 ? T.green : t.score >= 60 ? T.amber : T.red;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                        <div style={{ width: "100%", height: `${h}%`, background: color, borderRadius: "2px 2px 0 0", opacity: .85, minHeight: 4 }} />
                      </div>
                      {i % 7 === 0 && <div style={{ fontSize: 7, color: T.muted, marginTop: 4, transform: "rotate(-30deg)", whiteSpace: "nowrap" }}>{t.date?.slice(5)}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {showAdd && (
        <div style={s.modal} onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div style={s.modalBox}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: T.ink, fontFamily: T.display, fontSize: 17, fontWeight: 800 }}>Add new risk</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><X size={18} /></button>
            </div>
            {[["Title", "text", "title", "e.g. Unencrypted S3 bucket"], ["Owner", "text", "owner", "e.g. CISO, DevOps"]].map(([lbl, type, key, ph]) => (
              <div key={key} style={s.field}>
                <label style={s.lbl}>{lbl}</label>
                <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={ph} style={s.input} />
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={s.field}>
                <label style={s.lbl}>Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={s.input}>
                  {["Technical", "Operational", "Compliance", "Third-Party", "Physical"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.lbl}>Likelihood (1–5)</label>
                <input type="number" min={1} max={5} value={form.likelihood} onChange={e => setForm({ ...form, likelihood: +e.target.value })} style={s.input} />
              </div>
              <div style={s.field}>
                <label style={s.lbl}>Impact (1–5)</label>
                <input type="number" min={1} max={5} value={form.impact} onChange={e => setForm({ ...form, impact: +e.target.value })} style={s.input} />
              </div>
            </div>
            <div style={s.field}>
              <label style={s.lbl}>Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...s.input, resize: "vertical" }} placeholder="Describe the risk…" />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
              <button onClick={() => setShowAdd(false)} style={{ ...s.btnGhost, color: T.text2 }}>Cancel</button>
              <button onClick={addRisk} style={s.btnPrimary}>Add Risk</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
