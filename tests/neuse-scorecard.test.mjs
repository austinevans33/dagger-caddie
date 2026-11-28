import assert from 'node:assert/strict';
import test from 'node:test';
import {founderCatalogRecords, founderTeesForCourse, founderVerifiedScorecard} from '../app/61f9e9de0a/founders-verified-scorecards.js';
import {loadHoleSketch} from '../app/61f9e9de0a/hole-sketch.js';

const [course] = founderCatalogRecords('Neuse Country Club');
const expected = {championship:6891,blue:6448,white:5953,silver:5481,'silver-forward':4743,forward:3931};

test('Neuse has six verified 18-hole tee rows and correct printed yardage sums', () => {
  assert(course);
  assert.equal(course.region,'Clayton, NC');
  const tees=founderTeesForCourse(course);
  assert.equal(tees.length,6);
  for(const tee of tees){
    const card=founderVerifiedScorecard({course,tee});
    assert.equal(card.state,'published-hole-scorecard');
    assert.deepEqual(card.holes.map(h=>h.number),Array.from({length:18},(_,i)=>i+1));
    assert.equal(card.holes.reduce((sum,h)=>sum+h.yards,0),expected[tee.providerTeeId]);
  }
  const forward=tees.find(t=>t.providerTeeId==='forward');
  const card=founderVerifiedScorecard({course,tee:forward});
  assert.equal(card.holes[7].par,4);
  assert.equal(card.holes.reduce((sum,h)=>sum+h.par,0),71);
  assert(card.holes.every(h=>h.handicapMen===undefined && h.handicapWomen===undefined));
});

test('Neuse keeps unverified geometry gated and falls back to scorecard on every hole',async()=>{
  const tee=founderTeesForCourse(course)[0];
  for(let hole=1;hole<=18;hole++){
    const sketch=await loadHoleSketch({course,tee},hole,{fetcher:async()=>assert.fail('unreviewed geometry fetched')});
    assert.equal(sketch.coverage,'scorecard');
    assert.equal(sketch.shapes.length,0);
  }
});
