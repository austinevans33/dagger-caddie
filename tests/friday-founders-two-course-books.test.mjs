import test from 'node:test';
import assert from 'node:assert/strict';
import {FOUNDERS_READY_COUNT,founderCatalogRecords,founderTeesForCourse,founderVerifiedScorecard,founderMapRecord} from '../playtest/founders-verified-scorecards.js';
const find=(term)=>founderCatalogRecords(term)[0];
test('both founders are exact North Carolina courses, not a same-name out-of-state club',()=>{
 const k=find('King');const q=find('Quail Ridge');
 assert.equal(k.region,'Fayetteville, NC');assert.equal(q.region,'Sanford, NC');
 assert.equal(FOUNDERS_READY_COUNT,12);
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
 assert.deepEqual(tees.map(x=>x.providerTeeId),['white','gold','red']);
 for(const tee of tees){
  const card=founderVerifiedScorecard({course,tee});
  assert.equal(card.holes.length,18);assert.equal(card.holes.reduce((n,h)=>n+h.par,0),72);
  assert.equal(card.holes.reduce((n,h)=>n+h.yards,0),tee.totalYards);
 }
 assert.equal(tees.find(t=>t.providerTeeId==='white').totalYards,6120);
 assert.equal(tees.find(t=>t.providerTeeId==='gold').totalYards,5369);
 assert.equal(tees.find(t=>t.providerTeeId==='red').totalYards,4342);
 assert.match(founderVerifiedScorecard({course,tee:tees[0]}).provenance.audit,/disagree/);
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
  {query:'Hyland',region:'Southern Pines, NC',totals:{white:6273,gold:5875,red:4784},par:72}
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
test('Hyland withholds inconsistent Blue/Black tee cards rather than invent corrected yards',()=>{
 const course=founderCatalogRecords('Hyland')[0];
 assert.deepEqual(founderTeesForCourse(course).map(t=>t.providerTeeId),['white','gold','red']);
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

test('Pelican Pointe offers three genuinely different loop combinations, not a fabricated universal back nine',()=>{
 const routes=founderCatalogRecords('Pelican Pointe');
 assert.equal(routes.length,3);
 assert.equal(new Set(routes.map(x=>x.providerCourseId)).size,3);
 assert.deepEqual(routes.map(x=>x.name),[
  'Pelican Pointe · Meadows / Preserve',
  'Pelican Pointe · Preserve / Hatchett Creek',
  'Pelican Pointe · Hatchett Creek / Meadows'
 ]);
 const expected={blue:[6614,6477,6542],white:[6052,5904,6080]};
 for(let i=0;i<routes.length;i++){
  const tees=founderTeesForCourse(routes[i]);
  assert.deepEqual(tees.map(t=>t.providerTeeId),['blue','white']);
  for(const tee of tees){
   const card=founderVerifiedScorecard({course:routes[i],tee});
   assert.equal(card.holes.length,18);
   assert.equal(card.holes.reduce((n,h)=>n+h.par,0),72);
   assert.equal(card.holes.reduce((n,h)=>n+h.yards,0),tee.totalYards);
   assert.equal(tee.totalYards,expected[tee.providerTeeId][i]);
   assert.equal(new Set(card.holes.map(h=>h.handicapMen)).size,18);
  }
 }
});
test('Pelican routes cannot silently reuse another loop pairs scorecard',()=>{
 const [meadows,preserve]=founderCatalogRecords('Pelican Pointe');
 const tee=founderTeesForCourse(meadows)[0];
 assert.equal(founderVerifiedScorecard({course:preserve,tee}),null);
 assert.equal(founderVerifiedScorecard({course:{...meadows,name:'Pelican Pointe'},tee}),null);
});
