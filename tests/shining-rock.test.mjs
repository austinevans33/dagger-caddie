import test from 'node:test';
import assert from 'node:assert/strict';
import {founderCatalogRecords,founderTeesForCourse,founderVerifiedScorecard} from '../app/61f9e9de0a/founders-verified-scorecards.js';
import {loadHoleSketch} from '../app/61f9e9de0a/hole-sketch.js';
import {saveActiveRound} from '../app/61f9e9de0a/starters-desk-session.js';
import {readCourseScorecard} from '../app/61f9e9de0a/active-course-context.js';
import {startSoloCard,saveSoloScore,setSoloHole,readSoloCard} from '../app/61f9e9de0a/solo-scorecard.js';
import {ghostShotPlayback} from '../app/61f9e9de0a/house-ghost-playback.js';

const [course]=founderCatalogRecords('Shining Rock');
const tees=founderTeesForCourse(course);
const sum=values=>values.reduce((a,b)=>a+b,0);

test('The Rock official tee cards match both nines, totals and Red number 4',()=>{
 assert.equal(course.providerCourseId,'shining-rock-northbridge-ma');
 assert.deepEqual(founderCatalogRecords('Shinning Rock'),[course]);
 assert.deepEqual(founderCatalogRecords('Shining Rock Acorn'),[]);
 const official=[
  ['gold',3330,3398,6728,72,343,11],
  ['blue',3202,3269,6471,72,328,11],
  ['green',3023,3173,6196,72,282,11],
  ['white',2915,3089,6004,72,282,11],
  ['red',2507,2814,5321,72,275,5],
  ['red-par-3',2340,2814,5154,71,108,5],
 ];
 const normalized=tees.map(tee=>{
  const {holes}=founderVerifiedScorecard({course,tee});
  assert.deepEqual(holes.map(h=>h.number),Array.from({length:18},(_,i)=>i+1));
  assert.deepEqual([...holes.map(h=>h.handicapMen)].sort((a,b)=>a-b),Array.from({length:18},(_,i)=>i+1));
  return [tee.providerTeeId,sum(holes.slice(0,9).map(h=>h.yards)),sum(holes.slice(9).map(h=>h.yards)),
   tee.totalYards,sum(holes.map(h=>h.par)),holes[3].yards,holes[3].handicapMen];
 });
 assert.deepEqual(normalized,official);
});

test('Shining Rock full scoring survives reload and corrections while Ghost reads official par',async()=>{
 const tee=tees.find(t=>t.providerTeeId==='red-par-3');
 const selection={course,tee,holeNumber:1};
 const entries=new Map();
 const storage={getItem:k=>entries.get(k)??null,setItem:(k,v)=>entries.set(k,v)};
 assert(saveActiveRound(storage,selection,1));
 const {holes}=readCourseScorecard(storage,selection);
 assert.equal(holes[3].par,3);
 assert(startSoloCard(storage));
 for(const hole of holes){
  assert(saveSoloScore(storage,hole.par));
  const ghost=ghostShotPlayback({holeNumber:hole.number,holes,shotsRevealed:100});
  assert.equal(ghost.par,hole.par);
  assert(ghost.complete);
  assert.equal((await loadHoleSketch(selection,hole.number,{
   fetcher:()=>assert.fail('unverified geometry must stay offline')
  })).coverage,'scorecard');
 }
 assert.equal(sum(readSoloCard(storage).scores),71);
 setSoloHole(storage,4);
 saveSoloScore(storage,4);
 assert.equal(readSoloCard(storage).scores[3],4);
 assert.equal(readSoloCard(storage).hole,5);
});
