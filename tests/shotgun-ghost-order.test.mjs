import test from 'node:test';
import assert from 'node:assert/strict';
import {roundHoleOrder,orderedRoundScores} from '../app/61f9e9de0a/round-hole-order.js';
import {ghostLedgerSnapshot} from '../app/61f9e9de0a/house-ghost-ledger.js';

test('shotgun and back-nine starts rotate physical hole order exactly once',()=>{
 assert.deepEqual(roundHoleOrder({startHole:10}),[10,11,12,13,14,15,16,17,18,1,2,3,4,5,6,7,8,9]);
 assert.deepEqual(roundHoleOrder({startHole:17}),[17,18,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]);
 assert.deepEqual(roundHoleOrder({count:9,startHole:7}),[7,8,9,1,2,3,4,5,6]);
 assert.throws(()=>roundHoleOrder({startHole:19}),/Invalid starting hole/);
 assert.throws(()=>roundHoleOrder({count:9,startHole:10}),/Invalid starting hole/);
});

test('Ghost Ledger starts on 10 and counts consecutive scores in play order',()=>{
 const scores=Array(18).fill(null);
 scores[9]=4;scores[10]=5;
 const snapshot=ghostLedgerSnapshot({startHole:10,playerScores:scores,seed:'shotgun'});
 assert.equal(snapshot.holesPlayed,2);
 assert.equal(snapshot.ledger[0].holeNumber,10);
 assert.equal(snapshot.ledger[1].holeNumber,11);
 assert.equal(snapshot.ledger[2].holeNumber,12);
 assert.equal(snapshot.ledger[2].result,'pending');
 assert.equal(snapshot.matchStatus,'active');
 assert.equal(snapshot.ledger[9].holeNumber,1);
});

test('out-of-order scores never prematurely settle a Ghost match',()=>{
 const scores=Array(18).fill(null);scores[0]=4;scores[16]=4;
 const snapshot=ghostLedgerSnapshot({startHole:17,playerScores:scores});
 assert.equal(snapshot.holesPlayed,1);
 assert.equal(snapshot.matchStatus,'incomplete');
 assert.equal(snapshot.ledger[0].holeNumber,17);
 assert.equal(snapshot.ledger[2].holeNumber,1);
 assert.equal(snapshot.ledger[2].result,'pending');
 assert.deepEqual(orderedRoundScores(scores,{startHole:17}).slice(0,3),[4,null,4]);
});
