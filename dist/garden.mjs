export const COLS=20,ROWS=12,CELL=48;
export const FURNITURE={bench:'木のベンチ',pot:'お花の鉢',cushion:'ふかふかクッション',table:'切り株テーブル'};
export const STARTERS={'starter-bench':'bench','starter-pot':'pot','starter-cushion':'cushion','starter-table':'table'};
export function inventory(state){return {...STARTERS,...state.gardenInventory}}
export function openCell(x,y){return Number.isInteger(x)&&Number.isInteger(y)&&x>=1&&x<=18&&y>=1&&y<=10&&!(x>=15&&y<=3)}
export function placeItem(state,placements,id,x,y){
 const kind=inventory(state)[id];if(!FURNITURE[kind])throw Error('この家具はまだ持っていません。');
 if(!openCell(x,y))throw Error('ここには置けないよ。芝生の空いている場所を選んでね。');
 if(Object.entries(placements).some(([key,p])=>key!==id&&p.x===x&&p.y===y))throw Error('ここには別の家具があるよ。');
 return {kind,x,y};
}
export function findFurniture(state,requestId){
 if(!state.gardenUnlocked&&state.growth?.stage!==4)return;
 state.gardenUnlocked=true;state.gardenChores=(state.gardenChores||0)+1;
 if(state.gardenChores%3||Object.keys(state.gardenInventory||{}).length>=60)return;
 let hash=0;for(const c of requestId)hash=(Math.imul(hash,31)+c.charCodeAt(0))>>>0;
 const kind=Object.keys(FURNITURE)[hash%4],id='find-'+state.gardenChores;
 state.gardenInventory={...state.gardenInventory,[id]:kind};state.gardenLastFind={id,kind};
}
// Shared by the application and emulator tests. All reads precede the single write.
export async function savePlacement(api,db,family,id,position){
 return api.runTransaction(db,async tx=>{
  const familySnap=await tx.get(api.doc(db,'families',family));
  if(!familySnap.exists())throw Error('家族の記録が見つかりません。');
  const state=familySnap.data(),owned=inventory(state);
  if(!owned[id])throw Error('この家具はまだ持っていません。');
  const refs=Object.keys(owned).map(key=>api.doc(db,'families',family,'garden',key));
  const snaps=await Promise.all(refs.map(ref=>tx.get(ref)));
  const layout=Object.fromEntries(snaps.filter(s=>s.exists()).map(s=>[s.id,s.data()]));
  const ref=api.doc(db,'families',family,'garden',id);
  if(position)tx.set(ref,placeItem(state,layout,id,...position));else tx.delete(ref);
 });
}
