import test from 'node:test';
import assert from 'node:assert/strict';
import {selectedYardagePage} from '../yardage-selection.js';
const course={provider:'trusted',providerCourseId:'course-1',name:'Course One',region:'NC'};
const tee={providerTeeId:'blue',name:'Blue',totalYards:6300};
const selection={course,tee,holeNumber:2};
const record={verified:true,provider:'trusted',providerCourseId:'course-1',providerTeeId:'blue',
 holes:[{number:2,par:4,yards:412}]};
test('matching selected course and tee expose provider hole information',()=>{
 const x=selectedYardagePage({selection,record});
 assert.equal(x.selectionMatched,true);assert.equal(x.displayYards,'412');assert.equal(x.source,'verified-provider-record');
});
test('changed course or tees never retain old yardages',()=>{
 for(const changed of [{...selection,course:{...course,providerCourseId:'course-2'}},{...selection,tee:{...tee,providerTeeId:'white'}}]){
  const x=selectedYardagePage({selection:changed,record});
  assert.equal(x.selectionMatched,false);assert.equal(x.displayYards,'Not verified');
 }
});
test('unverified record and missing holes do not invent distances',()=>{
 assert.equal(selectedYardagePage({selection,record:{...record,verified:false}}).displayYards,'Not verified');
 assert.equal(selectedYardagePage({selection,record:{...record,holes:[]}}).displayYards,'Not verified');
 assert.equal(selectedYardagePage({selection,record:null}).selectionMatched,false);
});
test('invalid course selections fail closed',()=>{
 assert.equal(selectedYardagePage({selection:{...selection,holeNumber:25},record}),null);
 assert.equal(selectedYardagePage({selection:null,record}),null);
});
