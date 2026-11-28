import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const batch = new Map([
 ['the-woods-whispering-pines-nc',[18,[],'20c78e0e4d9f91d8fa762d66c35e451aede83f08ac1b45481983cbadd872363e']],
 ['mill-creek-mebane-nc',[17,[17],'231f7e083422e51f0214c434a5a6a689cbadc6ee3b018b6ecae15caf0a0aa0d2']],
 ['hillandale-durham-nc',[18,[],'8b64df0c0ebda9043265ae362969d01aeee7862dc351553401e163ed942bf840']],
 ['neuse-clayton-nc',[0,[],null]],
]);

test('previously sourced NC cards and drawings pass the published runtime preflight',()=>{
 const run=JSON.parse(execFileSync(process.execPath,
  ['scripts/kingdom-course-preflight.mjs',...batch.keys()],{encoding:'utf8'}));
 assert.deepEqual(run.counts,{discovered:4,scorecardReady:4,fullyDrawn:2,someDrawings:3,ghostReady:4,passedCoursePreflight:2});
 for(const row of run.courses){
  const [mapped,partial,sha]=batch.get(row.id);
  assert.equal(row.holeCount,18);
  assert.equal(row.mappedHoles,mapped);
  assert.equal(row.ghostReady,true);
  assert.deepEqual(row.partialHoles,partial);
  if(!sha)continue;
  const art=readFileSync(new URL('../app/61f9e9de0a/course-art/'+row.id+'.json',import.meta.url));
  assert.equal(createHash('sha256').update(art).digest('hex'),sha);
 }
});
