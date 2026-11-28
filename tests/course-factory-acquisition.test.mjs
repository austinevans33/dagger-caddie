import test from 'node:test';
import assert from 'node:assert/strict';
import {acquireFactoryCandidates} from '../app/61f9e9de0a/course-factory-acquisition.js';
test('deduplicates overlapping searches and rejects conflicting tee totals',async()=>{
 const courses=['good','bad'].map(id=>({provider:'opengolfapi',providerCourseId:id,name:id,region:'NC'}));
 const result=await acquireFactoryCandidates(['NC','Fayetteville'],{
 search:async()=>courses,
 loadTees:async course=>[{course,tees:[{providerTeeId:'white',name:'White',totalYards:course.name==='good'?7200:7100}]}],
 loadHoles:async()=>Array.from({length:18},(_,i)=>({number:i+1,par:4,yards:400}))
 });
 assert.equal(result.discovered,2);assert.equal(result.entries.length,1);assert.equal(result.issues.length,1);assert.equal(result.entries[0].selection.course.name,'good');
});
