import { useState, useRef, useEffect } from "react";
import { Shield, AlertTriangle, LogOut, ChevronRight, Lock, Mail, User, Zap, Download, CheckSquare, Square, Activity, Globe, ClipboardList, Clock } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const API = "http://localhost:8000";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: #080B14;
    color: #E8ECF4;
    min-height: 100vh;
  }

  .auth-bg {
    min-height: 100vh;
    background: #080B14;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .auth-bg::before {
    content: '';
    position: absolute;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(220,50,47,0.12) 0%, transparent 70%);
    top: -100px;
    right: -100px;
    border-radius: 50%;
  }

  .auth-bg::after {
    content: '';
    position: absolute;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%);
    bottom: -50px;
    left: -50px;
    border-radius: 50%;
  }

  .auth-card {
    width: 420px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 44px;
    position: relative;
    z-index: 1;
    backdrop-filter: blur(20px);
  }

  .logo {
    font-family: 'Syne', sans-serif;
    font-size: 32px;
    font-weight: 800;
    letter-spacing: -1px;
    color: #fff;
    margin-bottom: 4px;
  }

  .logo span { color: #DC322F; }

  .tagline {
    font-size: 12px;
    color: rgba(255,255,255,0.35);
    letter-spacing: 0.5px;
    margin-bottom: 36px;
    font-weight: 300;
  }

  .auth-title {
    font-family: 'Syne', sans-serif;
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 24px;
    color: #fff;
  }

  .field { margin-bottom: 16px; }

  .field label {
    display: block;
    font-size: 11px;
    font-weight: 500;
    color: rgba(255,255,255,0.45);
    letter-spacing: 0.8px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-icon {
    position: absolute;
    left: 14px;
    color: rgba(255,255,255,0.25);
    width: 15px;
    height: 15px;
  }

  .field input {
    width: 100%;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 12px 14px 12px 40px;
    color: #fff;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    transition: border-color 0.2s;
    outline: none;
  }

  .field input:focus { border-color: rgba(220,50,47,0.5); }

  .btn-primary {
    width: 100%;
    padding: 13px;
    background: #DC322F;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    font-family: 'Syne', sans-serif;
    letter-spacing: 0.3px;
    cursor: pointer;
    margin-top: 8px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .btn-primary:hover { background: #c42b28; transform: translateY(-1px); }
  .btn-primary:disabled { opacity: 0.6; transform: none; cursor: not-allowed; }

  .auth-switch {
    text-align: center;
    margin-top: 24px;
    font-size: 13px;
    color: rgba(255,255,255,0.35);
  }

  .auth-switch span {
    color: #DC322F;
    cursor: pointer;
    font-weight: 500;
  }

  .error-msg {
    background: rgba(220,50,47,0.1);
    border: 1px solid rgba(220,50,47,0.3);
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 13px;
    color: #ff6b6b;
    margin-bottom: 16px;
  }

  .dashboard {
    min-height: 100vh;
    background: #080B14;
  }

  .topbar {
    background: rgba(255,255,255,0.02);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    padding: 0 40px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .topbar-logo {
    font-family: 'Syne', sans-serif;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: #fff;
  }

  .topbar-logo span { color: #DC322F; }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .welcome-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 6px 14px;
    font-size: 13px;
    color: rgba(255,255,255,0.6);
  }

  .logout-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 7px 14px;
    color: rgba(255,255,255,0.45);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
  }

  .logout-btn:hover { border-color: rgba(220,50,47,0.4); color: #DC322F; }

  .main-content {
    max-width: 960px;
    margin: 0 auto;
    padding: 48px 24px;
  }

  .page-header { margin-bottom: 36px; }

  .page-title {
    font-family: 'Syne', sans-serif;
    font-size: 28px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.5px;
    margin-bottom: 6px;
  }

  .page-sub {
    font-size: 14px;
    color: rgba(255,255,255,0.35);
    font-weight: 300;
  }

  .form-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 32px;
    margin-bottom: 24px;
  }

  .form-section-title {
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    margin-bottom: 20px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 20px;
  }

  .form-field label {
    display: block;
    font-size: 11px;
    font-weight: 500;
    color: rgba(255,255,255,0.4);
    letter-spacing: 0.6px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .form-field input[type="text"],
  .form-field input[type="number"] {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px;
    padding: 11px 14px;
    color: #fff;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color 0.2s;
  }

  .form-field input:focus { border-color: rgba(220,50,47,0.4); }

  .checkbox-row {
    display: flex;
    gap: 24px;
    margin-bottom: 16px;
  }

  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
  }

  .checkbox-item input { width: 16px; height: 16px; cursor: pointer; accent-color: #DC322F; }

  .checkbox-item label {
    font-size: 13px;
    color: rgba(255,255,255,0.6);
    cursor: pointer;
    font-weight: 400;
  }

  .submit-btn {
    width: 100%;
    padding: 14px;
    background: #DC322F;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 700;
    font-family: 'Syne', sans-serif;
    letter-spacing: 0.3px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .submit-btn:hover { background: #c42b28; transform: translateY(-1px); }
  .submit-btn:disabled { opacity: 0.5; transform: none; cursor: not-allowed; }

  .results-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    margin-bottom: 28px;
  }

  .result-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    padding: 24px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .result-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: var(--accent);
  }

  .result-value {
    font-family: 'Syne', sans-serif;
    font-size: 36px;
    font-weight: 800;
    color: var(--accent);
    letter-spacing: -1px;
    line-height: 1;
    margin-bottom: 6px;
  }

  .result-value.medium { font-size: 26px; }

  .result-label {
    font-size: 11px;
    color: rgba(255,255,255,0.3);
    letter-spacing: 0.8px;
    text-transform: uppercase;
    font-weight: 500;
  }

  .rec-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-left: 3px solid #DC322F;
    border-radius: 10px;
    margin-bottom: 8px;
    font-size: 13px;
    color: rgba(255,255,255,0.7);
    line-height: 1.5;
  }

  .rec-icon { color: #DC322F; flex-shrink: 0; margin-top: 1px; }

  .results-section-title {
    font-family: 'Syne', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    font-family: 'Syne', sans-serif;
    transition: all 0.2s;
  }

  /* ---- OVERVIEW TAB ---- */
  .overview-grid {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 20px;
    margin-bottom: 20px;
  }

  .gauge-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 28px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .stats-col {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .stat-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    padding: 20px 24px;
    flex: 1;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-val {
    font-family: 'Syne', sans-serif;
    font-size: 24px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.5px;
    line-height: 1;
  }

  .stat-lbl {
    font-size: 11px;
    color: rgba(255,255,255,0.3);
    letter-spacing: 0.8px;
    text-transform: uppercase;
    margin-top: 3px;
  }

  /* ---- THREAT MAP ---- */
  .threat-map-wrap {
    background: rgba(255,255,255,0.015);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    margin-bottom: 20px;
  }

  .threat-legend {
    display: flex;
    gap: 20px;
    padding: 16px 24px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: rgba(255,255,255,0.45);
  }

  .legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .live-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(220,50,47,0.15);
    border: 1px solid rgba(220,50,47,0.3);
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 11px;
    color: #DC322F;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #DC322F;
    animation: pulse-dot 1.2s ease-in-out infinite;
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.7); }
  }

  .threat-sidebar {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 24px;
  }

  .threat-event {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }

  .threat-event:last-child { border-bottom: none; }

  .threat-dot-sm {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 4px;
  }

  /* ---- COMPLIANCE ---- */
  .compliance-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 20px;
  }

  .compliance-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    padding: 24px;
  }

  .compliance-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }

  .compliance-framework {
    font-family: 'Syne', sans-serif;
    font-size: 16px;
    font-weight: 800;
    color: #fff;
    margin-bottom: 2px;
  }

  .compliance-desc {
    font-size: 11px;
    color: rgba(255,255,255,0.3);
  }

  .compliance-pct {
    font-family: 'Syne', sans-serif;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -1px;
  }

  .progress-bar-wrap {
    background: rgba(255,255,255,0.06);
    border-radius: 4px;
    height: 6px;
    overflow: hidden;
    margin-bottom: 16px;
  }

  .progress-bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .compliance-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .compliance-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    color: rgba(255,255,255,0.5);
  }

  .comp-check {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 9px;
    font-weight: 700;
  }

  /* ---- AUDIT TRAIL ---- */
  .audit-table {
    width: 100%;
    border-collapse: collapse;
  }

  .audit-table th {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.25);
    padding: 0 16px 16px 16px;
    text-align: left;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .audit-table td {
    padding: 14px 16px;
    font-size: 13px;
    color: rgba(255,255,255,0.65);
    border-bottom: 1px solid rgba(255,255,255,0.04);
    vertical-align: middle;
  }

  .audit-table tr:hover td { background: rgba(255,255,255,0.02); }

  .risk-badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .fade-in { animation: fadeInUp 0.35s ease forwards; }

  @keyframes threat-ping {
    0% { transform: scale(1); opacity: 0.8; }
    100% { transform: scale(3); opacity: 0; }
  }
