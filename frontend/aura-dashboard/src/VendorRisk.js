import { useState, useEffect, useCallback } from "react";
import { Building2, Plus, Search, RefreshCw, Send, Trash2, ChevronLeft, X, Save } from "lucide-react";
const API="https://web-production-320c3.up.railway.app";
const RISK_CFG={LOW:{c:"#10b981",bg:"rgba(16,185,129,0.1)"},MEDIUM:{c:"#f59e0b",bg:"rgba(245,158,11,0.1)"},HIGH:{c:"#f97316",bg:"rgba(249,115,22,0.1)"},CRITICAL:{c:"#ef4444",bg:"rgba(239,68,68,0.12)"}};
const Q_CFG={NOT_SENT:{c:"#475569",l:"Not Sent"},SENT:{c:"#3b82f6",l:"Sent"},COMPLETED:{c:"#10b981",l:"Completed"},OVERDUE:{c:"#ef4444",l:"Overdue"}};
const EMPTY={name:"",category:"SaaS",website:"",contact_email:"",risk_score:0,risk_level:"LOW",data_access:[],frameworks:[],notes:""};
const DATA_TYPES=["Customer PII","Employee PII","Financial Data","Payment Data","Health Data","Identity","Infrastructure","Source Code","Analytics","Backups"];

