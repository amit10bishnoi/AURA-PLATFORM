import { useState, useEffect, useRef } from 'react';

const T = {
  bg:'#09090F', surface:'#0E0E18', card:'#13131C', cardHi:'#181824',
  border:'rgba(255,255,255,0.08)', borderHi:'rgba(255,255,255,0.13)',
  purple:'#7c3aed', purpleL:'#a78bfa', pink:'#db2777', pinkL:'#f472b6',
  text:'#FFFFFF', muted:'#9CA3AF', faint:'#374151',
  green:'#10B981', amber:'#F59E0B', red:'#EF4444',
  mono:"'JetBrains Mono','Fira Code',ui-monospace,monospace",
  syne:"'Syne',sans-serif", body:"'DM Sans',system-ui,sans-serif",
};

const FW_PILLS = [
  {key:'all',    label:'All frameworks', color:'#a78bfa', bg:'rgba(124,58,237,0.2)',  border:'rgba(167,139,250,0.5)'},
  {key:'iso',    label:'ISO 27001',      color:'#a78bfa', bg:'rgba(167,139,250,0.12)',border:'rgba(167,139,250,0.38)'},
  {key:'soc2',   label:'SOC 2',          color:'#34D399', bg:'rgba(52,211,153,0.12)', border:'rgba(52,211,153,0.38)'},
  {key:'rbi',    label:'RBI Cyber',      color:'#60A5FA', bg:'rgba(96,165,250,0.12)', border:'rgba(96,165,250,0.38)'},
  {key:'certin', label:'CERT-In',        color:'#FBBF24', bg:'rgba(251,191,36,0.12)', border:'rgba(251,191,36,0.38)'},
  {key:'dpdp',   label:'DPDP Act',       color:'#F472B6', bg:'rgba(244,114,182,0.12)',border:'rgba(244,114,182,0.38)'},
];

