import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditFounderGeometry,mappedRouteYards} from '../playtest/founder-geometry-audit.js';
import {BAYONET_PAR,BAYONET_TEES} from '../playtest/bayonet-verified-scorecard.js';
const bundle=JSON.parse(readFileSync(new URL('../playtest/course-art/bayonet-at-puppy-creek.json',import.meta.url)));
const holes=BAYONET_PAR.map((par,i)=>({number:i+1,par,yards:BAYONET_TEES.white.yards[i]}));
const valid=()=>({records:bundle.features,holes,metadata:bundle.metadata,expectedRef:'nc/bayonet-at-puppy-creek'});
test('real 18-hole Bayonet artwork passes matched geometry and yardage route checks',()=>{
 const audit=auditFounderGeometry(valid());
 assert.equal(audit.pass,true);
 assert.equal(audit.quality.mappedHoles,18);
 assert.equal(audit.quality.ghostOnSameHoleReady,true);
 assert.deepEqual(audit.ratioErrors,[]);
});
test('map from a different club cannot masquerade as the chosen founder',()=>{
 const audit=auditFounderGeometry({...valid(),expectedRef:'nc/quail-ridge-golf-club'});
 assert.equal(audit.pass,false);assert.equal(audit.reason,'wrong-course-or-scorecard');
});
test('a hole-number swap triggers a scorecard-distance mismatch',()=>{
 const records=structuredClone(bundle.features);
 for(const r of records){
  const hs=r.properties?.holes;
  if(!Array.isArray(hs))continue;
  r.properties.holes=hs.map(n=>n===3?17:n===17?3:n);
 }
 const audit=auditFounderGeometry({...valid(),records});
 assert.equal(audit.pass,false);
 assert.ok(audit.ratioErrors.includes(3)||audit.ratioErrors.includes(17));
});
test('one missing mapped playing line never passes the course',()=>{
 const records=bundle.features.filter(r=>!(r.properties?.layer==='hole'&&r.properties?.holes?.includes(4)));
 const audit=auditFounderGeometry({...valid(),records});
 assert.equal(audit.pass,false);
 assert.ok(audit.ratioErrors.includes(4));
 assert.equal(mappedRouteYards(records,4),null);
});
test('duplicate primary routes on one hole are ambiguous and fail closed',()=>{
 const copy=structuredClone(bundle.features);
 const route=structuredClone(copy.find(r=>r.properties?.layer==='hole'&&r.properties?.holes?.includes(1)));
 copy.push(route);
 const audit=auditFounderGeometry({...valid(),records:copy});
 assert.equal(audit.pass,false);
 assert.ok(audit.ratioErrors.includes(1));
});

test('Sanford Quail Ridge bundle passes Bayonet parity using the published Black card',async()=>{
 const {founderCatalogRecords,founderTeesForCourse,founderVerifiedScorecard}=await import('../playtest/founders-verified-scorecards.js');
 const {loadHoleSketch,placeGhostShots}=await import('../playtest/hole-sketch.js');
 const data=JSON.parse(readFileSync(new URL('../playtest/course-art/quail-ridge-sanford-nc.json',import.meta.url)));
 const review=JSON.parse(readFileSync(new URL('../qa/course-factory/quail-osm-review.json',import.meta.url)));
 const course=founderCatalogRecords('Quail Ridge')[0];
 const tees=founderTeesForCourse(course);
 const black=tees.find(tee=>tee.providerTeeId==='black');
 const {holes}=founderVerifiedScorecard({course,tee:black});
 const results=auditFounderGeometry({records:data.features,holes,metadata:data.metadata,expectedRef:review.course_ref});
 assert.equal(data.metadata.osm_relation,review.boundary);
 assert.equal(data.metadata.source_sha256,review.sha256);
 assert.equal(results.pass,true);
 assert.equal(results.quality.mappedHoles,18);
 assert.equal(results.quality.fairwayHoles,18);
 assert.deepEqual(results.ratioErrors,[]);
 const fetcher=async url=>{
  assert.equal(url.pathname.endsWith('/course-art/quail-ridge-sanford-nc.json'),true);
  return {ok:true,json:async()=>data};
 };
 const seen=new Set();
 for(const hole of holes){
  const book=await loadHoleSketch({course,tee:black},hole.number,{fetcher});
  const ghost=await loadHoleSketch({course,tee:tees[0]},hole.number,{fetcher});
  assert.equal(book.coverage,'layout');
  assert.deepEqual(book,ghost);
  seen.add(JSON.stringify(book.annotations.route.path));
  const trace=placeGhostShots([{lie:'Holed'}],ghost.annotations.route);
  assert.ok(trace.start);
  assert.equal(trace.shots[0].y,ghost.annotations.route.green[1]/440);
 }
 assert.equal(seen.size,18);
 const number14=await loadHoleSketch({course,tee:black},14,{fetcher});
 assert.equal(number14.shapes.find(s=>s.type==='fairway').interiors.length,2);
});

