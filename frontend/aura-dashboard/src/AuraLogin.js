import { useState } from 'react';

const BASE_URL = process.env.REACT_APP_API_URL || 'https://web-production-320c3.up.railway.app';

function MascotGhost() {
  return (
    <svg width="160" height="160" viewBox="100 10 480 470" xmlns="http://www.w3.org/2000/svg"
      style={{position:'absolute',bottom:-20,right:-20,opacity:.07,pointerEvents:'none'}}>
      <path d="M340 112 C 300 112 252 122 228 133 C 228 220 232 318 340 402 C 448 318 452 220 452 133 C 428 122 380 112 340 112 Z" fill="#a78bfa"/>
      <ellipse cx="305" cy="224" rx="21" ry="25" fill="white"/>
      <ellipse cx="375" cy="224" rx="21" ry="25" fill="white"/>
      <circle cx="309" cy="230" r="10.5" fill="#2b1769"/>
      <circle cx="379" cy="230" r="10.5" fill="#2b1769"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

export default function AuraLogin({ onBack, onSuccess }) {
  const [email, setEmail]     = useState('ciso@democorp.com');
  const [password, setPassword] = useState('Demo123!');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [focusEmail, setFE]   = useState(false);
  const [focusPass, setFP]    = useState(false);

  const handleSignIn = async (e) => {
    e && e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${BASE_URL}/api/auth/login`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `Login failed (${res.status})`);
      onSuccess && onSuccess(data);
    } catch (err) {
      setError(err.message || 'Could not connect. Please try again.');
    } finally { setLoading(false); }
  };

  const inp = (focused) => ({
    width:'100%', boxSizing:'border-box',
    background: focused ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.05)',
    border:`1px solid ${focused ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius:8, padding:'11px 14px', fontSize:14, color:'#ECEEFF', outline:'none',
    fontFamily:"'DM Sans',system-ui,sans-serif", transition:'all .15s',
  });
  const lbl = { fontSize:12, color:'#9CA3AF', fontWeight:500, letterSpacing:'.3px', marginBottom:6, display:'block' };

  return (
    <div style={{
      minHeight:'100vh', background:'#09090F', display:'flex', alignItems:'center',
      justifyContent:'center', fontFamily:"'DM Sans',system-ui,sans-serif",
      position:'relative', overflow:'hidden',
    }}>
      <style>{`
        @keyframes al-spin { to { transform:rotate(360deg) } }
        .al-google:hover { background:rgba(255,255,255,0.1) !important; }
        .al-signin:hover:not(:disabled) { background:#6d28d9 !important; }
        .al-back:hover { color:#ECEEFF !important; }
        input::placeholder { color:#374151; }
      `}</style>

      {/* Glows */}
      <div style={{position:'absolute',top:'-20%',left:'-10%',width:500,height:500,borderRadius:'50%',
        background:'radial-gradient(circle,rgba(124,58,237,.18),transparent 70%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:'-15%',right:'-8%',width:400,height:400,borderRadius:'50%',
        background:'radial-gradient(circle,rgba(219,39,119,.1),transparent 70%)',pointerEvents:'none'}}/>

      {/* Back button */}
      {onBack && (
        <button className="al-back" onClick={onBack} style={{
          position:'absolute', top:24, left:24,
          background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:8, padding:'8px 14px', fontSize:13, color:'#9CA3AF',
          cursor:'pointer', fontFamily:"'DM Sans',system-ui,sans-serif",
          display:'flex', alignItems:'center', gap:6, transition:'color .15s',
        }}>← Back to home</button>
      )}

      {/* Card */}
      <div style={{
        position:'relative', width:'100%', maxWidth:400, margin:'0 16px',
        background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)',
        borderRadius:16, padding:'36px 32px 28px', boxSizing:'border-box', overflow:'hidden',
      }}>
        <MascotGhost/>

        {/* A icon */}
        <div style={{display:'flex',justifyContent:'center',marginBottom:20}}>
          <div style={{
            width:60,height:60,borderRadius:14,
            background:'linear-gradient(135deg,#7c3aed,#db2777)',
            display:'flex',alignItems:'center',justifyContent:'center',
          }}>
            <span style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:'white'}}>A</span>
          </div>
        </div>

        <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:800,color:'#FFFFFF',
          textAlign:'center',margin:'0 0 6px',letterSpacing:'-.5px'}}>Welcome back</h1>
        <p style={{fontSize:14,color:'#9CA3AF',textAlign:'center',margin:'0 0 24px'}}>
          Sign in to your AURA workspace
        </p>

        {/* Google */}
        <button className="al-google" style={{
          width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:10,
          background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:8,padding:'11px 16px',fontSize:14,color:'#ECEEFF',
          cursor:'pointer',fontFamily:"'DM Sans',system-ui,sans-serif",
          marginBottom:18,transition:'background .15s',
        }}>
          <GoogleIcon/> Continue with Google
        </button>

        {/* Divider */}
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
          <div style={{flex:1,height:'1px',background:'rgba(255,255,255,0.08)'}}/>
          <span style={{fontSize:12,color:'#4B5563'}}>or</span>
          <div style={{flex:1,height:'1px',background:'rgba(255,255,255,0.08)'}}/>
        </div>

        {/* Email */}
        <div style={{marginBottom:14}}>
          <label style={lbl}>Work email</label>
          <input type="email" value={email} placeholder="you@company.com"
            onChange={e=>setEmail(e.target.value)}
            onFocus={()=>setFE(true)} onBlur={()=>setFE(false)}
            onKeyDown={e=>e.key==='Enter'&&handleSignIn()}
            style={inp(focusEmail)}/>
        </div>

        {/* Password */}
        <div style={{marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
            <label style={{...lbl,margin:0}}>Password</label>
            <span style={{fontSize:12,color:'#a78bfa',cursor:'pointer'}}>Forgot password?</span>
          </div>
          <input type="password" value={password} placeholder="••••••••"
            onChange={e=>setPassword(e.target.value)}
            onFocus={()=>setFP(true)} onBlur={()=>setFP(false)}
            onKeyDown={e=>e.key==='Enter'&&handleSignIn()}
            style={inp(focusPass)}/>
        </div>

        {/* Error */}
        {error && (
          <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',
            borderRadius:7,padding:'10px 14px',fontSize:13,color:'#FCA5A5',
            marginBottom:16,textAlign:'center'}}>{error}</div>
        )}

        {/* Sign in */}
        <button className="al-signin" onClick={handleSignIn} disabled={loading} style={{
          width:'100%',background:'#7c3aed',border:'none',borderRadius:8,
          padding:'13px',fontSize:15,fontWeight:600,color:'white',
          cursor:loading?'not-allowed':'pointer',fontFamily:"'DM Sans',system-ui,sans-serif",
          opacity:loading?.7:1,transition:'background .15s',
          display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:16,
        }}>
          {loading ? (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
              style={{animation:'al-spin .8s linear infinite'}}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>Signing in…</>
          ) : 'Sign in'}
        </button>

        {/* Register */}
        <p style={{textAlign:'center',fontSize:13,color:'#6B7280',margin:'0 0 18px'}}>
          Don't have an account?{' '}
          <span style={{color:'#a78bfa',cursor:'pointer',fontWeight:500}}>Request access</span>
        </p>

        {/* Status */}
        <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:8,padding:'10px 14px',display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:7,height:7,borderRadius:'50%',background:'#10B981',
            flexShrink:0,boxShadow:'0 0 6px #10B981'}}/>
          <span style={{fontSize:12,color:'#6B7280'}}>All systems operational · 99.98% uptime</span>
        </div>
      </div>
    </div>
  );
}
