import test from 'node:test';
import assert from 'node:assert/strict';
import {founderCatalogRecords, founderTeesForCourse, founderVerifiedScorecard} from '../playtest/founders-verified-scorecards.js';

// Thursday tournament guard: never substitute a similarly named course or a
// fabricated yardage. Tests are intentionally read-only and source-independent.
for (const [query, id, region, expectedTees] of [
 ["King's Grant",'kings-grant-fayetteville-nc','Fayetteville, NC',['Black','Blue','White','Gold','Red','Forward']],
 ['Hyland','hyland-southern-pines-nc','Southern Pines, NC',['White','Gold','Red','Black','Blue']]
]) {
 test(`${query} resolves to the exact venue with all official tees`,()=>{
  const matches=founderCatalogRecords(query);
  const course=matches.find(c=>c.providerCourseId===id);
  assert.ok(course,`Missing ${id}`);
  assert.equal(course.region,region);
  const tees=founderTeesForCourse(course);
  assert.deepEqual(tees.map(t=>t.name).sort(),[...expectedTees].sort());
  for(const tee of tees){
   const card=founderVerifiedScorecard({course,tee});
   assert.ok(card,`No official card for ${id} ${tee.name}`);
  }
 });
}
test('unknown course and mismatched tee cannot inherit a founder scorecard',()=>{
 const course=founderCatalogRecords('Hyland').find(c=>c.providerCourseId==='hyland-southern-pines-nc');
 const tee=founderTeesForCourse(course)[0];
 assert.equal(founderVerifiedScorecard({course:{...course,region:'Somewhere Else'},tee}),null);
 assert.equal(founderVerifiedScorecard({course,tee:{...tee,totalYards:tee.totalYards+1}}),null);
});
