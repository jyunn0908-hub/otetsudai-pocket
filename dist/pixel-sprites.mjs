import {unifyPalette} from './sprite-grid.mjs?art=13';
// The displayed image is always a native 48×48 raster, never a high-resolution crop.
const SIZE=48,COLS=5,ROWS=4;
const FRAMES=['normal','idle','joy'];
const sheets=FRAMES.map(kind=>new Promise((resolve,reject)=>{
 const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('キャラクター画像を読みこめませんでした'));image.src=`./pets-pixel-${kind}.png`;
}));
const pixels=new Map();
function raster(sheet,index){
 const canvas=document.createElement('canvas');canvas.width=SIZE;canvas.height=SIZE;
 const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 const x=Math.round(index%COLS*sheet.width/COLS),y=Math.round(Math.floor(index/COLS)*sheet.height/ROWS);
 const right=Math.round((index%COLS+1)*sheet.width/COLS),bottom=Math.round((Math.floor(index/COLS)+1)*sheet.height/ROWS);
 ctx.drawImage(sheet,x,y,right-x,bottom-y,0,0,SIZE,SIZE);
 // Half-transparent edge fringes cannot become fractional-looking screen pixels.
 const data=ctx.getImageData(0,0,SIZE,SIZE);
 for(let i=3;i<data.data.length;i+=4)data.data[i]=data.data[i]>=128?255:0;
 ctx.putImageData(data,0,0);
 return canvas;
}
class PixelPet extends HTMLElement{
 connectedCallback(){
  if(this.childElementCount)return;
  const index=Math.max(0,Math.min(19,Number(this.getAttribute('sprite'))||0));
  if(!pixels.has(index))pixels.set(index,Promise.all(sheets).then(images=>{
   const canvases=images.map(image=>raster(image,index));
   const frames=unifyPalette(canvases.map(c=>c.getContext('2d').getImageData(0,0,SIZE,SIZE).data));
   canvases.forEach((c,i)=>c.getContext('2d').putImageData(new ImageData(frames[i],SIZE,SIZE),0,0));return canvases;
  }));
  pixels.get(index).then(frames=>{
   if(!this.isConnected)return;
   frames.forEach((source,i)=>{const canvas=document.createElement('canvas');canvas.width=SIZE;canvas.height=SIZE;canvas.className='pet-frame pet-frame-'+FRAMES[i];canvas.setAttribute('aria-hidden','true');canvas.getContext('2d').drawImage(source,0,0);this.append(canvas)});
  }).catch(()=>{this.textContent='◇';this.setAttribute('aria-label','画像を読みこめませんでした。再読み込みしてください')});
 }
}
customElements.define('pixel-pet',PixelPet);
