import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrip} from '../trip-roster.js';
import {reconcileTripScorecard} from '../trip-scorecard-reconcile.js';
import {summarizeTrip} from '../trip-settlement.js';
const players=[{id:'a',name:'A'},{id:'b',name:'B'}];
const base=()=>createTrip({tripId:'t',name:'Trip',players,rounds:[{id:'r',name:'Round',status:'active',groups:[{id:'g',playerIds:['a','b']}]}]});
const games=[{id:'skins',format:'skins',stakeCents:100},{id:'hole',format:'hole',stakeCents:50}];
const card=holes=>({playerIds:['a','b'],holes,games});
test('same card reconciles idempotently, no duplicate games',()=>{
 const holes=Array.from({length:18},()=>[4,5]);
 const first=reconcileTripScorecard(base(),'r',card(holes));
 const again=reconcileTripScorecard(first,'r',card(holes));
 assert.deepEqual(again,first);
 assert.equal(first.rounds[0].games.length,2);
 assert.equal(summarizeTrip(first).provisional,true);
});
test('score correction replaces previous outcomes, not doubles payouts',()=>{
 const holes=Array.from({length:18},()=>[4,5]);
 const first=reconcileTripScorecard(base(),'r',card(holes));
 const revised=reconcileTripScorecard(first,'r',card([[5,4],...holes.slice(1)]));
 assert.equal(revised.rounds[0].games.length,2);
 assert.equal(revised.rounds[0].games.find(g=>g.id==='hole').netCents.a,800);
 assert.equal(first.rounds[0].games.find(g=>g.id==='hole').netCents.a,900);
});
test('incomplete scorecard cannot silently settle',()=>{
 const result=reconcileTripScorecard(base(),'r',card([[4,5]]));
 assert(result.rounds[0].games.every(g=>g.status==='active'));
});
