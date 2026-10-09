// All animation frames of a companion share one small, stable palette.
export function unifyPalette(frames,maxColors=8){
 const counts=new Map();
 for(const frame of frames)for(let i=0;i<frame.length;i+=4){if(frame[i+3]<128)continue;const rgb=[frame[i],frame[i+1],frame[i+2]],key=rgb.join(',');const entry=counts.get(key);if(entry)entry.count++;else counts.set(key,{rgb,count:1});}
 const colors=[...counts.values()].sort((a,b)=>b.count-a.count);
 if(!colors.length)return frames.map(f=>new Uint8ClampedArray(f.length));
 const distance=(a,b)=>a.reduce((sum,c,i)=>sum+(c-b[i])**2,0);
 const palette=[colors[0].rgb];
 while(palette.length<Math.min(maxColors,colors.length)){
  let best=null,score=-1;for(const c of colors){const d=Math.min(...palette.map(p=>distance(c.rgb,p)))*Math.sqrt(c.count);if(d>score){score=d;best=c.rgb}}
  if(score<=0)break;palette.push(best);
 }
 const nearest=rgb=>{let idx=0,min=Infinity;palette.forEach((p,i)=>{const d=distance(rgb,p);if(d<min){min=d;idx=i}});return idx};
 for(let pass=0;pass<8;pass++){
  const sums=palette.map(()=>[0,0,0,0]);for(const c of colors){const s=sums[nearest(c.rgb)];c.rgb.forEach((v,i)=>s[i]+=v*c.count);s[3]+=c.count}
  sums.forEach((s,i)=>{if(s[3])palette[i]=s.slice(0,3).map(v=>Math.round(v/s[3]))});
 }
 return frames.map(frame=>{const result=new Uint8ClampedArray(frame.length);for(let i=0;i<frame.length;i+=4){if(frame[i+3]<128)continue;result.set(palette[nearest(frame.slice(i,i+3))],i);result[i+3]=255}return result});
}
