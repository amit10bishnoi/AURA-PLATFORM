import {
  Shield, Zap, FileText, Paperclip, Sparkles, ArrowRight, Check,
  ScanLine, Cloud, Lock, Building2, ShieldCheck,
} from "lucide-react";

/* ── Brand tokens (aligned with App.js + the hubs) ───────────── */
const T = {
  accent: "#7c3aed",
  accent2: "#8b5cf6",
  pink: "#db2777",
  ink: "#1a0a3a",
  muted: "#a89dc8",
  text2: "#6b5b9e",
  green: "#16a34a",
  amber: "#d97706",
  display: "'Syne',sans-serif",
  body: "'DM Sans',sans-serif",
  mono: "'JetBrains Mono',ui-monospace,monospace",
};

const FRAMEWORKS = ["ISO 27001:2022", "SOC 2 Type II", "RBI Cybersecurity", "CERT-In", "DPDP Act 2023"];

const PILLARS = [
  {
    Icon: Zap,
    title: "One-click remediation",
    body: "AURA scans every connected integration, finds the gaps, and fixes them on approval — with a preview, a reason, and an instant undo for every action. No more 200-row checklists.",
  },
  {
    Icon: Sparkles,
    title: "AI-drafted policies",
    body: "Generate audit-ready policies — access control, incident response, data retention and more — written from your live stack and mapped to the frameworks you actually need.",
  },
  {
    Icon: Paperclip,
    title: "Auto-collected evidence",
    body: "Evidence for every control, pulled automatically from your tools and timestamped. Walk into an audit with the proof already gathered, not scrambled together the night before.",
  },
];

const STEPS = [
  { n: "01", title: "Connect", body: "Link your cloud, identity, and SaaS tools — AWS, Okta, GitHub, Google Workspace, and more." },
  { n: "02", title: "Scan", body: "AURA maps your posture against ISO 27001, SOC 2, RBI, and DPDP in one pass." },
  { n: "03", title: "Automate", body: "Remediate gaps, draft policies, and collect evidence — across every integration at once." },
  { n: "04", title: "Stay audit-ready", body: "Continuous monitoring keeps you compliant between audits, not just during them." },
];

