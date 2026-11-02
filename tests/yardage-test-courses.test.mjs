import test from 'node:test';
import assert from 'node:assert/strict';
import {YARDAGE_TEST_COURSES,yardageTestReadiness} from '../yardage-test-courses.js';
test('Bayonet and Ryder remain named 18-hole acceptance courses',()=>{
 assert.deepEqual(YARDAGE_TEST_COURSES.map(c=>c.id),['bayonet-puppy-creek','ryder-fort-bragg']);
 assert(YARDAGE_TEST_COURSES.every(c=>c.expectedHoles===18));
});
test('web mapping claims do not count as imported verified drawings',()=>{
 for(const course of YARDAGE_TEST_COURSES){
  const status=yardageTestReadiness(course);
  assert.equal(status.verifiedDrawings,0);assert.equal(status.fullyIllustrated,false);
  assert.equal(status.missingHoles.length,18);
 }
});
test('only verified imported geometry counts and duplicate hole is ignored',()=>{
 const status=yardageTestReadiness(YARDAGE_TEST_COURSES[0],[
  {holeNumber:1,source:'verified-geometry',features:[{type:'fairway'}]},
  {holeNumber:1,source:'verified-geometry',features:[{type:'green'}]},
  {holeNumber:2,source:'unverified',features:[{type:'fairway'}]}
 ]);
 assert.equal(status.verifiedDrawings,1);assert.equal(status.missingHoles.length,17);
});
