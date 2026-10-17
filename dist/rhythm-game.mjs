export const PHRASE_MS=6000, BEAT_TIMES=[3500,4100,4700], HIT_WINDOW=260;
export function makePhrases(random=Math.random){return Array.from({length:5},()=>Array.from({length:3},()=>random()<0.5?0:1))}
export function hitBeat(phrase,hits,lane,time){
 const index=BEAT_TIMES.findIndex((t,i)=>!hits[i]&&phrase[i]===lane&&Math.abs(time-t)<=HIT_WINDOW);
 if(index<0)return false;hits[index]=true;return true;
}
// Create/resume on the user's start gesture, before any network await.
export function rhythmAudio(){
 let ctx=null,muted=false;
 try{const Audio=window.AudioContext||window.webkitAudioContext;if(Audio){ctx=new Audio();ctx.resume().catch(()=>{})}}catch{}
 return {
  play(lane){if(muted||!ctx||ctx.state!=='running')return;const tone=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime;tone.type='sine';tone.frequency.setValueAtTime(lane?440:260,t);tone.frequency.exponentialRampToValueAtTime(lane?180:90,t+0.14);gain.gain.setValueAtTime(0.18,t);gain.gain.exponentialRampToValueAtTime(0.001,t+0.18);tone.connect(gain);gain.connect(ctx.destination);tone.start(t);tone.stop(t+0.2)},
  toggle(){muted=!muted;if(!muted)ctx?.resume().catch(()=>{});return muted},
  close(){ctx?.close().catch(()=>{})}
 };
}
export function mountRhythm(root,{audio,onFinish,random=Math.random}){
 const phrases=makePhrases(random),hits=phrases.map(()=>[false,false,false]),played=new Set(),controller=new AbortController(),signal=controller.signal;
 const status=root.querySelector('[data-rhythm-status]'),count=root.querySelector('[data-phrase]'),notes=root.querySelector('[data-notes]'),feedback=root.querySelector('[data-feedback]'),progress=root.querySelector('[data-beat-progress]'),pads=[...root.querySelectorAll('[data-pad]')];
 let start=performance.now(),hiddenAt=null,raf=0,stopped=false,phraseIndex=-1,phase='',lit=-1,lastTap=0,score=0;
 function tap(lane){
  if(stopped||hiddenAt!==null)return;
  const elapsed=performance.now()-start,round=Math.floor(elapsed/PHRASE_MS),time=elapsed%PHRASE_MS;
  if(round>=5)return;
  audio.play(lane);pads[lane].classList.add('tap');lastTap=performance.now();
  if(time<3100){feedback.textContent='いまは おてほんを見てね';return}
  if(hitBeat(phrases[round],hits[round],lane,time)){score+=2;feedback.textContent='いいリズム♪';hits[round].forEach((hit,i)=>notes.children[i]?.classList.toggle('hit',hit))}
  else feedback.textContent='光るタイミングで ポン！';
 }
 pads.forEach((pad,lane)=>{
  pad.addEventListener('pointerdown',e=>{e.preventDefault();tap(lane)},{signal});
  pad.addEventListener('click',e=>{if(e.detail===0)tap(lane)},{signal});
 });
 root.addEventListener('keydown',e=>{if(e.repeat)return;const lane=['ArrowLeft','d','D'].includes(e.key)?0:['ArrowRight','k','K'].includes(e.key)?1:null;if(lane!==null){e.preventDefault();tap(lane)}},{signal});
 root.querySelector('[data-sound]').addEventListener('click',e=>{const muted=audio.toggle();e.currentTarget.textContent=muted?'音：オフ':'音：オン';e.currentTarget.setAttribute('aria-pressed',String(!muted))},{signal});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){hiddenAt=performance.now();status.textContent='ひとやすみ中'}else if(hiddenAt!==null){start+=performance.now()-hiddenAt;hiddenAt=null}},{signal});
 function frame(now){
  if(stopped)return;if(hiddenAt!==null){raf=requestAnimationFrame(frame);return}
  const elapsed=now-start,index=Math.floor(elapsed/PHRASE_MS),time=elapsed%PHRASE_MS;
  if(index>=5){stopped=true;controller.abort();audio.close();onFinish(score,score?`${score/2}回 いいリズム！`:'リズムであそんだよ！');return}
  if(index!==phraseIndex){phraseIndex=index;count.textContent=index+1;notes.innerHTML=phrases[index].map((lane,i)=>`<span class="rhythm-note lane-${lane}" aria-label="${i+1}つめ ${lane?'みぎ':'ひだり'}">${lane?'右':'左'}</span>`).join('');feedback.textContent='トン・トン・トン♪'}
  const nextPhase=time<2700?'おてほんを見てね':time<3100?'つぎは きみのばん！':'きみのばん！';
  if(nextPhase!==phase){phase=nextPhase;status.textContent=phase;root.classList.toggle('your-turn',time>=2700)}
  const beatTimes=time<2700?[500,1100,1700]:BEAT_TIMES;
  const active=beatTimes.findIndex(t=>Math.abs(time-t)<180);
  if(active!==lit){lit=active;[...notes.children].forEach((n,i)=>n.classList.toggle('lit',i===active));pads.forEach((p,l)=>p.classList.toggle('lit',active>=0&&phrases[index][active]===l))}
  if(time<2700)for(let i=0;i<3;i++){const k=index+':'+i;if(time>=beatTimes[i]&&!played.has(k)){played.add(k);if(time-beatTimes[i]<150)audio.play(phrases[index][i])}}
  if(now-lastTap>150)pads.forEach(p=>p.classList.remove('tap'));
  progress.value=time;raf=requestAnimationFrame(frame);
 }
 raf=requestAnimationFrame(frame);pads[0].focus({preventScroll:true});
 return ()=>{stopped=true;cancelAnimationFrame(raf);controller.abort();audio.close()};
}
