import { useState, useEffect, useCallback } from "react";
import { Users, Plus, RefreshCw, Trash2, X, Mail } from "lucide-react";
const API="http://localhost:8001";
const STATUS_CFG={ACTIVE:{color:"#34D399",bg:"rgba(52,211,153,.12)",label:"Active"},INVITED:{color:"#60A5FA",bg:"rgba(96,165,250,.12)",label:"Invited"},SUSPENDED:{color:"#F87171",bg:"rgba(248,113,113,.12)",label:"Suspended"}};
const ROLE_COLORS={admin:"#F87171",ciso:"#A78BFA",auditor:"#60A5FA",developer:"#34D399",viewer:"#94A3B8"};
const ROLES=["admin","ciso","auditor","developer","viewer"];
const STATUSES=["All","ACTIVE","INVITED","SUSPENDED"];
function btn(bg,border){return{display:"flex",alignItems:"center",gap:6,padding:"9px 14px",background:bg,border:`1px solid ${border}`,borderRadius:8,color:"#94A3B8",fontSize:13,cursor:"pointer"};}
function Avatar({name,color,size=36}){const initials=name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();return(<div style={{width:size,height:size,borderRadius:"50%",background:`${color}20`,border:`2px solid ${color}40`,display:"flex",alignItems:"center",justifyContent:"center",color,fontSize:size*0.35,fontWeight:700,flexShrink:0}}>{initials}</div>);}
export default function UserManagement({token,tenantId}){
const[members,setMembers]=useState([]);
const[roles,setRoles]=useState([]);
const[loading,setLoading]=useState(true);
const[filterStatus,setFilterStatus]=useState("All");
const[filterRole,setFilterRole]=useState("All");
const[showInvite,setShowInvite]=useState(false);
const[form,setForm]=useState({name:"",email:"",role:"auditor"});
const[saving,setSaving]=useState(false);
const[stats,setStats]=useState({});
const[showRoleInfo,setShowRoleInfo]=useState(null);
const fetch_=useCallback(async()=>{
setLoading(true);
try{
const p=new URLSearchParams({tenant_id:tenantId||"demo"});
if(filterStatus!=="All")p.set("status",filterStatus);
if(filterRole!=="All")p.set("role",filterRole);
const[mRes,rRes]=await Promise.all([fetch(`${API}/api/users?${p}`,{headers:{Authorization:`Bearer ${token}`}}),fetch(`${API}/api/users/roles`,{headers:{Authorization:`Bearer ${token}`}})]);
const mData=await mRes.json();const rData=await rRes.json();
const list=mData.members||mData.users||[];
setMembers(list);setRoles(rData.roles||[]);
setStats({total:list.length,active:list.filter(m=>m.status==="ACTIVE").length,invited:list.filter(m=>m.status==="INVITED").length,mfa:list.filter(m=>m.mfa_enabled).length});
}catch{setMembers([]);}finally{setLoading(false);}
},[token,tenantId,filterStatus,filterRole]);
useEffect(()=>{fetch_();},[fetch_]);
const inviteMember=async()=>{
if(!form.email||!form.name)return alert("Name and email required.");
setSaving(true);
try{await fetch(`${API}/api/users/invite?tenant_id=${tenantId||"demo"}`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({...form,invited_by:"Current User"})});setShowInvite(false);setForm({name:"",email:"",role:"auditor"});fetch_();}catch{alert("Invite failed");}finally{setSaving(false);}};
const updateRole=async(id,role)=>{try{await fetch(`${API}/api/users/${id}/role?role=${role}`,{method:"PATCH",headers:{Authorization:`Bearer ${token}`}});fetch_();}catch{alert("Failed");}};
const updateStatus=async(id,status)=>{try{await fetch(`${API}/api/users/${id}/status?status=${status}`,{method:"PATCH",headers:{Authorization:`Bearer ${token}`}});fetch_();}catch{alert("Failed");}};
const removeMember=async(id)=>{if(!window.confirm("Remove this member?"))return;try{await fetch(`${API}/api/users/${id}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});fetch_();}catch{alert("Failed");}};
function timeAgo(iso){if(!iso)return"Never";const d=(Date.now()-new Date(iso))/1000;if(d<3600)return`${Math.floor(d/60)}m ago`;if(d<86400)return`${Math.floor(d/3600)}h ago`;return`${Math.floor(d/86400)}d ago`;}
return(<div style={{padding:"28px 32px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28}}>
<div><h2 style={{margin:0,fontSize:22,fontWeight:700,color:"#F1F5F9",display:"flex",alignItems:"center",gap:10}}><Users size={22} color="#F9A8D4"/>User Management</h2><p style={{margin:"6px 0 0",color:"#64748B",fontSize:13}}>Manage team members and role-based access control</p></div>
<div style={{display:"flex",gap:10}}><button onClick={fetch_} style={btn("#1E293B","#334155")}><RefreshCw size={14}/>Refresh</button><button onClick={()=>setShowInvite(true)} style={btn("#1C1033","#7C3AED")}><Plus size={14}/>Invite Member</button></div>
</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
{[{label:"Total Members",value:stats.total,color:"#60A5FA"},{label:"Active",value:stats.active,color:"#34D399"},{label:"Pending Invite",value:stats.invited,color:"#FBBF24"},{label:"MFA Enabled",value:stats.mfa,color:"#A78BFA"}].map(s=>(<div key={s.label} style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:12,padding:"16px 18px"}}><div style={{color:"#64748B",fontSize:12,marginBottom:8}}>{s.label}</div><div style={{fontSize:26,fontWeight:700,color:s.color}}>{s.value||0}</div></div>))}
</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:24}}>
{roles.map(r=>(<div key={r.id} style={{background:"#0F172A",border:`1px solid ${r.color}30`,borderRadius:12,padding:14,cursor:"pointer"}} onClick={()=>setShowRoleInfo(showRoleInfo===r.id?null:r.id)}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{color:r.color,fontSize:13,fontWeight:600}}>{r.label}</span><span style={{background:`${r.color}18`,color:r.color,borderRadius:10,padding:"2px 7px",fontSize:11}}>{members.filter(m=>m.role===r.id).length}</span></div>
<div style={{color:"#475569",fontSize:11,lineHeight:1.4}}>{r.description}</div>
{showRoleInfo===r.id&&(<div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${r.color}20`}}>{(r.permissions||[]).slice(0,4).map(p=><div key={p} style={{color:"#64748B",fontSize:10,marginBottom:2}}>• {p}</div>)}</div>)}
</div>))}
</div>
<div style={{display:"flex",gap:10,marginBottom:20}}>
{[{value:filterStatus,setter:setFilterStatus,options:STATUSES},{value:filterRole,setter:setFilterRole,options:["All",...ROLES]}].map((f,i)=>(<select key={i} value={f.value} onChange={e=>f.setter(e.target.value)} style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:8,padding:"9px 14px",color:"#94A3B8",fontSize:13,cursor:"pointer"}}>{f.options.map(o=><option key={o}>{o}</option>)}</select>))}
</div>
{loading?<div style={{textAlign:"center",padding:60,color:"#475569"}}><RefreshCw size={20} style={{animation:"spin 1s linear infinite"}}/></div>:(
<div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:14,overflow:"hidden"}}>
<div style={{display:"grid",gridTemplateColumns:"280px 110px 120px 90px 120px 150px",padding:"12px 16px",borderBottom:"1px solid #1E293B",color:"#475569",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}><span>Member</span><span>Role</span><span>Status</span><span>MFA</span><span>Last Login</span><span>Actions</span></div>
{members.map(m=>{const sc=STATUS_CFG[m.status]||STATUS_CFG.ACTIVE;const rc=ROLE_COLORS[m.role]||"#94A3B8";return(<div key={m.id} style={{display:"grid",gridTemplateColumns:"280px 110px 120px 90px 120px 150px",padding:"14px 16px",borderBottom:"1px solid #0D1B2E",alignItems:"center"}}>
<div style={{display:"flex",alignItems:"center",gap:10}}><Avatar name={m.name} color={m.avatar_color||rc}/><div><div style={{color:"#E2E8F0",fontSize:13,fontWeight:500}}>{m.name}</div><div style={{color:"#475569",fontSize:11}}>{m.email}</div></div></div>
<select value={m.role} onChange={e=>updateRole(m.id,e.target.value)} style={{background:"transparent",border:"none",color:rc,fontSize:12,fontWeight:600,cursor:"pointer",padding:0}}>{ROLES.map(r=><option key={r} style={{background:"#0F172A",color:"#F1F5F9"}}>{r}</option>)}</select>
<span><span style={{background:sc.bg,color:sc.color,borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:600}}>{sc.label}</span></span>
<span style={{color:m.mfa_enabled?"#34D399":"#F87171",fontSize:12}}>{m.mfa_enabled?"✓ On":"✗ Off"}</span>
<span style={{color:"#64748B",fontSize:12}}>{timeAgo(m.last_login)}</span>
<div style={{display:"flex",gap:6}}>
{m.status==="ACTIVE"&&<button onClick={()=>updateStatus(m.id,"SUSPENDED")} style={{background:"none",border:"1px solid #334155",borderRadius:6,padding:"4px 8px",color:"#FBBF24",cursor:"pointer",fontSize:11}}>Suspend</button>}
{m.status==="SUSPENDED"&&<button onClick={()=>updateStatus(m.id,"ACTIVE")} style={{background:"none",border:"1px solid #334155",borderRadius:6,padding:"4px 8px",color:"#34D399",cursor:"pointer",fontSize:11}}>Activate</button>}
<button onClick={()=>removeMember(m.id)} style={{background:"none",border:"1px solid #334155",borderRadius:6,padding:"4px 6px",color:"#F87171",cursor:"pointer"}}><Trash2 size={12}/></button>
</div>
</div>);})}
{members.length===0&&<div style={{textAlign:"center",padding:40,color:"#475569",fontSize:13}}>No members found.</div>}
</div>)}
{showInvite&&(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&setShowInvite(false)}>
<div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:16,padding:28,width:420}}>
<div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}><h3 style={{margin:0,color:"#F1F5F9",fontSize:17}}>Invite Team Member</h3><button onClick={()=>setShowInvite(false)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer"}}><X size={18}/></button></div>
{[{label:"Full Name *",key:"name",type:"text"},{label:"Email Address *",key:"email",type:"email"}].map(f=>(<label key={f.key} style={{display:"block",marginBottom:14}}><div style={{color:"#64748B",fontSize:12,marginBottom:5}}>{f.label}</div><input type={f.type} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} style={{width:"100%",background:"#1E293B",border:"1px solid #334155",borderRadius:8,padding:"9px 12px",color:"#F1F5F9",fontSize:13,boxSizing:"border-box"}}/></label>))}
<label style={{display:"block",marginBottom:20}}><div style={{color:"#64748B",fontSize:12,marginBottom:5}}>Role</div><select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} style={{width:"100%",background:"#1E293B",border:"1px solid #334155",borderRadius:8,padding:"9px 12px",color:"#F1F5F9",fontSize:13}}>{ROLES.map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}</select><div style={{color:"#475569",fontSize:11,marginTop:6}}>{roles.find(r=>r.id===form.role)?.description}</div></label>
<div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button onClick={()=>setShowInvite(false)} style={btn("#1E293B","#334155")}>Cancel</button><button onClick={inviteMember} disabled={saving} style={btn("#1C1033","#7C3AED")}>{saving?"Sending…":<><Mail size={14}/>Send Invite</>}</button></div>
</div></div>)}
<style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
</div>);}
