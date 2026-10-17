import test from 'node:test';import assert from 'node:assert/strict';
import {emptyCare,careDay,remaining,beginCare,finishCare,feedCare} from '../dist/care.mjs';
import {createRound,stepRound} from '../dist/catch-game.mjs';
const now=Date.parse('2026-10-17T12:00:00+09:00');
test('日本時間の日付境界・5回上限・中断も1回・翌日復帰',()=>{
 let c=emptyCare();for(let i=0;i<5;i++){c=beginCare(c,'r'+i,now+i*31000);assert.equal(remaining(c,now),4-i)}
 assert.throws(()=>beginCare(c,'six',now+200000));assert.equal(beginCare(c,'r4',now+200000),c);
 const midnight=Date.parse('2026-10-18T00:00:00+09:00');assert.equal(careDay(midnight)-careDay(midnight-1),1);
 assert.equal(remaining(c,midnight),5);assert.equal(beginCare(c,'tomorrow',midnight).used,1);
});
test('30秒前・重複・不正スコアを拒否して、開始日の回数を維持',()=>{
 const c=beginCare(null,'r',now);assert.throws(()=>beginCare(c,'other',now+100));
 assert.throws(()=>finishCare(c,'r',5,now+29999));
 for(const score of [-1,31,NaN,1.5])assert.throws(()=>finishCare(c,'r',score,now+30000));
 const done=finishCare(c,'r',10,now+30000);assert.equal(done.balance,15);assert.equal(finishCare(done,'r',10,now+40000),done);
 assert.throws(()=>finishCare(done,'other',10,now+40000));assert.equal(c.balance,0);
});
test('ご飯の残高不足・二重リトライ・異なるご飯と累積の保持',()=>{
 let c=finishCare(beginCare(null,'r',now),'r',30,now+30000);c=feedCare(c,'berry','f1');assert.equal(c.balance,25);assert.equal(c.meals.berry,1);
 assert.equal(feedCare(c,'berry','f1'),c);c=feedCare(c,'soup','f2');assert.equal(c.balance,5);assert.throws(()=>feedCare(c,'fish','f3'));assert.equal(c.meals.berry,1);assert.throws(()=>feedCare(c,'fake','f4'));
});
test('果物キャッチは1個1回、外れは加算せず、背景復帰の大量生成なし',()=>{
 const s=createRound();s.spawned=30;s.fruits=[{x:144,y:294,kind:0},{x:20,y:294,kind:1}];stepRound(s,10000,20);assert.equal(s.score,1);stepRound(s,11000,20);assert.equal(s.score,1);
 const background=createRound();stepRound(background,20000,20000,()=>0.5);assert.equal(background.fruits.length,1);
});