export default function LandingPage({ onEnter }) {
  const enter = () => onEnter && onEnter();

  const btnPrimary = {
    display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#7c3aed,#db2777)",
    color: "#fff", border: "none", borderRadius: 11, padding: "13px 24px", fontSize: 15, fontWeight: 700,
    cursor: "pointer", fontFamily: T.body, boxShadow: "0 8px 24px rgba(124,58,237,.3)",
  };
  const btnGhost = {
    display: "inline-flex", alignItems: "center", gap: 8, background: "transparent",
    color: T.ink, border: "1px solid rgba(124,58,237,.25)", borderRadius: 11, padding: "13px 22px",
    fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: T.body,
  };

  return (
    <div style={{ fontFamily: T.body, color: T.ink, background: "#fff", minHeight: "100vh" }}>

      {/* ───────── NAV ───────── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 40px", background: "rgba(26,10,58,.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#7c3aed,#db2777)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={18} color="#fff" />
          </div>
          <span style={{ fontFamily: T.display, fontSize: 21, fontWeight: 800, letterSpacing: "-.5px", background: "linear-gradient(135deg,#a78bfa,#f0abfc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AURA</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {["Product", "Frameworks", "How it works"].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} style={{ color: "rgba(255,255,255,.75)", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>{l}</a>
          ))}
          <button onClick={enter} style={{ background: "rgba(255,255,255,.1)", color: "#fff", border: "1px solid rgba(255,255,255,.2)", borderRadius: 9, padding: "9px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: T.body }}>Sign in</button>
        </div>
      </nav>

      {/* ───────── HERO ───────── */}
      <header style={{ position: "relative", overflow: "hidden", background: "linear-gradient(160deg,#1a0a3a 0%,#2d1b5e 55%,#1a0a3a 100%)", color: "#fff", padding: "90px 40px 100px", textAlign: "center" }}>
        {/* glow accents */}
        <div style={{ position: "absolute", top: -120, left: "20%", width: 420, height: 420, background: "radial-gradient(circle,rgba(124,58,237,.35),transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -140, right: "15%", width: 420, height: 420, background: "radial-gradient(circle,rgba(219,39,119,.25),transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 880, margin: "0 auto" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 100, padding: "6px 15px", fontSize: 13, fontWeight: 600, color: "#e9d5ff", marginBottom: 26 }}>
            <Sparkles size={13} /> Built for the Indian regulatory stack
          </span>
          <h1 style={{ fontFamily: T.display, fontSize: 56, lineHeight: 1.05, fontWeight: 800, letterSpacing: "-1.5px", margin: "0 0 22px" }}>
            Compliance,<br /><span style={{ background: "linear-gradient(135deg,#a78bfa,#f0abfc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>automated.</span>
          </h1>
          <p style={{ fontSize: 19, lineHeight: 1.6, color: "rgba(255,255,255,.78)", maxWidth: 620, margin: "0 auto 36px" }}>
            AURA scans your stack, fixes what's broken, drafts your policies, and gathers your evidence — across ISO 27001, SOC 2, RBI, and DPDP. The work, done for you.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 44 }}>
            <button onClick={enter} style={btnPrimary}>Get started <ArrowRight size={17} /></button>
            <a href="mailto:hello@auragrc.in?subject=AURA%20demo%20request" style={{ ...btnGhost, color: "#fff", borderColor: "rgba(255,255,255,.25)", textDecoration: "none" }}>Book a demo</a>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {FRAMEWORKS.map(f => (
              <span key={f} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.13)", borderRadius: 100, padding: "7px 15px", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.85)" }}>
                <Check size={13} color="#a78bfa" /> {f}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ───────── STATS STRIP ───────── */}
      <section style={{ display: "flex", justifyContent: "center", gap: 64, flexWrap: "wrap", padding: "40px 40px", borderBottom: "1px solid rgba(124,58,237,.08)" }}>
        {[["199+", "Controls automated"], ["4", "Frameworks, one engine"], ["19", "Integrations supported"], ["100%", "Multi-tenant"]].map(([v, l]) => (
          <div key={l} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: T.display, fontSize: 34, fontWeight: 800, background: "linear-gradient(135deg,#7c3aed,#db2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>{v}</div>
            <div style={{ fontSize: 13, color: T.muted, marginTop: 6, textTransform: "uppercase", letterSpacing: ".5px" }}>{l}</div>
          </div>
        ))}
      </section>

      {/* ───────── PILLARS / PRODUCT ───────── */}
      <section id="product" style={{ padding: "84px 40px", maxWidth: 1160, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 54 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>What AURA does</div>
          <h2 style={{ fontFamily: T.display, fontSize: 38, fontWeight: 800, letterSpacing: "-.8px", margin: 0 }}>Three things, on autopilot</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 22 }}>
          {PILLARS.map(({ Icon, title, body }) => (
            <div key={title} style={{ background: "#fff", border: "1px solid rgba(124,58,237,.12)", borderRadius: 18, padding: "30px 28px", boxShadow: "0 2px 16px rgba(26,10,58,.04)" }}>
              <div style={{ width: 50, height: 50, borderRadius: 13, background: "linear-gradient(135deg,rgba(124,58,237,.12),rgba(219,39,119,.1))", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Icon size={24} color={T.accent} />
              </div>
              <h3 style={{ fontFamily: T.display, fontSize: 21, fontWeight: 700, margin: "0 0 10px" }}>{title}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: T.text2, margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── HOW IT WORKS ───────── */}
      <section id="how-it-works" style={{ background: "linear-gradient(180deg,#faf8ff,#fff)", padding: "84px 40px", borderTop: "1px solid rgba(124,58,237,.06)", borderBottom: "1px solid rgba(124,58,237,.06)" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 54 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>How it works</div>
            <h2 style={{ fontFamily: T.display, fontSize: 38, fontWeight: 800, letterSpacing: "-.8px", margin: 0 }}>From connected to compliant</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 20 }}>
            {STEPS.map(({ n, title, body }) => (
              <div key={n} style={{ position: "relative" }}>
                <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: T.pink, marginBottom: 10 }}>{n}</div>
                <h3 style={{ fontFamily: T.display, fontSize: 19, fontWeight: 700, margin: "0 0 8px" }}>{title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: T.text2, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── FRAMEWORKS ───────── */}
      <section id="frameworks" style={{ padding: "84px 40px", maxWidth: 1160, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>Coverage</div>
            <h2 style={{ fontFamily: T.display, fontSize: 36, fontWeight: 800, letterSpacing: "-.8px", margin: "0 0 16px" }}>The Indian stack, built in — not bolted on</h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: T.text2, margin: "0 0 24px" }}>
              Most GRC tools treat Indian regulation as an afterthought. AURA was designed for it from day one — RBI, CERT-In and DPDP are core frameworks, with cross-mappings so one control satisfies many requirements at once.
            </p>
            <button onClick={enter} style={btnGhost}>Explore the platform <ArrowRight size={16} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[
              { Icon: ShieldCheck, label: "ISO 27001:2022" },
              { Icon: FileText, label: "SOC 2 Type II" },
              { Icon: Building2, label: "RBI Cybersecurity" },
              { Icon: ScanLine, label: "CERT-In Directions" },
              { Icon: Lock, label: "DPDP Act 2023" },
              { Icon: Cloud, label: "19 integrations" },
            ].map(({ Icon, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 11, background: "#fff", border: "1px solid rgba(124,58,237,.12)", borderRadius: 13, padding: "16px 18px" }}>
                <Icon size={20} color={T.accent} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CTA BAND ───────── */}
      <section style={{ padding: "0 40px 84px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative", overflow: "hidden", background: "linear-gradient(135deg,#1a0a3a,#3a1f6e)", borderRadius: 24, padding: "60px 40px", textAlign: "center" }}>
          <div style={{ position: "absolute", top: -100, right: "10%", width: 360, height: 360, background: "radial-gradient(circle,rgba(219,39,119,.3),transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <h2 style={{ fontFamily: T.display, fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: "-.8px", margin: "0 0 14px" }}>Ready to automate your compliance?</h2>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,.78)", margin: "0 0 30px" }}>Stop managing checklists. Let AURA do the work.</p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={enter} style={btnPrimary}>Get started <ArrowRight size={17} /></button>
              <a href="mailto:hello@auragrc.in?subject=AURA%20demo%20request" style={{ ...btnGhost, color: "#fff", borderColor: "rgba(255,255,255,.25)", textDecoration: "none" }}>Book a demo</a>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── FOOTER ───────── */}
      <footer style={{ background: "#1a0a3a", color: "rgba(255,255,255,.6)", padding: "40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#db2777)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={15} color="#fff" />
          </div>
          <span style={{ fontFamily: T.display, fontWeight: 800, color: "#fff", fontSize: 16 }}>AURA</span>
          <span style={{ fontSize: 13, marginLeft: 8 }}>Unified Risk &amp; Compliance</span>
        </div>
        <div style={{ fontSize: 13 }}>© {new Date().getFullYear()} AURA · auragrc.in</div>
      </footer>
    </div>
  );
}
