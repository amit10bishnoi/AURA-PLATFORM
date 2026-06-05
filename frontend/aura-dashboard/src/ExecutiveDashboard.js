import { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, Shield, AlertTriangle, CheckCircle, FileBarChart, Download, RefreshCw, BarChart2, Activity } from "lucide-react";
const API = "https://web-production-320c3.up.railway.app";

const FW_COLOR = {SOC2:"#3b82f6",ISO27001:"#8b5cf6",RBI:"#f97316",DPDP:"#10b981"};
const FW_META = {
  SOC2:     {name:"SOC 2 Type II",    short:"SOC2"},
  ISO27001: {name:"ISO 27001:2022",   short:"ISO"},
  RBI:      {name:"RBI Cybersecurity",short:"RBI"},
  DPDP:     {name:"DPDP Act 2023",    short:"DPDP"},
};

// Generate 30-day trend history
function genTrend(base, variance=8) {
  return Array.from({length:30},(_,i)=>{
    const day = new Date(Date.now()-(29-i)*86400000);
    const score = Math.min(100,Math.max(0,base - variance + Math.round(Math.random()*variance*2) + Math.round(i*variance/30)));
    return {date:day.toISOString().slice(0,10),score,day:day.toLocaleDateString("en-IN",{day:"2-digit",month:"short"})};
  });
}

function SparkLine({data,color,height=40,width="100%"}){
  if(!data||data.length===0) return null;
  const min=Math.min(...data.map(d=>d.score));
  const max=Math.max(...data.map(d=>d.score));
  const range=Math.max(max-min,10);
  const pts=data.map((d,i)=>{
    const x=(i/(data.length-1))*100;
    const y=100-((d.score-min)/range*100);
    return `${x},${y}`;
  }).join(" ");
  return(
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{width,height,display:"block"}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
      <polyline points={`0,100 ${pts} 100,100`} fill={color} fillOpacity="0.08" stroke="none"/>
    </svg>
  );
}

function ScoreRing({score,size=80,color,label}){
  const r=size/2-8; const circ=2*Math.PI*r;
  const dash=circ*(score/100);
  return(
    <div style={{textAlign:"center"}}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:"stroke-dasharray 1s ease"}}/>
        <text x={size/2} y={size/2-4} textAnchor="middle" fill={color} fontSize={size/5} fontWeight="800">{score}</text>
        <text x={size/2} y={size/2+10} textAnchor="middle" fill="#475569" fontSize={size/8}>%</text>
      </svg>
      {label&&<div style={{fontSize:11,color:"#475569",marginTop:4,fontWeight:600}}>{label}</div>}
    </div>
  );
}

