/* Shizuku — the clinic's drip-bag pet. It follows you through every screen and cries. */
window.ClinicPet=(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SPEECH={
    calm:[
      ['……しずく、たれてる。','…Капает.'],
      ['ここ、すこし寒いね。','Здесь немного холодно.'],
      ['みず、まだある？','Вода ещё есть?'],
      ['ばい菌、みつけた。……たぶん。','Нашла микроб. …Наверное.'],
      ['ないても、へらないよ。','Слёзы не убывают.']
    ],
    petted:[
      ['……あったかい。','…Тепло.'],
      ['もっと、ゆっくりでいい。','Можно помедленнее.'],
      ['ここ、しずくの場所。','Здесь место капли.'],
      ['なでると、ちょっとだけ止まる。','Когда гладят, капает меньше.'],
      ['ありがと。……まだ、ちょっとだけ。','Спасибо. …Ещё чуть-чуть.']
    ],
    hungry:[
      ['おなか、すいた。','Голодно.'],
      ['あめ、くれる？','Дай конфетку?'],
      ['からっぽ。からっぽ。','Пусто. Пусто.'],
      ['みずだけじゃ、さみしい。','Одной воды мало.']
    ],
    fed:[
      ['……あまい。','…Сладко.'],
      ['いちご。すき。','Клубника. Люблю.'],
      ['これで、もうすこし、もつ。','Теперь продержусь ещё немного.'],
      ['ありがと。ないてない。','Спасибо. Я не плачу.']
    ],
    sad:[
      ['……ねえ、だいじょうぶ？','…Эй, ты в порядке?'],
      ['しずくは、ここにいるよ。','Капля здесь.'],
      ['ないても、いいよ。','Плакать можно.'],
      ['わたしも、ないてる。','Я тоже плачу.']
    ],
    happy:[
      ['やった。','Получилось.'],
      ['いいかんじ。','Хорошо.'],
      ['しずく、うれしい。','Капле радостно.'],
      ['もういっかい。','Ещё раз.']
    ],
    door:[
      ['……しーっ。','…Тсс.'],
      ['むこう、だれかいる。','Там кто-то есть.'],
      ['しずく、ちいさくなる。','Капля становится меньше.'],
      ['こわい、けど、きく。','Страшно, но слушаю.']
    ],
    game:[
      ['がんばって。','Держись.'],
      ['うしろ！','Сзади!'],
      ['しずく、おうえん。','Капля болеет за тебя.'],
      ['あぶない。','Осторожно.']
    ],
    sleepy:[
      ['……すこし、ねる。','…Вздремну.'],
      ['め、とじる。','Глаза закрываются.'],
      ['おやすみ。','Спокойной ночи.']
    ]
  };

  const state={full:60,pets:0,mood:'calm',hidden:false,x:null,y:null,sleeping:false};
  let t,root,bubble,tearLayer,feedBtn,drift=0,idleTimer=0,blinkTimer=0,lastScroll=0,scrollVel=0;
  let dragging=null,moved=false;
  let hooks={t:(ja,ru)=>ru,onChange:()=>{},fx:()=>{}};

  const site=()=>document.documentElement.lang==='ru'?'ru':'ja';
  const tr=pair=>hooks.t(pair[0],pair[1]);
  const pick=list=>tr(list[Math.floor(Math.random()*list.length)]);

  function svg(){
    return `<svg class="pet-body" viewBox="0 0 64 76" aria-hidden="true">
      <defs>
        <linearGradient id="petFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="var(--pet-hi)"/><stop offset="1" stop-color="var(--pet-lo)"/>
        </linearGradient>
        <clipPath id="petClip"><path d="M32 3c8 11 19 22 19 34a19 19 0 0 1-38 0C13 25 24 14 32 3Z"/></clipPath>
      </defs>
      <path class="pet-shape" d="M32 3c8 11 19 22 19 34a19 19 0 0 1-38 0C13 25 24 14 32 3Z" fill="url(#petFill)" stroke="var(--pet-line)" stroke-width="1.6"/>
      <g clip-path="url(#petClip)" class="pet-shine">
        <ellipse cx="24" cy="22" rx="4.6" ry="7" fill="var(--pet-hi)" opacity=".85"/>
        <ellipse cx="38" cy="52" rx="11" ry="8" fill="var(--pet-lo)" opacity=".5"/>
      </g>
      <g class="pet-face">
        <ellipse class="pet-eye" cx="25" cy="36" rx="2.4" ry="2.9" fill="var(--pet-ink)"/>
        <ellipse class="pet-eye" cx="39" cy="36" rx="2.4" ry="2.9" fill="var(--pet-ink)"/>
        <path class="pet-mouth" d="M29 43q3 2.6 6 0" fill="none" stroke="var(--pet-ink)" stroke-width="1.4" stroke-linecap="round"/>
        <ellipse cx="20" cy="42" rx="3" ry="1.8" fill="var(--pet-blush)" opacity=".55"/>
        <ellipse cx="44" cy="42" rx="3" ry="1.8" fill="var(--pet-blush)" opacity=".55"/>
      </g>
      <g class="pet-band" transform="rotate(-16 32 26)">
        <rect x="20" y="22" width="24" height="7" rx="3" fill="var(--pet-band)" stroke="var(--pet-line)" stroke-width="1"/>
        <rect x="29.4" y="23.4" width="5.6" height="4.2" fill="var(--pet-line)" opacity=".55"/>
      </g>
      <circle class="pet-drip" cx="54" cy="66" r="2.6" fill="var(--pet-tear)"/>
    </svg>`;
  }

  function build(){
    root=document.createElement('div');
    root.id='pet';root.className='pet';root.dataset.mood='calm';
    root.innerHTML=`
      <div class="pet-stack">
        <div class="pet-bubble" id="pet-bubble" role="status" aria-live="polite" hidden></div>
        <button class="pet-hit" id="pet-hit" type="button">
          <span class="pet-shadow" aria-hidden="true"></span>
          <span class="pet-tears" aria-hidden="true"></span>
          ${svg()}
          <span class="pet-name">しずく<i>/ SHIZUKU</i></span>
        </button>
        <div class="pet-bar" aria-hidden="true"><i id="pet-fill"></i></div>
        <button class="pet-feed" id="pet-feed" type="button"><span>＋</span></button>
        <div class="pet-care">
          <div class="pet-care-name"><small>03 / SHIZUKU</small><h2 id="companion-title"></h2></div>
          <div class="pet-care-meter">
            <span id="pet-meter-label"></span><b id="pet-meter-value" aria-hidden="true"></b>
            <div id="pet-meter" role="meter" aria-labelledby="pet-meter-label" aria-valuemin="0" aria-valuemax="100"><i></i></div>
          </div>
          <div class="pet-care-actions">
            <button type="button" id="pet-stroke"><svg aria-hidden="true"><use href="#i-hand"/></svg><span></span></button>
            <button type="button" id="pet-treat"><svg aria-hidden="true"><use href="#i-candy"/></svg><span></span></button>
          </div>
        </div>
        <div class="pet-care-voice"><svg aria-hidden="true"><use href="#i-chat"/></svg><span id="pet-care-reply" role="status"></span></div>
      </div>`;
    document.body.append(root);
    bubble=$('#pet-bubble');tearLayer=root.querySelector('.pet-tears');
    feedBtn=$('#pet-feed');
    const hit=$('#pet-hit');
    hit.addEventListener('pointerdown',down);
    window.addEventListener('pointermove',move,{passive:true});
    window.addEventListener('pointerup',up);
    window.addEventListener('pointercancel',up);
    hit.addEventListener('click',event=>{if(!moved)stroke(event);});
    hit.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();stroke();}
    });
    hit.addEventListener('dblclick',event=>{event.preventDefault();talk('calm');});
    feedBtn.addEventListener('click',event=>{event.stopPropagation();feed();});
    $('#pet-stroke').addEventListener('click',()=>stroke());
    $('#pet-treat').addEventListener('click',feed);
    root.addEventListener('pointerdown',()=>{}, {passive:true});
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('clinic:pet',event=>react(event.detail||{}));
    document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimers();else schedule();});
  }

  function down(event){
    const hit=$('#pet-hit');
    moved=false;
    if(root.classList.contains('docked'))return;
    if(event.target.closest('.pet-feed'))return;
    dragging={id:event.pointerId,sx:event.clientX,sy:event.clientY,ox:root.offsetLeft,oy:root.offsetTop};
    hit.setPointerCapture?.(event.pointerId);
    root.classList.add('grabbing');
  }
  function move(event){
    if(!dragging||event.pointerId!==dragging.id)return;
    const dx=event.clientX-dragging.sx,dy=event.clientY-dragging.sy;
    if(Math.abs(dx)+Math.abs(dy)>4)moved=true;
    if(!moved)return;
    const w=root.offsetWidth,h=root.offsetHeight;
    const x=Math.max(4,Math.min(innerWidth-w-4,dragging.ox+dx));
    const y=Math.max(4,Math.min(innerHeight-h-4,dragging.oy+dy));
    root.style.left=x+'px';root.style.top=y+'px';root.style.right='auto';root.style.bottom='auto';
    state.x=x;state.y=y;
  }
  function up(event){
    if(!dragging||(event&&event.pointerId!==dragging.id))return;
    dragging=null;root.classList.remove('grabbing');
    if(moved){hooks.onChange();}
  }

  function onScroll(){
    const now=performance.now(),y=scrollY;
    scrollVel=(y-lastScroll)/Math.max(1,now-lastT);lastScroll=y;lastT=now;
    if(reduce()||state.sleeping)return;
    root.style.setProperty('--pet-drift',`${Math.max(-26,Math.min(26,scrollVel*11))}px`);
  }
  let lastT=performance.now();

  function tear(n=1,soft=false){
    if(state.sleeping||reduce()||!tearLayer)return;
    if(tearLayer.childElementCount>7)return;
    for(let i=0;i<n;i++){
      const d=document.createElement('span');
      d.className='pet-tear'+(soft?' soft':'');
      d.style.setProperty('--tx',`${-16+Math.random()*32}px`);
      d.style.animationDelay=`${i*90}ms`;
      tearLayer.append(d);
      setTimeout(()=>d.remove(),1500);
    }
  }

  function hearts(n=4){
    if(!root)return;
    for(let i=0;i<n;i++){
      const h=document.createElement('span');
      h.className='pet-heart';h.textContent=['♥','✦','·'][i%3];
      h.style.setProperty('--hx',`${-30+Math.random()*60}px`);
      h.style.setProperty('--hd',`${i*70}ms`);
      root.append(h);
      setTimeout(()=>h.remove(),1200);
    }
  }

  function say(text,ms=3400){
    if(!bubble||!text)return;
    if(root.classList.contains('docked')){
      $('#pet-care-reply').textContent=text;
      return;
    }
    bubble.textContent=text;bubble.hidden=false;
    root.classList.add('talking');
    clearTimeout(say.timer);
    say.timer=setTimeout(()=>{bubble.hidden=true;root.classList.remove('talking');},ms);
  }

  function talk(kind){
    const bank=SPEECH[kind]||SPEECH.calm;
    say(pick(bank));
    if(kind==='calm')tear(1,true);
  }

  function stroke(event){
    state.pets++;state.mood='happy';
    root.dataset.mood='happy';
    hearts(5);
    say(pick(SPEECH.petted));
    tear(0);
    hooks.fx('chat');
    if(navigator.vibrate)try{navigator.vibrate(8);}catch{}
    root.classList.remove('pulse');void root.offsetWidth;root.classList.add('pulse');
    hooks.onChange();setMood('calm',2600);
    bubble.dataset.count=String(state.pets);
  }

  function feed(){
    if(state.full>=100){say(tr(['もう、いっぱい。','Я уже полная.']));return;}
    state.full=Math.min(100,state.full+26);
    syncBar();
    if(state.full>30)setMood('calm',0);
    root.classList.remove('munch');void root.offsetWidth;root.classList.add('munch');
    say(pick(SPEECH.fed));hooks.fx('pop');hooks.onChange();hearts(2);
  }

  function setMood(mood,back=0){
    state.mood=mood;root.dataset.mood=mood;
    if(back)setTimeout(()=>{if(state.mood===mood){state.mood='calm';root.dataset.mood='calm';}},back);
  }

  function react(detail){
    if(!root)return;
    if(detail.hide){root.hidden=true;return;}
    if(detail.sleep!==undefined){
      state.sleeping=detail.sleep;root.classList.toggle('sleeping',state.sleeping);return;
    }
    if(detail.mood)setMood(detail.mood,detail.hold||0);
    if(detail.line)say(tr(detail.line));
    if(detail.kind&&SPEECH[detail.kind])talk(detail.kind);
    if(detail.tears)tear(detail.tears);
    if(detail.hearts)hearts(detail.hearts);
  }

  function syncBar(){
    const fill=$('#pet-fill');
    if(fill)fill.style.width=`${state.full}%`;
    if(root)root.dataset.hungry=state.full<34?'true':'false';
    const percent=Math.round(state.full),meter=$('#pet-meter');
    $('#pet-meter-value').textContent=`${percent}%`;
    meter.setAttribute('aria-valuenow',String(percent));
    meter.firstElementChild.style.width=`${state.full}%`;
  }

  function idleLoop(){
    clearTimeout(idleTimer);
    idleTimer=setTimeout(()=>{
      if(document.hidden){idleLoop();return;}
      if(state.sleeping){idleLoop();return;}
      const hungry=state.full<34;
      const roll=Math.random();
      if(hungry&&roll<.45){talk('hungry');setMood('hungry',1800);}
      else if(roll<.32){tear(1);}
      else if(roll<.5){talk('calm');}
      else if(roll<.58){say(pick(SPEECH.sleepy));}
      idleLoop();
    },5200+Math.random()*7000);
  }
  function schedule(){
    idleLoop();
    clearInterval(blinkTimer);
    blinkTimer=setInterval(()=>{
      if(document.hidden||state.sleeping)return;
      root.classList.add('blink');
      setTimeout(()=>root.classList.remove('blink'),190);
    },4200+Math.random()*2600);
  }
  function clearTimers(){clearTimeout(idleTimer);clearInterval(blinkTimer);clearTimeout(say.timer);}

  function syncHunger(dt){
    state.full=Math.max(0,state.full-(dt/60000)*1.1);
    syncBar();
  }

  function setView(view){
    if(!root)return;
    const dock=view==='home' ? $('#pet-dock') : null;
    const parent=dock||document.body;
    if(root.parentElement===parent)return;
    parent.append(root);
    root.classList.toggle('docked',Boolean(dock));
    for(const key of ['left','top','right','bottom','--pet-drift'])root.style.removeProperty(key);
    if(!dock&&state.x!=null&&state.y!=null){
      root.style.left=Math.max(4,Math.min(state.x,innerWidth-90))+'px';
      root.style.top=Math.max(4,Math.min(state.y,innerHeight-120))+'px';
      root.style.right='auto';root.style.bottom='auto';
    }
  }
  function localize(){
    $('#pet-hit')?.setAttribute('aria-label',tr(['しずくをなでる','Погладить Шизуку']));
    feedBtn?.setAttribute('aria-label',tr(['しずくにおやつをあげる','Угостить Шизуку']));
    $('#companion-title').textContent=tr(['しずく','Шизуку']);
    $('#pet-meter-label').textContent=tr(['満腹度','Сытость']);
    $('#pet-stroke span').textContent=tr(['なでる','Погладить']);
    $('#pet-treat span').textContent=tr(['おやつをあげる','Угостить']);
    $('#pet-care-reply').textContent=tr(['……ここ、あったかい。','…Здесь тепло.']);
  }
  function init(options={}){
    hooks={...hooks,...options};
    if(!document.body)return;
    const saved=options.state;
    if(saved)Object.assign(state,{
      full:Number.isFinite(saved.full)?saved.full:state.full,
      pets:Number.isFinite(saved.pets)?saved.pets:0,
      hidden:Boolean(saved.hidden),
      x:Number.isFinite(saved.x)?saved.x:null,
      y:Number.isFinite(saved.y)?saved.y:null
    });
    build();
    setView(document.body.dataset.view||'home');
    localize();
    if(state.hidden)root.hidden=true;
    syncBar();schedule();
    setInterval(()=>syncHunger(1000),1000);
    if(state.full<30)setMood('hungry');
    setTimeout(()=>say(tr(['……みつけた。','…Нашла тебя.'])),1600);
    return api;
  }

  const api={
    init,setView,localize,show(){if(root){root.hidden=false;state.hidden=false;hooks.onChange();}},
    hide(){if(root){root.hidden=true;state.hidden=true;hooks.onChange();}},
    toggle(){if(root.hidden)api.show();else api.hide();},
    say,feed,tear,hearts,react,
    get state(){return {...state};}
  };
  return api;
})();
