import { useState, useEffect, useCallback } from "react";
import { FileText, Plus, RefreshCw, X, CheckCircle, Clock, AlertCircle, Search, Edit } from "lucide-react";
const API="http://localhost:8001";
const STATUS_CFG={DRAFT:{c:"#94a3b8",bg:"rgba(148,163,184,0.1)",l:"Draft",i:<Clock size={12}/>},UNDER_REVIEW:{c:"#f59e0b",bg:"rgba(245,158,11,0.1)",l:"Under Review",i:<Clock size={12}/>},APPROVED:{c:"#10b981",bg:"rgba(16,185,129,0.1)",l:"Approved",i:<CheckCircle size={12}/>},EXPIRED:{c:"#ef4444",bg:"rgba(239,68,68,0.1)",l:"Expired",i:<AlertCircle size={12}/>}};
const CATEGORIES=["All","Security","Privacy","Operations","HR","Legal","Compliance"];
const EMPTY={name:"",category:"Security",owner:"CISO",version:"1.0",description:"",review_period_days:365,frameworks:[]};

const sty={
  hdr:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24},
  h2:{fontSize:20,fontWeight:800,color:"#e2e8f0",display:"flex",alignItems:"center",gap:10,margin:0},
  sub:{color:"#475569",fontSize:13,marginTop:4},
  btnGhost:{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:9,color:"#a78bfa",fontSize:13,fontWeight:600,cursor:"pointer"},
  btnPrimary:{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",border:"none",borderRadius:9,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"},
  btnSuccess:{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:8,color:"#10b981",fontSize:12,fontWeight:600,cursor:"pointer"},
  card:{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:12,padding:"18px 20px",marginBottom:8},
  modal:{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(4px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20},
  modalBox:{background:"#111827",border:"1px solid rgba(139,92,246,0.2)",borderRadius:16,padding:28,width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto"},
  field:{marginBottom:14},
  lbl:{display:"block",fontSize:10,fontWeight:700,color:"#94a3b8",marginBottom:5,textTransform:"uppercase",letterSpacing:".5px"},
  inp:{width:"100%",background:"#1a2235",border:"1px solid rgba(139,92,246,0.15)",borderRadius:8,padding:"9px 12px",color:"#e2e8f0",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"},
};

export default function PolicyManagement({token,tenantId}){
  const[policies,setPolicies]=useState([]);
  const[loading,setLoading]=useState(true);
  const[search,setSearch]=useState("");
  const[filterCat,setFilterCat]=useState("All");
  const[filterStatus,setFilterStatus]=useState("All");
  const[showAdd,setShowAdd]=useState(false);
  const[form,setForm]=useState(EMPTY);
  const[saving,setSaving]=useState(false);

  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const p=new URLSearchParams({tenant_id:tenantId||"demo"});
      if(filterCat!=="All")p.set("category",filterCat);
      if(filterStatus!=="All")p.set("status",filterStatus);
      if(search)p.set("search",search);
      const res=await fetch(`${API}/api/policies?${p}`,{headers:{Authorization:`Bearer ${token}`}});
      const d=await res.json(); setPolicies(d.policies||[]);
    }catch{setPolicies([]);}
    setLoading(false);
  },[token,tenantId,filterCat,filterStatus,search]);
  useEffect(()=>{load();},[load]);

  const save=async()=>{
    if(!form.name)return alert("Policy name required");
    setSaving(true);
    try{await fetch(`${API}/api/policies?tenant_id=${tenantId||"demo"}`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(form)});setShowAdd(false);setForm(EMPTY);load();}
    catch{alert("Save failed");}
    setSaving(false);
  };

  const approve=async(id)=>{
    try{await fetch(`${API}/api/policies/${id}/approve`,{method:"PATCH",headers:{Authorization:`Bearer ${token}`}});load();}
    catch{alert("Failed");}
  };

  const counts={total:policies.length,approved:policies.filter(p=>p.status==="APPROVED").length,review:policies.filter(p=>p.status==="UNDER_REVIEW").length,expired:policies.filter(p=>p.status==="EXPIRED").length};

  return(
    <div>
      <div style={sty.hdr}>
        <div>
          <h2 style={sty.h2}><FileText size={20} color="#8b5cf6"/>Policy Management</h2>
          <p style={sty.sub}>Create, version, and track approval of all compliance policies</p>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={load} style={sty.btnGhost}><RefreshCw size={13}/>Refresh</button>
          <button onClick={()=>setShowAdd(true)} style={sty.btnPrimary}><Plus size={13}/>New Policy</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[{l:"Total",v:counts.total,c:"#8b5cf6"},{l:"Approved",v:counts.approved,c:"#10b981"},{l:"Under Review",v:counts.review,c:"#f59e0b"},{l:"Expired",v:counts.expired,c:"#ef4444"}].map(st=>(
          <div key={st.l} style={{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:12,padding:"16px 18px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:st.c}}/>
            <div style={{fontSize:24,fontWeight:800,color:st.c}}>{st.v}</div>
            <div style={{fontSize:11,color:"#475569",textTransform:"uppercase",letterSpacing:".5px",marginTop:2}}>{st.l}</div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",gap:10,marginBottom:18}}>
        <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(139,92,246,0.1)",borderRadius:9,padding:"0 12px",height:36,flex:1}}>
          <Search size={13} color="#475569"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search policies…" style={{background:"none",border:"none",outline:"none",fontSize:13,color:"#e2e8f0",width:"100%",fontFamily:"inherit"}}/>
        </div>
        {[["All","Security","Privacy","Operations","HR","Legal"],["All","DRAFT","UNDER_REVIEW","APPROVED","EXPIRED"]].map((opts,oi)=>(
          <select key={oi} value={oi===0?filterCat:filterStatus} onChange={e=>oi===0?setFilterCat(e.target.value):setFilterStatus(e.target.value)} style={{background:"#111827",border:"1px solid rgba(139,92,246,0.15)",borderRadius:8,padding:"6px 12px",color:"#94a3b8",fontSize:13,outline:"none"}}>
            {opts.map(o=><option key={o}>{o}</option>)}
          </select>
        ))}
      </div>

      {loading?<div style={{textAlign:"center",padding:60,color:"#475569"}}><RefreshCw size={20} style={{animation:"spin 1s linear infinite"}}/></div>:(
        <div>
          {policies.length===0&&<div style={{...sty.card,textAlign:"center",padding:60,color:"#475569"}}><FileText size={32} style={{opacity:.3,margin:"0 auto 12px"}}/><p>No policies yet.</p></div>}
          {policies.map(p=>{
            const sc=STATUS_CFG[p.status]||STATUS_CFG.DRAFT;
            const daysLeft=p.next_review_date?Math.ceil((new Date(p.next_review_date)-new Date())/86400000):null;
            return(
              <div key={p.id} style={sty.card}>
                <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
                  <div style={{width:40,height:40,borderRadius:10,background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <FileText size={18} color="#8b5cf6"/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                      <span style={{fontSize:14,fontWeight:600,color:"#e2e8f0"}}>{p.name}</span>
                      <span style={{background:sc.bg,color:sc.c,borderRadius:100,padding:"2px 10px",fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:4}}>{sc.i}{sc.l}</span>
                      <span style={{background:"rgba(139,92,246,0.08)",color:"#8b5cf6",borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:600}}>v{p.version}</span>
                    </div>
                    <div style={{fontSize:12,color:"#475569",marginBottom:6}}>
                      {p.category} · Owner: {p.owner}
                      {daysLeft!==null&&<span style={{marginLeft:12,color:daysLeft<30?"#ef4444":daysLeft<90?"#f59e0b":"#10b981"}}>Review in {daysLeft} days</span>}
                    </div>
                    {(p.framework_refs||[]).length>0&&(
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {p.framework_refs.map(f=><span key={f} style={{background:"rgba(59,130,246,0.08)",color:"#3b82f6",borderRadius:4,padding:"1px 7px",fontSize:10,fontWeight:600}}>{f}</span>)}
                      </div>
                    )}
                  </div>
                  <div style={{display:"flex",gap:8,flexShrink:0}}>
                    {p.status!=="APPROVED"&&<button onClick={()=>approve(p.id)} style={sty.btnSuccess}><CheckCircle size={12}/>Approve</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd&&(
        <div style={sty.modal} onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div style={sty.modalBox}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,color:"#e2e8f0",fontSize:16,fontWeight:700}}>New Policy</h3>
              <button onClick={()=>setShowAdd(false)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer"}}><X size={18}/></button>
            </div>
            <div style={sty.field}><label style={sty.lbl}>Policy Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Information Security Policy" style={sty.inp}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div style={sty.field}><label style={sty.lbl}>Category</label><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={sty.inp}>{["Security","Privacy","Operations","HR","Legal","Compliance"].map(c=><option key={c}>{c}</option>)}</select></div>
              <div style={sty.field}><label style={sty.lbl}>Owner</label><input value={form.owner} onChange={e=>setForm({...form,owner:e.target.value})} placeholder="CISO" style={sty.inp}/></div>
              <div style={sty.field}><label style={sty.lbl}>Version</label><input value={form.version} onChange={e=>setForm({...form,version:e.target.value})} placeholder="1.0" style={sty.inp}/></div>
              <div style={sty.field}><label style={sty.lbl}>Review Period (days)</label><input type="number" value={form.review_period_days} onChange={e=>setForm({...form,review_period_days:+e.target.value})} style={sty.inp}/></div>
            </div>
            <div style={sty.field}><label style={sty.lbl}>Description</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} style={{...sty.inp,resize:"vertical"}} placeholder="What does this policy cover?"/></div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowAdd(false)} style={{...sty.btnGhost,color:"#475569"}}>Cancel</button>
              <button onClick={save} disabled={saving} style={sty.btnPrimary}>{saving?"Saving…":"Create Policy"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
