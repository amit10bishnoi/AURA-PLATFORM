import { useState } from "react";

function App() {
  const [form, setForm] = useState({
    org_name: "",
    industry: "",
    employees: "",
    has_mfa: false,
    mfa_coverage: 0,
    patch_days: "",
    training_percent: "",
    has_irp: false,
    vulnerabilities: "",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const response = await fetch("http://localhost:8000/assess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        employees: parseInt(form.employees),
        mfa_coverage: parseInt(form.mfa_coverage),
        patch_days: parseInt(form.patch_days),
        training_percent: parseInt(form.training_percent),
        vulnerabilities: parseInt(form.vulnerabilities),
      }),
    });

    const data = await response.json();
    setResult(data);
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
      <h1 style={{ color: "#1a1a2e", borderBottom: "3px solid #e74c3c", paddingBottom: "10px" }}>
        AURA
      </h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>
        AI-powered Unified Risk & Audit
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "14px" }}>
              Company Name
            </label>
            <input
              name="org_name"
              value={form.org_name}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "14px" }}>
              Industry
            </label>
            <input
              name="industry"
              value={form.industry}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "14px" }}>
              Number of Employees
            </label>
            <input
              name="employees"
              type="number"
              value={form.employees}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "14px" }}>
              Days Between Patches
            </label>
            <input
              name="patch_days"
              type="number"
              value={form.patch_days}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "14px" }}>
              Staff Training Completion %
            </label>
            <input
              name="training_percent"
              type="number"
              value={form.training_percent}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "14px" }}>
              Open Vulnerabilities
            </label>
            <input
              name="vulnerabilities"
              type="number"
              value={form.vulnerabilities}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              name="has_mfa"
              type="checkbox"
              checked={form.has_mfa}
              onChange={handleChange}
              style={{ width: "18px", height: "18px" }}
            />
            <label style={{ fontWeight: "bold", fontSize: "14px" }}>MFA Enabled</label>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              name="has_irp"
              type="checkbox"
              checked={form.has_irp}
              onChange={handleChange}
              style={{ width: "18px", height: "18px" }}
            />
            <label style={{ fontWeight: "bold", fontSize: "14px" }}>Incident Response Plan</label>
          </div>
        </div>

        {form.has_mfa && (
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "14px" }}>
              MFA Coverage %
            </label>
            <input
              name="mfa_coverage"
              type="number"
              value={form.mfa_coverage}
              onChange={handleChange}
              style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            background: "#e74c3c",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
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
                {result.risk_score}
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
            <div
              key={i}
              style={{
                padding: "12px 16px",
                marginBottom: "8px",
                background: "#fff8f8",
                borderLeft: "4px solid #e74c3c",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            >
              {rec}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;