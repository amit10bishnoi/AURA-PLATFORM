import { useState, useRef, useEffect } from "react";
import { Send, Zap, FileText, AlertTriangle, CheckSquare, ChevronRight, Sparkles } from "lucide-react";

const T = {
  bg:       "#09090F",
  surface:  "#111118",
  surface2: "#16161F",
  surface3: "#1C1C28",
  border:   "rgba(255,255,255,0.06)",
  borderHi: "rgba(139,92,246,0.3)",
  accent:   "#8b5cf6",
  accent2:  "#a78bfa",
  text:     "#E2E8F0",
  muted:    "#64748B",
  muted2:   "#94A3B8",
  mono:     "'JetBrains Mono', ui-monospace, monospace",
  display:  "'Syne', sans-serif",
  body:     "'DM Sans', sans-serif",
  red:      "#EF4444",
  orange:   "#F97316",
  amber:    "#F59E0B",
  green:    "#10B981",
  blue:     "#3B82F6",
};

const FRAMEWORKS = [
  { name:"ISO 27001",    passing:96, total:114, color:"#8b5cf6", status:"Good",   statusColor:"#10B981" },
  { name:"SOC 2",        passing:81, total:89,  color:"#10B981", status:"Good",   statusColor:"#10B981" },
  { name:"RBI Cyber",    passing:49, total:67,  color:"#3B82F6", status:"Review", statusColor:"#F59E0B" },
  { name:"CERT-In",      passing:31, total:45,  color:"#F59E0B", status:"Review", statusColor:"#F59E0B" },
  { name:"DPDP Act",     passing:21, total:38,  color:"#EF4444", status:"Gap",    statusColor:"#EF4444" },
];

const SUGGESTED_PROMPTS = [
  "What are my top 3 compliance risks?",
  "Draft a DPDP consent notice",
  "Generate RBI gap analysis report",
  "Write a vendor risk questionnaire",
];

const QUICK_ACTIONS = [
  { label:"Generate security policy", icon:FileText,      color:"rgba(139,92,246,0.15)", border:"rgba(139,92,246,0.3)" },
  { label:"Fix control gap",          icon:Zap,           color:"rgba(59,130,246,0.15)", border:"rgba(59,130,246,0.3)" },
  { label:"Risk assessment",          icon:AlertTriangle, color:"rgba(245,158,11,0.15)", border:"rgba(245,158,11,0.3)" },
  { label:"Audit checklist",          icon:CheckSquare,   color:"rgba(16,185,129,0.15)", border:"rgba(16,185,129,0.3)" },
];

const INITIAL_MESSAGE = {
  role: "assistant",
  content: `I've analyzed your compliance posture across all 5 frameworks. Here's what I found:

**Current status:** Overall 78% compliance — you're in good shape for ISO 27001 and SOC 2, but DPDP Act needs urgent attention.

**Top 3 priorities I recommend:**

1. **DPDP Act personal data inventory** (Critical)
You're at 56% on DPDP. The personal data inventory gap is your biggest risk — Indian regulators have begun enforcement. I can generate a data discovery workflow.

2. **RBI CC-2.1 key management** (High)
No formal key management lifecycle documented. This blocks your RBI audit. I can draft a Key Management Policy in 30 seconds.

3. **CERT-In IR plan sign-off** (Medium)
Draft exists but needs CISO approval. Schedule this in the next sprint.

Want me to tackle any of these? Just ask or click a quick action above.`,
  time: "08:34 am",
};

