import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Sun, Moon, X, ChevronRight, Command, Shield, BarChart2, FileCheck, Users, Bell, Zap, Activity, FileText, Building2, Lock, Sparkles, ClipboardList, CheckSquare } from "lucide-react";

const API = "http://localhost:8001";

/* ── Skeleton Loader ── */
export function Skeleton({ width = "100%", height = 16, radius = 6, style = {} }) {
  return (
    <div style={{ width, height, borderRadius: radius, background: "linear-gradient(90deg,rgba(124,58,237,.06) 25%,rgba(124,58,237,.12) 50%,rgba(124,58,237,.06) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", ...style }} />
  );
}

export function SkeletonCard({ rows = 3 }) {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(124,58,237,.08)", borderRadius: 16, padding: 22 }}>
      <Skeleton width="60%" height={18} style={{ marginBottom: 12 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} width={i === rows - 1 ? "40%" : "100%"} height={13} style={{ marginBottom: 8 }} />
      ))}
    </div>
  );
}

export function SkeletonStatGrid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ background: "#fff", border: "1px solid rgba(124,58,237,.08)", borderRadius: 16, padding: "22px 24px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,rgba(124,58,237,.2),rgba(219,39,119,.15),rgba(8,145,178,.1))" }} />
          <Skeleton width={40} height={40} radius={10} style={{ marginBottom: 14 }} />
          <Skeleton width="50%" height={28} style={{ marginBottom: 8 }} />
          <Skeleton width="70%" height={12} />
        </div>
      ))}
    </div>
  );
}

