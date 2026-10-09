import {findFurniture} from './garden.mjs?art=13';
import {grow} from './growth.mjs?art=13';
export function initialState(){return {chores:[{id:'dishes',title:'食器をかたづける',points:10,emoji:'🍽️'},{id:'laundry',title:'洗たくものをたたむ',points:20,emoji:'👕'},{id:'plants',title:'お花に水をあげる',points:10,emoji:'🌱'},{id:'clean',title:'おへやをそうじする',points:30,emoji:'🧹'}],rewards:[{id:'snack',title:'好きなおやつ',points:100,emoji:'🍩'},{id:'game',title:'ゲームを30分プラス',points:150,emoji:'🎮'},{id:'outing',title:'行きたい場所へおでかけ',points:500,emoji:'🎡'}],accounts:{},history:[]}}
export function dayKey(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(new Date())}
// Only approved chores enter history. Group by the reported JST day, not approval time.
export function choreStats(history,uid,today=dayKey()){
 const chores=history.filter(h=>h.uid===uid&&h.type==='chore');
 return {total:chores.length,month:chores.filter(h=>h.day?.slice(0,7)===today.slice(0,7)).length,days:new Set(chores.map(h=>h.day).filter(Boolean)).size};
}
const dateNumber=day=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day||''))return NaN;
 const time=Date.parse(day+'T00:00:00Z');
 return Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===day?time/86400000:NaN;
};
export function choreStreaks(history,uid,today=dayKey(),bonusOnly=false){
 const days=[...new Set(history.filter(h=>h.uid===uid&&h.type==='chore'&&(!bonusOnly||h.bonusEligible===true)).map(h=>h.day))].filter(d=>Number.isFinite(dateNumber(d))&&d<=today).sort();
 const runs=[];
 for(const day of days){const run=runs.at(-1);if(run&&dateNumber(day)-dateNumber(run.at(-1))<=2)run.push(day);else runs.push([day]);}
 const latest=runs.at(-1)||[];
 return {runs,current:latest.length&&dateNumber(today)-dateNumber(latest.at(-1))<=2?latest.length:0,best:Math.max(0,...runs.map(r=>r.length))};
}
export const CHORE_BONUSES=[{days:3,points:10},{days:7,points:30}];
export function approve(state,req,id,now=Date.now(),seed=id){
 const next=structuredClone(state);const account=next.accounts[req.uid];if(!account)throw new Error('この子供はまだ家族に登録されていません。');
 if(next.history.some(h=>h.requestId===id))throw new Error('すでに処理されています。');
 const item=(req.type==='chore'?next.chores:next.rewards).find(i=>i.id===req.itemId);if(!item)throw new Error('対象が削除されています。見送りにしてください。');
 if(req.type==='chore'&&next.history.some(h=>h.uid===req.uid&&h.itemId===req.itemId&&h.day===req.day&&h.type==='chore'))throw new Error('このお手伝いは、その日の分を承認済みです。');
 const delta=req.type==='chore'?item.points:-item.points;
 if(account.points+delta<0)throw new Error('ポイントが足りません。');
 if(req.type==='chore'){next.growth=grow(next.growth,id,now,seed);findFurniture(next,id);}
 account.points+=delta;next.history.unshift({id,requestId:id,uid:req.uid,name:account.name,title:item.title,emoji:item.emoji,delta,type:req.type,itemId:req.itemId,day:req.day,at:now,...(req.type==='chore'?{bonusEligible:true}:{})});
 if(req.type==='chore'){
  const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(new Date(now));
  for(const run of choreStreaks(next.history,req.uid,today,true).runs){
   for(const bonus of CHORE_BONUSES){
    // Anchor awards to a day within the run. Late approvals can merge runs without paying again.
    if(run.length<bonus.days||next.history.some(h=>h.uid===req.uid&&h.type==='bonus'&&h.milestone===bonus.days&&run.includes(h.day)))continue;
    const day=run[bonus.days-1],bonusId=`${id}:bonus:${bonus.days}:${day}`;
    account.points+=bonus.points;
    next.history.unshift({id:bonusId,requestId:bonusId,uid:req.uid,name:account.name,title:`${bonus.days}日達成ボーナス`,emoji:'🎉',delta:bonus.points,type:'bonus',milestone:bonus.days,day,at:now});
   }
  }
 }
 return next;
}
export function validateItem(title,points){if(typeof title!=='string'||!title.trim()||title.trim().length>40)throw new Error('名前は1〜40文字で入力してください。');if(!Number.isInteger(points)||points<1||points>10000)throw new Error('ポイントは1〜10,000の整数で入力してください。');}
