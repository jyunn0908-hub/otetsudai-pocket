import test from 'node:test';
import assert from 'node:assert/strict';
import {unifyPalette} from '../dist/sprite-grid.mjs';
test('animation uses one bounded palette and binary alpha without mutating source',()=>{
 const a=new Uint8ClampedArray(Array.from({length:48},(_,i)=>[i*5,255-i*4,i*3,255]).flat());
 const b=new Uint8ClampedArray(a);b[3]=127;b[7]=128;const saved=a.slice();
 const result=unifyPalette([a,b],8),colors=new Set();
 for(const f of result)for(let i=0;i<f.length;i+=4){assert.ok([0,255].includes(f[i+3]));if(f[i+3])colors.add(f.slice(i,i+3).join(','))}
 assert.ok(colors.size<=8);assert.equal(result[1][3],0);assert.equal(result[1][7],255);assert.deepEqual(a,saved);
 for(let i=8;i<a.length;i++)assert.equal(result[0][i],result[1][i]);
 assert.deepEqual(unifyPalette([a,b],8),result);
});
test('transparent frames stay transparent and simple palettes retain their exact colors',()=>{
 assert.deepEqual(unifyPalette([new Uint8ClampedArray([255,255,255,0])])[0],new Uint8ClampedArray(4));
 const f=new Uint8ClampedArray([0,0,0,255,255,255,255,255]);assert.deepEqual(unifyPalette([f])[0],f);
});

import {uniformOutline} from '../dist/sprite-grid.mjs';
test('outer two-pixel ink band becomes one pixel while silhouette and isolated eyes survive',()=>{
 const w=12,f=new Uint8ClampedArray(w*w*4),ink=[12,20,8,255],body=[170,210,90,255];
 for(let y=1;y<11;y++)for(let x=1;x<11;x++)f.set(x<=2||x>=9||y<=2||y>=9?ink:body,(y*w+x)*4);
 f.set(ink,(5*w+5)*4);const original=f.slice(),out=uniformOutline(f,w,w);
 assert.deepEqual(f,original);
 for(let i=3;i<f.length;i+=4)assert.equal(out[i],f[i]);
 assert.deepEqual(Array.from(out.slice((5*w+1)*4,(5*w+1)*4+4)),ink);
 assert.deepEqual(Array.from(out.slice((5*w+2)*4,(5*w+2)*4+4)),body);
 assert.deepEqual(Array.from(out.slice((5*w+5)*4,(5*w+5)*4+4)),ink);
});
test('outline handles empty frames, thin limbs and dimensions without adding colours',()=>{
 assert.deepEqual(uniformOutline(new Uint8ClampedArray(16),2,2),new Uint8ClampedArray(16));
 const f=new Uint8ClampedArray([20,10,30,255,20,10,30,255]);assert.deepEqual(uniformOutline(f,2,1),f);
 assert.throws(()=>uniformOutline(f,3,3));
});
