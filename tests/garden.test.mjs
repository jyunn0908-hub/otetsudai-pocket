import test from 'node:test';
import assert from 'node:assert/strict';
import {inventory,placeItem,findFurniture} from '../dist/garden.mjs';
import {approve,initialState} from '../dist/domain.mjs';
test('最初の4家具は既存データでも使え、持っていない家具や池・境界・重なりには置けない',()=>{
 const s={};assert.equal(Object.keys(inventory(s)).length,4);
 assert.deepEqual(placeItem(s,{},'starter-bench',1,1),{kind:'bench',x:1,y:1});
 for(const [id,x,y] of [['fake',2,2],['starter-bench',0,1],['starter-bench',19,1],['starter-bench',15,3],['starter-bench',2,1.2]])assert.throws(()=>placeItem(s,{},id,x,y));
 const layout={'starter-pot':{kind:'pot',x:2,y:4}};
 assert.throws(()=>placeItem(s,layout,'starter-bench',2,4));
 assert.deepEqual(placeItem(s,layout,'starter-pot',2,4),layout['starter-pot']);
 assert.ok(placeItem(s,{},'starter-bench',18,10));
});
test('最終進化後は承認3回ごとに家具を獲得し、再試行で種類が変わらない',()=>{
 const s={};for(let i=0;i<3;i++)findFurniture(s,'pre'+i);assert.equal(s.gardenChores,undefined);
 s.gardenUnlocked=true;findFurniture(s,'one');findFurniture(s,'two');assert.equal(s.gardenInventory,undefined);
 const retry=structuredClone(s);findFurniture(s,'three');findFurniture(retry,'three');assert.deepEqual(s,retry);assert.equal(Object.keys(s.gardenInventory).length,1);
 s.growth={stage:0};for(let i=0;i<3;i++)findFurniture(s,'next'+i);assert.equal(Object.keys(s.gardenInventory).length,2);
});
test('承認の二重実行やごほうび交換は家具を増やさず、60点で上限',()=>{
 let s=initialState();s.accounts.kid={name:'こ',points:200};s.gardenUnlocked=true;s.gardenChores=2;
 const req={uid:'kid',type:'chore',itemId:'dishes',day:'2026-10-06'};
 s=approve(s,req,'one');assert.equal(Object.keys(s.gardenInventory).length,1);
 assert.throws(()=>approve(s,req,'one'));assert.throws(()=>approve(s,req,'duplicate'));
 const exchanged=approve(s,{...req,type:'reward',itemId:'snack'},'reward');assert.deepEqual(exchanged.gardenInventory,s.gardenInventory);assert.equal(exchanged.gardenChores,3);
 s.gardenInventory=Object.fromEntries(Array.from({length:60},(_,i)=>['find-'+i,'pot']));for(let i=0;i<6;i++)findFurniture(s,''+i);assert.equal(Object.keys(s.gardenInventory).length,60);
});

import {ground,depth,groundStyle,WORLD_WIDTH,WORLD_HEIGHT} from '../dist/garden-space.mjs';
import {openCell} from '../dist/garden.mjs';
test('保存済み座標を変えず整数ピクセルの斜め庭へ投影し、全配置が庭に収まる',()=>{
 const points=new Set();
 for(let y=1;y<=10;y++)for(let x=1;x<=18;x++)if(openCell(x,y)){
  const p=ground(x,y);assert.ok(Number.isInteger(p.x)&&Number.isInteger(p.y));
  assert.ok(p.x-48>=0&&p.x+48<=WORLD_WIDTH&&p.y-96>=0&&p.y<=WORLD_HEIGHT);
  points.add(`${p.x},${p.y}`);assert.match(groundStyle(x,y),/z-index:\d+$/);
 }
 assert.equal(points.size,168);
 assert.ok(ground(2,3).x>ground(2,2).x);
});
test('家具とキャラクター共通の足元順で、隣の奥行き列が手前に描かれる',()=>{
 for(let y=1;y<10;y++)assert.ok(depth(1,y+1)>depth(18,y));
 assert.ok(depth(6,4)>depth(5,4));
});
