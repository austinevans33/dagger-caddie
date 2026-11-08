import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditFounderGeometry} from '../playtest/founder-geometry-audit.js';
import {saveActiveRound} from '../playtest/starters-desk-session.js';
import {startSoloCard,setSoloHole,setSoloLength,saveSoloScore} from '../playtest/solo-scorecard.js';
import {FOUNDERS_READY_COUNT,founderCatalogRecords,founderTeesForCourse,founderVerifiedScorecard,founderMapRecord} from '../playtest/founders-verified-scorecards.js';
const find=(term)=>founderCatalogRecords(term)[0];
test('Sassamon uses nine real holes and the licensed mapped par-three exception',()=>{
 const course=find('Sassamon'),tees=founderTeesForCourse(course),tee=tees[0],selection={course,tee,holeNumber:1};
 const {holes}=founderVerifiedScorecard(selection);
 assert.equal(course.holeCount,9);
 assert.deepEqual(tees.map(tee=>tee.totalYards),[2383,2167,2011,1744]);
 assert.deepEqual(holes.map(hole=>hole.par),[3,4,3,5,3,4,3,3,4]);
 const map=founderMapRecord(course);
 const {features,metadata}=JSON.parse(readFileSync(new URL('../playtest/course-art/'+map.file,import.meta.url)));
 const input={records:features,metadata,holes,expectedRef:map.ref};
 const audit=auditFounderGeometry({...input,holeCount:9});
 assert.equal(audit.pass,true);
 assert.equal(audit.quality.mappedHoles,9);
 assert.deepEqual(audit.quality.checks.filter(hole=>!hole.fairway).map(hole=>hole.number),[3]);
 assert.equal(auditFounderGeometry(input).pass,false);
 assert.equal(auditFounderGeometry({...input,holeCount:9,holes:holes.map(hole=>hole.number===3?{...hole,par:4}:hole)}).pass,false);
 const data=new Map();
 const storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
 assert.equal(saveActiveRound(storage,{...selection,holeNumber:10}),false);
 assert.equal(saveActiveRound(storage,selection,10),true);
 assert.equal(startSoloCard(storage).length,9);
 assert.equal(setSoloLength(storage,18),null);
 assert.equal(setSoloHole(storage,10),null);
 assert.equal(setSoloHole(storage,9).hole,9);
 assert.equal(saveSoloScore(storage,4).hole,9);
 assert.equal(startSoloCard(storage).scores[8],4);
});
test('both founders are exact North Carolina courses, not a same-name out-of-state club',()=>{
 const k=find('King');const q=find('Quail Ridge');
 assert.equal(k.region,'Fayetteville, NC');assert.equal(q.region,'Sanford, NC');
 assert.equal(FOUNDERS_READY_COUNT,13);
 assert.equal(founderCatalogRecords('Michigan').length,0);
 assert.equal(founderTeesForCourse({...q,region:'Ada, Michigan'}).length,0);
 assert.equal(founderVerifiedScorecard({course:{...q,name:'Quail Ridge Michigan'},tee:{providerTeeId:'white',name:'White',totalYards:6120}}),null);
});
test('Kings Grant has 18 verified official-par holes from every one of six tees',()=>{
 const course=find('kings grant'),tees=founderTeesForCourse(course);
 assert.equal(tees.length,6);
 for(const tee of tees){
  const card=founderVerifiedScorecard({course,tee});
  assert.equal(card.holes.length,18);assert.equal(card.holes.reduce((n,h)=>n+h.par,0),71);
  assert.equal(card.holes.reduce((n,h)=>n+h.yards,0),tee.totalYards);
  assert.equal(new Set(card.holes.map(h=>h.handicapMen)).size,18);
  assert.equal(card.livePinDistance,false);
 }
 const white=tees.find(x=>x.providerTeeId==='white');
 assert.equal(white.totalYards,5352);
 assert.equal(founderVerifiedScorecard({course,tee:white}).holes[0].yards,346);
});
test('Sanford Quail Ridge preserves the exact hole values and does not fabricate Blue tee yardages',()=>{
 const course=find('Quail Ridge'),tees=founderTeesForCourse(course);
 assert.deepEqual(tees.map(x=>x.providerTeeId),['white','gold','red','black']);
 for(const tee of tees){
  const card=founderVerifiedScorecard({course,tee});
  assert.equal(card.holes.length,18);assert.equal(card.holes.reduce((n,h)=>n+h.par,0),72);
  assert.equal(card.holes.reduce((n,h)=>n+h.yards,0),tee.totalYards);
 }
 assert.equal(tees.find(t=>t.providerTeeId==='white').totalYards,6120);
 assert.equal(tees.find(t=>t.providerTeeId==='gold').totalYards,5369);
 assert.equal(tees.find(t=>t.providerTeeId==='red').totalYards,4342);
 assert.match(founderVerifiedScorecard({course,tee:tees[0]}).provenance.audit,/disagree/);
 const black=founderVerifiedScorecard({course,tee:tees.at(-1)});
 assert.equal(black.selection.tee.totalYards,6783);
 assert.deepEqual(black.holes[13],{number:14,par:5,yards:496,handicapMen:4,hazards:[]});
 assert.match(black.provenance.rating,/CourseID=271/);
});
test('wrong tee totals, tee labels and non-Founder provider IDs cannot use a card',()=>{
 const c=find('King'),tee=founderTeesForCourse(c)[0];
 for(const bad of [{...tee,totalYards:tee.totalYards+5},{...tee,name:'White'}]){
  assert.equal(founderVerifiedScorecard({course:c,tee:bad}),null);
 }
 assert.equal(founderVerifiedScorecard({course:{...c,provider:'opengolfapi'},tee}),null);
 assert.equal(founderMapRecord({...c,providerCourseId:'wrong'}),null);
});

