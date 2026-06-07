import { useState, useEffect, useRef } from 'react';

/* ─── Brand tokens ───────────────────────────────────────────────────────── */
const C = {
  bg:      '#09090F',
  bg2:     '#0E0E18',
  card:    '#13131C',
  cardHi:  '#181824',
  border:  'rgba(255,255,255,0.08)',
  borderHi:'rgba(255,255,255,0.14)',
  purple:  '#7c3aed',
  purpleL: '#a78bfa',
  pink:    '#d946ef',
  pinkL:   '#f472b6',
  green:   '#10B981',
  text:    '#FFFFFF',
  muted:   '#9CA3AF',
  faint:   '#4B5563',
  mono:    "'JetBrains Mono','Fira Code',ui-monospace,monospace",
  syne:    "'Syne',sans-serif",
  body:    "'DM Sans',system-ui,sans-serif",
};

/* ─── Data ────────────────────────────────────────────────────────────────── */
const INTEGRATIONS = [
  {n:'AWS',       i:'☁️'},  {n:'GCP',        i:'🌐'}, {n:'Azure',      i:'💎'},
  {n:'GitHub',    i:'🐙'},  {n:'GitLab',     i:'🦊'}, {n:'Jira',       i:'📋'},
  {n:'Slack',     i:'💬'},  {n:'Okta',       i:'🔐'}, {n:'Crowdstrike',i:'⚔️'},
  {n:'Qualys',    i:'🔍'},  {n:'Tenable',    i:'🛡️'}, {n:'Splunk',     i:'📊'},
  {n:'Datadog',   i:'🐶'},  {n:'PagerDuty',  i:'🔔'},
];

const FRAMEWORKS = [
  {name:'ISO 27001',      sub:'Information Security Management', color:'#a78bfa', border:'rgba(167,139,250,0.35)'},
  {name:'SOC 2 Type II',  sub:'Trust Service Criteria',          color:'#34D399', border:'rgba(52,211,153,0.35)'},
  {name:'RBI Cybersecurity',sub:'Reserve Bank Guidelines',       color:'#60A5FA', border:'rgba(96,165,250,0.35)'},
  {name:'CERT-In',        sub:'National Cert Framework',         color:'#FBBF24', border:'rgba(251,191,36,0.35)'},
  {name:'DPDP Act 2023',  sub:'Digital Personal Data Protection',color:'#F472B6', border:'rgba(244,114,182,0.35)'},
];

const FEATURES = [
  {icon:'⚡', title:'AI-powered evidence collection', color:'#a78bfa',
   desc:'Auto-collect evidence from 14+ integrations. AURA AI maps controls to evidence automatically, saving your team 90% of manual work.'},
  {icon:'🇮🇳', title:'India-native frameworks', color:'#60A5FA',
   desc:'First-class support for RBI Cybersecurity Framework, CERT-In guidelines, and the new DPDP Act 2023 with real-time regulatory updates.'},
  {icon:'🤖', title:'Remediation copilot', color:'#34D399',
   desc:"AURA's AI assistant writes remediation playbooks, generates security policies, and fixes control gaps with one click."},
];

const STEPS = [
  {n:'01', title:'Connect integrations', desc:'Link your cloud, code, and security tools. AURA auto-discovers your infrastructure.'},
  {n:'02', title:'AI maps controls', desc:'Our AI automatically maps evidence to framework controls across all selected standards.'},
  {n:'03', title:'Fix gaps with copilot', desc:"AURA's remediation AI writes policies and fixes controls with guided workflows."},
  {n:'04', title:'Share trust center', desc:'Publish your live compliance status to a branded trust center for customers and auditors.'},
];

const STATS = [
  {val:'500+', label:'Controls automated'},
  {val:'14',   label:'Integrations live'},
  {val:'92%',  label:'Audit time saved'},
  {val:'48h',  label:'Avg. cert turnaround'},
];

