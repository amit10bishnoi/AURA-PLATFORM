import { useState, useEffect, useRef } from 'react';
const T={bg:'#080812',surface:'#0E0E1C',card:'#11111E',cardHi:'#14142A',border:'rgba(255,255,255,0.07)',borderHi:'rgba(255,255,255,0.13)',purple:'#7c3aed',purpleL:'#a78bfa',pink:'#db2777',pinkL:'#f472b6',text:'#ECEEFF',muted:'#5A5A78',faint:'#1E1E32',green:'#10B981',amber:'#F59E0B',red:'#EF4444',mono:"'JetBrains Mono',monospace",display:"'Syne',sans-serif",body:"'DM Sans',sans-serif"};
const FW=[{key:'all',label:'All frameworks',color:'#a78bfa',bg:'rgba(124,58,237,0.18)',border:'rgba(167,139,250,0.5)'},{key:'iso',label:'ISO 27001',color:'#a78bfa',bg:'rgba(167,139,250,0.14)',border:'rgba(167,139,250,0.38)'},{key:'soc2',label:'SOC 2',color:'#34D399',bg:'rgba(52,211,153,0.14)',border:'rgba(52,211,153,0.38)'},{key:'rbi',label:'RBI',color:'#60A5FA',bg:'rgba(96,165,250,0.14)',border:'rgba(96,165,250,0.38)'},{key:'certin',label:'CERT-In',color:'#FBBF24',bg:'rgba(251,191,36,0.14)',border:'rgba(251,191,36,0.38)'},{key:'dpdp',label:'DPDP',color:'#F472B6',bg:'rgba(244,114,182,0.14)',border:'rgba(244,114,182,0.38)'}];
const FD={all:{pct:87,pass:183,total:199,issues:16,crit:3,d7:[72,75,76,80,82,84,85,86,87],d30:[60,61,62,63,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,85,86,86,87,87]},iso:{pct:91,pass:164,total:180,issues:8,crit:1,d7:[80,82,84,86,87,89,90,90,91],d30:[65,66,67,68,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,88,89,89,90,90,91,91]},soc2:{pct:85,pass:51,total:60,issues:5,crit:2,d7:[74,76,77,79,80,82,83,84,85],d30:[58,59,60,61,62,63,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,83,84,84,85,85]},rbi:{pct:78,pass:35,total:45,issues:7,crit:2,d7:[65,67,69,71,73,74,76,77,78],d30:[50,51,52,53,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,75,76,77,78,78]},certin:{pct:74,pass:37,total:50,issues:9,crit:3,d7:[61,63,65,67,69,70,72,73,74],d30:[45,46,47,48,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,70,72,72,73,74]},dpdp:{pct:82,pass:28,total:34,issues:4,crit:0,d7:[68,70,72,74,76,78,80,81,82],d30:[52,53,54,55,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,78,78,79,80,81,82]}};
const EVENTS=[{type:'pass',msg:'AWS — MFA verified on all IAM users',fw:'ISO',ts:'38s ago'},{type:'warn',msg:'Okta — session policy configuration drift',fw:'SOC2',ts:'1m ago'},{type:'pass',msg:'GitHub — secret scanning clean',fw:'ISO',ts:'2m ago'},{type:'fail',msg:'CERT-In — 3 evidence items missing',fw:'CERT-In',ts:'3m ago'},{type:'pass',msg:'DPDP — data residency verified, Mumbai',fw:'DPDP',ts:'4m ago'},{type:'warn',msg:'Snyk — 1 high severity dependency',fw:'SOC2',ts:'5m ago'},{type:'pass',msg:'RBI — audit log export complete',fw:'RBI',ts:'6m ago'},{type:'pass',msg:'Cloudflare — WAF rules verified',fw:'ISO',ts:'8m ago'},{type:'fail',msg:'DPDP — consent log gap detected',fw:'DPDP',ts:'10m ago'}];
const SDOT={pass:'#10B981',warn:'#F59E0B',fail:'#EF4444'};
const FWC={'ISO':'#a78bfa','SOC2':'#34D399','RBI':'#60A5FA','CERT-In':'#FBBF24','DPDP':'#F472B6'};
const VW=560,VH=148,PL=36,PR=14,PT=10,PB=26,CW=VW-PL-PR,CH=VH-PT-PB;
const toY=p=>PT+CH-Math.max(0,Math.min(1,(p-50)/50))*CH;
const toPts=d=>{const s=CW/Math.max(1,d.length-1);return d.map((v,i)=>({x:PL+i*s,y:toY(v)}));};
const poly=pts=>pts.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
const area=pts=>{const b=(PT+CH).toFixed(1),l=pts.slice(1).map(p=>`L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');return `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)} ${l} L${pts[pts.length-1].x.toFixed(1)},${b} L${pts[0].x.toFixed(1)},${b} Z`;};
export default function DarkOverview({token,tenantId}){
  const [fw,setFw]=useState('all');
  const [days,setDays]=useState(7);
  const [feed,setFeed]=useState(EVENTS);
  const [hov,setHov]=useState(null);
  const [newCount,setNewCount]=useState(0);
  const tick=useRef(0);
  useEffect(()=>{const id=setInterval(()=>{tick.current=(tick.current+1)%EVENTS.length;setFeed(prev=>[{...EVENTS[tick.current],ts:'just now'},...prev.slice(0,8)]);setNewCount(n=>n+1);},3600);return()=>clearInterval(id);},[]);
  const d=FD[fw]||FD.all,cfg=FW.find(f=>f.key===fw)||FW[0];
  const cData=days===7?d.d7:d.d30,pts=toPts(cData);
  const today=new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
  const xL=days===7?['Mon','Tue','Wed','Thu','Fri','Sat','Today']:['30d','25d','20d','15d','10d','5d','Today'];
  const card=(s,i)=>(<div key={i} style={{background:T.card,borderRadius:10,padding:'14px 16px',border:`1px solid ${T.border}`,borderTop:`2px solid ${s.c}`}}><div style={{fontSize:10,color:T.muted,textTransform:'uppercase',letterSpacing:'.7px',marginBottom:6}}>{s.l}</div><div style={{fontFamily:T.mono,fontSize:28,fontWeight:600,color:s.c,lineHeight:1}}>{s.v}</div><div style={{fontSize:11,color:s.sc,marginTop:6}}>{s.s}</div></div>);
  return(
    <div style={{background:T.bg,minHeight:'100%',fontFamily:T.body,padding:'24px 28px',color:T.text,boxSizing:'border-box'}}>
      <div style={{display:'flex',alignItems:'flex-start',marginBottom:20,gap:12}}>
        <div><h1 style={{fontFamily:T.display,fontSize:20,fontWeight:700,margin:0,letterSpacing:'-0.4px',color:T.text}}>Compliance command center</h1><p style={{color:T.muted,fontSize:11,margin:'4px 0 0',fontFamily:T.mono}}>{tenantId||'democorp'} · continuous monitoring · {today}</p></div>
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6,paddingTop:4}}><span style={{width:7,height:7,borderRadius:'50%',background:T.green,display:'inline-block'}}/><span style={{fontSize:11,color:T.green,fontFamily:T.mono}}>Live scanning</span></div>
      </div>
      <div style={{display:'flex',gap:6,marginBottom:20,flexWrap:'wrap'}}>
        {FW.map(f=>{const on=fw===f.key;return(<button key={f.key} onClick={()=>setFw(f.key)} style={{padding:'5px 15px',borderRadius:100,fontSize:12,fontWeight:on?500:400,cursor:'pointer',fontFamily:T.body,transition:'all 0.15s ease',border:`1px solid ${on?f.border:'rgba(255,255,255,0.1)'}`,background:on?f.bg:'transparent',color:on?f.color:T.muted}}>{f.label}</button>);})}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:14}}>
        {[{l:'Overall posture',v:`${d.pct}%`,c:cfg.color,s:'↑ 3% this week',sc:T.green},{l:'Controls passing',v:String(d.pass),c:T.green,s:`of ${d.total} total`,sc:T.muted},{l:'Open issues',v:String(d.issues),c:d.crit>0?T.amber:T.green,s:`${d.crit} critical`,sc:d.crit>0?T.red:T.green},{l:'Last scan',v:'2m',c:'rgba(255,255,255,0.85)',s:'auto · continuous',sc:T.muted}].map(card)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:12,marginBottom:12}}>
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 20px'}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
            <div><div style={{fontSize:13,fontWeight:500,color:T.text}}>Posture trend — {cfg.label}</div><div style={{fontSize:11,color:T.muted,fontFamily:T.mono,marginTop:2}}>compliance % over time</div></div>
            <div style={{display:'flex',gap:4}}>{[7,30].map(r=>(<button key={r} onClick={()=>setDays(r)} style={{padding:'3px 10px',borderRadius:5,fontSize:11,fontFamily:T.mono,cursor:'pointer',transition:'all 0.15s',background:days===r?'rgba(124,58,237,0.25)':'transparent',border:`1px solid ${days===r?T.purple:'rgba(255,255,255,0.1)'}`,color:days===r?T.purpleL:T.muted}}>{r}d</button>))}</div>
          </div>
          <svg width="100%" viewBox={`0 0 ${VW} ${VH}`} style={{overflow:'visible',display:'block',userSelect:'none'}}>
            {[60,70,80,90,100].map(v=>(<g key={v}><line x1={PL} y1={toY(v)} x2={VW-PR} y2={toY(v)} stroke="rgba(255,255,255,0.045)" strokeWidth="1"/><text x={PL-5} y={toY(v)+4} textAnchor="end" fill={T.faint} style={{fontSize:9,fontFamily:T.mono}}>{v}%</text></g>))}
            {xL.map((l,i)=>{const x=PL+(i/(xL.length-1))*CW;return<text key={i} x={x} y={VH-3} textAnchor="middle" fill={T.faint} style={{fontSize:9,fontFamily:T.mono}}>{l}</text>;})}
            <path d={area(pts)} fill={`${cfg.color}18`}/>
            <polyline points={poly(pts)} fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            {pts.map((p,i)=>(<g key={i} onMouseEnter={()=>setHov({i,v:cData[i]})} onMouseLeave={()=>setHov(null)} style={{cursor:'crosshair'}}><circle cx={p.x} cy={p.y} r={14} fill="transparent"/><circle cx={p.x} cy={p.y} r={hov?.i===i?5:3} fill={cfg.color} opacity={hov?.i===i?1:0.6}/>{hov?.i===i&&<g><rect x={p.x-22} y={p.y-28} width={44} height={20} rx={4} fill={T.surface} stroke={cfg.color} strokeWidth="0.5"/><text x={p.x} y={p.y-13} textAnchor="middle" fill={cfg.color} style={{fontSize:10,fontFamily:T.mono,fontWeight:'700'}}>{cData[i]}%</text></g>}</g>))}
          </svg>
        </div>
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:'14px 16px',display:'flex',flexDirection:'column'}}>
          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}><span style={{width:7,height:7,borderRadius:'50%',background:T.green,display:'inline-block'}}/><span style={{fontSize:12,fontWeight:500,color:T.text}}>Live scan feed</span>{newCount>0&&<span style={{marginLeft:'auto',fontSize:10,fontFamily:T.mono,color:T.purpleL,background:'rgba(124,58,237,0.18)',border:'1px solid rgba(124,58,237,0.35)',borderRadius:4,padding:'1px 7px'}}>+{newCount}</span>}</div>
          <div style={{flex:1,overflow:'hidden'}}>
            {feed.slice(0,9).map((ev,i)=>(<div key={i} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'6px 0',borderBottom:`1px solid ${T.border}`,opacity:Math.max(0.3,1-i*0.08)}}><span style={{width:6,height:6,borderRadius:'50%',background:SDOT[ev.type],flexShrink:0,display:'inline-block',marginTop:4}}/><div style={{flex:1,minWidth:0}}><div style={{fontSize:11,color:T.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ev.msg}</div><div style={{display:'flex',gap:5,marginTop:2,alignItems:'center'}}><span style={{fontSize:9,fontFamily:T.mono,color:T.faint}}>{ev.ts}</span><span style={{fontSize:9,fontWeight:600,color:FWC[ev.fw]||T.muted}}>{ev.fw}</span></div></div></div>))}
          </div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
        {['iso','soc2','rbi','certin','dpdp'].map(key=>{const f=FW.find(x=>x.key===key),fd=FD[key],on=fw===key;return(<div key={key} onClick={()=>setFw(key)} style={{background:on?T.cardHi:T.card,borderRadius:10,padding:'14px 16px',cursor:'pointer',border:`1px solid ${on?f.border:T.border}`,transition:'all 0.18s ease'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}><div style={{width:7,height:7,borderRadius:2,background:f.color}}/><span style={{fontFamily:T.mono,fontSize:16,fontWeight:600,color:f.color}}>{fd.pct}%</span></div><div style={{fontSize:12,fontWeight:500,color:T.text,marginBottom:9}}>{f.label}</div><div style={{height:3,background:'rgba(255,255,255,0.08)',borderRadius:2,marginBottom:7,overflow:'hidden'}}><div style={{height:'100%',width:`${fd.pct}%`,background:f.color,borderRadius:2}}/></div><div style={{fontSize:10,color:T.muted,fontFamily:T.mono}}>{fd.pass}/{fd.total} · {fd.issues} issues</div></div>);})}
      </div>
    </div>
  );
}
