import {test} from 'node:test';
import assert from 'node:assert/strict';
import {approve,initialState,validateItem} from '../dist/domain.mjs';
function state(points=0){const s=initialState();s.accounts.kid={name:'テスト',points};return s}
const chore={uid:'kid',type:'chore',itemId:'clean',day:'2026-10-03'};
test('承認時だけ加算し元データを壊さない',()=>{const s=state();const next=approve(s,chore,'a');assert.equal(s.accounts.kid.points,0);assert.equal(next.accounts.kid.points,30);assert.equal(next.history[0].delta,30)});
test('同じ申請の二重承認を拒否',()=>{const s=approve(state(),chore,'a');assert.throws(()=>approve(s,chore,'a'),/処理/)});
test('同じ日の同じお手伝いは一回だけ',()=>{const s=approve(state(),chore,'a');assert.throws(()=>approve(s,chore,'b'),/承認済み/);assert.equal(approve(s,{...chore,day:'2026-10-04'},'c').accounts.kid.points,60)});
test('交換は承認時に減算',()=>{const s=approve(state(100),{uid:'kid',type:'reward',itemId:'snack',day:'2026-10-03'},'b');assert.equal(s.accounts.kid.points,0);assert.equal(s.history[0].delta,-100)});
test('不足する交換と連続交換を拒否',()=>{const r={uid:'kid',type:'reward',itemId:'snack',day:'2026-10-03'};assert.throws(()=>approve(state(99),r,'b'),/足りません/);const s=approve(state(150),r,'b');assert.throws(()=>approve(s,r,'c'),/足りません/);assert.equal(s.accounts.kid.points,50)});
test('未承認の子供・削除済み項目を拒否',()=>{assert.throws(()=>approve(initialState(),chore,'a'),/登録/);assert.throws(()=>approve(state(),{...chore,itemId:'missing'},'a'),/削除/)});
test('入力範囲・小数・空文字を検証',()=>{for(const p of [0,-1,1.2,10001,NaN])assert.throws(()=>validateItem('お手伝い',p));assert.throws(()=>validateItem('',10));assert.throws(()=>validateItem('a'.repeat(41),10));assert.doesNotThrow(()=>validateItem('お手伝い',10))});
