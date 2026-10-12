// Every shipped frame is an authored 48×48 raster. The runtime only copies
// pixels from the finished atlas; it never retouches or rescales the artwork.
const SIZE=48,COUNT=20,FRAMES=['normal','idle','joy'];
const sheet=new Promise((resolve,reject)=>{
 const image=new Image();image.onerror=()=>reject(Error('完成スプライトを読みこめませんでした'));
 image.onload=()=>{if(image.width!==SIZE*FRAMES.length||image.height!==SIZE*COUNT){reject(Error('完成スプライトのサイズが違います'));return}resolve(image)};
 image.src='./pets-native.png';
});
const pixels=new Map();
class PixelPet extends HTMLElement{
 connectedCallback(){
  if(this.childElementCount)return;
  const index=Math.max(0,Math.min(COUNT-1,Math.floor(Number(this.getAttribute('sprite'))||0)));
  if(!pixels.has(index))pixels.set(index,sheet.then(image=>FRAMES.map((_,i)=>{
   const c=document.createElement('canvas');c.width=SIZE;c.height=SIZE;
   const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
   ctx.drawImage(image,i*SIZE,index*SIZE,SIZE,SIZE,0,0,SIZE,SIZE);return c;
  })));
  pixels.get(index).then(frames=>{
   if(!this.isConnected)return;
   frames.forEach((source,i)=>{const canvas=document.createElement('canvas');canvas.width=SIZE;canvas.height=SIZE;canvas.className='pet-frame pet-frame-'+FRAMES[i];canvas.setAttribute('aria-hidden','true');canvas.getContext('2d').drawImage(source,0,0);this.append(canvas)});
  }).catch(()=>{this.textContent='◇';this.setAttribute('aria-label','画像を読みこめませんでした。再読み込みしてください')});
 }
}
customElements.define('pixel-pet',PixelPet);
