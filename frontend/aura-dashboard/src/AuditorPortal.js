import { useState, useEffect, useCallback } from "react";
import { Shield, Plus, RefreshCw, CheckCircle, Clock, AlertTriangle, XCircle, MessageSquare, ChevronLeft, X, Send, Building2, FileText, Upload, Bell, Lock } from "lucide-react";
const API = "https://web-production-320c3.up.railway.app";

const STATUS_CFG = {
  APPROVED:      {c:"#10b981", bg:"rgba(16,185,129,0.1)",  l:"Approved",       icon:CheckCircle},
  IN_REVIEW:     {c:"#3b82f6", bg:"rgba(59,130,246,0.1)",  l:"In Review",      icon:Clock},
  NEEDS_EVIDENCE:{c:"#ef4444", bg:"rgba(239,68,68,0.1)",   l:"Needs Evidence", icon:AlertTriangle},
  NOT_STARTED:   {c:"#475569", bg:"rgba(71,85,105,0.1)",   l:"Not Started",    icon:XCircle},
};
const FW_COLOR = {SOC2:"#3b82f6",ISO27001:"#8b5cf6",RBI:"#f97316",DPDP:"#10b981"};

const sty = {
  hdr:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24},
  h2:{fontSize:20,fontWeight:800,color:"#e2e8f0",display:"flex",alignItems:"center",gap:10,margin:0},
  sub:{color:"#475569",fontSize:13,marginTop:4},
  btnPrimary:{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",border:"none",borderRadius:9,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"},
  btnGhost:{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:9,color:"#a78bfa",fontSize:13,fontWeight:600,cursor:"pointer"},
  btnSuccess:{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:8,color:"#10b981",fontSize:12,fontWeight:600,cursor:"pointer"},
  btnDanger:{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:8,color:"#ef4444",fontSize:12,cursor:"pointer"},
  card:{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:14,padding:"20px 22px",marginBottom:12},
  modal:{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(4px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20},
  modalBox:{background:"#111827",border:"1px solid rgba(139,92,246,0.2)",borderRadius:16,padding:28,width:"100%",maxWidth:500,maxHeight:"90vh",overflowY:"auto"},
  inp:{width:"100%",background:"#1a2235",border:"1px solid rgba(139,92,246,0.15)",borderRadius:8,padding:"9px 12px",color:"#e2e8f0",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"},
  lbl:{display:"block",fontSize:10,fontWeight:700,color:"#94a3b8",marginBottom:5,textTransform:"uppercase",letterSpacing:".5px"},
};

function fmt(iso){return iso?new Date(iso).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—";}

export default function AuditorPortal({token,tenantId}){
  const [rooms,setRooms]=useState([]);
  const [loading,setLoading]=useState(true);
  const [selected,setSelected]=useState(null);
  const [items,setItems]=useState([]);
  const [comments,setComments]=useState([]);
  const [stats,setStats]=useState({});
  const [showCreate,setShowCreate]=useState(false);
  const [selectedItem,setSelectedItem]=useState(null);
  const [newComment,setNewComment]=useState("");
  const [filterStatus,setFilterStatus]=useState("All");
  const [showEvRequest,setShowEvRequest]=useState(false);
  const [evForm,setEvForm]=useState({control_id:"",description:"",deadline:""});
  const [form,setForm]=useState({name:"",framework:"SOC2",auditor_firm:"",auditor_name:"",auditor_email:"",period_start:"",period_end:"",due_date:""});
  const [saving,setSaving]=useState(false);
  const [tab,setTab]=useState("controls");

  const h={Authorization:`Bearer ${token}`};
  const tid=tenantId||"demo";

  const load=useCallback(async()=>{
    setLoading(true);
    try{const r=await fetch(`${API}/api/auditor/rooms?tenant_id=${tid}`,{headers:h}).then(x=>x.json());setRooms(r.rooms||[]);}
    catch{setRooms([]);}
    setLoading(false);
  },[token,tenantId]);

  useEffect(()=>{load();},[load]);

  const loadRoom=async(room)=>{
    setSelected(room);setSelectedItem(null);setTab("controls");
    try{
      const[iR,sR]=await Promise.all([
        fetch(`${API}/api/auditor/rooms/${room.id}/items`,{headers:h}).then(x=>x.json()),
        fetch(`${API}/api/auditor/rooms/${room.id}/stats`,{headers:h}).then(x=>x.json()),
      ]);
      setItems(iR.items||[]);setStats(sR);
    }catch{setItems([]);}
  };

  const loadComments=async(item)=>{
    setSelectedItem(item);
    try{const r=await fetch(`${API}/api/auditor/rooms/${selected.id}/comments?control_id=${item.control_id}`,{headers:h}).then(x=>x.json());setComments(r.comments||[]);}
    catch{setComments([]);}
  };

  const addComment=async()=>{
    if(!newComment.trim())return;
    try{
      const r=await fetch(`${API}/api/auditor/rooms/${selected.id}/comments`,{method:"POST",headers:{...h,"Content-Type":"application/json"},body:JSON.stringify({control_id:selectedItem?.control_id,author:"You",author_type:"internal",message:newComment})}).then(x=>x.json());
      setComments(c=>[...c,r.comment]);setNewComment("");
    }catch{alert("Failed");}
  };

  const createRoom=async()=>{
    if(!form.name||!form.auditor_email)return alert("Name and auditor email required");
    setSaving(true);
    try{
      const r=await fetch(`${API}/api/auditor/rooms?tenant_id=${tid}`,{method:"POST",headers:{...h,"Content-Type":"application/json"},body:JSON.stringify(form)}).then(x=>x.json());
      setShowCreate(false);setForm({name:"",framework:"SOC2",auditor_firm:"",auditor_name:"",auditor_email:"",period_start:"",period_end:"",due_date:""});
      alert(`Audit room created!\n\nShare this link with your auditor:\n${r.portal_link}`);
      load();
    }catch{alert("Failed");}
    setSaving(false);
  };

  const requestEvidence=async()=>{
    try{
      await fetch(`${API}/api/auditor/rooms/${selected.id}/evidence-requests`,{method:"POST",headers:{...h,"Content-Type":"application/json"},body:JSON.stringify(evForm)});
      setShowEvRequest(false);setEvForm({control_id:"",description:"",deadline:""});
      alert("Evidence request sent to team!");
    }catch{alert("Failed");}
  };

  const updateItemStatus=async(item,status)=>{
    try{
      await fetch(`${API}/api/auditor/rooms/${selected.id}/items/${item.id}`,{method:"PATCH",headers:{...h,"Content-Type":"application/json"},body:JSON.stringify({status})});
      setItems(prev=>prev.map(i=>i.id===item.id?{...i,status}:i));
      if(selectedItem?.id===item.id)setSelectedItem(si=>({...si,status}));
    }catch{alert("Failed");}
  };

  const filtered=filterStatus==="All"?items:items.filter(i=>i.status===filterStatus);
  const totalRev=rooms.reduce((a,r)=>a+(r.controls_reviewed||0),0);
  const totalCtrl=rooms.reduce((a,r)=>a+(r.controls_total||0),0);

  // ── Room detail view ─────────────────────────────────────────────────────────
  if(selected){
    const fwc=FW_COLOR[selected.framework]||"#8b5cf6";
    return(
      <div>
        <button onClick={()=>{setSelected(null);setSelectedItem(null);}} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#475569",fontSize:13,cursor:"pointer",marginBottom:20,padding:0}}><ChevronLeft size={14}/>Back to Audit Rooms</button>

        {/* Room header */}
        <div style={{...sty.card,marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{background:`${fwc}20`,color:fwc,borderRadius:100,padding:"3px 12px",fontSize:11,fontWeight:700}}>{selected.framework}</span>
                <span style={{background:"rgba(16,185,129,0.1)",color:"#10b981",borderRadius:100,padding:"3px 12px",fontSize:11,fontWeight:700}}>{selected.status}</span>
              </div>
              <div style={{fontSize:22,fontWeight:800,color:"#e2e8f0",marginBottom:4}}>{selected.name}</div>
              <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#475569"}}>
                <Building2 size={12}/>{selected.auditor_firm} · {selected.auditor_name}
                <span style={{background:"rgba(59,130,246,0.1)",color:"#3b82f6",borderRadius:4,padding:"1px 8px",fontSize:11,fontWeight:600,marginLeft:4}}>{selected.auditor_email}</span>
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setShowEvRequest(true)} style={sty.btnGhost}><Upload size={13}/>Request Evidence</button>
              <button onClick={()=>{const link=`https://app.aura.io/auditor/${selected.id}?token=demo`;alert(`Auditor Portal Link:\n${link}`);}} style={sty.btnPrimary}><Lock size={13}/>Share Auditor Link</button>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{marginTop:16}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#475569",marginBottom:6}}>
              <span>Audit Progress</span><span style={{color:"#e2e8f0",fontWeight:600}}>{selected.progress||0}%</span>
            </div>
            <div style={{background:"rgba(255,255,255,0.06)",borderRadius:4,height:8,overflow:"hidden"}}>
              <div style={{width:`${selected.progress||0}%`,height:"100%",background:`linear-gradient(90deg,${fwc},#8b5cf6)`,borderRadius:4,transition:"width 1s"}}/>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
          {[{l:"Approved",v:stats.approved||0,c:"#10b981"},{l:"In Review",v:stats.in_review||0,c:"#3b82f6"},{l:"Needs Evidence",v:stats.needs_evidence||0,c:"#ef4444"},{l:"Not Started",v:stats.not_started||0,c:"#475569"}].map(st=>(
            <div key={st.l} style={{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:800,color:st.c}}>{st.v}</div>
              <div style={{fontSize:11,color:"#475569",marginTop:2}}>{st.l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          {[["controls","📋 Controls"],["comments","💬 Messages"],["evidence","📁 Evidence"]].map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)} style={{padding:"7px 16px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",border:"1px solid",borderColor:tab===id?"rgba(139,92,246,0.35)":"rgba(139,92,246,0.1)",background:tab===id?"rgba(139,92,246,0.12)":"transparent",color:tab===id?"#a78bfa":"#475569"}}>{lbl}</button>
          ))}
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{marginLeft:"auto",background:"#111827",border:"1px solid rgba(139,92,246,0.15)",borderRadius:8,padding:"6px 12px",color:"#94a3b8",fontSize:12,outline:"none"}}>
            {["All","APPROVED","IN_REVIEW","NEEDS_EVIDENCE","NOT_STARTED"].map(o=><option key={o}>{o}</option>)}
          </select>
        </div>

        {tab==="controls"&&(
          <div style={{display:"grid",gridTemplateColumns:selectedItem?"1fr 380px":"1fr",gap:14}}>
            {/* Control list */}
            <div>
              {filtered.map(item=>{
                const sc=STATUS_CFG[item.status]||STATUS_CFG.NOT_STARTED;
                const Icon=sc.icon;
                const priC=item.priority==="CRITICAL"?"#ef4444":item.priority==="HIGH"?"#f97316":item.priority==="MEDIUM"?"#f59e0b":"#10b981";
                const isSelected=selectedItem?.id===item.id;
                return(
                  <div key={item.id} onClick={()=>loadComments(item)} style={{background:isSelected?"#1a2235":"#111827",border:`1px solid ${isSelected?sc.c+"40":"rgba(139,92,246,0.08)"}`,borderRadius:12,padding:"14px 18px",marginBottom:8,cursor:"pointer",transition:"all .15s"}}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                          <span style={{background:sc.bg,color:sc.c,borderRadius:100,padding:"2px 10px",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",gap:4}}><Icon size={10}/>{sc.l}</span>
                          <span style={{background:`${priC}15`,color:priC,borderRadius:100,padding:"2px 8px",fontSize:10,fontWeight:700}}>{item.priority}</span>
                          <span style={{fontSize:10,color:"#475569",fontFamily:"monospace"}}>{item.control_id}</span>
                        </div>
                        <div style={{fontSize:13,fontWeight:600,color:"#e2e8f0",marginBottom:4}}>{item.control_name}</div>
                        {item.auditor_comment&&<div style={{fontSize:11,color:"#64748b",fontStyle:"italic",lineHeight:1.4}}>"{item.auditor_comment}"</div>}
                        {item.internal_note&&<div style={{fontSize:11,color:"#f59e0b",marginTop:4}}>📝 {item.internal_note}</div>}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,marginLeft:12}}>
                        <span style={{fontSize:11,color:"#475569"}}>{item.evidence_count} files</span>
                        <MessageSquare size={13} color={comments.length>0&&selectedItem?.id===item.id?"#a78bfa":"#334155"}/>
                      </div>
                    </div>
                    {/* Quick status actions */}
                    <div style={{display:"flex",gap:6,marginTop:10}} onClick={e=>e.stopPropagation()}>
                      {item.status!=="APPROVED"&&<button onClick={()=>updateItemStatus(item,"APPROVED")} style={{...sty.btnSuccess,fontSize:11,padding:"4px 10px"}}>✓ Approve</button>}
                      {item.status!=="NEEDS_EVIDENCE"&&<button onClick={()=>updateItemStatus(item,"NEEDS_EVIDENCE")} style={{...sty.btnDanger,fontSize:11,padding:"4px 10px"}}>Request Evidence</button>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Comment panel */}
            {selectedItem&&(
              <div style={{background:"#111827",border:"1px solid rgba(139,92,246,0.1)",borderRadius:14,padding:18,display:"flex",flexDirection:"column",maxHeight:"70vh",position:"sticky",top:0}}>
                <div style={{fontWeight:700,color:"#e2e8f0",fontSize:14,marginBottom:4}}>{selectedItem.control_id} — {selectedItem.control_name}</div>
                <div style={{fontSize:11,color:"#475569",marginBottom:14}}>Click messages to respond · All activity logged</div>
                <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
                  {comments.length===0&&<div style={{textAlign:"center",padding:24,color:"#475569",fontSize:12}}>No messages yet</div>}
                  {comments.map((c,i)=>{
                    const isAuditor=c.author_type==="auditor";
                    return(
                      <div key={i} style={{background:isAuditor?"rgba(59,130,246,0.08)":"rgba(139,92,246,0.08)",border:`1px solid ${isAuditor?"rgba(59,130,246,0.15)":"rgba(139,92,246,0.15)"}`,borderRadius:10,padding:"10px 14px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{fontSize:11,fontWeight:700,color:isAuditor?"#3b82f6":"#a78bfa"}}>{isAuditor?"🔍 "+c.author:"👤 "+c.author}</span>
                          <span style={{fontSize:10,color:"#475569"}}>{fmt(c.created_at)}</span>
                        </div>
                        <div style={{fontSize:12,color:"#e2e8f0",lineHeight:1.5}}>{c.message}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <input value={newComment} onChange={e=>setNewComment(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addComment()} placeholder="Reply to auditor…" style={{...sty.inp,flex:1}}/>
                  <button onClick={addComment} style={{...sty.btnPrimary,padding:"8px 14px"}}><Send size={13}/></button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab==="comments"&&(
          <div style={sty.card}>
            <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0",marginBottom:14}}>All Auditor Messages</div>
            <div style={{color:"#475569",fontSize:13,textAlign:"center",padding:24}}>Select a control from the Controls tab to view and reply to messages.</div>
          </div>
        )}

        {tab==="evidence"&&(
          <div style={sty.card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>Evidence Tracker</div>
              <button onClick={()=>setShowEvRequest(true)} style={sty.btnPrimary}><Upload size={13}/>Request Evidence</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
              {[{l:"Evidence Requested",v:selected.evidence_requested||0,c:"#f97316"},{l:"Evidence Provided",v:selected.evidence_provided||0,c:"#10b981"},{l:"Pending",v:(selected.evidence_requested||0)-(selected.evidence_provided||0),c:"#ef4444"}].map(st=>(
                <div key={st.l} style={{background:"#1a2235",borderRadius:10,padding:"16px",textAlign:"center"}}>
                  <div style={{fontSize:24,fontWeight:800,color:st.c}}>{st.v}</div>
                  <div style={{fontSize:11,color:"#475569",marginTop:4}}>{st.l}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence request modal */}
        {showEvRequest&&(
          <div style={sty.modal} onClick={e=>e.target===e.currentTarget&&setShowEvRequest(false)}>
            <div style={sty.modalBox}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <h3 style={{margin:0,color:"#e2e8f0",fontSize:16,fontWeight:700}}>Request Evidence from Team</h3>
                <button onClick={()=>setShowEvRequest(false)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer"}}><X size={18}/></button>
              </div>
              {[["Control ID","text","control_id","e.g. CC7.1"],["Evidence Required","text","description","Describe what evidence is needed"],["Deadline","date","deadline",""]].map(([l,t,k,ph])=>(
                <div key={k} style={{marginBottom:14}}>
                  <label style={sty.lbl}>{l}</label>
                  <input type={t} value={evForm[k]} onChange={e=>setEvForm(f=>({...f,[k]:e.target.value}))} placeholder={ph} style={sty.inp}/>
                </div>
              ))}
              <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:4}}>
                <button onClick={()=>setShowEvRequest(false)} style={{...sty.btnGhost,color:"#475569"}}>Cancel</button>
                <button onClick={requestEvidence} style={sty.btnPrimary}><Send size={13}/>Send Request</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Rooms list ───────────────────────────────────────────────────────────────
  return(
    <div>
      <div style={sty.hdr}>
        <div>
          <h2 style={sty.h2}><Shield size={20} color="#8b5cf6"/>Auditor Collaboration Portal</h2>
          <p style={sty.sub}>Manage external audit engagements · Share evidence rooms · Collaborate with auditors</p>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={load} style={sty.btnGhost}><RefreshCw size={13}/>Refresh</button>
          <button onClick={()=>setShowCreate(true)} style={sty.btnPrimary}><Plus size={13}/>New Audit Room</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[{l:"Active Audits",v:rooms.filter(r=>r.status==="IN_PROGRESS").length,c:"#3b82f6"},{l:"Controls Reviewed",v:totalRev,c:"#10b981"},{l:"Total Controls",v:totalCtrl,c:"#8b5cf6"},{l:"Pending Rooms",v:rooms.filter(r=>r.status==="PENDING").length,c:"#f59e0b"}].map(st=>(
          <div key={st.l} style={{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:12,padding:"16px 18px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:st.c}}/>
            <div style={{fontSize:24,fontWeight:800,color:st.c}}>{st.v}</div>
            <div style={{fontSize:11,color:"#475569",textTransform:"uppercase",letterSpacing:".5px",marginTop:2}}>{st.l}</div>
          </div>
        ))}
      </div>

      {/* Audit rooms */}
      {loading?<div style={{textAlign:"center",padding:60,color:"#475569"}}><RefreshCw size={20} style={{animation:"spin 1s linear infinite"}}/></div>:(
        <div>
          {rooms.length===0&&<div style={{...sty.card,textAlign:"center",padding:60,color:"#475569"}}><Shield size={32} style={{opacity:.3,margin:"0 auto 12px"}}/><p>No audit rooms yet. Create one above.</p></div>}
          {rooms.map(room=>{
            const fwc=FW_COLOR[room.framework]||"#8b5cf6";
            const progress=room.progress||0;
            return(
              <div key={room.id} style={{...sty.card,cursor:"pointer"}} onClick={()=>loadRoom(room)}>
                <div style={{display:"flex",alignItems:"flex-start",gap:16}}>
                  <div style={{width:48,height:48,borderRadius:12,background:`${fwc}15`,border:`1px solid ${fwc}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Shield size={22} color={fwc}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                      <span style={{fontSize:15,fontWeight:700,color:"#e2e8f0"}}>{room.name}</span>
                      <span style={{background:`${fwc}20`,color:fwc,borderRadius:100,padding:"2px 10px",fontSize:10,fontWeight:700}}>{room.framework}</span>
                      <span style={{background:room.status==="IN_PROGRESS"?"rgba(59,130,246,0.1)":"rgba(245,158,11,0.1)",color:room.status==="IN_PROGRESS"?"#3b82f6":"#f59e0b",borderRadius:100,padding:"2px 10px",fontSize:10,fontWeight:700}}>{room.status}</span>
                    </div>
                    <div style={{fontSize:12,color:"#475569",marginBottom:10}}><Building2 size={11} style={{display:"inline",marginRight:4}}/>{room.auditor_firm} · {room.auditor_name} · Due: {fmt(room.due_date)}</div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{flex:1,background:"rgba(255,255,255,0.06)",borderRadius:4,height:5,overflow:"hidden"}}>
                        <div style={{width:`${progress}%`,height:"100%",background:`linear-gradient(90deg,${fwc},#8b5cf6)`,borderRadius:4}}/>
                      </div>
                      <span style={{fontSize:11,color:"#e2e8f0",fontWeight:700,minWidth:32}}>{progress}%</span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:16,flexShrink:0,textAlign:"center"}}>
                    {[{l:"Reviewed",v:room.controls_reviewed,c:"#10b981"},{l:"Evidence",v:room.evidence_provided+"/"+room.evidence_requested,c:"#3b82f6"},{l:"Comments",v:room.comments,c:"#8b5cf6"}].map(st=>(
                      <div key={st.l}><div style={{fontSize:15,fontWeight:700,color:st.c}}>{st.v}</div><div style={{fontSize:10,color:"#475569"}}>{st.l}</div></div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showCreate&&(
        <div style={sty.modal} onClick={e=>e.target===e.currentTarget&&setShowCreate(false)}>
          <div style={sty.modalBox}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,color:"#e2e8f0",fontSize:16,fontWeight:700}}>Create Audit Room</h3>
              <button onClick={()=>setShowCreate(false)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer"}}><X size={18}/></button>
            </div>
            <div style={{background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.15)",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#3b82f6",marginBottom:16}}>
              A secure portal link will be generated for your auditor to access evidence rooms.
            </div>
            {[["Audit Name","text","name","SOC 2 Type II Audit 2025"],["Auditor Firm","text","auditor_firm","Deloitte, KPMG, etc."],["Auditor Name","text","auditor_name","Contact person"],["Auditor Email","email","auditor_email","auditor@firm.com"]].map(([l,t,k,ph])=>(
              <div key={k} style={{marginBottom:14}}>
                <label style={sty.lbl}>{l}</label>
                <input type={t} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={ph} style={sty.inp}/>
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              <div><label style={sty.lbl}>Framework</label>
                <select value={form.framework} onChange={e=>setForm(f=>({...f,framework:e.target.value}))} style={sty.inp}>
                  {["SOC2","ISO27001","RBI","DPDP"].map(fw=><option key={fw}>{fw}</option>)}
                </select>
              </div>
              <div><label style={sty.lbl}>Due Date</label>
                <input type="date" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))} style={sty.inp}/>
              </div>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowCreate(false)} style={{...sty.btnGhost,color:"#475569"}}>Cancel</button>
              <button onClick={createRoom} disabled={saving} style={sty.btnPrimary}>{saving?"Creating…":"Create & Get Auditor Link"}</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
