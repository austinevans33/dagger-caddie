import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileProviderScorecard} from '../playtest/course-scorecard-reconcile.js';
import {getActiveCourseContext} from '../playtest/active-course-context.js';
import {saveActiveRound} from '../playtest/starters-desk-session.js';
import {readCachedCourseScorecard,saveCachedCourseScorecard} from '../playtest/course-scorecard-cache.js';
const holes=Array.from({length:18},(_,i)=>({number:i+1,par:i===2?3:4,yards:330+i*4,hazards:[]}));
const selection=(id='test-course',tee='white')=>({course:{provider:'opengolfapi',providerCourseId:id,name:'Test',region:'NC'},tee:{providerTeeId:tee,name:tee,totalYards:6100},holeNumber:1});
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)}};
const response=data=>({ok:true,json:async()=>({holes:data.map(h=>({number:h.number,par:h.par,yardages:{white:h.yards,blue:h.yards+10}}))})});
test('partial provider outage retains all verified holes when overlap is consistent',async()=>{
 const storage=memory();const sel=selection();saveActiveRound(storage,sel,1000);
 saveCachedCourseScorecard(storage,sel,holes,1000);
 const result=await getActiveCourseContext({storage,now:2000,fetcher:async()=>response(holes.slice(0,3))});
 assert.equal(result.state,'ready-merged');assert.equal(result.holes.length,18);
 assert.equal(result.holes[17].yards,holes[17].yards);
 assert.equal(readCachedCourseScorecard(storage,sel).holes.length,18);
});
test('consistent partials add new holes without fabricating the others',async()=>{
 const storage=memory(),sel=selection();saveActiveRound(storage,sel,1000);
 saveCachedCourseScorecard(storage,sel,holes.slice(0,2),1000);
 const result=await getActiveCourseContext({storage,now:2000,fetcher:async()=>response(holes.slice(1,4))});
 assert.deepEqual(result.holes.map(h=>h.number),[1,2,3,4]);
 assert.equal(result.reconciliation,'provider-and-cache');
});
test('conflict fails closed and does not silently combine inconsistent tee distances',async()=>{
 const storage=memory(),sel=selection();saveActiveRound(storage,sel,1000);
 saveCachedCourseScorecard(storage,sel,holes,1000);
 const conflicting=[{...holes[0],yards:holes[0].yards+1}];
 const result=await getActiveCourseContext({storage,now:2000,fetcher:async()=>response(conflicting)});
 assert.equal(result.reconciliation,'provider-conflict');
 assert.deepEqual(result.holes.map(h=>h.number),[1]);
});
test('another course or tee is never used to fill missing holes',async()=>{
 const storage=memory(),sel=selection('new-course');saveActiveRound(storage,sel,1000);
 saveCachedCourseScorecard(storage,selection('old-course'),holes,1000);
 saveCachedCourseScorecard(storage,selection('new-course','blue'),holes,1000);
 const result=await getActiveCourseContext({storage,now:2000,fetcher:async()=>response(holes.slice(0,1))});
 assert.equal(result.holes.length,1);
 assert.equal(result.state,'ready');
});
test('reconciler rejects malformed or duplicated entries',()=>{
 assert.equal(reconcileProviderScorecard([{number:1,par:4,yards:400},{number:1,par:4,yards:400}],holes).mode,'invalid-provider');
 assert.equal(reconcileProviderScorecard(holes.slice(0,3),holes).holes.length,18);
});
