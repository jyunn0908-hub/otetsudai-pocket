export const DAILY_PLAYS=5, ROUND_MS=30000, MAX_FRUIT=30;
export const FOODS=[{id:'berry',name:'きのみ',cost:10,emoji:'🍓',message:'あまくて、おいしいね！'},{id:'fish',name:'おさかな',cost:15,emoji:'🐟',message:'もぐもぐ、ごきげん！'},{id:'soup',name:'ほかほかスープ',cost:20,emoji:'🍲',message:'ぽかぽか、うれしいね！'}];
export const careDay=(now=Date.now())=>Math.floor((now+9*3600000)/86400000);
export const emptyCare=()=>({day:-1,used:0,balance:0,session:'',startedAt:0,claimed:true,score:0,meals:{berry:0,fish:0,soup:0},lastFood:'',feedId:''});
export const millis=t=>typeof t==='number'?t:t?.toMillis?.()||0;
export function remaining(c,now=Date.now()){return DAILY_PLAYS-(c?.day===careDay(now)?c.used:0)}
export function beginCare(c,session,now=Date.now()){
 c=c||emptyCare();if(!session)throw Error('ゲームを始められませんでした');
 if(c.session===session)return c;
 if(remaining(c,now)<=0)throw Error('今日は5回あそんだよ。また明日！');
 if(!c.claimed&&now-millis(c.startedAt)<ROUND_MS)throw Error('前のゲームが終わるまで少し待ってね');
 return {...c,day:careDay(now),used:c.day===careDay(now)?c.used+1:1,session,startedAt:now,claimed:false,score:0};
}
export function finishCare(c,session,score,now=Date.now()){
 if(!c||c.session!==session)throw Error('ゲームが切り替わりました。記録を確認してください');
 if(c.claimed)return c;
 if(now-millis(c.startedAt)<ROUND_MS)throw Error('ゲームの終了を確認中です。少し待って、もう一度保存してね');
 if(!Number.isInteger(score)||score<0||score>MAX_FRUIT)throw Error('結果が正しくありません');
 return {...c,claimed:true,score,balance:c.balance+5+score};
}
export function feedCare(c,foodId,feedId){
 const food=FOODS.find(f=>f.id===foodId);if(!food||!feedId)throw Error('ごはんを選んでね');
 c=c||emptyCare();if(c.feedId===feedId)return c;
 if(c.balance<food.cost)throw Error('お世話ポイントが足りないよ');
 return {...c,balance:c.balance-food.cost,meals:{...c.meals,[foodId]:c.meals[foodId]+1},lastFood:foodId,feedId};
}
// One shared family document survives device replacement. The rules validate
// each transition using server time and never grant writes to reward/growth data.
export async function saveCare(api,family,action,args){
 const ref=api.doc(api.db,'families',family,'care','state');
 return api.runTransaction(api.db,async tx=>{
  const snap=await tx.get(ref),before=snap.exists()?snap.data():null;
  let after=action==='start'?beginCare(before,args.id):action==='finish'?finishCare(before,args.id,args.score):feedCare(before,args.food,args.id);
  if(after===before)return after;
  if(action==='start')after={...after,startedAt:api.serverTimestamp()};
  tx.set(ref,after);return after;
 });
}