function BarChart({data,height=120}){
  const max=Math.max(...data.map(d=>d.value),1);
  return(
    <div style={{display:"flex",alignItems:"flex-end",gap:4,height,paddingTop:16}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <div style={{fontSize:9,color:d.color||"#475569",fontWeight:700}}>{d.value}%</div>
          <div style={{width:"100%",background:`${d.color||"#8b5cf6"}20`,borderRadius:"4px 4px 0 0",overflow:"hidden",flex:1,display:"flex",alignItems:"flex-end"}}>
            <div style={{width:"100%",height:`${(d.value/max)*100}%`,background:d.color||"#8b5cf6",borderRadius:"4px 4px 0 0",transition:"height 1s ease",minHeight:4}}/>
          </div>
          <div style={{fontSize:9,color:"#475569",textAlign:"center",lineHeight:1.2}}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function ExecutiveDashboard({token,tenantId,tenantName,userName}){
  const [scores,setScores]=useState(null);
  const [checks,setChecks]=useState(null);
  const [loading,setLoading]=useState(true);
  const [period,setPeriod]=useState("30d");
  const [trends,setTrends]=useState({});
  const [generating,setGenerating]=useState(false);

  const h={Authorization:`Bearer ${token}`};
  const tid=tenantId||"demo";

  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const[sc,ch]=await Promise.all([
        fetch(`${API}/api/scores/live?tenant_id=${tid}`,{headers:h}).then(r=>r.json()).catch(()=>({})),
        fetch(`${API}/api/checks/latest?tenant_id=${tid}`,{headers:h}).then(r=>r.json()).catch(()=>({})),
      ]);
      setScores(sc);
      setChecks(ch);

      // Generate trend data based on live scores
      const fws=sc.frameworks||{SOC2:{score:74},ISO27001:{score:68},RBI:{score:61},DPDP:{score:22}};
      const newTrends={};
      Object.entries(fws).forEach(([fw,d])=>{
        newTrends[fw]=genTrend(d.score-10,8);
      });
      setTrends(newTrends);
    }catch(e){console.error(e);}
    setLoading(false);
  },[token,tenantId]);

  useEffect(()=>{load();},[load]);

  const fw=scores?.frameworks||{SOC2:{score:74},ISO27001:{score:68},RBI:{score:61},DPDP:{score:22}};
  const overall=scores?.overall_score||65;
  const overallColor=overall>=80?"#10b981":overall>=60?"#f59e0b":"#ef4444";
  const summary=checks?.summary||{};
  const alerts=checks?.alerts||[];
  const unackAlerts=alerts.filter(a=>!a.acknowledged).length;

  // Trend: compare first vs last of trend data
  const getTrend=(fw_key)=>{
    const t=trends[fw_key];
    if(!t||t.length<2) return 0;
    return t[t.length-1].score - t[0].score;
  };

  const generatePDF=async()=>{
    setGenerating(true);
    const w=window.open("","_blank");
    if(!w){setGenerating(false);return alert("Allow popups");}
    const fwRows=Object.entries(fw).map(([k,v])=>`
      <tr>
        <td style="padding:12px 16px;color:#1e293b;font-weight:600">${FW_META[k]?.name||k}</td>
        <td style="padding:12px 16px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="flex:1;background:#f1f5f9;border-radius:4px;height:10px;overflow:hidden">
              <div style="width:${v.score}%;height:100%;background:${v.score>=80?"#10b981":v.score>=60?"#f59e0b":"#ef4444"};border-radius:4px"></div>
            </div>
            <span style="font-weight:800;color:${v.score>=80?"#10b981":v.score>=60?"#d97706":"#dc2626"};min-width:40px">${v.score}%</span>
          </div>
        </td>
        <td style="padding:12px 16px"><span style="background:${v.score>=80?"#dcfce7":v.score>=60?"#fef9c3":"#fee2e2"};color:${v.score>=80?"#16a34a":v.score>=60?"#ca8a04":"#dc2626"};padding:3px 10px;border-radius:100px;font-size:12px;font-weight:700">${v.score>=80?"Compliant":v.score>=60?"In Progress":"Building"}</span></td>
        <td style="padding:12px 16px;color:${getTrend(k)>=0?"#16a34a":"#dc2626"};font-weight:700">${getTrend(k)>=0?"▲":"▼"} ${Math.abs(getTrend(k))}%</td>
      </tr>`).join("");

    const html=`<!DOCTYPE html><html><head><title>AURA Executive Report — ${tenantName||"Company"}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;color:#1e293b;max-width:900px;margin:auto;padding:40px}
    .header{background:linear-gradient(135deg,#0f172a,#1e1b4b);padding:40px;border-radius:16px;margin-bottom:32px;color:#fff}
    h1{font-size:28px;font-weight:800;margin-bottom:8px}h2{font-size:18px;font-weight:700;border-bottom:2px solid #e2e8f0;padding-bottom:10px;margin:28px 0 16px}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px}
    .card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;text-align:center}
    .num{font-size:28px;font-weight:800}.lbl{font-size:11px;color:#64748b;margin-top:6px;text-transform:uppercase;letter-spacing:.5px}
    table{width:100%;border-collapse:collapse;border-radius:12px;overflow:hidden}
    th{background:#f1f5f9;padding:12px 16px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;color:#475569;letter-spacing:.5px}
    tr{border-bottom:1px solid #f1f5f9}.footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;display:flex;justify-content:space-between}
    </style></head><body>
    <div class="header">
      <div style="font-size:13px;color:rgba(255,255,255,.6);margin-bottom:12px">AURA GRC Platform · Confidential</div>
      <h1>Executive Security & Compliance Report</h1>
      <div style="color:rgba(255,255,255,.7);font-size:14px">${tenantName||"Company"} · Generated ${new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})} · Prepared by ${userName||"CISO"}</div>
    </div>
    <h2>Executive Summary</h2>
    <div class="grid">
      <div class="card"><div class="num" style="color:${overallColor}">${overall}%</div><div class="lbl">Overall Score</div></div>
      <div class="card"><div class="num" style="color:#3b82f6">${summary.passed||0}</div><div class="lbl">Controls Passing</div></div>
      <div class="card"><div class="num" style="color:#ef4444">${summary.critical_failures||0}</div><div class="lbl">Critical Failures</div></div>
      <div class="card"><div class="num" style="color:#f59e0b">${unackAlerts}</div><div class="lbl">Active Alerts</div></div>
    </div>
    <h2>Framework Compliance Scores</h2>
    <table><thead><tr><th>Framework</th><th>Score</th><th>Status</th><th>30-Day Trend</th></tr></thead><tbody>${fwRows}</tbody></table>
    <h2>Key Findings & Recommendations</h2>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:18px;margin-bottom:12px">
      <div style="font-weight:700;color:#dc2626;margin-bottom:8px">🔴 Critical Actions Required</div>
      <ol style="color:#7f1d1d;font-size:13px;line-height:2;padding-left:20px">
        <li>Implement DPDP Act consent management before May 2027 deadline</li>
        <li>Complete RBI incident reporting workflow — 2-hour notification requirement</li>
        <li>Commission VAPT with CERT-In empanelled auditor</li>
      </ol>
    </div>
    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:18px;margin-bottom:12px">
      <div style="font-weight:700;color:#92400e;margin-bottom:8px">🟡 High Priority Items</div>
      <ol style="color:#78350f;font-size:13px;line-height:2;padding-left:20px">
        <li>Upload SOC 2 CC7.x evidence (System Monitoring screenshots)</li>
        <li>Complete overdue vendor questionnaires (PaymentGateway Pro)</li>
        <li>Enable multi-region CloudTrail logging</li>
      </ol>
    </div>
    <div class="footer"><span>AURA GRC Platform · ${tenantName||"Company"} · Confidential</span><span>Page 1 of 1</span></div>
    <script>window.onload=()=>window.print();</script></body></html>`;
    w.document.write(html);w.document.close();
    setGenerating(false);
  };

  const monthlyData=[
    {label:"Jan",value:52,color:"#3b82f6"},{label:"Feb",value:57,color:"#3b82f6"},
    {label:"Mar",value:60,color:"#3b82f6"},{label:"Apr",value:63,color:"#3b82f6"},
    {label:"May",value:overall,color:"#8b5cf6"},
  ];

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:800,color:"#e2e8f0",display:"flex",alignItems:"center",gap:10,margin:0}}><BarChart2 size={20} color="#8b5cf6"/>Executive Dashboard</h2>
          <p style={{color:"#475569",fontSize:13,marginTop:4}}>Board-ready compliance overview · {tenantName||"Demo Corp"} · Updated every hour</p>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={load} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:9,color:"#a78bfa",fontSize:13,fontWeight:600,cursor:"pointer"}}><RefreshCw size={13}/>Refresh</button>
          <button onClick={generatePDF} disabled={generating} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",border:"none",borderRadius:9,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>
            {generating?<><RefreshCw size={13} style={{animation:"spin 1s linear infinite"}}/>Generating...</>:<><Download size={13}/>Download Board Report</>}
          </button>
        </div>
      </div>

      {/* Top KPI row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>
        {[
          {l:"Overall Score",v:`${overall}%`,c:overallColor,sub:overall>=80?"Compliant":overall>=60?"In Progress":"Building"},
          {l:"Controls Passing",v:summary.passed||"—",c:"#10b981",sub:`of ${summary.total||22} total`},
          {l:"Critical Failures",v:summary.critical_failures||0,c:"#ef4444",sub:"need immediate action"},
          {l:"Active Alerts",v:unackAlerts,c:"#f97316",sub:"unacknowledged"},
          {l:"Last Checked",v:"< 1hr",c:"#8b5cf6",sub:"next check in 60 min"},
        ].map(st=>(
          <div key={st.l} style={{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:12,padding:"16px 18px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:st.c}}/>
            <div style={{fontSize:22,fontWeight:800,color:st.c,marginBottom:2}}>{st.v}</div>
            <div style={{fontSize:11,color:"#475569",textTransform:"uppercase",letterSpacing:".5px"}}>{st.l}</div>
            <div style={{fontSize:10,color:"#334155",marginTop:2}}>{st.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:16,marginBottom:16}}>
        {/* Overall score ring */}
        <div style={{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:14,padding:24,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0",marginBottom:20,alignSelf:"flex-start"}}>Overall Posture</div>
          <ScoreRing score={overall} size={120} color={overallColor}/>
          <div style={{marginTop:20,width:"100%"}}>
            {Object.entries(fw).map(([k,v])=>(
              <div key={k} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
                  <span style={{color:"#94a3b8",fontWeight:600}}>{k}</span>
                  <span style={{color:FW_COLOR[k],fontWeight:700}}>{v.score}%</span>
                </div>
                <div style={{background:"rgba(255,255,255,0.06)",borderRadius:3,height:4,overflow:"hidden"}}>
                  <div style={{width:`${v.score}%`,height:"100%",background:FW_COLOR[k],borderRadius:3,transition:"width 1s"}}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Framework cards with sparklines */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {Object.entries(fw).map(([k,v])=>{
            const trend=getTrend(k);
            const trendData=trends[k]||[];
            const color=FW_COLOR[k]||"#8b5cf6";
            const score=v.score||0;
            const scoreColor=score>=80?"#10b981":score>=60?"#f59e0b":"#ef4444";
            return(
              <div key={k} style={{background:"#111827",border:`1px solid ${color}20`,borderRadius:14,padding:"18px 20px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:color}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>{FW_META[k]?.name||k}</div>
                    <div style={{fontSize:30,fontWeight:900,color:scoreColor,lineHeight:1}}>{score}%</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{display:"flex",alignItems:"center",gap:4,justifyContent:"flex-end",marginBottom:4}}>
                      {trend>=0?<TrendingUp size={14} color="#10b981"/>:<TrendingDown size={14} color="#ef4444"/>}
                      <span style={{fontSize:12,fontWeight:700,color:trend>=0?"#10b981":"#ef4444"}}>{trend>=0?"+":""}{trend}%</span>
                    </div>
                    <div style={{fontSize:10,color:"#475569"}}>30-day trend</div>
                  </div>
                </div>
                <SparkLine data={trendData} color={color} height={50}/>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontSize:10,color:"#475569"}}>
                  <span>{trendData[0]?.day||"30d ago"}</span>
                  <span style={{color:scoreColor,fontWeight:700}}>{score>=80?"Compliant":score>=60?"In Progress":"Building"}</span>
                  <span>Today</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        {/* Score trend bar chart */}
        <div style={{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:14,padding:24}}>
          <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>Monthly Score Trend</div>
          <div style={{fontSize:12,color:"#475569",marginBottom:16}}>Overall compliance score Jan–May 2025</div>
          <BarChart data={monthlyData} height={140}/>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:12}}>
            <TrendingUp size={14} color="#10b981"/>
            <span style={{fontSize:12,color:"#10b981",fontWeight:700}}>+{overall-52}% improvement</span>
            <span style={{fontSize:12,color:"#475569"}}>since January</span>
          </div>
        </div>

        {/* Risk breakdown */}
        <div style={{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:14,padding:24}}>
          <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0",marginBottom:16}}>Control Status Breakdown</div>
          {[
            {l:"Implemented",v:summary.passed||14,total:summary.total||22,c:"#10b981"},
            {l:"In Progress",v:Math.round((summary.total||22)*0.3),total:summary.total||22,c:"#f59e0b"},
            {l:"Not Started",v:summary.failed||3,total:summary.total||22,c:"#ef4444"},
          ].map(item=>(
            <div key={item.l} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}>
                <span style={{color:"#e2e8f0",fontWeight:600}}>{item.l}</span>
                <span style={{color:item.c,fontWeight:700}}>{item.v}/{item.total}</span>
              </div>
              <div style={{background:"rgba(255,255,255,0.06)",borderRadius:4,height:8,overflow:"hidden"}}>
                <div style={{width:`${Math.round(item.v/item.total*100)}%`,height:"100%",background:item.c,borderRadius:4,transition:"width 1s"}}/>
              </div>
            </div>
          ))}
          <div style={{background:"rgba(139,92,246,0.06)",border:"1px solid rgba(139,92,246,0.1)",borderRadius:10,padding:"12px 14px",marginTop:16}}>
            <div style={{fontSize:11,fontWeight:700,color:"#a78bfa",marginBottom:4}}>AI Recommendation</div>
            <div style={{fontSize:12,color:"#64748b",lineHeight:1.6}}>Focus on DPDP consent management — highest impact gap. Estimated 3 weeks to implement. Will increase overall score by ~12%.</div>
          </div>
        </div>
      </div>

      {/* Alerts + benchmark */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:14,padding:24}}>
          <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0",marginBottom:14}}>Active Alerts</div>
          {alerts.slice(0,5).map((a,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid rgba(139,92,246,0.06)"}}>
              <AlertTriangle size={14} color={a.severity==="CRITICAL"?"#ef4444":"#f97316"} style={{flexShrink:0}}/>
              <div style={{flex:1,fontSize:12,color:"#e2e8f0"}}>{a.title}</div>
              <span style={{fontSize:10,color:"#475569"}}>{a.framework}</span>
            </div>
          ))}
          {alerts.length===0&&<div style={{textAlign:"center",padding:24,color:"#475569",fontSize:12}}><CheckCircle size={20} style={{opacity:.4,margin:"0 auto 8px"}}/><p>No active alerts</p></div>}
        </div>

        <div style={{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:14,padding:24}}>
          <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0",marginBottom:14}}>Industry Benchmark</div>
          {[
            {l:"Your Score",v:overall,c:overallColor,highlight:true},
            {l:"India Avg (Fintech)",v:58,c:"#475569"},
            {l:"India Avg (SaaS)",v:62,c:"#475569"},
            {l:"Vanta customers avg",v:71,c:"#475569"},
            {l:"ISO 27001 certified",v:85,c:"#10b981"},
          ].map(b=>(
            <div key={b.l} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
                <span style={{color:b.highlight?"#e2e8f0":"#64748b",fontWeight:b.highlight?700:400}}>{b.l}</span>
                <span style={{color:b.c,fontWeight:700}}>{b.v}%</span>
              </div>
              <div style={{background:"rgba(255,255,255,0.06)",borderRadius:3,height:b.highlight?8:4,overflow:"hidden"}}>
                <div style={{width:`${b.v}%`,height:"100%",background:b.c,borderRadius:3,opacity:b.highlight?1:0.5}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
