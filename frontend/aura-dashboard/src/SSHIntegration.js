/**
 * SSHIntegration.js — AURA SSH Server Integration UI
 * Allows tenants to connect servers via SSH for automated compliance scanning
 */
import { useState, useEffect } from 'react';

const API = "https://web-production-320c3.up.railway.app";

export default function SSHIntegration({ token }) {
  const [connections, setConnections] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [view, setView] = useState('connections'); // connections | add | evidence | scan_result
  const [selectedScan, setSelectedScan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanningId, setScanningId] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const [form, setForm] = useState({ name: '', host: '', port: 22, username: '', private_key: '', description: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => { fetchConnections(); fetchEvidence(); }, []);

  async function fetchConnections() {
    try {
      const r = await fetch(`${API}/api/ssh/connections`, { headers: authHeaders });
      const d = await r.json();
      setConnections(d.connections || []);
    } catch (e) { console.error(e); }
  }

  async function fetchEvidence() {
    try {
      const r = await fetch(`${API}/api/ssh/evidence`, { headers: authHeaders });
      const d = await r.json();
      setEvidence(d.evidence || []);
    } catch (e) { console.error(e); }
  }

  async function addConnection() {
    setError(''); setLoading(true);
    try {
      const r = await fetch(`${API}/api/ssh/connections`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ ...form, port: Number(form.port) })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'Failed');
      setSuccess('Server connected successfully!');
      setForm({ name: '', host: '', port: 22, username: '', private_key: '', description: '' });
      setView('connections');
      fetchConnections();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function testConnection(id) {
    setTestingId(id);
    try {
      const r = await fetch(`${API}/api/ssh/connections/${id}/test`, { method: 'POST', headers: authHeaders });
      const d = await r.json();
      setSuccess(d.success ? `✅ ${d.status} — Connection verified` : `❌ Failed: ${d.error}`);
      fetchConnections();
    } catch (e) { setError(e.message); }
    finally { setTestingId(null); }
  }

  async function runScan(id, name) {
    setScanningId(id);
    setSuccess('');
    try {
      const r = await fetch(`${API}/api/ssh/connections/${id}/scan`, { method: 'POST', headers: authHeaders });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'Scan failed');
      setSuccess(`✅ Scan complete for ${name} — evidence stored`);
      setSelectedScan(d);
      setView('scan_result');
      fetchEvidence();
      fetchConnections();
    } catch (e) { setError(e.message); }
    finally { setScanningId(null); }
  }

  async function deleteConnection(id) {
    if (!window.confirm('Remove this server connection?')) return;
    await fetch(`${API}/api/ssh/connections/${id}`, { method: 'DELETE', headers: authHeaders });
    fetchConnections();
  }

  async function viewScanDetail(scanId) {
    try {
      const r = await fetch(`${API}/api/ssh/evidence/${scanId}`, { headers: authHeaders });
      const d = await r.json();
      setSelectedScan(d);
      setView('scan_result');
    } catch (e) { setError(e.message); }
  }

  const statusColor = (s) => ({ connected: '#10b981', failed: '#ef4444', untested: '#f59e0b' }[s] || '#6b7280');
  const statusDot = (s) => <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:statusColor(s), marginRight:6 }} />;

  return (
    <div style={{ fontFamily:'Inter,sans-serif', background:'#0f172a', minHeight:'100vh', color:'#e2e8f0', padding:24 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:'#f8fafc' }}>🔐 SSH Server Integration</h1>
          <p style={{ margin:'4px 0 0', color:'#94a3b8', fontSize:13 }}>Connect servers to pull logs & run compliance scans automatically</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {['connections','evidence'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding:'8px 16px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:500,
              background: view===v ? '#6366f1' : '#1e293b', color: view===v ? '#fff' : '#94a3b8'
            }}>{v === 'connections' ? `Servers (${connections.length})` : `Evidence (${evidence.length})`}</button>
          ))}
          <button onClick={() => setView('add')} style={{
            padding:'8px 16px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
            background:'#10b981', color:'#fff'
          }}>+ Add Server</button>
        </div>
      </div>

      {/* Alerts */}
      {error && <div style={{ background:'#450a0a', border:'1px solid #ef4444', borderRadius:8, padding:'10px 14px', marginBottom:16, color:'#fca5a5', fontSize:13 }}>{error} <button onClick={()=>setError('')} style={{float:'right',background:'none',border:'none',color:'#fca5a5',cursor:'pointer'}}>✕</button></div>}
      {success && <div style={{ background:'#052e16', border:'1px solid #10b981', borderRadius:8, padding:'10px 14px', marginBottom:16, color:'#6ee7b7', fontSize:13 }}>{success} <button onClick={()=>setSuccess('')} style={{float:'right',background:'none',border:'none',color:'#6ee7b7',cursor:'pointer'}}>✕</button></div>}

      {/* Add Connection Form */}
      {view === 'add' && (
        <div style={{ background:'#1e293b', borderRadius:12, padding:24, maxWidth:600 }}>
          <h2 style={{ margin:'0 0 20px', fontSize:17, color:'#f1f5f9' }}>Add SSH Server</h2>
          {[
            { key:'name', label:'Friendly Name', placeholder:'e.g. Prod Web Server' },
            { key:'host', label:'Host / IP', placeholder:'e.g. 192.168.1.100 or server.example.com' },
            { key:'port', label:'SSH Port', placeholder:'22', type:'number' },
            { key:'username', label:'SSH Username', placeholder:'e.g. ubuntu, ec2-user, root' },
            { key:'description', label:'Description (optional)', placeholder:'What is this server?' },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key} style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:12, color:'#94a3b8', marginBottom:5, fontWeight:500 }}>{label}</label>
              <input type={type||'text'} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder} style={{ width:'100%', background:'#0f172a', border:'1px solid #334155', borderRadius:8, padding:'9px 12px', color:'#f1f5f9', fontSize:13, boxSizing:'border-box' }} />
            </div>
          ))}
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:12, color:'#94a3b8', marginBottom:5, fontWeight:500 }}>
              SSH Private Key (PEM) <span style={{ color:'#6366f1' }}>— stored encrypted with AES-256</span>
            </label>
            <textarea value={form.private_key} onChange={e => setForm(f => ({ ...f, private_key: e.target.value }))}
              placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
              rows={6} style={{ width:'100%', background:'#0f172a', border:'1px solid #334155', borderRadius:8, padding:'9px 12px', color:'#f1f5f9', fontSize:12, boxSizing:'border-box', fontFamily:'monospace', resize:'vertical' }} />
            <p style={{ margin:'5px 0 0', fontSize:11, color:'#64748b' }}>💡 Generate with: <code style={{color:'#818cf8'}}>ssh-keygen -t ed25519 -C "aura-scan"</code> — add the public key to ~/.ssh/authorized_keys on the server</p>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={addConnection} disabled={loading || !form.name || !form.host || !form.username || !form.private_key} style={{
              padding:'10px 20px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:600, fontSize:13,
              background: loading ? '#334155' : '#6366f1', color:'#fff', opacity: (!form.name || !form.host || !form.username || !form.private_key) ? 0.5 : 1
            }}>{loading ? 'Connecting...' : 'Add Server'}</button>
            <button onClick={() => setView('connections')} style={{ padding:'10px 20px', borderRadius:8, border:'1px solid #334155', background:'none', color:'#94a3b8', cursor:'pointer', fontSize:13 }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Connections List */}
      {view === 'connections' && (
        <div>
          {connections.length === 0 ? (
            <div style={{ textAlign:'center', padding:60, color:'#475569' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🖥️</div>
              <p style={{ fontSize:16, margin:0 }}>No servers connected yet</p>
              <p style={{ fontSize:13, marginTop:6 }}>Add a server to start pulling compliance evidence</p>
            </div>
          ) : connections.map(c => (
            <div key={c.id} style={{ background:'#1e293b', borderRadius:12, padding:20, marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                  <span style={{ fontSize:15, fontWeight:600, color:'#f1f5f9' }}>🖥️ {c.name}</span>
                  <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background: c.status==='connected'?'#052e16':c.status==='failed'?'#450a0a':'#1c1400', color: statusColor(c.status), border:`1px solid ${statusColor(c.status)}` }}>
                    {statusDot(c.status)}{c.status}
                  </span>
                </div>
                <div style={{ fontSize:12, color:'#64748b' }}>
                  <span style={{ marginRight:16 }}><code style={{color:'#94a3b8'}}>{c.username}@{c.host}:{c.port}</code></span>
                  {c.last_scan && <span>Last scan: {c.last_scan.slice(0,10)}</span>}
                </div>
                {c.description && <div style={{ fontSize:12, color:'#475569', marginTop:3 }}>{c.description}</div>}
              </div>
              <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                <button onClick={() => testConnection(c.id)} disabled={testingId===c.id} style={{ padding:'7px 14px', borderRadius:7, border:'1px solid #334155', background:'none', color:'#94a3b8', cursor:'pointer', fontSize:12 }}>
                  {testingId===c.id ? '...' : 'Test'}
                </button>
                <button onClick={() => runScan(c.id, c.name)} disabled={scanningId===c.id} style={{ padding:'7px 14px', borderRadius:7, border:'none', background: scanningId===c.id?'#334155':'#6366f1', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                  {scanningId===c.id ? '⏳ Scanning...' : '▶ Run Scan'}
                </button>
                <button onClick={() => deleteConnection(c.id)} style={{ padding:'7px 10px', borderRadius:7, border:'1px solid #334155', background:'none', color:'#ef4444', cursor:'pointer', fontSize:12 }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Evidence List */}
      {view === 'evidence' && (
        <div>
          {evidence.length === 0 ? (
            <div style={{ textAlign:'center', padding:60, color:'#475569' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
              <p style={{ fontSize:16, margin:0 }}>No scan evidence yet</p>
              <p style={{ fontSize:13, marginTop:6 }}>Run a scan on a connected server to collect evidence</p>
            </div>
          ) : evidence.map(e => (
            <div key={e.id} onClick={() => viewScanDetail(e.id)} style={{ background:'#1e293b', borderRadius:12, padding:18, marginBottom:10, cursor:'pointer', border:'1px solid transparent', transition:'border-color .15s' }}
              onMouseEnter={ev=>ev.currentTarget.style.borderColor='#6366f1'} onMouseLeave={ev=>ev.currentTarget.style.borderColor='transparent'}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontWeight:600, color:'#f1f5f9', fontSize:14, marginBottom:4 }}>📋 {e.name}</div>
                  <div style={{ fontSize:12, color:'#64748b' }}>
                    <code style={{color:'#94a3b8', marginRight:12}}>{e.source}</code>
                    <span>Categories: {e.categories?.join(', ')}</span>
                  </div>
                </div>
                <div style={{ textAlign:'right', fontSize:12, color:'#64748b' }}>
                  <div>{e.collected_at?.slice(0,16).replace('T',' ')}</div>
                  <div style={{ color:'#818cf8', marginTop:3 }}>View details →</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scan Result Detail */}
      {view === 'scan_result' && selectedScan && (
        <div>
          <button onClick={() => setView('evidence')} style={{ marginBottom:16, padding:'7px 14px', borderRadius:7, border:'1px solid #334155', background:'none', color:'#94a3b8', cursor:'pointer', fontSize:13 }}>← Back</button>
          <div style={{ background:'#1e293b', borderRadius:12, padding:20, marginBottom:16 }}>
            <h2 style={{ margin:'0 0 6px', fontSize:16, color:'#f1f5f9' }}>{selectedScan.name || `Scan — ${selectedScan.server}`}</h2>
            <div style={{ fontSize:12, color:'#64748b' }}>
              <span style={{ marginRight:16 }}>Server: <code style={{color:'#94a3b8'}}>{selectedScan.source || selectedScan.server}</code></span>
              <span>Evidence stored ✅</span>
            </div>
          </div>
          {Object.entries(selectedScan.results || {}).map(([cat, data]) => (
            <div key={cat} style={{ background:'#1e293b', borderRadius:10, padding:18, marginBottom:12 }}>
              <h3 style={{ margin:'0 0 14px', fontSize:14, color:'#818cf8', fontWeight:600 }}>📂 {data.label || cat}</h3>
              {Object.entries(data.results || {}).map(([cmd, res]) => (
                <div key={cmd} style={{ marginBottom:12, borderLeft:'2px solid #334155', paddingLeft:12 }}>
                  <div style={{ fontSize:11, color:'#64748b', fontFamily:'monospace', marginBottom:4 }}>$ {cmd}</div>
                  {res.error ? (
                    <div style={{ fontSize:12, color:'#f87171' }}>Error: {res.error}</div>
                  ) : (
                    <pre style={{ margin:0, fontSize:11, color:'#94a3b8', background:'#0f172a', padding:'8px 10px', borderRadius:6, overflow:'auto', maxHeight:150, whiteSpace:'pre-wrap', wordBreak:'break-all' }}>
                      {res.stdout || <span style={{color:'#475569'}}>(no output)</span>}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
