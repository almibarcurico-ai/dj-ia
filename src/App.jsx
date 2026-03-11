import { useState, useEffect, useRef } from "react";

var INITIAL_SEARCHES = [
  { query:'Daddy Yankee Gasolina',      genre:'Reggaeton',  bpm:96,  energy:10 },
  { query:'J Balvin Mi Gente',          genre:'Reggaeton',  bpm:105, energy:9  },
  { query:'Bad Bunny Titi Me Pregunto', genre:'Reggaeton',  bpm:95,  energy:9  },
  { query:'Shakira Hips Dont Lie',      genre:'Latin Pop',  bpm:100, energy:8  },
  { query:'Don Omar Danza Kuduro',      genre:'Reggaeton',  bpm:130, energy:10 },
  { query:'David Guetta Titanium',      genre:'House',      bpm:126, energy:8  },
  { query:'Mark Ronson Uptown Funk',    genre:'Funk Pop',   bpm:115, energy:9  },
  { query:'Ed Sheeran Shape Of You',    genre:'Pop',        bpm:96,  energy:7  },
  { query:'Major Lazer Lean On',        genre:'Electronic', bpm:98,  energy:8  },
  { query:'Farruko Pepas',              genre:'Reggaeton',  bpm:97,  energy:9  },
  { query:'Maluma Felices Los 4',       genre:'Reggaeton',  bpm:90,  energy:8  },
  { query:'Enrique Iglesias Bailando',  genre:'Latin Pop',  bpm:117, energy:8  },
];

function proxyUrl(url) {
  if (!url) return '';
  return '/api/proxy?url=' + encodeURIComponent(url);
}

function buildPrompt(libStr, dA, dB, cf, q) {
  var aInfo = dA.track ? ('"'+dA.track.title+'" ('+(dA.isPlaying?'SONANDO':'pausa')+')') : 'vacio';
  var bInfo = dB.track ? ('"'+dB.track.title+'" ('+(dB.isPlaying?'SONANDO':'pausa')+')') : 'vacio';
  var cfInfo = cf<25 ? 'A dominante' : cf>75 ? 'B dominante' : 'mezcla central';
  var qInfo = q.length>0 ? q.map(function(t){return '"'+t.title+'"';}).join(', ') : 'vacia';
  return 'Eres DJ_IA, DJ profesional latinoamericano. Responde en espaniol con carisma y emocion de DJ.\n\n' +
    'BIBLIOTECA:\n' + libStr + '\n\n' +
    'ESTADO:\nDeck A: ' + aInfo + '\nDeck B: ' + bInfo + '\nXFader: ' + cfInfo + '\nCola: ' + qInfo + '\n\n' +
    'RESPONDE SOLO JSON SIN MARKDOWN:\n' +
    '{"message":"texto del DJ","actions":[' +
    '{"type":"load","deck":"A","trackId":123},' +
    '{"type":"play","deck":"A"},' +
    '{"type":"crossfade","from":"A","to":"B"},' +
    '{"type":"queue","trackIds":[1,2,3]},' +
    '{"type":"pause","deck":"A"}' +
    ']}\nactions es completamente opcional.';
}

function EnergyBar(props) {
  return (
    <div style={{display:'flex',gap:'2px',alignItems:'flex-end'}}>
      {Array.from({length:10}).map(function(_,i){
        return <div key={i} style={{width:'4px',height:(4+i*1.4)+'px',background:i<props.energy?(i<4?'#00ff88':i<7?'#ffee00':'#ff4455'):'#1e1e2e',borderRadius:'1px'}}/>;
      })}
    </div>
  );
}

function VUMeter(props) {
  var s = useState(Array(16).fill(2));
  var bars = s[0]; var setBars = s[1];
  useEffect(function() {
    if (!props.active) { setBars(Array(16).fill(2)); return; }
    var id = setInterval(function() {
      setBars(Array(16).fill(0).map(function(_,i){ return 2+Math.random()*Math.max(0,16-i)*0.85; }));
    }, 80);
    return function(){ clearInterval(id); };
  }, [props.active]);
  return (
    <div style={{display:'flex',gap:'2px',alignItems:'flex-end',height:'44px'}}>
      {bars.map(function(h,i){
        return <div key={i} style={{width:'6px',height:(h*2.6)+'px',background:i<8?'#00ff88':i<12?'#ffee00':'#ff4455',borderRadius:'1px 1px 0 0',transition:'height 0.08s'}}/>;
      })}
    </div>
  );
}

