import { useState, useEffect, useCallback } from "react";
import { Shield, CheckCircle, AlertTriangle, RefreshCw, Download, ChevronRight } from "lucide-react";
const API = "http://localhost:8000";

const THEME_COLORS = { Organizational:"#7c3aed", People:"#0891b2", Physical:"#d97706", Technological:"#16a34a" };
const STATUS_CFG = {
  IMPLEMENTED: { color:"#16a34a", bg:"rgba(22,163,74,.08)", label:"Implemented", icon:"✓" },
  IN_PROGRESS:  { color:"#d97706", bg:"rgba(217,119,6,.08)", label:"In Progress",  icon:"◔" },
  NOT_STARTED:  { color:"#e11d48", bg:"rgba(225,29,72,.08)", label:"Not Started",  icon:"○" },
};

function ScoreRing({score,size=110}){
  const r=42,circ=2*Math.PI*r,offset=circ-(score/100)*circ;
  const color=score>=85?"#16a34a":score>=60?"#d97706":"#e11d48";
  return(<svg width={size} height={size} viewBox="0 0 100 100"><circle cx="50" cy="50" r={r} fill="none" stroke="rgba(124,58,237,.1)" strokeWidth="7"/><circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="7" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 50 50)" style={{transition:"stroke-dashoffset 1.2s"}}/><text x="50" y="47" textAnchor="middle" fontSize="18" fontWeight="800" fontFamily="'Syne',sans-serif" fill={color}>{score}%</text><text x="50" y="60" textAnchor="middle" fontSize="8" fill="#a89dc8">READY</text></svg>);
}

