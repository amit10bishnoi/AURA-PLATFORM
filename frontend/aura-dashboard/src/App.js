import { useState } from "react";

const API = "http://localhost:8000";

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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa", fontFamily: "Arial" }}>
      <div style={{ width: "400px", background: "white", padding: "40px", borderRadius: "12px", border: "1px solid #ddd" }}>
        <h1 style={{ color: "#1a1a2e", marginBottom: "4px", fontSize: "28px" }}>AURA</h1>
        <p style={{ color: "#666", marginBottom: "28px", fontSize: "13px" }}>AI-powered Unified Risk & Audit</p>

        <h2 style={{ fontSize: "18px", marginBottom: "20px", color: "#333" }}>
          {isRegister ? "Create an account" : "Sign in"}
        </h2>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px" }}>Full Name</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px" }}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px" }}>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>

          {error && <p style={{ color: "#e74c3c", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "12px", background: "#e74c3c", color: "white", border: "none", borderRadius: "6px", fontSize: "15px", fontWeight: "bold", cursor: "pointer" }}
          >
            {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#666" }}>
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <span
            onClick={() => setIsRegister(!isRegister)}
            style={{ color: "#e74c3c", cursor: "pointer", fontWeight: "bold" }}
          >
            {isRegister ? "Sign in" : "Register"}
          </span>
        </p>
      </div>
    </div>
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

      if (res.status === 401) {
        onLogout();
        return;
      }

      const data = await res.json();
      setResult(data);
    } catch {
      setError("Cannot connect to server");
    }
    setLoading(false);
  }

  function getRiskColor(level) {
    if (level === "CRITICAL") return "#e74c3c";
    if (level === "HIGH") return "#e67e22";
    if (level === "MEDIUM") return "#f1c40f";
    return "#2ecc71";
  }

  return (
    <div style={{ fontFamily: "Arial", maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "3px solid #e74c3c", paddingBottom: "10px", marginBottom: "8px" }}>
        <h1 style={{ color: "#1a1a2e", margin: 0 }}>AURA</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "14px", color: "#666" }}>Welcome, {userName}</span>
          <button onClick={onLogout} style={{ padding: "6px 14px", background: "white", border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>
            Logout
          </button>
        </div>
      </div>
      <p style={{ color: "#666", marginBottom: "30px" }}>AI-powered Unified Risk & Audit</p>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
          {[
            { label: "Company Name", name: "org_name", type: "text" },
            { label: "Industry", name: "industry", type: "text" },
            { label: "Number of Employees", name: "employees", type: "number" },
            { label: "Days Between Patches", name: "patch_days", type: "number" },
            { label: "Staff Training Completion %", name: "training_percent", type: "number" },
            { label: "Open Vulnerabilities", name: "vulnerabilities", type: "number" },
          ].map(field => (
            <div key={field.name}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "14px" }}>{field.label}</label>
              <input
                name={field.name}
                type={field.type}
                value={form[field.name]}
                onChange={handleChange}
                required
                style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input name="has_mfa" type="checkbox" checked={form.has_mfa} onChange={handleChange} style={{ width: "18px", height: "18px" }} />
            <label style={{ fontWeight: "bold", fontSize: "14px" }}>MFA Enabled</label>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input name="has_irp" type="checkbox" checked={form.has_irp} onChange={handleChange} style={{ width: "18px", height: "18px" }} />
            <label style={{ fontWeight: "bold", fontSize: "14px" }}>Incident Response Plan</label>
          </div>
        </div>

        {form.has_mfa && (
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "14px" }}>MFA Coverage %</label>
            <input
              name="mfa_coverage"
              type="number"
              value={form.mfa_coverage}
              onChange={handleChange}
              style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>
        )}

        {error && <p style={{ color: "#e74c3c", marginBottom: "16px" }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: "14px", background: "#e74c3c", color: "white", border: "none", borderRadius: "6px", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }}
        >
          {loading ? "Analysing..." : "Run Risk Assessment"}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: "40px", padding: "30px", border: "1px solid #ddd", borderRadius: "10px" }}>
          <h2 style={{ marginBottom: "20px", color: "#1a1a2e" }}>Assessment Result</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "24px" }}>
            <div style={{ padding: "20px", background: "#f8f9fa", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "36px", fontWeight: "bold", color: getRiskColor(result.risk_level) }}>
                {parseFloat(result.risk_score.toFixed(1))}
              </div>
              <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>Risk Score</div>
            </div>
            <div style={{ padding: "20px", background: "#f8f9fa", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: getRiskColor(result.risk_level) }}>
                {result.risk_level}
              </div>
              <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>Risk Level</div>
            </div>
            <div style={{ padding: "20px", background: "#f8f9fa", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "22px", fontWeight: "bold", color: "#1a1a2e" }}>
                ${result.financial_exposure.toLocaleString()}
              </div>
              <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>Financial Exposure</div>
            </div>
          </div>
          <h3 style={{ marginBottom: "12px", color: "#1a1a2e" }}>Recommendations</h3>
          {result.recommendations.map((rec, i) => (
            <div key={i} style={{ padding: "12px 16px", marginBottom: "8px", background: "#fff8f8", borderLeft: "4px solid #e74c3c", borderRadius: "4px", fontSize: "14px" }}>
              {rec}
            </div>
          ))}
        </div>
      )}
    </div>
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