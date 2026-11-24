/* Original tracker score: pulse, triangle bass and a filtered noise channel. */
window.ClinicSound=(()=>{
  'use strict';
  const names={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  const midi=s=>(+s.at(-1)+1)*12+names[s[0]]+(s[1]==='#'?1:s[1]==='b'?-1:0);
  const hz=m=>440*2**((m-69)/12);
  function phrase(text){
    const cells=text.trim().split(/\s+/).map(s=>s==='.'?null:s==='-'?false:midi(s));
    return Array.from({length:8},(_,i)=>{
      if(!cells[i])return null;
      let n=1;
      while(cells[i+n]===false)n++;
      return [cells[i],n];
    });
  }
  function arrangement(bpm, feel, bars, lead, bass, drums, color){
    return {bpm,feel,lead,bass,drums,color,bars:bars.map(([root,chord,melody])=>[midi(root),chord.split(' ').map(midi),phrase(melody)])};
  }
  const songs={
    home:arrangement(101,.08,[
      ['A2','A3 C4 E4 B4','E5 - . G5 A5 - E5 .'],
      ['F2','F3 A3 C4 E4','C5 - . E5 G5 - A5 G5'],
      ['D2','D3 F3 A3 C4','F5 - E5 D5 A4 - . C5'],
      ['E2','E3 G#3 B3 D4','B4 - . G#4 B4 D5 E5 .'],
      ['A2','A3 C4 E4 G4','C6 - B5 A5 G5 E5 G5 .'],
      ['F2','F3 A3 C4 E4','A5 - E5 . G5 F5 E5 .'],
      ['D2','D3 A3 C4 E4','F5 C5 D5 - E5 G5 F5 .'],
      ['E2','E3 G#3 B3 D4','E5 - D5 B4 A4 - . .'],
    ],'pulse','soft','brush','#e897a8'),
    novel:arrangement(72,0,[
      ['C3','C4 Eb4 G4 D5','G5 - - . D5 - . .'],
      ['Ab2','Ab3 C4 Eb4 G4','Eb5 - . Bb4 C5 - - .'],
      ['F2','F3 Ab3 C4 G4','C5 - - . G4 Ab4 C5 .'],
      ['G2','G3 B3 D4 F4','B4 - . D5 G5 - - .'],
      ['Eb3','Eb4 G4 Bb4 D5','Bb5 - - . G5 - D5 .'],
      ['Ab2','Ab3 C4 Eb4 G4','Eb5 - - . C5 - Bb4 .'],
      ['F2','F3 Ab3 C4 Eb4','Ab4 C5 D5 - F5 - . .'],
      ['G2','G3 Bb3 D4 F4','G5 - F5 - D5 - . .'],
    ],'triangle','soft','none','#bdb0e8'),
    doctor:arrangement(92,.14,[
      ['D3','D4 F4 A4 C5','A5 . G5 F5 . E5 F5 .'],
      ['G2','G3 Bb3 D4 F4','D5 - . F5 G5 . F5 .'],
      ['C3','C4 E4 G4 Bb4','E5 . G5 Bb5 - G5 A5 .'],
      ['F2','F3 A3 C4 E4','C6 - . A5 G5 E5 F5 .'],
      ['Bb2','Bb3 D4 F4 A4','D6 - C6 . A5 F5 G5 .'],
      ['G2','G3 Bb3 D4 F4','Bb5 A5 G5 . F5 - D5 .'],
      ['A2','A3 C#4 E4 G4','E5 . G5 A5 . D6 C#6 .'],
      ['D3','D4 F4 A4 E5','A5 . F5 E5 D5 - . .'],
    ],'pin','walk','brush','#e6ad90'),
    pulse:arrangement(109,0,[
      ['B2','B3 D4 F#4 A4','B4 . . F#5 . . D5 .'],
      ['B2','B3 D4 F#4 A4','A4 . . D5 . . F#5 .'],
      ['G2','G3 B3 D4 F#4','G4 . . D5 . . B4 .'],
      ['A2','A3 C#4 E4 G4','E5 . C#5 . B4 . . .'],
      ['B2','B3 D4 F#4 A4','B5 . . F#5 . . A5 .'],
      ['D3','D4 F#4 A4 B4','D6 . A5 . F#5 . E5 .'],
      ['G2','G3 B3 D4 F#4','G5 . . D5 . . B4 .'],
      ['F#2','F#3 A#3 C#4 E4','C#5 . E5 . A#4 - . .'],
    ],'pin','soft','meter','#a9d8c5'),
    puzzle:arrangement(113,.06,[
      ['F3','F4 Ab4 C5 Eb5','C6 . Ab5 C6 F5 . G5 Ab5'],
      ['Db3','Db4 F4 Ab4 C5','C6 . Eb6 C6 Ab5 - F5 .'],
      ['Ab2','Ab3 C4 Eb4 Bb4','Eb5 G5 Ab5 . C6 Ab5 Eb5 .'],
      ['Eb3','Eb4 G4 Bb4 Db5','Bb5 - G5 . Bb5 G5 Eb5 .'],
      ['F3','F4 Ab4 C5 Eb5','F6 . Eb6 C6 Ab5 C6 F6 .'],
      ['Db3','Db4 F4 Ab4 C5','Db6 . C6 Ab5 F5 . Ab5 .'],
      ['Bb2','Bb3 Db4 F4 Ab4','F5 . Bb5 Db6 C6 Ab5 Bb5 .'],
      ['C3','C4 E4 G4 Bb4','G5 Bb5 C6 . E5 G5 F5 .'],
    ],'pulse','walk','brush','#edc58c'),
    game:arrangement(150,0,[
      ['E2','E3 G3 B3 D4','E5 E5 G5 B5 . A5 G5 D5'],
      ['C2','C3 E3 G3 B3','C5 E5 G5 E5 A5 . G5 E5'],
      ['D2','D3 F#3 A3 C4','F#5 . A5 D6 C6 A5 F#5 .'],
      ['B2','B3 D#4 F#4 A4','B5 A5 F#5 D#5 E5 - B4 .'],
      ['E2','E3 G3 B3 D4','B5 B5 D6 E6 G6 E6 D6 B5'],
      ['G2','G3 B3 D4 F#4','A5 B5 D6 B5 G5 . A5 .'],
      ['C2','C3 E3 G3 B3','G5 E5 G5 B5 C6 B5 G5 .'],
      ['B2','B3 D#4 F#4 A4','F#5 A5 F#5 D#5 E5 - . .'],
    ],'pulse','drive','break','#f4a2b4'),
    alarm:arrangement(171,0,[
      ['A2','A3 C4 E4 G4','A5 . A5 C6 E6 C6 D6 Eb6'],
      ['F2','F3 A3 C4 E4','E6 C6 A5 F5 C6 B5 A5 .'],
      ['G2','G3 Bb3 D4 F4','G5 Bb5 D6 F6 D6 Bb5 D6 .'],
      ['E2','E3 G#3 B3 D4','B5 A5 G#5 E5 G#5 . B5 .'],
      ['A2','A3 C4 E4 G4','A5 C6 E6 G6 E6 A6 G6 E6'],
      ['D2','D3 F3 A3 C4','F6 D6 A5 C6 F5 A5 D6 .'],
      ['F2','F3 A3 C4 E4','C6 A5 F5 A5 C6 E6 D6 .'],
      ['E2','E3 G#3 B3 D4','B5 G#5 B5 E6 D6 C6 B5 E5'],
    ],'pin','drive','rush','#f5bb90'),
    rain:arrangement(159,.04,[
      ['D3','D4 F#4 A4 B4','A5 F#5 D5 F#5 B5 A5 F#5 .'],
      ['B2','B3 D4 F#4 A4','F#5 A5 B5 D6 B5 A5 F#5 .'],
      ['G2','G3 B3 D4 A4','G5 B5 D6 B5 A5 G5 E5 .'],
      ['A2','A3 C#4 E4 G4','E5 G5 A5 C#6 E6 C#6 A5 .'],
      ['D3','D4 F#4 A4 B4','D6 A5 F#5 A5 B5 D6 E6 .'],
      ['F#2','F#3 A3 C#4 E4','F#6 E6 C#6 A5 C#6 A5 F#5 .'],
      ['G2','G3 B3 D4 A4','G5 B5 D6 E6 D6 G5 B5 .'],
      ['A2','A3 C#4 E4 G4','A5 E5 G5 C#6 D6 - . .'],
    ],'pin','walk','rush','#c8bbff'),
  };
  const cues={
    ui:[['pin',635,765,.043,.034]], back:[['pulse',585,376,.10,.052]],
    select:[['pulse',440,660,.075,.07],['pin',880,0,.10,.045,.065]],
    chat:[['pulse',404,292,.075,.055],['pin',566,422,.061,.043,.055]],
    line:[['pin',720,580,.026,.022]], page:[['noise',1150,670,.078,.036],['pin',490,760,.085,.041,.025]],
    stroke:[['triangle',520,820,.14,.075],['pin',1046,0,.12,.036,.075]],
    praise:[['pin',523,0,.10,.068],['pulse',659,0,.13,.054,.06],['pin',1046,0,.19,.054,.12]],
    tea:[['noise',1270,440,.31,.088],['triangle',640,860,.18,.057,.05],['pin',1280,0,.17,.043,.19]],
    candy:[['noise',3800,1250,.12,.081],['pin',660,0,.095,.068,.025],['pulse',988,0,.14,.063,.10]],
    pulseStart:[['triangle',112,48,.13,.13],['triangle',94,44,.13,.10,.15]],
    pulseHit:[['triangle',155,58,.16,.15],['pin',880,0,.1,.055,.04]],
    pulseMiss:[['pulse',262,142,.13,.095]], ready:[['pin',784,0,.09,.065],['pin',1175,0,.17,.07,.085]],
    shot:[['pin',790,299,.072,.055],['noise',1360,430,.038,.039]], hit:[['noise',1040,280,.062,.13],['pulse',292,198,.065,.063]],
    kill:[['noise',790,290,.14,.13],['pulse',418,730,.105,.071]], hurt:[['triangle',154,46,.23,.22],['noise',1460,160,.19,.134]],
    pulse:[['triangle',73,43,.38,.22],['pulse',182,1120,.29,.104],['noise',660,2940,.28,.085]],
    wave:[['pin',440,0,.11,.082],['pin',659,0,.12,.077,.085],['pulse',880,0,.25,.089,.17]],
    combo:[['pin',784,0,.09,.068],['pin',988,0,.15,.087,.065]],
    bonus:[['pulse',523,0,.095,.081],['pin',659,0,.11,.071,.064],['pin',1046,0,.20,.080,.128]],
    unlock:[['triangle',294,0,.24,.09],['pulse',587,0,.12,.078,.035],['pin',880,0,.15,.080,.12],['pin',1175,0,.23,.072,.20]],
    over:[['pulse',392,0,.20,.092],['pulse',330,0,.17,.074,.11],['triangle',196,49,.50,.14,.22],['noise',580,170,.27,.082,.22]],
    pause:[['pulse',440,0,.09,.058],['pin',294,0,.11,.061,.06]], resume:[['pin',392,0,.079,.061],['pin',587,0,.11,.06,.04]],
    knock:[['noise',520,230,.12,.09],['triangle',100,52,.15,.15],['triangle',91,48,.15,.105,.18]],
    mark:[['pin',437,875,.065,.055]], rival:[['pin',410,205,.087,.056]],
    pop:[['pin',450,1090,.07,.11],['noise',2050,470,.08,.12]], tally:[['pin',660,0,.09,.067],['pin',880,0,.14,.075,.06]],
    countdown:[['triangle',330,275,.072,.115]],
  };
  const durations={ui:.052,line:.08,shot:.078,kill:.07,hit:.092,pop:.044,combo:.13};
  const wave=(ctx,duty)=>{
    const re=new Float32Array(34),im=new Float32Array(34);
    for(let n=1;n<re.length;n++){
      re[n]=Math.sin(2*Math.PI*n*duty)/(Math.PI*n);
      im[n]=(1-Math.cos(2*Math.PI*n*duty))/(Math.PI*n);
    }
    return ctx.createPeriodicWave(re,im);
  };
  const silence={door:true,hidden:true};

  return function create(getMix,onChange){
    let ctx,master,score,fx,gate,pulse,pin,noise,playing=null,route='',timer=0,opened=false;
    let tick=0,next=0,duck=1,accent=null,paused=null;
    const lastCue=new Map();
    const activeFx=new Set();
    function boot(){
      if(getMix().mute)return;
      try{
        if(!ctx){
          const Audio=window.AudioContext||window.webkitAudioContext;
          if(!Audio)return;
          ctx=new Audio();master=ctx.createGain();gate=ctx.createGain();score=ctx.createGain();fx=ctx.createGain();
          score.connect(gate);fx.connect(gate);gate.connect(master);master.connect(ctx.destination);
          master.gain.value=0;gate.gain.value=0;
          pulse=wave(ctx,.25);pin=wave(ctx,.125);
          noise=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.68),ctx.sampleRate);
          const samples=noise.getChannelData(0);let lfsr=0x6ebd;
          for(let i=0;i<samples.length;i+=3){
            lfsr=(lfsr>>1)|(((lfsr^(lfsr>>1))&1)<<14);
            samples.fill((lfsr&1)?1:-1,i,i+3);
          }
          ctx.addEventListener('statechange',()=>{
            if(ctx.state==='running'&&!opened){opened=true;sync();}
          });
        }
        if(ctx.state!=='running')ctx.resume().then(()=>{opened=true;sync();}).catch(()=>{});
        else if(!opened){opened=true;sync();}
      }catch{}
    }
    function voice(dest,t,timbre,freq,end,len,vol,tracked=false){
      if(!dest||vol<=0)return;
      const env=ctx.createGain();
      env.gain.setValueAtTime(.0001,t);
      env.gain.linearRampToValueAtTime(vol,t+Math.min(.009,len/3));
      env.gain.exponentialRampToValueAtTime(.0001,t+len);
      let src,filter;
      if(timbre==='noise'){
        src=ctx.createBufferSource();src.buffer=noise;
        filter=ctx.createBiquadFilter();filter.type='bandpass';filter.Q.value=1.15;
        filter.frequency.setValueAtTime(freq,t);
        if(end)filter.frequency.exponentialRampToValueAtTime(end,t+len*.9);
        src.connect(filter).connect(env);
      }else{
        src=ctx.createOscillator();
        if(timbre==='pulse'||timbre==='pin')src.setPeriodicWave(timbre==='pulse'?pulse:pin);
        else src.type=timbre;
        src.frequency.setValueAtTime(freq,t);
        if(end)src.frequency.exponentialRampToValueAtTime(end,t+len*.9);
        src.connect(env);
      }
      env.connect(dest);
      if(tracked)activeFx.add(src);
      src.onended=()=>{activeFx.delete(src);src.disconnect();filter?.disconnect();env.disconnect();};
      src.start(t);src.stop(t+len+.012);
    }
    function playBeat(song,at,n,dest){
      const step=n%8,bar=Math.floor(n/8),cycle=Math.floor(bar/song.bars.length);
      const [root,chord,lead]=song.bars[bar%song.bars.length];
      const beat=60/song.bpm/2,melody=lead[step],hit=(s,f,d,v,delay=0,end=0)=>voice(dest,at+delay,s,f,end,d,v);
      if(melody){
        const [note,length]=melody;
        hit(song.lead,hz(note),beat*(length-.14),song.lead==='triangle'?.107:.073);
        if(length>1||cycle%2)hit('triangle',hz(note-12),beat*.82,.033,beat*.46);
      }
      if(song.bass==='drive'&&(step!==5||bar%2))hit('triangle',hz(root+[0,0,12,7,0,chord[1]-chord[0],7,12][step]),beat*.78,step%2?.113:.177);
      if(song.bass==='walk'&&[0,2,4,6,7].includes(step))hit('triangle',hz(root+(step===2?7:step===6?12:step===7?7:0)),beat*(step%4===0?1.6:.78),.144);
      if(song.bass==='soft'&&(step===0||step===4))hit('triangle',hz(root+(step===4&&bar%2?7:0)),beat*2.2,.14);
      if(song.drums==='none'){
        if([0,3,5,7].includes(step))hit('triangle',hz(chord[(step+bar)%4]+12),beat*1.7,.052);
        if(step===0)hit('pin',hz(chord[1]),beat*3.4,.018);
      }else if(step%2===1||bar%4===3){
        hit(cycle%2?'pin':'triangle',hz(chord[(step+bar)%4]+(bar%4>1?12:0)),beat*.74,.048);
      }
      if(song.drums==='meter'&&(step===0||step===5))hit('triangle',103,.12,.082,0,47);
      if(['break','rush','brush'].includes(song.drums)){
        const hard=song.drums!=='brush';
        if(step===0||step===4||(song.drums==='rush'&&step===3))hit('triangle',hard?151:105,.105,hard?.187:.103,0,49);
        if(step===2||step===6)hit('noise',hard?1570:2240,.096,hard?.102:.041,0,650);
        if(step%2||song.drums==='rush')hit('noise',4400,.04,hard?.044:.021,0,1940);
      }
    }
    function fade(){
      if(!playing)return;
      const tail=playing;playing=null;
      tail.gain.cancelScheduledValues(ctx.currentTime);
      tail.gain.setTargetAtTime(0,ctx.currentTime,.032);
      setTimeout(()=>tail.disconnect(),540);
    }
    function sync(){
      const m=getMix(), nextRoute=document.hidden?'hidden':m.track;
      const song=songs[nextRoute];
      onChange(nextRoute,Boolean(opened&&song&&!m.mute&&m.music>0&&m.volume>0),song?.color);
      if(!ctx)return;
      const now=ctx.currentTime;
      if(nextRoute!==route){
        if(nextRoute==='paused'&&(route==='game'||route==='alarm'))paused={route,tick:Math.max(0,tick-1)};
        tick=paused?.route===nextRoute?paused.tick:0;
        if(nextRoute!=='paused'&&nextRoute!=='hidden')paused=null;
        route=nextRoute;fade();next=now+.032;
        if(silence[route])for(const src of activeFx)try{src.stop(now);}catch{}
      }
      gate.gain.cancelScheduledValues(now);
      if(silence[route]||m.mute){gate.gain.setValueAtTime(0,now);}
      else gate.gain.setTargetAtTime(1,now,.025);
      master.gain.setTargetAtTime(m.volume*.82,now,.022);
      score.gain.setTargetAtTime(m.music*.72*duck,now,.075);
      fx.gain.setTargetAtTime(m.effects*.82,now,.027);
      const canPlay=opened&&song&&!m.mute&&m.music>0&&m.volume>0;
      if(canPlay&&!playing){
        playing=ctx.createGain();playing.gain.setValueAtTime(0,now);playing.gain.setTargetAtTime(1,now,.047);
        playing.connect(score);next=now+.035;
      }else if(!canPlay&&playing){fade();}
      if(canPlay&&!timer){timer=setInterval(schedule,28);schedule();}
      else if(!canPlay&&timer){clearInterval(timer);timer=0;}
    }
    function schedule(){
      if(!playing||ctx.state!=='running')return;
      const song=songs[route],now=ctx.currentTime,step=60/song.bpm/2;
      if(next<now-.15)next=now+.036;
      while(next<now+.105){
        const delay=tick%2?song.feel*step:0;
        playBeat(song,Math.max(next+delay,now+.006),tick++,playing);
        next+=step;
      }
    }
    function effect(key){
      const m=getMix(), cue=cues[key];
      if(!ctx||!opened||m.mute||m.effects===0||m.volume===0||m.track==='door'||document.hidden||!cue)return;
      const now=ctx.currentTime;
      if(now-(lastCue.get(key)??-Infinity)<(durations[key]??.024))return;
      lastCue.set(key,now);
      const pitch=key==='pop'?1+(Math.floor(now*17)%4)*.09:1;
      for(const [voiceType,f,end,len,vol,delay=0] of cue)voice(fx,now+delay+.006,voiceType,f*pitch,end*pitch,len,vol,true);
      if(['pulse','wave','unlock','over','tally'].includes(key)){
        duck=.55;
        score.gain.setTargetAtTime(m.music*.38,now,.026);
        clearTimeout(accent);accent=setTimeout(()=>{duck=1;score.gain.setTargetAtTime(getMix().music*.72,ctx.currentTime,.13);},390);
      }
    }
    return {boot,sync,fx:effect,started:()=>opened};
  };
})();