export default function ISO27001Hub({token,tenantId}){
  const [controls,setControls]=useState([]);
  const [summary,setSummary]=useState(null);
  const [readiness,setReadiness]=useState(null);
  const [timeline,setTimeline]=useState(null);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("overview");
  const [themeFilter,setThemeFilter]=useState("");
  const [statusFilter,setStatusFilter]=useState("");
  const [expanded,setExpanded]=useState({});

  const fetch_=useCallback(async()=>{
    setLoading(true);
    try{
      const [cRes,rRes,tRes]=await Promise.all([
        fetch(`${API}/api/iso27001/controls?tenant_id=${tenantId||"tenant_533ed68d0977"}`,{headers:{Authorization:`Bearer ${token}`}}),
        fetch(`${API}/api/iso27001/readiness?tenant_id=${tenantId||"tenant_533ed68d0977"}`,{headers:{Authorization:`Bearer ${token}`}}),
        fetch(`${API}/api/iso27001/timeline?tenant_id=${tenantId||"tenant_533ed68d0977"}`,{headers:{Authorization:`Bearer ${token}`}}),
      ]);
      const cData=await cRes.json();
      const rData=await rRes.json();
      const tData=await tRes.json();
      setControls(cData.controls||[]);
      setSummary(cData.summary||{});
      setReadiness(rData);
      setTimeline(tData);
    }catch(e){console.error(e);}
    setLoading(false);
  },[token,tenantId]);

  useEffect(()=>{fetch_();},[fetch_]);

  const filtered=controls.filter(c=>(!themeFilter||c.theme===themeFilter)&&(!statusFilter||c.status===statusFilter||c.status===statusFilter.toLowerCase()));
  const themes=[...new Set(controls.map(c=>c.theme))];

  const tabBtn=(id,label)=>(<button onClick={()=>setTab(id)} style={{padding:"8px 18px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",border:"1px solid",borderColor:tab===id?"rgba(124,58,237,.3)":"rgba(124,58,237,.1)",background:tab===id?"rgba(124,58,237,.1)":"#fff",color:tab===id?"#7c3aed":"#6b5b9e"}}>{label}</button>);

  return(<div style={{padding:"28px 32px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
      <div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <div style={{background:"linear-gradient(135deg,#7c3aed,#db2777)",borderRadius:8,padding:"4px 12px",fontSize:11,fontWeight:700,color:"#fff"}}>ISO 27001:2022</div>
          {readiness&&<div style={{background:`${readiness.color||"#d97706"}14`,color:readiness.color||"#d97706",border:`1px solid ${readiness.color||"#d97706"}30`,borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:700}}>{readiness.label||"On Track"}</div>}
        </div>
        <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,color:"#1a0a3a",marginBottom:4}}>ISO 27001 Certification Hub</h2>
        <p style={{color:"#a89dc8",fontSize:13}}>93 controls across 4 themes · {readiness?.estimated_weeks_to_ready||8} weeks to audit-ready</p>
      </div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={fetch_} style={{padding:"9px 16px",background:"#fff",border:"1px solid rgba(124,58,237,.15)",borderRadius:9,color:"#7c3aed",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><RefreshCw size={14}/>Refresh</button>
        <button style={{padding:"9px 18px",background:"linear-gradient(135deg,#7c3aed,#db2777)",border:"none",borderRadius:9,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 14px rgba(124,58,237,.3)"}}><Download size={14}/>Export SoA</button>
      </div>
    </div>

    <div style={{display:"flex",gap:8,marginBottom:24}}>
      {tabBtn("overview","📊 Overview")}
      {tabBtn("controls","🛡️ All 93 Controls")}
      {tabBtn("timeline","📅 Timeline")}
      {tabBtn("docs","📋 Mandatory Docs")}
      {tabBtn("gaps","⚠️ Critical Gaps")}
    </div>

    {loading?(
      <div style={{textAlign:"center",padding:60,color:"#a89dc8"}}><RefreshCw size={20} style={{animation:"spin 1s linear infinite"}}/><div style={{marginTop:8,fontSize:13}}>Loading ISO 27001 data…</div></div>
    ):(
    <>
    {tab==="overview"&&readiness&&summary&&timeline&&(
      <div>
        <div style={{display:"grid",gridTemplateColumns:"auto 1fr 1fr 1fr",gap:20,marginBottom:24,background:"#fff",border:"1px solid rgba(124,58,237,.1)",borderRadius:18,padding:28,alignItems:"center"}}>
          <div style={{paddingRight:24,borderRight:"1px solid rgba(124,58,237,.08)"}}><ScoreRing score={readiness.score||0}/><div style={{textAlign:"center",fontSize:11,color:"#a89dc8",marginTop:4,textTransform:"uppercase",letterSpacing:".5px"}}>ISO 27001 Ready</div></div>
          {[{label:"Implemented",value:summary.implemented||0,color:"#16a34a"},{label:"In Progress",value:summary.in_progress||0,color:"#d97706"},{label:"Not Started",value:summary.not_started||0,color:"#e11d48"}].map(s=>(
            <div key={s.label} style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:40,fontWeight:800,color:s.color,lineHeight:1}}>{s.value}</div>
              <div style={{fontSize:11,color:"#a89dc8",textTransform:"uppercase",letterSpacing:".5px",marginTop:4}}>{s.label}</div>
              <div style={{height:4,background:"rgba(124,58,237,.08)",borderRadius:2,marginTop:8,overflow:"hidden"}}><div style={{height:"100%",width:`${summary.total?s.value/summary.total*100:0}%`,background:s.color,borderRadius:2,transition:"width 1s"}}/></div>
            </div>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
          {themes.map(theme=>{
            const tc=controls.filter(c=>c.theme===theme);
            const impl=tc.filter(c=>c.status==="implemented"||c.status==="IMPLEMENTED").length;
            const pct=tc.length>0?Math.round((impl/tc.length)*100):0;
            const color=THEME_COLORS[theme]||"#7c3aed";
            return(<div key={theme} onClick={()=>{setTab("controls");setThemeFilter(theme);}} style={{background:"#fff",border:`1px solid ${color}20`,borderRadius:14,padding:"18px 16px",cursor:"pointer",transition:"all .2s",position:"relative",overflow:"hidden"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.borderColor=`${color}40`;}} onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.borderColor=`${color}20`;}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${color},${color}50)`}}/>
              <div style={{fontSize:22,marginBottom:8}}>{theme==="Organisational"?"🏢":theme==="People"?"👥":theme==="Physical"?"🏗️":"💻"}</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,color:"#1a0a3a",marginBottom:2}}>{theme}</div>
              <div style={{fontSize:11,color:"#a89dc8",marginBottom:10}}>{impl}/{tc.length} implemented</div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:11,color:"#6b5b9e"}}>{impl}/{tc.length}</span><span style={{fontSize:13,fontWeight:800,color}}>{pct}%</span></div>
              <div style={{height:5,background:`${color}15`,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:2,transition:"width 1s"}}/></div>
            </div>);
          })}
        </div>

        <div style={{background:"#fff",border:"1px solid rgba(124,58,237,.1)",borderRadius:14,padding:22}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:"#1a0a3a"}}>📅 Certification Timeline</div>
            <div style={{fontSize:13,color:"#7c3aed",fontWeight:600}}>Est. ready: {timeline.estimated_cert_date||"Q3 2026"}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",flexWrap:"wrap"}}>
            {(timeline.phases||[]).map((phase,i)=>(
              <div key={phase.phase} style={{display:"flex",alignItems:"center"}}>
                <div style={{textAlign:"center",minWidth:100}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:phase.status==="COMPLETED"?"linear-gradient(135deg,#7c3aed,#db2777)":phase.status==="IN_PROGRESS"?"rgba(124,58,237,.15)":"rgba(124,58,237,.06)",border:`2px solid ${phase.status==="COMPLETED"?"#7c3aed":phase.status==="IN_PROGRESS"?"rgba(124,58,237,.4)":"rgba(124,58,237,.15)"}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 6px",color:phase.status==="COMPLETED"?"#fff":phase.status==="IN_PROGRESS"?"#7c3aed":"#a89dc8",fontSize:12,fontWeight:700}}>
                    {phase.status==="COMPLETED"?"✓":phase.phase}
                  </div>
                  <div style={{fontSize:10,color:phase.status==="COMPLETED"?"#7c3aed":phase.status==="IN_PROGRESS"?"#1a0a3a":"#a89dc8",fontWeight:phase.status==="IN_PROGRESS"?700:400,maxWidth:90,lineHeight:1.3,margin:"0 auto"}}>{phase.name}</div>
                  <div style={{fontSize:9,color:"#a89dc8",marginTop:2}}>{phase.duration_weeks}w</div>
                </div>
                {i<(timeline.phases||[]).length-1&&<div style={{height:2,width:20,background:phase.status==="COMPLETED"?"#7c3aed":"rgba(124,58,237,.1)",flexShrink:0}}/>}
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    {tab==="controls"&&(
      <div>
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          {["","Organisational","People","Physical","Technological"].map(t=>(<button key={t} onClick={()=>setThemeFilter(t)} style={{padding:"5px 12px",borderRadius:100,fontSize:11,fontWeight:600,cursor:"pointer",border:"1px solid",borderColor:themeFilter===t?"rgba(124,58,237,.4)":"rgba(124,58,237,.12)",background:themeFilter===t?"rgba(124,58,237,.1)":"#fff",color:themeFilter===t?"#7c3aed":"#6b5b9e"}}>{t||"All Themes"}</button>))}
          <div style={{width:1,height:20,background:"rgba(124,58,237,.12)",margin:"0 4px"}}/>
          {["","IMPLEMENTED","IN_PROGRESS","NOT_STARTED"].map(s=>(<button key={s} onClick={()=>setStatusFilter(s)} style={{padding:"5px 12px",borderRadius:100,fontSize:11,fontWeight:600,cursor:"pointer",border:"1px solid",borderColor:statusFilter===s?"rgba(124,58,237,.4)":"rgba(124,58,237,.12)",background:statusFilter===s?"rgba(124,58,237,.1)":"#fff",color:statusFilter===s?"#7c3aed":"#6b5b9e"}}>{s?STATUS_CFG[s]?.label:"All Status"}</button>))}
          <span style={{marginLeft:"auto",fontSize:12,color:"#a89dc8",display:"flex",alignItems:"center"}}>{filtered.length} controls</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {filtered.map(c=>{
            const st=STATUS_CFG[c.status]||STATUS_CFG.NOT_STARTED;
            const color=THEME_COLORS[c.theme]||"#7c3aed";
            return(<div key={c.id} onClick={()=>setExpanded(e=>({...e,[c.id]:!e[c.id]}))} style={{background:"#fff",border:"1px solid rgba(124,58,237,.08)",borderRadius:10,padding:"12px 16px",cursor:"pointer",transition:"border-color .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(124,58,237,.2)"} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(124,58,237,.08)"}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color,minWidth:55,fontWeight:700}}>{c.id}</span>
                <div style={{flex:1,fontSize:13,fontWeight:500,color:"#1a0a3a"}}>{c.name}</div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:9,fontWeight:700,color,background:`${color}14`,borderRadius:4,padding:"1px 6px"}}>{c.theme}</span>
                  <span style={{background:st.bg,color:st.color,borderRadius:100,padding:"3px 10px",fontSize:11,fontWeight:700,minWidth:90,textAlign:"center"}}>{st.icon} {st.label}</span>
                </div>
              </div>
              {expanded[c.id]&&(<div style={{marginTop:12,paddingTop:12,borderTop:"1px dashed rgba(124,58,237,.1)",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                <div><div style={{fontSize:10,color:"#a89dc8",marginBottom:3,textTransform:"uppercase"}}>Owner</div><div style={{fontSize:13,color:"#1a0a3a",fontWeight:500}}>{c.owner}</div></div>
                <div><div style={{fontSize:10,color:"#a89dc8",marginBottom:3,textTransform:"uppercase"}}>Evidence Items</div><div style={{fontSize:13,color:"#1a0a3a",fontWeight:500}}>{c.evidence_count} uploaded</div></div>
                <div><div style={{fontSize:10,color:"#a89dc8",marginBottom:3,textTransform:"uppercase"}}>Priority</div><div style={{fontSize:13,fontWeight:600,color:c.priority==="CRITICAL"?"#e11d48":c.priority==="HIGH"?"#ea580c":"#d97706"}}>{c.priority}</div></div>
              </div>)}
            </div>);
          })}
        </div>
      </div>
    )}

    {tab==="timeline"&&timeline&&(
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {(timeline.phases||[]).map(phase=>(
          <div key={phase.phase} style={{background:"#fff",border:`1px solid ${phase.status==="COMPLETED"?"rgba(124,58,237,.2)":phase.status==="IN_PROGRESS"?"rgba(217,119,6,.2)":"rgba(124,58,237,.08)"}`,borderRadius:14,padding:22,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",left:0,top:0,bottom:0,width:4,background:phase.status==="COMPLETED"?"linear-gradient(180deg,#7c3aed,#db2777)":phase.status==="IN_PROGRESS"?"#d97706":"rgba(124,58,237,.15)"}}/>
            <div style={{paddingLeft:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:"#1a0a3a"}}>Phase {phase.phase}: {phase.name}</span>
                <span style={{background:phase.status==="COMPLETED"?"rgba(22,163,74,.1)":phase.status==="IN_PROGRESS"?"rgba(217,119,6,.1)":"rgba(124,58,237,.06)",color:phase.status==="COMPLETED"?"#16a34a":phase.status==="IN_PROGRESS"?"#d97706":"#a89dc8",borderRadius:100,padding:"2px 10px",fontSize:11,fontWeight:700}}>
                  {phase.status==="COMPLETED"?"✓ Complete":phase.status==="IN_PROGRESS"?"◔ In Progress":"○ Not Started"}
                </span>
                <span style={{fontSize:11,color:"#a89dc8",marginLeft:"auto"}}>{phase.duration_weeks} week{phase.duration_weeks>1?"s":""}</span>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {(phase.tasks||[]).map((task,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(124,58,237,.04)",border:"1px solid rgba(124,58,237,.1)",borderRadius:7,padding:"5px 12px",fontSize:12,color:"#6b5b9e"}}><span style={{color:phase.status==="COMPLETED"?"#16a34a":phase.status==="IN_PROGRESS"?"#d97706":"#a89dc8"}}>{phase.status==="COMPLETED"?"✓":"○"}</span>{task}</div>))}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}

    {tab==="docs"&&readiness&&(
      <div>
        <div style={{background:"rgba(124,58,237,.04)",border:"1px solid rgba(124,58,237,.12)",borderRadius:12,padding:"14px 18px",marginBottom:20,fontSize:13,color:"#6b5b9e"}}>ISO 27001:2022 requires 10 mandatory documented items. All must be ready before your Stage 1 audit.</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {(readiness.mandatory_docs||[]).map((doc,i)=>(<div key={i} style={{background:"#fff",border:"1px solid rgba(124,58,237,.08)",borderRadius:12,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:32,height:32,borderRadius:8,background:doc.status==="DONE"?"rgba(22,163,74,.1)":doc.status==="in_progress"||doc.status==="IN_PROGRESS"?"rgba(217,119,6,.1)":"rgba(225,29,72,.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{doc.status==="DONE"?"✅":doc.status==="in_progress"||doc.status==="IN_PROGRESS"?"📝":"📄"}</div>
              <div><div style={{fontSize:14,fontWeight:600,color:"#1a0a3a"}}>{doc.name}</div><div style={{fontSize:11,color:"#a89dc8"}}>Mandatory ISO 27001:2022 document</div></div>
            </div>
            <span style={{background:doc.status==="DONE"?"rgba(22,163,74,.1)":doc.status==="in_progress"||doc.status==="IN_PROGRESS"?"rgba(217,119,6,.1)":"rgba(225,29,72,.06)",color:doc.status==="DONE"?"#16a34a":doc.status==="in_progress"||doc.status==="IN_PROGRESS"?"#d97706":"#e11d48",borderRadius:100,padding:"4px 12px",fontSize:11,fontWeight:700}}>{doc.status==="DONE"?"Complete":doc.status==="in_progress"||doc.status==="IN_PROGRESS"?"In Progress":"Missing"}</span>
          </div>))}
        </div>
      </div>
    )}

    {tab==="gaps"&&readiness&&(
      <div>
        <div style={{background:"rgba(225,29,72,.04)",border:"1px solid rgba(225,29,72,.15)",borderRadius:12,padding:"14px 18px",marginBottom:20,display:"flex",gap:12,alignItems:"center"}}>
          <AlertTriangle size={18} color="#e11d48"/>
          <div style={{fontSize:13,color:"#1a0a3a"}}><strong>{(Array.isArray(readiness.critical_gaps)?readiness.critical_gaps.length:readiness.critical_gaps||0)} critical controls</strong> not yet implemented. Fix these before your audit.</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {(Array.isArray(readiness.critical_gaps)?readiness.critical_gaps:readiness.top_gaps||[]).map((gap,i)=>(<div key={gap.id} style={{background:"#fff",border:"1px solid rgba(225,29,72,.12)",borderRadius:12,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:32,height:32,borderRadius:8,background:"rgba(225,29,72,.08)",display:"flex",alignItems:"center",justifyContent:"center",color:"#e11d48",fontSize:16}}>⚠️</div>
              <div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"#a89dc8"}}>{gap.id}</span><span style={{fontSize:14,fontWeight:600,color:"#1a0a3a"}}>{gap.name}</span></div><div style={{fontSize:12,color:"#a89dc8"}}>Owner: {gap.owner}</div></div>
            </div>
            <button onClick={()=>setTab("controls")} style={{padding:"7px 16px",background:"linear-gradient(135deg,#7c3aed,#db2777)",border:"none",borderRadius:8,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>Fix Now →</button>
          </div>))}
          {(Array.isArray(readiness.critical_gaps)?readiness.critical_gaps.length:readiness.critical_gaps||0)===0&&<div style={{textAlign:"center",padding:60}}><div style={{fontSize:48,marginBottom:12}}>🎉</div><div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:700,color:"#1a0a3a"}}>No critical gaps!</div></div>}
        </div>
      </div>
    )}
    </>
    )}
    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
  </div>);}
