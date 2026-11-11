import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAllHeartRoundDetail} from '../playtest/all-heart-scorecard-context.js';
// The adapter is deliberately fail-closed if the actual scorecard storage
// schema or a verified hole record is unavailable.
test('no active round never produces an All Heart prompt',()=>{
 const storage={getItem:()=>null};
 assert.equal(buildAllHeartRoundDetail(storage,{verified:true,holeNumber:1,par:4,strokeIndex:1,courseId:'x'}),null);
});
test('unverified hole never produces a prompt',()=>{
 const storage={getItem:()=>null};
 assert.equal(buildAllHeartRoundDetail(storage,{verified:false,holeNumber:1,par:4,strokeIndex:1,courseId:'x'}),null);
});
