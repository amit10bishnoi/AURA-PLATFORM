import { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles, Send, RefreshCw, ChevronRight, AlertTriangle, CheckCircle } from "lucide-react";
const API="http://localhost:8000";
const CAT_COLORS={"Risk Analysis":"#F87171","Remediation Guide":"#34D399","Compliance Insights":"#60A5FA","Vendor Risk":"#FBBF24","Evidence":"#A78BFA","General Insights":"#94A3B8"};
function TypingDots(){return(<div style={{display:"flex",gap:4,alignItems:"center",padding:"12px 16px"}}>{[0,1,2].map(i=>(<div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#475569",animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite`}}/>))}<style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style></div>);}
export default function AIAssistant({token,tenantId,onNavigate}){
const[messages,setMessages]=useState([{id:0,role:"assistant",content:"Hi! I'm AURA AI — your compliance copilot for ISO 27001, SOC 2, RBI Cybersecurity & DPDP Act 2023. Ask me anything about your risk score, compliance gaps, or how to fix a finding.",category:"General",timestamp:new Date().toISOString()}]);
const[input,setInput]=useState("");
const[loading,setLoading]=useState(false);
const[suggestions,setSuggestions]=useState([]);
const[summary,setSummary]=useState(null);
const[recommendations,setRecommendations]=useState([]);
const[tab,setTab]=useState("chat");
const[summaryLoading,setSummaryLoading]=useState(false);
const bottomRef=useRef(null);
useEffect(()=>{
fetch(`${API}/api/ai/suggestions?tenant_id=${tenantId||"demo"}`,{headers:{Authorization:`Bearer ${token}`}})
    .then(r=>r.json()).then(d=>setSuggestions(d.suggestions||[])).catch(()=>setSuggestions([]));
  fetch(`${API}/api/ai/recommendations?tenant_id=${tenantId||"demo"}`,{headers:{Authorization:`Bearer ${token}`}})
    .then(r=>r.json()).then(d=>setRecommendations(d.recommendations||[])).catch(()=>setRecommendations([]));
},[token,tenantId]);
useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);
const sendMessage=async(text)=>{
const msg=text||input.trim();if(!msg)return;
setInput("");
setMessages(m=>[...m,{id:Date.now(),role:"user",content:msg,timestamp:new Date().toISOString()}]);
setLoading(true);
try{
const res=await fetch(`${API}/api/ai/chat?tenant_id=${tenantId||"demo"}`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({message:msg})});
const data=await res.json();
setMessages(m=>[...m,{id:Date.now()+1,role:"assistant",content:data.response,category:data.category,actions:data.actions,confidence:data.confidence,timestamp:data.timestamp}]);
}catch{setMessages(m=>[...m,{id:Date.now()+1,role:"assistant",content:"I'm having trouble connecting. Please try again.",timestamp:new Date().toISOString()}]);}
finally{setLoading(false);}};
const loadSummary=async()=>{setSummaryLoading(true);try{const res=await fetch(`${API}/api/ai/summary?tenant_id=${tenantId||"demo"}`,{headers:{Authorization:`Bearer ${token}`}});const data=await res.json();setSummary(data);}catch{}finally{setSummaryLoading(false);}};
useEffect(()=>{if(tab==="summary"&&!summary)loadSummary();},[tab]);
const effortColor=e=>e==="Low"?"#34D399":e==="Medium"?"#FBBF24":"#F87171";
return(<div style={{padding:"28px 32px",height:"calc(100vh - 52px)",display:"flex",flexDirection:"column"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
<div><h2 style={{margin:0,fontSize:22,fontWeight:700,color:"#F1F5F9",display:"flex",alignItems:"center",gap:10}}><Sparkles size={22} color="#A78BFA"/>AI Risk Assistant</h2><p style={{margin:"6px 0 0",color:"#64748B",fontSize:13}}>Ask anything about your compliance posture, risk score, or remediation steps</p></div>
<div style={{display:"flex",gap:8}}>{["chat","summary","actions"].map(t=>(<button key={t} onClick={()=>setTab(t)} style={{padding:"7px 14px",borderRadius:7,fontSize:12,fontWeight:500,cursor:"pointer",border:"1px solid",borderColor:tab===t?"rgba(167,139,250,.3)":"#1E293B",background:tab===t?"rgba(167,139,250,.1)":"transparent",color:tab===t?"#A78BFA":"#64748B"}}>{t==="chat"?"💬 Chat":t==="summary"?"📊 Summary":"⚡ Actions"}</button>))}</div>
</div>
{tab==="chat"&&(<>
<div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:12,marginBottom:16,paddingRight:4}}>
{messages.map(m=>(<div key={m.id} style={{display:"flex",gap:10,flexDirection:m.role==="user"?"row-reverse":"row",alignItems:"flex-start"}}>
{m.role==="assistant"&&<div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#6366F1,#A78BFA)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Sparkles size={14} color="white"/></div>}
<div style={{maxWidth:"75%"}}>
{m.category&&<div style={{fontSize:10,fontWeight:600,color:CAT_COLORS[m.category]||"#94A3B8",marginBottom:4,textTransform:"uppercase",letterSpacing:".05em",display:"flex",alignItems:"center",gap:8}}><span>{m.category}</span>{m.confidence&&<span style={{color:"#475569"}}>· {m.confidence}% confidence</span>}{m.source==="claude-ai"&&<span style={{background:"rgba(139,92,246,0.15)",color:"#a78bfa",borderRadius:4,padding:"1px 6px",fontSize:9,fontWeight:700}}>⚡ Claude AI</span>}</div>}
<div style={{background:m.role==="user"?"rgba(99,102,241,.15)":"#0F172A",border:`1px solid ${m.role==="user"?"rgba(99,102,241,.3)":"#1E293B"}`,borderRadius:m.role==="user"?"12px 12px 2px 12px":"12px 12px 12px 2px",padding:"10px 14px",color:"#CBD5E1",fontSize:13,lineHeight:1.6}}>{m.content.split('\n').map((line,i)=>{
    const parts = line.split(/\*\*([^*]+)\*\*/g);
    return <span key={i}>{parts.map((p,j)=>j%2===1?<strong key={j} style={{color:"#e2e8f0",fontWeight:700}}>{p}</strong>:<span key={j}>{p}</span>)}<br/></span>;
  })}</div>
{m.actions&&m.actions.length>0&&(<div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>{m.actions.map(a=>(<button key={a.label} onClick={()=>onNavigate&&onNavigate(a.tab)} style={{background:"rgba(99,102,241,.1)",border:"1px solid rgba(99,102,241,.25)",borderRadius:6,padding:"4px 10px",color:"#818CF8",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>{a.label}<ChevronRight size={10}/></button>))}</div>)}
</div>
</div>))}
{loading&&(<div style={{display:"flex",gap:10,alignItems:"flex-start"}}><div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#6366F1,#A78BFA)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Sparkles size={14} color="white"/></div><div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:"12px 12px 12px 2px"}}><TypingDots/></div></div>)}
<div ref={bottomRef}/>
</div>
{suggestions.length>0&&messages.length<=1&&(<div style={{marginBottom:12}}><div style={{color:"#475569",fontSize:11,marginBottom:8,textTransform:"uppercase",letterSpacing:".05em"}}>Suggested questions</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{suggestions.slice(0,6).map(s=>(<button key={s} onClick={()=>sendMessage(s)} style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:7,padding:"6px 11px",color:"#64748B",fontSize:12,cursor:"pointer"}}>{s}</button>))}</div></div>)}
<div style={{display:"flex",gap:10}}>
<input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMessage()} placeholder="Ask about your risk score, compliance gaps, or how to fix a finding…" style={{flex:1,background:"#0F172A",border:"1px solid #1E293B",borderRadius:10,padding:"11px 16px",color:"#F1F5F9",fontSize:13,outline:"none"}} onFocus={e=>e.target.style.borderColor="rgba(99,102,241,.4)"} onBlur={e=>e.target.style.borderColor="#1E293B"}/>
<button onClick={()=>sendMessage()} disabled={loading||!input.trim()} style={{background:"linear-gradient(135deg,#6366F1,#818CF8)",border:"none",borderRadius:10,padding:"11px 18px",color:"white",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:500,opacity:loading||!input.trim()?0.5:1}}><Send size={14}/>Send</button>
</div>
</>)}
{tab==="summary"&&(<div style={{flex:1,overflowY:"auto"}}>
{summaryLoading?<div style={{textAlign:"center",padding:60,color:"#475569"}}><RefreshCw size={20} style={{animation:"spin 1s linear infinite"}}/><div style={{marginTop:8,fontSize:13}}>Generating AI summary…</div></div>:
summary&&(<div style={{display:"flex",flexDirection:"column",gap:16}}>
<div style={{background:"linear-gradient(135deg,rgba(99,102,241,.1),rgba(167,139,250,.05))",border:"1px solid rgba(99,102,241,.2)",borderRadius:14,padding:24}}>
<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><Sparkles size={16} color="#A78BFA"/><span style={{color:"#A78BFA",fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>AI Executive Summary</span></div>
<p style={{color:"#CBD5E1",fontSize:14,lineHeight:1.7,margin:"0 0 16px"}}>{summary.summary}</p>
<div style={{display:"flex",gap:20}}>{[{l:"Risk Score",v:summary.risk_score,c:"#34D399"},{l:"Trend",v:summary.trend,c:"#60A5FA"},{l:"Audit Ready",v:summary.audit_ready_in,c:"#A78BFA"}].map(s=>(<div key={s.l}><div style={{color:"#475569",fontSize:11}}>{s.l}</div><div style={{color:s.c,fontSize:18,fontWeight:700}}>{s.v}</div></div>))}</div>
</div>
<div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:14,padding:20}}>
<h4 style={{margin:"0 0 14px",color:"#94A3B8",fontSize:12,textTransform:"uppercase",letterSpacing:".05em"}}>Key Highlights</h4>
{summary.highlights.map((h,i)=>{const color=h.type==="positive"?"#34D399":h.type==="warning"?"#FBBF24":"#F87171";const Icon=h.type==="positive"?CheckCircle:AlertTriangle;return(<div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><Icon size={14} color={color}/><span style={{color:"#CBD5E1",fontSize:13}}>{h.text}</span></div>);})}
</div>
</div>)}
</div>)}
{tab==="actions"&&(<div style={{flex:1,overflowY:"auto"}}>
<div style={{color:"#64748B",fontSize:13,marginBottom:16}}>AI-prioritized action items based on your current risk posture.</div>
<div style={{display:"flex",flexDirection:"column",gap:10}}>
{recommendations.map(r=>(<div key={r.priority} style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",gap:16}} onMouseEnter={e=>e.currentTarget.style.borderColor="#334155"} onMouseLeave={e=>e.currentTarget.style.borderColor="#1E293B"}>
<div style={{width:28,height:28,borderRadius:"50%",background:"rgba(99,102,241,.1)",border:"1px solid rgba(99,102,241,.2)",display:"flex",alignItems:"center",justifyContent:"center",color:"#818CF8",fontSize:12,fontWeight:700,flexShrink:0}}>#{r.priority}</div>
<div style={{flex:1}}><div style={{color:"#E2E8F0",fontSize:13,fontWeight:500,marginBottom:4}}>{r.title}</div><div style={{display:"flex",gap:8}}><span style={{color:"#475569",fontSize:11}}>{r.framework} · {r.control}</span><span style={{color:effortColor(r.effort),fontSize:11}}>Effort: {r.effort}</span></div></div>
<button onClick={()=>onNavigate&&onNavigate(r.tab)} style={{background:"rgba(99,102,241,.1)",border:"1px solid rgba(99,102,241,.2)",borderRadius:7,padding:"6px 12px",color:"#818CF8",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:4,flexShrink:0}}>Fix Now<ChevronRight size={12}/></button>
</div>))}
</div>
</div>)}
<style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
</div>);}
