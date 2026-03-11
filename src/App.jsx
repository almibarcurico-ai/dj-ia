import { useState, useEffect, useRef, useCallback } from "react";

const LIBRARY_INIT = [
  { id:1,  youtubeId:'ktvTqknDobU', title:'Despacito',            artist:'Luis Fonsi ft. Daddy Yankee', genre:'Reggaeton',        bpm:89,  energy:7 },
  { id:2,  youtubeId:'JGwWNGJdvx8', title:'Shape of You',         artist:'Ed Sheeran',                  genre:'Pop',              bpm:96,  energy:7 },
  { id:3,  youtubeId:'OPf0YbXqDm0', title:'Uptown Funk',          artist:'Mark Ronson ft. Bruno Mars',  genre:'Funk/Pop',         bpm:115, energy:9 },
  { id:4,  youtubeId:'YqeW9_5kURI', title:'Lean On',              artist:'Major Lazer',                 genre:'Electronic',       bpm:98,  energy:8 },
  { id:5,  youtubeId:'DyDfgMOUjCI', title:'Bad Guy',              artist:'Billie Eilish',               genre:'Pop',              bpm:135, energy:6 },
  { id:6,  youtubeId:'selWsrHPXaw', title:'Taki Taki',            artist:'DJ Snake ft. Selena Gomez',   genre:'Latin Trap',       bpm:98,  energy:8 },
  { id:7,  youtubeId:'EgBJmlPo8Xw', title:'Danza Kuduro',         artist:'Don Omar ft. Lucenzo',        genre:'Reggaeton',        bpm:130, energy:10},
  { id:8,  youtubeId:'uelHwf8o7_U', title:'Bailando',             artist:'Enrique Iglesias',            genre:'Latin Pop',        bpm:117, energy:8 },
  { id:9,  youtubeId:'pRpeEdMmmQ0', title:"Hips Don't Lie",       artist:'Shakira',                     genre:'Latin Pop',        bpm:100, energy:8 },
  { id:10, youtubeId:'GI6CfKcMhjY', title:'Titanium',             artist:'David Guetta ft. Sia',        genre:'Progressive House',bpm:126, energy:8 },
  { id:11, youtubeId:'HCjNJDNzw8Y', title:"Don't You Worry Child",artist:'Swedish House Mafia',         genre:'Progressive House',bpm:128, energy:9 },
  { id:12, youtubeId:'0sFBLAJpFTs', title:'Mi Gente',             artist:'J Balvin & Willy William',    genre:'Reggaeton',        bpm:105, energy:9 },
  { id:13, youtubeId:'3tmd-ClpJxA', title:'Gasolina',             artist:'Daddy Yankee',                genre:'Reggaeton',        bpm:96,  energy:10},
  { id:14, youtubeId:'lp-EO5I60KA', title:'Con Calma',            artist:'Daddy Yankee ft. Snow',       genre:'Reggaeton',        bpm:94,  energy:8 },
  { id:15, youtubeId:'yITCd6x3GqM', title:'Pepas',                artist:'Farruko',                     genre:'Reggaeton',        bpm:97,  energy:9 },
];

