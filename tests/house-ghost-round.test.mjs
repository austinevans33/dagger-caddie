import test from 'node:test';
import assert from 'node:assert/strict';
import {buildGhostRound} from '../house-ghost-round.js';
test('all 18 Ghost trails work with unverified course coverage but remain schematic',()=>{
 const round=buildGhostRound({courseName:'Bayonet at Puppy Creek'});
 assert.equal(round.length,18);
 assert(round.every((h,i)=>h.holeNumber===i+1&&h.coverage==='schematic-fallback'&&h.shots.length===h.score&&h.schematicOnly));
});
test('verified scorecard details apply to corresponding hole only',()=>{
 const round=buildGhostRound({holes:[{number:1,par:3,yards:165}]});
 assert.equal(round[0].par,3);assert.equal(round[0].courseParVerified,true);
 assert.equal(round[1].courseParVerified,false);
});
test('repeatable round and 9-hole play',()=>{const a=buildGhostRound({count:9,seed:'a'});assert.equal(a.length,9);assert.deepEqual(a,buildGhostRound({count:9,seed:'a'}));});
