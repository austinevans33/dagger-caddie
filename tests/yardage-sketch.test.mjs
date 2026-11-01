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

test('orphan bunker never becomes a claimed full-hole illustration',()=>{
 const geometry=[{holeNumber:1,source:'verified-geometry',features:[{type:'bunker',coordinates:[[-79,35],[-79.001,35],[-79.001,35.001]]}]}];
 assert.equal(sketchVerifiedHole({geometry,holeNumber:1,course}),null);
});
test('longitude distortion correction renders normal North Carolina latitude geometry',()=>{
 const geometry=[{holeNumber:1,source:'verified-geometry',features:[{type:'fairway',coordinates:[[-79.2,35],[-79.199,35],[-79.199,35.002],[-79.2,35.002]]}]}];
 const svg=sketchVerifiedHole({geometry,holeNumber:1,course});
 assert.match(svg,/Source-verified overhead hole sketch/);
 assert(!svg.includes('NaN'));
});
