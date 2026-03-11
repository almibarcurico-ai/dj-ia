import { useState, useEffect, useRef, useCallback } from "react";

const LIBRARY_INIT = [
  { id:1,  youtubeId:'ktvTqknDobU', title:'Despacito',           artist:'Luis Fonsi ft. Daddy Yankee', genre:'Reggaeton',       bpm:89,  energy:7 },
  { id:2,  youtubeId:'JGwWNGJdvx8', title:'Shape of You',        artist:'Ed Sheeran',                  genre:'Pop',             bpm:96,  energy:7 },
  { id:3,  youtubeId:'OPf0YbXqDm0', title:'Uptown Funk',         artist:'Mark Ronson ft. Bruno Mars',  genre:'Funk/Pop',        bpm:115, energy:9 },
  { id:4,  youtubeId:'YqeW9_5kURI', title:'Lean On',             artist:'Major Lazer',                 genre:'Electronic',      bpm:98,  energy:8 },
  { id:5,  youtubeId:'DyDfgMOUjCI', title:'Bad Guy',             artist:'Billie Eilish',               genre:'Pop',             bpm:135, energy:6 },
  { id:6,  youtubeId:'selWsrHPXaw', title:'Taki Taki',           artist:'DJ Snake ft. Selena Gomez',   genre:'Latin Trap',      bpm:98,  energy:8 },
  { id:7,  youtubeId:'EgBJmlPo8Xw', title:'Danza Kuduro',        artist:'Don Omar ft. Lucenzo',        genre:'Reggaeton',       bpm:130, energy:10},
  { id:8,  youtubeId:'uelHwf8o7_U', title:'Bailando',            artist:'Enrique Iglesias',            genre:'Latin Pop',       bpm:117, energy:8 },
  { id:9,  youtubeId:'pRpeEdMmmQ0', title:"Hips Don't Lie",      artist:'Shakira',                     genre:'Latin Pop',       bpm:100, energy:8 },
  { id:10, youtubeId:'GI6CfKcMhjY', title:'Titanium',            artist:'David Guetta ft. Sia',        genre:'Progressive House',bpm:126, energy:8},
  { id:11, youtubeId:'HCjNJDNzw8Y', title:"Don't You Worry Child",artist:'Swedish House Mafia',        genre:'Progressive House',bpm:128, energy:9},
  { id:12, youtubeId:'0sFBLAJpFTs', title:'Mi Gente',            artist:'J Balvin & Willy William',    genre:'Reggaeton',       bpm:105, energy:9 },
  { id:13, youtubeId:'3tmd-ClpJxA', title:'Gasolina',            artist:'Daddy Yankee',                genre:'Reggaeton',       bpm:96,  energy:10},
  { id:14, youtubeId:'lp-EO5I60KA', title:'Con Calma',           artist:'Daddy Yankee ft. Snow',       genre:'Reggaeton',       bpm:94,  energy:8 },
  { id:15, youtubeId:'yITCd6x3GqM', title:'Pepas',               artist:'Farruko',                     genre:'Reggaeton',       bpm:97,  energy:9 },
];

function EnergyBar({ energy }) {
  return (
    <div style={{ display:'flex', gap:'2px', alignItems:'flex-end' }}>
      {Array.from({length:10}).map((_,i) => (
        <div key={i} style={{
          width:'5px', height:`${5+i*1.5}px`,
          background: i < energy ? (i<4?'#00ff88':i<7?'#ffee00':'#ff4455') : '#1e1e2e',
          borderRadius:'1px', transition:'background 0.3s'
        }}/>
      ))}
    </div>
  );
}

function VUMeter({ active }) {
  const [bars, setBars] = useState(Array(14).fill(2));
  useEffect(() => {
    if (!active) { setBars(Array(14).fill(2)); return; }
    const id = setInterval(() => {
      setBars(Array(14).fill(0).map((_,i) => {
        const base = Math.max(0, 14 - i);
        return 2 + Math.random() * base * 0.9;
      }));
    }, 90);
    return () => clearInterval(id);
  }, [active]);
  return (
    <div style={{ display:'flex', gap:'2px', alignItems:'flex-end', height:'52px' }}>
      {bars.map((h,i) => (
        <div key={i} style={{
          width:'7px', height:`${h*3}px`,
          background: i<7?'#00ff88':i<11?'#ffee00':'#ff4455',
          borderRadius:'1px 1px 0 0', transition:'height 0.09s ease-out'
        }}/>
      ))}
    </div>
  );
}

