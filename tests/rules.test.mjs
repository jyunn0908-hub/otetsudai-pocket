import * as firestore from 'firebase/firestore';
import {saveCare} from '../dist/care.mjs';
import {savePlacement} from '../dist/garden.mjs';
import {advance,archive,nextEgg,grow} from '../dist/growth.mjs';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,getDocs,collection,query,where,updateDoc,deleteDoc,runTransaction} from 'firebase/firestore';
import {approve,initialState} from '../dist/domain.mjs';
import assert from 'node:assert/strict';
const env=await initializeTestEnvironment({projectId:'demo-otetsudai',firestore:{rules:await readFile(new URL('../firestore.rules',import.meta.url),'utf8')}});
try{
 const parent=env.authenticatedContext('parent',{firebase:{sign_in_provider:'password'}}).firestore();
 const kid=env.authenticatedContext('kid',{firebase:{sign_in_provider:'anonymous'}}).firestore();
 const outsider=env.authenticatedContext('other',{firebase:{sign_in_provider:'password'}}).firestore();
 const unauth=env.unauthenticatedContext().firestore();
 const family=db=>doc(db,'families','parent');
 await assertSucceeds(setDoc(family(parent),initialState()));
 await assertFails(getDoc(family(kid)));await assertFails(getDoc(family(outsider)));await assertFails(getDoc(family(unauth)));
 await assertFails(setDoc(doc(kid,'families','kid'),initialState()));
 await assertSucceeds(getDoc(doc(kid,'families','parent','members','kid')));
 await assertSucceeds(setDoc(doc(kid,'families','parent','joins','kid'),{name:'テスト',status:'pending'}));
 await assertFails(setDoc(doc(kid,'families','parent','members','kid'),{name:'テスト'}));
 await assertFails(updateDoc(doc(kid,'families','parent','joins','kid'),{status:'approved'}));
 await assertSucceeds(setDoc(doc(parent,'families','parent','members','kid'),{name:'テスト'}));
 const initial=initialState();initial.accounts.kid={name:'テスト',points:70};await setDoc(family(parent),initial);
 await assertSucceeds(getDoc(family(kid)));
 await assertFails(updateDoc(family(kid),{'accounts.kid.points':9999}));
 const id='kid_clean_2026-10-03',r={uid:'kid',type:'chore',itemId:'clean',day:'2026-10-03',status:'pending',at:Date.now()};
 const req=db=>doc(db,'families','parent','requests',id);
 await assertSucceeds(setDoc(req(kid),r));
 await assertFails(setDoc(doc(kid,'families','parent','requests','fake-key'),r));
 await assertFails(updateDoc(req(kid),{status:'approved'}));
 await assertFails(getDoc(req(outsider)));
 await assertSucceeds(getDocs(query(collection(kid,'families','parent','requests'),where('uid','==','kid'))));
 await assertFails(getDocs(collection(kid,'families','parent','requests')));
 await updateDoc(req(parent),{status:'rejected'});
 await assertSucceeds(setDoc(req(kid),{...r,at:Date.now()+1}));
 await updateDoc(req(parent),{status:'rejected'});
 await assertFails(setDoc(req(kid),{...r,itemId:'dishes'}));
 await setDoc(req(kid),{...r,at:Date.now()+2});
 async function accept(requestId){return runTransaction(parent,async tx=>{const fr=family(parent),rr=doc(parent,'families','parent','requests',requestId);const [s,r]=await Promise.all([tx.get(fr),tx.get(rr)]);if(r.data().status!=='pending')throw Error('processed');tx.set(fr,approve(s.data(),r.data(),requestId));tx.update(rr,{status:'approved'})})}
 const concurrent=await Promise.allSettled([accept(id),accept(id)]);assert.equal(concurrent.filter(r=>r.status==='fulfilled').length,1);assert.equal((await getDoc(family(parent))).data().accounts.kid.points,100);
 for(const id of ['exchange1','exchange2'])await setDoc(doc(kid,'families','parent','requests',id),{...r,type:'reward',itemId:'snack'});
 const exchanges=await Promise.allSettled([accept('exchange1'),accept('exchange2')]);assert.equal(exchanges.filter(r=>r.status==='fulfilled').length,1);assert.equal((await getDoc(family(parent))).data().accounts.kid.points,0);
 await assertFails(updateDoc(req(kid),{status:'pending'}));
 // Existing approval race also grants growth exactly once; exchanges never grant growth.
 let saved=(await getDoc(family(parent))).data();assert.equal(saved.growth.points,10);
 await assertFails(updateDoc(family(kid),{'growth.points':9999}));
 await assertFails(updateDoc(family(kid),{'growth.character':'mokumo','growth.stage':4}));
 const start=Date.parse('2026-10-01T00:00:00+09:00'),finish=start+20*86400000;
 saved.growth={...grow(null,'cycle-one',start,'seed'),points:230,count:23};
 await setDoc(family(parent),saved);
 async function evolve(){return runTransaction(parent,async tx=>{const ref=family(parent),snap=await tx.get(ref),before=snap.data().growth,after=advance(before,finish,'seed');if(before.stage===after.stage)return;tx.update(ref,{growth:after});tx.set(doc(parent,'families','parent','growthHistory',after.id),archive(after))})}
 const evolutionResults=await Promise.allSettled([evolve(),evolve()]);assert.ok(evolutionResults.some(r=>r.status==='fulfilled'));
 let completed=(await getDoc(family(parent))).data().growth;assert.equal(completed.stage,4);
 const hist=db=>doc(db,'families','parent','growthHistory',completed.id);
 await assertSucceeds(getDoc(hist(kid)));await assertFails(getDoc(hist(outsider)));await assertFails(getDoc(hist(unauth)));
 await assertFails(setDoc(doc(kid,'families','parent','growthHistory','fake'),archive(completed)));
 await assertFails(updateDoc(hist(kid),{count:999}));await assertFails(updateDoc(hist(parent),{count:999}));
 assert.equal((await getDocs(collection(parent,'families','parent','growthHistory'))).size,1);
 async function reset(){return runTransaction(parent,async tx=>{const ref=family(parent),snap=await tx.get(ref);tx.update(ref,{growth:nextEgg(snap.data().growth,'cycle-two')})})}
 const resets=await Promise.allSettled([reset(),reset()]);assert.equal(resets.filter(x=>x.status==='fulfilled').length,1);
 assert.equal((await getDoc(family(kid))).data().growth.stage,0);
 assert.equal((await getDoc(hist(kid))).data().count,23);
 const newKid=env.authenticatedContext('new-kid',{firebase:{sign_in_provider:'anonymous'}}).firestore();
 await setDoc(doc(parent,'families','parent','members','new-kid'),{name:'子'});
 await assertSucceeds(getDoc(hist(newKid)));
 assert.equal((await getDoc(family(newKid))).data().growth.id,'cycle-two');
 const garden=(db,id='starter-bench')=>doc(db,'families','parent','garden',id);
 const placement={kind:'bench',x:3,y:4};
 await assertSucceeds(setDoc(garden(kid),placement));
 await assertSucceeds(getDoc(garden(newKid)));
 await assertSucceeds(getDocs(collection(kid,'families','parent','garden')));
 await assertSucceeds(updateDoc(garden(parent),{x:4}));
 await assertFails(getDoc(garden(outsider)));await assertFails(getDoc(garden(unauth)));
 await assertFails(setDoc(garden(outsider),placement));await assertFails(deleteDoc(garden(outsider)));
 await assertFails(setDoc(garden(kid,'unowned'),placement));
 for(const invalid of [{...placement,x:0},{...placement,x:19},{...placement,y:11},{...placement,x:15,y:3},{...placement,x:1.5},{...placement,kind:'pot'},{...placement,points:1000}])await assertFails(setDoc(garden(kid),invalid));
 await assertFails(updateDoc(family(kid),{gardenInventory:{fake:'bench'},gardenUnlocked:true}));
 await assertSucceeds(updateDoc(family(parent),{gardenInventory:{'find-3':'pot'}}));
 await assertSucceeds(setDoc(garden(kid,'find-3'),{kind:'pot',x:5,y:5}));
 await assertSucceeds(savePlacement(firestore,kid,'parent','starter-bench',[6,6]));
 assert.deepEqual((await getDoc(garden(parent))).data(),{kind:'bench',x:6,y:6});
 const placements=await Promise.allSettled([
  savePlacement(firestore,kid,'parent','starter-bench',[8,8]),
  savePlacement(firestore,parent,'parent','starter-pot',[8,8])
 ]);assert.equal(placements.filter(r=>r.status==='fulfilled').length,1);
 // Full inventories remain editable within the transaction/rules access limits.
 await updateDoc(family(parent),{gardenInventory:Object.fromEntries(Array.from({length:60},(_,i)=>['find-'+i,'pot']))});
 await assertSucceeds(savePlacement(firestore,newKid,'parent','find-59',[12,8]));
 assert.equal((await getDoc(garden(parent,'find-59'))).data().x,12);
 await assertSucceeds(savePlacement(firestore,kid,'parent','starter-bench',null));
 assert.equal((await getDoc(garden(parent))).exists(),false);

 // Care is family-scoped, distinct from rewards; use server time for limits.
 const careRef=db=>doc(db,'families','parent','care','state');
 const day=Math.floor((Date.now()+32400000)/86400000);
 const careBase={day,used:1,balance:0,session:'round1',startedAt:firestore.serverTimestamp(),claimed:false,score:0,meals:{berry:0,fish:0,soup:0},lastFood:'',feedId:''};
 await assertFails(setDoc(careRef(outsider),careBase));await assertFails(setDoc(careRef(unauth),careBase));
 await assertFails(setDoc(careRef(kid),{...careBase,balance:100}));
 await assertFails(setDoc(careRef(kid),{...careBase,day:day+1}));
 await assertSucceeds(saveCare({...firestore,db:kid},'parent','start',{id:'first-game-with-egg'}));
 assert.equal((await getDoc(careRef(kid))).data().used,1);
 await env.withSecurityRulesDisabled(async ctx=>firestore.deleteDoc(careRef(ctx.firestore())));
 await assertSucceeds(setDoc(careRef(kid),careBase));
 await assertFails(updateDoc(careRef(kid),{claimed:true,score:10,balance:15}));
 await assertFails(updateDoc(careRef(kid),{balance:999}));
 await assertFails(deleteDoc(careRef(kid)));
 await assertFails(getDoc(careRef(outsider)));
 await assertSucceeds(getDoc(careRef(parent)));await assertSucceeds(getDoc(careRef(newKid)));
 async function seedCare(extra={}){await env.withSecurityRulesDisabled(async ctx=>setDoc(careRef(ctx.firestore()),{...careBase,startedAt:firestore.Timestamp.fromMillis(Date.now()-31000),...extra}))}
 await seedCare();
 for(const score of [-1,31,1.5])await assertFails(updateDoc(careRef(kid),{claimed:true,score,balance:5+score}));
 async function claim(db){return runTransaction(db,async tx=>{const ref=careRef(db),snap=await tx.get(ref);if(snap.data().claimed)throw Error('already claimed');tx.update(ref,{claimed:true,score:20,balance:snap.data().balance+25})})}
 const claims=await Promise.allSettled([claim(kid),claim(newKid)]);assert.equal(claims.filter(x=>x.status==='fulfilled').length,1);
 assert.equal((await getDoc(careRef(kid))).data().balance,25);
 await assertFails(updateDoc(careRef(kid),{balance:50}));
 await assertFails(updateDoc(careRef(kid),{claimed:false}));
 const meal={balance:15,meals:{berry:1,fish:0,soup:0},lastFood:'berry',feedId:'meal1'};
 await assertSucceeds(updateDoc(careRef(kid),meal));
 await assertFails(updateDoc(careRef(kid),{...meal,balance:5,meals:{berry:2,fish:0,soup:0}}));
 await assertFails(updateDoc(careRef(kid),{balance:-5,meals:{berry:1,fish:0,soup:1},lastFood:'soup',feedId:'meal2'}));
 await assertFails(updateDoc(careRef(kid),{balance:15,meals:{berry:2,fish:0,soup:0},lastFood:'berry',feedId:'meal2'}));
 await seedCare({used:4,claimed:true,balance:25});
 async function startGame(db,id){return runTransaction(db,async tx=>{const ref=careRef(db),snap=await tx.get(ref);tx.update(ref,{used:snap.data().used+1,session:id,startedAt:firestore.serverTimestamp(),claimed:false,score:0})})}
 const starts=await Promise.allSettled([startGame(kid,'round5a'),startGame(newKid,'round5b')]);assert.equal(starts.filter(x=>x.status==='fulfilled').length,1);
 assert.equal((await getDoc(careRef(kid))).data().used,5);
 await seedCare({used:5,claimed:true,balance:25});
 await assertFails(startGame(kid,'round6'));
 await assertFails(updateDoc(careRef(kid),{used:1,day:day+1,session:'fake-day',startedAt:firestore.serverTimestamp(),claimed:false,score:0}));
 await seedCare({day:day-1,used:5,claimed:true,balance:25});
 await assertSucceeds(updateDoc(careRef(newKid),{day,used:1,session:'newday',startedAt:firestore.serverTimestamp(),claimed:false,score:0}));
 assert.equal((await getDoc(careRef(newKid))).data().balance,25);

 await seedCare({day:day-1,used:5,claimed:true,balance:25});
 const careApi={...firestore,db:kid};
 await assertSucceeds(saveCare(careApi,'parent','start',{id:'real-api'}));
 await assertSucceeds(saveCare(careApi,'parent','start',{id:'real-api'}));
 assert.equal((await getDoc(careRef(kid))).data().used,1);
 await seedCare({session:'real-api',balance:25});
 await assertSucceeds(saveCare(careApi,'parent','finish',{id:'real-api',score:10}));
 await assertSucceeds(saveCare(careApi,'parent','finish',{id:'real-api',score:10}));
 assert.equal((await getDoc(careRef(kid))).data().balance,40);
 await assertSucceeds(saveCare(careApi,'parent','feed',{id:'real-meal',food:'fish'}));
 await assertSucceeds(saveCare(careApi,'parent','feed',{id:'real-meal',food:'fish'}));
 assert.equal((await getDoc(careRef(kid))).data().balance,25);
 console.log('PASS: お世話5回制限・サーバー日付・同時開始/結果加算・ご飯残高・二重送信・家族外拒否・端末共有');
 await assertSucceeds(deleteDoc(doc(parent,'families','parent','members','kid')));
 await assertFails(getDoc(garden(kid,'find-3')));await assertFails(setDoc(garden(kid),placement));
 await assertFails(getDoc(careRef(kid)));
 console.log('PASS: 庭の家族共有・子供の配置と片付け・持ち物偽造/家族外/無効座標/権限剥奪の拒否');
 console.log('PASS: 成長の二重付与防止、交換独立、子供の成長・進化・図鑑改ざん禁止、家族外アクセス禁止、同時進化の図鑑一件、次サイクル競合、保存後復帰・新端末での読取');
 console.log('PASS: 家族外の読取禁止、未承認参加、親なりすまし禁止、子供の残高変更禁止、申請と再申請、同時二重承認、同時交換の残高保護');
}finally{await env.cleanup()}
