(() => {
  'use strict';
  const W = 432, H = 392, TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const hypot = Math.hypot;
  const tr=(ja,ru)=>document.documentElement.lang==='ru'?ru:ja;
  const assets = {};
  const files = {
    spore:'virus', wisp:'wisp', tank:'tank', glitch:'virus',
    pill:'pill', heart:'heart', kit:'kit', monitor:'monitor'
  };
  for (const key of Object.keys(files)) {
    const img = new Image();
    img.src = `./assets/${files[key]}.webp?v=35`;
    assets[key] = img;
  }
  function image(c, key, x, y, w, h = w) {
    const img = assets[key];
    if (!img?.naturalWidth) return false;
    c.drawImage(img, Math.round(x - w / 2), Math.round(y - h / 2), Math.round(w), Math.round(h));
    return true;
  }
  const PIX = window.ClinicChibi;
  function runner(c, x, y, facing = 1, stride = 0, shield = false, blink = false, toss = false) {
    const spr = PIX.frame(stride, blink, toss);
    c.save();
    c.translate(Math.round(x), Math.round(y));
    c.fillStyle = '#160d186e';
    c.beginPath(); c.ellipse(0, 11, 10, 2.5, 0, 0, TAU); c.fill();
    if (shield) {
      c.strokeStyle = '#9cc7ed'; c.fillStyle = '#7ea4e83a';
      c.setLineDash([3, 3]); c.lineWidth = 1.3;
      c.beginPath(); c.arc(0, -4, 19, 0, TAU); c.fill(); c.stroke();
    }
    c.imageSmoothingEnabled = false;
    c.scale(facing, 1);
    const dx = -Math.floor(PIX.W / 2), dy = 11 - PIX.H;
    // A subtle one-pixel rim separates very dark hair and boots from the floor.
    c.save();
    c.globalAlpha *= .5;
    c.filter = 'brightness(0) invert(.86) sepia(.12)';
    for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) c.drawImage(spr, dx + ox, dy + oy);
    c.restore();
    c.drawImage(spr, dx, dy);
    c.restore();
  }
  function drawAvatar(canvas) {
    const c = canvas.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.drawImage(PIX.frame(), (canvas.width - PIX.W) >> 1, (canvas.height - PIX.H) >> 1);
  }
  function capsule(c, x, y, angle, boost) {
    c.save(); c.translate(Math.round(x), Math.round(y)); c.rotate(angle);
    c.fillStyle = boost ? '#ea9c93' : '#f5e5e7'; c.fillRect(-7, -3, 8, 6);
    c.fillStyle = '#661621'; c.fillRect(1, -3, 5, 6);
    c.fillStyle = '#fbdeda80'; c.fillRect(-7, -3, 13, 1);
    c.restore();
  }
  function cross(c, x, y, s, color) {
    c.fillStyle = color; c.fillRect(x-s*1.5,y-s*.5,s*3,s); c.fillRect(x-s*.5,y-s*1.5,s,s*3);
  }
  function text(c, msg, x, y, color, size = 10, align = 'left') {
    c.font = `bold ${size}px monospace`; c.fillStyle = color; c.textAlign = align;
    c.fillText(msg, Math.round(x), Math.round(y));
  }
  function makeFloor() {
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const c = canvas.getContext('2d');
    c.fillStyle = '#282124'; c.fillRect(0,0,W,H);
    for (let y=0; y<H; y+=24) for(let x=0;x<W;x+=24) {
      c.fillStyle = (x/24 + y/24) % 2 ? '#362f30' : '#403635'; c.fillRect(x+1,y+1,23,23);
      c.fillStyle = '#4c3d40'; c.fillRect(x+2,y+2,6,1);
      if (((x*177 + y*95)/24) % 7 === 0) { c.fillStyle='#63494b'; c.fillRect(x+17,y+16,2,2); }
    }
    // painted guide lanes
    c.fillStyle = '#282124'; c.fillRect(0,H/2-1,W,2);
    const shade = c.createRadialGradient(218,161,40,218,170,248);
    shade.addColorStop(0,'#8d313e14'); shade.addColorStop(1,'#2f181bc9');
    c.fillStyle=shade;c.fillRect(0,0,W,H);
    c.strokeStyle='#4c3d40';c.strokeRect(10.5,10.5,W-21,H-21);
    c.strokeStyle='#503b3d';c.setLineDash([4,5]);c.strokeRect(15.5,15.5,W-31,H-31);c.setLineDash([]);
    c.fillStyle='#503b3d';c.fillRect(39,2,354,5); c.fillRect(39,H-8,354,5);
    for(const x of [23,W-23]) for(const y of [23,H-23]) cross(c,x,y,4,'#593036');
    c.fillStyle='#6d3f47';c.fillRect(204,188,24,8);c.fillRect(212,180,8,24);
    c.strokeStyle='#6d3f47';c.strokeRect(195.5,171.5,41,41);
    text(c,'4041 / B1',216,H-23,'#8e6066',9,'center');
    for (const x of [72, W-72]) {
      c.fillStyle='#362f30';c.fillRect(x-21,23,42,17);
      c.fillStyle='#361c1f';c.fillRect(x-19,24,38,13);
      c.fillStyle='#c17983';c.fillRect(x-15,27,4,3);c.fillRect(x-7,27,4,3);
      c.fillStyle='#d06154';c.fillRect(x+11,27,4,3);
    }
    return canvas;
  }
  const rules = [
    { img:'spore',r:12,hp:1,speed:44,points:100,rim:'#d98c96',label:'SPORE' },
    { img:'wisp',r:11,hp:1,speed:82,points:150,rim:'#f5e5e7',label:'WISP' },
    { img:'tank',r:15,hp:3,speed:31,points:225,rim:'#d06154',label:'TANK' },
    { img:'glitch',r:13,hp:2,speed:35,points:250,rim:'#7fa8dc',label:'GLITCH' }
  ];
  const near = (a, b, r) => (a.x-b.x)**2+(a.y-b.y)**2 < r*r;
  class Arcade {
    constructor(canvas, onEvent) {
      this.c=canvas.getContext('2d',{alpha:false});
      this.c.imageSmoothingEnabled=false;
      this.floor=makeFloor();
      this.on=onEvent;
      this.reset();
    }
    reset(variant='neutral') {
      this.variant=variant;
      this.p={x:W/2,y:H*.56,r:10,vx:0,vy:0,hp:3,face:1,hit:0,boost:0,shield:0,toss:0};
      this.enemies=[];this.shots=[];this.bolts=[];this.drops=[];this.fx=[];this.labels=[];this.rings=[];
      this.t=0;this.wave=1;this.score=0;this.charge=0;this.chain=0;this.chainTime=0;
      this.kills=0;this.beat=0;this.spawnIn=.35;this.fireIn=0;this.dropIn=12;this.hazard=null;
      this.active=true;this.held=false;this.x=0;this.y=0;this.lastAim=-Math.PI/2;
      this.noticeTime=2.3;
    }
    get mult(){return 1 + Math.min(4,Math.floor(this.chain/4));}
    spawn(kind) {
      const edge=Math.floor(rnd(0,4)), gap=21;
      let x = edge===1 ? W-gap : edge===3 ? gap : rnd(36,W-36);
      let y = edge===0 ? gap : edge===2 ? H-gap : rnd(36,H-36);
      if(near({x,y},this.p,87)){x=W-x;y=H-y}
      const def=rules[kind];
      this.enemies.push({...def,kind,x,y,seed:rnd(0,TAU),wind:.65,fire:rnd(1,2.4),hurt:0});
    }
    flash(x,y,label,color='#e19ca6'){
      this.labels.push({x,y,label,color,life:.83,max:.83});
    }
    burst(x,y,color,n=8,speed=75){
      for(let i=0;i<n;i++){
        const a=rnd(0,TAU),v=rnd(speed*.25,speed),life=rnd(.22,.57);
        this.fx.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,color,life,max:life,s:rnd(1.5,3.8)});
      }
    }
    pulse(){
      if(!this.active || this.charge<100) return false;
      this.charge=0;this.p.shield=2.2;
      this.rings.push({x:this.p.x,y:this.p.y,life:.56,max:.56});
      this.burst(this.p.x,this.p.y,'#dda8af',32,170);
      this.bolts=[];
      for(const e of [...this.enemies]){
        if (e.wind>0 || !near(e,this.p,160)) continue;
        e.hp-=3;e.hurt=.17;
        if(e.hp<=0)this.kill(e,true);
      }
      this.on('pulse');return true;
    }
    kill(e, viaPulse=false){
      const idx=this.enemies.indexOf(e);if(idx<0)return;
      this.enemies.splice(idx,1); this.kills++;
      this.chain++;this.chainTime=3.4;
      const gain=e.points*this.mult;
      this.score+=gain;
      if (!viaPulse) this.charge=clamp(this.charge+14+e.kind*2,0,100);
      this.burst(e.x,e.y,e.rim,10,98);this.flash(e.x,e.y-11,`+${gain}`,e.rim);
      if(!viaPulse) this.on('kill');
      if(this.chain===4||this.chain===8||this.chain===12||this.chain===16)this.on('combo');
    }
    hit(x,y){
      const p=this.p;
      if(p.hit>0||p.shield>0)return;
      p.hp--;p.hit=1.15;this.chain=0;this.chainTime=0;
      this.charge=clamp(this.charge+13,0,100);
      this.burst(p.x,p.y,'#f884ac',15,110);
      const dx=p.x-x,dy=p.y-y,l=hypot(dx,dy)||1;
      p.x=clamp(p.x+dx/l*13,22,W-22);p.y=clamp(p.y+dy/l*13,21,H-22);
      this.on('hurt');
      if(p.hp<=0){this.active=false;this.on('over');}
    }
    fire(){
      const p=this.p;
      let target=null, min=Infinity;
      for(const e of this.enemies){
        if(e.wind>.22) continue;
        let d=(e.x-p.x)**2+(e.y-p.y)**2;
        if(d<min){min=d;target=e;}
      }
      if(target)this.lastAim=Math.atan2(target.y-p.y,target.x-p.x);
      else if(hypot(p.vx,p.vy)>8)this.lastAim=Math.atan2(p.vy,p.vx);
      const a=this.lastAim;p.face=Math.cos(a)>=0?1:-1;
      const spread=p.boost>0?[-.15,0,.15]:[0];
      for(const v of spread) this.shots.push({x:p.x+Math.cos(a)*13,y:p.y+Math.sin(a)*13,vx:Math.cos(a+v)*305,vy:Math.sin(a+v)*305,life:1.25,angle:a+v,boost:p.boost>0});
      p.toss=.115;this.fireIn=p.boost>0?.18:.25;this.on('shot');
    }
    tick(dt){
      if(!this.active)return;
      const p=this.p;this.t+=dt;
      const wave=1+Math.floor(this.t/17);
      if(wave!==this.wave){
        this.wave=wave;this.noticeTime=2.4;
        this.charge=clamp(this.charge+10,0,100);this.on('wave');
        if(wave%2===0)this.hazard={y:rnd(72,H-71),life:2.75,hit:false};
      }
      this.noticeTime=Math.max(0,this.noticeTime-dt);
      if(this.chainTime>0){this.chainTime-=dt;if(this.chainTime<=0)this.chain=0;}
      if(this.hazard){
        const h=this.hazard;h.life-=dt;
        if(h.life<.73&&h.life>.1&&!h.hit&&Math.abs(p.y-h.y)<19){h.hit=true;this.hit(p.x,p.y-1);if(!this.active)return;}
        if(h.life<=0)this.hazard=null;
      }
      p.hit=Math.max(0,p.hit-dt);p.boost=Math.max(0,p.boost-dt);p.shield=Math.max(0,p.shield-dt);p.toss=Math.max(0,p.toss-dt);
      const len=Math.max(1,hypot(this.x,this.y));
      p.vx=this.x/len*143;p.vy=this.y/len*143;
      p.x=clamp(p.x+p.vx*dt,21,W-21);p.y=clamp(p.y+p.vy*dt,22,H-22);
      if(Math.abs(p.vx)>3)p.face=Math.sign(p.vx);
      this.fireIn-=dt;if(this.held&&this.fireIn<=0)this.fire();
      this.spawnIn-=dt;
      if(this.spawnIn<=0){
        if(this.enemies.length<45){
          const n=Math.random();
          const kind=this.t<4?0:n<.15&&this.wave>=3?3:n<.36&&this.t>13?2:n<.66?1:0;
          this.spawn(kind);
          if(this.wave>=4&&Math.random()<.42)this.spawn(Math.random()<.55?0:1);
        }
        this.spawnIn=Math.max(.36,1.22-(this.wave-1)*.14)*rnd(.75,1.21);
      }
      this.dropIn-=dt;
      if(this.dropIn<=0){
        const kind=p.hp<3&&this.drops.every(d=>d.kind!=='heart')?'heart':'kit';
        this.drops.push({x:rnd(58,W-58),y:rnd(58,H-54),kind,life:11});
        this.dropIn=rnd(12,17);
      }
      for(const e of this.enemies){
        e.hurt=Math.max(0,e.hurt-dt);
        if(e.wind>0){e.wind-=dt;continue;}
        const dx=p.x-e.x,dy=p.y-e.y,length=hypot(dx,dy)||1;
        const speed=e.speed+Math.min(46,(this.wave-1)*5);
        const wobble=e.kind===1?Math.sin(this.t*5+e.seed)*.55:0;
        const a=Math.atan2(dy,dx)+wobble;
        const movement=e.kind===3?(length>120?1:length<85?-.65:.09):e.kind===2&&Math.sin(this.t*3+e.seed)>.7?2:1;
        e.x=clamp(e.x+Math.cos(a)*speed*movement*dt,18,W-18);
        e.y=clamp(e.y+Math.sin(a)*speed*movement*dt,18,H-18);
        if(e.kind===3){
          e.fire-=dt;
          if(e.fire<=0){
            e.fire=rnd(1.7,2.6);
            this.bolts.push({x:e.x,y:e.y,vx:Math.cos(a)*112,vy:Math.sin(a)*112,life:4});
          }
        }
      }
      for(let i=this.shots.length-1;i>=0;i--){
        const b=this.shots[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
        if(b.life<=0||b.x<0||b.x>W||b.y<0||b.y>H){this.shots.splice(i,1);continue;}
        let enemy=null;
        for(const e of this.enemies){if (e.wind<=0&&near(b,e,e.r+3)){enemy=e;break;}}
        if(enemy){
          this.shots.splice(i,1);enemy.hp--;enemy.hurt=.13;
          enemy.x=clamp(enemy.x+b.vx*dt*.6,18,W-18);enemy.y=clamp(enemy.y+b.vy*dt*.6,18,H-18);
          if(enemy.hp<=0)this.kill(enemy);
          else {this.burst(b.x,b.y,'#f5bbcc',5,60);this.on('hit');}
        }
      }
      for(let i=this.bolts.length-1;i>=0;i--){
        const b=this.bolts[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
        if(near(b,p,12)){this.bolts.splice(i,1);this.hit(b.x,b.y);if(!this.active)return;}
        else if(b.life<=0||b.x<0||b.x>W||b.y<0||b.y>H)this.bolts.splice(i,1);
      }
      for(const e of this.enemies)if(e.wind<=0&&near(p,e,e.r+7)){
        this.hit(e.x,e.y);if(!this.active)return;
      }
      for(let i=this.drops.length-1;i>=0;i--){
        const d=this.drops[i];d.life-=dt;
        if(near(d,p,25)){
          this.drops.splice(i,1);
          if(d.kind==='kit'){p.boost=7;this.charge=clamp(this.charge+24,0,100);}
          else p.hp=Math.min(3,p.hp+1);
          this.score+=75;this.on('bonus');this.burst(d.x,d.y,'#e0b2b8',13);
          this.flash(d.x,d.y-12,d.kind==='kit'?['TRIPLE SHOT','ТРОЙНОЙ ВЫСТРЕЛ']:['LIFE +1','ЗДОРОВЬЕ +1'],'#e19ca6');
        } else if(d.life<=0)this.drops.splice(i,1);
      }
      this.beat+=dt;
      if(this.beat>=1){this.beat-=1;this.score+=12*this.wave;}
      for(const f of this.fx){f.x+=f.vx*dt;f.y+=f.vy*dt;f.life-=dt;}
      for(const list of [this.labels,this.rings])for(const f of list)f.life-=dt;
      this.fx=this.fx.filter(f=>f.life>0);this.labels=this.labels.filter(f=>f.life>0);this.rings=this.rings.filter(f=>f.life>0);
    }
    draw(){
      const {c,p,t}=this;
      c.drawImage(this.floor,0,0);
      for (const x of [72,W-72]){
        c.fillStyle='#d98c96';c.fillRect(x+11,27,3,Math.sin(t*4)>-.6?3:1);
      }
      c.fillStyle=this.variant==='careful'?'#d98c96':this.variant==='wild'?'#d06154':'#b7a4dc';
      c.fillRect(14,H-7,17,2);c.fillRect(W-31,H-7,17,2);
      if(this.hazard){
        const h=this.hazard,y=Math.round(h.y);c.fillStyle=h.life>.73?'#c9786a1e':'#d9737a52';c.fillRect(13,y-16,W-26,32);
        c.strokeStyle=h.life>.73?'#c9786a':'#f2b2ad';c.lineWidth=1;c.setLineDash([6,6]);
        c.strokeRect(13.5,y-16.5,W-27,32);c.setLineDash([]);
        if(h.life>.73)text(c,tr('! SCAN LINE !','! ЛИНИЯ СКАНЕРА !'),W/2,y+3,'#f6cfc2',10,'center');
      }
      for(const d of this.drops){
        if(d.life<2&&Math.sin(t*14)>.5)continue;
        const y=d.y+Math.sin(t*5)*3;
        c.fillStyle='#efd2cf4e';c.fillRect(d.x-12,y-12,24,24);c.strokeStyle='#eed4d1';c.strokeRect(d.x-13.5,y-13.5,27,27);
        if(!image(c,d.kind,d.x,y,19))cross(c,d.x,y,4,'#eed4d1');
      }
      for(const e of this.enemies){
        const x=Math.round(e.x),y=Math.round(e.y);
        c.strokeStyle=e.rim;c.lineWidth=1;
        if(e.wind>0){
          c.globalAlpha=.5+.4*Math.sin(t*20);
          c.strokeRect(x-9.5,y-9.5,19,19);
          cross(c,x,y,3,e.rim);c.globalAlpha=1;continue;
        }
        c.fillStyle='#30171b';c.fillRect(x-e.r,y+e.r-3,e.r*2,5);
        c.fillStyle=e.rim+'4d';c.fillRect(x-e.r-2,y-e.r-2,(e.r+2)*2,(e.r+2)*2);
        c.strokeRect(x-e.r-2.5,y-e.r-2.5,(e.r+2)*2+1,(e.r+2)*2+1);
        if(e.hurt>0)c.filter='brightness(1.85)';
        if(e.kind===3&&e.hurt<=0)c.filter='hue-rotate(208deg) saturate(1.7) brightness(1.08)';
        if(!image(c,e.img,x,y+Math.sin(t*6+e.seed),e.r*2+5))cross(c,x,y,5,e.rim);
        c.filter='none';
        if(e.kind===2||e.kind===3){
          c.fillStyle='#1e1523';c.fillRect(x-9,y+e.r+4,18,2);
          c.fillStyle=e.rim;c.fillRect(x-9,y+e.r+4,e.hp*(e.kind===2?6:9),2);
        }
      }
      for(const b of this.shots){
        if(b.boost){
          c.save();c.globalAlpha=.55;c.fillStyle='#ea9c93';
          c.fillRect(b.x-6,b.y+4,12,3);c.restore();
        }
        capsule(c,b.x,b.y,b.angle,b.boost);
      }
      for(const b of this.bolts){
        c.fillStyle='#e0878f';c.fillRect(b.x-3,b.y-3,6,6);
        c.fillStyle='#f7ddd6';c.fillRect(b.x-1,b.y-1,2,2);
      }
      if(p.hit<=0||Math.floor(t*16)%2===0){
        const moving = hypot(p.vx,p.vy)>4;
        const stride = moving ? [0, 1, 0, -1][Math.floor(t * 18) % 4] : 0;
        runner(c,p.x,p.y,p.face,stride,p.shield>0,!moving && t % 4.3 > 4.18,p.toss>0);
      }
      if(p.boost>0)text(c,'×3',p.x,p.y+23,'#ebc8c4',9,'center');
      for(const f of this.fx){c.globalAlpha=f.life/f.max;c.fillStyle=f.color;c.fillRect(Math.round(f.x),Math.round(f.y),Math.round(f.s),Math.round(f.s));}
      c.globalAlpha=1;
      for(const f of this.rings){
        const a=f.life/f.max,r=(1-a)*155+5;
        c.globalAlpha=a;c.strokeStyle='#f5e5e7';c.lineWidth=4*a+1;
        c.beginPath();c.arc(f.x,f.y,r,0,TAU);c.stroke();
        c.strokeStyle='#d98c96';c.lineWidth=1;c.beginPath();c.arc(f.x,f.y,r*.82,0,TAU);c.stroke();
      }
      c.globalAlpha=1;
      for(const f of this.labels){c.globalAlpha=clamp(f.life*2.5,0,1);text(c,Array.isArray(f.label)?tr(...f.label):f.label,f.x,f.y-(1-f.life/f.max)*19,f.color,11,'center');}
      c.globalAlpha=1;
      if(this.noticeTime>0){
        c.globalAlpha=Math.min(1,this.noticeTime*3);
        const label=`${tr('WARD B1 // WAVE','БЛОК B1 // ВОЛНА')} ${String(this.wave).padStart(2,'0')}`;
        c.fillStyle='#321619e6';c.fillRect(W/2-89,18,178,19);
        c.strokeStyle='#593036';c.strokeRect(W/2-89.5,17.5,179,20);
        text(c,label,W/2,31,'#e6adb4',10,'center');c.globalAlpha=1;
      }
    }
    state(){
      const round=v=>Math.round(v*10)/10, pos=o=>({x:round(o.x),y:round(o.y)});
      return {coordinates:'top-left; x right, y down',t:round(this.t),wave:this.wave,score:this.score,charge:this.charge,kills:this.kills,combo:this.mult,player:{...pos(this.p),hp:this.p.hp,boost:round(this.p.boost),shield:round(this.p.shield)},enemies:this.enemies.map(e=>({...pos(e),kind:e.label,hp:e.hp,spawning:e.wind>0})),shots:this.shots.map(pos),bolts:this.bolts.map(pos),bonuses:this.drops.map(d=>({...pos(d),kind:d.kind})),scan:this.hazard?{y:round(this.hazard.y),in:round(this.hazard.life-.73)}:null};
    }
  }
  function demo(canvas, t, reduced=false){
    const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
    const y=canvas.height;
    c.fillStyle='#282124';c.fillRect(0,0,W,y);
    for(let iy=0;iy<y;iy+=16)for(let x=0;x<W;x+=16){
      c.fillStyle=(x+iy)%32?'#362f30':'#403635';c.fillRect(x+1,iy+1,15,15);
    }
    c.fillStyle='#282124';c.fillRect(0,y/2-1,W,2);
    c.setLineDash([6,4]);c.strokeStyle='#593036';c.strokeRect(6.5,8.5,W-13,y-17);c.setLineDash([]);
    for(const x of [16,W-17]) c.fillStyle='#d98c96',c.fillRect(x,11,2,y-23);
    cross(c,313,62,19,'#6d3f47');
    const u=reduced?1:t/1000;
    const dx=228+Math.sin(u*1.7)*23,dy=76+Math.cos(u*2)*9;
    runner(c,dx,dy,1,reduced ? 0 : [0, 1, 0, -1][Math.floor(u*16)%4],false,false,!reduced && u % .5 < .12);
    for(const [i,x,a,key] of [[0,347,11,'spore'],[1,288,28,'wisp'],[2,374,20,'tank']]){
      const ex=x+Math.sin(u*(1.2+i*.1)+i)*a,ey=25+i*39+Math.cos(u*2+i)*6;
      c.strokeStyle=['#d98c96','#f5e5e7','#d06154'][i];c.globalAlpha=.55;
      c.strokeRect(ex-12,ey-12,24,24);c.globalAlpha=1;
      image(c,key,ex,ey,26);
    }
    image(c,'kit',310,108,17);
    for(let i=0;i<6;i++){
      const px=dx+14+(u*133+i*24)%118, py=dy-14+(i%3-1)*6;
      capsule(c,px,py,Math.PI,false);
    }
    text(c,tr('▣ REC','▣ ЗАПИСЬ'),W-20,17,'#d98c96',8,'right');
  }
  window.ClinicArcade={Arcade,demo,runner,drawAvatar};
})();