function Bars(props) {
  var s = useState(Array(28).fill(3));
  var bars = s[0]; var setBars = s[1];
  useEffect(function(){
    if (!props.active) { setBars(Array(28).fill(3)); return; }
    var id = setInterval(function(){ setBars(Array(28).fill(0).map(function(){ return 3+Math.random()*22; })); }, 110);
    return function(){ clearInterval(id); };
  }, [props.active]);
  return (
    <div style={{height:'32px',display:'flex',alignItems:'center',gap:'2px',background:'#0a0a18',borderRadius:'6px',padding:'0 6px',marginBottom:'8px'}}>
      {bars.map(function(h,i){
        return <div key={i} style={{flex:1,height:h+'px',background:props.color||'#00ffcc',opacity:0.75,borderRadius:'1px',transition:'height 0.11s'}}/>;
      })}
    </div>
  );
}

export default function DJIA() {
  var ls = useState([]); var library = ls[0]; var setLibrary = ls[1];
  var as = useState({track:null,isPlaying:false,volume:100}); var deckA = as[0]; var setDeckA = as[1];
  var bs = useState({track:null,isPlaying:false,volume:0});  var deckB = bs[0]; var setDeckB = bs[1];
  var cs = useState(0); var crossfader = cs[0]; var setCF = cs[1];
  var qs = useState([]); var queue = qs[0]; var setQueue = qs[1];
  var ms = useState([{role:'dj',content:'DJ_IA online. Cuentame el evento, cuantos son, edades y generos por hora para armar tu set.'}]);
  var messages = ms[0]; var setMessages = ms[1];
  var is = useState(''); var input = is[0]; var setInput = is[1];
  var ls2 = useState(false); var loading = ls2[0]; var setLoading = ls2[1];
  var ll = useState(true); var loadingLib = ll[0]; var setLoadingLib = ll[1];
  var ts = useState('mixer'); var tab = ts[0]; var setTab = ts[1];
  var am = useState(false); var autoMix = am[0]; var setAutoMix = am[1];
  var ad = useState('A'); var activeDeck = ad[0]; var setActive = ad[1];
  var fd = useState(false); var fading = fd[0]; var setFading = fd[1];
  var sq = useState(''); var searchQ = sq[0]; var setSearchQ = sq[1];
  var sr = useState([]); var searchRes = sr[0]; var setSearchRes = sr[1];
  var sg = useState(false); var searching = sg[0]; var setSearching = sg[1];

  var elA = useRef(null);
  var elB = useRef(null);
  var fadeRef = useRef(null);
  var convRef = useRef([]);
  var chatEnd = useRef(null);
  var autoRef = useRef(false);
  var endedRef = useRef(null);
  autoRef.current = autoMix;

  // Init audio elements
  useEffect(function(){
    elA.current = new Audio();
    elB.current = new Audio();
    elA.current.volume = 1;
    elB.current.volume = 0;
    elA.current.addEventListener('ended', function(){ if(autoRef.current && endedRef.current) endedRef.current('A'); });
    elB.current.addEventListener('ended', function(){ if(autoRef.current && endedRef.current) endedRef.current('B'); });
    return function(){ elA.current.pause(); elB.current.pause(); };
  }, []);

  // Load library
  useEffect(function(){
    var cancelled = false;
    async function load(){
      var tracks = [];
      for (var i=0; i<INITIAL_SEARCHES.length; i++){
        var s = INITIAL_SEARCHES[i];
        try {
          var res = await fetch('/api/deezer?q='+encodeURIComponent(s.query));
          var data = await res.json();
          if (data.data && data.data[0] && data.data[0].preview){
            var item = data.data[0];
            tracks.push({id:item.id,title:item.title,artist:item.artist.name,preview:item.preview,cover:item.album.cover_medium,genre:s.genre,bpm:s.bpm,energy:s.energy});
          }
        } catch(e){}
      }
      if (!cancelled){ setLibrary(tracks); setLoadingLib(false); }
    }
    load();
    return function(){ cancelled=true; };
  }, []);

  function setVols(cf) {
    var vA = Math.max(0, Math.min(1, (100-cf)/100));
    var vB = Math.max(0, Math.min(1, cf/100));
    if (elA.current) elA.current.volume = vA;
    if (elB.current) elB.current.volume = vB;
    setDeckA(function(d){ return Object.assign({},d,{volume:Math.round(vA*100)}); });
    setDeckB(function(d){ return Object.assign({},d,{volume:Math.round(vB*100)}); });
  }

  function loadTrack(track, deck) {
    var el = deck==='A' ? elA.current : elB.current;
    if (el) { el.src = proxyUrl(track.preview); el.load(); }
    (deck==='A'?setDeckA:setDeckB)(function(d){ return Object.assign({},d,{track:track,isPlaying:false}); });
  }

  function playDeck(deck) {
    var el = deck==='A' ? elA.current : elB.current;
    if (el) el.play().catch(function(e){ console.log('play error',e); });
    (deck==='A'?setDeckA:setDeckB)(function(d){ return Object.assign({},d,{isPlaying:true}); });
  }

  function pauseDeck(deck) {
    var el = deck==='A' ? elA.current : elB.current;
    if (el) el.pause();
    (deck==='A'?setDeckA:setDeckB)(function(d){ return Object.assign({},d,{isPlaying:false}); });
  }

  function doCrossfade(from, to, ms) {
    var dur = ms || 5000;
    if (fadeRef.current) clearInterval(fadeRef.current);
    setFading(true);
    var start = from==='A' ? 0 : 100;
    var end   = from==='A' ? 100 : 0;
    var steps = 60; var step = 0;
    fadeRef.current = setInterval(function(){
      step++;
      var cf = start + (end-start)*(step/steps);
      setCF(cf); setVols(cf);
      if (step>=steps){ clearInterval(fadeRef.current); setFading(false); setActive(to); pauseDeck(from); }
    }, dur/steps);
  }

  endedRef.current = function(deck) {
    setQueue(function(q){
      if (!q.length) return q;
      var next = q[0]; var other = deck==='A'?'B':'A';
      loadTrack(next, other);
      setTimeout(function(){ playDeck(other); doCrossfade(deck, other); }, 800);
      return q.slice(1);
    });
  };

  useEffect(function(){ if(chatEnd.current) chatEnd.current.scrollIntoView({behavior:'smooth'}); }, [messages]);

  useEffect(function(){
    var state = { isPlaying: deckA.isPlaying || deckB.isPlaying, track: activeDeck==="A" ? deckA.track : deckB.track };
    try { localStorage.setItem("djia_state", JSON.stringify(state)); } catch(e){}
  }, [deckA.isPlaying, deckB.isPlaying, deckA.track, deckB.track, activeDeck]);

  async function sendMessage(msg) {
    if (!msg.trim() || loading) return;
    setInput('');
    setMessages(function(m){ return m.concat([{role:'user',content:msg}]); });
    setLoading(true);
    convRef.current = convRef.current.concat([{role:'user',content:msg}]);
    var libStr = library.map(function(t){ return 'ID:'+t.id+' | "'+t.title+'" - '+t.artist+' | '+t.genre+' | '+t.bpm+'BPM | energia:'+t.energy+'/10'; }).join('\n');
    var system = buildPrompt(libStr, deckA, deckB, crossfader, queue);
    try {
      var res = await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system:system,messages:convRef.current})});
      var data = await res.json();
      var raw = (data.content&&data.content[0]&&data.content[0].text)||'{"message":"Error","actions":[]}';
      var parsed; try{ parsed = JSON.parse(raw.replace(/```json|```/g,'').trim()); } catch(e){ parsed={message:raw,actions:[]}; }
      (parsed.actions||[]).forEach(function(a){
        if (a.type==='load'){ var t=library.find(function(x){return x.id===a.trackId;}); if(t) loadTrack(t,a.deck); }
        else if (a.type==='play'){ (function(d){ setTimeout(function(){playDeck(d);},600); })(a.deck); }
        else if (a.type==='crossfade'){ (function(f,t){ setTimeout(function(){doCrossfade(f,t);},1000); })(a.from,a.to); }
        else if (a.type==='queue'){ setQueue(function(q){ return q.concat((a.trackIds||[]).map(function(id){return library.find(function(x){return x.id===id;});}).filter(Boolean)); }); }
        else if (a.type==='pause'){ pauseDeck(a.deck); }
      });
      setMessages(function(m){ return m.concat([{role:'dj',content:parsed.message}]); });
      convRef.current = convRef.current.concat([{role:'assistant',content:raw}]);
    } catch(e){ setMessages(function(m){ return m.concat([{role:'dj',content:'Error: '+e.message}]); }); }
    setLoading(false);
  }

  async function doSearch() {
    if (!searchQ.trim()) return;
    setSearching(true); setSearchRes([]);
    try {
      var res = await fetch('/api/deezer?q='+encodeURIComponent(searchQ));
      var data = await res.json();
      setSearchRes((data.data||[]).filter(function(x){return x.preview;}).slice(0,6).map(function(item){
        return {id:item.id,title:item.title,artist:item.artist.name,preview:item.preview,cover:item.album.cover_medium,genre:'Varios',bpm:120,energy:7};
      }));
    } catch(e){}
    setSearching(false);
  }

  function addToLib(t){ setLibrary(function(l){ return l.find(function(x){return x.id===t.id;})?l:l.concat([t]); }); }

  var css = '@import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Rajdhani:wght@500;600;700&display=swap");'+
    '*{box-sizing:border-box;margin:0;padding:0;}body{background:#080810;}'+
    '::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:#0a0a18;}::-webkit-scrollbar-thumb{background:#00ffcc33;border-radius:2px;}'+
    'input[type=range]{-webkit-appearance:none;height:4px;border-radius:2px;background:#1a1a2e;outline:none;cursor:pointer;}'+
    'input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#00ffcc;cursor:pointer;}'+
    '@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}';

  function B(c,solid){ return {background:solid?c:'transparent',color:solid?'#000':c,border:'1px solid '+c,borderRadius:'6px',padding:'5px 12px',cursor:'pointer',fontSize:'12px',fontWeight:'700',transition:'all .15s'}; }
  var IN = {flex:1,background:'#0a0a18',border:'1px solid #1a1a2e',borderRadius:'8px',padding:'8px 12px',color:'#ccc',fontSize:'12px',outline:'none'};
  var SEL = {background:'#0d0d1a',border:'1px solid #1a1a2e',borderRadius:'6px',padding:'5px 8px',color:'#777',fontSize:'11px',flex:1,outline:'none'};
  var LBL = {fontFamily:"'Orbitron',monospace",fontSize:'8px',letterSpacing:'3px',marginBottom:'8px',display:'block'};

  var curBPM = activeDeck==='A' ? ((deckA.track&&deckA.track.bpm)||(deckB.track&&deckB.track.bpm)||'--') : ((deckB.track&&deckB.track.bpm)||(deckA.track&&deckA.track.bpm)||'--');

  function DeckUI(deck, ds, color) {
    var live = activeDeck===deck;
    var t = ds.track;
    return (
      <div style={{flex:1,background:live?'rgba(0,255,200,.03)':'rgba(255,255,255,.015)',border:'1px solid '+(live?'rgba(0,255,200,.3)':'rgba(255,255,255,.05)'),borderRadius:'12px',padding:'12px',transition:'all .4s'}}>
        <div style={{fontFamily:"'Orbitron',monospace",fontSize:'9px',letterSpacing:'3px',color:live?color:'#333',display:'flex',alignItems:'center',gap:'6px',marginBottom:'8px'}}>
          DECK {deck} {live&&<span style={{color:'#ff4455',animation:'pulse 1s infinite',fontSize:'8px'}}>LIVE</span>}
        </div>
        {t ? (
          <div style={{display:'flex',gap:'10px',marginBottom:'8px',alignItems:'center'}}>
            {t.cover&&<img src={t.cover} alt="" style={{width:'52px',height:'52px',borderRadius:'6px',objectFit:'cover',border:'1px solid rgba(255,255,255,.1)',flexShrink:0}}/>}
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:'#fff',fontSize:'13px',fontWeight:'700',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
              <div style={{color:'#555',fontSize:'11px',marginTop:'2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.artist}</div>
              <div style={{display:'flex',gap:'6px',marginTop:'4px',alignItems:'center'}}>
                <span style={{color:color,fontSize:'9px',background:'rgba(0,255,200,.07)',padding:'1px 6px',borderRadius:'3px',border:'1px solid '+color+'33'}}>{t.genre}</span>
                <span style={{color:'#ff00aa',fontSize:'9px',fontFamily:"'Orbitron',monospace"}}>{t.bpm} BPM</span>
                <EnergyBar energy={t.energy}/>
              </div>
            </div>
          </div>
        ) : (
          <div style={{height:'60px',display:'flex',alignItems:'center',justifyContent:'center',color:'#2a2a44',fontSize:'11px',fontStyle:'italic',marginBottom:'8px',border:'1px dashed #1a1a2e',borderRadius:'8px'}}>Sin track — pide al DJ_IA o carga uno</div>
        )}
        <Bars active={ds.isPlaying} color={color}/>
        <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
          <button onClick={function(){ds.isPlaying?pauseDeck(deck):playDeck(deck);}} style={B(color,ds.isPlaying)}>{ds.isPlaying?'⏸ PAUSA':'▶ PLAY'}</button>
          <select onChange={function(e){var tr=library.find(function(x){return String(x.id)===e.target.value;});if(tr)loadTrack(tr,deck);}} style={SEL} value="">
            <option value="">Cargar en {deck}...</option>
            {library.map(function(tr){return <option key={tr.id} value={String(tr.id)}>{tr.title} — {tr.artist}</option>;})}
          </select>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'6px',marginTop:'7px'}}>
          <span style={{color:'#333',fontSize:'9px'}}>VOL {deck}</span>
          <div style={{flex:1,height:'3px',background:'#1a1a2e',borderRadius:'2px',overflow:'hidden'}}>
            <div style={{width:ds.volume+'%',height:'100%',background:color,transition:'width .1s'}}/>
          </div>
          <span style={{color:color,fontSize:'9px',fontFamily:"'Orbitron',monospace"}}>{ds.volume}%</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{background:'#080810',minHeight:'100vh',fontFamily:"'Rajdhani','Segoe UI',sans-serif",color:'#e0e0f0'}}>
      <style>{css}</style>
      <div style={{background:'rgba(0,0,0,.7)',borderBottom:'1px solid rgba(0,255,200,.15)',padding:'10px 18px',display:'flex',justifyContent:'space-between',alignItems:'center',backdropFilter:'blur(12px)',position:'sticky',top:0,zIndex:100}}>
        <div>
          <div style={{fontFamily:"'Orbitron',monospace",color:'#00ffcc',fontSize:'16px',letterSpacing:'4px',textShadow:'0 0 20px #00ffcc55'}}>DJ_IA SYSTEM</div>
          <div style={{color:'#333',fontSize:'9px',letterSpacing:'3px',marginTop:'1px'}}>AI-POWERED MIXER · DEEZER PREVIEWS</div>
        </div>
        <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
          {loadingLib?<span style={{color:'#ffaa00',fontSize:'10px',animation:'pulse 1s infinite'}}>CARGANDO...</span>:<span style={{color:'#00ff88',fontSize:'10px'}}>{library.length} TRACKS</span>}
          <button onClick={function(){window.open('/projector','djia_projector','width=1280,height=720');}} style={B('#ff00aa',false)}>PROYECTOR</button>
          <button onClick={function(){setAutoMix(function(x){return !x;});}} style={B(autoMix?'#00ffcc':'#444',autoMix)}>AUTO {autoMix?'ON':'OFF'}</button>
          <button onClick={function(){setTab(function(t){return t==='mixer'?'library':'mixer';});}} style={B('#8866ff',false)}>{tab==='mixer'?'BIBLIOTECA':'MIXER'}</button>
        </div>
      </div>

      <div style={{padding:'12px 14px',display:'flex',flexDirection:'column',gap:'10px'}}>
        {tab==='mixer' ? (
          <div>
            <div style={{display:'flex',gap:'10px'}}>
              {DeckUI('A',deckA,'#00ffcc')}
              <div style={{width:'125px',flexShrink:0,background:'rgba(0,0,0,.5)',border:'1px solid rgba(255,255,255,.04)',borderRadius:'12px',padding:'12px',display:'flex',flexDirection:'column',alignItems:'center',gap:'9px'}}>
                <span style={{fontFamily:"'Orbitron',monospace",fontSize:'8px',letterSpacing:'2px',color:'rgba(0,255,200,.3)'}}>MIXER</span>
                <div>
                  <div style={{fontFamily:"'Orbitron',monospace",fontSize:'22px',color:'#ff00aa',textShadow:'0 0 15px #ff00aa77',textAlign:'center'}}>{curBPM}</div>
                  <div style={{color:'#222',fontSize:'8px',letterSpacing:'2px',textAlign:'center'}}>BPM</div>
                </div>
                <VUMeter active={deckA.isPlaying||deckB.isPlaying}/>
                <div style={{width:'100%'}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'8px',marginBottom:'4px'}}>
                    <span style={{color:'#00ffcc'}}>A</span><span style={{color:'#222'}}>XFADER</span><span style={{color:'#ff00aa'}}>B</span>
                  </div>
                  <input type="range" min="0" max="100" value={crossfader} onChange={function(e){var cf=Number(e.target.value);setCF(cf);setVols(cf);}} style={{width:'100%'}}/>
                  <div style={{textAlign:'center',color:'#333',fontSize:'8px',marginTop:'3px'}}>{crossfader<20?'A':crossfader>80?'B':'MIX'}</div>
                </div>
                <button onClick={function(){doCrossfade(activeDeck,activeDeck==='A'?'B':'A');}} disabled={fading}
                  style={{width:'100%',padding:'7px 4px',background:fading?'linear-gradient(135deg,#ff00aa,#00ffcc)':'transparent',color:fading?'#000':'#ff00aa',border:'1px solid #ff00aa',borderRadius:'7px',cursor:'pointer',fontSize:'9px',fontFamily:"'Orbitron',monospace",letterSpacing:'1px',fontWeight:'700',transition:'all .3s'}}>
                  {fading?'FADING...':'AUTO FADE'}
                </button>
              </div>
              {DeckUI('B',deckB,'#ff00aa')}
            </div>
            <div style={{display:'flex',background:'rgba(0,0,0,.35)',border:'1px solid rgba(255,255,255,.05)',borderRadius:'12px',overflow:'hidden',marginTop:'10px'}}>
              <div style={{flex:1,padding:'12px',display:'flex',flexDirection:'column',height:'265px',borderRight:'1px solid rgba(255,255,255,.05)'}}>
                <span style={{...LBL,color:'#8866ff'}}>DJ_IA CONSOLE</span>
                <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:'8px',marginBottom:'9px',paddingRight:'4px'}}>
                  {messages.map(function(m,i){
                    return (
                      <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                        <div style={{background:m.role==='dj'?'rgba(0,255,200,.04)':'rgba(136,102,255,.1)',border:'1px solid '+(m.role==='dj'?'rgba(0,255,200,.15)':'rgba(136,102,255,.2)'),borderRadius:m.role==='dj'?'12px 12px 12px 3px':'12px 12px 3px 12px',padding:'8px 12px',maxWidth:'84%',fontSize:'12px',lineHeight:'1.55',color:m.role==='dj'?'#ccc':'#aaa'}}>
                          {m.role==='dj'&&<span style={{color:'#00ffcc',fontSize:'9px',display:'block',marginBottom:'3px',letterSpacing:'1px',fontFamily:"'Orbitron',monospace"}}>DJ_IA</span>}
                          {m.content}
                        </div>
                      </div>
                    );
                  })}
                  {loading&&<div style={{color:'rgba(0,255,200,.3)',fontSize:'11px',animation:'pulse .8s infinite'}}>DJ_IA armando el set...</div>}
                  <div ref={chatEnd}/>
                </div>
                <div style={{display:'flex',gap:'7px'}}>
                  <input value={input} onChange={function(e){setInput(e.target.value);}} onKeyDown={function(e){if(e.key==='Enter')sendMessage(input);}} placeholder="Ej: primera hora reggaeton, 80 universitarios..." style={IN} disabled={loading}/>
                  <button onClick={function(){sendMessage(input);}} disabled={loading} style={{...B('#00ffcc',!loading),padding:'8px 14px'}}>ENVIAR</button>
                </div>
              </div>
              <div style={{width:'185px',padding:'12px',overflowY:'auto',height:'265px'}}>
                <span style={{...LBL,color:'#ffaa00'}}>QUEUE ({queue.length})</span>
                {queue.length===0
                  ?<div style={{color:'#1e1e2e',fontSize:'11px',fontStyle:'italic',lineHeight:'1.7'}}>Cola vacia. Dile al DJ_IA que arme el set.</div>
                  :queue.map(function(t,i){
                    return <div key={i} style={{padding:'6px 8px',marginBottom:'5px',background:i===0?'rgba(255,170,0,.06)':'rgba(255,255,255,.02)',borderLeft:'3px solid '+(i===0?'#ffaa00':'#222'),borderRadius:'0 6px 6px 0'}}>
                      <div style={{fontSize:'11px',color:i===0?'#ffdd88':'#666'}}>{i+1}. {t.title}</div>
                      <div style={{fontSize:'10px',color:'#333'}}>{t.genre}</div>
                    </div>;
                  })
                }
              </div>
            </div>
          </div>
        ) : (
          <div style={{background:'rgba(0,0,0,.3)',border:'1px solid rgba(255,255,255,.04)',borderRadius:'12px',padding:'16px'}}>
            <span style={{...LBL,color:'#00ffcc',fontSize:'10px'}}>BIBLIOTECA · MUSICA REAL VIA DEEZER</span>
            <div style={{background:'rgba(0,255,200,.02)',border:'1px solid rgba(0,255,200,.12)',borderRadius:'10px',padding:'12px',marginBottom:'14px'}}>
              <div style={{color:'#00ffcc',fontSize:'9px',letterSpacing:'2px',marginBottom:'8px',fontFamily:"'Orbitron',monospace"}}>BUSCAR CUALQUIER ARTISTA O CANCION</div>
              <div style={{display:'flex',gap:'8px'}}>
                <input value={searchQ} onChange={function(e){setSearchQ(e.target.value);}} onKeyDown={function(e){if(e.key==='Enter')doSearch();}} placeholder="Artista o cancion..." style={{...IN,flex:1}}/>
                <button onClick={doSearch} disabled={searching} style={{...B('#00ffcc',true),padding:'8px 16px'}}>{searching?'...':'BUSCAR'}</button>
              </div>
              {searchRes.length>0&&(
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:'6px',marginTop:'10px'}}>
                  {searchRes.map(function(t){
                    return <div key={t.id} style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'8px',padding:'8px',display:'flex',gap:'8px',alignItems:'center'}}>
                      {t.cover&&<img src={t.cover} alt="" style={{width:'40px',height:'40px',borderRadius:'4px',objectFit:'cover',flexShrink:0}}/>}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{color:'#ddd',fontSize:'11px',fontWeight:'600',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                        <div style={{color:'#555',fontSize:'10px'}}>{t.artist}</div>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',gap:'3px',flexShrink:0}}>
                        <button onClick={function(){loadTrack(t,'A');addToLib(t);}} style={{...B('#00ffcc'),fontSize:'9px',padding:'2px 7px'}}>A</button>
                        <button onClick={function(){loadTrack(t,'B');addToLib(t);}} style={{...B('#ff00aa'),fontSize:'9px',padding:'2px 7px'}}>B</button>
                        <button onClick={function(){addToLib(t);setQueue(function(q){return q.concat([t]);});}} style={{...B('#ffaa00'),fontSize:'9px',padding:'2px 7px'}}>+Q</button>
                      </div>
                    </div>;
                  })}
                </div>
              )}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))',gap:'7px'}}>
              {library.map(function(t){
                return <div key={t.id} style={{background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.05)',borderRadius:'8px',padding:'9px',display:'flex',gap:'8px',alignItems:'center'}}>
                  {t.cover&&<img src={t.cover} alt="" style={{width:'44px',height:'44px',borderRadius:'5px',objectFit:'cover',flexShrink:0}}/>}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{color:'#ddd',fontSize:'12px',fontWeight:'600',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                    <div style={{color:'#555',fontSize:'10px',marginTop:'1px'}}>{t.artist}</div>
                    <div style={{display:'flex',gap:'6px',marginTop:'4px',alignItems:'center'}}>
                      <span style={{color:'#00ffcc',fontSize:'9px',background:'rgba(0,255,200,.07)',padding:'1px 6px',borderRadius:'3px',border:'1px solid #00ffcc22'}}>{t.genre}</span>
                      <span style={{color:'#ff00aa',fontSize:'9px',fontFamily:"'Orbitron',monospace"}}>{t.bpm}</span>
                      <EnergyBar energy={t.energy}/>
                    </div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:'3px',flexShrink:0}}>
                    <button onClick={function(){loadTrack(t,'A');}} style={{...B('#00ffcc'),fontSize:'9px',padding:'3px 8px'}}>A</button>
                    <button onClick={function(){loadTrack(t,'B');}} style={{...B('#ff00aa'),fontSize:'9px',padding:'3px 8px'}}>B</button>
                    <button onClick={function(){setQueue(function(q){return q.concat([t]);});}} style={{...B('#ffaa00'),fontSize:'9px',padding:'3px 8px'}}>+Q</button>
                  </div>
                </div>;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