function buildSystemPrompt(libStr, deckA, deckB, crossfader, queue) {
  var deckAInfo = deckA.track ? ('"' + deckA.track.title + '" (' + (deckA.isPlaying ? 'SONANDO' : 'pausa') + ')') : 'vacio';
  var deckBInfo = deckB.track ? ('"' + deckB.track.title + '" (' + (deckB.isPlaying ? 'SONANDO' : 'pausa') + ')') : 'vacio';
  var cfInfo = crossfader < 25 ? 'A dominante' : crossfader > 75 ? 'B dominante' : 'mezcla central';
  var queueInfo = queue.length > 0 ? queue.map(function(t) { return '"' + t.title + '"'; }).join(', ') : 'vacia';
  return 'Eres DJ_IA, un DJ profesional con 20 anios de experiencia en clubes nocturnos latinoamericanos. Experto en lectura de publicos, gestion de energia y transiciones perfectas. Hablas espaniol con naturalidad y carisma de DJ.\n\n' +
    'TU TRABAJO:\n' +
    '- Entender el brief del evento (publico, duracion, generos por hora)\n' +
    '- Seleccionar tracks para crear el arco de energia correcto\n' +
    '- Hacer transiciones que hagan bailar\n' +
    '- Comentar como DJ real: con emocion, slang de DJ, entusiasmo\n\n' +
    'BIBLIOTECA DISPONIBLE:\n' + libStr + '\n\n' +
    'ESTADO ACTUAL:\n' +
    '- Deck A: ' + deckAInfo + '\n' +
    '- Deck B: ' + deckBInfo + '\n' +
    '- Crossfader: ' + cfInfo + '\n' +
    '- Cola: ' + queueInfo + '\n\n' +
    'RESPONDE SOLO EN JSON VALIDO (sin markdown ni texto extra):\n' +
    '{\n' +
    '  "message": "comentario como DJ en espaniol",\n' +
    '  "actions": [\n' +
    '    {"type":"load","deck":"A","trackId":1},\n' +
    '    {"type":"play","deck":"A"},\n' +
    '    {"type":"crossfade","from":"A","to":"B"},\n' +
    '    {"type":"queue","trackIds":[2,3,4]},\n' +
    '    {"type":"pause","deck":"A"}\n' +
    '  ]\n' +
    '}\n' +
    'Las actions son opcionales. Solo incluye las que correspondan.';
}

function EnergyBar({ energy }) {
  return (
    <div style={{ display:'flex', gap:'2px', alignItems:'flex-end' }}>
      {Array.from({length:10}).map((_,i) => (
        <div key={i} style={{
          width:'5px', height:(5+i*1.5)+'px',
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
          width:'7px', height:(h*3)+'px',
          background: i<7?'#00ff88':i<11?'#ffee00':'#ff4455',
          borderRadius:'1px 1px 0 0', transition:'height 0.09s ease-out'
        }}/>
      ))}
    </div>
  );
}

