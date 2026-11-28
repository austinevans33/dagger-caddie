import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

test('NC checkpoint resumes completed courses and reports geometry exceptions', () => {
  const temp=mkdtempSync(join(tmpdir(),'kingdom-course-'));
  try {
    const path=join(temp,'checkpoint.json');
    const args=['scripts/kingdom-course-preflight.mjs','--checkpoint',path,'--region','NC',
      'country-hills-gibsonville-nc','carolina-colours-new-bern-nc'];
    const run=()=>spawnSync(process.execPath,args,{encoding:'utf8'});
    const first=run();
    assert.equal(first.status,0,first.stderr);
    const report=JSON.parse(first.stdout);
    assert.deepEqual(report.counts,{discovered:2,scorecardReady:2,fullyDrawn:1,someDrawings:1,ghostReady:2,passedCoursePreflight:1});
    assert.equal(report.exceptions[0].id,'carolina-colours-new-bern-nc');
    assert.equal(report.exceptions[0].holes.length,18);
    assert(report.exceptions[0].holes.every(hole=>hole.coverage==='scorecard'));
    const saved=JSON.parse(readFileSync(path,'utf8'));
    saved.rows.pop();
    writeFileSync(path,JSON.stringify(saved));
    const resumed=run();
    assert.equal(resumed.status,0,resumed.stderr);
    assert.equal(resumed.stdout,first.stdout);
    saved.pin='older-runtime';
    writeFileSync(path,JSON.stringify(saved));
    assert.match(run().stderr,/Checkpoint does not match/);
  } finally {
    rmSync(temp,{recursive:true,force:true});
  }
});
