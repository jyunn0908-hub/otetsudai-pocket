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

import fs from 'node:fs';
import {inflateSync} from 'node:zlib';
function nativePNG(filename='wakaba-native.png',height=48){
 const file=fs.readFileSync(new URL('../dist/'+filename,import.meta.url)),parts=[];
 assert.equal(file.readUInt32BE(16),144);assert.equal(file.readUInt32BE(20),height);
 assert.equal(file[24],8);assert.equal(file[25],6);
 for(let p=8;p<file.length;){const n=file.readUInt32BE(p),kind=file.toString('ascii',p+4,p+8);if(kind==='IDAT')parts.push(file.subarray(p+8,p+8+n));p+=n+12;}
 const raw=inflateSync(Buffer.concat(parts)),out=Buffer.alloc(144*height*4),stride=144*4;
 const paeth=(a,b,c)=>{const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);return da<=db&&da<=dc?a:db<=dc?b:c};
 for(let y=0;y<height;y++){const filter=raw[y*(stride+1)];for(let x=0;x<stride;x++){const i=y*stride+x,a=x>=4?out[i-4]:0,b=y?out[i-stride]:0,c=x>=4&&y?out[i-stride-4]:0;out[i]=(raw[y*(stride+1)+1+x]+[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter])&255}}
 return (frame,x,y)=>out.subarray((y*144+frame*48+x)*4,(y*144+frame*48+x)*4+4);
}
test('native wakaba is three exact 48px frames with fixed palette, leaves and feet',()=>{
 const pixel=nativePNG(),colors=new Set();
 for(let f=0;f<3;f++)for(let y=0;y<48;y++)for(let x=0;x<48;x++){
  const p=pixel(f,x,y);assert.ok(p[3]===0||p[3]===255);if(p[3])colors.add(p.toString('hex'));
  if(y<27||y>=36)assert.deepEqual(p,pixel(0,x,y));
  if(f===1&&!(y>=28&&y<=30&&((x>=17&&x<=20)||(x>=27&&x<=30))))assert.deepEqual(p,pixel(0,x,y));
 }
 assert.ok(colors.size<=5);
});

test('all 20 native sprites keep transparent pixels, a fixed palette and stationary details across poses',()=>{
 const pixel=nativePNG('pets-native.png',960),wakaba=nativePNG();
 const meta=JSON.parse(fs.readFileSync(new URL('../dist/pets-native.json',import.meta.url)));
 assert.equal(meta.characters.length,20);
 for(const c of meta.characters){
  const colors=new Set();let opaque=0;
  for(let f=0;f<3;f++)for(let y=0;y<48;y++)for(let x=0;x<48;x++){
   const p=pixel(f,x,c.index*48+y);assert.ok(p[3]===0||p[3]===255);
   if(p[3]){colors.add(p.toString('hex'));opaque++;}
   if(c.index===2){assert.deepEqual(p,wakaba(f,x,y));continue}
   if(!c.changeRects.some(([l,t,r,b])=>x>=l&&x<r&&y>=t&&y<b))assert.deepEqual(p,pixel(0,x,c.index*48+y),`${c.name}: fixed detail changed at ${x},${y}`);
  }
  assert.ok(opaque>200,c.name);assert.ok(colors.size<=7,`${c.name}: too many colors (${colors.size})`);
 }
});
test('runtime copies the completed atlas without loading high-resolution sheets or retouching',()=>{
 const source=fs.readFileSync(new URL('../dist/pixel-sprites.mjs',import.meta.url),'utf8');
 assert.ok(source.includes("image.src='./pets-native.png'"));
 assert.ok(!/unifyPalette|uniformOutline|pets-pixel-/.test(source));
});
