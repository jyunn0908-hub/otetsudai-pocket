// Each solution partitions a 4×4 board into four connected tetrominoes.
// Deriving shapes from complete layouts guarantees every question is solvable.
export const BENTO_LAYOUTS=[['AABB','AABB','CCCC','DDDD'],['AAAB','ACCB','DCCB','DDDB'],['ABBB','ABCC','AADC','DDDC']];
export const normalize=cells=>{const x=Math.min(...cells.map(c=>c[0])),y=Math.min(...cells.map(c=>c[1]));return cells.map(([a,b])=>[a-x,b-y]).sort((a,b)=>a[1]-b[1]||a[0]-b[0])};
export function rotate(cells){return normalize(cells.map(([x,y])=>[-y,x]))}
export function piecesFor(level){return ['A','B','C','D'].map((id,i)=>{const cells=[];BENTO_LAYOUTS[level].forEach((row,y)=>[...row].forEach((v,x)=>{if(v===id)cells.push([x,y])}));return {id,name:['ブロッコリー','たまご','にんじん','ウインナー'][i],cells:normalize(cells)}})}
export function fits(placed,cells,x,y){const occupied=new Set(Object.values(placed).flat().map(c=>c.join(',')));return Number.isInteger(x)&&Number.isInteger(y)&&cells.every(([a,b])=>a+x>=0&&a+x<4&&b+y>=0&&b+y<4&&!occupied.has([a+x,b+y].join(',')))}
export function place(placed,id,cells,x,y){if(placed[id]||!fits(placed,cells,x,y))return null;return {...placed,[id]:cells.map(([a,b])=>[a+x,b+y])}}
export function solveBento(pieces,placed={}){
 const piece=pieces.find(p=>!placed[p.id]);if(!piece)return placed;
 let cells=piece.cells;const seen=new Set();
 for(let r=0;r<4;r++,cells=rotate(cells)){const key=JSON.stringify(cells);if(seen.has(key))continue;seen.add(key);
  for(let y=0;y<4;y++)for(let x=0;x<4;x++){const next=place(placed,piece.id,cells,x,y);if(next){const result=solveBento(pieces,next);if(result)return result}}
 }return null;
}
const icon=id=>{
 const rect=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
 const art=id==='A'?rect(6,8,4,6,'#6d9046')+rect(2,4,12,6,'#3d7a45')+rect(4,2,8,3,'#549953'):id==='B'?rect(2,4,12,8,'#e4a72c')+rect(3,5,10,6,'#ffdd70')+rect(6,6,4,4,'#f5bf42'):id==='C'?rect(6,1,5,4,'#4a894c')+rect(4,5,8,5,'#f49b47')+rect(5,10,5,3,'#f49b47')+rect(6,13,2,2,'#d47836'):rect(3,3,10,10,'#b65b62')+rect(4,4,8,8,'#e28a87')+rect(5,5,2,2,'#ffd1af')+rect(8,8,2,2,'#ffd1af');
 return `<svg viewBox="0 0 16 16" aria-hidden="true" shape-rendering="crispEdges">${art}</svg>`;
};
export function mountBento(root,{onFinish}){
 let level=0,pieces=piecesFor(0),placed={},selected='A',shape=pieces[0].cells,solved=false,done=false,drag=null;
 const controller=new AbortController(),signal=controller.signal,board=root.querySelector('[data-board]'),tray=root.querySelector('[data-tray]'),status=root.querySelector('[data-puzzle-status]'),next=root.querySelector('[data-puzzle-next]');
 function draw(){
  root.querySelector('[data-question]').textContent=level+1;
  board.innerHTML=Array.from({length:16},(_,n)=>{const x=n%4,y=Math.floor(n/4),id=Object.keys(placed).find(id=>placed[id].some(c=>c[0]===x&&c[1]===y));return `<button class="bento-cell ${id?'food-'+id:''}" data-cell="${x},${y}" aria-label="${y+1}行${x+1}列${id?' '+pieces.find(p=>p.id===id).name+'を戻す':' に置く'}" ${solved?'disabled':''}>${id?icon(id):''}</button>`}).join('');
  tray.innerHTML=pieces.map(p=>{const cells=selected===p.id?shape:p.cells;return `<button class="bento-piece ${selected===p.id?'selected':''}" data-piece="${p.id}" aria-label="${p.name}を選ぶ" aria-pressed="${selected===p.id}" ${placed[p.id]||solved?'disabled':''}><span class="piece-shape" style="grid-template-columns:repeat(${Math.max(...cells.map(c=>c[0]))+1},20px)">${cells.map(([x,y])=>`<span class="food-${p.id}" style="grid-column:${x+1};grid-row:${y+1}">${icon(p.id)}</span>`).join('')}</span><small>${p.name}${placed[p.id]?' ✓':''}</small></button>`}).join('');
  next.hidden=!solved;next.textContent=level===2?'ポイントをうけとる':'つぎのおべんとう';
  root.querySelector('[data-rotate]').disabled=solved||!selected;root.querySelector('[data-hint]').disabled=solved;root.querySelector('[data-reset]').disabled=solved;
 }
 function check(){if(Object.keys(placed).length===4){solved=true;selected=null;status.textContent='ぴったり！ おいしそう♪'}else{selected=pieces.find(p=>!placed[p.id]).id;shape=pieces.find(p=>p.id===selected).cells;status.textContent='おかずを選んで、置く場所をタップ！'}draw()}
 function put(x,y){if(!selected||solved)return;const result=place(placed,selected,shape,x,y);if(!result){status.textContent='そこには入らないみたい。回してみよう！';return}placed=result;check()}
 const position=e=>{const r=board.getBoundingClientRect();return [Math.floor((e.clientX-r.left)*4/r.width),Math.floor((e.clientY-r.top)*4/r.height)]};
 root.addEventListener('pointerdown',e=>{const p=e.target.closest('[data-piece]');if(!p||p.disabled)return;selected=p.dataset.piece;shape=pieces.find(v=>v.id===selected).cells;drag={x:e.clientX,y:e.clientY,moved:false};draw();root.setPointerCapture(e.pointerId)},{signal});
 root.addEventListener('pointermove',e=>{if(!drag)return;drag.moved ||= Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8;const [x,y]=position(e);const valid=fits(placed,shape,x,y);board.querySelectorAll('[data-cell]').forEach(cell=>{const [cx,cy]=cell.dataset.cell.split(',').map(Number);cell.classList.toggle('preview',valid&&shape.some(([a,b])=>a+x===cx&&b+y===cy))})},{signal});
 root.addEventListener('pointerup',e=>{if(!drag)return;const moved=drag.moved;drag=null;board.querySelectorAll('.preview').forEach(c=>c.classList.remove('preview'));if(moved){const [x,y]=position(e);put(x,y)}},{signal});
 root.addEventListener('pointercancel',()=>{drag=null;board.querySelectorAll('.preview').forEach(c=>c.classList.remove('preview'))},{signal});
 root.addEventListener('click',e=>{
  const p=e.target.closest('[data-piece]');if(p&&!p.disabled){selected=p.dataset.piece;shape=pieces.find(v=>v.id===selected).cells;draw();return}
  const cell=e.target.closest('[data-cell]');if(cell&&!solved){const [x,y]=cell.dataset.cell.split(',').map(Number),id=Object.keys(placed).find(id=>placed[id].some(c=>c[0]===x&&c[1]===y));if(id){delete placed[id];selected=id;shape=pieces.find(p=>p.id===id).cells;draw();status.textContent='おかずを戻したよ。好きな場所に置こう'}else put(x,y)}
 },{signal});
 root.querySelector('[data-rotate]').addEventListener('click',()=>{if(!selected||solved)return;shape=rotate(shape);draw();status.textContent='くるっ！ 向きを変えたよ'},{signal});
 root.querySelector('[data-reset]').addEventListener('click',()=>{if(solved)return;placed={};selected='A';shape=pieces[0].cells;draw();status.textContent='もう一度、好きな順番でどうぞ！'},{signal});
 root.querySelector('[data-hint]').addEventListener('click',()=>{
  if(solved)return;const solution=solveBento(pieces,placed);if(!solution){status.textContent='今の置き方では入らないかも。おかずを戻すか「やりなおす」を押してね';return}
  const id=selected||pieces.find(p=>!placed[p.id]).id;placed={...placed,[id]:solution[id]};check();if(!solved)status.textContent='ひとつ置いておいたよ。残りをつめよう！';
 },{signal});
 function finish(){if(done)return;done=true;controller.abort();onFinish((level+(solved?1:0))*10,level+(solved?1:0)?`${level+(solved?1:0)}こ おべんとう完成！`:'おべんとうにチャレンジ！')}
 next.addEventListener('click',()=>{if(!solved)return;if(level===2){finish();return}level++;pieces=piecesFor(level);placed={};solved=false;selected='A';shape=pieces[0].cells;draw();status.textContent='おかずを選んで、置く場所をタップ！'},{signal});
 root.querySelector('[data-puzzle-end]').addEventListener('click',finish,{signal});
 draw();return ()=>{done=true;controller.abort()};
}
