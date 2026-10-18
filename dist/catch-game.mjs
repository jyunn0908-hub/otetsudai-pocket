import {CREATURES} from './growth.mjs?art=21';
import {MAX_FRUIT,CATCH_MS} from './care.mjs?art=21';
// A 288px logical field at integer scale. Existing native character pixels
// are copied 1:1, and movement is rounded to whole pixels.
export function createRound(){return {x:144,score:0,caught:0,bombs:0,feedback:null,spawned:0,fruits:[]}}
export function stepRound(s,elapsed,dt,random=Math.random){
 const due=Math.min(MAX_FRUIT,Math.floor(elapsed/1000)+1);
 // No catch-up fruit burst after a background tab resumes.
 if(due>s.spawned){s.spawned=due;if(elapsed<CATCH_MS-3000)s.fruits.push({x:12+Math.floor(random()*264),y:-12,kind:due%4===0?3:due%3})}
 for(const f of s.fruits){f.y+=Math.min(dt,80)*0.115;if(!f.done&&f.y>=295){f.done=true;if(f.y<312&&Math.abs(f.x-s.x)<=30){const bomb=f.kind===3;s.score+=bomb?-2:1;if(bomb)s.bombs++;else s.caught++;s.feedback={bomb,until:elapsed+800}}}}
 s.fruits=s.fruits.filter(f=>!f.done&&f.y<330);return s;
}
const patterns=[['..gg....','...g....','..rrrr..','.rrrrrr.','rrrrrrrr','rrrrrrrr','.rrrrrr.','..rrrr..'],['..ggg...','.ggggg..','..rrrr..','.rwrwrr.','.rrwrwr.','..rrrr..','...rr...','........'],['...gg...','....g...','..oooo..','.oooooo.','oooooooo','oooooooo','.oooooo.','..oooo..'],['.....o..','....g.o.','..bbbb..','.bwbbbbb','bbbbbbbb','bbbbbbbb','.bbbbbb.','..bbbb..']];
export async function loadPetSheet(){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('キャラを読みこめませんでした。もう一度試してね'));im.src='./pets-native.png'})}
export function mountCatch(root,{sheet,character='sprout',onFinish}){
 const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'),timer=root.querySelector('[data-timer]'),score=root.querySelector('[data-score]');
 const s=createRound(),controller=new AbortController(),signal=controller.signal;
 let start=performance.now(),last=start,raf=0,done=false,held=0;
 const sprite=CREATURES[character]?.sprite||0;
 const pointer=e=>{if(done)return;const r=canvas.getBoundingClientRect();s.x=Math.max(48,Math.min(240,Math.round((e.clientX-r.left)*288/r.width)))};
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointer(e)}, {signal});
 canvas.addEventListener('pointermove',e=>{if(e.buttons)pointer(e)},{signal});
 canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();held=e.key==='ArrowLeft'?-1:1;s.x=Math.max(48,Math.min(240,s.x+held*10))}},{signal});
 canvas.addEventListener('keyup',()=>held=0,{signal});canvas.addEventListener('blur',()=>held=0,{signal});
 root.querySelectorAll('[data-move]').forEach(b=>{b.addEventListener('pointerdown',e=>{b.setPointerCapture(e.pointerId);held=Number(b.dataset.move);s.x=Math.max(48,Math.min(240,s.x+held*12))},{signal});b.addEventListener('pointerup',()=>held=0,{signal});b.addEventListener('pointercancel',()=>held=0,{signal});b.addEventListener('click',e=>{if(e.detail===0)s.x=Math.max(48,Math.min(240,s.x+Number(b.dataset.move)*18))},{signal})});
 function rect(color,x,y,w,h){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
 function draw(elapsed){
  ctx.imageSmoothingEnabled=false;rect('#bee9f3',0,0,288,360);
  for(const [x,y] of [[25,36],[205,68]]){rect('#f5faf0',x,y,42,10);rect('#f5faf0',x+8,y-8,25,8)}
  rect('#c5ddb0',0,244,288,116);rect('#a7ca81',0,272,288,88);
  for(const x of [0,266]){rect('#947051',x+8,228,9,45);rect('#82ac68',x,190,27,47);rect('#82ac68',x+6,179,15,11)}
  for(let x=10;x<288;x+=38){rect('#7eaf66',x,337,3,4);rect('#dcebb3',x+16,320,3,3)}
  for(const f of s.fruits)patterns[f.kind].forEach((row,y)=>[...row].forEach((p,x)=>{if(p!=='.')rect({g:'#477346',r:'#df6258',o:'#efa93f',w:'#ffedc9',b:'#34344b'}[p],f.x-8+x*2,f.y+y*2,2,2)}));
  const pose=elapsed%4000>3700?1:0;
  ctx.drawImage(sheet,pose*48,sprite*48,48,48,Math.round(s.x)-48,238,96,96);
  rect('#775537',s.x-25,306,50,21);rect('#d5a45f',s.x-23,308,46,16);rect('#9d703e',s.x-23,314,46,2);
  for(let i=-18;i<=18;i+=9)rect('#b7874a',s.x+i,308,2,16);
  timer.textContent=Math.max(0,Math.ceil((CATCH_MS-elapsed)/1000));score.textContent=Math.max(0,5+s.score);
  if(s.feedback?.until>elapsed){ctx.fillStyle=s.feedback.bomb?'#a93240':'#225c32';ctx.font='bold 18px sans-serif';ctx.textAlign='center';ctx.fillText(s.feedback.bomb?'−2pt':'+1pt',s.x,225)}
 }
 function frame(now){if(done)return;const elapsed=now-start,dt=now-last;last=now;if(elapsed>=CATCH_MS){done=true;draw(CATCH_MS);controller.abort();onFinish(Math.max(-5,s.score),`くだもの ${s.caught}こ・ばくだん ${s.bombs}こ`);return}if(held)s.x=Math.max(48,Math.min(240,s.x+held*Math.min(dt,80)*0.15));stepRound(s,elapsed,dt);draw(elapsed);raf=requestAnimationFrame(frame)}
 raf=requestAnimationFrame(frame);canvas.focus({preventScroll:true});
 return ()=>{done=true;cancelAnimationFrame(raf);controller.abort()};
}