/* ── Error Boundary ── */
export function ErrorFallback({ error, resetError, tabName }) {
  return (
    <div style={{ padding: "60px 32px", textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(225,29,72,.08)", border: "1px solid rgba(225,29,72,.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>⚠️</div>
      <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: "#1a0a3a", marginBottom: 8 }}>Something went wrong</h3>
      <p style={{ color: "#a89dc8", fontSize: 13, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
        The {tabName || "page"} encountered an error. This is likely a connection issue with the backend.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button onClick={resetError} style={{ padding: "9px 20px", background: "linear-gradient(135deg,#7c3aed,#db2777)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Try Again
        </button>
        <button onClick={() => window.location.reload()} style={{ padding: "9px 20px", background: "#fff", border: "1px solid rgba(124,58,237,.2)", borderRadius: 8, color: "#6b5b9e", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          Reload Page
        </button>
      </div>
    </div>
  );
}

/* ── Command Palette (Cmd+K) ── */
const CMD_ITEMS = [
  { id: "overview", label: "Overview", desc: "Security dashboard", icon: BarChart2, color: "#7c3aed" },
  { id: "compliance", label: "Compliance", desc: "Frameworks & controls", icon: Shield, color: "#7c3aed" },
  { id: "evidence", label: "Evidence Collection", desc: "Manage evidence", icon: FileCheck, color: "#16a34a" },
  { id: "policies", label: "Policy Management", desc: "Create & track policies", icon: FileText, color: "#d97706" },
  { id: "vendors", label: "Vendor Risk", desc: "Third-party risk", icon: Building2, color: "#0891b2" },
  { id: "team-mgmt", label: "Team Management", desc: "Users & roles", icon: Users, color: "#db2777" },
  { id: "notifications", label: "Notifications", desc: "Alerts & rules", icon: Bell, color: "#d97706" },
  { id: "reports", label: "Reports", desc: "Generate PDF reports", icon: BarChart2, color: "#16a34a" },
  { id: "auto-evidence", label: "Auto Evidence", desc: "Pull from integrations", icon: Zap, color: "#d97706" },
  { id: "auditor", label: "Auditor Portal", desc: "External audit rooms", icon: Shield, color: "#7c3aed" },
  { id: "monitoring", label: "Continuous Monitoring", desc: "Real-time checks", icon: Activity, color: "#16a34a" },
  { id: "ai-assistant", label: "AI Assistant", desc: "Ask about compliance", icon: Sparkles, color: "#7c3aed" },
  { id: "questionnaires", label: "Questionnaires", desc: "Security assessments", icon: ClipboardList, color: "#16a34a" },
  { id: "sso", label: "SSO Configuration", desc: "Single sign-on", icon: Lock, color: "#0891b2" },
  { id: "audit-logs", label: "Audit Logs", desc: "Activity trail", icon: CheckSquare, color: "#a89dc8" },
];

export function CommandPalette({ onNavigate, onClose }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const [selected, setSelected] = useState(0);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = CMD_ITEMS.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.desc.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => { setSelected(0); }, [query]);

  const handleKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && filtered[selected]) { onNavigate(filtered[selected].id); onClose(); }
    if (e.key === "Escape") onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,10,58,0.5)", backdropFilter: "blur(8px)", zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "15vh" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 560, background: "#fff", border: "1px solid rgba(124,58,237,.2)", borderRadius: 16, boxShadow: "0 24px 80px rgba(124,58,237,.2)", overflow: "hidden" }}>
        {/* Search input */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid rgba(124,58,237,.08)" }}>
          <Search size={16} color="#a89dc8" />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKey} placeholder="Search pages, features…" style={{ flex: 1, border: "none", outline: "none", fontSize: 15, color: "#1a0a3a", background: "transparent" }} />
          <kbd style={{ padding: "2px 6px", background: "rgba(124,58,237,.06)", border: "1px solid rgba(124,58,237,.15)", borderRadius: 5, fontSize: 11, color: "#6b5b9e" }}>ESC</kbd>
        </div>
        {/* Results */}
        <div style={{ maxHeight: 400, overflowY: "auto", padding: "8px 0" }}>
          {filtered.length === 0 && (
            <div style={{ padding: "32px", textAlign: "center", color: "#a89dc8", fontSize: 13 }}>No results for "{query}"</div>
          )}
          {filtered.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={item.id} onClick={() => { onNavigate(item.id); onClose(); }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", cursor: "pointer", background: i === selected ? "rgba(124,58,237,.06)" : "transparent", transition: "background .1s" }}
                onMouseEnter={() => setSelected(i)}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${item.color}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={14} color={item.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1a0a3a" }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: "#a89dc8" }}>{item.desc}</div>
                </div>
                {i === selected && <ChevronRight size={14} color="#a89dc8" />}
              </div>
            );
          })}
        </div>
        {/* Footer */}
        <div style={{ padding: "10px 18px", borderTop: "1px solid rgba(124,58,237,.08)", display: "flex", gap: 16, fontSize: 11, color: "#a89dc8" }}>
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  );
}

/* ── Dark/Light Toggle ── */
export function ThemeToggle({ theme, onToggle }) {
  return (
    <button onClick={onToggle} title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(124,58,237,.15)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6b5b9e", transition: "all .15s" }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,.08)"; e.currentTarget.style.color = "#7c3aed"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#6b5b9e"; }}>
      {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
    </button>
  );
}

/* ── Onboarding Checklist ── */
export function OnboardingBanner({ onNavigate, onDismiss }) {
  const [steps, setSteps] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("aura_onboarding_dismissed") === "true");

  useEffect(() => {
    fetch(`${API}/api/onboarding?tenant_id=demo`)
      .then(r => r.json())
      .then(d => { setSteps(d.steps || []); setProgress(d.progress || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (dismissed || loading || progress === 100) return null;

  const nextStep = steps.find(s => !s.completed);

  return (
    <div style={{ margin: "0 0 24px", background: "linear-gradient(135deg,rgba(124,58,237,.06),rgba(219,39,119,.03))", border: "1px solid rgba(124,58,237,.15)", borderRadius: 14, padding: "18px 22px", position: "relative" }}>
      <button onClick={() => { setDismissed(true); localStorage.setItem("aura_onboarding_dismissed", "true"); }} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: "#a89dc8", cursor: "pointer" }}>
        <X size={14} />
      </button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700, color: "#1a0a3a", marginBottom: 2 }}>
            🚀 Get started with AURA
          </div>
          <div style={{ fontSize: 12, color: "#6b5b9e" }}>{progress}% complete · {steps.filter(s => !s.completed).length} steps remaining</div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#7c3aed", fontFamily: "'Syne',sans-serif" }}>{progress}%</div>
      </div>
      {/* Progress bar */}
      <div style={{ height: 6, background: "rgba(124,58,237,.1)", borderRadius: 3, marginBottom: 14, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#7c3aed,#db2777)", borderRadius: 3, transition: "width .5s" }} />
      </div>
      {/* Steps */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {steps.map(step => (
          <button key={step.key} onClick={() => step.tab && onNavigate(step.tab)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: step.tab ? "pointer" : "default", border: "1px solid", borderColor: step.completed ? "rgba(22,163,74,.25)" : step.key === nextStep?.key ? "rgba(124,58,237,.3)" : "rgba(124,58,237,.1)", background: step.completed ? "rgba(22,163,74,.06)" : step.key === nextStep?.key ? "rgba(124,58,237,.08)" : "transparent", color: step.completed ? "#16a34a" : step.key === nextStep?.key ? "#7c3aed" : "#a89dc8" }}>
            {step.completed ? "✓" : step.key === nextStep?.key ? "→" : "○"} {step.title}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Empty State ── */
export function EmptyState({ icon = "📭", title = "Nothing here yet", description = "", action, onAction }) {
  return (
    <div style={{ padding: "60px 32px", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: "#1a0a3a", marginBottom: 8 }}>{title}</h3>
      {description && <p style={{ color: "#a89dc8", fontSize: 13, maxWidth: 400, margin: "0 auto 24px", lineHeight: 1.6 }}>{description}</p>}
      {action && (
        <button onClick={onAction} style={{ padding: "10px 22px", background: "linear-gradient(135deg,#7c3aed,#db2777)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          {action}
        </button>
      )}
    </div>
  );
}

/* ── Mobile Nav ── */
export function MobileNav({ tabs, activeTab, onNavigate }) {
  const visibleTabs = tabs.slice(0, 5);
  return (
    <div style={{ display: "none", position: "fixed", bottom: 0, left: 0, right: 0, height: 60, background: "rgba(255,255,255,.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(124,58,237,.1)", zIndex: 100, padding: "0 16px" }} className="mobile-nav">
      {visibleTabs.map(tab => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;
        return (
          <button key={tab.id} onClick={() => onNavigate(tab.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: active ? "#7c3aed" : "#a89dc8", fontSize: 10, fontWeight: active ? 600 : 400 }}>
            <Icon size={18} />
            {tab.label.split(" ")[0]}
          </button>
        );
      })}
    </div>
  );
}

export default { Skeleton, SkeletonCard, SkeletonStatGrid, ErrorFallback, CommandPalette, ThemeToggle, OnboardingBanner, EmptyState, MobileNav };
