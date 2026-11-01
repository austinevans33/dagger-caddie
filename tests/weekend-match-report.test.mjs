import test from 'node:test';
import assert from 'node:assert/strict';
import {weekendMatchReport} from '../weekend-match-report.js';
const games=[{id:'skins',format:'skins',stakeCents:100},{id:'nassau',format:'nassau',stakeCents:500}];
test('two-buddy full match summarizes both games once',()=>{
 const r=weekendMatchReport({names:['A','B'],holes:Array.from({length:18},()=>[4,5]),games});
 assert.equal(r.status,'FINAL');assert.deepEqual(r.balances,[3300,-3300]);
 assert.equal(r.games.length,2);assert.match(r.headline,/bragging rights/);
});
test('incomplete round is in play, never final',()=>{
 const r=weekendMatchReport({names:['A','B'],holes:[[4,5]],games});
 assert.equal(r.status,'IN PLAY');assert.equal(r.canSettle,false);
});
test('equal scores produce no fictional winner',()=>{
 const r=weekendMatchReport({names:['A','B'],holes:Array.from({length:18},()=>[4,4]),games});
 assert.match(r.headline,/level/);assert.deepEqual(r.balances,[0,0]);
});
