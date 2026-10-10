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

// Normalize only the silhouette band; interior facial marks remain untouched.
export function uniformOutline(frame,width=48,height=48){
 if(frame.length!==width*height*4)throw new Error('Invalid sprite dimensions');
 frame=new Uint8ClampedArray(frame);
 const n=width*height;
 // Atlas sampling can leave 1–3 pixel specks from an adjacent cell. Do not
 // turn those specks into black islands when tracing the real silhouette.
 const visited=new Set(),components=[];
 for(let start=0;start<n;start++)if(frame[start*4+3]>=128&&!visited.has(start)){
  const group=[start];visited.add(start);
  for(let q=0;q<group.length;q++){const i=group[q],x=i%width,y=Math.floor(i/width);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const a=x+dx,b=y+dy,j=b*width+a;if(a>=0&&a<width&&b>=0&&b<height&&frame[j*4+3]>=128&&!visited.has(j)){visited.add(j);group.push(j)}}
  }components.push(group);
 }
 if(components.some(c=>c.length>40))for(const c of components)if(c.length<=3)for(const i of c)frame.fill(0,i*4,i*4+4);
 const out=new Uint8ClampedArray(frame);
 const solid=i=>i>=0&&i<n&&frame[i*4+3]>=128;
 const neighbors=i=>{const x=i%width,y=Math.floor(i/width);return [x?i-1:-1,x<width-1?i+1:-1,y?i-width:-1,y<height-1?i+width:-1]};
 const boundary=new Set();for(let i=0;i<n;i++)if(solid(i)&&neighbors(i).some(j=>!solid(j)))boundary.add(i);
 if(!boundary.size)return out;
 const luminance=i=>.2126*frame[i*4]+.7152*frame[i*4+1]+.0722*frame[i*4+2];
 const darkest=[...boundary].sort((a,b)=>luminance(a)-luminance(b))[0];
 const ink=Array.from(frame.slice(darkest*4,darkest*4+3));
 const isInk=i=>solid(i)&&Math.max(...ink.map((c,k)=>Math.abs(frame[i*4+k]-c)))<38;
 // Restrict repairs to two pixels inward. Do not flood through eyes, markings,
 // or a dark-coloured body that happens to touch the silhouette.
 const band=new Set(boundary);let edge=[...boundary];
 for(let d=0;d<2;d++){const next=[];for(const i of edge)for(const j of neighbors(i))if(isInk(j)&&!band.has(j)){band.add(j);next.push(j)}edge=next;}
 for(const i of band){if(boundary.has(i)||!isInk(i))continue;
  const seen=new Set([i]),queue=[[i,0]];let replacement=-1;
  for(let q=0;q<queue.length;q++){const [j,d]=queue[q];if(d&& !boundary.has(j)&&!isInk(j)){replacement=j;break}if(d===4)continue;for(const k of neighbors(j))if(solid(k)&&!seen.has(k)&&!boundary.has(k)){seen.add(k);queue.push([k,d+1])}}
  if(replacement>=0)out.set(frame.slice(replacement*4,replacement*4+3),i*4);
 }
 for(const i of boundary){out.set(ink,i*4);out[i*4+3]=255;}
 return out;
}
