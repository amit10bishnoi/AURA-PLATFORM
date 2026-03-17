import { useState, useEffect } from "react";
import { Shield, AlertTriangle, TrendingUp, LogOut, ChevronRight, Lock, Mail, User, Activity, DollarSign, Zap } from "lucide-react";

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
    max-width: 900px;
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
`;

function getRiskColor(level) {
  if (level === "CRITICAL") return "#DC322F";
  if (level === "HIGH") return "#F59E0B";
  if (level === "MEDIUM") return "#EAB308";
  return "#10B981";
}

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
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Something went wrong");
      } else {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("name", data.name);
        onLogin(data.name);
      }
    } catch {
      setError("Cannot connect to server");
    }
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
                <div className="input-wrap">
                  <User className="input-icon" />
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Amit Bishnoi" />
                </div>
              </div>
            )}
            <div className="field">
              <label>Email Address</label>
              <div className="input-wrap">
                <Mail className="input-icon" />
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="amit@company.com" />
              </div>
            </div>
            <div className="field">
              <label>Password</label>
              <div className="input-wrap">
                <Lock className="input-icon" />
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
            <span onClick={() => { setIsRegister(!isRegister); setError(""); }}>
              {isRegister ? "Sign in" : "Register"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

function Dashboard({ userName, onLogout }) {
  const [form, setForm] = useState({
    org_name: "", industry: "", employees: "", has_mfa: false,
    mfa_coverage: 0, patch_days: "", training_percent: "",
    has_irp: false, vulnerabilities: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API}/assess`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
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
    } catch {
      setError("Cannot connect to server");
    }
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

  return (
    <>
      <style>{styles}</style>
      <div className="dashboard">
        <div className="topbar">
          <div className="topbar-logo">AU<span>R</span>A</div>
          <div className="topbar-right">
            <div className="welcome-badge">
              <Shield size={13} />
              {userName}
            </div>
            <button className="logout-btn" onClick={onLogout}>
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>

        <div className="main-content">
          <div className="page-header">
            <div className="page-title">Risk Assessment</div>
            <div className="page-sub">Enter your organisation's security posture to generate a predictive risk score</div>
          </div>

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
            <div className="form-card">
              <div className="form-section-title">Assessment Results — {result.org_name}</div>

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
                  <ChevronRight className="rec-icon" size={14} />
                  {rec}
                </div>
              ))}
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

  function handleLogin(name) {
    setUserName(name);
    setIsLoggedIn(true);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    setIsLoggedIn(false);
    setUserName("");
  }

  return isLoggedIn
    ? <Dashboard userName={userName} onLogout={handleLogout} />
    : <Login onLogin={handleLogin} />;
}