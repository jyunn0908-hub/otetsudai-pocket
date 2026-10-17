import test from 'node:test';import assert from 'node:assert/strict';
import {BENTO_LAYOUTS,piecesFor,normalize,rotate,fits,place,solveBento} from '../dist/bento-game.mjs';
import {makePhrases,hitBeat,BEAT_TIMES,HIT_WINDOW} from '../dist/rhythm-game.mjs';
import {newId} from '../dist/ids.mjs';
import {beginCare,finishCare,remaining} from '../dist/care.mjs';
test('全お弁当は16マス・各4マスの4ピースで解ける',()=>{
 for(let level=0;level<3;level++){const pieces=piecesFor(level);assert.ok(pieces.every(p=>p.cells.length===4));const solution=solveBento(pieces);assert.ok(solution);const cells=Object.values(solution).flat();assert.equal(new Set(cells.map(c=>c.join(','))).size,16);assert.ok(cells.every(([x,y])=>x>=0&&x<4&&y>=0&&y<4));assert.equal(BENTO_LAYOUTS[level].flatMap(x=>[...x]).length,16)}
});
test('回転は4回で元に戻り、はみ出し・重なり・同じおかずの再配置を防ぐ',()=>{
 const shape=piecesFor(1)[0].cells;let turned=shape;for(let i=0;i<4;i++)turned=rotate(turned);assert.deepEqual(turned,normalize(shape));
 assert.equal(fits({},shape,-1,0),false);assert.equal(fits({},shape,3,3),false);assert.equal(fits({},shape,0.5,0),false);
 const p=place({},'A',shape,0,0);assert.ok(p);assert.equal(place(p,'A',shape,0,2),null);assert.equal(place(p,'B',shape,0,0),null);
});
test('ヒントは既存の配置を保って解ける候補を返す',()=>{
 const pieces=piecesFor(2),all=solveBento(pieces),partial={A:all.A};const next=solveBento(pieces,partial);assert.deepEqual(next.A,partial.A);assert.deepEqual(partial,{A:all.A});
});
test('リズムは5フレーズ、左右と判定窓・二重タップを検証',()=>{
 assert.equal(makePhrases(()=>0).length,5);assert.deepEqual(makePhrases(()=>1)[0],[1,1,1]);const phrase=[0,1,0],hits=[false,false,false];
 assert.equal(hitBeat(phrase,hits,0,BEAT_TIMES[0]-HIT_WINDOW-1),false);assert.equal(hitBeat(phrase,hits,1,BEAT_TIMES[0]),false);
 assert.equal(hitBeat(phrase,hits,0,BEAT_TIMES[0]-HIT_WINDOW),true);assert.equal(hitBeat(phrase,hits,0,BEAT_TIMES[0]),false);
 assert.equal(hitBeat(phrase,hits,1,BEAT_TIMES[1]+HIT_WINDOW),true);assert.equal(hitBeat(phrase,hits,0,BEAT_TIMES[2]),true);
});
test('ゲーム種類を切り替えても1日5回・同じ報酬上限・二重受取なし',()=>{
 let c=null;const now=Date.parse('2026-10-18T12:00:00+09:00');for(let i=0;i<5;i++){const id=['catch','rhythm','bento'][i%3]+':'+i;c=beginCare(c,id,now+i*31000);c=finishCare(c,id,30,now+i*31000+30000);assert.equal(finishCare(c,id,30,now+i*31000+30000),c)}
 assert.equal(c.balance,175);assert.equal(remaining(c,now),0);assert.throws(()=>beginCare(c,'bento:6',now+200000));
});
test('randomUUIDがないAndroidでも暗号乱数からIDを生成できる',()=>{
 const id=newId({getRandomValues:b=>{b.fill(255);return b}});assert.match(id,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);assert.equal(newId({randomUUID:()=> 'native'}),'native');assert.throws(()=>newId({}));
});
