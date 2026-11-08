import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {auditFounderGeometry} from '../playtest/founder-geometry-audit.js';
import {founderCatalogRecords,founderMapRecord,founderTeesForCourse,founderVerifiedScorecard} from '../playtest/founders-verified-scorecards.js';

const read = name => readFileSync(new URL(name,import.meta.url));
const json = name => JSON.parse(read(name));

for(const {state,id,query,totals,example,fairways=18} of [
 {state:'north-carolina',id:'gates-four-fayetteville-nc',query:'Gates Four',
  totals:{black:6895,blue:6433,white:6072,gold:5506,red:5365},example:{number:13,par:5,yards:536}},
 {state:'south-carolina',id:'crooked-oaks-seabrook-sc',query:'Crooked Oaks',
  totals:{hawk:6706,mallard:6367,osprey:5980,egret:5622,finch:5092,heron:4599},example:{number:13,par:3,yards:175}},
 {state:'north-carolina',id:'tanglewood-championship-clemmons-nc',query:'Tanglewood Park Championship',
  totals:{gold:7101,blue:6637,white:6014,black:5333,red:4562,family:3404},example:{number:13,par:4,yards:400}},
 {state:'south-carolina',id:'hidden-cypress-bluffton-sc',query:'Hidden Cypress',
  totals:{red:6953,gold:6549,blue:6051,white:5556,black:4974,orange:4227},example:{number:13,par:5,yards:512},fairways:17},
]){
 test(`${query} promotes only the source-pinned 18-hole course and official tee card`,()=>{
  const root='../qa/course-factory/'+state+'/';
  const manifest=json(root+'manifest.json');
  const coverage=json(root+'coverage.json');
  const row=coverage.courses.find(course=>course.id===id);
  assert.equal(coverage.pbfSha256,manifest.pbfSha256);
  assert.equal(coverage.snapshotSha256,manifest.snapshotSha256);
  assert.equal(row.id,id);
  assert.equal(row.status,'strict-pass');
  assert.equal(row.cardSha256,manifest.courses.find(course=>course.id===id).scorecard.sha256);
  const course=founderCatalogRecords(query).find(course=>course.providerCourseId===id);
  assert.ok(course);
  assert.equal(founderMapRecord({...course,region:'Unrelated club'}),null);
  const tees=founderTeesForCourse(course);
  assert.deepEqual(Object.fromEntries(tees.map(tee=>[tee.providerTeeId,tee.totalYards])),totals);
  const tee=tees.find(tee=>tee.providerTeeId===row.auditTee);
  const {holes}=founderVerifiedScorecard({course,tee});
  const {number,par,yards}=holes[12];
  assert.deepEqual({number,par,yards},example);
  assert.equal(new Set(holes.map(hole=>hole.handicapMen)).size,18);
  const map=founderMapRecord(course);
  const bytes=read('../playtest/course-art/'+map.file);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),row.bundleSha256);
  const {features,metadata}=JSON.parse(bytes);
  const review=json(root+'reviews/'+id+'.json');
  assert.equal(metadata.source_sha256,review.sha256);
  assert.equal(metadata.license,coverage.license);
  assert.equal(metadata[review.boundary_type==='way'?'osm_way':'osm_relation'],review.boundary);
  const audit=auditFounderGeometry({records:features,holes,metadata,expectedRef:map.ref});
  assert.equal(audit.pass,true);
  assert.equal(audit.quality.mappedHoles,18);
  assert.equal(audit.quality.fairwayHoles,fairways);
  assert.deepEqual(audit.ratioErrors,[]);
  assert.ok(!features.some(feature=>feature.properties.reference_tee||feature.properties.tee_alignment));
 });
}
