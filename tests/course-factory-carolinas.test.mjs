import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {auditFounderGeometry} from '../playtest/founder-geometry-audit.js';
import {founderCatalogRecords,founderMapRecord,founderTeesForCourse,founderVerifiedScorecard} from '../playtest/founders-verified-scorecards.js';

const read = name => readFileSync(new URL(name,import.meta.url));
const json = name => JSON.parse(read(name));

for(const {state,id,query,totals,example,fairways=18,handicap=true} of [
 {state:'north-carolina',id:'gates-four-fayetteville-nc',query:'Gates Four',
  totals:{black:6895,blue:6433,white:6072,gold:5506,red:5365},example:{number:13,par:5,yards:536}},
 {state:'south-carolina',id:'crooked-oaks-seabrook-sc',query:'Crooked Oaks',
  totals:{hawk:6706,mallard:6367,osprey:5980,egret:5622,finch:5092,heron:4599},example:{number:13,par:3,yards:175}},
 {state:'north-carolina',id:'tanglewood-championship-clemmons-nc',query:'Tanglewood Park Championship',
  totals:{gold:7101,blue:6637,white:6014,black:5333,red:4562,family:3404},example:{number:13,par:4,yards:400}},
 {state:'south-carolina',id:'hidden-cypress-bluffton-sc',query:'Hidden Cypress',
  totals:{red:6953,gold:6549,blue:6051,white:5556,black:4974,orange:4227},example:{number:13,par:5,yards:512},fairways:17},
 {state:'north-carolina',id:'longleaf-southern-pines-nc',query:'Longleaf',
  totals:{'right-start':2423,'tee-1':3103,'tee-2':3702,'tee-3':4316,'tee-4':4872,'tee-5':5491,'tee-6':6153},
  example:{number:13,par:4,yards:380}},
 {state:'north-carolina',id:'sanford-municipal-nc',query:'Sanford Municipal',
  totals:{mens:6304,white:5901,gold:5164,women:4882},example:{number:13,par:4,yards:409},handicap:false},
 {state:'north-carolina',id:'pudding-ridge-mocksville-nc',query:'Pudding Ridge',
  totals:{black:6713,blue:6132,gold:4835,red:4110},example:{number:13,par:4,yards:445}},
 {state:'north-carolina',id:'oak-island-nc',query:'Oak Island',
  totals:{blue:6717,black:6401,white:5940,gold:5423,red:4903},
  example:{number:13,par:4,yards:391},fairways:17},
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
  const {holes,provenance}=founderVerifiedScorecard({course,tee});
  const source=manifest.courses.find(course=>course.id===id).scorecard;
  assert.deepEqual(provenance.additionalSources,source.additionalSources?.map(({url,sha256})=>({url,sha256})));
  const {number,par,yards}=holes[12];
  assert.deepEqual({number,par,yards},example);
  if(handicap) assert.equal(new Set(holes.map(hole=>hole.handicapMen)).size,18);
  else assert.ok(holes.every(hole=>hole.handicapMen===undefined));
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

test('Oak Island Red preserves the ladies par and stroke indexes',()=>{
 const course=founderCatalogRecords('Oak Island').find(({providerCourseId})=>providerCourseId==='oak-island-nc');
 const tee=founderTeesForCourse(course).find(({providerTeeId})=>providerTeeId==='red');
 const {holes}=founderVerifiedScorecard({course,tee});
 assert.equal(holes[8].par,5);
 assert.equal(holes[8].handicapMen,11);
 assert.equal(holes[13].par,4);
 assert.equal(holes[13].handicapMen,2);
});


test('Seven Lakes keeps verified tees selectable while withholding its unaudited map',()=>{
 const course=founderCatalogRecords('7 Lakes').find(({providerCourseId})=>providerCourseId==='seven-lakes-west-end-nc');
 assert.ok(course);
 assert.deepEqual(founderCatalogRecords('Seven Lakes'),[course]);
 const tees=founderTeesForCourse(course);
 assert.deepEqual(Object.fromEntries(tees.map(tee=>[tee.providerTeeId,tee.totalYards])),
  {black:6856,blue:6552,white:6062,'white-gold':5640,gold:5197,red:4830,green:4144,'green-red':4533});
 const coverage=json('../qa/course-factory/north-carolina/coverage.json').courses.find(({id})=>id===course.providerCourseId);
 assert.equal(coverage.cardVerified,true);
 assert.equal(coverage.status,'playable-partial');
 assert.deepEqual(coverage.audit.ratioErrors,[16]);
 assert.equal(founderMapRecord(course).status,'source-review-blocked');
 const tee=tees.find(({providerTeeId})=>providerTeeId==='green-red');
 const {holes}=founderVerifiedScorecard({course,tee});
 assert.equal(holes[11].yards,319);
 assert.equal(holes[11].handicapMen,4);
});