function Waveform({ active, color }) {
  var c = color || '#00ffcc';
  const [pts, setPts] = useState(Array(32).fill(4));
  useEffect(() => {
    if (!active) { setPts(Array(32).fill(4)); return; }
    const id = setInterval(() => {
      setPts(Array(32).fill(0).map(() => 4 + Math.random()*28));
    }, 120);
    return () => clearInterval(id);
  }, [active]);
  var h = 40;
  return (
    <svg width="100%" height={h} style={{ display:'block' }}>
      {pts.map((v,i) => {
        var x = (i / (pts.length-1)) * 100;
        return (
          <rect key={i}
            x={x+'%'} y={(h-v)/2} width="2" height={v}
            fill={c} opacity="0.7" rx="1"
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
    content:'DJ_IA online. Soy tu DJ inteligente. Cuentame: que evento es esta noche, cuantas personas, que edades tienen y que generos quieres para cada hora del set?'
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

  const initPlayers = useCallback(() => {
    if (pA.current && pA.current.loadVideoById) return;
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
    if (window.YT && window.YT.Player) initPlayers();
  }, [initPlayers]);

  const onState = useCallback((event, deck) => {
    if (event.data === 1) (deck==='A'?setDeckA:setDeckB)(d=>({...d,isPlaying:true}));
    if (event.data === 2) (deck==='A'?setDeckA:setDeckB)(d=>({...d,isPlaying:false}));
    if (event.data === 0 && autoRef.current) handleTrackEnded(deck);
  }, []);

  const setVols = useCallback((cf) => {
    var vA = Math.round(Math.max(0, Math.min(100, 100-cf)));
    var vB = Math.round(Math.max(0, Math.min(100, cf)));
    if (pA.current && pA.current.setVolume) pA.current.setVolume(vA);
    if (pB.current && pB.current.setVolume) pB.current.setVolume(vB);
    setDeckA(d=>({...d,volume:vA}));
    setDeckB(d=>({...d,volume:vB}));
  }, []);

  const onCF = (val) => { var cf=Number(val); setCF(cf); setVols(cf); };

  const loadTrack = useCallback((track, deck) => {
    var player = deck==='A' ? pA.current : pB.current;
    (deck==='A'?setDeckA:setDeckB)(d=>({...d,track}));
    if (player && player.loadVideoById) {
      player.loadVideoById({ videoId: track.youtubeId });
      setTimeout(() => { if (player.pauseVideo) player.pauseVideo(); }, 800);
    }
  }, []);

  const playDeck = useCallback((deck) => {
    var p = (deck==='A'?pA:pB).current;
    if (p && p.playVideo) p.playVideo();
    (deck==='A'?setDeckA:setDeckB)(d=>({...d,isPlaying:true}));
  }, []);

  const pauseDeck = useCallback((deck) => {
    var p = (deck==='A'?pA:pB).current;
    if (p && p.pauseVideo) p.pauseVideo();
    (deck==='A'?setDeckA:setDeckB)(d=>({...d,isPlaying:false}));
  }, []);

  const doCrossfade = useCallback((from, to, ms) => {
    var duration = ms || 5000;
    if (fadeRef.current) clearInterval(fadeRef.current);
    setFading(true);
    var start = from==='A' ? 0 : 100;
    var end   = from==='A' ? 100 : 0;
    var steps = 60;
    var step = 0;
    fadeRef.current = setInterval(() => {
      step++;
      var cf = start + (end-start) * (step/steps);
      setCF(cf); setVols(cf);
      if (step >= steps) {
        clearInterval(fadeRef.current);
        setFading(false);
        setActive(to);
        pauseDeck(from);
      }
    }, duration/steps);
  }, [setVols, pauseDeck]);

  const handleTrackEnded = useCallback((deck) => {
    setQueue(q => {
      if (!q.length) return q;
      var next = q[0];
      var other = deck==='A'?'B':'A';
      loadTrack(next, other);
      setTimeout(() => { playDeck(other); doCrossfade(deck, other); }, 1200);
      return q.slice(1);
    });
  }, [loadTrack, playDeck, doCrossfade]);

  useEffect(() => { if (chatEnd.current) chatEnd.current.scrollIntoView({behavior:'smooth'}); }, [messages]);

  const sendMessage = async (msg) => {
    if (!msg.trim() || loading) return;
    setInput('');
    var userMsg = { role:'user', content: msg };
    setMessages(m=>[...m, userMsg]);
    setLoading(true);
    convRef.current = [...convRef.current, { role:'user', content:msg }];

    var libStr = library.map(t =>
      'ID:' + t.id + ' | "' + t.title + '" - ' + t.artist + ' | ' + t.genre + ' | ' + t.bpm + 'BPM | energia:' + t.energy + '/10'
    ).join('\n');

    var system = buildSystemPrompt(libStr, deckA, deckB, crossfader, queue);

    try {
      var res = await fetch('/api/chat', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514',
          max_tokens:1000,
          system: system,
          messages: convRef.current
        })
      });
      var data = await res.json();
      var raw = (data.content && data.content[0] && data.content[0].text) ? data.content[0].text : '{"message":"Error al procesar.","actions":[]}';
      var parsed;
      try { parsed = JSON.parse(raw.replace(/```json|```/g,'').trim()); }
      catch(e) { parsed = { message: raw, actions:[] }; }

      var actions = parsed.actions || [];
      for (var i=0; i<actions.length; i++) {
        var a = actions[i];
        if (a.type==='load') {
          var t = library.find(function(x){ return x.id===a.trackId; });
          if (t) loadTrack(t, a.deck);
        } else if (a.type==='play') {
          (function(deck){ setTimeout(function(){ playDeck(deck); }, 600); })(a.deck);
        } else if (a.type==='crossfade') {
          (function(from,to){ setTimeout(function(){ doCrossfade(from,to); }, 1000); })(a.from, a.to);
        } else if (a.type==='queue') {
          var tracks = (a.trackIds||[]).map(function(id){ return library.find(function(x){ return x.id===id; }); }).filter(Boolean);
          setQueue(function(q){ return q.concat(tracks); });
        } else if (a.type==='pause') {
          pauseDeck(a.deck);
        }
      }

      setMessages(m=>[...m,{role:'dj',content:parsed.message}]);
      convRef.current=[...convRef.current,{role:'assistant',content:raw}];
    } catch(e) {
      setMessages(m=>[...m,{role:'dj',content:'Error: ' + e.message}]);
    }
    setLoading(false);
  };

  const addTrack = () => {
    var m = addUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (!m) { alert('URL de YouTube invalida'); return; }
    var t = {
      id:Date.now(), youtubeId:m[1],
      title:addMeta.title||'Sin titulo', artist:addMeta.artist||'Desconocido',
      genre:addMeta.genre||'Varios', bpm:Number(addMeta.bpm)||120, energy:Number(addMeta.energy)||7
    };
    setLibrary(function(l){ return l.concat([t]); });
    setAddUrl(''); setAddMeta({title:'',artist:'',genre:'',bpm:120,energy:7});
  };

  var css = '@import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;600;700&display=swap");' +
    '* { box-sizing:border-box; margin:0; padding:0; }' +
    'body { background:#080810; }' +
    '::-webkit-scrollbar { width:4px; }' +
    '::-webkit-scrollbar-track { background:#0a0a18; }' +
    '::-webkit-scrollbar-thumb { background:#00ffcc33; border-radius:2px; }' +
    'input[type=range] { -webkit-appearance:none; height:4px; border-radius:2px; background:#1a1a2e; outline:none; cursor:pointer; }' +
    'input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:14px; height:14px; border-radius:50%; background:#00ffcc; cursor:pointer; box-shadow:0 0 8px #00ffcc88; }' +
    '@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }' +
    '@keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }';

  var currentBPM = activeDeck==='A'
    ? ((deckA.track && deckA.track.bpm) || (deckB.track && deckB.track.bpm) || '--')
    : ((deckB.track && deckB.track.bpm) || (deckA.track && deckA.track.bpm) || '--');

  var appStyle = { background:'#080810', minHeight:'100vh', fontFamily:"'Rajdhani','Segoe UI',sans-serif", color:'#e0e0f0' };
  var headerStyle = { background:'rgba(0,0,0,.7)', borderBottom:'1px solid rgba(0,255,200,.15)', padding:'10px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', backdropFilter:'blur(12px)', position:'sticky', top:0, zIndex:100 };
  var logoStyle = { fontFamily:"'Orbitron',monospace", color:'#00ffcc', fontSize:'16px', letterSpacing:'4px', textShadow:'0 0 20px #00ffcc66' };
  var bodyStyle = { padding:'12px 14px', display:'flex', flexDirection:'column', gap:'10px' };
  var rowStyle = { display:'flex', gap:'10px' };

  function deckStyle(live) {
    return { flex:1, background:live?'rgba(0,255,200,.03)':'rgba(255,255,255,.015)', border:'1px solid '+(live?'rgba(0,255,200,.3)':'rgba(255,255,255,.05)'), borderRadius:'12px', padding:'12px', transition:'all .4s', boxShadow:live?'0 0 30px rgba(0,255,204,.1) inset':'none' };
  }
  var mixerStyle = { width:'130px', flexShrink:0, background:'rgba(0,0,0,.5)', border:'1px solid rgba(255,255,255,.04)', borderRadius:'12px', padding:'12px', display:'flex', flexDirection:'column', alignItems:'center', gap:'9px' };
  var ytBoxStyle = { background:'#000', borderRadius:'8px', overflow:'hidden', height:'145px', marginBottom:'9px', border:'1px solid rgba(255,255,255,.05)' };
  function deckLabelStyle(live) {
    return { fontFamily:"'Orbitron',monospace", fontSize:'9px', letterSpacing:'3px', color:live?'#00ffcc':'#333', textShadow:live?'0 0 10px #00ffcc':'none', display:'flex', alignItems:'center', gap:'6px', marginBottom:'8px' };
  }
  var titleStyle = { color:'#fff', fontSize:'13px', fontWeight:'700', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' };
  var artistStyle = { color:'#555', fontSize:'10px', marginTop:'2px' };
  var tagRowStyle = { display:'flex', gap:'7px', marginTop:'5px', alignItems:'center', flexWrap:'wrap' };
  function tagStyle(c) { var col=c||'#00ffcc'; return { background:'rgba(0,255,200,0.07)', color:col, fontSize:'9px', padding:'2px 7px', borderRadius:'4px', border:'1px solid '+col+'33', letterSpacing:'1px' }; }
  var bpmTagStyle = { color:'#ff00aa', fontSize:'9px', fontFamily:"'Orbitron',monospace" };
  var controlsStyle = { display:'flex', gap:'6px', alignItems:'center', marginTop:'8px' };
  function btnStyle(c, solid) { return { background:solid?c:'transparent', color:solid?'#000':c, border:'1px solid '+c, borderRadius:'6px', padding:'5px 12px', cursor:'pointer', fontSize:'12px', fontWeight:'700', transition:'all .15s' }; }
  var selectStyle = { background:'#0d0d1a', border:'1px solid #1a1a2e', borderRadius:'6px', padding:'5px 8px', color:'#777', fontSize:'11px', flex:1, outline:'none' };
  var volRowStyle = { display:'flex', alignItems:'center', gap:'6px', marginTop:'7px' };
  var bpmDispStyle = { fontFamily:"'Orbitron',monospace", fontSize:'24px', color:'#ff00aa', textShadow:'0 0 15px #ff00aa77', textAlign:'center', lineHeight:'1' };
  function fadeBtnStyle(on) { return { width:'100%', padding:'7px 4px', background:on?'linear-gradient(135deg,#ff00aa,#00ffcc)':'transparent', color:on?'#000':'#ff00aa', border:'1px solid #ff00aa', borderRadius:'7px', cursor:'pointer', fontSize:'9px', fontFamily:"'Orbitron',monospace", letterSpacing:'1px', fontWeight:'700', transition:'all .3s' }; }
  var chatWrapStyle = { display:'flex', background:'rgba(0,0,0,.35)', border:'1px solid rgba(255,255,255,.05)', borderRadius:'12px', overflow:'hidden' };
  var chatPanelStyle = { flex:1, padding:'12px', display:'flex', flexDirection:'column', height:'270px', borderRight:'1px solid rgba(255,255,255,.05)' };
  var logStyle = { flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:'8px', marginBottom:'9px', paddingRight:'4px' };
  function bubbleStyle(dj) { return { background:dj?'rgba(0,255,200,.04)':'rgba(136,102,255,.1)', border:'1px solid '+(dj?'rgba(0,255,200,.15)':'rgba(136,102,255,.2)'), borderRadius:dj?'12px 12px 12px 3px':'12px 12px 3px 12px', padding:'8px 12px', maxWidth:'84%', fontSize:'12px', lineHeight:'1.55', color:dj?'#ccc':'#aaa' }; }
  var inpStyle = { flex:1, background:'#0a0a18', border:'1px solid #1a1a2e', borderRadius:'8px', padding:'8px 12px', color:'#ccc', fontSize:'12px', outline:'none' };
  var queuePaneStyle = { width:'185px', padding:'12px', overflowY:'auto', height:'270px' };
  var sLblStyle = { fontFamily:"'Orbitron',monospace", fontSize:'8px', letterSpacing:'3px', marginBottom:'9px', display:'block' };
  function qItemStyle(first) { return { padding:'6px 8px', marginBottom:'5px', background:first?'rgba(255,170,0,.06)':'rgba(255,255,255,.02)', borderLeft:'3px solid '+(first?'#ffaa00':'#222'), borderRadius:'0 6px 6px 0' }; }

  return (
    <div style={appStyle}>
      <style>{css}</style>
      <div style={headerStyle}>
        <div>
          <div style={logoStyle}>DJ_IA SYSTEM</div>
          <div style={{ color:'#333', fontSize:'9px', letterSpacing:'3px', marginTop:'2px' }}>AI-POWERED PROFESSIONAL MIXER</div>
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          {!ytReady
            ? <span style={{ color:'#ffaa00', fontSize:'10px', animation:'pulse 1s infinite' }}>CARGANDO YT...</span>
            : <span style={{ color:'#00ff88', fontSize:'10px' }}>YOUTUBE LISTO</span>}
          <button onClick={()=>setAutoMix(x=>!x)} style={btnStyle(autoMix?'#00ffcc':'#444', autoMix)}>
            AUTO {autoMix?'ON':'OFF'}
          </button>
          <button onClick={()=>setTab(t=>t==='mixer'?'library':'mixer')} style={btnStyle('#8866ff', false)}>
            {tab==='mixer'?'Biblioteca':'Mixer'}
          </button>
        </div>
      </div>

      <div style={bodyStyle}>
        {tab==='mixer' ? (
          <div>
            <div style={rowStyle}>
              <div style={deckStyle(activeDeck==='A')}>
                <div style={deckLabelStyle(activeDeck==='A')}>
                  DECK A {activeDeck==='A' && <span style={{color:'#ff4455',animation:'pulse 1s infinite',fontSize:'8px'}}>LIVE</span>}
                </div>
                <div style={ytBoxStyle}><div id="yt-a" style={{width:'100%',height:'100%'}}/></div>
                <Waveform active={deckA.isPlaying} color="#00ffcc"/>
                <div style={{margin:'6px 0'}}>
                  {deckA.track ? (
                    <div>
                      <div style={titleStyle}>{deckA.track.title}</div>
                      <div style={artistStyle}>{deckA.track.artist}</div>
                      <div style={tagRowStyle}>
                        <span style={tagStyle('#00ffcc')}>{deckA.track.genre}</span>
                        <span style={bpmTagStyle}>{deckA.track.bpm} BPM</span>
                        <EnergyBar energy={deckA.track.energy}/>
                      </div>
                    </div>
                  ) : <div style={{color:'#2a2a44',fontSize:'11px',fontStyle:'italic'}}>Sin track</div>}
                </div>
                <div style={controlsStyle}>
                  <button onClick={()=>deckA.isPlaying?pauseDeck('A'):playDeck('A')} style={btnStyle('#00ffcc',deckA.isPlaying)}>
                    {deckA.isPlaying?'PAUSA':'PLAY'}
                  </button>
                  <select onChange={e=>{var t=library.find(x=>x.id===Number(e.target.value));if(t)loadTrack(t,'A');}} style={selectStyle} value="">
                    <option value="">Cargar en A...</option>
                    {library.map(t=><option key={t.id} value={t.id}>{t.title} - {t.artist}</option>)}
                  </select>
                </div>
                <div style={volRowStyle}>
                  <span style={{color:'#333',fontSize:'9px'}}>VOL A</span>
                  <div style={{flex:1,height:'3px',background:'#1a1a2e',borderRadius:'2px',overflow:'hidden'}}>
                    <div style={{width:deckA.volume+'%',height:'100%',background:'#00ffcc',transition:'width .1s'}}/>
                  </div>
                  <span style={{color:'#00ffcc',fontSize:'9px',fontFamily:"'Orbitron',monospace"}}>{deckA.volume}%</span>
                </div>
              </div>

              <div style={mixerStyle}>
                <span style={{fontFamily:"'Orbitron',monospace",fontSize:'8px',letterSpacing:'2px',color:'rgba(0,255,200,.3)'}}>MIXER</span>
                <div>
                  <div style={bpmDispStyle}>{currentBPM}</div>
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
                    {crossfader<20?'A':crossfader>80?'B':'MIX'}
                  </div>
                </div>
                <button onClick={()=>doCrossfade(activeDeck,activeDeck==='A'?'B':'A')} style={fadeBtnStyle(fading)} disabled={fading}>
                  {fading?'FADING...':'AUTO FADE'}
                </button>
              </div>

              <div style={deckStyle(activeDeck==='B')}>
                <div style={deckLabelStyle(activeDeck==='B')}>
                  DECK B {activeDeck==='B' && <span style={{color:'#ff4455',animation:'pulse 1s infinite',fontSize:'8px'}}>LIVE</span>}
                </div>
                <div style={ytBoxStyle}><div id="yt-b" style={{width:'100%',height:'100%'}}/></div>
                <Waveform active={deckB.isPlaying} color="#ff00aa"/>
                <div style={{margin:'6px 0'}}>
                  {deckB.track ? (
                    <div>
                      <div style={titleStyle}>{deckB.track.title}</div>
                      <div style={artistStyle}>{deckB.track.artist}</div>
                      <div style={tagRowStyle}>
                        <span style={tagStyle('#ff00aa')}>{deckB.track.genre}</span>
                        <span style={bpmTagStyle}>{deckB.track.bpm} BPM</span>
                        <EnergyBar energy={deckB.track.energy}/>
                      </div>
                    </div>
                  ) : <div style={{color:'#2a2a44',fontSize:'11px',fontStyle:'italic'}}>Sin track</div>}
                </div>
                <div style={controlsStyle}>
                  <button onClick={()=>deckB.isPlaying?pauseDeck('B'):playDeck('B')} style={btnStyle('#ff00aa',deckB.isPlaying)}>
                    {deckB.isPlaying?'PAUSA':'PLAY'}
                  </button>
                  <select onChange={e=>{var t=library.find(x=>x.id===Number(e.target.value));if(t)loadTrack(t,'B');}} style={selectStyle} value="">
                    <option value="">Cargar en B...</option>
                    {library.map(t=><option key={t.id} value={t.id}>{t.title} - {t.artist}</option>)}
                  </select>
                </div>
                <div style={volRowStyle}>
                  <span style={{color:'#333',fontSize:'9px'}}>VOL B</span>
                  <div style={{flex:1,height:'3px',background:'#1a1a2e',borderRadius:'2px',overflow:'hidden'}}>
                    <div style={{width:deckB.volume+'%',height:'100%',background:'#ff00aa',transition:'width .1s'}}/>
                  </div>
                  <span style={{color:'#ff00aa',fontSize:'9px',fontFamily:"'Orbitron',monospace"}}>{deckB.volume}%</span>
                </div>
              </div>
            </div>

            <div style={{...chatWrapStyle, marginTop:'10px'}}>
              <div style={chatPanelStyle}>
                <span style={{...sLblStyle,color:'#8866ff'}}>DJ_IA CONSOLE</span>
                <div style={logStyle}>
                  {messages.map((m,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                      <div style={bubbleStyle(m.role==='dj')}>
                        {m.role==='dj' && <span style={{color:'#00ffcc',fontSize:'9px',display:'block',marginBottom:'3px',letterSpacing:'1px',fontFamily:"'Orbitron',monospace"}}>DJ_IA</span>}
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {loading && <div style={{color:'rgba(0,255,200,.3)',fontSize:'11px',animation:'pulse .8s infinite'}}>DJ_IA armando el set...</div>}
                  <div ref={chatEnd}/>
                </div>
                <div style={{display:'flex',gap:'7px'}}>
                  <input value={input} onChange={e=>setInput(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&sendMessage(input)}
                    placeholder="Ej: primera hora reggaeton suave, 80 personas universitarias..."
                    style={inpStyle} disabled={loading}/>
                  <button onClick={()=>sendMessage(input)} disabled={loading}
                    style={{...btnStyle('#00ffcc',!loading),padding:'8px 14px'}}>ENVIAR</button>
                </div>
              </div>
              <div style={queuePaneStyle}>
                <span style={{...sLblStyle,color:'#ffaa00'}}>QUEUE ({queue.length})</span>
                {queue.length===0
                  ? <div style={{color:'#1e1e2e',fontSize:'11px',fontStyle:'italic',lineHeight:'1.7'}}>Cola vacia. Dile al DJ_IA que arme el set.</div>
                  : queue.map((t,i)=>(
                    <div key={i} style={qItemStyle(i===0)}>
                      <div style={{fontSize:'11px',color:i===0?'#ffdd88':'#666'}}>{i+1}. {t.title}</div>
                      <div style={{fontSize:'10px',color:'#333'}}>{t.genre} - {t.bpm} BPM</div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        ) : (
          <div style={{background:'rgba(0,0,0,.3)',border:'1px solid rgba(255,255,255,.04)',borderRadius:'12px',padding:'16px'}}>
            <span style={{...sLblStyle,color:'#00ffcc',fontSize:'10px'}}>BIBLIOTECA DE TRACKS</span>
            <div style={{background:'rgba(0,255,200,.02)',border:'1px solid rgba(0,255,200,.12)',borderRadius:'10px',padding:'12px',marginBottom:'14px'}}>
              <div style={{color:'#00ffcc',fontSize:'9px',letterSpacing:'2px',marginBottom:'8px',fontFamily:"'Orbitron',monospace"}}>AGREGAR DESDE YOUTUBE</div>
              <div style={{display:'flex',gap:'7px',flexWrap:'wrap'}}>
                <input value={addUrl} onChange={e=>setAddUrl(e.target.value)} placeholder="URL de YouTube" style={{...inpStyle,width:'200px',flex:'unset'}}/>
                <input value={addMeta.title} onChange={e=>setAddMeta({...addMeta,title:e.target.value})} placeholder="Titulo" style={{...inpStyle,width:'130px',flex:'unset'}}/>
                <input value={addMeta.artist} onChange={e=>setAddMeta({...addMeta,artist:e.target.value})} placeholder="Artista" style={{...inpStyle,width:'120px',flex:'unset'}}/>
                <input value={addMeta.genre} onChange={e=>setAddMeta({...addMeta,genre:e.target.value})} placeholder="Genero" style={{...inpStyle,width:'100px',flex:'unset'}}/>
                <input value={addMeta.bpm} onChange={e=>setAddMeta({...addMeta,bpm:e.target.value})} placeholder="BPM" type="number" style={{...inpStyle,width:'60px',flex:'unset'}}/>
                <input value={addMeta.energy} onChange={e=>setAddMeta({...addMeta,energy:e.target.value})} placeholder="1-10" type="number" min="1" max="10" style={{...inpStyle,width:'60px',flex:'unset'}}/>
                <button onClick={addTrack} style={{...btnStyle('#00ffcc',true),padding:'8px 14px'}}>AGREGAR</button>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))',gap:'7px'}}>
              {library.map(t=>(
                <div key={t.id} style={{background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.05)',borderRadius:'8px',padding:'10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{flex:1,minWidth:0,marginRight:'10px'}}>
                    <div style={{...titleStyle,fontSize:'12px'}}>{t.title}</div>
                    <div style={artistStyle}>{t.artist}</div>
                    <div style={tagRowStyle}>
                      <span style={tagStyle()}>{t.genre}</span>
                      <span style={bpmTagStyle}>{t.bpm}</span>
                      <EnergyBar energy={t.energy}/>
                    </div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:'4px',flexShrink:0}}>
                    <button onClick={()=>loadTrack(t,'A')} style={{...btnStyle('#00ffcc'),fontSize:'9px',padding:'3px 8px'}}>A</button>
                    <button onClick={()=>loadTrack(t,'B')} style={{...btnStyle('#ff00aa'),fontSize:'9px',padding:'3px 8px'}}>B</button>
                    <button onClick={()=>setQueue(function(q){ return q.concat([t]); })} style={{...btnStyle('#ffaa00'),fontSize:'9px',padding:'3px 8px'}}>Cola</button>
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