const FW_HEALTH = [
  {key:'iso',    name:'ISO 27001', pct:84, controls:'67/100', status:'Good',       color:'#a78bfa', statusColor:'#10B981'},
  {key:'soc2',   name:'SOC 2',     pct:91, controls:'72/100', status:'Good',       color:'#34D399', statusColor:'#10B981'},
  {key:'rbi',    name:'RBI Cyber', pct:73, controls:'58/100', status:'Fair',       color:'#60A5FA', statusColor:'#F59E0B'},
  {key:'certin', name:'CERT-In',   pct:68, controls:'54/100', status:'Fair',       color:'#FBBF24', statusColor:'#F59E0B'},
  {key:'dpdp',   name:'DPDP Act',  pct:56, controls:'44/100', status:'Needs work', color:'#F472B6', statusColor:'#EF4444'},
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep'];

// Chart series: each value = compliance % per month
const CHART_SERIES = {
  all: {
    iso:   [72,75,77,80,82,84,85,87,91],
    soc2:  [68,71,74,76,79,82,85,88,91],
    rbi:   [60,63,65,67,69,71,72,73,73],
  },
  iso:   { iso:[72,75,77,80,82,84,85,87,91] },
  soc2:  { soc2:[68,71,74,76,79,82,85,88,91] },
  rbi:   { rbi:[60,63,65,67,69,71,72,73,73] },
  certin:{ certin:[55,58,60,62,64,65,66,67,68] },
  dpdp:  { dpdp:[45,47,49,51,52,53,54,55,56] },
};

const SERIES_COLORS = {iso:'#a78bfa', soc2:'#34D399', rbi:'#60A5FA', certin:'#FBBF24', dpdp:'#F472B6'};
const SERIES_LABELS = {iso:'ISO 27001', soc2:'SOC 2', rbi:'RBI Cyber', certin:'CERT-In', dpdp:'DPDP Act'};

const STAT_DATA = {
  all:    {pct:'78%',  pctColor:'#a78bfa', change:'+2.1%', changeLbl:'across 5 frameworks', changeColor:'#10B981',
           pass:312,   passChange:'+18',    passLbl:'out of 401 total',
           risk:23,    riskChange:'-4',     riskLbl:'7 high severity',     riskChangeColor:'#10B981',
           evid:1847,  evidChange:'+142',   evidLbl:'this month'},
  iso:    {pct:'91%',  pctColor:'#a78bfa', change:'+1.8%', changeLbl:'from last week', changeColor:'#10B981',
           pass:164,   passChange:'+6',     passLbl:'of 180 controls',
           risk:8,     riskChange:'-2',     riskLbl:'1 critical',         riskChangeColor:'#10B981',
           evid:524,   evidChange:'+18',    evidLbl:'this month'},
  soc2:   {pct:'91%',  pctColor:'#34D399', change:'+3.2%', changeLbl:'from last week', changeColor:'#10B981',
           pass:51,    passChange:'+4',     passLbl:'of 60 controls',
           risk:5,     riskChange:'-1',     riskLbl:'2 high severity',    riskChangeColor:'#10B981',
           evid:312,   evidChange:'+22',    evidLbl:'this month'},
  rbi:    {pct:'73%',  pctColor:'#60A5FA', change:'+0.9%', changeLbl:'from last week', changeColor:'#10B981',
           pass:35,    passChange:'+2',     passLbl:'of 45 controls',
           risk:7,     riskChange:'+1',     riskLbl:'2 critical',         riskChangeColor:'#EF4444',
           evid:198,   evidChange:'+8',     evidLbl:'this month'},
  certin: {pct:'68%',  pctColor:'#FBBF24', change:'+1.1%', changeLbl:'from last week', changeColor:'#10B981',
           pass:37,    passChange:'+3',     passLbl:'of 50 controls',
           risk:9,     riskChange:'+2',     riskLbl:'3 critical',         riskChangeColor:'#EF4444',
           evid:145,   evidChange:'+6',     evidLbl:'this month'},
  dpdp:   {pct:'56%',  pctColor:'#F472B6', change:'+2.4%', changeLbl:'from last week', changeColor:'#10B981',
           pass:28,    passChange:'+5',     passLbl:'of 34 controls',
           risk:4,     riskChange:'0',      riskLbl:'0 critical',         riskChangeColor:'#9CA3AF',
           evid:87,    evidChange:'+14',    evidLbl:'this month'},
};

const LIVE_EVENTS_BASE = [
  {dot:'#F59E0B', msg:'New RBI control gap detected: CC-2.1',   fw:'RBI',      fwC:'#60A5FA', ts:'5m ago'},
  {dot:'#10B981', msg:'DPDP data mapping artifact uploaded',     fw:'DPDP',     fwC:'#F472B6', ts:'12m ago'},
  {dot:'#F59E0B', msg:'CERT-In penetration test scheduled',      fw:'CERT-In',  fwC:'#FBBF24', ts:'18m ago'},
  {dot:'#10B981', msg:'Okta MFA compliance check passed',        fw:'SOC 2',    fwC:'#34D399', ts:'24m ago'},
  {dot:'#10B981', msg:'Crowdstrike EDR policy synced',           fw:'ISO 27001',fwC:'#a78bfa', ts:'31m ago'},
  {dot:'#10B981', msg:'AWS IAM policy scan completed',           fw:'ISO 27001',fwC:'#a78bfa', ts:'just now'},
  {dot:'#10B981', msg:'SOC 2 evidence auto-collected from GitHub',fw:'SOC 2',   fwC:'#34D399', ts:'2m ago'},
];

const FRESH_EVENTS = [
  {dot:'#10B981', msg:'Cloudflare WAF rules verified',            fw:'ISO 27001',fwC:'#a78bfa'},
  {dot:'#F59E0B', msg:'DPDP consent log gap detected',            fw:'DPDP',     fwC:'#F472B6'},
  {dot:'#10B981', msg:'GitHub secrets rotation complete',         fw:'ISO 27001',fwC:'#a78bfa'},
  {dot:'#EF4444', msg:'CERT-In — 3 evidence items overdue',       fw:'CERT-In',  fwC:'#FBBF24'},
  {dot:'#10B981', msg:'Snyk vulnerability scan — clean',          fw:'SOC 2',    fwC:'#34D399'},
];

/* ─── Chart math ─────────────────────────────────────────────────────────── */
const VW=560, VH=110, PL=32, PR=10, PT=8, PB=22;
const CW=VW-PL-PR, CH=VH-PT-PB;
const toY = pct => PT + CH - ((Math.max(50,Math.min(100,pct))-50)/50)*CH;
const toPts = data => {
  const step = CW/Math.max(1,data.length-1);
  return data.map((v,i) => ({x:PL+i*step, y:toY(v)}));
};
const polyline = pts => pts.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

export default function DarkOverview({token, tenantId}) {
  const [fw, setFw] = useState('all');
  const [feed, setFeed] = useState(() =>
    LIVE_EVENTS_BASE.map((e,i) => ({...e, id:i}))
  );
  const [newCount, setNewCount] = useState(0);
  const tick = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      tick.current = (tick.current+1) % FRESH_EVENTS.length;
      const ev = FRESH_EVENTS[tick.current];
      setFeed(prev => [{...ev, id:Date.now(), ts:'just now'}, ...prev.slice(0,8)]);
      setNewCount(n => n+1);
    }, 3800);
    return () => clearInterval(id);
  }, []);

  const d = STAT_DATA[fw] || STAT_DATA.all;
  const series = CHART_SERIES[fw] || CHART_SERIES.all;
  const today = new Date().toLocaleDateString('en-IN', {weekday:'long', day:'numeric', month:'long', year:'numeric'});

  const card = (style) => ({
    background:T.card, border:`1px solid ${T.border}`,
    borderRadius:12, padding:'16px 18px', ...style,
  });

  return (
    <div style={{background:T.bg, minHeight:'100%', fontFamily:T.body, color:T.text, boxSizing:'border-box'}}>

      {/* ── Top bar ── */}
      <div style={{borderBottom:`1px solid ${T.border}`, padding:'10px 24px', display:'flex', alignItems:'center', gap:12}}>
        <div style={{flex:1, display:'flex', alignItems:'center', gap:8, background:T.surface, borderRadius:8, padding:'7px 12px', maxWidth:400}}>
          <svg width="14" height="14" fill="none" stroke={T.muted} strokeWidth="1.5" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <span style={{fontSize:13, color:T.muted}}>Search controls, evidence...</span>
        </div>
        <div style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:10}}>
          <div style={{width:34, height:34, borderRadius:8, background:T.surface, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}>
            <svg width="16" height="16" fill="none" stroke={T.muted} strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div style={{width:34, height:34, borderRadius:8, background:T.surface, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}>
            <svg width="16" height="16" fill="none" stroke={T.muted} strokeWidth="1.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
            </svg>
          </div>
        </div>
      </div>

      <div style={{padding:'24px 24px 32px'}}>
        {/* ── Page header ── */}
        <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20}}>
          <div>
            <h1 style={{fontFamily:T.syne, fontSize:26, fontWeight:800, margin:'0 0 5px', letterSpacing:'-.5px', color:T.text}}>
              Compliance command center
            </h1>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <span style={{fontSize:12, color:T.muted, fontFamily:T.mono}}>{today}</span>
              <span style={{width:5, height:5, borderRadius:'50%', background:T.green, display:'inline-block', animation:'ov-pulse 2s infinite'}}/>
              <span style={{fontSize:12, color:T.green}}>Live monitoring</span>
            </div>
          </div>
          <div style={{display:'flex', gap:8}}>
            <button style={{background:T.purple, border:'none', borderRadius:8, padding:'8px 18px', fontSize:13, color:'white', cursor:'pointer', fontWeight:500, display:'flex', alignItems:'center', gap:6, fontFamily:T.body}}>
              <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Run scan
            </button>
            <button style={{background:'transparent', border:`1px solid ${T.border}`, borderRadius:8, padding:'8px 18px', fontSize:13, color:T.text, cursor:'pointer', fontFamily:T.body}}>
              Export report
            </button>
          </div>
        </div>

        {/* ── Framework pills ── */}
        <div style={{display:'flex', gap:6, marginBottom:20, flexWrap:'wrap'}}>
          {FW_PILLS.map(p => {
            const on = fw===p.key;
            return (
              <button key={p.key} onClick={() => setFw(p.key)} style={{
                padding:'6px 16px', borderRadius:100, fontSize:12, fontWeight: on ? 500 : 400,
                cursor:'pointer', fontFamily:T.body, transition:'all .15s',
                border:`1px solid ${on ? p.border : T.border}`,
                background: on ? p.bg : 'transparent',
                color: on ? p.color : T.muted,
              }}>{p.label}</button>
            );
          })}
        </div>

        {/* ── Stat cards ── */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16}}>
          {[
            {label:'Overall compliance', val:d.pct,   valColor:d.pctColor,  change:d.change,       changeLbl:d.changeLbl,     changeColor:d.changeColor},
            {label:'Controls passing',   val:String(d.pass), valColor:T.green,  change:d.passChange,  changeLbl:d.passLbl,       changeColor:T.green},
            {label:'Open risk items',    val:String(d.risk), valColor:d.risk>10?T.amber:T.green, change:d.riskChange, changeLbl:d.riskLbl, changeColor:d.riskChangeColor},
            {label:'Evidence collected', val:d.evid.toLocaleString(), valColor:T.text, change:d.evidChange, changeLbl:d.evidLbl, changeColor:T.green},
          ].map((s,i) => (
            <div key={i} style={{...card({borderTop:`2px solid ${s.valColor}`})}}>
              <div style={{fontSize:10, color:T.muted, textTransform:'uppercase', letterSpacing:'.7px', marginBottom:6}}>{s.label}</div>
              <div style={{fontFamily:T.mono, fontSize:30, fontWeight:600, color:s.valColor, lineHeight:1, marginBottom:6}}>{s.val}</div>
              <div style={{display:'flex', alignItems:'center', gap:5}}>
                <span style={{fontSize:11, color:s.changeColor, fontWeight:500}}>{s.change}</span>
                <span style={{fontSize:11, color:T.muted}}>{s.changeLbl}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Chart + Feed ── */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 280px', gap:12, marginBottom:16}}>

          {/* Chart */}
          <div style={card({})}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12}}>
              <div>
                <div style={{fontSize:13, fontWeight:500, color:T.text, marginBottom:2}}>Compliance trend</div>
                <div style={{fontSize:11, color:T.muted, fontFamily:T.mono}}>% over time</div>
              </div>
              <div style={{display:'flex', gap:8}}>
                {Object.entries(series).map(([k]) => (
                  <div key={k} style={{display:'flex', alignItems:'center', gap:4}}>
                    <div style={{width:20, height:2, background:SERIES_COLORS[k], borderRadius:1}}/>
                    <span style={{fontSize:10, color:T.muted}}>{SERIES_LABELS[k]}</span>
                  </div>
                ))}
              </div>
            </div>
            <svg width="100%" viewBox={`0 0 ${VW} ${VH}`} style={{overflow:'visible', display:'block', userSelect:'none'}}>
              {/* Grid */}
              {[60,70,80,90,100].map(v => (
                <g key={v}>
                  <line x1={PL} y1={toY(v)} x2={VW-PR} y2={toY(v)} stroke="rgba(255,255,255,0.045)" strokeWidth=".5"/>
                  <text x={PL-4} y={toY(v)+4} textAnchor="end" fill={T.faint} style={{fontSize:9,fontFamily:T.mono}}>{v}%</text>
                </g>
              ))}
              {/* X labels */}
              {MONTHS.map((m,i) => {
                const x = PL + (i/(MONTHS.length-1))*CW;
                return <text key={m} x={x} y={VH-3} textAnchor="middle" fill={T.faint} style={{fontSize:9,fontFamily:T.mono}}>{m}</text>;
              })}
              {/* Lines */}
              {Object.entries(series).map(([k, data]) => {
                const pts = toPts(data);
                const lastPt = pts[pts.length-1];
                return (
                  <g key={k}>
                    <polyline points={polyline(pts)} fill="none" stroke={SERIES_COLORS[k]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx={lastPt.x} cy={lastPt.y} r={4} fill={SERIES_COLORS[k]}/>
                    <circle cx={lastPt.x} cy={lastPt.y} r={7} fill={SERIES_COLORS[k]} opacity=".2"/>
                    <text x={lastPt.x-10} y={lastPt.y-10} fill={SERIES_COLORS[k]} style={{fontSize:9,fontFamily:T.mono,fontWeight:'700'}}>
                      {data[data.length-1]}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Live feed */}
          <div style={card({display:'flex', flexDirection:'column'})}>
            <div style={{display:'flex', alignItems:'center', gap:7, marginBottom:12, flexShrink:0}}>
              <span style={{width:7, height:7, borderRadius:'50%', background:T.green, display:'inline-block', animation:'ov-pulse 2s infinite'}}/>
              <span style={{fontSize:12, fontWeight:500, color:T.text}}>Live activity</span>
              {newCount > 0 && (
                <span style={{marginLeft:'auto', fontSize:10, fontFamily:T.mono, color:T.purpleL,
                  background:'rgba(124,58,237,0.18)', border:'1px solid rgba(124,58,237,0.35)', borderRadius:4, padding:'1px 7px'}}>
                  +{newCount}
                </span>
              )}
            </div>
            <div style={{flex:1, overflow:'hidden', display:'flex', flexDirection:'column'}}>
              {feed.slice(0,7).map((ev,i) => (
                <div key={ev.id} style={{
                  display:'flex', alignItems:'flex-start', gap:7, padding:'6px 0',
                  borderBottom:`1px solid ${T.border}`,
                  animation: i===0 ? 'ov-slide .35s ease-out' : 'none',
                  opacity: Math.max(0.35, 1-i*0.1),
                }}>
                  <span style={{width:6, height:6, borderRadius:'50%', background:ev.dot, flexShrink:0, display:'inline-block', marginTop:4}}/>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:11, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.35}}>{ev.msg}</div>
                    <div style={{display:'flex', gap:5, marginTop:2, alignItems:'center'}}>
                      <span style={{fontSize:9, fontFamily:T.mono, color:T.faint}}>{ev.ts}</span>
                      <span style={{fontSize:9, fontWeight:600, color:ev.fwC,
                        background:`${ev.fwC}1E`, padding:'1px 5px', borderRadius:3}}>{ev.fw}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Framework health ── */}
        <div style={{marginBottom:6}}>
          <div style={{fontSize:14, fontWeight:500, color:T.text, marginBottom:12}}>Framework health</div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10}}>
            {FW_HEALTH.map(f => {
              const on = fw===f.key;
              return (
                <div key={f.key} onClick={() => setFw(f.key)} style={{
                  ...card({cursor:'pointer', transition:'all .18s', borderColor: on ? f.color+'55' : T.border,
                    background: on ? T.cardHi : T.card}),
                }}>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8}}>
                    <div style={{width:8, height:8, borderRadius:2, background:f.color}}/>
                    <span style={{fontFamily:T.mono, fontSize:18, fontWeight:600, color:f.color}}>{f.pct}%</span>
                  </div>
                  <div style={{fontSize:12, fontWeight:500, color:T.text, marginBottom:8, lineHeight:1.3}}>{f.name}</div>
                  <div style={{height:3, background:'rgba(255,255,255,0.08)', borderRadius:2, marginBottom:7, overflow:'hidden'}}>
                    <div style={{height:'100%', width:`${f.pct}%`, background:f.color, borderRadius:2}}/>
                  </div>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                    <span style={{fontSize:10, color:T.muted, fontFamily:T.mono}}>Controls: {f.controls}</span>
                    <span style={{fontSize:10, fontWeight:500, color:f.statusColor}}>{f.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ov-pulse { 0%,100%{opacity:1}50%{opacity:.25} }
        @keyframes ov-slide { from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
