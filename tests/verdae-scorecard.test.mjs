import assert from 'node:assert/strict';
import test from 'node:test';
import {founderCatalogRecords, founderTeesForCourse, founderVerifiedScorecard} from '../app/61f9e9de0a/founders-verified-scorecards.js';
import {loadHoleSketch} from '../app/61f9e9de0a/hole-sketch.js';
import {searchOpenGolfCourses} from '../app/61f9e9de0a/opengolf-catalog.js';

const [course] = founderCatalogRecords('Preserve at Verdae');
const tees = founderTeesForCourse(course);
const official = [
  ['black', 3654, 3450, 7104, 360, 515],
  ['blue', 3428, 3326, 6754, 355, 499],
  ['white', 3162, 3064, 6226, 305, 475],
  ['gold', 2727, 2767, 5494, 302, 442],
  ['red', 2541, 2481, 5022, 274, 376],
];
const pars = [4,3,4,4,5,3,4,4,5,4,3,4,4,5,3,4,4,5];
const strokeIndexes = [15,17,1,3,9,11,5,7,13,4,10,14,2,8,18,16,6,12];
const yards = holes => holes.reduce((sum,hole)=>sum+hole.yards,0);

test('Verdae uses the official five tee rows, printed pars and single stroke-index row', () => {
  assert.equal(course.region,'Greenville, SC');
  const actual = tees.map(tee => {
    const card = founderVerifiedScorecard({course,tee});
    const {holes} = card;
    assert.equal(card.state,'published-hole-scorecard');
    assert.equal(card.livePinDistance,false);
    assert.deepEqual(holes.map(hole=>hole.number),Array.from({length:18},(_,i)=>i+1));
    assert.deepEqual(holes.map(hole=>hole.par),pars);
    assert.deepEqual(holes.map(hole=>hole.handicapMen),strokeIndexes);
    assert(holes.every(hole=>hole.handicapWomen===undefined));
    return [tee.providerTeeId,yards(holes.slice(0,9)),yards(holes.slice(9)),tee.totalYards,holes[0].yards,holes[17].yards];
  });
  assert.deepEqual(actual,official);
});

test('Verdae prefers its verified identity over the conflicting Greenville provider card', async () => {
  const found = await searchOpenGolfCourses('Verdae',{fetcher:async()=>({
    ok:true,
    json:async()=>({courses:[{id:'old-verdae',course_name:'The Preserve At Verdae',city:'Greenville',state:'SC'}]})
  })});
  assert.deepEqual(found,[course]);
});

test('Verdae uses the scorecard fallback on every hole without fetching unreviewed geometry', async () => {
  for(let hole=1;hole<=18;hole++){
    const sketch = await loadHoleSketch({course,tee:tees[0]},hole,{
      fetcher:async()=>assert.fail('Unreviewed provider geometry requested')
    });
    assert.equal(sketch.coverage,'scorecard');
    assert.equal(sketch.shapes.length,0);
  }
});
