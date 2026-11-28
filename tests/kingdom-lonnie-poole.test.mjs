import test from 'node:test';
import assert from 'node:assert/strict';
import {founderCatalogRecords,founderTeesForCourse,founderVerifiedScorecard,founderMapRecord} from '../app/61f9e9de0a/founders-verified-scorecards.js';

import {buildGhostRound} from '../app/61f9e9de0a/house-ghost-round.js';

test('Lonnie Poole exposes only six reconciled club tees with all 18 pars and handicap indexes', () => {
  const [course]=founderCatalogRecords('Lonnie Poole');
  assert.equal(course.providerCourseId,'lonnie-poole-raleigh-nc');
  const tees=founderTeesForCourse(course);
  assert.deepEqual(tees.map(tee=>tee.totalYards),[7358,6916,6498,6032,4711,5136]);
  assert(!tees.some(tee=>tee.providerTeeId==='gray'));
  for(const tee of tees) {
    const {holes}=founderVerifiedScorecard({course,tee});
    assert.equal(holes.length,18);
    const ghost=buildGhostRound({courseName:course.name,holes});
    assert.equal(ghost.length,18);
    assert(ghost.every(hole=>hole.coverage==='scorecard'));
    assert.equal(holes.reduce((sum,hole)=>sum+hole.par,0),72);
    assert.deepEqual(holes.map(hole=>hole.handicapMen).sort((a,b)=>a-b),Array.from({length:18},(_,i)=>i+1));
  }
  assert.equal(founderMapRecord(course).status,'scorecard-only');
});
