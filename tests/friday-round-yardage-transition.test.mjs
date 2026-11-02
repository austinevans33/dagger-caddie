import test from 'node:test';
import assert from 'node:assert/strict';
import {roundYardageTransition,canReuseYardageRecord} from '../round-yardage-transition.js';
const course={provider:'trusted',providerCourseId:'c1',name:'First Course',region:'NC'};
const tee={providerTeeId:'blue',name:'Blue',totalYards:6200};
const selection={course,tee,holeNumber:1};
const record={verified:true,provider:'trusted',providerCourseId:'c1',providerTeeId:'blue',holes:[{number:1,par:4,yards:420},{number:2,par:3,yards:160}]};
test('next hole changes book context without changing input round values',()=>{
 const original={...selection,scorecard:[4,3],wagers:[10]};
 const result=roundYardageTransition({selection:original,record,direction:'next'});
 assert.equal(result.ok,true);
 assert.equal(result.selection.holeNumber,2);
 assert.equal(result.page.displayYards,'160');
 assert.equal(original.holeNumber,1);
 assert.deepEqual(original.scorecard,[4,3]);
 assert.deepEqual(original.wagers,[10]);
});
test('first and last hole boundaries',()=>{
 assert.equal(roundYardageTransition({selection,record,direction:'previous'}).reason,'round-boundary');
 assert.equal(roundYardageTransition({selection:{...selection,holeNumber:18},record,direction:'next'}).reason,'round-boundary');
});
test('course or tee changes invalidate old yardages',()=>{
 assert.equal(canReuseYardageRecord(selection,record),true);
 assert.equal(canReuseYardageRecord({...selection,tee:{...tee,providerTeeId:'white'}},record),false);
 assert.equal(canReuseYardageRecord({...selection,course:{...course,providerCourseId:'c2'}},record),false);
});
test('invalid navigation fails safely',()=>{
 assert.equal(roundYardageTransition({selection:null,record}).ok,false);
 assert.equal(roundYardageTransition({selection,record,direction:'skip'}).reason,'invalid-direction');
});
