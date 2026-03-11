import { useState, useEffect, useRef, useCallback } from "react";

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

function buildPrompt(libStr, dA, dB, cf, q) {
  var aInfo = dA.track ? ('"'+dA.track.title+'" ('+(dA.isPlaying?'SONANDO':'pausa')+')') : 'vacio';
  var bInfo = dB.track ? ('"'+dB.track.title+'" ('+(dB.isPlaying?'SONANDO':'pausa')+')') : 'vacio';
  var cfInfo = cf<25 ? 'A dominante' : cf>75 ? 'B dominante' : 'mezcla central';
  var qInfo = q.length>0 ? q.map(function(t){return '"'+t.title+'"';}).join(', ') : 'vacia';
  return 'Eres DJ_IA, DJ profesional. Responde en espaniol con carisma.\n\n' +
    'BIBLIOTECA:\n' + libStr + '\n\n' +
    'ESTADO:\nDeck A: ' + aInfo + '\nDeck B: ' + bInfo + '\nXFader: ' + cfInfo + '\nCola: ' + qInfo + '\n\n' +
    'RESPONDE SOLO JSON:\n{"message":"texto","actions":[{"type":"load","deck":"A","trackId":1},{"type":"play","deck":"A"},{"type":"crossfade","from":"A","to":"B"},{"type":"queue","trackIds":[2,3]},{"type":"pause","deck":"A"}]}\nactions es opcional.';
}

function EnergyBar(props) {
  var energy = props.energy;
  return React.createElement('div', {style:{display:'flex',gap:'2px',alignItems:'flex-end'}},
    Array.from({length:10}).map(function(_,i){
      return React.createElement('div', {key:i, style:{width:'4px',height:(4+i*1.4)+'px',background:i<energy?(i<4?'#00ff88':i<7?'#ffee00':'#ff4455'):'#1e1e2e',borderRadius:'1px'}});
    })
  );
}

function VUMeter(props) {
  var active = props.active;
  var bars = useState(Array(16).fill(2));
  var setBars = bars[1];
  bars = bars[0];
  useEffect(function() {
    if (!active) { setBars(Array(16).fill(2)); return; }
    var id = setInterval(function() {
      setBars(Array(16).fill(0).map(function(_,i){ return 2+Math.random()*Math.max(0,16-i)*0.85; }));
    }, 80);
    return function(){ clearInterval(id); };
  }, [active]);
  return (
    <div style={{display:'flex',gap:'2px',alignItems:'flex-end',height:'50px'}}>
      {bars.map(function(h,i){
        return <div key={i} style={{width:'6px',height:(h*3)+'px',background:i<8?'#00ff88':i<12?'#ffee00':'#ff4455',borderRadius:'1px 1px 0 0',transition:'height 0.08s ease-out'}}/>;
      })}
    </div>
  );
}

