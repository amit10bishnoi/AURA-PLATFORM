import { useState, useEffect, useRef } from "react";
import {
  Shield, Zap, FileText, Paperclip, Sparkles, ArrowRight, Check,
  ScanLine, Cloud, Lock, Building2, ShieldCheck, RefreshCw, Gauge, Layers, Eye,
} from "lucide-react";

/* ── Brand tokens ───────────────────────────────────────────── */
const T = {
  accent: "#7c3aed", accent2: "#8b5cf6", pink: "#db2777",
  ink: "#1a0a3a", muted: "#a89dc8", text2: "#6b5b9e",
  display: "'Syne',sans-serif", body: "'DM Sans',sans-serif", mono: "'JetBrains Mono',ui-monospace,monospace",
};

/* ── Interactive brand character: eyes follow the cursor, floats, blinks ── */
function AuraMascot({ size = 360 }) {
  const wrap = useRef(null);
  const [p, setP] = useState({ x: 0, y: 0 });
  useEffect(() => {
    function onMove(e) {
      const el = wrap.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const d = Math.hypot(dx, dy) || 1, k = Math.min(7, d / 12);
      setP({ x: +((dx / d) * k).toFixed(1), y: +((dy / d) * k).toFixed(1) });
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  const tr = `translate(${p.x} ${p.y})`;
  return (
    <div ref={wrap} className="am-float" style={{ cursor: "pointer", width: size, maxWidth: "100%" }}>
      <svg width="100%" viewBox="0 0 280 330" aria-label="AURA guardian">
        <defs>
          <linearGradient id="aBody" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stopColor="#8b5cf6" /><stop offset="1" stopColor="#db2777" /></linearGradient>
          <linearGradient id="aSheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.45" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
          <radialGradient id="aGlow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#a78bfa" stopOpacity="0.45" /><stop offset="0.6" stopColor="#c084fc" stopOpacity="0.13" /><stop offset="1" stopColor="#c084fc" stopOpacity="0" /></radialGradient>
        </defs>
        <circle className="am-glow" cx="140" cy="182" r="122" fill="url(#aGlow)" />
        <line x1="140" y1="100" x2="140" y2="72" stroke="#c084fc" strokeWidth="4" strokeLinecap="round" />
        <circle className="am-tw" cx="140" cy="64" r="8" fill="#f0abfc" />
        <rect x="58" y="100" width="164" height="172" rx="70" fill="url(#aBody)" />
        <path d="M78 122 Q140 110 202 122 Q202 166 140 173 Q78 166 78 122 Z" fill="url(#aSheen)" />
        <g className="am-eyes" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          <ellipse cx="108" cy="168" rx="22" ry="27" fill="#fff" />
          <ellipse cx="172" cy="168" rx="22" ry="27" fill="#fff" />
          <g transform={tr}><circle cx="108" cy="170" r="11" fill="#2b1769" /><circle cx="104" cy="166" r="3.6" fill="#fff" /></g>
          <g transform={tr}><circle cx="172" cy="170" r="11" fill="#2b1769" /><circle cx="168" cy="166" r="3.6" fill="#fff" /></g>
        </g>
        <path d="M118 214 Q140 236 162 214" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" />
        <path d="M140 238 C 133 238 124 240 120 242 C 120 256 126 263 140 270 C 154 263 160 256 160 242 C 156 240 147 238 140 238 Z" fill="#fff" fillOpacity="0.2" />
        <path d="M132 252 l6 6 l12 -13" fill="none" stroke="#fff" strokeOpacity="0.65" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <g fill="#f0abfc">
          <path className="am-tw" style={{ animationDelay: ".4s" }} d="M40 150 l5 11 l11 5 l-11 5 l-5 11 l-5 -11 l-11 -5 l11 -5 z" />
          <path className="am-tw" style={{ animationDelay: "1s" }} d="M238 132 l4 9 l9 4 l-9 4 l-4 9 l-4 -9 l-9 -4 l9 -4 z" />
          <path className="am-tw" style={{ animationDelay: "1.6s" }} d="M232 252 l3.5 8 l8 3.5 l-8 3.5 l-3.5 8 l-3.5 -8 l-8 -3.5 l8 -3.5 z" />
        </g>
      </svg>
    </div>
  );
}

const FRAMEWORKS = ["ISO 27001:2022", "SOC 2 Type II", "RBI Cybersecurity", "CERT-In", "DPDP Act 2023"];
const SECTORS = ["Fintech", "NBFCs", "SaaS", "Healthcare", "E-commerce", "Capital markets"];
const INTEGRATIONS = ["AWS", "Google Cloud", "Azure", "Okta", "Google Workspace", "GitHub", "Microsoft 365", "Jira", "Slack", "Datadog", "Cloudflare", "Snyk"];

const DIFF = [
  { Icon: Gauge, title: "Faster time-to-ready", body: "AURA handles scanning, mapping, and evidence so your first audit-ready posture is days, not quarters." },
  { Icon: Zap, title: "It fixes, not just flags", body: "Most tools hand you a checklist. AURA remediates the gaps on approval — previewable and reversible." },
  { Icon: Sparkles, title: "AI that drafts for you", body: "Policies written from your live stack and mapped to every framework, not generic boilerplate." },
  { Icon: Building2, title: "India-native by design", body: "RBI, CERT-In and DPDP are core — with Aadhaar, PAN and UPI understood out of the box." },
];

const CAPS = [
  { Icon: ScanLine, title: "Continuous scanning", body: "Posture mapped across all four frameworks in one pass." },
  { Icon: Zap, title: "One-click remediation", body: "Fix gaps on approval, with preview and instant undo." },
  { Icon: Sparkles, title: "AI policy drafting", body: "Audit-ready policies generated from your real stack." },
  { Icon: Paperclip, title: "Auto evidence", body: "Timestamped proof for every control, collected for you." },
  { Icon: RefreshCw, title: "Always-on monitoring", body: "Stay compliant between audits, not just during them." },
  { Icon: Lock, title: "Privacy built in", body: "DPDP-grade data handling at the core of the platform." },
];

export default function LandingPage({ onEnter }) {
  const enter = () => onEnter && onEnter();
  const btnPrimary = { display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#7c3aed,#db2777)", color: "#fff", border: "none", borderRadius: 11, padding: "14px 26px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: T.body, boxShadow: "0 8px 24px rgba(124,58,237,.3)" };
  const btnGhostDark = { display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,.25)", borderRadius: 11, padding: "14px 24px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: T.body, textDecoration: "none" };
  const Eyebrow = ({ icon: Icon, children }) => (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 14 }}>
      <Icon size={15} /> {children}
    </div>
  );

  return (
    <div style={{ fontFamily: T.body, color: T.ink, background: "#fff", minHeight: "100vh" }}>
      <style>{`
        @keyframes amFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}
        @keyframes amGlow{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:.9;transform:scale(1.07)}}
        @keyframes amBlink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.08)}}
        @keyframes amTw{0%,100%{opacity:.35}50%{opacity:1}}
        @keyframes amDrift{0%,100%{transform:translate(0,0)}50%{transform:translate(60px,-50px)}}
        @keyframes amDrift2{0%,100%{transform:translate(0,0)}50%{transform:translate(-50px,40px)}}
        .am-float{animation:amFloat 4s ease-in-out infinite}
        .am-float:hover{animation-duration:1.1s}
        .am-glow{animation:amGlow 3.5s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
        .am-eyes{animation:amBlink 4.8s infinite}
        .am-tw{animation:amTw 2.2s ease-in-out infinite}
      `}</style>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", background: "rgba(26,10,58,.9)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#7c3aed,#db2777)", display: "flex", alignItems: "center", justifyContent: "center" }}><Shield size={18} color="#fff" /></div>
          <span style={{ fontFamily: T.display, fontSize: 21, fontWeight: 800, letterSpacing: "-.5px", background: "linear-gradient(135deg,#a78bfa,#f0abfc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AURA</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {["Platform", "Capabilities", "Frameworks"].map(l => (
            <a key={l} href={"#" + l.toLowerCase()} style={{ color: "rgba(255,255,255,.75)", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>{l}</a>
          ))}
          <button onClick={enter} style={{ background: "rgba(255,255,255,.1)", color: "#fff", border: "1px solid rgba(255,255,255,.2)", borderRadius: 9, padding: "9px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: T.body }}>Sign in</button>
        </div>
      </nav>

      {/* HERO with background video */}
      <header style={{ position: "relative", overflow: "hidden", background: "linear-gradient(160deg,#1a0a3a,#2d1b5e 55%,#1a0a3a)", color: "#fff", padding: "76px 40px 64px" }}>
        <video autoPlay muted loop playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }}>
          <source src="/aura-hero.mp4" type="video/mp4" />
        </video>
        <div className="am-blob" style={{ position: "absolute", top: -140, left: "6%", width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,.4),transparent 70%)", pointerEvents: "none", animation: "amDrift 9s ease-in-out infinite" }} />
        <div className="am-blob" style={{ position: "absolute", bottom: -180, right: "4%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(219,39,119,.28),transparent 70%)", pointerEvents: "none", animation: "amDrift2 11s ease-in-out infinite" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg,rgba(26,10,58,.6),rgba(45,27,94,.5))", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 36, alignItems: "center" }}>
          <div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 100, padding: "6px 15px", fontSize: 13, fontWeight: 600, color: "#e9d5ff", marginBottom: 22 }}>
              <Sparkles size={13} /> AI-powered · India-native · audit-ready
            </span>
            <h1 style={{ fontFamily: T.display, fontSize: 56, lineHeight: 1.02, fontWeight: 800, letterSpacing: "-1.6px", margin: "0 0 20px" }}>
              Compliance,<br />
              <span style={{ background: "linear-gradient(135deg,#a78bfa,#f0abfc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>automated.</span>
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: "rgba(255,255,255,.8)", maxWidth: 480, margin: "0 0 30px" }}>
              AURA scans your stack, fixes what's broken, drafts your policies, and gathers your evidence — across ISO 27001, SOC 2, RBI, and DPDP. The work, done for you.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 22 }}>
              <button onClick={enter} style={btnPrimary}>Get started <ArrowRight size={17} /></button>
              <a href="mailto:hello@auragrc.in?subject=AURA%20demo%20request" style={btnGhostDark}>Book a demo</a>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,.62)" }}>
              <ShieldCheck size={15} color="#a78bfa" /> No credit card · live in minutes
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}><AuraMascot size={380} /></div>
        </div>
        <div style={{ position: "relative", maxWidth: 1180, margin: "44px auto 0", display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          {FRAMEWORKS.map(f => (
            <span key={f} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 100, padding: "7px 15px", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.88)" }}>
              <Check size={13} color="#a78bfa" /> {f}
            </span>
          ))}
        </div>
      </header>

      {/* TRUST STRIP */}
      <section style={{ padding: "30px 40px", borderBottom: "1px solid rgba(124,58,237,.08)", textAlign: "center" }}>
        <div style={{ fontSize: 12, color: T.muted, fontWeight: 700, marginBottom: 14, textTransform: "uppercase", letterSpacing: "1px" }}>Built for regulated teams across India</div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
          {SECTORS.map((s, i) => (
            <span key={s} style={{ fontSize: 16, fontWeight: 600, color: T.text2, fontFamily: T.display, opacity: .9 }}>{s}{i < SECTORS.length - 1 ? "   ·" : ""}</span>
          ))}
        </div>
      </section>

      {/* DIFFERENTIATORS */}
      <section id="platform" style={{ padding: "84px 40px", maxWidth: 1160, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <Eyebrow icon={Sparkles}>Why teams choose AURA</Eyebrow>
          <h2 style={{ fontFamily: T.display, fontSize: 40, fontWeight: 800, letterSpacing: "-1px", margin: 0 }}>Not another checklist tool</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 20 }}>
          {DIFF.map(({ Icon, title, body }) => (
            <div key={title} style={{ background: "#fff", border: "1px solid rgba(124,58,237,.12)", borderRadius: 18, padding: "28px 26px", boxShadow: "0 2px 16px rgba(26,10,58,.04)" }}>
              <div style={{ width: 48, height: 48, borderRadius: 13, background: "linear-gradient(135deg,rgba(124,58,237,.12),rgba(219,39,119,.1))", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}><Icon size={23} color={T.accent} /></div>
              <h3 style={{ fontFamily: T.display, fontSize: 19, fontWeight: 700, margin: "0 0 9px" }}>{title}</h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: T.text2, margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CAPABILITIES GRID */}
      <section id="capabilities" style={{ background: "linear-gradient(180deg,#faf8ff,#fff)", padding: "84px 40px", borderTop: "1px solid rgba(124,58,237,.06)", borderBottom: "1px solid rgba(124,58,237,.06)" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 50 }}>
            <Eyebrow icon={Layers}>Capabilities</Eyebrow>
            <h2 style={{ fontFamily: T.display, fontSize: 40, fontWeight: 800, letterSpacing: "-1px", margin: 0 }}>One engine. The whole job.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
            {CAPS.map(({ Icon, title, body }) => (
              <div key={title} style={{ display: "flex", gap: 14, background: "#fff", border: "1px solid rgba(124,58,237,.12)", borderRadius: 16, padding: "22px 22px" }}>
                <div style={{ flexShrink: 0, width: 42, height: 42, borderRadius: 11, background: "linear-gradient(135deg,#7c3aed,#db2777)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={20} color="#fff" /></div>
                <div>
                  <h3 style={{ fontFamily: T.display, fontSize: 17, fontWeight: 700, margin: "0 0 5px" }}>{title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.55, color: T.text2, margin: 0 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section style={{ padding: "84px 40px", maxWidth: 1160, margin: "0 auto", textAlign: "center" }}>
        <Eyebrow icon={Cloud}>Connects to your stack</Eyebrow>
        <h2 style={{ fontFamily: T.display, fontSize: 40, fontWeight: 800, letterSpacing: "-1px", margin: "0 0 36px" }}>Plays well with everything</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, maxWidth: 880, margin: "0 auto" }}>
          {INTEGRATIONS.map(name => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid rgba(124,58,237,.12)", borderRadius: 12, padding: "14px 16px" }}>
              <Cloud size={16} color={T.accent} /><span style={{ fontSize: 14, fontWeight: 600 }}>{name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* BY THE NUMBERS */}
      <section style={{ background: "linear-gradient(135deg,#1a0a3a,#2d1b5e)", color: "#fff", padding: "76px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <Eyebrow icon={Gauge}>By the numbers</Eyebrow>
          <h2 style={{ fontFamily: T.display, fontSize: 38, fontWeight: 800, letterSpacing: "-1px", margin: "0 0 48px", color: "#fff" }}>What AURA covers out of the box</h2>
          <div style={{ display: "flex", justifyContent: "center", gap: 56, flexWrap: "wrap" }}>
            {[["199+", "Controls automated"], ["4", "Frameworks, one engine"], ["12+", "Integrations supported"], ["Minutes", "To your first scan"]].map(([v, l]) => (
              <div key={l} style={{ textAlign: "center", minWidth: 150 }}>
                <div style={{ fontFamily: T.display, fontSize: 46, fontWeight: 800, background: "linear-gradient(135deg,#a78bfa,#f0abfc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.6)", marginTop: 10, textTransform: "uppercase", letterSpacing: ".5px" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INDIA / FRAMEWORKS */}
      <section id="frameworks" style={{ padding: "84px 40px", maxWidth: 1160, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
          <div>
            <Eyebrow icon={Building2}>Coverage</Eyebrow>
            <h2 style={{ fontFamily: T.display, fontSize: 36, fontWeight: 800, letterSpacing: "-.8px", margin: "0 0 16px" }}>The Indian stack, built in — not bolted on</h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: T.text2, margin: "0 0 24px" }}>
              Most GRC tools treat Indian regulation as an afterthought. AURA was designed for it from day one — RBI, CERT-In and DPDP are core frameworks, with cross-mappings so one control satisfies many requirements at once. Aadhaar, PAN and UPI are understood natively.
            </p>
            <button onClick={enter} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", color: T.ink, border: "1px solid rgba(124,58,237,.25)", borderRadius: 11, padding: "13px 22px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: T.body }}>Explore the platform <ArrowRight size={16} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[{ Icon: ShieldCheck, label: "ISO 27001:2022" }, { Icon: FileText, label: "SOC 2 Type II" }, { Icon: Building2, label: "RBI Cybersecurity" }, { Icon: ScanLine, label: "CERT-In Directions" }, { Icon: Lock, label: "DPDP Act 2023" }, { Icon: Eye, label: "Continuous monitoring" }].map(({ Icon, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 11, background: "#fff", border: "1px solid rgba(124,58,237,.12)", borderRadius: 13, padding: "16px 18px" }}>
                <Icon size={20} color={T.accent} /><span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section style={{ padding: "0 40px 84px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative", overflow: "hidden", background: "linear-gradient(135deg,#1a0a3a,#3a1f6e)", borderRadius: 24, padding: "52px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div style={{ position: "absolute", top: -100, right: "22%", width: 360, height: 360, background: "radial-gradient(circle,rgba(219,39,119,.3),transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", flex: 1, minWidth: 280 }}>
            <h2 style={{ fontFamily: T.display, fontSize: 34, fontWeight: 800, color: "#fff", letterSpacing: "-.8px", margin: "0 0 12px" }}>Take the first step to audit-ready</h2>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,.8)", margin: "0 0 26px" }}>Stop managing checklists. Let AURA do the work.</p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <button onClick={enter} style={btnPrimary}>Get started <ArrowRight size={17} /></button>
              <a href="mailto:hello@auragrc.in?subject=AURA%20demo%20request" style={btnGhostDark}>Book a demo</a>
            </div>
          </div>
          <div style={{ position: "relative", flexShrink: 0 }}><AuraMascot size={170} /></div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#1a0a3a", color: "rgba(255,255,255,.6)", padding: "40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#db2777)", display: "flex", alignItems: "center", justifyContent: "center" }}><Shield size={15} color="#fff" /></div>
          <span style={{ fontFamily: T.display, fontWeight: 800, color: "#fff", fontSize: 16 }}>AURA</span>
          <span style={{ fontSize: 13, marginLeft: 8 }}>Unified Risk &amp; Compliance</span>
        </div>
        <div style={{ fontSize: 13 }}>© {new Date().getFullYear()} AURA · auragrc.in</div>
      </footer>
    </div>
  );
}
