import test from 'node:test';
import assert from 'node:assert/strict';
import {FOUNDERS_READY_COUNT,founderCatalogRecords,founderTeesForCourse,founderVerifiedScorecard,founderMapRecord} from '../playtest/founders-verified-scorecards.js';
const find=(term)=>founderCatalogRecords(term)[0];
test('both founders are exact North Carolina courses, not a same-name out-of-state club',()=>{
 const k=find('King');const q=find('Quail Ridge');
 assert.equal(k.region,'Fayetteville, NC');assert.equal(q.region,'Sanford, NC');
 assert.equal(FOUNDERS_READY_COUNT,2);
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