test('Ryder and Tobacco Road have full and correct published tee-by-tee hole cards',()=>{
 const expected=[
  {query:'Ryder',region:'Fort Bragg, NC',totals:{blue:6402,white:6114,red:5338},par:72},
  {query:'Tobacco Road',region:'Sanford, NC',totals:{ripper:6557,disc:6317,plow:5886,points:5302,cultivator:4296},par:71},
  {query:'Hyland',region:'Southern Pines, NC',totals:{white:6273,gold:5875,red:4784,black:6934,blue:6700},par:72}
 ];
 for(const courseInfo of expected){
  const course=founderCatalogRecords(courseInfo.query)[0];assert.equal(course.region,courseInfo.region);
  const tees=founderTeesForCourse(course);
  assert.deepEqual(Object.fromEntries(tees.map(t=>[t.providerTeeId,t.totalYards])),courseInfo.totals);
  for(const tee of tees){
   const card=founderVerifiedScorecard({course,tee});
   assert.equal(card.holes.length,18);
   assert.equal(card.holes.reduce((n,h)=>n+h.par,0),courseInfo.par);
   assert.equal(card.holes.reduce((n,h)=>n+h.yards,0),tee.totalYards);
  }
 }
});
test('Ryder does not invent unavailable hole stroke indices or mapped outlines',()=>{
 const course=founderCatalogRecords('Ryder')[0],tee=founderTeesForCourse(course)[0];
 const card=founderVerifiedScorecard({course,tee});
 assert.equal(card.holes.every(h=>!Object.hasOwn(h,'handicapMen')),true);
 assert.equal(founderMapRecord(course).status,'outline-only');
});
test('Hyland Blue and Black use the current club card',()=>{
 const course=find('Hyland');
 for(const [id,firstHole] of [['black',393],['blue',391]]){
  const tee=founderTeesForCourse(course).find(t=>t.providerTeeId===id);
  const card=founderVerifiedScorecard({course,tee});
  assert.equal(card.holes[0].yards,firstHole);
  assert.match(card.provenance.url,/hylandgolfclub\.com/);
 }
});

