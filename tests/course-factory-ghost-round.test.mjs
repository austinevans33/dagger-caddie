import test from 'node:test';
import assert from 'node:assert/strict';
import {buildGhostRound} from '../app/61f9e9de0a/house-ghost-round.js';
import {ghostShotPlayback} from '../app/61f9e9de0a/house-ghost-playback.js';
import {ghostLedgerSnapshot} from '../app/61f9e9de0a/house-ghost-ledger.js';
import {founderFactoryInventory,founderCatalogRecords,founderTeesForCourse,founderVerifiedScorecard} from '../app/61f9e9de0a/founders-verified-scorecards.js';

test('factory inventories all bundled scorecard courses without claiming blocked maps are ready',()=>{
 const rows=founderFactoryInventory();
 assert(rows.length>=10);
 assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
 for(const row of rows){
  assert(row.teeCount>0);
  assert([9,18].includes(row.holeCount));
  assert.equal(row.scorecardReady,true);
  assert.equal(row.ghostScorecardReady,true);
  assert.equal(row.mapFile===null,row.yardageBookStatus!=='bundled-reviewed-osm');
 }
});

test('Ghost uses a consistent 18-hole planned opponent across playback and Ledger',()=>{
 const [course]=founderCatalogRecords('Shining Rock');
 const tee=founderTeesForCourse(course)[0];
 const holes=founderVerifiedScorecard({course,tee}).holes;
 const matchHoles=holes.map(h=>({hole:h.number,par:h.par,ghost:h.par+(h.number%3===0?1:0)}));
 const round=buildGhostRound({courseName:course.name,holes,matchHoles,tier:'fiveTen'});
 assert.equal(round.length,18);
 for(let i=0;i<18;i++){
  assert.equal(round[i].score,matchHoles[i].ghost);
  assert.equal(round[i].shots.length,round[i].score);
  const playback=ghostShotPlayback({courseName:course.name,holes,matchHoles,tier:'fiveTen',holeNumber:i+1,shotsRevealed:100});
  assert.equal(playback.score,round[i].score);
  assert.equal(playback.complete,true);
 }
 const ledger=ghostLedgerSnapshot({courseName:course.name,holes,matchHoles,tier:'fiveTen',playerScores:holes.map(h=>h.par)});
 assert.deepEqual(ledger.round.map(h=>h.score),round.map(h=>h.score));
 assert.equal(ledger.holesPlayed,18);
 assert.equal(ledger.matchStatus,'golfer-wins');
});

test('Ghost rejects conflicting or malformed planned scores without mutating scoring state',()=>{
 assert.throws(()=>buildGhostRound({matchHoles:[{hole:1,par:4,ghost:4},{hole:1,par:4,ghost:5}]}),/duplicate/);
 assert.throws(()=>buildGhostRound({matchHoles:[{hole:2,par:4,ghost:0}]}),/Invalid Ghost match score/);
 assert.throws(()=>buildGhostRound({matchHole:{hole:1,par:4,ghost:4},matchHoles:[{hole:1,par:4,ghost:5}]}),/Conflicting/);
});
