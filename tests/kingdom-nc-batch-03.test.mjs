import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

test('Seven Lakes uses its reviewed reference art while Pine Island plays from the scorecard', () => {
  const ids = ['seven-lakes-west-end-nc', 'pine-island-charlotte-nc'];
  const run = JSON.parse(execFileSync(process.execPath,
    ['scripts/kingdom-course-preflight.mjs', ...ids], {encoding:'utf8'}));
  assert.deepEqual(run.counts, {
    discovered:2, scorecardReady:2, fullyDrawn:0, someDrawings:1, ghostReady:2, passedCoursePreflight:0,
  });
  for (const course of run.courses) {
    assert.equal(course.holeCount, 18);
    assert.equal(course.mappedHoles, course.id.startsWith('seven-lakes') ? 17 : 0);
    assert.deepEqual(course.partialHoles, course.id.startsWith('seven-lakes') ? [7] : []);
    assert.equal(course.ghostReady, true);
  }
});