export default function DJIA() {
  var libState = useState([]);
  var library = libState[0]; var setLibrary = libState[1];
  var deckAState = useState({track:null,isPlaying:false,volume:100});
  var deckA = deckAState[0]; var setDeckA = deckAState[1];
  var deckBState = useState({track:null,isPlaying:false,volume:0});
  var deckB = deckBState[0]; var setDeckB = deckBState[1];
  var cfState = useState(0); var crossfader = cfState[0]; var setCF = cfState[1];
  var queueState = useState([]); var queue = queueState[0]; var setQueue = queueState[1];
  var msgState = useState([{role:'dj',content:'DJ_IA online. Cuentame el evento, publico y generos por hora para armar tu set.'}]);
  var messages = msgState[0]; var setMessages = msgState[1];
  var inputState = useState(''); var input = inputState[0]; var setInput = inputState[1];
  var loadingState = useState(false); var loading = loadingState[0]; var setLoading = loadingState[1];
  var loadingLibState = useState(true); var loadingLib = loadingLibState[0]; var setLoadingLib = loadingLibState[1];
  var tabState = useState('mixer'); var tab = tabState[0]; var setTab = tabState[1];
  var autoMixState = useState(false); var autoMix = autoMixState[0]; var setAutoMix = autoMixState[1];
  var activeDeckState = useState('A'); var activeDeck = activeDeckState[0]; var setActive = activeDeckState[1];
  var fadingState = useState(false); var fading = fadingState[0]; var setFading = fadingState[1];
  var searchQState = useState(''); var searchQ = searchQState[0]; var setSearchQ = searchQState[1];
  var searchResState = useState([]); var searchRes = searchResState[0]; var setSearchRes = searchResState[1];
  var searchingState = useState(false); var searching = searchingState[0]; var setSearching = searchingState[1];

  var audioCtxRef = useRef(null);
  var audioA = useRef(null);
  var audioB = useRef(null);
  var gainA = useRef(null);
  var gainB = useRef(null);
  var fadeRef = useRef(null);
  var convRef = useRef([]);
  var chatEnd = useRef(null);
  var autoRef = useRef(false);
  var trackEndedRef = useRef(null);
  autoRef.current = autoMix;

  useEffect(function() {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;
    var elA = new Audio(); elA.crossOrigin='anonymous';
    var elB = new Audio(); elB.crossOrigin='anonymous';
    audioA.current = elA; audioB.current = elB;
    var srcA = ctx.createMediaElementSource(elA);
    var srcB = ctx.createMediaElementSource(elB);
    var gA = ctx.createGain(); gA.gain.value = 1;
    var gB = ctx.createGain(); gB.gain.value = 0;
    gainA.current = gA; gainB.current = gB;
    srcA.connect(gA); gA.connect(ctx.destination);
    srcB.connect(gB); gB.connect(ctx.destination);
    elA.addEventListener('ended', function(){ if(autoRef.current && trackEndedRef.current) trackEndedRef.current('A'); });
    elB.addEventListener('ended', function(){ if(autoRef.current && trackEndedRef.current) trackEndedRef.current('B'); });
    return function(){ elA.pause(); elB.pause(); try{ctx.close();}catch(e){} };
  }, []);

  useEffect(function() {
    var cancelled = false;
    async function load() {
      var tracks = [];
      for (var i=0; i<INITIAL_SEARCHES.length; i++) {
        var s = INITIAL_SEARCHES[i];
        try {
          var res = await fetch('/api/deezer?q='+encodeURIComponent(s.query));
          var data = await res.json();
          if (data.data && data.data[0] && data.data[0].preview) {
            var item = data.data[0];
            tracks.push({id:item.id,title:item.title,artist:item.artist.name,preview:item.preview,cover:item.album.cover_medium,genre:s.genre,bpm:s.bpm,energy:s.energy});
          }
        } catch(e){}
      }
      if (!cancelled) { setLibrary(tracks); setLoadingLib(false); }
    }
    load();
    return function(){ cancelled=true; };
  }, []);

  var setVols = useCallback(function(cf) {
    var vA = Math.max(0,Math.min(1,(100-cf)/100));
    var vB = Math.max(0,Math.min(1,cf/100));
    if(gainA.current) gainA.current.gain.value = vA;
    if(gainB.current) gainB.current.gain.value = vB;
    setDeckA(function(d){return Object.assign({},d,{volume:Math.round(vA*100)});});
    setDeckB(function(d){return Object.assign({},d,{volume:Math.round(vB*100)});});
  }, []);

  var loadTrack = useCallback(function(track, deck) {
    var el = deck==='A'?audioA.current:audioB.current;
    if(el){ el.src=track.preview; el.load(); }
    if(audioCtxRef.current && audioCtxRef.current.state==='suspended') audioCtxRef.current.resume();
    (deck==='A'?setDeckA:setDeckB)(function(d){return Object.assign({},d,{track:track,isPlaying:false});});
  }, []);

  var playDeck = useCallback(function(deck) {
    var el = deck==='A'?audioA.current:audioB.current;
    if(audioCtxRef.current && audioCtxRef.current.state==='suspended') audioCtxRef.current.resume();
    if(el) el.play().catch(function(){});
    (deck==='A'?setDeckA:setDeckB)(function(d){return Object.assign({},d,{isPlaying:true});});
  }, []);

  var pauseDeck = useCallback(function(deck) {
    var el = deck==='A'?audioA.current:audioB.current;
    if(el) el.pause();
    (deck==='A'?setDeckA:setDeckB)(function(d){return Object.assign({},d,{isPlaying:false});});
  }, []);

  var doCrossfade = useCallback(function(from, to, ms) {
    var dur = ms||5000;
    if(fadeRef.current) clearInterval(fadeRef.current);
    setFading(true);
    var start = from==='A'?0:100; var end = from==='A'?100:0;
    var steps=60; var step=0;
    fadeRef.current = setInterval(function(){
      step++;
      var cf = start+(end-start)*(step/steps);
      setCF(cf); setVols(cf);
      if(step>=steps){ clearInterval(fadeRef.current); setFading(false); setActive(to); pauseDeck(from); }
    }, dur/steps);
  }, [setVols, pauseDeck]);

  trackEndedRef.current = function(deck) {
    setQueue(function(q){
      if(!q.length) return q;
      var next=q[0]; var other=deck==='A'?'B':'A';
      loadTrack(next,other);
      setTimeout(function(){ playDeck(other); doCrossfade(deck,other); }, 800);
      return q.slice(1);
    });
  };

  useEffect(function(){ if(chatEnd.current) chatEnd.current.scrollIntoView({behavior:'smooth'}); }, [messages]);

  async function sendMessage(msg) {
    if(!msg.trim()||loading) return;
    setInput('');
    setMessages(function(m){return m.concat([{role:'user',content:msg}]);});
    setLoading(true);
    convRef.current = convRef.current.concat([{role:'user',content:msg}]);
    var libStr = library.map(function(t){return 'ID:'+t.id+' | "'+t.title+'" - '+t.artist+' | '+t.genre+' | '+t.bpm+'BPM | energia:'+t.energy+'/10';}).join('\n');
    var system = buildPrompt(libStr, deckA, deckB, crossfader, queue);
    try {
      var res = await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system:system,messages:convRef.current})});
      var data = await res.json();
      var raw = (data.content&&data.content[0]&&data.content[0].text)||'{"message":"Error","actions":[]}';
      var parsed; try{parsed=JSON.parse(raw.replace(/```json|```/g,'').trim());}catch(e){parsed={message:raw,actions:[]};}
      (parsed.actions||[]).forEach(function(a){
        if(a.type==='load'){var t=library.find(function(x){return x.id===a.trackId;});if(t)loadTrack(t,a.deck);}
        else if(a.type==='play'){(function(d){setTimeout(function(){playDeck(d);},600);})(a.deck);}
        else if(a.type==='crossfade'){(function(f,t){setTimeout(function(){doCrossfade(f,t);},1000);})(a.from,a.to);}
        else if(a.type==='queue'){setQueue(function(q){return q.concat((a.trackIds||[]).map(function(id){return library.find(function(x){return x.id===id;});}).filter(Boolean));});}
        else if(a.type==='pause'){pauseDeck(a.deck);}
      });
      setMessages(function(m){return m.concat([{role:'dj',content:parsed.message}]);});
      convRef.current = convRef.current.concat([{role:'assistant',content:raw}]);
    } catch(e){ setMessages(function(m){return m.concat([{role:'dj',content:'Error: '+e.message}]);}); }
    setLoading(false);
  }

  async function doSearch() {
    if(!searchQ.trim()) return;
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

  function addToLib(t){setLibrary(function(l){return l.find(function(x){return x.id===t.id;})?l:l.concat([t]);});}

  var css = '@import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Rajdhani:wght@500;600;700&display=swap");'+
    '*{box-sizing:border-box;margin:0;padding:0;}body{background:#080810;}'+
    '::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:#0a0a18;}::-webkit-scrollbar-thumb{background:#00ffcc33;border-radius:2px;}'+
    'input[type=range]{-webkit-appearance:none;height:4px;border-radius:2px;background:#1a1a2e;outline:none;cursor:pointer;}'+
    'input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#00ffcc;cursor:pointer;}'+
    '@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}';

  function B(c,solid){return {background:solid?c:'transparent',color:solid?'#000':c,border:'1px solid '+c,borderRadius:'6px',padding:'5px 12px',cursor:'pointer',fontSize:'12px',fontWeight:'700',transition:'all .15s'};}
  var IN = {flex:1,background:'#0a0a18',border:'1px solid #1a1a2e',borderRadius:'8px',padding:'8px 12px',color:'#ccc',fontSize:'12px',outline:'none'};
  var SEL = {background:'#0d0d1a',border:'1px solid #1a1a2e',borderRadius:'6px',padding:'5px 8px',color:'#777',fontSize:'11px',flex:1,outline:'none'};
  var LBL = {fontFamily:"'Orbitron',monospace",fontSize:'8px',letterSpacing:'3px',marginBottom:'8px',display:'block'};
  function DC(live){return {flex:1,background:live?'rgba(0,255,200,.03)':'rgba(255,255,255,.015)',border:'1px solid '+(live?'rgba(0,255,200,.3)':'rgba(255,255,255,.05)'),borderRadius:'12px',padding:'12px',transition:'all .4s'};}

  var curBPM = activeDeck==='A' ? ((deckA.track&&deckA.track.bpm)||(deckB.track&&deckB.track.bpm)||'--') : ((deckB.track&&deckB.track.bpm)||(deckA.track&&deckA.track.bpm)||'--');

  function DeckUI(deck, ds, color) {
    var live = activeDeck===deck;
    var t = ds.track;
    return (
      <div style={DC(live)}>
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
        ) : <div style={{height:'60px',display:'flex',alignItems:'center',justifyContent:'center',color:'#2a2a44',fontSize:'11px',fontStyle:'italic',marginBottom:'8px',border:'1px dashed #1a1a2e',borderRadius:'8px'}}>Sin track</div>}
        <div style={{height:'36px',background:'#0a0a18',borderRadius:'6px',display:'flex',alignItems:'center',padding:'0 8px',gap:'2px',marginBottom:'8px'}}>
          {Array.from({length:32}).map(function(_,i){
            var h = ds.isPlaying ? (4+Math.random()*24) : 4;
            return <div key={i} style={{flex:1,height:h+'px',background:color,opacity:0.7,borderRadius:'1px',transition:'height 0.12s'}}/>;
          })}
        </div>
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
          <div style={{color:'#333',fontSize:'9px',letterSpacing:'3px',marginTop:'1px'}}>AI-POWERED MIXER · POWERED BY DEEZER</div>
        </div>
        <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
          {loadingLib ? <span style={{color:'#ffaa00',fontSize:'10px',animation:'pulse 1s infinite'}}>CARGANDO...</span>
            : <span style={{color:'#00ff88',fontSize:'10px'}}>{library.length} TRACKS</span>}
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
                <div><div style={{fontFamily:"'Orbitron',monospace",fontSize:'22px',color:'#ff00aa',textShadow:'0 0 15px #ff00aa77',textAlign:'center'}}>{curBPM}</div><div style={{color:'#222',fontSize:'8px',letterSpacing:'2px',textAlign:'center'}}>BPM</div></div>
                <VUMeter active={deckA.isPlaying||deckB.isPlaying}/>
                <div style={{width:'100%'}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'8px',marginBottom:'4px'}}><span style={{color:'#00ffcc'}}>A</span><span style={{color:'#222'}}>XFADER</span><span style={{color:'#ff00aa'}}>B</span></div>
                  <input type="range" min="0" max="100" value={crossfader} onChange={function(e){var cf=Number(e.target.value);setCF(cf);setVols(cf);}} style={{width:'100%'}}/>
                  <div style={{textAlign:'center',color:'#333',fontSize:'8px',marginTop:'3px'}}>{crossfader<20?'A':crossfader>80?'B':'MIX'}</div>
                </div>
                <button onClick={function(){doCrossfade(activeDeck,activeDeck==='A'?'B':'A');}} disabled={fading} style={{width:'100%',padding:'7px 4px',background:fading?'linear-gradient(135deg,#ff00aa,#00ffcc)':'transparent',color:fading?'#000':'#ff00aa',border:'1px solid #ff00aa',borderRadius:'7px',cursor:'pointer',fontSize:'9px',fontFamily:"'Orbitron',monospace",letterSpacing:'1px',fontWeight:'700',transition:'all .3s'}}>
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
                    return <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}><div style={{background:m.role==='dj'?'rgba(0,255,200,.04)':'rgba(136,102,255,.1)',border:'1px solid '+(m.role==='dj'?'rgba(0,255,200,.15)':'rgba(136,102,255,.2)'),borderRadius:m.role==='dj'?'12px 12px 12px 3px':'12px 12px 3px 12px',padding:'8px 12px',maxWidth:'84%',fontSize:'12px',lineHeight:'1.55',color:m.role==='dj'?'#ccc':'#aaa'}}>
                      {m.role==='dj'&&<span style={{color:'#00ffcc',fontSize:'9px',display:'block',marginBottom:'3px',letterSpacing:'1px',fontFamily:"'Orbitron',monospace"}}>DJ_IA</span>}
                      {m.content}</div></div>;
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
                {queue.length===0?<div style={{color:'#1e1e2e',fontSize:'11px',fontStyle:'italic',lineHeight:'1.7'}}>Cola vacia.</div>
                  :queue.map(function(t,i){return <div key={i} style={{padding:'6px 8px',marginBottom:'5px',background:i===0?'rgba(255,170,0,.06)':'rgba(255,255,255,.02)',borderLeft:'3px solid '+(i===0?'#ffaa00':'#222'),borderRadius:'0 6px 6px 0'}}><div style={{fontSize:'11px',color:i===0?'#ffdd88':'#666'}}>{i+1}. {t.title}</div><div style={{fontSize:'10px',color:'#333'}}>{t.genre}</div></div>;})
                }
              </div>
            </div>
          </div>
        ) : (
          <div style={{background:'rgba(0,0,0,.3)',border:'1px solid rgba(255,255,255,.04)',borderRadius:'12px',padding:'16px'}}>
            <span style={{...LBL,color:'#00ffcc',fontSize:'10px'}}>BIBLIOTECA · MUSICA VIA DEEZER</span>
            <div style={{background:'rgba(0,255,200,.02)',border:'1px solid rgba(0,255,200,.12)',borderRadius:'10px',padding:'12px',marginBottom:'14px'}}>
              <div style={{color:'#00ffcc',fontSize:'9px',letterSpacing:'2px',marginBottom:'8px',fontFamily:"'Orbitron',monospace"}}>BUSCAR MUSICA</div>
              <div style={{display:'flex',gap:'8px'}}>
                <input value={searchQ} onChange={function(e){setSearchQ(e.target.value);}} onKeyDown={function(e){if(e.key==='Enter')doSearch();}} placeholder="Artista o cancion..." style={{...IN,flex:1}}/>
                <button onClick={doSearch} disabled={searching} style={{...B('#00ffcc',true),padding:'8px 16px'}}>{searching?'...':'BUSCAR'}</button>
              </div>
              {searchRes.length>0&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:'6px',marginTop:'10px'}}>
                {searchRes.map(function(t){return <div key={t.id} style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'8px',padding:'8px',display:'flex',gap:'8px',alignItems:'center'}}>
                  {t.cover&&<img src={t.cover} alt="" style={{width:'40px',height:'40px',borderRadius:'4px',objectFit:'cover',flexShrink:0}}/>}
                  <div style={{flex:1,minWidth:0}}><div style={{color:'#ddd',fontSize:'11px',fontWeight:'600',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div><div style={{color:'#555',fontSize:'10px'}}>{t.artist}</div></div>
                  <div style={{display:'flex',flexDirection:'column',gap:'3px',flexShrink:0}}>
                    <button onClick={function(){loadTrack(t,'A');addToLib(t);}} style={{...B('#00ffcc'),fontSize:'9px',padding:'2px 7px'}}>A</button>
                    <button onClick={function(){loadTrack(t,'B');addToLib(t);}} style={{...B('#ff00aa'),fontSize:'9px',padding:'2px 7px'}}>B</button>
                    <button onClick={function(){addToLib(t);setQueue(function(q){return q.concat([t]);});}} style={{...B('#ffaa00'),fontSize:'9px',padding:'2px 7px'}}>+Q</button>
                  </div>
                </div>;})}
              </div>}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))',gap:'7px'}}>
              {library.map(function(t){return <div key={t.id} style={{background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.05)',borderRadius:'8px',padding:'9px',display:'flex',gap:'8px',alignItems:'center'}}>
                {t.cover&&<img src={t.cover} alt="" style={{width:'44px',height:'44px',borderRadius:'5px',objectFit:'cover',flexShrink:0}}/>}
                <div style={{flex:1,minWidth:0}}><div style={{color:'#ddd',fontSize:'12px',fontWeight:'600',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div><div style={{color:'#555',fontSize:'10px',marginTop:'1px'}}>{t.artist}</div><div style={{display:'flex',gap:'6px',marginTop:'4px',alignItems:'center'}}><span style={{color:'#00ffcc',fontSize:'9px',background:'rgba(0,255,200,.07)',padding:'1px 6px',borderRadius:'3px',border:'1px solid #00ffcc22'}}>{t.genre}</span><span style={{color:'#ff00aa',fontSize:'9px',fontFamily:"'Orbitron',monospace"}}>{t.bpm}</span><EnergyBar energy={t.energy}/></div></div>
                <div style={{display:'flex',flexDirection:'column',gap:'3px',flexShrink:0}}>
                  <button onClick={function(){loadTrack(t,'A');}} style={{...B('#00ffcc'),fontSize:'9px',padding:'3px 8px'}}>A</button>
                  <button onClick={function(){loadTrack(t,'B');}} style={{...B('#ff00aa'),fontSize:'9px',padding:'3px 8px'}}>B</button>
                  <button onClick={function(){setQueue(function(q){return q.concat([t]);});}} style={{...B('#ffaa00'),fontSize:'9px',padding:'3px 8px'}}>+Q</button>
                </div>
              </div>;})}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
