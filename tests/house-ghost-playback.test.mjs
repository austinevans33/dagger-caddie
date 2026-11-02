import test from 'node:test';
import assert from 'node:assert/strict';
import {ghostShotPlayback} from '../house-ghost-playback.js';
import {buildGhostRound} from '../house-ghost-round.js';

test('progressively reveal only completed simulated shots',()=>{
 const params={courseName:'Friday QA',seed:'friday',holeNumber:4};
 const full=buildGhostRound(params)[3];
 for(let n=0;n<=full.score;n++){
  const state=ghostShotPlayback({...params,shotsRevealed:n});
  assert.equal(state.visibleShots.length,n);
  assert.equal(state.totalShots,full.score);
  assert.deepEqual(state.nextShot,n===full.score?null:full.shots[n]);
  assert.equal(state.complete,n===full.score);
  assert.equal(state.schematicOnly,true);
 }
});
test('over-advance clamps at holed-out and never changes shot trail',()=>{
 const a=ghostShotPlayback({shotsRevealed:999});
 const b=ghostShotPlayback({shotsRevealed:a.totalShots});
 assert.deepEqual(a,b);
 assert.equal(a.visibleShots.at(-1).lie,'Holed');
});
test('9-hole coverage and real scorecard facts stay correctly labeled',()=>{
 const x=ghostShotPlayback({count:9,holeNumber:9,holes:[{number:9,par:3,yards:172}],shotsRevealed:1});
 assert.equal(x.par,3);assert.equal(x.coverage,'scorecard');assert.equal(x.courseYardsVerified,true);
 const fallback=ghostShotPlayback({count:9,holeNumber:8});
 assert.equal(fallback.coverage,'schematic-fallback');
});
test('negative, fractional and out-of-range positions are rejected',()=>{
 for(const shotsRevealed of [-1,1.5,NaN])assert.throws(()=>ghostShotPlayback({shotsRevealed}),/Invalid Ghost/);
 for(const holeNumber of [0,10,19,2.1])assert.throws(()=>ghostShotPlayback({count:9,holeNumber}),/Invalid Ghost/);
});
