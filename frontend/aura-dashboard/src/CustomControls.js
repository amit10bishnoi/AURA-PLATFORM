import { useState, useEffect, useCallback } from "react";
import { Shield, Plus, RefreshCw, X, Edit, Trash2, CheckCircle, Clock, AlertCircle, Search, ChevronDown } from "lucide-react";
const API = "http://localhost:8000";

const STATUS_CFG = {
  IMPLEMENTED:  {c:"#10b981",bg:"rgba(16,185,129,0.1)",l:"Implemented"},
  IN_PROGRESS:  {c:"#f59e0b",bg:"rgba(245,158,11,0.1)", l:"In Progress"},
  NOT_STARTED:  {c:"#475569",bg:"rgba(71,85,105,0.1)",  l:"Not Started"},
  NOT_APPLICABLE:{c:"#64748b",bg:"rgba(100,116,139,0.1)",l:"N/A"},
};
const RISK_COLOR = {CRITICAL:"#ef4444",HIGH:"#f97316",MEDIUM:"#f59e0b",LOW:"#10b981"};
const FW_COLOR = {SOC2:"#3b82f6",ISO27001:"#8b5cf6",RBI:"#f97316",DPDP:"#10b981"};
const CATEGORIES = ["Access Control","Data Protection","Incident Management","Vulnerability Management","Business Continuity","Third Party Risk","Privacy","Audit & Logging","Security Testing","Cryptography","Custom"];
const FREQUENCIES = ["Continuous","Daily","Weekly","Monthly","Quarterly","Annual"];