test('Pelican Pointe builds three distinct 18-hole cards from the correct nine-hole loops',()=>{
 const courses=founderCatalogRecords('Pelican Pointe');
 assert.equal(courses.length,3);
 const expected=[
  {id:'meadows-preserve',totals:[7192,6614,6022,5572,4939],starts:[307,329]},
  {id:'preserve-hatchett',totals:[7009,6477,5918,5326,4756],starts:[329,301]},
  {id:'hatchett-meadows',totals:[7049,6521,6036,5384,5075],starts:[301,307]}
 ];
 for(const [i,course] of courses.entries()){
  const {id,totals,starts}=expected[i];
  assert.equal(course.providerCourseId,'pelican-pointe-'+id+'-venice-fl');
  const tees=founderTeesForCourse(course);
  assert.deepEqual(tees.map(t=>t.totalYards),totals);
  for(const tee of tees){
   const card=founderVerifiedScorecard({course,tee});
   assert.equal(card.holes.length,18);
   assert.equal(card.holes.reduce((total,hole)=>total+hole.par,0),72);
   assert.ok(card.holes.every(hole=>!Object.hasOwn(hole,'handicapMen')));
   if(tee.providerTeeId==='white') assert.deepEqual([card.holes[0].yards,card.holes[9].yards],starts);
  }
  assert.equal(founderMapRecord(course).status,'source-review-blocked');
  assert.equal(founderMapRecord(course).file,undefined);
 }
 const tee=founderTeesForCourse(courses[0])[0];
 assert.equal(founderVerifiedScorecard({course:courses[1],tee}),null);
});

test('Pinehurst No. 3 official tee cards sum correctly to par 68',()=>{
 const course=founderCatalogRecords('Pinehurst No. 3')[0];
 assert.equal(course.region,'Pinehurst, NC');
 const expected={white:5155,green:4823,red:4347,yellow:3642};
 const tees=founderTeesForCourse(course);
 assert.deepEqual(Object.fromEntries(tees.map(t=>[t.providerTeeId,t.totalYards])),expected);
 for(const tee of tees){const card=founderVerifiedScorecard({course,tee});assert.equal(card.holes.length,18);
  assert.equal(card.holes.reduce((n,h)=>n+h.par,0),68);
  assert.equal(card.holes.reduce((n,h)=>n+h.yards,0),tee.totalYards);
  assert.equal(new Set(card.holes.map(h=>h.handicapMen)).size,18);
 }
 const red=founderVerifiedScorecard({course,tee:tees.find(t=>t.providerTeeId==='red')});
 assert.equal(red.holes[0].handicapMen,13);
});
test('Ocean Course uses the exact Kiawah course, never an unrelated Ocean Course',()=>{
 const course=founderCatalogRecords('Ocean Course')[0];
 assert.equal(course.region,'Kiawah Island, SC');
 const expected={black:7385,gold:6793,silver:6356,red:5226,dye:6475,kiawah:6202};
 const tees=founderTeesForCourse(course);
 assert.deepEqual(Object.fromEntries(tees.map(t=>[t.providerTeeId,t.totalYards])),expected);
 for(const tee of tees){const card=founderVerifiedScorecard({course,tee});assert.equal(card.holes.length,18);
  assert.equal(card.holes.reduce((n,h)=>n+h.par,0),72);
  assert.equal(card.holes.reduce((n,h)=>n+h.yards,0),tee.totalYards);
 }
 assert.ok(!tees.some(t=>t.providerTeeId==='carolina'));
 const altered={...course,region:'Some other Ocean Course'};
 assert.equal(founderTeesForCourse(altered).length,0);
});

test('Winder, Georgia Chimneys and Pine Hills both have complete validated 18-hole tee cards',()=>{
 const cases=[
  ['Chimneys','The Chimneys Golf Course',{gold:6384,blue:6016,white:5662,green:5182}],
  ['Pine Hills','Pine Hills Golf Club',{blue:6423,white:6181,red:4982}]
 ];
 for(const [search,name,totals] of cases){
  const course=founderCatalogRecords(search)[0];
  assert.equal(course.name,name);assert.equal(course.region,'Winder, GA');
  const tees=founderTeesForCourse(course);
  assert.deepEqual(Object.fromEntries(tees.map(t=>[t.providerTeeId,t.totalYards])),totals);
  for(const tee of tees){
   const card=founderVerifiedScorecard({course,tee});
   assert.equal(card.holes.length,18);
   assert.equal(card.holes.reduce((n,h)=>n+h.yards,0),tee.totalYards);
  }
 }
});
test('Pine Hills Red has published par 73 rather than fabricating a par 72 card',()=>{
 const course=founderCatalogRecords('Pine Hills')[0],tees=founderTeesForCourse(course);
 for(const tee of tees){
  const card=founderVerifiedScorecard({course,tee});
  assert.equal(card.holes.reduce((n,h)=>n+h.par,0),tee.providerTeeId==='red'?73:72);
  assert.equal(card.holes[17].par,tee.providerTeeId==='red'?5:4);
 }
});