test('Kings Grant original mapped shapes remain audit-only while holes 9 and 13 are unresolved',async()=>{
 const {founderCatalogRecords,founderTeesForCourse,founderVerifiedScorecard,founderMapRecord}=await import('../playtest/founders-verified-scorecards.js');
 const course=founderCatalogRecords('Kings Grant')[0],tee=founderTeesForCourse(course)[0];
 const {holes}=founderVerifiedScorecard({course,tee});
 const {features,metadata}=JSON.parse(readFileSync(new URL('../qa/course-factory/kings-grant-audit-only.json',import.meta.url)));
 const map=founderMapRecord(course);
 const audit=auditFounderGeometry({records:features,holes,metadata,expectedRef:map.ref});
 assert.equal(audit.pass,false);
 assert.equal(audit.quality.mappedHoles,17);
 assert.equal(audit.quality.checks[8].tee,false);
 assert.deepEqual(audit.ratioErrors,[13]);
 assert.equal(holes[12].yards,140);
 assert.ok(mappedRouteYards(features,13)>240);
 assert.equal(map.status,'source-review-blocked');
 assert.equal(map.file,undefined);
});

test('reviewed Tobacco Road geometry cannot ship before tee and fairway coverage passes',async()=>{
 const {founderCatalogRecords,founderTeesForCourse,founderVerifiedScorecard,founderMapRecord}=await import('../playtest/founders-verified-scorecards.js');
 const {loadHoleSketch}=await import('../playtest/hole-sketch.js');
 const course=founderCatalogRecords('Tobacco Road')[0];
 const tee=founderTeesForCourse(course).find(record=>record.providerTeeId==='ripper');
 const {holes}=founderVerifiedScorecard({course,tee});
 const {features,metadata}=JSON.parse(readFileSync(new URL('../qa/course-factory/tobacco-audit-only.json',import.meta.url)));
 const map=founderMapRecord(course);
 const audit=auditFounderGeometry({records:features,holes,metadata,expectedRef:map.ref});
 assert.equal(metadata.osm_way,'430227508');
 assert.equal(audit.pass,false);
 assert.deepEqual(audit.ratioErrors,[]);
 assert.equal(audit.quality.greenHoles,18);
 assert.equal(audit.quality.fairwayHoles,14);
 assert.deepEqual(audit.quality.checks.filter(hole=>!hole.tee).map(hole=>hole.number),[1,10]);
 assert.deepEqual(features.find(feature=>feature.properties.osm==='r19746375').properties.holes,[15,16]);
 assert.deepEqual(features.filter(feature=>feature.properties.layer==='water').map(feature=>feature.properties.holes),[[14]]);
 assert.equal(map.status,'source-review-blocked');
 let requests=0;
 const sketch=await loadHoleSketch({course,tee},14,{fetcher:async()=>{
  requests++;
  return {ok:true,json:async()=>({features,metadata})};
 }});
 assert.equal(sketch.coverage,'scorecard');
 assert.equal(requests,0);
});
