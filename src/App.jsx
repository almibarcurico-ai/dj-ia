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

  const sendMessage = async (msg) => {
    if (!msg.trim() || loading) return;
    setInput('');
    setMessages(m=>[...m, { role:'user', content: msg }]);
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
Las actions son opcionales. Solo incluye