function formatMessage(text) {
  // Bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: T.text, fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      gap: 12,
      flexDirection: isUser ? "row-reverse" : "row",
      marginBottom: 20,
    }}>
      {/* Avatar */}
      {!isUser && (
        <div style={{
          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Sparkles size={16} color="#fff" />
        </div>
      )}

      <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start" }}>
        {!isUser && (
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 5, fontFamily: T.mono }}>
            AURA · {msg.time}
          </div>
        )}
        <div style={{
          background: isUser
            ? "linear-gradient(135deg, #7c3aed, #8b5cf6)"
            : T.surface2,
          border: isUser ? "none" : `1px solid ${T.border}`,
          borderRadius: isUser ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
          padding: "13px 16px",
          fontSize: 13,
          color: T.text,
          lineHeight: 1.65,
          fontFamily: T.body,
          whiteSpace: "pre-wrap",
        }}>
          {msg.content.split("\n").map((line, i) => (
            <div key={i}>{line ? formatMessage(line) : <br />}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AIAssistant({ token, tenantId }) {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: "user", content: text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are AURA AI — a GRC (Governance, Risk & Compliance) copilot for an Indian enterprise. You help with ISO 27001, SOC 2, RBI Cybersecurity, CERT-In, and DPDP Act 2023 compliance. 
The tenant is Demo Corporation at 78% overall compliance: ISO 27001 (96/114), SOC 2 (81/89), RBI Cyber (49/67), CERT-In (31/45), DPDP Act (21/38).
Be concise, actionable, and professional. Use **bold** for emphasis. Respond in 2-4 short paragraphs max.`,
          messages: [{ role: "user", content: text }],
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "I couldn't generate a response. Please try again.";
      setMessages(prev => [...prev, {
        role: "assistant",
        content: reply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Connection error. Please check your network and try again.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: T.bg, minHeight: "100vh", color: T.text,
      fontFamily: T.body, display: "flex", flexDirection: "column",
    }}>
      {/* ─── Top bar ─── */}
      <div style={{
        borderBottom: `1px solid ${T.border}`,
        padding: "0 32px",
        display: "flex", alignItems: "center", gap: 12,
        height: 56, flexShrink: 0,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Sparkles size={14} color="#fff" />
        </div>
        <div>
          <span style={{ fontSize: 15, fontWeight: 800, fontFamily: T.display, color: T.text }}>
            AURA AI Assistant
          </span>
          <span style={{ fontSize: 11, color: T.muted, marginLeft: 10 }}>
            GRC copilot · Powered by Claude
          </span>
        </div>
        <div style={{
          width: 7, height: 7, borderRadius: "50%",
          background: T.green, boxShadow: `0 0 8px ${T.green}`,
          marginLeft: 4,
        }} />
      </div>

      {/* ─── Main layout ─── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

        {/* ─── Chat area ─── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Quick action pills */}
          <div style={{
            padding: "16px 28px 12px",
            display: "flex", gap: 8, flexWrap: "wrap",
            borderBottom: `1px solid ${T.border}`,
          }}>
            {QUICK_ACTIONS.map(({ label, icon: Icon, color, border }) => (
              <button
                key={label}
                onClick={() => sendMessage(label)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 14px",
                  background: color, border: `1px solid ${border}`,
                  borderRadius: 20, color: T.text,
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Sparkles size={16} color="#fff" />
                </div>
                <div style={{
                  background: T.surface2, border: `1px solid ${T.border}`,
                  borderRadius: "4px 16px 16px 16px",
                  padding: "13px 18px", display: "flex", gap: 5, alignItems: "center",
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: T.accent2,
                      animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Suggested questions */}
          <div style={{
            padding: "10px 28px 14px",
            borderTop: `1px solid ${T.border}`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.muted,
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
              Suggested questions
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {SUGGESTED_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  style={{
                    padding: "5px 12px",
                    background: T.surface, border: `1px solid ${T.border}`,
                    borderRadius: 20, color: T.muted2,
                    fontSize: 11, fontWeight: 500, cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.color = T.accent2; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted2; }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div style={{
            padding: "14px 28px 20px",
            borderTop: `1px solid ${T.border}`,
          }}>
            <div style={{
              display: "flex", gap: 10, alignItems: "flex-end",
              background: T.surface2, border: `1px solid ${T.border}`,
              borderRadius: 14, padding: "10px 14px",
              transition: "border-color 0.15s",
            }}
            onFocus={e => e.currentTarget.style.borderColor = T.borderHi}
            onBlur={e => e.currentTarget.style.borderColor = T.border}
            >
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder="Ask about compliance, generate policies, fix control gaps..."
                style={{
                  flex: 1, background: "none", border: "none", outline: "none",
                  color: T.text, fontSize: 13, fontFamily: T.body,
                  resize: "none", lineHeight: 1.5, minHeight: 20, maxHeight: 120,
                }}
                rows={1}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  background: input.trim() && !loading
                    ? "linear-gradient(135deg, #7c3aed, #8b5cf6)"
                    : T.surface,
                  border: "none", cursor: input.trim() && !loading ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}
              >
                <Send size={15} color={input.trim() && !loading ? "#fff" : T.muted} />
              </button>
            </div>
            <div style={{ fontSize: 10, color: T.muted, marginTop: 6, textAlign: "center" }}>
              AURA AI can make mistakes. Please double-check responses with a qualified GRC professional.
            </div>
          </div>
        </div>

        {/* ─── Right sidebar: Framework context ─── */}
        <div style={{
          width: 280, borderLeft: `1px solid ${T.border}`,
          padding: "20px 20px", overflowY: "auto", flexShrink: 0,
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.text,
            fontFamily: T.display, marginBottom: 16 }}>
            Framework context
          </div>

          {FRAMEWORKS.map(fw => {
            const pct = Math.round((fw.passing / fw.total) * 100);
            return (
              <div key={fw.name} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: fw.color }}>
                    {fw.name}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: fw.statusColor,
                    background: `${fw.statusColor}15`,
                    padding: "1px 7px", borderRadius: 4,
                  }}>
                    {fw.status}
                  </span>
                </div>
                {/* Progress bar */}
                <div style={{
                  height: 4, background: "rgba(255,255,255,0.06)",
                  borderRadius: 2, marginBottom: 4, overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", width: `${pct}%`,
                    background: fw.color, borderRadius: 2,
                    transition: "width 0.6s ease",
                  }} />
                </div>
                <div style={{ fontSize: 11, color: T.muted, fontFamily: T.mono }}>
                  {fw.passing}/{fw.total} controls passing
                </div>
              </div>
            );
          })}

          <div style={{
            marginTop: 24,
            borderTop: `1px solid ${T.border}`,
            paddingTop: 20,
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: T.text,
              fontFamily: T.display, marginBottom: 12 }}>
              Suggested prompts
            </div>
            {SUGGESTED_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  width: "100%", padding: "9px 12px", marginBottom: 6,
                  background: T.surface, border: `1px solid ${T.border}`,
                  borderRadius: 8, color: T.muted2, cursor: "pointer",
                  fontSize: 11, fontWeight: 500, textAlign: "left",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.color = T.accent2; e.currentTarget.style.background = T.surface2; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted2; e.currentTarget.style.background = T.surface; }}
              >
                <ChevronRight size={11} style={{ flexShrink: 0 }} />
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
