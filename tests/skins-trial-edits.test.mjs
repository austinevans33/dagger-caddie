import test from 'node:test';
import assert from 'node:assert/strict';
import {changeSkinsTrialHole,undoSkinsTrialHole} from '../skins-trial-edits.js';
const state={names:['A','B','C','D'],holes:[[4,4,5,5],[3,4,5,5]]};
test('correct hole one without duplicating or losing hole two',()=>{
 const next=changeSkinsTrialHole(state,1,[5,3,4,5]);
 assert.deepEqual(next.holes,[[5,3,4,5],[3,4,5,5]]);
 assert.equal(state.holes[0][0],4);
});
test('undo removes one saved hole only',()=>{
 const next=undoSkinsTrialHole(state);
 assert.deepEqual(next.holes,[[4,4,5,5]]);
 assert.equal(state.holes.length,2);
});
test('cannot skip holes or enter malformed strokes',()=>{
 assert.throws(()=>changeSkinsTrialHole(state,5,[3,4,5,5]),/Invalid hole/);
 assert.throws(()=>changeSkinsTrialHole(state,2,[0,4,5,5]),/Invalid golfer/);
});