const sty={
  hdr:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24},
  h2:{fontSize:20,fontWeight:800,color:"#e2e8f0",display:"flex",alignItems:"center",gap:10,margin:0},
  sub:{color:"#475569",fontSize:13,marginTop:4},
  btnGhost:{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:9,color:"#a78bfa",fontSize:13,fontWeight:600,cursor:"pointer"},
  btnPrimary:{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",border:"none",borderRadius:9,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"},
  btnDanger:{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:9,color:"#ef4444",fontSize:13,cursor:"pointer"},
  card:{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:12,padding:"16px 20px",marginBottom:8,display:"flex",alignItems:"center",gap:16,cursor:"pointer",transition:"border-color .2s"},
  badge:(c,bg)=>({background:bg,color:c,borderRadius:100,padding:"3px 10px",fontSize:11,fontWeight:700}),
  searchBar:{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(139,92,246,0.1)",borderRadius:9,padding:"0 14px",height:36,flex:1},
  searchInput:{background:"none",border:"none",outline:"none",fontSize:13,color:"#e2e8f0",width:"100%",fontFamily:"inherit"},
  select:{background:"#111827",border:"1px solid rgba(139,92,246,0.15)",borderRadius:8,padding:"6px 12px",color:"#94a3b8",fontSize:13,outline:"none"},
  modal:{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(4px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20},
  modalBox:{background:"#111827",border:"1px solid rgba(139,92,246,0.2)",borderRadius:16,padding:28,width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto"},
  field:{marginBottom:14},
  lbl:{display:"block",fontSize:10,fontWeight:700,color:"#94a3b8",marginBottom:5,textTransform:"uppercase",letterSpacing:".5px"},
  inp:{width:"100%",background:"#1a2235",border:"1px solid rgba(139,92,246,0.15)",borderRadius:8,padding:"9px 12px",color:"#e2e8f0",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"},
};

function RiskBar({score}){
  const c=score>=80?"#ef4444":score>=60?"#f97316":score>=40?"#f59e0b":"#10b981";
  return <div style={{display:"flex",alignItems:"center",gap:8}}>
    <div style={{flex:1,height:5,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden"}}>
      <div style={{width:`${score}%`,height:"100%",background:c,borderRadius:3}}/>
    </div>
    <span style={{color:c,fontSize:12,fontWeight:700,minWidth:28}}>{score}</span>
  </div>;
}

export default function VendorRisk({token,tenantId}){
  const[vendors,setVendors]=useState([]);
  const[loading,setLoading]=useState(true);
  const[search,setSearch]=useState("");
  const[filterRisk,setFilterRisk]=useState("All");
  const[selected,setSelected]=useState(null);
  const[showCreate,setShowCreate]=useState(false);
  const[form,setForm]=useState(EMPTY);
  const[saving,setSaving]=useState(false);
  const[stats,setStats]=useState({});

  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const p=new URLSearchParams({tenant_id:tenantId||"demo"});
      if(filterRisk!=="All")p.set("risk_level",filterRisk);
      if(search)p.set("search",search);
      const res=await fetch(`${API}/api/vendors?tenant_id=${tenantId||'tenant_533ed68d0977'}&${p}`,{headers:{Authorization:`Bearer ${token}`}});
      const data=await res.json();
      const list=data.vendors||[];
      setVendors(list);
      setStats({total:list.length,critical:list.filter(v=>v.risk_level==="CRITICAL").length,high:list.filter(v=>v.risk_level==="HIGH").length,overdue:list.filter(v=>v.questionnaire_status==="OVERDUE").length});
    }catch{setVendors([]);}
    setLoading(false);
  },[token,tenantId,filterRisk,search]);

  useEffect(()=>{load();},[load]);

  const save=async()=>{
    if(!form.name)return alert("Vendor name required");
    setSaving(true);
    try{await fetch(`${API}/api/vendors?tenant_id=${tenantId||"tenant_533ed68d0977"}`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(form)});setShowCreate(false);setForm(EMPTY);load();}
    catch{alert("Save failed");}
    setSaving(false);
  };

  const sendQ=async(id)=>{try{await fetch(`${API}/api/vendors/${id}/questionnaire`,{method:"PATCH",headers:{Authorization:`Bearer ${token}`}});load();}catch{alert("Failed");}};
  const del=async(id)=>{if(!window.confirm("Remove vendor?"))return;try{await fetch(`${API}/api/vendors/${id}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});setSelected(null);load();}catch{alert("Failed");}};
  const toggleArr=(key,val)=>setForm(f=>({...f,[key]:f[key].includes(val)?f[key].filter(x=>x!==val):[...f[key],val]}));

  if(selected){
    const rc=RISK_CFG[selected.risk_level]||RISK_CFG.LOW;
    const qc=Q_CFG[selected.questionnaire_status]||Q_CFG.NOT_SENT;
    return(
      <div>
        <button onClick={()=>setSelected(null)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#475569",fontSize:13,cursor:"pointer",marginBottom:20,padding:0}}>
          <ChevronLeft size={14}/>Back to Vendors
        </button>
        <div style={{background:"#111827",border:"1px solid rgba(139,92,246,0.12)",borderRadius:16,padding:28,marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <span style={sty.badge(rc.c,rc.bg)}>{selected.risk_level} Risk</span>
                <span style={sty.badge(qc.c,qc.c+"20")}>Q: {qc.l}</span>
                <span style={sty.badge("#3b82f6","rgba(59,130,246,0.1)")}>{selected.category}</span>
              </div>
              <h2 style={{margin:0,fontSize:22,fontWeight:800,color:"#e2e8f0"}}>{selected.name}</h2>
              {selected.website&&<div style={{color:"#3b82f6",fontSize:13,marginTop:4}}>{selected.website}</div>}
              {selected.contact_email&&<div style={{color:"#475569",fontSize:12,marginTop:2}}>{selected.contact_email}</div>}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>sendQ(selected.id)} style={sty.btnGhost}><Send size={13}/>Send Questionnaire</button>
              <button onClick={()=>del(selected.id)} style={sty.btnDanger}><Trash2 size={13}/>Remove</button>
            </div>
          </div>
          <div style={{marginTop:20}}>
            <div style={{fontSize:11,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:".5px",marginBottom:8}}>Risk Score</div>
            <RiskBar score={selected.risk_score||0}/>
          </div>
          {(selected.data_access||[]).length>0&&(
            <div style={{marginTop:16}}>
              <div style={{fontSize:11,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:".5px",marginBottom:8}}>Data Access</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {selected.data_access.map(d=><span key={d} style={{background:"rgba(239,68,68,0.1)",color:"#f87171",borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:600}}>{d}</span>)}
              </div>
            </div>
          )}
          {selected.notes&&<div style={{marginTop:16,fontSize:13,color:"#64748b",lineHeight:1.6}}>{selected.notes}</div>}
        </div>
      </div>
    );
  }

  return(
    <div>
      <div style={sty.hdr}>
        <div>
          <h2 style={sty.h2}><Building2 size={20} color="#3b82f6"/>Third-Party Vendor Risk</h2>
          <p style={sty.sub}>Assess and monitor supplier security posture · Send questionnaires · Track risk scores</p>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={load} style={sty.btnGhost}><RefreshCw size={13}/>Refresh</button>
          <button onClick={()=>setShowCreate(true)} style={sty.btnPrimary}><Plus size={13}/>Add Vendor</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[{l:"Total Vendors",v:stats.total??0,c:"#8b5cf6"},{l:"Critical Risk",v:stats.critical??0,c:"#ef4444"},{l:"High Risk",v:stats.high??0,c:"#f97316"},{l:"Overdue Q",v:stats.overdue??0,c:"#f59e0b"}].map(st=>(
          <div key={st.l} style={{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:12,padding:"16px 18px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:st.c}}/>
            <div style={{fontSize:24,fontWeight:800,color:st.c,marginBottom:2}}>{st.v}</div>
            <div style={{fontSize:11,color:"#475569",textTransform:"uppercase",letterSpacing:".5px"}}>{st.l}</div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",gap:10,marginBottom:18}}>
        <div style={sty.searchBar}><Search size={13} color="#475569"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search vendors…" style={sty.searchInput}/></div>
        <select value={filterRisk} onChange={e=>setFilterRisk(e.target.value)} style={sty.select}>
          {["All","LOW","MEDIUM","HIGH","CRITICAL"].map(r=><option key={r}>{r}</option>)}
        </select>
      </div>

      {loading ? <div style={{textAlign:"center",padding:60,color:"#475569"}}><RefreshCw size={20} style={{animation:"spin 1s linear infinite"}}/></div> : (
        <div>
          {vendors.length===0&&<div style={{textAlign:"center",padding:60,color:"#475569"}}><Building2 size={32} style={{opacity:.3}}/><p style={{marginTop:12}}>No vendors yet.</p></div>}
          {vendors.map(v=>{
            const rc=RISK_CFG[v.risk_level]||RISK_CFG.LOW;
            const qc=Q_CFG[v.questionnaire_status]||Q_CFG.NOT_SENT;
            return(
              <div key={v.id} style={sty.card} onClick={()=>setSelected(v)}>
                <div style={{width:40,height:40,borderRadius:10,background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Building2 size={18} color="#3b82f6"/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,color:"#e2e8f0",marginBottom:2}}>{v.name}</div>
                  <div style={{fontSize:12,color:"#475569"}}>{v.category} · {v.contact_email||"No email"}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                  <div style={{width:80}}><RiskBar score={v.risk_score||0}/></div>
                  <span style={sty.badge(rc.c,rc.bg)}>{v.risk_level}</span>
                  <span style={{fontSize:11,color:qc.c,fontWeight:600}}>{qc.l}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate&&(
        <div style={sty.modal} onClick={e=>e.target===e.currentTarget&&setShowCreate(false)}>
          <div style={sty.modalBox}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,color:"#e2e8f0",fontSize:16,fontWeight:700}}>Add Vendor</h3>
              <button onClick={()=>setShowCreate(false)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer"}}><X size={18}/></button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[["Vendor Name","text","name","Acme Corp"],["Website","text","website","https://"],["Contact Email","email","contact_email","security@vendor.com"]].map(([l,t,k,ph])=>(
                <div key={k} style={{...sty.field,gridColumn:k==="name"?"1/-1":"auto"}}>
                  <label style={sty.lbl}>{l}</label>
                  <input type={t} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={ph} style={sty.inp}/>
                </div>
              ))}
              <div style={sty.field}>
                <label style={sty.lbl}>Category</label>
                <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={sty.inp}>
                  {["SaaS","Infrastructure","Professional Services","Hardware","Cloud"].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={sty.field}>
                <label style={sty.lbl}>Risk Level</label>
                <select value={form.risk_level} onChange={e=>setForm({...form,risk_level:e.target.value})} style={sty.inp}>
                  {["LOW","MEDIUM","HIGH","CRITICAL"].map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div style={sty.field}>
              <label style={sty.lbl}>Data Access Types</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {DATA_TYPES.map(d=>(
                  <button key={d} onClick={()=>toggleArr("data_access",d)} style={{padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",border:"1px solid",borderColor:form.data_access.includes(d)?"#ef4444":"rgba(139,92,246,0.15)",background:form.data_access.includes(d)?"rgba(239,68,68,0.1)":"transparent",color:form.data_access.includes(d)?"#ef4444":"#475569"}}>{d}</button>
                ))}
              </div>
            </div>
            <div style={sty.field}>
              <label style={sty.lbl}>Notes</label>
              <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={3} style={{...sty.inp,resize:"vertical"}} placeholder="Any notes about this vendor…"/>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowCreate(false)} style={{...sty.btnGhost,color:"#475569"}}>Cancel</button>
              <button onClick={save} disabled={saving} style={sty.btnPrimary}><Save size={13}/>{saving?"Saving…":"Save Vendor"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
