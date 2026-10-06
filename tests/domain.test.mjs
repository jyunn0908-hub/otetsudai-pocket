import {test} from 'node:test';
import assert from 'node:assert/strict';
import {approve,initialState,validateItem,choreStats,choreStreaks} from '../dist/domain.mjs';
function state(points=0){const s=initialState();s.accounts.kid={name:'テスト',points};return s}
const chore={uid:'kid',type:'chore',itemId:'clean',day:'2026-10-03'};
const at=day=>Date.parse(`2026-10-${String(day).padStart(2,'0')}T12:00:00+09:00`);
function complete(s,day,itemId='clean',approvalDay=day){return approve(s,{...chore,itemId,day:`2026-10-${String(day).padStart(2,'0')}`},`${day}-${itemId}`,at(approvalDay));}
test('3日と7日のボーナスは交換用ポイントだけに各1回加算',()=>{
 let s=state();for(let d=1;d<=7;d++)s=complete(s,d);
 assert.equal(s.accounts.kid.points,7*30+10+30);
 assert.equal(s.growth.points,70);assert.equal(s.growth.count,7);
 assert.deepEqual(s.history.filter(h=>h.type==='bonus').map(h=>h.delta),[30,10]);
 s=complete(s,7,'plants');assert.equal(s.history.filter(h=>h.type==='bonus').length,2);
 assert.equal(choreStreaks(s.history,'kid','2026-10-07').current,7);
 assert.throws(()=>complete(s,7,'plants'),/処理/);
 const restored=JSON.parse(JSON.stringify(s));assert.deepEqual(complete(restored,8),complete(s,8));
});
test('1日休みは維持、2日休みで終了し、最高記録は残す',()=>{
 let s=state();for(const d of [1,3,5])s=complete(s,d);
 assert.equal(s.accounts.kid.points,100);
 assert.equal(choreStreaks(s.history,'kid','2026-10-07').current,3);
 assert.equal(choreStreaks(s.history,'kid','2026-10-08').current,0);
 for(const d of [8,9,10])s=complete(s,d);
 assert.equal(s.history.filter(h=>h.type==='bonus').length,2);
 assert.equal(choreStreaks(s.history,'kid','2026-10-10').best,3);
});
test('遅い承認で連続記録が結合してもボーナスを再付与しない',()=>{
 let s=state();for(const d of [1,2,3,6,7,8])s=complete(s,d,'clean',10);
 assert.equal(s.history.filter(h=>h.type==='bonus').length,2);
 s=complete(s,4,'clean',10);
 assert.equal(s.history.filter(h=>h.type==='bonus'&&h.milestone===3).length,2);
 assert.equal(s.history.filter(h=>h.type==='bonus'&&h.milestone===7).length,1);
 s=complete(s,5,'clean',10);
 assert.equal(s.history.filter(h=>h.type==='bonus').length,3);
});
test('古い履歴は集計に含めるがボーナス対象にしない',()=>{
 let s=state();s.history=[1,2,3].map(d=>({uid:'kid',type:'chore',day:`2026-10-0${d}`,itemId:'clean',requestId:`old${d}`}));
 s=complete(s,4);assert.equal(s.history.filter(h=>h.type==='bonus').length,0);
 assert.equal(choreStats(s.history,'kid','2026-10-04').total,4);
 assert.equal(choreStreaks(s.history,'kid','2026-10-04',true).current,1);
});
test('端末引き継ぎ後も達成済みボーナスを再付与しない',()=>{
 let s=state();for(const d of [1,2,3])s=complete(s,d);
 s.accounts.new=s.accounts.kid;delete s.accounts.kid;s.history=s.history.map(h=>({...h,uid:'new'}));
 s=approve(s,{...chore,uid:'new',day:'2026-10-04'},'new4',at(4));
 assert.equal(s.history.filter(h=>h.type==='bonus').length,1);assert.equal(s.accounts.new.points,130);
});
test('交換では連続記録とボーナスを増やさず、日本時間の日付境界で休みを判定',()=>{
 let s=state(200);for(const d of [1,2,3])s=complete(s,d);
 s=approve(s,{...chore,type:'reward',itemId:'snack',day:'2026-10-04'},'reward',at(4));
 assert.equal(s.accounts.kid.points,200);assert.equal(s.history.filter(h=>h.type==='bonus').length,1);
 assert.equal(choreStreaks(s.history,'kid','2026-10-05').current,3);
 assert.equal(choreStreaks(s.history,'kid','2026-10-06').current,0);
});
test('お手伝い集計は本人の承認履歴だけを報告日で数える',()=>{
 const history=[{uid:'kid',type:'chore',day:'2026-09-30'},{uid:'kid',type:'chore',day:'2026-10-01'},{uid:'kid',type:'chore',day:'2026-10-01'},{uid:'kid',type:'reward',day:'2026-10-02'},{uid:'other',type:'chore',day:'2026-10-02'},{uid:'kid',type:'bonus',day:'2026-10-01'}];
 assert.deepEqual(choreStats(history,'kid','2026-10-05'),{total:3,month:2,days:2});
 assert.deepEqual(choreStats([],'kid','2026-10-05'),{total:0,month:0,days:0});
});
test('承認時だけ加算し元データを壊さない',()=>{const s=state();const next=approve(s,chore,'a');assert.equal(s.accounts.kid.points,0);assert.equal(next.accounts.kid.points,30);assert.equal(next.history[0].delta,30)});
test('同じ申請の二重承認を拒否',()=>{const s=approve(state(),chore,'a');assert.throws(()=>approve(s,chore,'a'),/処理/)});
test('同じ日の同じお手伝いは一回だけ',()=>{const s=approve(state(),chore,'a');assert.throws(()=>approve(s,chore,'b'),/承認済み/);assert.equal(approve(s,{...chore,day:'2026-10-04'},'c').accounts.kid.points,60)});
test('交換は承認時に減算',()=>{const s=approve(state(100),{uid:'kid',type:'reward',itemId:'snack',day:'2026-10-03'},'b');assert.equal(s.accounts.kid.points,0);assert.equal(s.history[0].delta,-100)});
test('不足する交換と連続交換を拒否',()=>{const r={uid:'kid',type:'reward',itemId:'snack',day:'2026-10-03'};assert.throws(()=>approve(state(99),r,'b'),/足りません/);const s=approve(state(150),r,'b');assert.throws(()=>approve(s,r,'c'),/足りません/);assert.equal(s.accounts.kid.points,50)});
test('未承認の子供・削除済み項目を拒否',()=>{assert.throws(()=>approve(initialState(),chore,'a'),/登録/);assert.throws(()=>approve(state(),{...chore,itemId:'missing'},'a'),/削除/)});
test('入力範囲・小数・空文字を検証',()=>{for(const p of [0,-1,1.2,10001,NaN])assert.throws(()=>validateItem('お手伝い',p));assert.throws(()=>validateItem('',10));assert.throws(()=>validateItem('a'.repeat(41),10));assert.doesNotThrow(()=>validateItem('お手伝い',10))});
