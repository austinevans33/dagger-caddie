import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

test('Seven Lakes and Pine Island play from verified scorecards while their geometry is withheld', () => {
  const ids = ['seven-lakes-west-end-nc', 'pine-island-charlotte-nc'];
  const run = JSON.parse(execFileSync(process.execPath,
    ['scripts/kingdom-course-preflight.mjs', ...ids], {encoding:'utf8'}));
  assert.deepEqual(run.counts, {
    discovered:2, scorecardReady:2, fullyDrawn:0, someDrawings:0, ghostReady:2, passedCoursePreflight:0,
  });
  for (const course of run.courses) {
    assert.equal(course.holeCount, 18);
    assert.equal(course.mappedHoles, 0);
    assert.equal(course.ghostReady, true);
  }
});