const SCORES = [
  {name:'ISO',     val:95, color:'#a78bfa'},
  {name:'SOC',     val:72, color:'#34D399'},
  {name:'RBI',     val:95, color:'#60A5FA'},
  {name:'CERT-In', val:81, color:'#FBBF24'},
  {name:'DPDP',    val:86, color:'#F472B6'},
];

const TRUST = ['Razorpay','PhonePe','Groww','Zepto','BharatPe','Navi','Slice','Fi Money'];

/* ─── AURA Mascot ────────────────────────────────────────────────────────── */
function AuraMascot({size=260}) {
  return (
    <svg width={size} height={size*1.08} viewBox="0 0 260 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="mg1" cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#9B5DE5"/>
          <stop offset="55%" stopColor="#7c3aed"/>
          <stop offset="100%" stopColor="#5b21b6"/>
        </radialGradient>
        <radialGradient id="mg2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="mg3" cx="50%" cy="65%" r="50%">
          <stop offset="0%" stopColor="#d946ef" stopOpacity="0.55"/>
          <stop offset="100%" stopColor="#d946ef" stopOpacity="0"/>
        </radialGradient>
      </defs>
      {/* Outer glow ring */}
      <ellipse cx="130" cy="140" rx="122" ry="130" fill="url(#mg2)"/>
      {/* Pink bottom glow */}
      <ellipse cx="130" cy="220" rx="85" ry="55" fill="url(#mg3)"/>
      {/* Main body */}
      <ellipse cx="130" cy="142" rx="93" ry="105" fill="url(#mg1)"/>
      {/* Left eye */}
      <circle cx="92" cy="114" r="21" fill="white" opacity="0.95"/>
      <circle cx="92" cy="114" r="11" fill="#1a0932"/>
      <circle cx="86" cy="108" r="4" fill="white" opacity="0.65"/>
      {/* Right eye */}
      <circle cx="168" cy="114" r="21" fill="white" opacity="0.95"/>
      <circle cx="168" cy="114" r="11" fill="#1a0932"/>
      <circle cx="162" cy="108" r="4" fill="white" opacity="0.65"/>
      {/* AU badge */}
      <rect x="107" y="155" width="46" height="26" rx="7" fill="rgba(255,255,255,0.16)"/>
      <text x="130" y="173" textAnchor="middle" fill="white" fontSize="12" fontWeight="700" fontFamily="monospace">AU</text>
      {/* Stars */}
      <circle cx="28"  cy="46"  r="2.5" fill="rgba(255,255,255,0.45)"/>
      <circle cx="225" cy="38"  r="2"   fill="rgba(255,255,255,0.38)"/>
      <circle cx="242" cy="118" r="3"   fill="rgba(255,255,255,0.3)"/>
      <circle cx="16"  cy="158" r="2"   fill="rgba(255,255,255,0.38)"/>
      <circle cx="48"  cy="245" r="2.5" fill="rgba(255,255,255,0.28)"/>
      <circle cx="212" cy="238" r="2"   fill="rgba(255,255,255,0.32)"/>
      <circle cx="240" cy="195" r="1.5" fill="rgba(255,255,255,0.25)"/>
    </svg>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function LandingPage({onGetStarted, onSignIn, onEnter}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', fn, {passive:true});
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const handleCTA = (cb) => {
    const fn = cb || onEnter;
    if (fn) fn();
  };

  const S = {
    page:    {background:C.bg, color:C.text, fontFamily:C.body, minHeight:'100vh', overflowX:'hidden'},
    maxW:    {maxWidth:1160, margin:'0 auto', padding:'0 24px'},
    section: {padding:'96px 0'},
  };

  return (
    <div style={S.page}>
      <style>{`
        @keyframes lp-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes lp-pulse { 0%,100%{opacity:1}50%{opacity:.4} }
        @keyframes lp-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .lp-float { animation: lp-float 5s ease-in-out infinite; }
        .lp-pill:hover { opacity:.85; cursor:pointer; }
        .lp-int:hover { border-color:rgba(255,255,255,0.22) !important; transform:translateY(-2px); }
        .lp-fw:hover { border-color:var(--hc) !important; transform:translateY(-2px); }
        .lp-nav-link { color:${C.muted}; font-size:14px; cursor:pointer; text-decoration:none; transition:color .15s; }
        .lp-nav-link:hover { color:${C.text}; }
        * { box-sizing:border-box; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        background: scrolled ? 'rgba(9,9,15,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
        transition: 'all .25s ease',
        padding:'0 24px',
      }}>
        <div style={{...S.maxW, display:'flex', alignItems:'center', height:64, gap:32}}>
          <div style={{display:'flex', alignItems:'center', gap:10, flexShrink:0}}>
            <div style={{width:32, height:32, borderRadius:8, background:C.purple, display:'flex', alignItems:'center', justifyContent:'center'}}>
              <span style={{fontFamily:C.syne, fontSize:16, fontWeight:800, color:'white'}}>A</span>
            </div>
            <span style={{fontFamily:C.syne, fontSize:18, fontWeight:800, color:C.text, letterSpacing:'-.4px'}}>AURA</span>
          </div>
          <div style={{display:'flex', gap:28, marginLeft:16}}>
            {['Product','Frameworks','Pricing','Docs'].map(l => (
              <a key={l} className="lp-nav-link">{l}</a>
            ))}
          </div>
          <div style={{display:'flex', gap:10, marginLeft:'auto', alignItems:'center'}}>
            <button className="lp-pill" onClick={() => handleCTA(onSignIn)} style={{
              background:'transparent', border:`1px solid ${C.border}`, borderRadius:100,
              padding:'7px 18px', fontSize:14, color:C.text, cursor:'pointer', fontFamily:C.body,
              transition:'all .15s',
            }}>Sign in</button>
            <button className="lp-pill" onClick={() => handleCTA(onGetStarted)} style={{
              background:C.purple, border:'none', borderRadius:100,
              padding:'7px 18px', fontSize:14, color:'white', cursor:'pointer', fontWeight:500,
              fontFamily:C.body, transition:'all .15s',
            }}>Get started</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight:'100vh', display:'flex', alignItems:'center',
        paddingTop:80, position:'relative', overflow:'hidden',
      }}>
        {/* Background glows */}
        <div style={{position:'absolute', top:'10%', left:'15%', width:480, height:480,
          borderRadius:'50%', background:'rgba(124,58,237,0.12)', filter:'blur(80px)', pointerEvents:'none'}}/>
        <div style={{position:'absolute', bottom:'5%', right:'10%', width:320, height:320,
          borderRadius:'50%', background:'rgba(217,70,239,0.08)', filter:'blur(60px)', pointerEvents:'none'}}/>

        <div style={{...S.maxW, display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'center', width:'100%'}}>
          {/* Left */}
          <div>
            {/* Badge */}
            <div style={{
              display:'inline-flex', alignItems:'center', gap:6,
              background:'rgba(124,58,237,0.15)', border:`1px solid rgba(124,58,237,0.35)`,
              borderRadius:100, padding:'6px 14px', marginBottom:28,
            }}>
              <div style={{width:6, height:6, borderRadius:'50%', background:C.green,
                animation:'lp-pulse 2s infinite', flexShrink:0}}/>
              <span style={{fontSize:13, color:'#c4b5fd', fontFamily:C.body}}>
                Now live: DPDP Act 2023 compliance automation
              </span>
            </div>

            {/* Headline */}
            <h1 style={{fontFamily:C.syne, fontSize:'clamp(52px,5vw,80px)', fontWeight:800,
              margin:'0 0 4px', lineHeight:1.05, letterSpacing:'-2px', color:C.text}}>
              Compliance,
            </h1>
            <h1 style={{fontFamily:C.syne, fontSize:'clamp(52px,5vw,80px)', fontWeight:800,
              margin:'0 0 28px', lineHeight:1.05, letterSpacing:'-2px',
              background:`linear-gradient(135deg, ${C.pink}, ${C.purple})`,
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
            }}>
              automated.
            </h1>

            <p style={{fontSize:18, color:C.muted, lineHeight:1.65, margin:'0 0 36px', maxWidth:480}}>
              India's first AI-native GRC platform. Achieve ISO 27001, SOC 2 Type II, RBI Cybersecurity,
              CERT-In and DPDP Act 2023 compliance — in weeks, not months.
            </p>

            {/* CTAs */}
            <div style={{display:'flex', gap:12, marginBottom:24, flexWrap:'wrap'}}>
              <button className="lp-pill" onClick={() => handleCTA(onGetStarted)} style={{
                background:C.purple, border:'none', borderRadius:10,
                padding:'13px 28px', fontSize:15, color:'white', cursor:'pointer',
                fontWeight:600, fontFamily:C.body, letterSpacing:'-.2px',
              }}>Start free trial →</button>
              <button className="lp-pill" style={{
                background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border}`, borderRadius:10,
                padding:'13px 28px', fontSize:15, color:C.text, cursor:'pointer',
                fontFamily:C.body,
              }}>▶ Watch demo</button>
            </div>

            {/* Checkmarks */}
            <div style={{display:'flex', gap:20, flexWrap:'wrap'}}>
              {['SOC 2 certified','DPDP compliant','ISO 27001 ready'].map(t => (
                <div key={t} style={{display:'flex', alignItems:'center', gap:6}}>
                  <span style={{color:C.green, fontSize:14, fontWeight:600}}>✓</span>
                  <span style={{fontSize:13, color:C.muted}}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — mascot + score widget */}
          <div style={{position:'relative', display:'flex', justifyContent:'center', alignItems:'center'}}>
            <div className="lp-float" style={{position:'relative'}}>
              <AuraMascot size={280}/>
              {/* Compliance score widget */}
              <div style={{
                position:'absolute', bottom:-16, right:-24,
                background:'rgba(18,18,28,0.96)', backdropFilter:'blur(12px)',
                border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 14px', width:210,
              }}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
                  <span style={{fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:'.6px', fontFamily:C.mono}}>
                    Compliance Score
                  </span>
                  <span style={{fontSize:9, color:C.green, fontFamily:C.mono}}>+3.2% this week</span>
                </div>
                {SCORES.map(s => (
                  <div key={s.name} style={{display:'flex', alignItems:'center', gap:6, marginBottom:5}}>
                    <span style={{fontSize:9, color:C.muted, width:40, fontFamily:C.mono}}>{s.name}</span>
                    <div style={{flex:1, height:3, background:'rgba(255,255,255,0.08)', borderRadius:2}}>
                      <div style={{height:'100%', width:`${s.val}%`, background:s.color, borderRadius:2}}/>
                    </div>
                    <span style={{fontSize:9, color:s.color, fontFamily:C.mono, width:28, textAlign:'right'}}>{s.val}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <div style={{background:C.bg2, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, padding:'18px 0', overflow:'hidden'}}>
        <div style={{...S.maxW, display:'flex', alignItems:'center', gap:24}}>
          <span style={{fontSize:11, color:C.faint, textTransform:'uppercase', letterSpacing:'1px', fontWeight:500, flexShrink:0}}>
            Trusted by India's leading fintechs
          </span>
          <div style={{flex:1, overflow:'hidden', position:'relative'}}>
            <div className="lp-scroll" style={{display:'flex', gap:32, width:'max-content', animation:'lp-scroll 20s linear infinite'}}>
              {[...TRUST,...TRUST].map((t,i) => (
                <span key={i} style={{fontSize:14, color:C.faint, fontWeight:500, whiteSpace:'nowrap'}}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── BUILT FOR INDIA ── */}
      <section style={{...S.section, background:C.bg}}>
        <div style={S.maxW}>
          <div style={{textAlign:'center', marginBottom:56}}>
            <h2 style={{fontFamily:C.syne, fontSize:'clamp(36px,4vw,56px)', fontWeight:800, margin:'0 0 16px', letterSpacing:'-1.5px', lineHeight:1.1}}>
              Built for India.{' '}
              <span style={{background:`linear-gradient(135deg,${C.purpleL},${C.pink})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
                Certified globally.
              </span>
            </h2>
            <p style={{fontSize:18, color:C.muted, maxWidth:560, margin:'0 auto'}}>
              The only GRC platform purpose-built for RBI, CERT-In and DPDP alongside international standards.
            </p>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20}}>
            {FEATURES.map(f => (
              <div key={f.title} style={{
                background:C.card, border:`1px solid ${C.border}`, borderRadius:14,
                padding:'28px 24px', transition:'border-color .2s',
              }}>
                <div style={{fontSize:28, marginBottom:14}}>{f.icon}</div>
                <h3 style={{fontFamily:C.syne, fontSize:18, fontWeight:700, color:f.color, margin:'0 0 12px', lineHeight:1.3}}>
                  {f.title}
                </h3>
                <p style={{fontSize:14, color:C.muted, lineHeight:1.7, margin:0}}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ── */}
      <section style={{...S.section, background:C.bg2}}>
        <div style={S.maxW}>
          <div style={{textAlign:'center', marginBottom:48}}>
            <h2 style={{fontFamily:C.syne, fontSize:'clamp(32px,3.5vw,52px)', fontWeight:800, margin:'0 0 12px', letterSpacing:'-1.5px'}}>
              14 integrations. One command center.
            </h2>
            <p style={{fontSize:17, color:C.muted}}>Connect your entire security stack in minutes.</p>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:12}}>
            {INTEGRATIONS.map(ig => (
              <div key={ig.n} className="lp-int" style={{
                background:C.card, border:`1px solid ${C.border}`, borderRadius:12,
                padding:'18px 8px', textAlign:'center', cursor:'pointer',
                transition:'all .2s ease',
              }}>
                <div style={{fontSize:28, marginBottom:8}}>{ig.i}</div>
                <div style={{fontSize:12, color:C.muted, fontWeight:500}}>{ig.n}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FRAMEWORKS ── */}
      <section style={{...S.section, background:C.bg}}>
        <div style={S.maxW}>
          <h2 style={{fontFamily:C.syne, fontSize:'clamp(32px,3.5vw,52px)', fontWeight:800,
            textAlign:'center', marginBottom:48, letterSpacing:'-1.5px'}}>
            Every framework. One platform.
          </h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14}}>
            {FRAMEWORKS.map(fw => (
              <div key={fw.name} className="lp-fw" style={{
                '--hc': fw.border,
                background:C.card, border:`1px solid ${fw.border}`, borderRadius:14,
                padding:'22px 18px', cursor:'pointer', transition:'all .2s ease',
              }}>
                <div style={{width:10, height:10, borderRadius:3, background:fw.color, marginBottom:14}}/>
                <div style={{fontFamily:C.syne, fontSize:15, fontWeight:700, color:fw.color, marginBottom:6}}>{fw.name}</div>
                <div style={{fontSize:12, color:C.muted, lineHeight:1.5}}>{fw.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{...S.section, background:C.bg2}}>
        <div style={S.maxW}>
          <h2 style={{fontFamily:C.syne, fontSize:'clamp(30px,3vw,48px)', fontWeight:800,
            textAlign:'center', marginBottom:56, letterSpacing:'-1.5px'}}>
            From zero to certified in 4 steps
          </h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:0, position:'relative'}}>
            {/* connector line */}
            <div style={{position:'absolute', top:28, left:'12.5%', right:'12.5%', height:1, background:`linear-gradient(90deg,${C.purple},${C.pink})`, opacity:.25, zIndex:0}}/>
            {STEPS.map((st,i) => (
              <div key={st.n} style={{padding:'0 16px', position:'relative', zIndex:1}}>
                <div style={{
                  fontFamily:C.mono, fontSize:42, fontWeight:700, lineHeight:1,
                  color:'rgba(255,255,255,0.06)', marginBottom:16, letterSpacing:'-2px',
                }}>{st.n}</div>
                <h3 style={{fontFamily:C.syne, fontSize:17, fontWeight:700, margin:'0 0 10px', color:C.text}}>{st.title}</h3>
                <p style={{fontSize:13, color:C.muted, lineHeight:1.65, margin:0}}>{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section style={{background:C.card, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, padding:'64px 0'}}>
        <div style={{...S.maxW, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:0}}>
          {STATS.map((s,i) => (
            <div key={s.label} style={{
              textAlign:'center', padding:'0 24px',
              borderRight: i < 3 ? `1px solid ${C.border}` : 'none',
            }}>
              <div style={{
                fontFamily:C.syne, fontSize:'clamp(40px,4vw,64px)', fontWeight:800,
                background:`linear-gradient(135deg,${C.pinkL},${C.purpleL})`,
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
                marginBottom:8, letterSpacing:'-2px', lineHeight:1,
              }}>{s.val}</div>
              <div style={{fontSize:14, color:C.muted}}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{...S.section, background:C.bg, textAlign:'center'}}>
        <div style={S.maxW}>
          <h2 style={{fontFamily:C.syne, fontSize:'clamp(32px,4vw,60px)', fontWeight:800, margin:'0 0 8px', letterSpacing:'-2px', lineHeight:1.1}}>
            Ready to automate your
          </h2>
          <h2 style={{fontFamily:C.syne, fontSize:'clamp(32px,4vw,60px)', fontWeight:800, margin:'0 0 20px', letterSpacing:'-2px',
            background:`linear-gradient(135deg,${C.pinkL},${C.purpleL})`,
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
          }}>compliance program?</h2>
          <p style={{fontSize:16, color:C.muted, marginBottom:36}}>
            Join 120+ Indian fintechs and SaaS companies already on AURA.
          </p>
          <div style={{display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap'}}>
            <button className="lp-pill" onClick={() => handleCTA(onGetStarted)} style={{
              background:C.purple, border:'none', borderRadius:10,
              padding:'14px 32px', fontSize:16, color:'white', cursor:'pointer',
              fontWeight:600, fontFamily:C.body,
            }}>Start your free trial</button>
            <button className="lp-pill" style={{
              background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border}`, borderRadius:10,
              padding:'14px 32px', fontSize:16, color:C.text, cursor:'pointer', fontFamily:C.body,
            }}>Schedule a demo</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{background:C.bg2, borderTop:`1px solid ${C.border}`, padding:'28px 0'}}>
        <div style={{...S.maxW, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap'}}>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <div style={{width:28, height:28, borderRadius:7, background:C.purple, display:'flex', alignItems:'center', justifyContent:'center'}}>
              <span style={{fontFamily:C.syne, fontSize:14, fontWeight:800, color:'white'}}>A</span>
            </div>
            <span style={{fontFamily:C.syne, fontSize:16, fontWeight:700, color:C.text}}>AURA</span>
          </div>
          <span style={{fontSize:13, color:C.faint, marginLeft:8}}>
            © 2026 AURA GRC Pvt. Ltd. · auragrc.in · Made in India 🇮🇳
          </span>
          <div style={{marginLeft:'auto', display:'flex', gap:20}}>
            {['Privacy','Terms','Security'].map(l => (
              <a key={l} style={{fontSize:13, color:C.faint, cursor:'pointer', textDecoration:'none'}}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
