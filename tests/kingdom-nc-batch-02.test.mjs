import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const drawings = new Map([
  ['greensboro-national-summerfield-nc', [16, '446dcfbd47b4055559ee4076330a0f4e4c6998c738689d5a1078a9956f4abcf7']],
  ['12-oaks-holly-springs-nc', [11, 'e48397e952b7527d5312e2f211716189907a13a78f0c21e2517aa4c1819825ed']],
  ['hope-valley-durham-nc', [14, '27291cf46aaebe6ed3f6947c74cd81911841f21c2ed5207b0978fafcf15202c9']],
  ['country-hills-gibsonville-nc', [null, '5a804bd8045753d1b808565cd56776cb3e706e7544accec3e06fc00d7a58a61b']],
]);

test('NC batch 02 keeps incomplete drawings partial and all four Ghost scorecards playable', () => {
  const result = JSON.parse(execFileSync(process.execPath,
    ['scripts/kingdom-course-preflight.mjs', ...drawings.keys()], {encoding:'utf8'}));
  assert.deepEqual(result.counts, {
    discovered:4, scorecardReady:4, fullyDrawn:1, someDrawings:4, ghostReady:4, passedCoursePreflight:1,
  });
  for (const course of result.courses) {
    const [partialHole, originalHash] = drawings.get(course.id);
    assert.equal(course.holeCount, 18);
    assert.equal(course.ghostReady, true);
    assert.equal(course.mappedHoles, partialHole ? 17 : 18);
    assert.deepEqual(course.partialHoles, partialHole ? [partialHole] : []);
    const asset = readFileSync(new URL('../app/61f9e9de0a/course-art/' + course.id + '.json', import.meta.url));
    assert.equal(createHash('sha256').update(asset).digest('hex'), originalHash);
  }
});