function Waveform({ active, color='#00ffcc' }) {
  const [pts, setPts] = useState(Array(32).fill(4));
  useEffect(() => {
    if (!active) { setPts(Array(32).fill(4)); return; }
    const id = setInterval(() => {
      setPts(Array(32).fill(0).map(() => 4 + Math.random()*28));
    }, 120);
    return () => clearInterval(id);
  }, [active]);
  const h = 40;
  return (
    <svg width="100%" height={h} style={{ display:'block' }}>
      {pts.map((v,i) => {
        const x = (i / (pts.length-1)) * 100;
        return (
          <rect key={i}
            x={`${x}%`} y={(h-v)/2} width="2" height={v}
            fill={color} opacity="0.7" rx="1"
            style={{ transition:'height 0.12s, y 0.12s' }}
          />
        );
      })}
    </svg>
  );
}

export default function DJIA() {
  const [library, setLibrary]   = useState(LIBRARY_INIT);
  const [deckA, setDeckA]       = useState({ track:null, isPlaying:false, volume:100 });
  const [deckB, setDeckB]       = useState({ track:null, isPlaying:false, volume:0 });
  const [crossfader, setCF]     = useState(0);
  const [queue, setQueue]       = useState([]);
  const [messages, setMessages] = useState([{
    role:'dj',
    content:'🎧 DJ_IA online. Soy tu DJ inteligente. Cuéntame: ¿qué evento es esta noche, cuántas personas, qué edades tienen y qué géneros quieres para cada hora del set?'
  }]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [ytReady, setYtReady]   = useState(false);
  const [tab, setTab]           = useState('mixer');
  const [autoMix, setAutoMix]   = useState(false);
  const [activeDeck, setActive] = useState('A');
  const [addUrl, setAddUrl]     = useState('');
  const [addMeta, setAddMeta]   = useState({ title:'', artist:'', genre:'', bpm:120, energy:7 });
  const [fading, setFading]     = useState(false);

  const pA = useRef(null);
  const pB = useRef(null);
  const fadeRef = useRef(null);
  const convRef = useRef([]);
  const chatEnd = useRef(null);
  const autoRef = useRef(false);
  autoRef.current = autoMix;

  // ─── YouTube ───────────────────────────────────────────────────
  const initPlayers = useCallback(() => {
    if (pA.current?.loadVideoById) return;
    pA.current = new window.YT.Player('yt-a', {
      height:'100%', width:'100%', videoId:'',
      playerVars:{ autoplay:0, controls:1, rel:0, modestbranding:1, enablejsapi:1 },
      events:{
        onReady: () => setYtReady(true),
        onStateChange: (e) => onState(e,'A')
      }
    });
    pB.current = new window.YT.Player('yt-b', {
      height:'100%', width:'100%', videoId:'',
      playerVars:{ autoplay:0, controls:1, rel:0, modestbranding:1, enablejsapi:1 },
      events:{ onStateChange: (e) => onState(e,'B') }
    });
  }, []);

  useEffect(() => {
    window.onYouTubeIframeAPIReady = initPlayers;
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
    if (window.YT?.Player) initPlayers();
  }, [initPlayers]);

  const onState = useCallback((event, deck) => {
    if (event.data === 1) (deck==='A'?setDeckA:setDeckB)(d=>({...d,isPlaying:true}));
    if (event.data === 2) (deck==='A'?setDeckA:setDeckB)(d=>({...d,isPlaying:false}));
    if (event.data === 0 && autoRef.current) handleTrackEnded(deck);
  }, []);

  const setVols = useCallback((cf) => {
    const vA = Math.round(Math.max(0, Math.min(100, 100-cf)));
    const vB = Math.round(Math.max(0, Math.min(100, cf)));
    pA.current?.setVolume?.(vA);
    pB.current?.setVolume?.(vB);
    setDeckA(d=>({...d,volume:vA}));
    setDeckB(d=>({...d,volume:vB}));
  }, []);

  const onCF = (val) => { const cf=Number(val); setCF(cf); setVols(cf); };

  const loadTrack = useCallback((track, deck) => {
    const player = deck==='A' ? pA.current : pB.current;
    (deck==='A'?setDeckA:setDeckB)(d=>({...d,track}));
    if (player?.loadVideoById) {
      player.loadVideoById({ videoId: track.youtubeId });
      setTimeout(() => player.pauseVideo?.(), 800);
    }
  }, []);

  const playDeck = useCallback((deck) => {
    (deck==='A'?pA:pB).current?.playVideo?.();
    (deck==='A'?setDeckA:setDeckB)(d=>({...d,isPlaying:true}));
  }, []);

  const pauseDeck = useCallback((deck) => {
    (deck==='A'?pA:pB).current?.pauseVideo?.();
    (deck==='A'?setDeckA:setDeckB)(d=>({...d,isPlaying:false}));
  }, []);

  const doCrossfade = useCallback((from, to, ms=5000) => {
    if (fadeRef.current) clearInterval(fadeRef.current);
    setFading(true);
    const start = from==='A' ? 0 : 100;
    const end   = from==='A' ? 100 : 0;
    const steps = 60; let step=0;
    fadeRef.current = setInterval(() => {
      step++;
      const cf = start + (end-start) * (step/steps);
      setCF(cf); setVols(cf);
      if (step >= steps) {
        clearInterval(fadeRef.current);
        setFading(false);
        setActive(to);
        pauseDeck(from);
      }
    }, ms/steps);
  }, [setVols, pauseDeck]);

  const handleTrackEnded = useCallback((deck) => {
    setQueue(q => {
      if (!q.length) return q;
      const next = q[0];
      const other = deck==='A'?'B':'A';
      loadTrack(next, other);
      setTimeout(() => { playDeck(other); doCrossfade(deck, other); }, 1200);
      return q.slice(1);
    });
  }, [loadTrack, playDeck, doCrossfade]);

  useEffect(() => { chatEnd.current?.scrollIntoView({behavior:'smooth'}); }, [messages]);

  // ─── AI Chat ───────────────────────────────────────────────────
  const sendMessage = async (msg) => {
    if (!msg.trim() || loading) return;
    setInput('');
    const userMsg = { role:'user', content: msg };
    setMessages(m=>[...m, userMsg]);
    setLoading(true);
    convRef.current = [...convRef.current, { role:'user', content:msg }];

    const libStr = library.map(t =>
      `ID:${t.id} | "${t.title}" - ${t.artist} | ${t.genre} | ${t.bpm}BPM | energía:${t.energy}/10`
    ).join('\n');

    const system = `Eres DJ_IA, un DJ profesional con 20 años de experiencia en clubes nocturnos latinoamericanos. Experto en lectura de públicos, gestión de energía y transiciones perfectas. Hablas español con naturalidad y carisma de DJ.

TU TRABAJO:
- Entender el brief del evento (público, duración, géneros por hora)
- Seleccionar tracks para crear el arco de energía correcto
- Hacer transiciones que hagan bailar
- Comentar como DJ real: con emoción, slang de DJ, entusiasmo

BIBLIOTECA DISPONIBLE:
${libStr}

ESTADO ACTUAL:
- Deck A: ${deckA.track ? `"${deckA.track.title}" (${deckA.isPlaying?'SONANDO':'pausa'})` : 'vacío'}
- Deck B: ${deckB.track ? `"${deckB.track.title}" (${deckB.isPlaying?'SONANDO':'pausa'})` : 'vacío'}
- Crossfader: ${crossfader<25?'A dominante':crossfader>75?'B dominante':'mezcla central'}
- Cola: ${queue.length>0 ? queue.map(t=>`"${t.title}"`).join(', ') : 'vacía'}

RESPONDE SOLO EN JSON VÁLIDO (sin markdown ni texto extra):
{
  "message": "comentario como DJ en español",
  "actions": [
    {"type":"load","deck":"A","trackId":1},
    {"type":"play","deck":"A"},
    {"type":"crossfade","from":"A","to":"B"},
    {"type":"queue","trackIds":[2,3,4]},
    {"type":"pause","deck":"A"}
  ]
}
Las actions son opcionales. Solo incluye las que correspondan.`;

    try {
      const res = await fetch('/api/chat', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514',
          max_tokens:1000,
          system,
          messages: convRef.current
        })
      });
      const data = await res.json();
      const raw = data.content?.[0]?.text || '{"message":"Error al procesar respuesta.","actions":[]}';
      let parsed;
      try { parsed = JSON.parse(raw.replace(/```json|```/g,'').trim()); }
      catch { parsed = { message: raw, actions:[] }; }

      for (const a of (parsed.actions||[])) {
        if (a.type==='load') {
          const t=library.find(x=>x.id===a.trackId);
          if(t) loadTrack(t, a.deck);
        } else if (a.type==='play') {
          setTimeout(()=>playDeck(a.deck), 600);
        } else if (a.type==='crossfade') {
          setTimeout(()=>doCrossfade(a.from, a.to), 1000);
        } else if (a.type==='queue') {
          const tracks=(a.trackIds||[]).map(id=>library.find(x=>x.id===id)).filter(Boolean);
          setQueue(q=>[...q,...tracks]);
        } else if (a.type==='pause') {
          pauseDeck(a.deck);
        }
      }

      setMessages(m=>[...m,{role:'dj',content:parsed.message}]);
      convRef.current=[...convRef.current,{role:'assistant',content:raw}];
    } catch(e) {
      setMessages(m=>[...m,{role:'dj',content:`⚠️ Error: ${e.message}`}]);
    }
    setLoading(false);
  };

  const addTrack = () => {
    const m = addUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (!m) { alert('URL de YouTube inválida'); return; }
    const t={
      id:Date.now(), youtubeId:m[1],
      title:addMeta.title||'Sin título', artist:addMeta.artist||'Desconocido',
      genre:addMeta.genre||'Varios', bpm:Number(addMeta.bpm)||120, energy:Number(addMeta.energy)||7
    };
    setLibrary(l=>[...l,t]);
    setAddUrl(''); setAddMeta({title:'',artist:'',genre:'',bpm:120,energy:7});
  };

  // ─── Styles ────────────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;600;700&display=swap');
    * { box-sizing:border-box; margin:0; padding:0; }
    body { background:#080810; }
    ::-webkit-scrollbar { width:4px; }
    ::-webkit-scrollbar-track { background:#0a0a18; }
    ::-webkit-scrollbar-thumb { background:#00ffcc33; border-radius:2px; }
    input[type=range] { -webkit-appearance:none; height:4px; border-radius:2px; background:#1a1a2e; outline:none; cursor:pointer; }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:14px; height:14px; border-radius:50%; background:#00ffcc; cursor:pointer; box-shadow:0 0 8px #00ffcc88; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
    @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
    @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  `;

  const currentBPM = activeDeck==='A'
    ? (deckA.track?.bpm || deckB.track?.bpm || '--')
    : (deckB.track?.bpm || deckA.track?.bpm || '--');

  const S = {
    app:{ background:'#080810', minHeight:'100vh', fontFamily:"'Rajdhani','Segoe UI',sans-serif", color:'#e0e0f0',
      backgroundImage:`radial-gradient(ellipse 80% 40% at 50% -10%,rgba(0,255,200,.06) 0%,transparent 70%),
        radial-gradient(ellipse 60% 30% at 80% 110%,rgba(180,0,255,.04) 0%,transparent 60%)` },
    header:{ background:'rgba(0,0,0,.7)', borderBottom:'1px solid rgba(0,255,200,.15)',
      padding:'10px 18px', display:'flex', justifyContent:'space-between', alignItems:'center',
      backdropFilter:'blur(12px)', position:'sticky', top:0, zIndex:100 },
    logo:{ fontFamily:"'Orbitron',monospace", color:'#00ffcc', fontSize:'16px', letterSpacing:'4px',
      textShadow:'0 0 20px #00ffcc66' },
    sub:{ color:'#333', fontSize:'9px', letterSpacing:'3px', marginTop:'2px' },
    body:{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:'10px' },
    row:{ display:'flex', gap:'10px' },
    deck:(live)=>({ flex:1, background:live?'rgba(0,255,200,.03)':'rgba(255,255,255,.015)',
      border:`1px solid ${live?'rgba(0,255,200,.3)':'rgba(255,255,255,.05)'}`,
      borderRadius:'12px', padding:'12px', transition:'all .4s',
      boxShadow:live?'0 0 30px rgba(0,255,204,.1) inset':'none' }),
    mixer:{ width:'130px', flexShrink:0, background:'rgba(0,0,0,.5)',
      border:'1px solid rgba(255,255,255,.04)', borderRadius:'12px', padding:'12px',
      display:'flex', flexDirection:'column', alignItems:'center', gap:'9px' },
    ytBox:{ background:'#000', borderRadius:'8px', overflow:'hidden', height:'145px',
      marginBottom:'9px', border:'1px solid rgba(255,255,255,.05)' },
    deckLabel:(live)=>({ fontFamily:"'Orbitron',monospace", fontSize:'9px', letterSpacing:'3px',
      color:live?'#00ffcc':'#333', textShadow:live?'0 0 10px #00ffcc':'none',
      display:'flex', alignItems:'center', gap:'6px', marginBottom:'8px' }),
    title:{ color:'#fff', fontSize:'13px', fontWeight:'700', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
    artist:{ color:'#555', fontSize:'10px', marginTop:'2px' },
    tagRow:{ display:'flex', gap:'7px', marginTop:'5px', alignItems:'center', flexWrap:'wrap' },
    tag:(c='#00ffcc')=>({ background:`rgba(${c==='#00ffcc'?'0,255,200':'255,0,170'},0.07)`,
      color:c, fontSize:'9px', padding:'2px 7px', borderRadius:'4px',
      border:`1px solid ${c}33`, letterSpacing:'1px' }),
    bpmTag:{ color:'#ff00aa', fontSize:'9px', fontFamily:"'Orbitron',monospace" },
    controls:{ display:'flex', gap:'6px', alignItems:'center', marginTop:'8px' },
    btn:(c,solid=false)=>({ background:solid?c:'transparent', color:solid?'#000':c,
      border:`1px solid ${c}`, borderRadius:'6px', padding:'5px 12px', cursor:'pointer',
      fontSize:'12px', fontWeight:'700', transition:'all .15s',
      textShadow:solid?'none':`0 0 8px ${c}80` }),
    volRow:{ display:'flex', alignItems:'center', gap:'6px', marginTop:'7px' },
    volTrack:(c)=>({ flex:1, height:'3px', background:'#1a1a2e', borderRadius:'2px', overflow:'hidden' }),
    volFill:(w,c)=>({ width:`${w}%`, height:'100%', background:c, transition:'width .1s' }),
    select:{ background:'#0d0d1a', border:'1px solid #1a1a2e', borderRadius:'6px',
      padding:'5px 8px', color:'#777', fontSize:'11px', flex:1, outline:'none' },
    mixLabel:{ fontFamily:"'Orbitron',monospace", fontSize:'8px', letterSpacing:'2px', color:'rgba(0,255,200,.3)' },
    bpmDisp:{ fontFamily:"'Orbitron',monospace", fontSize:'24px', color:'#ff00aa',
      textShadow:'0 0 15px #ff00aa77', textAlign:'center', lineHeight:1 },
    fadeBtn:(on)=>({ width:'100%', padding:'7px 4px',
      background:on?'linear-gradient(135deg,#ff00aa,#00ffcc)':'transparent',
      color:on?'#000':'#ff00aa', border:'1px solid #ff00aa', borderRadius:'7px',
      cursor:'pointer', fontSize:'9px', fontFamily:"'Orbitron',monospace",
      letterSpacing:'1px', fontWeight:'700', transition:'all .3s',
      boxShadow:on?'0 0 15px #ff00aa55':'none' }),
    chatWrap:{ display:'flex', gap:'0', background:'rgba(0,0,0,.35)',
      border:'1px solid rgba(255,255,255,.05)', borderRadius:'12px', overflow:'hidden' },
    chatPanel:{ flex:1, padding:'12px', display:'flex', flexDirection:'column', height:'270px',
      borderRight:'1px solid rgba(255,255,255,.05)' },
    log:{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:'8px',
      marginBottom:'9px', paddingRight:'4px' },
    bubble:(dj)=>({ background:dj?'rgba(0,255,200,.04)':'rgba(136,102,255,.1)',
      border:`1px solid ${dj?'rgba(0,255,200,.15)':'rgba(136,102,255,.2)'}`,
      borderRadius:dj?'12px 12px 12px 3px':'12px 12px 3px 12px',
      padding:'8px 12px', maxWidth:'84%', fontSize:'12px', lineHeight:'1.55',
      color:dj?'#ccc':'#aaa', animation:'slideIn .2s ease' }),
    row2:{ display:'flex', gap:'7px' },
    inp:{ flex:1, background:'#0a0a18', border:'1px solid #1a1a2e', borderRadius:'8px',
      padding:'8px 12px', color:'#ccc', fontSize:'12px', outline:'none' },
    queuePane:{ width:'185px', padding:'12px', overflowY:'auto', height:'270px' },
    sLbl:{ fontFamily:"'Orbitron',monospace", fontSize:'8px', letterSpacing:'3px',
      marginBottom:'9px', display:'block' },
    qItem:(first)=>({ padding:'6px 8px', marginBottom:'5px',
      background:first?'rgba(255,170,0,.06)':'rgba(255,255,255,.02)',
      borderLeft:`3px solid ${first?'#ffaa00':'#222'}`, borderRadius:'0 6px 6px 0' }),
    libGrid:{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:'7px' },
    libItem:{ background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.05)',
      borderRadius:'8px', padding:'10px', display:'flex', justifyContent:'space-between', alignItems:'center' },
    addBox:{ background:'rgba(0,255,200,.02)', border:'1px solid rgba(0,255,200,.12)',
      borderRadius:'10px', padding:'12px', marginBottom:'14px' },
  };

  return (
    <div style={S.app}>
      <style>{css}</style>

      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <div style={S.logo}>◈ DJ_IA SYSTEM</div>
          <div style={S.sub}>AI-POWERED PROFESSIONAL MIXER</div>
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          {!ytReady
            ? <span style={{ color:'#ffaa00', fontSize:'10px', animation:'pulse 1s infinite' }}>● CARGANDO YT…</span>
            : <span style={{ color:'#00ff88', fontSize:'10px' }}>● YOUTUBE LISTO</span>}
          <button onClick={()=>setAutoMix(x=>!x)} style={S.btn(autoMix?'#00ffcc':'#444', autoMix)}>
            🤖 AUTO {autoMix?'ON':'OFF'}
          </button>
          <button onClick={()=>setTab(t=>t==='mixer'?'library':'mixer')} style={S.btn('#8866ff')}>
            {tab==='mixer'?'📚 Biblioteca':'🎛 Mixer'}
          </button>
        </div>
      </div>

      <div style={S.body}>
        {tab==='mixer' ? (<>

          {/* ── Decks ── */}
          <div style={S.row}>
            {/* DECK A */}
            <div style={S.deck(activeDeck==='A')}>
              <div style={S.deckLabel(activeDeck==='A')}>
                DECK A {activeDeck==='A'&&<span style={{color:'#ff4455',animation:'pulse 1s infinite',fontSize:'8px'}}>● LIVE</span>}
              </div>
              <div style={S.ytBox}><div id="yt-a" style={{width:'100%',height:'100%'}}/></div>
              <Waveform active={deckA.isPlaying} color="#00ffcc"/>
              <div style={{margin:'6px 0'}}>
                {deckA.track
                  ? <><div style={S.title}>{deckA.track.title}</div>
                      <div style={S.artist}>{deckA.track.artist}</div>
                      <div style={S.tagRow}>
                        <span style={S.tag('#00ffcc')}>{deckA.track.genre}</span>
                        <span style={S.bpmTag}>{deckA.track.bpm} BPM</span>
                        <EnergyBar energy={deckA.track.energy}/>
                      </div></>
                  : <div style={{color:'#2a2a44',fontSize:'11px',fontStyle:'italic'}}>Sin track — pídele al DJ_IA</div>
                }
              </div>
              <div style={S.controls}>
                <button onClick={()=>deckA.isPlaying?pauseDeck('A'):playDeck('A')} style={S.btn('#00ffcc',deckA.isPlaying)}>
                  {deckA.isPlaying?'⏸':'▶'}
                </button>
                <select onChange={e=>{const t=library.find(x=>x.id===Number(e.target.value));if(t)loadTrack(t,'A');}} style={S.select} value="">
                  <option value="">Cargar en A…</option>
                  {library.map(t=><option key={t.id} value={t.id}>{t.title} – {t.artist}</option>)}
                </select>
              </div>
              <div style={S.volRow}>
                <span style={{color:'#333',fontSize:'9px'}}>VOL A</span>
                <div style={S.volTrack()}><div style={S.volFill(deckA.volume,'#00ffcc')}/></div>
                <span style={{color:'#00ffcc',fontSize:'9px',fontFamily:"'Orbitron',monospace"}}>{deckA.volume}%</span>
              </div>
            </div>

            {/* MIXER */}
            <div style={S.mixer}>
              <span style={S.mixLabel}>MIXER</span>
              <div>
                <div style={S.bpmDisp}>{currentBPM}</div>
                <div style={{color:'#222',fontSize:'8px',letterSpacing:'2px',textAlign:'center'}}>BPM</div>
              </div>
              <VUMeter active={deckA.isPlaying||deckB.isPlaying}/>
              <div style={{width:'100%'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'8px',marginBottom:'4px'}}>
                  <span style={{color:'#00ffcc'}}>A</span>
                  <span style={{color:'#222',letterSpacing:'1px'}}>XFADER</span>
                  <span style={{color:'#ff00aa'}}>B</span>
                </div>
                <input type="range" min="0" max="100" value={crossfader}
                  onChange={e=>onCF(e.target.value)} style={{width:'100%'}}/>
                <div style={{textAlign:'center',color:'#333',fontSize:'8px',marginTop:'3px'}}>
                  {crossfader<20?'◄◄ A':crossfader>80?'B ►►':'⬌ MIX'}
                </div>
              </div>
              <button onClick={()=>doCrossfade(activeDeck,activeDeck==='A'?'B':'A')} style={S.fadeBtn(fading)} disabled={fading}>
                {fading?'⟳ FADING':'⟳ AUTO FADE'}
              </button>
              <div style={{width:'100%'}}>
                <div style={{color:'#222',fontSize:'8px',letterSpacing:'1px',marginBottom:'4px',textAlign:'center'}}>EQ</div>
                {['HI','MID','LO'].map((l,i)=>(
                  <div key={l} style={{display:'flex',alignItems:'center',gap:'4px',marginBottom:'4px'}}>
                    <span style={{color:'#2a2a44',fontSize:'8px',width:'16px'}}>{l}</span>
                    <div style={{flex:1,height:'3px',background:'#1a1a2e',borderRadius:'2px'}}>
                      <div style={{width:`${[70,85,90][i]}%`,height:'100%',background:'rgba(0,255,200,.35)'}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DECK B */}
            <div style={S.deck(activeDeck==='B')}>
              <div style={S.deckLabel(activeDeck==='B')}>
                DECK B {activeDeck==='B'&&<span style={{color:'#ff4455',animation:'pulse 1s infinite',fontSize:'8px'}}>● LIVE</span>}
              </div>
              <div style={S.ytBox}><div id="yt-b" style={{width:'100%',height:'100%'}}/></div>
              <Waveform active={deckB.isPlaying} color="#ff00aa"/>
              <div style={{margin:'6px 0'}}>
                {deckB.track
                  ? <><div style={S.title}>{deckB.track.title}</div>
                      <div style={S.artist}>{deckB.track.artist}</div>
                      <div style={S.tagRow}>
                        <span style={S.tag('#ff00aa')}>{deckB.track.genre}</span>
                        <span style={S.bpmTag}>{deckB.track.bpm} BPM</span>
                        <EnergyBar energy={deckB.track.energy}/>
                      </div></>
                  : <div style={{color:'#2a2a44',fontSize:'11px',fontStyle:'italic'}}>Sin track — pídele al DJ_IA</div>
                }
              </div>
              <div style={S.controls}>
                <button onClick={()=>deckB.isPlaying?pauseDeck('B'):playDeck('B')} style={S.btn('#ff00aa',deckB.isPlaying)}>
                  {deckB.isPlaying?'⏸':'▶'}
                </button>
                <select onChange={e=>{const t=library.find(x=>x.id===Number(e.target.value));if(t)loadTrack(t,'B');}} style={S.select} value="">
                  <option value="">Cargar en B…</option>
                  {library.map(t=><option key={t.id} value={t.id}>{t.title} – {t.artist}</option>)}
                </select>
              </div>
              <div style={S.volRow}>
                <span style={{color:'#333',fontSize:'9px'}}>VOL B</span>
                <div style={S.volTrack()}><div style={S.volFill(deckB.volume,'#ff00aa')}/></div>
                <span style={{color:'#ff00aa',fontSize:'9px',fontFamily:"'Orbitron',monospace"}}>{deckB.volume}%</span>
              </div>
            </div>
          </div>

          {/* ── Chat + Queue ── */}
          <div style={S.chatWrap}>
            <div style={S.chatPanel}>
              <span style={{...S.sLbl,color:'#8866ff'}}>🎙 DJ_IA CONSOLE</span>
              <div style={S.log}>
                {messages.map((m,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                    <div style={S.bubble(m.role==='dj')}>
                      {m.role==='dj'&&<span style={{color:'#00ffcc',fontSize:'9px',display:'block',
                        marginBottom:'3px',letterSpacing:'1px',fontFamily:"'Orbitron',monospace"}}>DJ_IA</span>}
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading&&<div style={{color:'rgba(0,255,200,.3)',fontSize:'11px',animation:'pulse .8s infinite'}}>
                  ⠸ DJ_IA armando el set…
                </div>}
                <div ref={chatEnd}/>
              </div>
              <div style={S.row2}>
                <input value={input} onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&sendMessage(input)}
                  placeholder="Ej: primera hora reggaeton suave, 80 personas universitarias…"
                  style={S.inp} disabled={loading}/>
                <button onClick={()=>sendMessage(input)} disabled={loading}
                  style={{...S.btn('#00ffcc',!loading),padding:'8px 14px'}}>▶</button>
              </div>
            </div>
            <div style={S.queuePane}>
              <span style={{...S.sLbl,color:'#ffaa00'}}>📋 QUEUE ({queue.length})</span>
              {queue.length===0
                ? <div style={{color:'#1e1e2e',fontSize:'11px',fontStyle:'italic',lineHeight:'1.7'}}>
                    Cola vacía.<br/>Dile al DJ_IA que arme el set y llenará esto automáticamente.
                  </div>
                : queue.map((t,i)=>(
                  <div key={i} style={S.qItem(i===0)}>
                    <div style={{fontSize:'11px',color:i===0?'#ffdd88':'#666'}}>{i+1}. {t.title}</div>
                    <div style={{fontSize:'10px',color:'#333'}}>{t.genre} · {t.bpm} BPM</div>
                  </div>
                ))
              }
            </div>
          </div>

        </>) : (
          /* ── Library ── */
          <div style={{background:'rgba(0,0,0,.3)',border:'1px solid rgba(255,255,255,.04)',
            borderRadius:'12px',padding:'16px'}}>
            <span style={{...S.sLbl,color:'#00ffcc',fontSize:'10px'}}>📚 BIBLIOTECA DE TRACKS</span>
            <div style={S.addBox}>
              <div style={{color:'#00ffcc',fontSize:'9px',letterSpacing:'2px',marginBottom:'8px',
                fontFamily:"'Orbitron',monospace"}}>+ AGREGAR DESDE YOUTUBE</div>
              <div style={{display:'flex',gap:'7px',flexWrap:'wrap'}}>
                {[
                  [addUrl,v=>setAddUrl(v),'URL de YouTube','200px'],
                  [addMeta.title,v=>setAddMeta({...addMeta,title:v}),'Título','130px'],
                  [addMeta.artist,v=>setAddMeta({...addMeta,artist:v}),'Artista','120px'],
                  [addMeta.genre,v=>setAddMeta({...addMeta,genre:v}),'Género','100px'],
                ].map(([val,fn,ph,w],i)=>(
                  <input key={i} value={val} onChange={e=>fn(e.target.value)}
                    placeholder={ph} style={{...S.inp,width:w,flex:'unset'}}/>
                ))}
                <input value={addMeta.bpm} onChange={e=>setAddMeta({...addMeta,bpm:e.target.value})}
                  placeholder="BPM" type="number" style={{...S.inp,width:'60px',flex:'unset'}}/>
                <input value={addMeta.energy} onChange={e=>setAddMeta({...addMeta,energy:e.target.value})}
                  placeholder="Energía (1-10)" type="number" min="1" max="10" style={{...S.inp,width:'80px',flex:'unset'}}/>
                <button onClick={addTrack} style={{...S.btn('#00ffcc',true),padding:'8px 14px'}}>+ AGREGAR</button>
              </div>
            </div>
            <div style={S.libGrid}>
              {library.map(t=>(
                <div key={t.id} style={S.libItem}>
                  <div style={{flex:1,minWidth:0,marginRight:'10px'}}>
                    <div style={{...S.title,fontSize:'12px'}}>{t.title}</div>
                    <div style={S.artist}>{t.artist}</div>
                    <div style={S.tagRow}>
                      <span style={S.tag()}>{t.genre}</span>
                      <span style={S.bpmTag}>{t.bpm}</span>
                      <EnergyBar energy={t.energy}/>
                    </div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:'4px',flexShrink:0}}>
                    <button onClick={()=>loadTrack(t,'A')} style={{...S.btn('#00ffcc'),fontSize:'9px',padding:'3px 8px'}}>→ A</button>
                    <button onClick={()=>loadTrack(t,'B')} style={{...S.btn('#ff00aa'),fontSize:'9px',padding:'3px 8px'}}>→ B</button>
                    <button onClick={()=>setQueue(q=>[...q,t])} style={{...S.btn('#ffaa00'),fontSize:'9px',padding:'3px 8px'}}>+ Cola</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
