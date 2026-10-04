// Provisional tree, deliberately separate from progression and presentation.
export const GROWTH_POINTS=10;
export const MILESTONES=[{stage:2,day:7,points:80},{stage:3,day:13,points:150},{stage:4,day:21,points:230}];
export const CREATURES={egg:{name:'ふしぎなタマゴ',color:'#f1d891',kind:'egg'},baby:{name:'ポケットのこ',color:'#91cbd5',kind:'baby'},sky:{name:'そらのこ',color:'#91cbd5',kind:'wing',next:['cloud','moon']},leaf:{name:'もりのこ',color:'#aed798',kind:'leaf',next:['flower','spring']},cloud:{name:'くものともだち',color:'#91cbd5',kind:'wing',next:['mokumo','kazemo']},moon:{name:'つきのともだち',color:'#b6a3e0',kind:'fox',next:['yorune','hoshipuru']},flower:{name:'はなのともだち',color:'#f3b1ab',kind:'leaf',next:['hanapyon','pokaron']},spring:{name:'みずのともだち',color:'#8ac7de',kind:'bear',next:['shizukuma','mizune']},mokumo:{name:'モクモ',color:'#91cbd5',kind:'wing'},kazemo:{name:'カゼモ',color:'#a6d5b0',kind:'wing'},yorune:{name:'ヨルネ',color:'#8b8ac5',kind:'fox'},hoshipuru:{name:'ホシプル',color:'#b6a3e0',kind:'star'},hanapyon:{name:'ハナピョン',color:'#eddaa5',kind:'leaf'},pokaron:{name:'ポカロン',color:'#ed9b80',kind:'flame'},shizukuma:{name:'シズクマ',color:'#8ac7de',kind:'bear'},mizune:{name:'ミズネ',color:'#94d8c5',kind:'fox'}};
// Existing IDs remain readable so saved companions and histories survive the art update.
export const SPECIES=[
 ['hikari','ひかりうさぎ',10],['mori','もりリス',11],['komorebi','こもれびねこ',12],
 ['mizukame','みずかめ',13],['kitsunebi','きつねび',14],['yamineko','やみねこ',15],
 ['soradragon','そらドラゴン',16],['phoenix','しんえんフェニックス',17],
 ['kumofairy','くもようせい',18],['golem','いわゴーレム',19]
];
for(const [id,name,sprite] of SPECIES)CREATURES[id]={name,sprite};
Object.assign(CREATURES,{
 sprout:{name:'わかばのこ',sprite:2,next:['forestling','waterling','cloudling']},
 wisp:{name:'ほしあかりのこ',sprite:3,next:['shadowling','skyling','fireling']},
 forestling:{name:'もりのともだち',sprite:4,next:['hikari','mori','komorebi','golem']},
 waterling:{name:'みずのともだち',sprite:5,next:['mizukame','kumofairy']},
 cloudling:{name:'くものともだち',sprite:9,next:['kumofairy','hikari']},
 shadowling:{name:'よるのともだち',sprite:6,next:['yamineko','kitsunebi']},
 skyling:{name:'そらのともだち',sprite:7,next:['soradragon','kumofairy']},
 fireling:{name:'ほのおのともだち',sprite:8,next:['phoenix','kitsunebi']}
});
const legacySprites={egg:0,baby:1,sky:3,leaf:2,cloud:7,moon:6,flower:4,spring:5,mokumo:16,kazemo:16,yorune:15,hoshipuru:18,hanapyon:10,pokaron:14,shizukuma:13,mizune:13};
for(const [id,sprite] of Object.entries(legacySprites))CREATURES[id].sprite=sprite;
CREATURES.baby.next=['sprout','wisp'];
export const STAGE_NAMES=['タマゴ','うまれたて','第1進化','第2進化','最終進化'];
export function dateKey(ms=Date.now()){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(new Date(ms))}
export function growthDay(g,now=Date.now()){return g?.startedAt==null?0:Math.max(1,Math.round((Date.parse(dateKey(now))-Date.parse(dateKey(g.startedAt)))/86400000)+1)}
export function egg(id){return {id,startedAt:null,stage:0,character:'egg',points:0,count:0,path:[],completedAt:null,lastEvent:''}}
// Seed is sampled once per user action, outside transaction retries. No future outcome is saved.
export function choose(candidates,seed,stage,weight=()=>1){let h=2166136261;for(const c of seed+':'+stage)h=Math.imul(h^c.charCodeAt(0),16777619);const weights=candidates.map(c=>Math.max(0,weight(c)));const total=weights.reduce((a,b)=>a+b,0);if(!total)throw Error('進化候補がありません');let n=(h>>>0)/4294967296*total;for(let i=0;i<candidates.length;i++){n-=weights[i];if(n<0)return candidates[i]}return candidates.at(-1)}
export function advance(g,now,seed){const n=structuredClone(g);if(n.stage===0||n.stage===4)return n;for(const m of MILESTONES){if(n.stage===m.stage-1&&growthDay(n,now)>=m.day&&n.points>=m.points){n.character=choose(CREATURES[n.character].next,seed,m.stage);n.stage=m.stage;n.path.push({stage:n.stage,character:n.character,at:now});n.lastEvent='evolve:'+n.id+':'+n.stage;if(n.stage===4)n.completedAt=now;}}return n}
export function grow(g,id,now,seed){let n=structuredClone(g||egg(id));if(n.stage===4)return n;if(n.startedAt==null)n.startedAt=now;n.points+=GROWTH_POINTS;n.count++;n.lastEvent=id;if(n.stage===0){n.stage=1;n.character='baby';n.path.push({stage:1,character:'baby',at:now})}return advance(n,now,seed)}
export function archive(g){if(g?.stage!==4)return null;return {cycleId:g.id,characterId:g.character,name:CREATURES[g.character].name,startedAt:g.startedAt,completedAt:g.completedAt,startDate:dateKey(g.startedAt),finalDate:dateKey(g.completedAt),days:growthDay(g,g.completedAt),count:g.count,points:g.points,path:g.path}}
export function nextEgg(g,id){if(g?.stage!==4)throw Error('今の子を育ててから、次のタマゴを迎えよう。');return egg(id)}
