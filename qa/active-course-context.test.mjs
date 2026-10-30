import test from 'node:test';import assert from 'node:assert/strict';
import {getActiveCourseContext,readCourseScorecard} from '../staging-app/active-course-context.js';
import {saveActiveRound} from '../staging-app/starters-desk-session.js';
const selected={course:{provider:'opengolfapi',providerCourseId:'123',name:'Example Club',region:'NC'},tee:{providerTeeId:'blue',name:'Blue',totalYards:6200},holeNumber:1};
function storage(){const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};}
const feed=async()=>({ok:true,json:async()=>({holes:[{hole_number:1,par:4,yardages:{Blue:401}},{hole_number:2,par:3,yardages:{Blue:160}}]})});
test('selected course and tees feed shared scorecard context',async()=>{
 const s=storage();saveActiveRound(s,selected);
 const ctx=await getActiveCourseContext({storage:s,fetcher:feed});
 assert.equal(ctx.state,'ready');assert.deepEqual(ctx.holes.map(x=>x.yards),[401,160]);
 assert.equal(ctx.livePinDistance,false);
 assert.equal(readCourseScorecard(s,selected).holes.length,2);
});
test('offline read uses verified prior scorecard only for matching selection',async()=>{
 const s=storage();saveActiveRound(s,selected);await getActiveCourseContext({storage:s,fetcher:feed});
 const failed=async()=>{throw Error('Network unavailable')};
 assert.equal((await getActiveCourseContext({storage:s,fetcher:failed})).state,'offline-cached');
 assert.equal(readCourseScorecard(s,{...selected,tee:{...selected.tee,providerTeeId:'white',name:'White'}}),null);
});
test('no fabricated data when provider lacks selected tee',async()=>{
 const s=storage();saveActiveRound(s,selected);
 const empty=async()=>({ok:true,json:async()=>({holes:[{hole_number:1,par:4,yardages:{White:380}}]})});
 const ctx=await getActiveCourseContext({storage:s,fetcher:empty});
 assert.equal(ctx.state,'no-verified-holes');assert.deepEqual(ctx.holes,[]);
});
test('in-flight course switch never contaminates the new selection',async()=>{
 const s=storage();saveActiveRound(s,selected);
 const fetcher=async()=>{saveActiveRound(s,{...selected,course:{...selected.course,providerCourseId:'another'}});return feed();};
 const ctx=await getActiveCourseContext({storage:s,fetcher});
 assert.equal(ctx.state,'selection-changed');assert.equal(readCourseScorecard(s,selected),null);
});
