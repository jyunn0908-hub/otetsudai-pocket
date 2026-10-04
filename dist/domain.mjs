import {grow} from './growth.mjs?art=8';
export function initialState(){return {chores:[{id:'dishes',title:'食器をかたづける',points:10,emoji:'🍽️'},{id:'laundry',title:'洗たくものをたたむ',points:20,emoji:'👕'},{id:'plants',title:'お花に水をあげる',points:10,emoji:'🌱'},{id:'clean',title:'おへやをそうじする',points:30,emoji:'🧹'}],rewards:[{id:'snack',title:'好きなおやつ',points:100,emoji:'🍩'},{id:'game',title:'ゲームを30分プラス',points:150,emoji:'🎮'},{id:'outing',title:'行きたい場所へおでかけ',points:500,emoji:'🎡'}],accounts:{},history:[]}}
export function dayKey(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(new Date())}
export function approve(state,req,id,now=Date.now(),seed=id){
 const next=structuredClone(state);const account=next.accounts[req.uid];if(!account)throw new Error('この子供はまだ家族に登録されていません。');
 if(next.history.some(h=>h.requestId===id))throw new Error('すでに処理されています。');
 const item=(req.type==='chore'?next.chores:next.rewards).find(i=>i.id===req.itemId);if(!item)throw new Error('対象が削除されています。見送りにしてください。');
 if(req.type==='chore'&&next.history.some(h=>h.uid===req.uid&&h.itemId===req.itemId&&h.day===req.day&&h.type==='chore'))throw new Error('このお手伝いは、その日の分を承認済みです。');
 const delta=req.type==='chore'?item.points:-item.points;
 if(account.points+delta<0)throw new Error('ポイントが足りません。');
 if(req.type==='chore')next.growth=grow(next.growth,id,now,seed);
 account.points+=delta;next.history.unshift({id,requestId:id,uid:req.uid,name:account.name,title:item.title,emoji:item.emoji,delta,type:req.type,itemId:req.itemId,day:req.day,at:now});return next;
}
export function validateItem(title,points){if(typeof title!=='string'||!title.trim()||title.trim().length>40)throw new Error('名前は1〜40文字で入力してください。');if(!Number.isInteger(points)||points<1||points>10000)throw new Error('ポイントは1〜10,000の整数で入力してください。');}