const sty = {
  hdr:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24},
  h2:{fontSize:20,fontWeight:800,color:"#e2e8f0",display:"flex",alignItems:"center",gap:10,margin:0},
  sub:{color:"#475569",fontSize:13,marginTop:4},
  btnPrimary:{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",border:"none",borderRadius:9,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"},
  btnGhost:{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:9,color:"#a78bfa",fontSize:13,fontWeight:600,cursor:"pointer"},
  btnDanger:{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:8,color:"#ef4444",fontSize:12,cursor:"pointer"},
  card:{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:12,padding:"18px 20px",marginBottom:8},
  modal:{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(4px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20},
  modalBox:{background:"#111827",border:"1px solid rgba(139,92,246,0.2)",borderRadius:16,padding:28,width:"100%",maxWidth:560,maxHeight:"90vh",overflowY:"auto"},
  inp:{width:"100%",background:"#1a2235",border:"1px solid rgba(139,92,246,0.15)",borderRadius:8,padding:"9px 12px",color:"#e2e8f0",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"},
  lbl:{display:"block",fontSize:10,fontWeight:700,color:"#94a3b8",marginBottom:5,textTransform:"uppercase",letterSpacing:".5px"},
  field:{marginBottom:14},
};

const EMPTY_FORM = {
  name:"", description:"", category:"Custom", owner:"CISO",
  frameworks:{SOC2:"",ISO27001:"",RBI:"",DPDP:""},
  test_procedure:"", frequency:"Annual", risk_level:"MEDIUM",
};

export default function CustomControls({token, tenantId}) {
  const [controls, setControls] = useState([]);
  const [builtIn, setBuiltIn] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterFw, setFilterFw] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const h = {Authorization:`Bearer ${token}`};
  const tid = tenantId||"demo";

  const load = useCallback(async()=>{
    setLoading(true);
    try {
      const [cr, br] = await Promise.all([
        fetch(`${API}/api/unified/custom-controls?tenant_id=${tid}`,{headers:h}).then(x=>x.json()),
        fetch(`${API}/api/unified/controls?tenant_id=${tid}`,{headers:h}).then(x=>x.json()),
      ]);
      setControls(cr.controls||[]);
      setBuiltIn(br.controls||[]);
    } catch(e){console.error(e);}
    setLoading(false);
  },[token,tenantId]);

  useEffect(()=>{load();},[load]);

  const save = async()=>{
    if(!form.name) return alert("Control name required");
    setSaving(true);
    try {
      if(editing) {
        await fetch(`${API}/api/unified/custom-controls/${editing}?tenant_id=${tid}`,{
          method:"PATCH", headers:{...h,"Content-Type":"application/json"}, body:JSON.stringify(form)
        });
      } else {
        await fetch(`${API}/api/unified/custom-controls?tenant_id=${tid}`,{
          method:"POST", headers:{...h,"Content-Type":"application/json"}, body:JSON.stringify(form)
        });
      }
      setShowAdd(false); setEditing(null); setForm(EMPTY_FORM); load();
    } catch{alert("Save failed");}
    setSaving(false);
  };

  const remove = async(id)=>{
    if(!window.confirm("Delete this control?")) return;
    await fetch(`${API}/api/unified/custom-controls/${id}?tenant_id=${tid}`,{method:"DELETE",headers:h});
    load();
  };

  const updateStatus = async(id, status, isCustom)=>{
    const endpoint = isCustom
      ? `${API}/api/unified/custom-controls/${id}?tenant_id=${tid}`
      : `${API}/api/unified/controls/${id}/status?tenant_id=${tid}`;
    const method = "PATCH";
    await fetch(endpoint,{method,headers:{...h,"Content-Type":"application/json"},body:JSON.stringify({status})});
    load();
  };

  const openEdit = (c)=>{
    setForm({
      name:c.name, description:c.description, category:c.category,
      owner:c.owner, frameworks:c.frameworks||{SOC2:"",ISO27001:"",RBI:"",DPDP:""},
      test_procedure:c.test_procedure||"", frequency:c.frequency||"Annual", risk_level:c.risk_level||"MEDIUM",
    });
    setEditing(c.id); setShowAdd(true);
  };

  const allControls = [
    ...controls.map(c=>({...c,is_custom:true})),
    ...builtIn.map(c=>({...c,is_custom:false})),
  ];

  const displayed = (tab==="custom"?controls:tab==="builtin"?builtIn:allControls).filter(c=>
    (filterCat==="All"||c.category===filterCat) &&
    (filterFw==="All"||Object.keys(c.frameworks||{}).includes(filterFw)) &&
    (search===""||c.name.toLowerCase().includes(search.toLowerCase())||c.id.toLowerCase().includes(search.toLowerCase()))
  );

  const stats = {
    total: allControls.length,
    implemented: allControls.filter(c=>c.status==="IMPLEMENTED").length,
    custom: controls.length,
    inProgress: allControls.filter(c=>c.status==="IN_PROGRESS").length,
  };

  return(
    <div>
      <div style={sty.hdr}>
        <div>
          <h2 style={sty.h2}><Shield size={20} color="#8b5cf6"/>Controls Library</h2>
          <p style={sty.sub}>Built-in framework controls + custom controls for your unique requirements</p>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={load} style={sty.btnGhost}><RefreshCw size={13}/>Refresh</button>
          <button onClick={()=>{setForm(EMPTY_FORM);setEditing(null);setShowAdd(true);}} style={sty.btnPrimary}><Plus size={13}/>Add Custom Control</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[
          {l:"Total Controls",v:stats.total,c:"#8b5cf6"},
          {l:"Implemented",v:stats.implemented,c:"#10b981"},
          {l:"In Progress",v:stats.inProgress,c:"#f59e0b"},
          {l:"Custom Controls",v:stats.custom,c:"#3b82f6"},
        ].map(st=>(
          <div key={st.l} style={{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:12,padding:"16px 18px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:st.c}}/>
            <div style={{fontSize:24,fontWeight:800,color:st.c}}>{st.v}</div>
            <div style={{fontSize:11,color:"#475569",textTransform:"uppercase",letterSpacing:".5px",marginTop:2}}>{st.l}</div>
          </div>
        ))}
      </div>

      {/* Tabs + Filters */}
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        {[["all","All Controls"],["custom","⭐ Custom"],["builtin","📋 Built-in"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setTab(id)} style={{padding:"7px 16px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",border:"1px solid",borderColor:tab===id?"rgba(139,92,246,0.35)":"rgba(139,92,246,0.1)",background:tab===id?"rgba(139,92,246,0.12)":"transparent",color:tab===id?"#a78bfa":"#475569"}}>{lbl}</button>
        ))}
        <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(139,92,246,0.1)",borderRadius:9,padding:"0 12px",height:34,flex:1,minWidth:180}}>
          <Search size={13} color="#475569"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search controls…" style={{background:"none",border:"none",outline:"none",fontSize:13,color:"#e2e8f0",width:"100%",fontFamily:"inherit"}}/>
        </div>
        <select value={filterFw} onChange={e=>setFilterFw(e.target.value)} style={{background:"#111827",border:"1px solid rgba(139,92,246,0.15)",borderRadius:8,padding:"6px 12px",color:"#94a3b8",fontSize:12,outline:"none"}}>
          {["All","SOC2","ISO27001","RBI","DPDP"].map(f=><option key={f}>{f}</option>)}
        </select>
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{background:"#111827",border:"1px solid rgba(139,92,246,0.15)",borderRadius:8,padding:"6px 12px",color:"#94a3b8",fontSize:12,outline:"none"}}>
          {["All",...CATEGORIES].map(c=><option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Controls list */}
      {loading?<div style={{textAlign:"center",padding:60,color:"#475569"}}><RefreshCw size={20} style={{animation:"spin 1s linear infinite"}}/></div>:(
        <div>
          {displayed.length===0&&<div style={{...sty.card,textAlign:"center",padding:60,color:"#475569"}}><Shield size={32} style={{opacity:.3,margin:"0 auto 12px"}}/><p>No controls found.</p></div>}
          {displayed.map(c=>{
            const sc = STATUS_CFG[c.status]||STATUS_CFG.NOT_STARTED;
            const rc = RISK_COLOR[c.risk_level]||"#8b5cf6";
            const fwKeys = Object.entries(c.frameworks||{}).filter(([,v])=>v);
            return(
              <div key={c.id} style={{...sty.card,borderColor:c.is_custom?"rgba(59,130,246,0.15)":"rgba(139,92,246,0.08)"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
                  <div style={{width:40,height:40,borderRadius:10,background:c.is_custom?"rgba(59,130,246,0.1)":"rgba(139,92,246,0.1)",border:`1px solid ${c.is_custom?"rgba(59,130,246,0.2)":"rgba(139,92,246,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Shield size={18} color={c.is_custom?"#3b82f6":"#8b5cf6"}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                      <span style={{fontFamily:"monospace",fontSize:10,color:"#475569",background:"rgba(139,92,246,0.06)",borderRadius:4,padding:"1px 6px"}}>{c.id}</span>
                      <span style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>{c.name}</span>
                      {c.is_custom&&<span style={{background:"rgba(59,130,246,0.1)",color:"#3b82f6",borderRadius:100,padding:"1px 8px",fontSize:10,fontWeight:700}}>CUSTOM</span>}
                      <span style={{background:sc.bg,color:sc.c,borderRadius:100,padding:"2px 10px",fontSize:10,fontWeight:700}}>{sc.l}</span>
                      {c.risk_level&&<span style={{background:`${rc}15`,color:rc,borderRadius:100,padding:"2px 8px",fontSize:10,fontWeight:700}}>{c.risk_level}</span>}
                    </div>
                    <div style={{fontSize:12,color:"#64748b",marginBottom:8,lineHeight:1.5}}>{c.description}</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                      {fwKeys.map(([fw,ref])=>(
                        <span key={fw} style={{background:`${FW_COLOR[fw]||"#8b5cf6"}15`,color:FW_COLOR[fw]||"#8b5cf6",borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:600}}>
                          {fw}: {ref}
                        </span>
                      ))}
                      <span style={{fontSize:11,color:"#475569"}}>Owner: {c.owner}</span>
                      {c.category&&<span style={{fontSize:11,color:"#475569"}}>· {c.category}</span>}
                      {c.automated&&<span style={{fontSize:10,color:"#10b981",fontWeight:600}}>⚡ Automated</span>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,flexShrink:0,alignItems:"center"}}>
                    {/* Status changer */}
                    <select
                      value={c.status}
                      onChange={e=>updateStatus(c.id,e.target.value,c.is_custom)}
                      style={{background:"#1a2235",border:`1px solid ${sc.c}40`,borderRadius:8,padding:"5px 10px",color:sc.c,fontSize:11,fontWeight:700,cursor:"pointer",outline:"none"}}
                    >
                      {Object.entries(STATUS_CFG).map(([k,v])=><option key={k} value={k}>{v.l}</option>)}
                    </select>
                    {c.is_custom&&(
                      <>
                        <button onClick={()=>openEdit(c)} style={{...sty.btnGhost,padding:"6px 10px"}}><Edit size={12}/></button>
                        <button onClick={()=>remove(c.id)} style={sty.btnDanger}><Trash2 size={12}/></button>
                      </>
                    )}
                  </div>
                </div>
                {c.test_procedure&&(
                  <div style={{marginTop:10,fontSize:11,color:"#475569",background:"rgba(139,92,246,0.04)",borderRadius:8,padding:"8px 12px",borderLeft:"3px solid rgba(139,92,246,0.3)"}}>
                    📋 <strong style={{color:"#8b5cf6"}}>Test Procedure:</strong> {c.test_procedure}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAdd&&(
        <div style={sty.modal} onClick={e=>e.target===e.currentTarget&&(setShowAdd(false),setEditing(null))}>
          <div style={sty.modalBox}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,color:"#e2e8f0",fontSize:16,fontWeight:700}}>{editing?"Edit Control":"Add Custom Control"}</h3>
              <button onClick={()=>{setShowAdd(false);setEditing(null);}} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:18}}>✕</button>
            </div>

            <div style={sty.field}>
              <label style={sty.lbl}>Control Name *</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. AI Model Security Review" style={sty.inp}/>
            </div>
            <div style={sty.field}>
              <label style={sty.lbl}>Description</label>
              <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3} placeholder="What does this control cover?" style={{...sty.inp,resize:"vertical"}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}>
              <div><label style={sty.lbl}>Category</label>
                <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={sty.inp}>
                  {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label style={sty.lbl}>Owner</label>
                <input value={form.owner} onChange={e=>setForm(f=>({...f,owner:e.target.value}))} placeholder="CISO" style={sty.inp}/>
              </div>
              <div><label style={sty.lbl}>Risk Level</label>
                <select value={form.risk_level} onChange={e=>setForm(f=>({...f,risk_level:e.target.value}))} style={sty.inp}>
                  {["CRITICAL","HIGH","MEDIUM","LOW"].map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {/* Framework mapping */}
            <div style={sty.field}>
              <label style={sty.lbl}>Framework Control References (optional)</label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {["SOC2","ISO27001","RBI","DPDP"].map(fw=>(
                  <div key={fw} style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:11,fontWeight:700,color:FW_COLOR[fw],minWidth:60}}>{fw}</span>
                    <input value={form.frameworks[fw]||""} onChange={e=>setForm(f=>({...f,frameworks:{...f.frameworks,[fw]:e.target.value}}))} placeholder={fw==="SOC2"?"CC6.1":fw==="ISO27001"?"A.8.5":fw==="RBI"?"CSF-3.1":"Section 6"} style={{...sty.inp,fontSize:12,padding:"6px 10px"}}/>
                  </div>
                ))}
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              <div><label style={sty.lbl}>Test Frequency</label>
                <select value={form.frequency} onChange={e=>setForm(f=>({...f,frequency:e.target.value}))} style={sty.inp}>
                  {FREQUENCIES.map(fr=><option key={fr}>{fr}</option>)}
                </select>
              </div>
            </div>

            <div style={sty.field}>
              <label style={sty.lbl}>Test Procedure</label>
              <textarea value={form.test_procedure} onChange={e=>setForm(f=>({...f,test_procedure:e.target.value}))} rows={3} placeholder="How is this control tested? e.g. Review quarterly access reports and confirm all terminated users removed within 24 hours." style={{...sty.inp,resize:"vertical"}}/>
            </div>

            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>{setShowAdd(false);setEditing(null);}} style={{...sty.btnGhost,color:"#475569"}}>Cancel</button>
              <button onClick={save} disabled={saving} style={sty.btnPrimary}>{saving?"Saving…":editing?"Update Control":"Create Control"}</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