`;

function getRiskColor(level) {
  if (level === "CRITICAL") return "#DC322F";
  if (level === "HIGH") return "#F59E0B";
  if (level === "MEDIUM") return "#EAB308";
  return "#10B981";
}

function getRiskBg(level) {
  if (level === "CRITICAL") return "rgba(220,50,47,0.15)";
  if (level === "HIGH") return "rgba(245,158,11,0.15)";
  if (level === "MEDIUM") return "rgba(234,179,8,0.15)";
  return "rgba(16,185,129,0.15)";
}

// ---- GAUGE COMPONENT ----
function RiskGauge({ score }) {
  const radius = 80;
  const cx = 110;
  const cy = 110;
  const startAngle = -210;
  const endAngle = 30;
  const totalArc = endAngle - startAngle;
  const pct = Math.min(Math.max(score / 100, 0), 1);
  const filled = totalArc * pct;

  function polarToXY(angle, r) {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arc(startA, endA, r) {
    const s = polarToXY(startA, r);
    const e = polarToXY(endA, r);
    const large = endA - startA > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  const color = score >= 75 ? "#DC322F" : score >= 50 ? "#F59E0B" : score >= 25 ? "#EAB308" : "#10B981";
  const level = score >= 75 ? "CRITICAL" : score >= 50 ? "HIGH" : score >= 25 ? "MEDIUM" : "LOW";
  const needleAngle = startAngle + filled;
  const needleEnd = polarToXY(needleAngle, 60);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width="220" height="160" viewBox="0 0 220 160">
        {/* Track */}
        <path d={arc(startAngle, endAngle, radius)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" strokeLinecap="round" />
        {/* Filled */}
        {score > 0 && (
          <path d={arc(startAngle, startAngle + filled, radius)} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" />
        )}
        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleEnd.x} y2={needleEnd.y} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="6" fill={color} />
        {/* Score */}
        <text x={cx} y={cy + 36} textAnchor="middle" fill="#fff" fontSize="32" fontWeight="800" fontFamily="Syne, sans-serif" letterSpacing="-1">{score.toFixed(0)}</text>
        <text x={cx} y={cy + 54} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="10" letterSpacing="2" fontFamily="DM Sans, sans-serif">RISK SCORE</text>
      </svg>
      <div style={{ background: getRiskBg(level), border: `1px solid ${color}40`, borderRadius: "20px", padding: "4px 16px", fontSize: "11px", fontWeight: "700", color, letterSpacing: "1px", marginTop: "8px" }}>{level}</div>
    </div>
  );
}

// ---- THREAT MAP COMPONENT ----
const THREATS = [
  { id: 1, x: 22, y: 38, type: "critical", city: "Moscow", attack: "Ransomware", time: "12s ago" },
  { id: 2, x: 48, y: 44, type: "high", city: "Beijing", attack: "SQL Injection", time: "34s ago" },
  { id: 3, x: 78, y: 55, type: "medium", city: "Jakarta", attack: "Phishing", time: "1m ago" },
  { id: 4, x: 15, y: 50, type: "critical", city: "Lagos", attack: "DDoS", time: "2m ago" },
  { id: 5, x: 30, y: 30, type: "high", city: "Berlin", attack: "Brute Force", time: "3m ago" },
  { id: 6, x: 62, y: 60, type: "medium", city: "Mumbai", attack: "XSS", time: "4m ago" },
  { id: 7, x: 88, y: 40, type: "critical", city: "Tokyo", attack: "Zero-Day Exploit", time: "5m ago" },
  { id: 8, x: 72, y: 28, type: "high", city: "Almaty", attack: "Credential Stuffing", time: "6m ago" },
];

function threatColor(type) {
  if (type === "critical") return "#DC322F";
  if (type === "high") return "#F59E0B";
  return "#EAB308";
}

function ThreatMap() {
  const [active, setActive] = useState(null);
  const [animating, setAnimating] = useState([0, 3, 6]);

  useEffect(() => {
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * THREATS.length);
      setAnimating(prev => [...new Set([...prev.slice(-3), idx])]);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 0" }}>
        <div>
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: "16px", fontWeight: "700", color: "#fff", marginBottom: "4px" }}>Global Threat Intelligence</div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>Simulated real-time threat activity feed</div>
        </div>
        <div className="live-badge"><div className="live-dot" /> LIVE</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "0" }}>
        {/* Map */}
        <div className="threat-map-wrap" style={{ margin: "16px 0 16px 24px", borderRight: "none", borderRadius: "14px 0 0 14px" }}>
          <svg viewBox="0 0 100 65" style={{ width: "100%", display: "block", background: "rgba(0,0,0,0.2)" }}>
            {/* World map rough outline shapes */}
            {/* North America */}
            <path d="M5,15 L18,12 L22,18 L20,28 L15,35 L10,32 L6,25 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
            {/* South America */}
            <path d="M18,38 L26,36 L28,45 L24,58 L18,55 L15,45 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
            {/* Europe */}
            <path d="M30,12 L40,10 L42,16 L38,22 L32,20 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
            {/* Africa */}
            <path d="M32,24 L40,22 L43,30 L42,44 L36,48 L30,42 L29,30 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
            {/* Asia */}
            <path d="M44,10 L70,8 L75,18 L70,28 L55,30 L46,24 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
            {/* Southeast Asia */}
            <path d="M68,32 L78,30 L82,40 L75,46 L66,42 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
            {/* Australia */}
            <path d="M72,48 L85,46 L88,56 L80,60 L70,58 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />

            {/* Grid lines */}
            {[20, 40, 60, 80].map(x => (
              <line key={`vg${x}`} x1={x} y1="0" x2={x} y2="65" stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />
            ))}
            {[16, 32, 48].map(y => (
              <line key={`hg${y}`} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />
            ))}

            {/* Threat nodes */}
            {THREATS.map((t, i) => (
              <g key={t.id} style={{ cursor: "pointer" }} onClick={() => setActive(active === t.id ? null : t.id)}>
                {/* Ping animation */}
                {animating.includes(i) && (
                  <circle cx={t.x} cy={t.y} r="3" fill="none" stroke={threatColor(t.type)} strokeWidth="0.8" style={{ animation: "threat-ping 1.5s ease-out infinite" }} />
                )}
                <circle cx={t.x} cy={t.y} r="2" fill={threatColor(t.type)} opacity="0.9" />
                <circle cx={t.x} cy={t.y} r="1" fill="#fff" opacity="0.6" />
                {/* Tooltip */}
                {active === t.id && (
                  <foreignObject x={t.x + 3} y={t.y - 12} width="60" height="30">
                    <div style={{ background: "#13172A", border: `1px solid ${threatColor(t.type)}50`, borderRadius: "4px", padding: "3px 6px", fontSize: "7px", color: "#fff", whiteSpace: "nowrap" }}>
                      {t.city}: {t.attack}
                    </div>
                  </foreignObject>
                )}
              </g>
            ))}
          </svg>

          <div className="threat-legend">
            {[["critical", "#DC322F"], ["high", "#F59E0B"], ["medium", "#EAB308"]].map(([lbl, clr]) => (
              <div className="legend-item" key={lbl}>
                <div className="legend-dot" style={{ background: clr }} />
                {lbl.charAt(0).toUpperCase() + lbl.slice(1)}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar events */}
        <div className="threat-sidebar" style={{ margin: "16px 24px 16px 0", borderLeft: "none", borderRadius: "0 14px 14px 0" }}>
          <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "1.5px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "16px" }}>Recent Events</div>
          {THREATS.map(t => (
            <div className="threat-event" key={t.id}>
              <div className="threat-dot-sm" style={{ background: threatColor(t.type) }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", marginBottom: "2px", fontWeight: "500" }}>{t.attack}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{t.city}</div>
              </div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", flexShrink: 0 }}>{t.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", padding: "0 24px 24px" }}>
        {[
          { label: "Active Threats", val: "8", color: "#DC322F" },
          { label: "Countries Affected", val: "7", color: "#F59E0B" },
          { label: "Critical Alerts", val: "3", color: "#DC322F" },
          { label: "Avg Response (min)", val: "4.2", color: "#10B981" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "16px 20px" }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: "22px", fontWeight: "800", color: s.color, marginBottom: "4px" }}>{s.val}</div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.8px", textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- COMPLIANCE TAB ----
function ComplianceTab({ controls, implemented, checklistScore }) {
  const nistControls = controls.filter(c => c.framework === "NIST");
  const isoControls = controls.filter(c => c.framework === "ISO");
  const nistImpl = nistControls.filter(c => implemented.includes(c.id)).length;
  const isoImpl = isoControls.filter(c => implemented.includes(c.id)).length;
  const nistPct = nistControls.length ? Math.round((nistImpl / nistControls.length) * 100) : 0;
  const isoPct = isoControls.length ? Math.round((isoImpl / isoControls.length) * 100) : 0;

  const frameworks = [
    {
      name: "NIST CSF",
      desc: "Cybersecurity Framework",
      pct: nistPct,
      impl: nistImpl,
      total: nistControls.length,
      color: "#6366F1",
      items: ["Identify", "Protect", "Detect", "Respond", "Recover"],
    },
    {
      name: "ISO 27001",
      desc: "Information Security Management",
      pct: isoPct,
      impl: isoImpl,
      total: isoControls.length,
      color: "#10B981",
      items: ["Access Control", "Cryptography", "Incident Management", "Supplier Relations"],
    },
    {
      name: "PCI DSS",
      desc: "Payment Card Industry Standard",
      pct: Math.round(nistPct * 0.7),
      impl: Math.round(nistImpl * 0.7),
      total: 12,
      color: "#F59E0B",
      items: ["Network Security", "Cardholder Data", "Vulnerability Mgmt", "Access Control"],
    },
    {
      name: "SOC 2",
      desc: "Service Organization Controls",
      pct: Math.round(isoPct * 0.85),
      impl: Math.round(isoImpl * 0.85),
      total: 10,
      color: "#EC4899",
      items: ["Security", "Availability", "Confidentiality", "Privacy"],
    },
  ];

  return (
    <div>
      <div className="compliance-grid">
        {frameworks.map(fw => {
          const status = fw.pct >= 80 ? "Compliant" : fw.pct >= 50 ? "Partial" : "Non-Compliant";
          const statusColor = fw.pct >= 80 ? "#10B981" : fw.pct >= 50 ? "#F59E0B" : "#DC322F";
          return (
            <div className="compliance-card" key={fw.name}>
              <div className="compliance-header">
                <div>
                  <div className="compliance-framework">{fw.name}</div>
                  <div className="compliance-desc">{fw.desc}</div>
                </div>
                <div className="compliance-pct" style={{ color: fw.color }}>{fw.pct}%</div>
              </div>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: `${fw.pct}%`, background: `linear-gradient(90deg, ${fw.color}80, ${fw.color})` }} />
              </div>
              <div style={{ fontSize: "11px", color: statusColor, fontWeight: "600", letterSpacing: "0.5px", marginBottom: "12px" }}>
                ● {status} — {fw.impl}/{fw.total} controls
              </div>
              <div className="compliance-items">
                {fw.items.map((item, idx) => {
                  const done = idx < Math.round(fw.items.length * fw.pct / 100);
                  return (
                    <div className="compliance-item" key={item}>
                      <div className="comp-check" style={{ background: done ? `${fw.color}20` : "rgba(255,255,255,0.04)", color: done ? fw.color : "rgba(255,255,255,0.2)" }}>
                        {done ? "✓" : "○"}
                      </div>
                      {item}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall compliance bar */}
      <div className="form-card" style={{ marginBottom: 0 }}>
        <div className="form-section-title">Overall Compliance Score</div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
          {frameworks.map(fw => (
            <div key={fw.name} style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{fw.name}</span>
                <span style={{ fontSize: "11px", color: fw.color, fontWeight: "600" }}>{fw.pct}%</span>
              </div>
              <div className="progress-bar-wrap" style={{ marginBottom: 0 }}>
                <div className="progress-bar-fill" style={{ width: `${fw.pct}%`, background: fw.color }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
          Complete more controls in the <span style={{ color: "#DC322F", cursor: "pointer" }}>Control Checklist</span> tab to improve compliance scores.
        </div>
      </div>
    </div>
  );
}

// ---- AUDIT TRAIL ----
function AuditTrail({ token }) {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch(`${API}/assessments`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setHistory(Array.isArray(data) ? data : []);
        } else {
          setHistory([]);
        }
      } catch {
        setHistory([]);
      }
      setLoadingHistory(false);
    }
    fetchHistory();
  }, [token]);

  // Mock data fallback if backend doesn't have /assessments
  const displayData = history.length > 0 ? history : [
    { id: 1, org_name: "TechCorp Ltd", industry: "Technology", risk_score: 72.4, risk_level: "HIGH", created_at: "2026-04-27T02:51:00Z" },
    { id: 2, org_name: "MedCare Hospital", industry: "Healthcare", risk_score: 88.1, risk_level: "CRITICAL", created_at: "2026-04-26T18:30:00Z" },
    { id: 3, org_name: "FinanceHub", industry: "Finance", risk_score: 45.2, risk_level: "MEDIUM", created_at: "2026-04-25T10:15:00Z" },
    { id: 4, org_name: "RetailPlus", industry: "Retail", risk_score: 21.8, risk_level: "LOW", created_at: "2026-04-24T08:00:00Z" },
  ];

  function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="form-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div className="form-section-title" style={{ marginBottom: 0 }}>Assessment Audit Trail</div>
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>{displayData.length} record{displayData.length !== 1 ? "s" : ""}</div>
      </div>

      {loadingHistory && history.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.3)" }}>Loading...</div>
      ) : (
        <table className="audit-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Organisation</th>
              <th>Industry</th>
              <th>Risk Score</th>
              <th>Risk Level</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, i) => {
              const color = getRiskColor(row.risk_level);
              return (
                <tr key={row.id || i}>
                  <td style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>{String(i + 1).padStart(2, "0")}</td>
                  <td style={{ color: "#fff", fontWeight: "500" }}>{row.org_name}</td>
                  <td>{row.industry}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "60px", height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ width: `${row.risk_score}%`, height: "100%", background: color, borderRadius: "2px" }} />
                      </div>
                      <span style={{ color, fontWeight: "600", fontFamily: "Syne, sans-serif" }}>{typeof row.risk_score === "number" ? row.risk_score.toFixed(1) : row.risk_score}</span>
                    </div>
                  </td>
                  <td>
                    <span className="risk-badge" style={{ color, background: getRiskBg(row.risk_level) }}>{row.risk_level}</span>
                  </td>
                  <td style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Clock size={11} />
                      {fmtDate(row.created_at)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {[
          { label: "Total Assessments", val: displayData.length },
          { label: "Critical", val: displayData.filter(r => r.risk_level === "CRITICAL").length, color: "#DC322F" },
          { label: "Avg Risk Score", val: (displayData.reduce((s, r) => s + (r.risk_score || 0), 0) / Math.max(displayData.length, 1)).toFixed(1), color: "#F59E0B" },
          { label: "Low Risk", val: displayData.filter(r => r.risk_level === "LOW").length, color: "#10B981" },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: "22px", fontWeight: "800", color: s.color || "#fff" }}>{s.val}</div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.8px", textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- LOGIN ----
function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const url = isRegister ? `${API}/register` : `${API}/login`;
    const body = isRegister
      ? { name: form.name, email: form.email, password: form.password }
      : { email: form.email, password: form.password };

    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Something went wrong"); }
      else { localStorage.setItem("token", data.access_token); localStorage.setItem("name", data.name); onLogin(data.name); }
    } catch { setError("Cannot connect to server"); }
    setLoading(false);
  }

  return (
    <>
      <style>{styles}</style>
      <div className="auth-bg">
        <div className="auth-card">
          <div className="logo">AU<span>R</span>A</div>
          <div className="tagline">AI-POWERED UNIFIED RISK & AUDIT</div>
          <div className="auth-title">{isRegister ? "Create account" : "Welcome back"}</div>
          <form onSubmit={handleSubmit}>
            {isRegister && (
              <div className="field">
                <label>Full Name</label>
                <div className="input-wrap"><User className="input-icon" />
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Amit Bishnoi" />
                </div>
              </div>
            )}
            <div className="field">
              <label>Email Address</label>
              <div className="input-wrap"><Mail className="input-icon" />
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="amit@company.com" />
              </div>
            </div>
            <div className="field">
              <label>Password</label>
              <div className="input-wrap"><Lock className="input-icon" />
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required placeholder="••••••••" />
              </div>
            </div>
            {error && <div className="error-msg">{error}</div>}
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
              {!loading && <ChevronRight size={16} />}
            </button>
          </form>
          <div className="auth-switch">
            {isRegister ? "Already have an account? " : "Don't have an account? "}
            <span onClick={() => { setIsRegister(!isRegister); setError(""); }}>{isRegister ? "Sign in" : "Register"}</span>
          </div>
        </div>
      </div>
    </>
  );
}

// ---- DASHBOARD ----
function Dashboard({ userName, onLogout }) {
  const [form, setForm] = useState({
    org_name: "", industry: "", employees: "", has_mfa: false,
    mfa_coverage: 0, patch_days: "", training_percent: "",
    has_irp: false, vulnerabilities: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const reportRef = useRef(null);

  const [activeTab, setActiveTab] = useState("overview");
  const [controls, setControls] = useState([]);
  const [implemented, setImplemented] = useState([]);
  const [checklistScore, setChecklistScore] = useState(null);

  const token = localStorage.getItem("token");

  // Load controls on mount
  useEffect(() => { loadControls(); }, []);

  async function downloadPDF() {
    const element = reportRef.current;
    const canvas = await html2canvas(element, { backgroundColor: "#080B14", scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`AURA_Report_${result?.org_name || "assessment"}.pdf`);
  }

  async function loadControls() {
    try {
      const res = await fetch(`${API}/controls`, { headers: { "Authorization": `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data)) setControls(data);
    } catch { console.error("Could not load controls"); }
  }

  async function toggleControl(id) {
    const newImplemented = implemented.includes(id)
      ? implemented.filter(i => i !== id)
      : [...implemented, id];
    setImplemented(newImplemented);

    try {
      const res = await fetch(`${API}/controls/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ implemented_ids: newImplemented })
      });
      const data = await res.json();
      setChecklistScore(data);
    } catch { console.error("Could not score controls"); }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/assess`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          employees: parseInt(form.employees),
          mfa_coverage: parseInt(form.mfa_coverage),
          patch_days: parseInt(form.patch_days),
          training_percent: parseInt(form.training_percent),
          vulnerabilities: parseInt(form.vulnerabilities),
        }),
      });
      if (res.status === 401) { onLogout(); return; }
      const data = await res.json();
      setResult(data);
      setActiveTab("overview"); // Jump to overview after assessment
    } catch { setError("Cannot connect to server"); }
    setLoading(false);
  }

  const fields = [
    { label: "Company Name", name: "org_name", type: "text", placeholder: "e.g. TechCorp Ltd" },
    { label: "Industry", name: "industry", type: "text", placeholder: "e.g. Healthcare" },
    { label: "Number of Employees", name: "employees", type: "number", placeholder: "e.g. 150" },
    { label: "Days Between Patches", name: "patch_days", type: "number", placeholder: "e.g. 30" },
    { label: "Staff Training %", name: "training_percent", type: "number", placeholder: "e.g. 75" },
    { label: "Open Vulnerabilities", name: "vulnerabilities", type: "number", placeholder: "e.g. 12" },
  ];

  const TABS = [
    { id: "overview", label: "Overview", icon: <Activity size={13} /> },
    { id: "assessment", label: "Risk Assessment", icon: <Shield size={13} /> },
    { id: "checklist", label: "Control Checklist", icon: <CheckSquare size={13} /> },
    { id: "threats", label: "Threat Map", icon: <Globe size={13} /> },
    { id: "compliance", label: "Compliance", icon: <ClipboardList size={13} /> },
    { id: "audit", label: "Audit Trail", icon: <Clock size={13} /> },
  ];

  const overviewScore = checklistScore?.risk_score ?? (result ? result.risk_score : 0);
  const overviewLevel = checklistScore?.risk_level ?? (result ? result.risk_level : "LOW");

  return (
    <>
      <style>{styles}</style>
      <div className="dashboard">
        <div className="topbar">
          <div className="topbar-logo">AU<span>R</span>A</div>
          <div className="topbar-right">
            <div className="welcome-badge"><Shield size={13} />{userName}</div>
            <button className="logout-btn" onClick={onLogout}><LogOut size={13} /> Logout</button>
          </div>
        </div>

        <div className="main-content">
          <div className="page-header">
            <div className="page-title">AURA Dashboard</div>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  className="tab-btn"
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === "checklist") loadControls();
                  }}
                  style={{
                    background: activeTab === tab.id ? "#DC322F" : "transparent",
                    color: activeTab === tab.id ? "white" : "rgba(255,255,255,0.5)",
                    border: `1px solid ${activeTab === tab.id ? "#DC322F" : "rgba(255,255,255,0.15)"}`,
                  }}
                >
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ---- OVERVIEW TAB ---- */}
          {activeTab === "overview" && (
            <div className="fade-in">
              <div className="overview-grid">
                {/* Gauge */}
                <div className="gauge-card">
                  <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "1.5px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "16px" }}>Live Risk Score</div>
                  <RiskGauge score={typeof overviewScore === "number" ? overviewScore : 0} />
                  {result && (
                    <div style={{ marginTop: "16px", textAlign: "center" }}>
                      <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>{result.org_name}</div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", marginTop: "2px" }}>{result.industry}</div>
                    </div>
                  )}
                  {!result && (
                    <div style={{ marginTop: "16px", textAlign: "center", fontSize: "12px", color: "rgba(255,255,255,0.25)" }}>
                      Run an assessment to see your score
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="stats-col">
                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: "rgba(220,50,47,0.15)" }}><Shield size={18} color="#DC322F" /></div>
                    <div>
                      <div className="stat-val">{result ? result.risk_level : "—"}</div>
                      <div className="stat-lbl">Risk Level</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: "rgba(99,102,241,0.15)" }}><Zap size={18} color="#6366F1" /></div>
                    <div>
                      <div className="stat-val">{result ? `$${(result.financial_exposure / 1000).toFixed(0)}K` : "—"}</div>
                      <div className="stat-lbl">Financial Exposure</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: "rgba(16,185,129,0.15)" }}><CheckSquare size={18} color="#10B981" /></div>
                    <div>
                      <div className="stat-val">{checklistScore ? `${checklistScore.controls_implemented}/${checklistScore.controls_total}` : `0/${controls.length}`}</div>
                      <div className="stat-lbl">Controls Implemented</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mini compliance overview */}
              <div className="form-card">
                <div className="form-section-title">Framework Compliance Overview</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
                  {[
                    { name: "NIST CSF", pct: controls.length ? Math.round((controls.filter(c => c.framework === "NIST" && implemented.includes(c.id)).length / Math.max(controls.filter(c => c.framework === "NIST").length, 1)) * 100) : 0, color: "#6366F1" },
                    { name: "ISO 27001", pct: controls.length ? Math.round((controls.filter(c => c.framework === "ISO" && implemented.includes(c.id)).length / Math.max(controls.filter(c => c.framework === "ISO").length, 1)) * 100) : 0, color: "#10B981" },
                    { name: "PCI DSS", pct: 0, color: "#F59E0B" },
                    { name: "SOC 2", pct: 0, color: "#EC4899" },
                  ].map(fw => (
                    <div key={fw.name}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{fw.name}</span>
                        <span style={{ fontSize: "12px", color: fw.color, fontWeight: "600" }}>{fw.pct}%</span>
                      </div>
                      <div className="progress-bar-wrap" style={{ marginBottom: 0 }}>
                        <div className="progress-bar-fill" style={{ width: `${fw.pct}%`, background: fw.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick actions */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <button onClick={() => setActiveTab("assessment")} style={{ background: "rgba(220,50,47,0.08)", border: "1px solid rgba(220,50,47,0.2)", borderRadius: "12px", padding: "18px 20px", cursor: "pointer", textAlign: "left", color: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}><Shield size={16} color="#DC322F" /><span style={{ fontFamily: "Syne, sans-serif", fontWeight: "700", fontSize: "14px" }}>New Assessment</span></div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>Run AI-powered risk analysis on an organisation</div>
                </button>
                <button onClick={() => setActiveTab("checklist")} style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "12px", padding: "18px 20px", cursor: "pointer", textAlign: "left", color: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}><CheckSquare size={16} color="#6366F1" /><span style={{ fontFamily: "Syne, sans-serif", fontWeight: "700", fontSize: "14px" }}>Control Checklist</span></div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>Review NIST & ISO 27001 security controls</div>
                </button>
              </div>
            </div>
          )}

          {/* ---- ASSESSMENT TAB ---- */}
          {activeTab === "assessment" && (
            <div className="fade-in">
              <div className="form-card">
                <div className="form-section-title">Organisation Details</div>
                <form onSubmit={handleSubmit}>
                  <div className="form-grid">
                    {fields.map(f => (
                      <div className="form-field" key={f.name}>
                        <label>{f.label}</label>
                        <input name={f.name} type={f.type} value={form[f.name]} onChange={handleChange} required placeholder={f.placeholder} />
                      </div>
                    ))}
                  </div>
                  <div className="form-section-title" style={{ marginTop: "8px" }}>Security Controls</div>
                  <div className="checkbox-row">
                    <div className="checkbox-item">
                      <input name="has_mfa" type="checkbox" id="mfa" checked={form.has_mfa} onChange={handleChange} />
                      <label htmlFor="mfa">MFA Enabled</label>
                    </div>
                    <div className="checkbox-item">
                      <input name="has_irp" type="checkbox" id="irp" checked={form.has_irp} onChange={handleChange} />
                      <label htmlFor="irp">Incident Response Plan</label>
                    </div>
                  </div>
                  {form.has_mfa && (
                    <div className="form-field" style={{ maxWidth: "300px", marginBottom: "20px" }}>
                      <label>MFA Coverage %</label>
                      <input name="mfa_coverage" type="number" value={form.mfa_coverage} onChange={handleChange} placeholder="e.g. 85" />
                    </div>
                  )}
                  {error && <div className="error-msg">{error}</div>}
                  <button className="submit-btn" type="submit" disabled={loading}>
                    <Zap size={16} />
                    {loading ? "Analysing..." : "Run Risk Assessment"}
                  </button>
                </form>
              </div>

              {result && (
                <div className="form-card" ref={reportRef}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <div className="form-section-title" style={{ marginBottom: 0 }}>Assessment Results — {result.org_name}</div>
                    <button onClick={downloadPDF} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "#DC322F", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}>
                      <Download size={14} /> Download PDF
                    </button>
                  </div>
                  <div className="results-grid">
                    <div className="result-card" style={{ "--accent": getRiskColor(result.risk_level) }}>
                      <div className="result-value">{parseFloat(result.risk_score.toFixed(1))}</div>
                      <div className="result-label">Risk Score</div>
                    </div>
                    <div className="result-card" style={{ "--accent": getRiskColor(result.risk_level) }}>
                      <div className="result-value medium">{result.risk_level}</div>
                      <div className="result-label">Risk Level</div>
                    </div>
                    <div className="result-card" style={{ "--accent": "#6366F1" }}>
                      <div className="result-value medium" style={{ fontSize: "22px" }}>${result.financial_exposure.toLocaleString()}</div>
                      <div className="result-label">Financial Exposure</div>
                    </div>
                  </div>
                  <div className="results-section-title">
                    <AlertTriangle size={15} color="#DC322F" />
                    Recommendations
                  </div>
                  {result.recommendations.map((rec, i) => (
                    <div className="rec-item" key={i}>
                      <ChevronRight className="rec-icon" size={14} />{rec}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---- CHECKLIST TAB ---- */}
          {activeTab === "checklist" && (
            <div className="fade-in">
              <div className="form-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                  <div className="form-section-title" style={{ marginBottom: 0 }}>NIST CSF / ISO 27001 Control Checklist</div>
                  {checklistScore && (
                    <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "28px", fontWeight: "800", color: getRiskColor(checklistScore.risk_level), fontFamily: "Syne, sans-serif" }}>{checklistScore.risk_score}</div>
                        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", letterSpacing: "1px" }}>RISK SCORE</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "16px", fontWeight: "700", color: getRiskColor(checklistScore.risk_level) }}>{checklistScore.risk_level}</div>
                        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", letterSpacing: "1px" }}>LEVEL</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "16px", fontWeight: "700", color: "#10B981" }}>{checklistScore.controls_implemented}/{checklistScore.controls_total}</div>
                        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", letterSpacing: "1px" }}>CONTROLS</div>
                      </div>
                    </div>
                  )}
                </div>

                {controls.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.3)" }}>Loading controls...</div>
                )}

                {["Protect", "Identify", "Detect", "Respond", "Recover"].map(fn => {
                  const group = controls.filter(c => c.function === fn);
                  if (group.length === 0) return null;
                  return (
                    <div key={fn} style={{ marginBottom: "24px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "2px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{fn}</div>
                      {group.map(control => (
                        <div
                          key={control.id}
                          onClick={() => toggleControl(control.id)}
                          style={{
                            display: "flex", alignItems: "flex-start", gap: "14px",
                            padding: "14px 16px", marginBottom: "8px",
                            background: implemented.includes(control.id) ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.02)",
                            border: "1px solid",
                            borderColor: implemented.includes(control.id) ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.06)",
                            borderRadius: "10px", cursor: "pointer", transition: "all 0.2s"
                          }}
                        >
                          <div style={{ flexShrink: 0, marginTop: "2px", color: implemented.includes(control.id) ? "#10B981" : "rgba(255,255,255,0.2)" }}>
                            {implemented.includes(control.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "13px", color: implemented.includes(control.id) ? "#E8ECF4" : "rgba(255,255,255,0.6)", marginBottom: "4px" }}>{control.control}</div>
                            <div style={{ display: "flex", gap: "12px" }}>
                              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>NIST: {control.nist_ref}</span>
                              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>ISO: {control.iso_ref}</span>
                            </div>
                          </div>
                          <div style={{ flexShrink: 0, fontSize: "11px", color: "#10B981", fontWeight: "600" }}>-{control.risk_reduction} pts</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ---- THREATS TAB ---- */}
          {activeTab === "threats" && (
            <div className="fade-in form-card" style={{ padding: 0, overflow: "hidden" }}>
              <ThreatMap />
            </div>
          )}

          {/* ---- COMPLIANCE TAB ---- */}
          {activeTab === "compliance" && (
            <div className="fade-in">
              <ComplianceTab controls={controls} implemented={implemented} checklistScore={checklistScore} />
            </div>
          )}

          {/* ---- AUDIT TRAIL TAB ---- */}
          {activeTab === "audit" && (
            <div className="fade-in">
              <AuditTrail token={token} />
            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default function App() {
  const [userName, setUserName] = useState(localStorage.getItem("name") || "");
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  function handleLogin(name) { setUserName(name); setIsLoggedIn(true); }
  function handleLogout() {
    localStorage.removeItem("token"); localStorage.removeItem("name");
    setIsLoggedIn(false); setUserName("");
  }

  return isLoggedIn
    ? <Dashboard userName={userName} onLogout={handleLogout} />
    : <Login onLogin={handleLogin} />;
}