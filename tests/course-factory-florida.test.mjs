import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {floridaCourses} from '../playtest/florida-course-factory.js';
import {auditFounderGeometry} from '../playtest/founder-geometry-audit.js';
import {founderCatalogRecords,founderMapRecord,founderTeesForCourse,founderVerifiedScorecard} from '../playtest/founders-verified-scorecards.js';
import {loadHoleSketch} from '../playtest/hole-sketch.js';

const dir = new URL('../qa/course-factory/florida/',import.meta.url);
const read = (name,base=dir) => readFileSync(new URL(name,base));
const manifest = JSON.parse(read('manifest.json'));
const coverage = JSON.parse(read('coverage.json'));
const mapDir = new URL('../playtest/course-art/',import.meta.url);
const sha = value => createHash('sha256').update(value).digest('hex');

test('Florida published catalog agrees with source pins and coverage, strict geometry only',async()=>{
 assert.equal(coverage.pbfSha256,manifest.pbfSha256);
 assert.equal(coverage.snapshotSha256,manifest.snapshotSha256);
 assert.equal(coverage.courses.length,18);
 const strict = coverage.courses.filter(row=>row.status==='strict-pass');
 const allowedMaps = strict.map(row=>row.id+'.json').sort();
 assert.deepEqual(readdirSync(mapDir).filter(name=>name.endsWith('-fl.json')).sort(),allowedMaps);
 assert.equal(strict.length,2);
 for(const row of coverage.courses){
  const input=manifest.courses.find(course=>course.id===row.id);
  const record=floridaCourses.find(course=>course.id===row.id);
  assert.equal(Boolean(record),row.cardVerified);
  assert.equal(row.cardSha256,input.scorecard.sha256??null);
  if(!record)continue;
  const course=founderCatalogRecords(row.name).find(course=>course.providerCourseId===row.id);
  const map=founderMapRecord(course);
  assert.equal(founderMapRecord({...course,region:'Different venue, FL'}),null);
  const tees=founderTeesForCourse(course);
  assert.deepEqual(Object.fromEntries(tees.map(tee=>[tee.providerTeeId,tee.totalYards])),row.teeTotals);
  assert.equal(record.provenance.sourceSha256,input.scorecard.sha256);
  const tee=tees.find(tee=>tee.providerTeeId===row.auditTee);
  const {holes}=founderVerifiedScorecard({course,tee});
  if(row.status!=='strict-pass'){
   assert.equal(map.file,undefined);
   let calls=0;
   const sketch=await loadHoleSketch({course,tee},1,{fetcher:async()=>{calls++;throw Error('unexpected fetch')}});
   assert.equal(sketch.coverage,'scorecard');
   assert.equal(calls,0);
   continue;
  }
  const bytes=read(map.file,mapDir);
  assert.equal(sha(bytes),row.bundleSha256);
  const {features,metadata}=JSON.parse(bytes);
  const review=JSON.parse(read('reviews/'+row.id+'.json'));
  assert.equal(metadata.source,manifest.source);
  assert.equal(metadata.source_sha256,review.sha256);
  assert.equal(metadata.license,coverage.license);
  assert.equal(metadata.osm_way,review.boundary);
  const audit=auditFounderGeometry({records:features,holes,metadata,expectedRef:map.ref});
  assert.equal(audit.pass,true);
  assert.equal(audit.quality.mappedHoles,18);
  assert.ok(audit.quality.fairwayHoles>=17);
  assert.ok(!features.some(feature=>feature.properties.reference_tee || feature.properties.tee_alignment));
 }
});
