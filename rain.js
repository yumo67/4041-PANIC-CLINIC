/* Second, independent minigame; the arcade scoreboard is never modified here. */
window.ClinicRain=({t,motionOK,pop,best,mute,finish:finishCue,countdown,onChange})=>{
 const $=s=>document.querySelector(s);
 const dialog=$('#rain'),field=$('#rain-field'),summary=$('#rain-summary'),how=$('#rain-how');
 const score=$('#rain-score'),time=$('#rain-time'),closeButton=$('#rain-close');
 const targets=new Set();
 const seconds=22;
 let points=0,deadline=0,pump=0,spawnAt=0,nextId=0,playing=false,still=false;
 const pad=n=>String(n).padStart(2,'0');
 const formatScore=n=>t(`${n} 匹`,`${n}`);
 function discard(btn){
   targets.delete(btn);
   btn.remove();
 }
 function clearField(){
   targets.clear();
   field.replaceChildren();
 }
 function addVirus(lane,offset=0){
   const btn=document.createElement('button');
   btn.type='button';btn.className='rain-virus';
   btn.setAttribute('aria-label',t('ウイルスをはじく','Лопнуть вирус'));
   btn.dataset.lane=lane;
   const id=nextId++;
   btn.dataset.color=String(id%4);
   const duration=5.5+(id%4)*.62;
   if(still){
     btn.style.setProperty('--x',`${14+24*(lane%4)}%`);
     btn.style.setProperty('--y',`${17+23*Math.floor(lane/4)}%`);
   }else{
     const bands=field.clientWidth<600?6:10;
     btn.style.setProperty('--x',`${(lane+.5)/bands*100}%`);
     btn.style.setProperty('--fall',`${duration}s`);
     btn.style.setProperty('--delay',`${-offset*duration}s`);
     btn.style.setProperty('--tilt',`${(id%2?1:-1)*(10+(id%4)*9)}deg`);
   }
   const sprite=document.createElement('img');sprite.src='./assets/virus.webp';
   sprite.alt='';sprite.draggable=false;
   btn.append(sprite);
   btn.addEventListener('animationend',event=>{if(event.target===btn)discard(btn);});
   targets.add(btn);field.append(btn);
 }
 function fill(){
   if(still){
     for(let i=0;i<16;i++){
       if(targets.size>=10)break;
       const lane=(nextId+i*5)%16;
       if(![...targets].some(btn=>Number(btn.dataset.lane)===lane))addVirus(lane);
     }
     return;
   }
   const bands=field.clientWidth<600?6:10;
   if(targets.size<bands*3)addVirus((nextId*3+Math.floor(nextId/2))%bands);
 }
 function stop(){
   clearInterval(pump);pump=0;playing=false;
   clearField();
 }
 function finish(){
   const record=best(points);stop();
   time.textContent='00';how.hidden=true;
   $('#rain-result').textContent=t(`はじけた数 ${formatScore(points)} ／ 最高 ${formatScore(record)}`,`Лопнуто: ${formatScore(points)}. Рекорд шквала: ${formatScore(record)}.`);
   summary.hidden=false;
   $('#rain-replay').focus({preventScroll:true});
   onChange();finishCue();
 }
 function start(){
   stop();
   summary.hidden=true;how.hidden=false;
   if(!dialog.open)dialog.showModal();
   still=!motionOK();dialog.classList.toggle('rain-still',still);
   dialog.classList.remove('rain-finale');
   points=0;nextId=0;score.textContent='00';time.textContent=String(seconds);
   how.textContent=still?t('動かないウイルスをタップしてね。','Нажимай на вирусы. Они не двигаются.'):t('落ちてくるウイルスをタップ！','Лопай вирусы, пока они падают!');
   const now=performance.now();deadline=now+seconds*1000;spawnAt=now+250;playing=true;
   if(still)fill();
   else {
     const bands=field.clientWidth<600?6:10;
     for(let i=0;i<bands;i++)addVirus(i,.08+((i*7)%10)*.065);
   }
   pump=setInterval(()=>{
     const now=performance.now(),left=Math.max(0,Math.ceil((deadline-now)/1000));
     if(!left){finish();return;}
     if(time.textContent!==pad(left)){
       time.textContent=pad(left);
       if(left<=5){dialog.classList.add('rain-finale');countdown();}
     }
     if(now>=spawnAt){fill();spawnAt=now+(still?330:left<9?190:280);}
   },70);
   closeButton.focus({preventScroll:true});
   onChange();
 }
 function close(){
   if(playing)best(points);
   stop();if(dialog.open)dialog.close();
 }
 function burst(btn){
   const r=btn.getBoundingClientRect(),box=field.getBoundingClientRect();
   const mark=document.createElement('span');
   mark.className='rain-pop';mark.setAttribute('aria-hidden','true');
   mark.style.cssText=`left:${r.left+r.width/2-box.left}px;top:${r.top+r.height/2-box.top}px`;
   mark.textContent='+1';
   if(!still)for(let i=0;i<4;i++)mark.append(document.createElement('i'));
   field.append(mark);setTimeout(()=>mark.remove(),490);
 }
 function hit(event,keyboard=false){
   const btn=event.target.closest('.rain-virus');if(!btn||!playing||!targets.has(btn))return;
   points++;score.textContent=pad(points);pop(points);
   burst(btn);discard(btn);
   if(keyboard)(targets.values().next().value||closeButton).focus({preventScroll:true});
 }
 // Capture a touch at contact rather than waiting for click synthesis on a moving target.
 field.addEventListener('pointerdown',event=>{
   if(event.pointerType==='touch'||event.pointerType==='pen')hit(event);
 });
 field.addEventListener('click',event=>hit(event,event.detail===0));
 closeButton.addEventListener('click',close);
 $('#rain-mute').addEventListener('click',mute);
 $('#rain-replay').addEventListener('click',start);
 $('#rain-return').addEventListener('click',close);
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 dialog.addEventListener('close',()=>{
   if(dialog.open)return;
   stop();$('#rain-launch')?.focus({preventScroll:true});onChange();
 });
 return {start,close,running:()=>playing};
};
