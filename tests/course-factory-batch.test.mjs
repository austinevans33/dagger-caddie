import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectFactoryBatch} from '../app/61f9e9de0a/course-factory-batch.js';
const entry=id=>({selection:{course:{providerCourseId:id,name:id,holeCount:18}},holes:Array.from({length:18},(_,i)=>({number:i+1,par:4,yards:400}))});
test('batch preflight checks every hole and isolates unavailable drawings',async()=>{
 const rows=await inspectFactoryBatch([entry('complete'),entry('partial'),{holes:[]}],{loadSketch:async(s,n)=>{
  if(s.course.name==='partial'&&n===18)throw Error('missing');
  return {coverage:'layout',annotations:{route:{}},shapes:[{type:'green'}]};
 }});
 assert.equal(rows[0].status,'candidate-ready');assert.equal(rows[0].mapped,18);
 assert.equal(rows[1].status,'mapping-incomplete');assert.equal(rows[1].mapped,17);
 assert.equal(rows[1].ghostReady,true);assert.equal(rows[2].status,'scorecard-blocked');
});
test('partial artwork cannot be counted as complete',async()=>{
 const [row]=await inspectFactoryBatch([entry('partial')],{loadSketch:async()=>({coverage:'partial',shapes:[]})});
 assert.equal(row.mapped,0);assert.equal(row.status,'mapping-incomplete');
});
