import test from 'node:test';
import assert from 'node:assert/strict';
import {buildGhostRound} from '../house-ghost-round.js';
import {ghostShotPlayback} from '../house-ghost-playback.js';

const settings={count:18,seed:'bayonet-sample',courseName:'Bayonet at Puppy Creek',holes:Array.from({length:18},(_,i)=>({number:i+1,par:4,yards:390}))};
test('House Ghost selected difficulty changes repeatable shot-by-shot scores',()=>{
 const scores={};
 for(const tier of ['scratch','fiveTen','tenFifteen','fifteenTwenty']){
  const round=buildGhostRound({...settings,tier});
  const again=buildGhostRound({...settings,tier});
  assert.deepEqual(round,again,'playback reproducibility for '+tier);
  assert.equal(round.length,18);
  assert.ok(round.every(h=>h.shots.length===h.score));
  scores[tier]=round.reduce((total,h)=>total+h.score,0);
 }
 assert.ok(scores.scratch<scores.tenFifteen);
 assert.ok(scores.tenFifteen<scores.fifteenTwenty);
});
test('Ghost cinematic preview preserves chosen tier across advances and rewinds',()=>{
 const common={...settings,holeNumber:2,tier:'tenFifteen'};
 const start=ghostShotPlayback({...common,shotsRevealed:0});
 const two=ghostShotPlayback({...common,shotsRevealed:2});
 assert.equal(start.visibleShots.length,0);
 assert.equal(two.visibleShots.length,2);
 assert.deepEqual(two.visibleShots,ghostShotPlayback({...common,shotsRevealed:2}).visibleShots);
 assert.equal(two.score,start.score);
 assert.equal(two.schematicOnly,true);
});
