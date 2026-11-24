(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const icon = (name, cls='') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const pad = (n, len=5) => String(n).padStart(len,'0');
  const safeInt = n => Number.isSafeInteger(n) && n >= 0 ? n : 0;
  const clamp = (n,a,b) => Math.min(b,Math.max(a,n));
  const STORAGE = 'panic-clinic-4041.v2';
  let storage;
  const defaults = {best:0,runs:0,kills:0,longest:0,last:0,puzzle:0,stamps:0,seen:0,aff:0,secret:false,mute:false,volume:.44,music:.80,effects:.93,scares:true,reduce:matchMedia('(prefers-reduced-motion: reduce)').matches,lang:'ja',theme:'day',doorKey:false,doorRead:false,rainBest:0,pet:{full:62,pets:0,hidden:false,x:null,y:null}};
  let data = {...defaults};
  const countKeys=['best','runs','kills','longest','last','puzzle','rainBest','aff'];
  const settingsKeys=['secret','mute','reduce','scares','doorKey','doorRead'];
  function normalize(saved){
    const clean={...defaults};
    for(const k of countKeys)clean[k]=safeInt(saved[k]);
    clean.stamps=safeInt(saved.stamps)&7;
    clean.seen=safeInt(saved.seen)&3;
    if(saved.pet&&typeof saved.pet==='object'){
      clean.pet={full:clamp(Number(saved.pet.full)||0,0,100),pets:safeInt(saved.pet.pets),hidden:Boolean(saved.pet.hidden),
        x:Number.isFinite(saved.pet.x)?saved.pet.x:null,y:Number.isFinite(saved.pet.y)?saved.pet.y:null};
    }
    for(const k of settingsKeys)if(typeof saved[k]==='boolean')clean[k]=saved[k];
    if(clean.doorRead)clean.doorKey=true;
    for(const k of ['volume','music','effects'])if(Number.isFinite(saved[k]))clean[k]=clamp(saved[k],0,1);
    if(saved.lang==='ru')clean.lang='ru';
    if(saved.theme==='night')clean.theme='night';
    return clean;
  }
  function backup(){
    return 'PC1-'+btoa(JSON.stringify(data)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
  }
  function decode(code){
    if(!/^PC1-[A-Za-z0-9_-]{10,650}$/.test(code))return null;
    try{
      const v=JSON.parse(atob(code.slice(4).replaceAll('-','+').replaceAll('_','/')));
      return v&&Number.isSafeInteger(v.best)&&v.best>=0&&Number.isSafeInteger(v.runs)&&v.runs>=0?normalize(v):null;
    }catch{return null;}
  }
  try {
    storage = window.localStorage;
    const item=storage.getItem(STORAGE);
    if(item)data=normalize(JSON.parse(item));
  } catch { storage=undefined; }
  if(!storage&&location.hash.startsWith('#clinic='))data=decode(location.hash.slice(8))||data;
  function save(){
    if(storage){
      try{storage.setItem(STORAGE,JSON.stringify(data));return;}catch{storage=undefined;}
    }
    try{history.replaceState(null,'','#clinic='+backup());}catch{}
  }
  const t=(ja,ru)=>data.lang==='ru'?ru:ja;
  const pick=pair=>t(...pair);
  const doctorName=()=>t('ユウ先生','Доктор Юу');
  const onOff=on=>on?t('ON','ВКЛ'):t('OFF','ВЫКЛ');
  const poses={focused:1,welcome:2,secret:3,surprised:4};
  const portrait=pose=>`./assets/portrait-${poses[pose]}.webp?v=35`;
  const initialQuote=['そこ、座らないで。まだ誰かの体温が残ってる。','Не садись туда. Там ещё чьё-то тепло.'];
  let homeQuote=initialQuote;
  const motionOK=()=>data.scares&&!data.reduce&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  const localizedHTML=[
    ...$$('[data-ru]').map(el=>[el,null,[el.textContent,el.dataset.ru]]),
    ...$$('[data-ru-label]').map(el=>[el,'aria-label',[el.getAttribute('aria-label'),el.dataset.ruLabel]]),
    ...$$('[data-ru-alt]').map(el=>[el,'alt',[el.alt,el.dataset.ruAlt]])
  ];
  function localize(){
    document.documentElement.lang=data.lang;
    document.title=t('パニック診療所 · 4041 PANIC CLINIC','Клиника паники · 4041 PANIC CLINIC');
    $('meta[name=description]').content=t('パニック診療所の夜勤端末。先生とデジタルウイルスを診察する、短編ノベルとアーケードゲーム。','Ночная смена в клинике паники: короткая визуальная новелла и аркада с доктором Юу.');
    for(const [el,attr,copy] of localizedHTML){
      if(attr)el.setAttribute(attr,pick(copy));else el.textContent=pick(copy);
    }
    const lang=$('#language-target'), label=t('ロシア語に切り替える','Переключить на японский');
    lang.lang=t('ru','ja');lang.textContent=t('Русский','日本語');
    $('#language-toggle').setAttribute('aria-label',label);$('#language-toggle').title=label;
    $('#doctor-line').textContent=pick(homeQuote);
    pet?.localize();
    syncSettings();syncStats();syncHeader();syncThemeControl();
  }
  let view='home', mode='home', runBest=0, variant='neutral', runCommitted=false;
  let telegram;
  const themeColors={day:{header:'#f7f1eb',background:'#f7f1eb'},night:{header:'#251d25',background:'#251d25'},door:{header:'#171416',background:'#171416'}};
  const chromeColors=()=>themeColors[view==='door'?'door':data.theme];
  function syncThemeControl(){
    const night=data.theme==='night',toggle=$('#theme-toggle');
    toggle.setAttribute('aria-label',t('夜のテーマ','Ночная тема'));
    toggle.setAttribute('aria-pressed',String(night));
    toggle.title=night?t('昼のテーマに切り替える','Включить дневную тему'):t('夜のテーマに切り替える','Включить ночную тему');
    $('#theme-icon').setAttribute('href',night?'#i-sun':'#i-moon');
  }
  function syncTelegramTheme(){
    const {header,background}=chromeColors();
    try{telegram?.setHeaderColor?.(header);}catch{}
    try{telegram?.setBackgroundColor?.(background);}catch{}
    try{telegram?.setBottomBarColor?.(background);}catch{}
  }
  function applyTheme(){
    document.documentElement.dataset.theme=data.theme;
    $('meta[name=theme-color]').content=chromeColors().header;
    syncThemeControl();syncTelegramTheme();
  }
  function bindTelegram(){
    if(telegram)return;
    const app=window.Telegram?.WebApp;
    if(!app || !(app.initData || (app.platform && app.platform!=='unknown')))return;
    telegram=app;
    try{
      app.ready();app.expand();syncTelegramTheme();
      app.BackButton?.onClick(back);
      app.onEvent?.('deactivated',()=>{if(view==='game'&&mode==='playing')pauseGame();});
      updateTelegram();
    }catch{}
  }
  function updateTelegram(){
    try{
      if(view==='home'&&!$('#modal').open&&!$('#rain').open)telegram?.BackButton?.hide();else telegram?.BackButton?.show();
      if(view==='game')telegram?.disableVerticalSwipes?.();else telegram?.enableVerticalSwipes?.();
    }catch{}
  }
  applyTheme();
  function haptic(style='light'){try{telegram?.HapticFeedback?.impactOccurred(style);}catch{}}
  bindTelegram();
  $('#telegram-webapp')?.addEventListener('load',bindTelegram);
  window.addEventListener('load',bindTelegram);

  const audioToggle=$('#audio-toggle');
  function scoreRoute(){
    if(view==='door')return 'door';
    if($('#rain').open)return rain.running()?'rain':'results';
    if(view==='game')return mode!=='playing'?mode:engine.wave>=3?'alarm':'game';
    if(view==='novel')return 'novel';
    if(modal.open){
      if(modal.dataset.panel==='doctor')return visit==='pulse'?'pulse':'doctor';
      if(modal.dataset.panel==='secret'&&data.secret)return 'puzzle';
    }
    return 'home';
  }
  const audio=window.ClinicSound(
    ()=>({track:scoreRoute(),mute:data.mute,volume:data.volume,music:data.music,effects:data.effects}),
    (track,playing,color)=>{
      document.body.dataset.score=track;
      audioToggle.dataset.playing=String(playing);
      audioToggle.style.setProperty('--score-color',color||'currentColor');
      refreshSoundLabel();
    }
  );
  const unlockSound=e=>{
    if(!e.target.closest?.('#audio-toggle,#rain-mute')&&(e.type!=='keydown'||!e.repeat))audio.boot();
  };
  document.addEventListener('pointerdown',unlockSound,{passive:true});
  document.addEventListener('keydown',unlockSound);
  document.addEventListener('click',unlockSound,{capture:true});
  document.addEventListener('click', e=>{
    const button=e.target.closest('button:not(:disabled)');
    if(!button||button.closest('#fire,#pulse,#audio-toggle,#rain'))return;
    if(view==='door')return;
    if(button.matches('[data-home],#visit-back,#modal-close'))audio.fx('back');
    else if(!button.matches('#arcade-start,#demo-start,#skip,#vn-scene,#vn-next,[data-choice],[data-cell],[data-action],#doctor-card,#start-btn,#pause,#overlay-primary,#pet-dock button,#hidden-door'))audio.fx('ui');
    if(e.detail&&motionOK()&&button.matches('.hero-actions button,#doctor-card,.mini-nav button,#theme-toggle'))sparkAt(e.clientX,e.clientY);
  });
  function sparkAt(x,y){
    if(document.querySelectorAll('.clinic-spark').length>12)return;
    const node=document.createElement('span');
    node.className='clinic-spark';node.setAttribute('aria-hidden','true');
    node.style.cssText=`--spark-x:${x}px;--spark-y:${y}px`;
    document.body.append(node);setTimeout(()=>node.remove(),540);
  }
  function signal(node,kind){
    if(!node||!motionOK())return;
    delete node.dataset.signal;
    void node.offsetWidth;
    node.dataset.signal=kind;
  }

  const modal=$('#modal');
  const rain=window.ClinicRain({
    t,motionOK,pop:(n)=>{audio.fx(n%6===0?'combo':'pop');if(n%6===0)haptic();},
    best:n=>{if(n>data.rainBest){data.rainBest=n;save();}return data.rainBest;},
    mute:toggleSound,finish:()=>audio.fx('tally'),countdown:()=>audio.fx('countdown'),onChange:()=>{audio.sync();updateTelegram();}
  });
  const toast=$('#toast');
  let toastTimer=0;
  function say(text){
    clearTimeout(toastTimer);toast.textContent=text;toast.hidden=false;
    toastTimer=setTimeout(()=>{toast.hidden=true;},2900);
  }
  function syncStats(){
    $$('[data-stat="best"]').forEach(el=>el.textContent=pad(data.best));
    $$('[data-stat="runs"]').forEach(el=>el.textContent=pad(data.runs,2));
    $('#log-lock').textContent=data.secret?t('OPEN','ОТКРЫТО'):t('LOCK','ЗАМОК');
    $('#stamp-count').textContent=`${stampCount()} / 3`;
    $('#hidden-door').classList.toggle('has-key',data.doorKey);
    $('#door-hint').hidden=!data.doorKey;
  }
  function refreshSoundLabel(){
    const sleeping=!audio.started(),inactive=data.mute||sleeping;
    const label=inactive?t('サウンドをオン','Включить звук'):t('サウンドをミュート','Выключить звук');
    $('#audio-icon').setAttribute('href',inactive?'#i-muted':'#i-sound');
    audioToggle.setAttribute('aria-pressed',String(data.mute));
    audioToggle.setAttribute('aria-label',label);
    audioToggle.title=label;
    $('#rain-audio-icon').setAttribute('href',data.mute?'#i-muted':'#i-sound');
    $('#rain-mute').setAttribute('aria-pressed',String(data.mute));
    $('#rain-mute').setAttribute('aria-label',label);
  }
  function syncSettings(){
    document.body.classList.toggle('reduce-motion',data.reduce);
    document.body.classList.toggle('quiet-effects',!data.scares);
    audio.sync();
  }
  function setMute(mute){
    data.mute=mute; if(!mute)audio.boot();
    syncSettings();save();
  }
  function toggleSound(){
    if(!audio.started()&&!data.mute)audio.boot();
    else setMute(!data.mute);
    audio.fx('ui');
    say(data.mute?t('サウンド：オフ','Звук выключен'):t('サウンド：オン','Звук включён'));
  }
  audioToggle.addEventListener('click',toggleSound);
  function syncHeader(){
    const label=$('#system-label');
    label.textContent=view==='door'?t('圏外','Нет сигнала'):view==='game'?t('診察中','Идёт приём'):view==='novel'?t('夜勤のはじまり','Начало смены'):t('夜間受付中','Открыто ночью');
    label.parentElement.style.color=view==='novel'?'var(--pink)':'';
  }
  function show(which){
    clearTimeout(toastTimer);toast.hidden=true;
    view=which;document.body.dataset.view=which;
    audio.sync();
    for(const id of ['home','novel','game','door'])$('#'+id).hidden=id!==which;
    signal($('#'+which),which==='door'?'threshold':'arrival');
    pet?.setView(which);
    syncHeader();
    $('meta[name=theme-color]').content=chromeColors().header;
    syncTelegramTheme();
    scrollTo({top:0,behavior:'instant'});
    updateTelegram();
  }

  const stories=window.ClinicStories,script=stories.prologue;
  let vn=0,typeTimer=0,typing=false;
  let portraitCache=[];
  if('requestIdleCallback' in window)requestIdleCallback(preloadPortraits);else setTimeout(preloadPortraits,700);
  function preloadPortraits(){
    if(portraitCache.length)return;
    portraitCache=Object.keys(poses).map(pose=>{const img=new Image();img.src=portrait(pose);return img;});
  }
  function finishLine(){
    const next=$('#vn-next'), wasFocused=document.activeElement===next;
    clearInterval(typeTimer);typing=false;
    $('.vn-reserve').textContent=$('#vn-text').textContent=$('#vn-announcement').textContent=pick(script[vn].text);
    $('#vn-next-label').textContent=t('つづく','Дальше');
    if(vn===script.length-1){
      $('#vn-choices').hidden=false;next.hidden=true;
      if(wasFocused)$('#vn-choices button').focus({preventScroll:true});
    }
  }
  function renderLine(){
    const line=script[vn], target=$('#vn-text'), scene=$('#vn-scene'), glyphs=[...pick(line.text)];
    clearInterval(typeTimer);typing=false;
    $('.vn-reserve').textContent=pick(line.text);
    scene.dataset.scene=String(vn);
    $('#vn-portrait').src=portrait(line.pose);
    syncNovelLabels();
    $('#vn-step').textContent=`${pad(vn+1,2)} / ${pad(script.length,2)}`;
    const progress=$('#vn-dots');
    progress.setAttribute('aria-valuemax',String(script.length));progress.setAttribute('aria-valuenow',String(vn+1));
    progress.innerHTML=script.map((_,i)=>`<i${i<vn?' class="read"':i===vn?' class="on"':''}></i>`).join('');
    $('#vn-choices').hidden=true;$('#vn-next').hidden=false;
    scene.classList.remove('scene-in');void scene.offsetWidth;scene.classList.add('scene-in');
    audio.fx('page');
    if(!motionOK()){finishLine();return;}
    let i=0;target.textContent='';typing=true;
    $('#vn-next-label').textContent=t('全文を表示','Показать реплику');
    typeTimer=setInterval(()=>{
      if(view!=='novel'){clearInterval(typeTimer);typing=false;return;}
      target.textContent+=glyphs.slice(i,i+2).join('');i+=2;
      if(i%8===0)audio.fx('line');
      if(i>=glyphs.length)finishLine();
    },t(24,16));
  }
  function syncNovelLabels(){
    $('#vn-location').textContent=pick(script[vn].loc);
    $('#vn-error').textContent=pick(script[vn].err);
  }
  function advanceLine(){
    if(view!=='novel')return;
    if(typing){finishLine();return;}
    if(vn<script.length-1){vn++;renderLine();}
    else $('#vn-choices button').focus();
  }
  function startNovel(){
    if(view!=='home')return;
    if(modal.open)modal.close();
    audio.boot();preloadPortraits();vn=0;mode='novel';show('novel');renderLine();$('#vn-next').focus({preventScroll:true});
    pet?.react({kind:'calm',line:['はじまる。','Начинается.']});
  }
  $('#start-btn').addEventListener('click',startNovel);
  for (const id of ['#arcade-start','#demo-start']) $(id).addEventListener('click',()=>startGame());
  $('#vn-scene').addEventListener('click',advanceLine);
  $('#vn-next').addEventListener('click',advanceLine);
  $('#skip').addEventListener('click',()=>startGame());
  $$('[data-choice]').forEach(el=>el.addEventListener('click',()=>startGame(el.dataset.choice)));

  let greetingsSeen=0,portraitTaps=0,codeTaps=0,codeTimer=0,topicBeat=0;
  let visit=null,pulseRound=null,pulseFrame=0,visitRevision=0;
  function stampCount(){return [1,2,4].filter(bit=>data.stamps&bit).length;}
  function awardStamp(bit){
    if(data.stamps&bit)return false;
    data.stamps|=bit;save();syncStats();audio.fx('bonus');
    return true;
  }
  function visitLine(line,pose='focused',homeLine=null,reply=null){
    const current=$('#visit-line'),img=$('#visit-portrait'),question=$('#visit-reply');
    visitRevision++;
    if(current)current.textContent=line;
    if(question){question.hidden=!reply;question.textContent=reply?pick(reply):'';}
    if(img){
      img.src=portrait(pose);
      img.classList.remove('react');void img.offsetWidth;img.classList.add('react');
    }
    if(homeLine){homeQuote=homeLine;$('#doctor-line').textContent=pick(homeQuote);}
  }
  const affinityTier=()=>data.aff>=10?4:data.aff>=7?3:data.aff>=4?2:data.aff>=2?1:0;
  function moodName(){
    return [
      t('診察中','На осмотре'),
      t('少し慣れた','Привыкает'),
      t('気を許している','Доверяет'),
      t('ほとんど友人','Почти друг'),
      t('夜勤の相棒','Напарник по смене')
    ][affinityTier()];
  }
  function addAffinity(step=1){
    const before=data.aff;
    data.aff=Math.min(12,data.aff+step);save();
    refreshStamps();
    const revision=visitRevision;
    const note=(line,pose)=>setTimeout(()=>{
      if(modal.open&&modal.dataset.panel==='doctor'&&visit==='menu'&&revision===visitRevision)visitLine(line,pose);
    },700);
    if(before<4&&data.aff>=4){
      note(t('……ひとつ、思い出した。受付の床ぎわ、壁紙が浮いてる。\n三つ印がそろったら、机の引き出しを開けて。鍵がある。','…Кое-что вспомнил. У пола в приёмной обои отходят.\nКогда в карте будет три отметки, открой ящик стола. Там ключ.'),'secret');
      say(t('信頼：壁紙の話が解禁','Доверие: он рассказал про обои'));
    }
    if(before<8&&data.aff>=8){
      note(t('これ以上は、たぶん話しすぎだ。\n……でも、聞きたいなら聞く。','Дальше я, пожалуй, слишком разговорчив.\n…Но если хочешь спросить — спрашивай.'),'welcome');
      audio.fx('unlock');
      window.ClinicPet?.react({kind:'happy',hearts:3});
    }
  }
  function refreshStamps(){
    const shelf=$('#visit-stamps');
    if(!shelf)return;
    $('#visit-stamp-count').textContent=`${stampCount()} / 3`;
    shelf.innerHTML=[[1,'chat',t('おしゃべり','Беседа')],[2,'pulse',t('脈拍','Пульс')],[4,'heart',t('おやつ','Угощение')]]
      .map(([bit,i,label])=>`<span class="${data.stamps&bit?'earned':''}">${icon(i)} ${label}<span class="interior-sr">: ${data.stamps&bit?t('獲得済み','получено'):t('未獲得','не получено')}</span></span>`).join('');
    $('#visit-trust').textContent=moodName();
    $('#visit-aff').style.width=`${data.aff/12*100}%`;
    $('#visit-clue').textContent=data.doorKey
      ? t('真鍮の鍵：受付の床ぎわを探す','Ключ у тебя. Ищи стык обоев у пола в приёмной.')
      : t('三つの印で、机の引き出しが開く。','Три отметки открывают ящик стола.');
    $('#visit-key').hidden=data.stamps!==7||data.doorKey;
    $('[data-action=ask-key]').hidden=data.aff<8;
  }
  function doctorContent(){
    return `<div class="consultation" data-mode="menu">
      <div class="consult-photo">
        <img id="visit-portrait" src="${portrait('welcome')}" alt="">
        <div class="consult-caption"><small>${t('当直医','ДЕЖУРНЫЙ ВРАЧ')}</small><strong>${doctorName()}</strong></div>
      </div>
      <div class="consult-desk">
        <div class="consult-route">
          <button type="button" id="visit-back" hidden>${icon('back')} <span></span></button>
          <span id="visit-index" aria-hidden="true">01</span>
        </div>
        <h3 id="visit-heading" tabindex="-1"></h3>
        <div class="consult-speech">
          <div id="visit-reply" hidden></div>
          <p id="visit-line" aria-live="polite">${pick(stories.greetings[greetingsSeen++%stories.greetings.length])}</p>
        </div>
        <div id="visit-controls"></div>
        <div class="consult-footer">
          <button type="button" class="consult-key" id="visit-key" data-action="take-key" hidden>${icon('key')} <span>${t('引き出しから真鍮の鍵を取る','Забрать латунный ключ из ящика')}</span>${icon('arrow')}</button>
          <details class="consult-file">
            <summary>${icon('file')} <span>${t('診察カルテ','Карта приёма')}</span><b id="visit-stamp-count"></b><span class="file-plus" aria-hidden="true"></span></summary>
            <div class="consult-file-body">
              <div id="visit-stamps"></div>
              <div class="consult-trust"><span>${t('信頼','Доверие')}</span><strong id="visit-trust"></strong><i aria-hidden="true"><i id="visit-aff"></i></i></div>
              <p id="visit-clue"></p>
              <button class="consult-quiet" data-action="ask-key" hidden>${icon('key')} ${t('鍵の話','Спросить о ключе')}</button>
            </div>
          </details>
        </div>
      </div>
    </div>`;
  }
  function stopPulse(){
    cancelAnimationFrame(pulseFrame);pulseFrame=0;pulseRound=null;
  }
  function setVisit(next,title,index,back=t('診察室','В кабинет')){
    visitRevision++;visit=next;
    $('.consultation').dataset.mode=next;
    $('#visit-heading').textContent=title;
    $('#visit-index').textContent=index;
    const control=$('#visit-back');
    control.hidden=next==='menu';
    control.dataset.action=next==='story'?'topic-menu':'doctor-menu';
    control.querySelector('span').textContent=back;
    if(modal.open){
      audio.sync();
      signal($('.consult-desk'),'paper');
    }
  }
  function visitMenu(returning=false){
    stopPulse();setVisit('menu',t('夜の診察室','Ночной приём'),'01');
    if(returning)visitLine(t('……まだ、ここにいるよ。','…Я ещё здесь.'),'focused');
    $('#visit-controls').innerHTML=`<div class="consult-actions">
      <button class="consult-main" data-action="doctor-chat">${icon('chat')} <span>${t('話す','Поговорить')} <small>${t('話題を選ぶ','Выбрать тему')}</small></span>${icon('arrow')}</button>
      <button data-action="doctor-snack">${icon('tea')} <span>${t('おやつ','Угостить')}</span></button>
      <button data-action="doctor-pulse">${icon('pulse')} <span>${t('脈を測る','Измерить пульс')}</span></button>
    </div><div class="consult-gestures">
      <button class="consult-quiet" data-action="doctor-portrait">${icon('hand')} ${t('なでる','Погладить')}</button>
      <button class="consult-quiet" data-action="doctor-praise">${icon('star')} ${t('ほめる','Похвалить')}</button>
    </div>`;
  }
  function petDoctor(){
    const [line,pose]=stories.portrait[portraitTaps++%stories.portrait.length];
    visitLine(pick(line),pose,null,['（頭に手を置く）','(кладёшь руку на голову)']);
    addAffinity(1);audio.fx('stroke');haptic();
    signal($('.consult-photo'),'warm');
    window.ClinicPet?.react({mood:'happy',hearts:2});
  }
  function praiseDoctor(){
    const [line,pose]=stories.praise[portraitTaps++%stories.praise.length];
    visitLine(pick(line),pose,null,['（素直に褒めてみる）','(говоришь приятное)']);
    addAffinity(1);audio.fx('praise');haptic();
    signal($('.consult-photo'),'warm');
    window.ClinicPet?.react({mood:'happy',hearts:2});
  }
  function topicMenu(intro=true){
    stopPulse();setVisit('topics',t('話題を選ぶ','О чём поговорим?'),'02');
    visitLine(intro?t('話す？　……いいよ。ただし、長い話は苦手だ。短く、変な話なら、いくらでも。','Поговорить? …Ладно. Только длинные разговоры я не умею. Короткие и странные — сколько угодно.')
      :t('……ほかには？','…О чём ещё?'),'welcome');
    $('#visit-controls').innerHTML=`<div class="consult-topics">${stories.topics.map((entry,i)=>`<button type="button" data-action="topic" data-topic="${i}"><small aria-hidden="true">${pad(i+1,2)}</small><span>${pick(entry.title)}</span>${icon('arrow')}</button>`).join('')}</div>`;
    $('#visit-heading').focus({preventScroll:true});
  }
  function showTopic(index,beat=0){
    const topic=stories.topics[index];if(!topic)return;
    topicBeat=beat;setVisit('story',pick(topic.title),`${pad(beat+1,2)} / ${pad(topic.beats.length,2)}`,t('話題一覧','К темам'));
    const [pose,question,line]=topic.beats[beat],next=topic.beats[beat+1];
    visitLine(pick(line),pose,null,question);
    $('#visit-controls').innerHTML=next
      ? `<button class="consult-next" data-action="topic-next" data-topic="${index}"><span><small>${t('つづけて聞く','Спросить дальше')}</small>${pick(next[1])}</span> ${icon('arrow')}</button>`
      : `<button class="consult-next" data-action="topic-menu"><span>${t('別の話をする','Выбрать другую тему')}</span> ${icon('arrow')}</button>`;
    if(beat>0)$('#visit-controls button').focus({preventScroll:true});else $('#visit-heading').focus({preventScroll:true});
  }
  function snackMenu(){
    stopPulse();setVisit('snack',t('夜のおやつ','Угощение для Юу'),'03');
    visitLine(t('くれるの。……そういうのは、だいたい先に断るんだけど。今日は、断るのが面倒だ。','Мне? …Обычно я отказываюсь первым. Сегодня лень отказываться.'),'surprised');
    $('#visit-controls').innerHTML=`<div class="consult-tray">
      <button data-action="tea" aria-pressed="false">${icon('tea')} <span>${t('熱いお茶','Горячий чай')}</span></button>
      <button data-action="candy" aria-pressed="false">${icon('candy')} <span>${t('いちごの飴','Клубничный леденец')}</span></button></div>`;
    $('#visit-heading').focus({preventScroll:true});
  }
  function openPulse(){
    stopPulse();setVisit('pulse',t('脈拍チェック','Проверка пульса'),'04');
    visitLine(t('脈、測って。自分のだと、数える途中で考えごとを始める。\n針が赤いところに重なった時に押して。三回中二回で合格。','Измерь мне пульс. На своём я начинаю думать вместо счёта.\nЖми, когда метка в красной зоне. Два раза из трёх — зачёт.'),'focused');
    $('#visit-controls').innerHTML=`<div class="pulse-card">
      <div class="pulse-guide"><span>${t('試行回数','Попытки')}</span><span id="pulse-attempts">0 / 3</span></div>
      <div class="pulse-lane" id="beat-lane" aria-hidden="true"><span class="pulse-zone"></span><span class="pulse-marker"></span></div>
      <button class="solid-button" data-action="beat-start">${icon('play')} ${t('はじめる','Начать')}</button>
      <p class="pulse-feedback" id="pulse-feedback" aria-live="polite"></p></div>`;
    $('#visit-heading').focus({preventScroll:true});
  }
  function beatSample(now){
    const phase=(now-pulseRound.start)%1530/1530;
    return {x:phase,ready:phase>=.42&&phase<=.58};
  }
  function pulseLoop(now){
    if(!pulseRound||!modal.open||modal.dataset.panel!=='doctor'||visit!=='pulse')return;
    const {x,ready}=beatSample(now);
    $('#beat-lane').style.setProperty('--beat',`${(data.reduce ? (ready ? .5 : .1) : x)*100}%`);
    const tap=$('[data-action=beat-tap]');
    tap.classList.toggle('ready',ready);tap.dataset.ready=String(ready);
    pulseFrame=requestAnimationFrame(pulseLoop);
  }
  function startPulse(){
    pulseRound={start:performance.now(),num:0,hits:0,last:-Infinity};
    const el=$('[data-action=beat-start]');
    el.dataset.action='beat-tap';el.innerHTML=`${icon('pulse')} ${t('測る','Измерить')}`;
    audio.fx('pulseStart');
    signal($('.pulse-card'),'meter');
    pulseFrame=requestAnimationFrame(pulseLoop);
  }
  function countBeat(){
    const now=performance.now();
    if(!pulseRound||now-pulseRound.last<260)return;
    pulseRound.last=now;
    const hit=beatSample(now).ready;
    if(hit)pulseRound.hits++;
    pulseRound.num++;
    $('#pulse-attempts').textContent=`${pulseRound.num} / 3`;
    $('#pulse-feedback').textContent=hit?t('ぴったり！','Точно в ритм!'):t('もう少し。赤いゾーンを見て。','Мимо. Следи за красной зоной.');
    audio.fx(hit?'pulseHit':'pulseMiss');
    signal($('.pulse-card'),hit?'meter':'miss');
    if(pulseRound.num<3)return;
    const passed=pulseRound.hits>=2;
    stopPulse();
    const tap=$('[data-action=beat-tap]');
    tap.classList.remove('ready');delete tap.dataset.ready;tap.dataset.action='doctor-pulse';tap.textContent=t('もう一度','Ещё раз');
    $('#pulse-feedback').textContent=passed?t('成功！　きれいなリズム。','Получилось! Отличный ритм.'):t('惜しい。もう一回測ってみる？','Почти. Попробуем ещё раз?');
    if(passed){
      awardStamp(2);refreshStamps();visitLine(t('二回も合った。僕、自分の脈を取る時はすぐ数がわからなくなるんだ。心臓の音を聞いてるうちに、考えごとを始めちゃう。君に頼んでよかった。','Два попадания. Сам я на своём пульсе вечно сбиваюсь. Начинаю считать, заслушиваюсь и вдруг уже думаю о чём-то другом. Хорошо, что попросил тебя.'),'welcome',['測ってくれて、ありがと。','Спасибо, что измерил.']);
    }
  }
  let doorNode='',doorIndex=0,doorTurn=0,doorReply=null,doorTimer=0,doorHomeScroll=0;
  function openHall(){
    const handle=$('#hidden-door');
    if(!data.doorKey){
      handle.classList.remove('rattle');void handle.offsetWidth;handle.classList.add('rattle');
      audio.fx('knock');
      say(t('壁紙の下に取っ手がある。鍵がかかっている。','Под обоями ручка. Заперто.'));
      pet?.react({kind:'door',tears:1,mood:'sad',hold:2000});
      return;
    }
    doorNode='';doorIndex=doorTurn=0;doorReply=null;
    $('#door-foyer').hidden=false;$('#door-foyer').classList.remove('opening');
    $('#door-open').disabled=$('#door-unlock').disabled=false;
    $('#door-conversation').hidden=true;
    doorHomeScroll=scrollY;
    mode='door';show('door');$('#door-open').focus({preventScroll:true});
    pet?.react({kind:'door'});
  }
  function renderDoor(focus=true){
    if(!doorNode)return;
    const node=stories.door[doorNode],last=doorIndex===node.lines.length-1,reply=$('#door-reply');
    $('#door-turn').textContent=pad(doorTurn,2);
    reply.hidden=!doorReply||doorIndex!==0;reply.textContent=doorReply?pick(doorReply):'';
    $('#door-line').textContent=pick(node.lines[doorIndex]);
    if(last&&node.choices){
      $('#door-actions').innerHTML=node.choices.map(([label],i)=>`<button type="button" class="door-choice" data-door-choice="${i}"><span>${pick(label)}</span>${icon('out')}</button>`).join('');
    }else if(last&&!node.next){
      if(!data.doorRead){data.doorRead=true;save();}
      $('#door-actions').innerHTML=`<button class="door-choice" type="button" data-door-leave>${icon('back')} ${t('戸を閉めて帰る','Прикрыть дверь и уйти')}</button>`;
    }else{
      $('#door-actions').innerHTML=`<button class="door-choice door-continue" type="button" data-door-next>${t('耳をすます','Слушать дальше')} ${icon('arrow')}</button>`;
    }
    if(focus){$('#door-line').focus({preventScroll:true});if(doorTurn>1)$('#door-conversation').scrollIntoView({block:'nearest'});}
  }
  function unlockDoor(){
    if(view!=='door'||doorNode||doorTimer)return;
    $('#door-open').disabled=$('#door-unlock').disabled=true;
    const begin=()=>{
      doorTimer=0;if(view!=='door')return;
      $('#door-foyer').hidden=true;$('#door-conversation').hidden=false;
      doorNode='start';doorTurn=1;renderDoor();
    };
    if(!motionOK()){begin();return;}
    $('#door-foyer').classList.add('opening');
    doorTimer=setTimeout(begin,570);
  }
  $('#hidden-door').addEventListener('click',openHall);
  $('#door-open').addEventListener('click',unlockDoor);
  $('#door-unlock').addEventListener('click',unlockDoor);
  $('#door-actions').addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button||!doorNode)return;
    const node=stories.door[doorNode];
    if(button.hasAttribute('data-door-leave')){home();return;}
    if(button.dataset.doorChoice!==undefined){
      [doorReply,doorNode]=node.choices[Number(button.dataset.doorChoice)];doorIndex=0;
    }else if(doorIndex+1<node.lines.length){doorIndex++;}
    else if(node.next){doorNode=node.next;doorIndex=0;doorReply=null;}
    else return;
    doorTurn++;renderDoor();
  });
  $('#doctor-card').addEventListener('click',()=>{
    const card=$('#doctor-card');card.classList.remove('ping');void card.offsetWidth;card.classList.add('ping');
    audio.fx('select');
    openModal('doctor');
  });
  $('#terminal-code').addEventListener('click',()=>{
    if(data.secret){openModal('secret');return;}
    clearTimeout(codeTimer);codeTaps++;
    if(codeTaps>=3){
      data.secret=true;save();syncStats();audio.fx('unlock');haptic('medium');
      openModal('secret');return;
    }
    codeTimer=setTimeout(()=>{codeTaps=0;},5500);
    say(codeTaps===1?t('端末 4041 // 認証待ち','Терминал 4041 // Ждём подтверждения'):t('端末 4041 // もう一度','Терминал 4041 // Ещё раз'));
  });

  const panels={
    info:[['FILE / 4041','КАРТА / 4041'],['診療カルテ','Карта пациента']],
    journal:[['LOG / B1','ЖУРНАЛ / B1'],['夜勤の日誌','Журнал ночной смены']],
    records:[['RECORD / LOCAL','АРХИВ / НА УСТРОЙСТВЕ'],['診察記録','Рекорды и статистика']],
    settings:[['CONFIG / TERMINAL','НАСТРОЙКИ / 4041'],['端末設定','Настройки']],
    secret:[['4041 / PRIVATE','4041 / СЕКРЕТНО'],['処方箋の裏側','На обороте рецепта']],
    doctor:[['診察室 / DR. YŪ','КАБИНЕТ / 4041'],['ユウ先生の診察室','Кабинет доктора Юу']]
  };
  let puzzle=[],puzzleTimer=0,puzzleResult=null;
  const triples=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  function evaluate(board){return triples.find(t=>board[t[0]]&&board[t[0]]===board[t[1]]&&board[t[1]]===board[t[2]])||null;}
  function newPuzzle(){clearTimeout(puzzleTimer);puzzle=Array(9).fill('');puzzleResult=null;renderPuzzle();}
  function renderPuzzle(){
    const win=evaluate(puzzle),finished=Boolean(win)||puzzle.every(Boolean);
    const busy=Boolean(puzzleTimer);
    $('#secret-grid').innerHTML=puzzle.map((v,i)=>{
      const row=Math.floor(i/3)+1,col=i%3+1,label=t(`${row}行 ${col}列`,`Ряд ${row}, столбец ${col}`);
      const mark=v==='p'?t(' カプセル',', капсула'):v==='v'?t(' ウイルス',', вирус'):'';
      return `<button data-cell="${i}" aria-label="${label+mark}" ${v||finished||busy?'disabled':''} class="${win?.includes(i)?'win':''}">${v?`<img src="./assets/${v==='p'?'pill':'virus'}.webp?v=35" alt="">`:''}</button>`;
    }).join('');
    $('#secret-status').textContent=puzzleResult||(busy?t('ユウ先生が考え中…','Доктор думает…'):t('空いているマスにカプセルを置く','Твой ход: поставь капсулу.'));
  }
  function checkPuzzle(){
    const win=evaluate(puzzle);
    if(win){
      if(puzzle[win[0]]==='p'){
        puzzleResult=t('君の勝ち。……箱が開いた。雨、見る？','Твоя взяла. …Коробка открылась. Посмотрим дождь?');data.puzzle++;save();audio.fx('bonus');
        $('#rain-launch').hidden=false;
        rain.start();
      } else {puzzleResult=t('僕の勝ち。……今の、見えてた？　見えてなかったら、もう一回。','Я выиграл. …Ты это видел? Если нет — ещё раз.');audio.fx('hit');}
    } else if(puzzle.every(Boolean)){puzzleResult=t('引き分け。最後に残ったマス、さっきまでいい場所に見えたのにな。','Ничья. А последняя клетка ещё недавно казалась таким хорошим ходом.');}
    return Boolean(puzzleResult);
  }
  function puzzleMove(i){
    if(puzzle[i]||puzzleTimer||puzzleResult)return;
    puzzle[i]='p';
    audio.fx('mark');
    if(checkPuzzle()){renderPuzzle();return;}
    puzzleTimer=setTimeout(()=>{
      puzzleTimer=0;
      if(!modal.open||modal.dataset.panel!=='secret')return;
      const choices=puzzle.map((v,j)=>v?-1:j).filter(j=>j>=0);
      const canWin=role=>choices.find(j=>{const b=[...puzzle];b[j]=role;return evaluate(b);});
      // Yū sees an immediate threat, but his favorite squares leave room for forks.
      const j=canWin('v')??canWin('p')??[4,2,6,0,8].find(j=>choices.includes(j))??choices[0];
      puzzle[j]='v';audio.fx('rival');checkPuzzle();renderPuzzle();
      const cell=$('#secret-grid button:not(:disabled)');cell?.focus({preventScroll:true});
    },350);
    renderPuzzle();
  }
  function openModal(name){
    if(!panels[name])return;
    clearTimeout(toastTimer);toast.hidden=true;
    clearTimeout(puzzleTimer);puzzleTimer=0;
    stopPulse();
    modal.dataset.panel=name;
    $('#modal-code').textContent=pick(panels[name][0]);
    $('#modal-title').textContent=pick(panels[name][1]);
    const body=$('#modal-body');
    if(name==='doctor'){
      body.innerHTML=doctorContent();visitMenu();refreshStamps();
      if(data.stamps===7&&!data.doorKey)visitLine(t('三つ、そろったね。いちばん下の引き出し。\n開けるのは、君のほうがいい。僕が開けると、だいたい中身を忘れる。','Три отметки. Нижний ящик.\nОткрывай лучше ты. Если открою я, я обычно забываю, что внутри.'),'secret');
    } else if(name==='info'){
      body.innerHTML=`<div class="profile"><img src="${portrait('focused')}" alt=""><span><b>${doctorName()}</b><small>${t('当直医 / EXP. NO. 4041','ДЕЖУРНЫЙ ВРАЧ / № 4041')}</small></span></div>
      <p>${t('パニック診療所は、午前零時だけ開くデジタル病棟。担当のユウ先生は、眠れない端末と増えすぎたウイルスを診ています。','Эта цифровая клиника открывается в полночь. Доктор Юу принимает терминалы, которым не спится, и разбирается с вирусами, которых стало слишком много.')}</p>
      <h3>${t('治療手順：VIRUS BREAK','Как играть в «Вирусный прорыв»')}</h3><ul>
      <li>${t('左のスティックで移動。PCでは矢印キーか WASD。','Для движения используй левый джойстик. На компьютере подойдут стрелки или WASD.')}</li>
      <li>${t('右のカプセルを長押しで攻撃。PCでは Space。','Для атаки удерживай кнопку с капсулой справа или пробел на клавиатуре.')}</li>
      <li>${t('ゲージが満タンならパルス（E）。近くの敵と敵弾を一掃し、短時間だけ無敵に。','Когда шкала заполнится, выпусти импульс (E). Он сметёт ближайших врагов и их снаряды и ненадолго защитит тебя от урона.')}</li>
      <li>${t('連続撃破で倍率アップ。救急箱は三連射、ハートは回復。点滅する走査線からは離れよう。','Побеждай врагов подряд, чтобы увеличить множитель очков. Аптечка даёт тройной выстрел, сердце лечит. Держись подальше от мигающей линии сканера.')}</li></ul>
      <p>${t('この診療所・処方・病棟は架空です。診察の記録はこの端末に保存されます。','Клиника и её рецепты вымышлены. Игровая статистика хранится на этом устройстве.')}</p>
      <button class="solid-button modal-action" data-action="start">${t('夜勤を始める','Начать смену')} ${icon('play')}</button>`;
    } else if(name==='journal'){
      body.innerHTML=`<div class="paper-note"><time>00:04 / E07</time><p>${t('地下病棟を隔離。ウイルスが勝手に診察の順番を入れ替えている。','Подземный блок изолирован. Вирусы самовольно меняют очередь на приём.')}</p></div>
      <div class="paper-note"><time>00:02 / ${t('STAFF','ДЕЖУРСТВО')}</time><p>${t('当直担当はユウ先生。備考：「今日は患者よりカプセルのほうが多い。たぶん」','На смене доктор Юу. Примечание: «Сегодня капсул больше, чем пациентов. Наверное».')}</p></div>
      <div class="paper-note"><time>23:58 / ${t('NOTE','ЗАМЕТКА')}</time><p>${t('受付のいちばん下に、誰かが小さな番号を書き足した。','Кто-то приписал мелкими цифрами номер в самом низу приёмной.')}</p></div>
      <div class="paper-note after-hours-note"><time>00:00 / ${t('手書き','ОТ РУКИ')}</time><p>${t('受付の床ぎわに戸の取っ手。壁紙を貼り替えた人が、取っ手だけよけて貼ったらしい。鍵はユウ先生に返すこと。','У пола в приёмной нашлась дверная ручка. Кто клеил новые обои, обошёл её по краю. Ключ вернуть Юу.')}</p></div>`;
    } else if(name==='records'){
      const stats=[[t('最高記録','Лучший счёт'),pad(data.best)],[t('診察回数','Сыграно игр'),pad(data.runs,2)],[t('前回スコア','Последний счёт'),pad(data.last)],[t('撃破したウイルス','Побеждено вирусов'),String(data.kills)],[t('最長生存','Лучшее время'),`${Math.floor(data.longest/60)}:${pad(data.longest%60,2)}`]];
      if(data.puzzle)stats.push([t('どしゃ降りの最高記録','Рекорд шквала'),String(data.rainBest)]);
      body.innerHTML=stats.map(([label,value])=>`<div class="record-row"><span>${label}</span><strong>${value}</strong></div>`).join('')+
        `<p>${data.runs?t('次の夜勤で記録を塗り替えよう。','Попробуй побить рекорд в следующую смену.'):t('記録はまだありません。夜勤を始めましょう。','Записей пока нет. Начни первую смену!')}</p>
        <details class="backup"><summary>${t('記録のバックアップ','Резервная копия')}</summary><p>${storage?t('保存コードで記録を別の端末に移せます。','С помощью кода можно перенести прогресс на другое устройство.'):t('プレビューを閉じる前に、保存コードを控えてください。','Скопируй код перед тем, как закрыть предпросмотр.')}</p>
        <label for="backup-code">${t('保存コード','Код сохранения')}</label><input id="backup-code" type="text" maxlength="655" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="PC1-…">
        <div class="backup-actions"><button class="toggle" data-action="export">${t('コードを表示','Показать код')}</button><button class="toggle" data-action="import">${t('読み込む','Загрузить')}</button></div><p class="backup-note" role="status" id="backup-note"></p></details>
        <button class="solid-button modal-action" data-action="start">${t('夜勤を始める','Начать смену')} ${icon('play')}</button>`;
    } else if(name==='settings'){
      const toggle=(action,label,on)=>`<div class="setting-row"><span id="setting-${action}">${label}</span><button class="toggle" data-action="${action}" aria-labelledby="setting-${action}" aria-pressed="${on}">${onOff(on)}</button></div>`;
      const level=(k,label)=>`<label class="setting-row" for="${k}"><span>${label} <b id="${k}-value">${Math.round(data[k]*100)}%</b></span><input id="${k}" type="range" min="0" max="100" value="${Math.round(data[k]*100)}"></label>`;
      body.innerHTML=`${toggle('mute',t('サウンド','Звук'),!data.mute)}
      <div class="mix-levels">
        ${level('volume',t('全体の音量','Общая громкость'))}
        ${level('music',t('音楽','Музыка'))}
        ${level('effects',t('効果音','Звуковые эффекты'))}
      </div>
      ${toggle('reduce',t('アニメをおさえる','Меньше анимации'),data.reduce)}
      ${toggle('scares',t('特別な演出','Визуальные эффекты'),data.scares)}
      <h3 class="setting-head">${t('付き添い','Спутник')}</h3>
      <div class="setting-row"><span id="setting-pet">${t('雫を表示','Показывать Шизуку')}</span><button class="toggle" data-action="pet-show" aria-labelledby="setting-pet" aria-pressed="${!data.pet.hidden}">${onOff(!data.pet.hidden)}</button></div>
      <div class="setting-row"><span>${t('機嫌と満腹','Настроение и сытость')} <b id="pet-full-value">${Math.round(data.pet.full)}% · ${data.pet.pets}</b></span><button class="toggle" data-action="pet-feed">${t('ごはん','Покормить')}</button></div>
      <p>${t('雫は診療所のあちこちを漂っています。なでると喜び、放っておくと、ちょっとだけ泣きます。','Шизуку бродит по всей клинике. Гладишь — радуется. Забываешь — тихо плачет.')}</p>
      <p>${t('演出をオフにしても、戸の向こうの話は読めます。ボーナスのウイルスは動かなくなります。','Без спецэффектов разговор за дверью всё равно доступен, а вирусы в бонусной игре не двигаются.')}</p>`;
      for(const k of ['volume','music','effects']){
        $('#'+k).addEventListener('input',e=>{
          data[k]=Number(e.target.value)/100;$('#'+k+'-value').textContent=`${e.target.value}%`;audio.sync();save();
        });
        $('#'+k).addEventListener('change',()=>{if(k!=='music')audio.fx('select');});
      }
    } else if(!data.secret){
      body.innerHTML=`<p>${t('端末の裏に、鍵がかかっている。ユウ先生に話しかけると、何か教えてくれるかも。','За терминалом что-то заперто. Может, доктор Юу подскажет, как туда заглянуть?')}</p><div class="paper-note"><time>${t('AUTH // REQUIRED','НУЖЕН ДОСТУП')}</time></div>`;
    } else {
      body.innerHTML=`<p>${t('一局。君がカプセル、僕がウイルス。三つそろえたら勝ち。\n……小箱には触らないで。ふた、ゆるいから。','Одна партия. У тебя капсулы, у меня вирусы. Три в ряд — победа.\n…Коробочку не трогай. Крышка слабая.')}</p><div class="secret-grid" id="secret-grid" role="group" aria-label="${t('三目並べ','Крестики-нолики с капсулами')}"></div>
      <p class="secret-status" id="secret-status" aria-live="polite"></p>
      <div class="puzzle-actions"><button class="solid-button" data-action="puzzle-reset">${t('もう一局','Ещё партия')} ${icon('arrow')}</button>
      <button class="visit-back" id="rain-launch" data-action="rain-play" ${data.puzzle?'':'hidden'}>${icon('bolt')} ${t('どしゃ降りで遊ぶ','Снова запустить шквал')}</button></div>`;
      newPuzzle();
    }
    if(!modal.open){modal.scrollTop=0;modal.showModal();}
    audio.sync();
    signal(modal,'file');
    updateTelegram();
  }
  $$('[data-open]').forEach(el=>el.addEventListener('click',()=>openModal(el.dataset.open)));
  $('#modal-close').addEventListener('click',()=>modal.close());
  modal.addEventListener('close',()=>{clearTimeout(puzzleTimer);puzzleTimer=0;stopPulse();audio.sync();updateTelegram();});
  modal.addEventListener('click',e=>{
    if(e.target===modal){
      const r=modal.getBoundingClientRect();
      if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close();
      return;
    }
    const el=e.target.closest('button');
    if(!el)return;
    if(el.dataset.cell!==undefined){puzzleMove(Number(el.dataset.cell));return;}
    if(el.dataset.action==='start')startNovel();
    if(el.dataset.action==='puzzle-reset')newPuzzle();
    if(el.dataset.action==='rain-play'&&data.puzzle)rain.start();
    if(el.dataset.action==='doctor-chat'){
      topicMenu();
      audio.fx('select');
    }
    if(el.dataset.action==='doctor-portrait')petDoctor();
    if(el.dataset.action==='doctor-praise')praiseDoctor();
    if(el.dataset.action==='ask-key'){
      const keys=data.doorKey?[t('あの鍵。受付の壁、床から十センチのところ。\n……その先の話は、まだ内緒。','Тот ключ. Приёмная, стена, десять сантиметров от пола.\n…Что за ней — пока секрет.'),'secret']
        :[t('鍵の話は、まだ早い。三つ、そろえてから。','О ключе рано. Сначала три отметки.'),'focused'];
      if(visit!=='menu')visitMenu();
      $('.consult-file').open=false;
      visitLine(keys[0],keys[1]);audio.fx('line');
      $('#visit-heading').focus();
      window.ClinicPet?.react({mood:'calm'});
    }
    if(el.dataset.action==='topic'){
      showTopic(Number(el.dataset.topic));awardStamp(1);refreshStamps();audio.fx('chat');
    }
    if(el.dataset.action==='topic-next'){showTopic(Number(el.dataset.topic),topicBeat+1);audio.fx('chat');}
    if(el.dataset.action==='topic-menu'){topicMenu(false);return;}
    if(el.dataset.action==='doctor-menu'){visitMenu(true);$('#visit-heading').focus({preventScroll:true});}
    if(el.dataset.action==='doctor-pulse'){openPulse();audio.fx('select');}
    if(el.dataset.action==='doctor-snack'){snackMenu();audio.fx('select');}
    if(el.dataset.action==='beat-start'){startPulse();return;}
    if(el.dataset.action==='beat-tap')countBeat();
    if(el.closest('.consult-tray')){
      for(const option of $$('.consult-tray button'))option.setAttribute('aria-pressed',String(option===el));
    }
    if(el.dataset.action==='tea'){
      visitLine(t('熱いの、久しぶり。指が痛いくらいがちょうどいい。\n冷めるまで、君がここにいてくれるなら、もっといい。','Горячее — давно не было. Обжигает пальцы — как раз.\nЕсли ты посидишь, пока остывает, будет ещё лучше.'),'welcome',['お茶、まだ熱い。','Чай ещё горячий.']);
      audio.fx('tea');signal($('.consult-photo'),'steam');
    }
    if(el.dataset.action==='candy'){
      visitLine(t('いちご。……十年ぶりに、引き出しを開けた音がした。\n半分、あげる。袋を開ける音で、たぶん誰か来るけど。','Клубничная. …Впервые за десять лет ящик скрипнул.\nПоловину тебе. На шорох фантика сейчас кто-нибудь придёт.'),'welcome',['飴、もう開けていい？','Уже можно развернуть?']);awardStamp(4);refreshStamps();
      audio.fx('candy');signal($('.consult-photo'),'warm');
    }
    if(el.dataset.action==='take-key'&&data.stamps===7&&!data.doorKey){
      data.doorKey=true;save();syncStats();refreshStamps();
      visitLine(t('三つそろった。……約束は守る。\n鍵は持っていって。受付の床ぎわ、壁紙が浮いてるところ。鍵のほうが、たぶん先に気づく。','Три отметки. …Я держу слово.\nКлюч забирай. В приёмной, у пола, обои отходят. Ключ, скорее всего, заметит первым.'),'secret',['鍵、返さなくていい。','Ключ можешь оставить.']);audio.fx('unlock');haptic('medium');
      $('#visit-heading').focus({preventScroll:true});
    }
    if(el.dataset.action==='export'){
      const field=$('#backup-code');field.value=backup();field.focus();field.select();
      $('#backup-note').textContent=t('表示されたコードをコピーして保管してください。','Скопируй этот код, чтобы сохранить прогресс.');
    }
    if(el.dataset.action==='import'){
      const incoming=decode($('#backup-code').value.trim());
      if(!incoming){$('#backup-note').textContent=t('保存コードを確認してください。','Не удалось прочитать код. Проверь, что он скопирован целиком.');return;}
      const keepLast=data.runs>=incoming.runs;
      for(const k of countKeys)if(k!=='last')data[k]=Math.max(data[k],incoming[k]);
      if(!keepLast)data.last=incoming.last;
      data.secret ||= incoming.secret;
      data.stamps |= incoming.stamps;
      data.seen |= incoming.seen;
      data.doorKey ||= incoming.doorKey;
      data.doorRead ||= incoming.doorRead;
      save();syncStats();openModal('records');
      $('.backup').open=true;$('#backup-note').textContent=t('記録を読み込みました。','Прогресс загружен.');
    }
    if(el.dataset.action==='mute'){
      setMute(!data.mute);el.textContent=onOff(!data.mute);el.setAttribute('aria-pressed',String(!data.mute));
    }
    if(el.dataset.action==='reduce'){
      data.reduce=!data.reduce;syncSettings();save();el.textContent=onOff(data.reduce);el.setAttribute('aria-pressed',String(data.reduce));
    }
    if(el.dataset.action==='scares'){
      data.scares=!data.scares;syncSettings();save();el.textContent=onOff(data.scares);el.setAttribute('aria-pressed',String(data.scares));
    }
    if(el.dataset.action==='pet-show'){
      data.pet.hidden=!data.pet.hidden;save();
      el.textContent=onOff(!data.pet.hidden);el.setAttribute('aria-pressed',String(!data.pet.hidden));
      if(data.pet.hidden)pet?.hide();else pet?.show();
    }
    if(el.dataset.action==='pet-feed'){
      pet?.feed();save();
      const full=$('#pet-full-value');if(full)full.textContent=`${Math.round(data.pet.full)}% · ${data.pet.pets}`;
    }
  });

  const engine=new window.ClinicArcade.Arcade($('#field'),onEvent);
  window.ClinicArcade.drawAvatar($('#chibi-avatar'));
  const keys=new Set(),joy=$('#joystick'),fire=$('#fire');
  let joyID=null,fireID=null,axis={x:0,y:0},cachedHUD='',savedAt=0, resumeFocus=null, lastCharge=0;
  function clearInput(){
    keys.clear();joyID=null;fireID=null;axis={x:0,y:0};
    joy.style.setProperty('--jx','0px');joy.style.setProperty('--jy','0px');
    fire.classList.remove('firing');
    engine.x=0;engine.y=0;engine.held=false;
  }
  function positionJoy(e){
    const box=joy.getBoundingClientRect(),distance=27;
    const x=e.clientX-box.left-box.width/2,y=e.clientY-box.top-box.height/2;
    const len=Math.max(distance,Math.hypot(x,y));
    axis={x:x/len,y:y/len};
    joy.style.setProperty('--jx',`${axis.x*distance}px`);joy.style.setProperty('--jy',`${axis.y*distance}px`);
  }
  joy.addEventListener('pointerdown',e=>{
    if(mode!=='playing'||joyID!==null)return;
    e.preventDefault();joyID=e.pointerId;joy.setPointerCapture(joyID);positionJoy(e);
  });
  joy.addEventListener('pointermove',e=>{if(e.pointerId===joyID)positionJoy(e);});
  for(const event of ['pointerup','pointercancel','lostpointercapture']){
    joy.addEventListener(event,e=>{
      if(e.pointerId!==joyID)return;
      axis={x:0,y:0};joyID=null;joy.style.setProperty('--jx','0px');joy.style.setProperty('--jy','0px');
    });
    fire.addEventListener(event,e=>{if(e.pointerId===fireID){fireID=null;fire.classList.remove('firing');}});
  }
  fire.addEventListener('pointerdown',e=>{
    if(mode!=='playing'||fireID!==null)return;
    e.preventDefault();fireID=e.pointerId;fire.setPointerCapture(fireID);fire.classList.add('firing');
    if(engine.fireIn<=0)engine.fire();
  });
  fire.addEventListener('click',e=>{if(mode==='playing'&&e.detail===0&&engine.fireIn<=0)engine.fire();});
  $('#pulse').addEventListener('click',tryPulse);
  function tryPulse(){
    if(mode!=='playing')return;
    if(!engine.pulse())say(t('パルスはゲージが満タンになってから。','Импульс доступен, когда шкала заполнится.'));
    renderHUD();
  }
  function inputFrame(){
    const held=(...list)=>list.some(k=>keys.has(k));
    engine.x=axis.x+Number(held('ArrowRight','KeyD'))-Number(held('ArrowLeft','KeyA'));
    engine.y=axis.y+Number(held('ArrowDown','KeyS'))-Number(held('ArrowUp','KeyW'));
    engine.held=held('Space')||fireID!==null;
  }
  function renderHUD(){
    const best=Math.max(data.best,engine.score),{score,charge,p,wave,mult}=engine;
    const next=[score,best,charge,p.hp,wave,mult].join();
    if(next===cachedHUD)return;
    cachedHUD=next;
    $('#score').textContent=pad(score);$('#game-best').textContent=pad(best);
    $('#wave').textContent=`${t('WAVE','ВОЛНА')} ${pad(wave,2)}`;
    $('#health').setAttribute('aria-label',`${t('体力','Здоровье')} ${p.hp} / 3`);
    $('#health').innerHTML=Array.from({length:3},(_,i)=>icon('heart',i<p.hp?'':'empty')).join('');
    $('#meter-label').textContent=`${charge}%`;$('#meter-fill').style.width=`${charge}%`;
    $('#meter-fill').parentElement.classList.toggle('full',charge>=100);
    $('#pulse').setAttribute('aria-disabled',String(charge<100));$('#combo').textContent=`${t('COMBO','КОМБО')} ×${mult}`;
    if(lastCharge<100&&charge>=100&&mode==='playing'){audio.fx('ready');signal($('#pulse'),'meter');}
    lastCharge=charge;
  }
  const overlay=$('#game-overlay');
  function dismissOverlay(){
    overlay.hidden=true;overlay.classList.remove('over-art');
    $('#pause').setAttribute('aria-pressed','false');
  }
  function startGame(choice='neutral'){
    if(view==='game'&&mode!=='over')return;
    if(modal.open)modal.close();
    clearInterval(typeTimer);typing=false;
    audio.boot();
    variant=choice;mode='playing';runBest=data.best;runCommitted=false;savedAt=0;data.runs++;save();syncStats();
    engine.reset(choice);clearInput();cachedHUD='';dismissOverlay();show('game');renderHUD();engine.draw();
    audio.fx('wave');signal($('.arena'),'wave');
    $('#pause').disabled=false;document.activeElement?.blur();
    $('#arena-badge').hidden=true;
    pet?.react({kind:'game'});
    if(choice!=='neutral')say(choice==='careful'?t('ユウ：明かりは点けた。机は右。走らないで。','Юу: Свет включил. Стол справа. Не беги.'):t('ユウ：……もう行った。返事、聞いてない。','Юу: …Уже ушёл. Ответа не дождался.'));
  }
  function commitRun(){
    if(runCommitted||view!=='game')return;
    runCommitted=true;data.best=Math.max(data.best,engine.score);data.last=engine.score;
    data.longest=Math.max(data.longest,Math.floor(engine.t));data.kills+=engine.kills;
    save();syncStats();
  }
  function showOverlay(which,focus=true){
    const over=which==='over',leave=which==='leave',record=engine.score>runBest;
    overlay.hidden=false;overlay.dataset.kind=which;overlay.classList.toggle('over-art',over);
    $('#overlay-tag').textContent=over?(record?t('NEW HI-SCORE / 記録更新','НОВЫЙ РЕКОРД'):t('SYSTEM / SESSION END','СИСТЕМА / КОНЕЦ СМЕНЫ')):t('SYSTEM / BREAK','СИСТЕМА / ПЕРЕРЫВ');
    $('#overlay-title').textContent=over?t('GAME OVER','Смена окончена'):leave?t('受付に戻る？','Вернуться в приёмную?'):t('一時停止','Пауза');
    $('#overlay-copy').textContent=over
      ?(record?t('記録、更新。……赤ペンを探す時間がもったいないから、大きく書く。次の人が読めればいい。','Рекорд. …Искать красную ручку долго, напишу крупно. Главное, чтобы следующий прочитал.')
             :t('終わり。脈は、まだある。椅子は戻さなくていい。……戻ってたけど。','Конец. Пульс ещё есть. Стул можно не возвращать. …Он уже вернулся.'))
      :leave?t('ここまでの記録は残る。続きは、椅子に座ってから。','Записанное останется. Продолжим, когда сядешь.')
           :t('待ってる。お茶は、まだ熱い。','Жду. Чай ещё горячий.');
    $('#over-scores').hidden=!over;
    $('#end-score').textContent=pad(engine.score);$('#end-best').textContent=pad(data.best);
    $('#overlay-primary').innerHTML=`${over?t('もう一度','Сыграть ещё'):leave?t('診察に戻る','Вернуться к игре'):t('再開する','Продолжить')} ${icon('play')}`;
    $('#pause').setAttribute('aria-pressed',String(!over));
    $('#pause').disabled=over;
    if(focus)$('#overlay-primary').focus({preventScroll:true});
  }
  function pauseGame(leave=false){
    if(view!=='game'||mode==='over')return;
    if(mode==='paused'&&!leave){
      mode='playing';dismissOverlay();resumeFocus?.focus({preventScroll:true});audio.sync();audio.fx('resume');return;
    }
    if(mode==='playing')resumeFocus=document.activeElement?.id==='pause'?$('#pause'):null;
    mode='paused';clearInput();showOverlay(leave?'leave':'pause');audio.sync();audio.fx('pause');
  }
  function back(){
    if($('#rain').open){rain.close();return;}
    if(modal.open){modal.close();return;}
    if(view==='game'&&mode!=='over'){pauseGame(true);return;}
    if(view!=='home')home();
  }
  function home(){
    if(modal.open)modal.close();
    if(view==='game')commitRun();
    const fromDoor=view==='door';
    clearTimeout(doorTimer);doorTimer=0;
    clearInput();clearInterval(typeTimer);typing=false;mode='home';show('home');syncStats();
    if(fromDoor)scrollTo({top:doorHomeScroll,behavior:'instant'});
    $(fromDoor?'#hidden-door':'#start-btn').focus({preventScroll:true});
  }
  $('#pause').addEventListener('click',()=>pauseGame());
  $('#overlay-primary').addEventListener('click',()=>{if(mode==='over')startGame(variant);else if(mode==='paused')pauseGame();});
  $$('[data-home]').forEach(el=>el.addEventListener('click',home));
  $$('[data-game-back]').forEach(el=>el.addEventListener('click',back));
  $('#brand').addEventListener('click',()=>view==='home'?scrollTo({top:0,behavior:'instant'}):back());
  let arenaBadgeTimer=0;
  function announceBonus(type){
    const badge=$('#arena-badge');
    badge.dataset.effect=type;
    badge.textContent=type==='combo'?t('連続ヒット','Серия!'):t('ボーナス ＋75','Бонус +75');
    badge.hidden=false;
    badge.classList.remove('arrive');void badge.offsetWidth;badge.classList.add('arrive');
    clearTimeout(arenaBadgeTimer);arenaBadgeTimer=setTimeout(()=>{badge.hidden=true;},1120);
  }
  function onEvent(type){
    if(type==='wave')audio.sync();
    audio.fx(type);
    if(['hurt','pulse','wave','combo','bonus'].includes(type))signal($('.arena'),type);
    if(type==='hurt'||type==='pulse'){
      haptic(type==='hurt'?'medium':'heavy');
    }
    if(type==='combo'||type==='bonus')announceBonus(type);
    if(type==='bonus')haptic();
    if(type==='over'){
      commitRun();mode='over';clearInput();renderHUD();showOverlay('over');
      audio.sync();
      pet?.react({kind:'sad',tears:2,mood:'sad',hold:2600});
    }
    if(type==='kill')pet?.hearts(1);
  }
  const gameKeys=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyE','KeyP','Escape']);
  document.addEventListener('keydown',e=>{
    if(modal.open||$('#rain').open)return;
    if(view==='door'&&e.code==='Escape'){e.preventDefault();home();return;}
    if(view==='novel'){
      if(e.code==='Escape'){e.preventDefault();home();}
      else if((e.code==='Space'||e.code==='Enter')&&!e.target.closest('button')){e.preventDefault();if(!e.repeat)advanceLine();}
      return;
    }
    if(view!=='game'||!gameKeys.has(e.code))return;
    if(e.code==='Space'&&e.target.id==='theme-toggle')return;
    if(mode==='playing'||e.code==='KeyP'||e.code==='Escape')e.preventDefault();
    if(!e.repeat&&(e.code==='KeyP'||e.code==='Escape')){if(mode==='over')home();else pauseGame();return;}
    if(mode!=='playing')return;
    keys.add(e.code);if(e.code==='KeyE'&&!e.repeat)tryPulse();
  });
  document.addEventListener('keyup',e=>keys.delete(e.code));
  window.addEventListener('blur',clearInput);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden&&view==='game'&&mode==='playing'){
      data.best=Math.max(data.best,engine.score);save();pauseGame();
    }
    audio.sync();
  });
  window.addEventListener('pagehide',()=>{if(view==='game')commitRun();});
  const demoCanvas=$('#demo');
  let last=performance.now(),debt=0,frame=0,manual=false;
  function simulate(dt){
    if(mode!=='playing')return;
    inputFrame();engine.tick(dt);
    if(engine.t-savedAt>3){
      savedAt=engine.t;
      if(engine.score>data.best){data.best=engine.score;save();}
    }
  }
  const STEP=1/60;
  function loop(now){
    requestAnimationFrame(loop);
    const elapsed=Math.min(.084,(now-last)/1000);last=now;
    if(view==='home'){
      if((frame++%3===0||frame===1)&&!document.hidden)window.ClinicArcade.demo(demoCanvas,now,data.reduce);
      return;
    }
    if(view!=='game'||mode!=='playing'||manual)return;
    debt+=elapsed;
    while(debt>=STEP&&mode==='playing'){simulate(STEP);debt-=STEP;}
    engine.draw();renderHUD();
  }
  let pet=null;
  if(window.ClinicPet&&typeof window.ClinicPet.init==='function'){
    pet=window.ClinicPet;
    pet.init({
      state:data.pet,
      t,
      fx:key=>audio.fx(key==='pop'?'candy':'stroke'),
      onChange:()=>{
        if(!pet)return;
        const s=pet.state;
        data.pet={full:Math.round(s.full*10)/10,pets:s.pets,hidden:s.hidden,x:Number.isFinite(s.x)?Math.round(s.x):null,y:Number.isFinite(s.y)?Math.round(s.y):null};
        save();
      }
    });
  }
  localize();
  $('#theme-toggle').addEventListener('click',event=>{
    data.theme=data.theme==='day'?'night':'day';
    applyTheme();save();
    if(view==='game'&&mode==='playing'&&event.detail>0)event.currentTarget.blur();
  });
  $('#language-toggle').addEventListener('click',()=>{
    data.lang=t('ru','ja');
    save();localize();syncHeader();
    clearTimeout(toastTimer);toast.hidden=true;
    if(view==='novel'){syncNovelLabels();finishLine();}
    if(view==='door'&&doorNode)renderDoor(false);
    if(view==='game'){
      cachedHUD='';renderHUD();engine.draw();
      if(!overlay.hidden)showOverlay(overlay.dataset.kind,false);
    }
    if(modal.open)openModal(modal.dataset.panel);
  });
  requestAnimationFrame(loop);
  window.render_game_to_text=()=>JSON.stringify({view,mode,records:{...data},variant,...(view==='game'?engine.state():{})});
  if(['127.0.0.1','localhost'].includes(location.hostname))window.advanceTime=ms=>{
    manual=true;
    try{
      for(let n=0;n<Math.ceil(Math.min(120000,ms)/1000/STEP)&&mode==='playing';n++)simulate(STEP);
      if(view==='game'){engine.draw();renderHUD();}
    }finally{manual=false;last=performance.now();debt=0;}
  };
})();
