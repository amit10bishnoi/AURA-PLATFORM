import { useState, useEffect, useCallback } from "react";
import { Lock, RefreshCw, CheckCircle, ExternalLink, Shield, Key, X } from "lucide-react";
const API="http://localhost:8001";
const PROVIDER_ICONS={
  google:(<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>),
  microsoft:(<svg viewBox="0 0 24 24" width="20" height="20"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>),
  okta:(<div style={{width:20,height:20,borderRadius:4,background:"#007DC1",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:10,fontWeight:700}}>O</div>),
  github:(<svg viewBox="0 0 24 24" width="20" height="20" fill="#E2E8F0"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>),
};
function btn(bg,border){return{display:"flex",alignItems:"center",gap:6,padding:"9px 14px",background:bg,border:`1px solid ${border}`,borderRadius:8,color:"#94A3B8",fontSize:13,cursor:"pointer"};}
const SETUP_GUIDES={
  google:{steps:["Go to Google Cloud Console → APIs & Services → Credentials","Create OAuth 2.0 Client ID (Web Application)","Add Authorized redirect URI: https://app.aura.io/auth/callback/google","Copy Client ID and Client Secret below"],docs:"https://console.cloud.google.com/"},
  microsoft:{steps:["Go to Azure Portal → Azure Active Directory → App registrations","Register new application","Add redirect URI: https://app.aura.io/auth/callback/microsoft","Go to Certificates & Secrets → New client secret"],docs:"https://portal.azure.com/"},
  okta:{steps:["Go to Okta Admin → Applications → Create App Integration","Select OIDC and Web Application","Set Sign-in redirect URI: https://app.aura.io/auth/callback/okta","Copy Client ID and Client Secret below"],docs:"https://developer.okta.com/"},
  github:{steps:["Go to GitHub Settings → Developer settings → OAuth Apps","Register new OAuth application","Set callback URL: https://app.aura.io/auth/callback/github","Copy Client ID and Client Secret below"],docs:"https://github.com/settings/developers"},
};
export default function SSOSettings({token,tenantId}){
const[providers,setProviders]=useState([]);
const[loading,setLoading]=useState(true);
const[configuring,setConfiguring]=useState(null);
const[form,setForm]=useState({client_id:"",client_secret:"",domain:""});
const[saving,setSaving]=useState(false);
const fetch_=useCallback(async()=>{
setLoading(true);
try{const res=await fetch(`${API}/api/sso/providers?tenant_id=${tenantId||"demo"}`,{headers:{Authorization:`Bearer ${token}`}});const data=await res.json();setProviders(data.providers||[]);}
catch{setProviders([]);}finally{setLoading(false);}
},[token,tenantId]);
useEffect(()=>{fetch_();},[fetch_]);
const connectProvider=async(id)=>{
setSaving(true);
try{await fetch(`${API}/api/sso/providers/${id}/connect?tenant_id=${tenantId||"demo"}`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(form)});
setConfiguring(null);setForm({client_id:"",client_secret:"",domain:""});fetch_();
alert(`SSO connected! Redirect URI: https://app.aura.io/auth/callback/${id}`);}
catch{alert("Connection failed");}finally{setSaving(false);}};
const disconnectProvider=async(id)=>{
if(!window.confirm("Disconnect this SSO provider?"))return;
try{await fetch(`${API}/api/sso/providers/${id}/disconnect?tenant_id=${tenantId||"demo"}`,{method:"POST",headers:{Authorization:`Bearer ${token}`}});fetch_();}
catch{alert("Disconnect failed");}};
return(<div style={{padding:"28px 32px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28}}>
<div><h2 style={{margin:0,fontSize:22,fontWeight:700,color:"#F1F5F9",display:"flex",alignItems:"center",gap:10}}><Lock size={22} color="#60A5FA"/>SSO Configuration</h2><p style={{margin:"6px 0 0",color:"#64748B",fontSize:13}}>Configure Single Sign-On for your team</p></div>
<button onClick={fetch_} style={btn("#1E293B","#334155")}><RefreshCw size={14}/>Refresh</button>
</div>
<div style={{background:"rgba(96,165,250,.05)",border:"1px solid rgba(96,165,250,.15)",borderRadius:12,padding:"14px 18px",marginBottom:24,display:"flex",alignItems:"center",gap:10}}>
<Shield size={15} color="#60A5FA"/>
<span style={{color:"#64748B",fontSize:13}}>SSO lets your team sign in using existing company accounts. Supports OIDC and SAML 2.0.</span>
</div>
{loading?<div style={{textAlign:"center",padding:60,color:"#475569"}}><RefreshCw size={20} style={{animation:"spin 1s linear infinite"}}/></div>:(
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
{providers.map(p=>(
<div key={p.id} style={{background:"#0F172A",border:`1px solid ${p.connected?"rgba(52,211,153,.2)":"#1E293B"}`,borderRadius:14,padding:20}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
<div style={{display:"flex",alignItems:"center",gap:10}}>
<div style={{width:36,height:36,borderRadius:8,background:"#1E293B",display:"flex",alignItems:"center",justifyContent:"center"}}>{PROVIDER_ICONS[p.id]||<Key size={16} color="#94A3B8"/>}</div>
<div><div style={{color:"#E2E8F0",fontSize:14,fontWeight:600}}>{p.name}</div><div style={{color:"#475569",fontSize:12}}>{p.description}</div></div>
</div>
{p.connected?<span style={{background:"rgba(52,211,153,.1)",color:"#34D399",borderRadius:6,padding:"3px 9px",fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:4}}><CheckCircle size={10}/>Connected</span>:<span style={{background:"rgba(148,163,184,.1)",color:"#94A3B8",borderRadius:6,padding:"3px 9px",fontSize:11,fontWeight:600}}>Not Connected</span>}
</div>
{p.connected?(
<div style={{display:"flex",gap:8}}>
<div style={{flex:1,background:"rgba(52,211,153,.05)",border:"1px solid rgba(52,211,153,.1)",borderRadius:8,padding:"10px 12px",fontSize:12,color:"#64748B"}}>
<div style={{color:"#34D399",fontWeight:500,marginBottom:2}}>Active</div>
<div>Redirect URI: <span style={{color:"#94A3B8",fontFamily:"monospace",fontSize:11}}>https://app.aura.io/auth/callback/{p.id}</span></div>
</div>
<button onClick={()=>disconnectProvider(p.id)} style={{background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",borderRadius:8,padding:"8px 12px",color:"#F87171",cursor:"pointer",fontSize:12}}>Disconnect</button>
</div>
):(
<button onClick={()=>setConfiguring(p.id)} style={{width:"100%",background:"rgba(99,102,241,.08)",border:"1px solid rgba(99,102,241,.2)",borderRadius:8,padding:"9px",color:"#818CF8",cursor:"pointer",fontSize:13,fontWeight:500,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>Configure {p.name}</button>
)}
</div>))}
</div>)}
{configuring&&(
<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&setConfiguring(null)}>
<div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:16,padding:28,width:520,maxHeight:"90vh",overflowY:"auto"}}>
<div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
<h3 style={{margin:0,color:"#F1F5F9",fontSize:17}}>Configure {providers.find(p=>p.id===configuring)?.name}</h3>
<button onClick={()=>setConfiguring(null)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer"}}><X size={18}/></button>
</div>
{SETUP_GUIDES[configuring]&&(
<div style={{background:"#060E1C",border:"1px solid #1E293B",borderRadius:10,padding:16,marginBottom:20}}>
<div style={{color:"#60A5FA",fontSize:12,fontWeight:600,marginBottom:10,display:"flex",alignItems:"center",gap:6}}><ExternalLink size={12}/>Setup Instructions</div>
{SETUP_GUIDES[configuring].steps.map((s,i)=>(<div key={i} style={{display:"flex",gap:8,marginBottom:8}}><span style={{color:"#6366F1",fontSize:11,fontWeight:700,minWidth:16}}>{i+1}.</span><span style={{color:"#64748B",fontSize:12,lineHeight:1.5}}>{s}</span></div>))}
<a href={SETUP_GUIDES[configuring].docs} target="_blank" rel="noreferrer" style={{color:"#60A5FA",fontSize:12,display:"flex",alignItems:"center",gap:4,marginTop:8}}>Open Console <ExternalLink size={11}/></a>
</div>)}
{[{label:"Client ID *",key:"client_id",placeholder:"your-client-id"},{label:"Client Secret *",key:"client_secret",placeholder:"your-client-secret",type:"password"},{label:"Domain (optional)",key:"domain",placeholder:"yourcompany.com"}].map(f=>(
<label key={f.key} style={{display:"block",marginBottom:14}}>
<div style={{color:"#64748B",fontSize:12,marginBottom:5}}>{f.label}</div>
<input type={f.type||"text"} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} placeholder={f.placeholder} style={{width:"100%",background:"#1E293B",border:"1px solid #334155",borderRadius:8,padding:"9px 12px",color:"#F1F5F9",fontSize:13,boxSizing:"border-box",fontFamily:"monospace"}}/>
</label>))}
<div style={{background:"rgba(251,191,36,.05)",border:"1px solid rgba(251,191,36,.15)",borderRadius:8,padding:"10px 12px",marginBottom:20,fontSize:12,color:"#64748B"}}>
Redirect URI: <span style={{fontFamily:"monospace",color:"#94A3B8"}}>https://app.aura.io/auth/callback/{configuring}</span>
</div>
<div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
<button onClick={()=>setConfiguring(null)} style={btn("#1E293B","#334155")}>Cancel</button>
<button onClick={()=>connectProvider(configuring)} disabled={saving||!form.client_id||!form.client_secret} style={btn("#1E3A5F","#2563EB")}>{saving?"Connecting...":<><CheckCircle size={14}/>Connect</>}</button>
</div>
</div></div>)}
<div style={{marginTop:24,background:"#0F172A",border:"1px solid #1E293B",borderRadius:14,padding:20}}>
<h4 style={{margin:"0 0 14px",color:"#94A3B8",fontSize:12,textTransform:"uppercase",letterSpacing:".05em"}}>SSO Security Settings</h4>
<div style={{display:"flex",flexDirection:"column",gap:10}}>
{[{label:"Enforce SSO for all users",desc:"Users cannot log in with email/password when SSO is active",enabled:false},{label:"Auto-provision new users via SSO",desc:"New users are automatically created when they sign in via SSO",enabled:true},{label:"Sync roles from identity provider",desc:"User roles are synced from your IdP groups",enabled:false},{label:"Require SSO for admin accounts",desc:"Admin accounts must use SSO",enabled:true}].map((s,i)=>(
<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",background:"#060E1C",borderRadius:8}}>
<div><div style={{color:"#CBD5E1",fontSize:13,fontWeight:500,marginBottom:2}}>{s.label}</div><div style={{color:"#475569",fontSize:12}}>{s.desc}</div></div>
<div style={{width:40,height:22,borderRadius:11,background:s.enabled?"#16A34A":"#334155",cursor:"pointer",position:"relative",flexShrink:0}}><div style={{position:"absolute",top:2,left:s.enabled?20:2,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/></div>
</div>))}
</div>
</div>
<style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
</div>);}