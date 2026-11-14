import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {buildBatch} from '../scripts/course-factory-batch.mjs';

const hasShapely=spawnSync('python3',['-c','import shapely']).status===0;
test('selected batch matches full coverage and uses a separate catalog filename',{skip:!hasShapely},()=>{
 const root=mkdtempSync(join(tmpdir(),'dcc-selection-'));
 try{
  const snapshot=join(root,'input.osm'),manifest=join(root,'manifest.json');
  const xml='<osm version="0.6" license="https://opendatacommons.org/licenses/odbl/1-0/"/>';
  writeFileSync(snapshot,xml);
  const courses=['first','second'].map(id=>({id,name:id,region:'NC',boundary:null,
   mapRef:'nc/'+id,geometryBlocker:'Fixture has no geometry'}));
  writeFileSync(manifest,JSON.stringify({catalogSlug:'north-carolina',source:'fixture',
   pbfSha256:'0'.repeat(64),snapshotSha256:createHash('sha256').update(xml).digest('hex'),courses}));
  const full=buildBatch(manifest,snapshot,root,join(root,'full'));
  const selected=join(root,'selected');
  assert.deepEqual(buildBatch(manifest,snapshot,root,selected,['second']),[full[1]]);
  assert.deepEqual(JSON.parse(readFileSync(join(selected,'selection.json'))).courseIds,['second']);
  assert.equal(existsSync(join(selected,'north-carolina-course-factory.js')),false);
  assert.equal(existsSync(join(selected,'north-carolina-selected-courses.js')),true);
  assert.throws(()=>buildBatch(manifest,snapshot,root,join(root,'bad'),['typo']),/Unknown course selection/);
  assert.throws(()=>buildBatch(manifest,snapshot,root,join(root,'bad'),['first','first']),/Duplicate course selection/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
