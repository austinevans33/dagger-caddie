import test from 'node:test';
import assert from 'node:assert/strict';
import {sketchVerifiedHole} from '../yardage-sketch.js';
const course={name:'Verified Test Course'};
test('no verified geometry means no imaginary drawing',()=>assert.equal(sketchVerifiedHole({course,holeNumber:1}),null));
test('source verified geometry renders pencil style paths only',()=>{
 const x=sketchVerifiedHole({course,holeNumber:1,geometry:[{holeNumber:1,source:'verified-geometry',features:[{type:'fairway',coordinates:[[0,0],[2,0],[2,8],[0,8]]},{type:'bunker',coordinates:[[2,3],[3,3],[3,4],[2,4]]}]}]});
 assert.match(x,/aria-label="Source-verified overhead hole sketch"/);
 assert.match(x,/path/);assert.match(x,/#e7d5ad/);
});
test('unverified source cannot render',()=>assert.equal(sketchVerifiedHole({course,holeNumber:1,geometry:[{holeNumber:1,source:'guessed',features:[{type:'fairway',coordinates:[[0,0],[1,0],[1,1]]}]}]}),null));
