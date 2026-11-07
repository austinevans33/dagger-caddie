import test from 'node:test';
import assert from 'node:assert/strict';
import {formatRoundScorePulse} from '../playtest/round-score-pulse.js';
test('No active round is explicitly blank and never claims scores',()=>{
 assert.deepEqual(formatRoundScorePulse(null),{ready:false,progress:'NO ACTIVE SCORECARD',summary:'Choose a course and tee at the Starter’s Desk to begin a round.',recent:'',complete:false});
});
test('Score pulse shows latest actual scored holes and no wagering authority',()=>{
 const scores=Array(18).fill(null);scores[0]=5;scores[3]=4;scores[8]=3;scores[17]=4;
 const view=formatRoundScorePulse({courseName:'Bayonet at Puppy Creek',teeName:'Blue',completedCount:4,completedHoles:[1,4,9,18],totalStrokes:16,scores,complete:false});
 assert.equal(view.progress,'4/18 HOLES SCORED');
 assert.match(view.summary,/Bayonet at Puppy Creek · Blue · 16 recorded strokes/);
 assert.equal(view.recent,'H4: 4 · H9: 3 · H18: 4');
 assert.equal(view.complete,false);
});
