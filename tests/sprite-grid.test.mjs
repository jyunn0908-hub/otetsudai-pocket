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
