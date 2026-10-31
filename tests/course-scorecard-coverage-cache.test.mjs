import test from 'node:test';
import assert from 'node:assert/strict';
import {scorecardCoverage} from '../playtest/course-scorecard-coverage.js';
import {readCachedCourseScorecard,saveCachedCourseScorecard} from '../playtest/course-scorecard-cache.js';
const store=()=>{const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)}};
const sel=id=>({course:{provider:'opengolfapi',providerCourseId:String(id),name:'Test Club',region:'NC'},tee:{providerTeeId:'white',name:'White',totalYards:6200},holeNumber:1});
const holes=Array.from({length:18},(_,i)=>({number:i+1,par:4,yards:380}));
test('Coverage reports complete, partial, and absent verified scorecards',()=>{
 assert.equal(scorecardCoverage(holes).complete,true);
 assert.equal(scorecardCoverage(holes).verifiedHoles,18);
 const partial=scorecardCoverage(holes.slice(0,9));
 assert.equal(partial.complete,false);
 assert.deepEqual(partial.missingHoles,[10,11,12,13,14,15,16,17,18]);
 assert.equal(scorecardCoverage([]).verifiedHoles,0);
});
test('Multi-course cache preserves verified tee scorecards when switching courses',()=>{
 const storage=store();
 assert.equal(saveCachedCourseScorecard(storage,sel('a'),holes,1000),true);
 assert.equal(saveCachedCourseScorecard(storage,sel('b'),holes.slice(0,9),2000),true);
 assert.equal(readCachedCourseScorecard(storage,sel('a')).holes.length,18);
 assert.equal(readCachedCourseScorecard(storage,sel('b')).holes.length,9);
 assert.equal(readCachedCourseScorecard(storage,{...sel('a'),tee:{providerTeeId:'blue',name:'Blue',totalYards:6800}}),null);
});
test('Cache rejects fabricated/invalid holes and keeps latest twelve selections',()=>{
 const storage=store();
 assert.equal(saveCachedCourseScorecard(storage,sel('a'),[{number:1,par:4,yards:0}],1000),false);
 for(let i=0;i<13;i++)assert.equal(saveCachedCourseScorecard(storage,sel(String(i)),holes,i+1000),true);
 assert.equal(readCachedCourseScorecard(storage,sel('0')),null);
 assert.equal(readCachedCourseScorecard(storage,sel('12')).holes.length,18);
});
test('A hole change does not invalidate verified course and tee cache',()=>{
 const storage=store();saveCachedCourseScorecard(storage,sel('a'),holes,1000);
 assert.equal(readCachedCourseScorecard(storage,{...sel('a'),holeNumber:12}).holes.length,18);
});
