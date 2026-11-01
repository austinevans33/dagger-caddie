import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrip} from '../trip-roster.js';
import {correctTripGame} from '../trip-game-correction.js';
const players=[{id:'a',name:'A'},{id:'b',name:'B'}];
const original={id:'skins',status:'completed',netCents:{a:500,b:-500}};
const trip=()=>createTrip({tripId:'trip',name:'Weekend',players,rounds:[{id:'fri',name:'Friday',status:'completed',groups:[{id:'one',playerIds:['a','b']}],games:[original]}]});
test('correction replaces original payout rather than counting twice',()=>{
 const result=correctTripGame(trip(),'fri',original,{id:'skins',status:'completed',netCents:{a:200,b:-200}});
 assert.equal(result.trip.rounds[0].games.length,1);
 assert.deepEqual(result.summary.transfers,[{from:'b',to:'a',amountCents:200}]);
 assert.equal(trip().rounds[0].games[0].netCents.a,500);
});
test('stale correction rejected',()=>{
 assert.throws(()=>correctTripGame(trip(),'fri',{...original,netCents:{a:100,b:-100}},original),/changed since last read/);
});
test('no change of game identity, invalid payout, or silent unfinish',()=>{
 assert.throws(()=>correctTripGame(trip(),'fri',original,{id:'nassau',status:'completed',netCents:{a:500,b:-500}}),/identity/);
 assert.throws(()=>correctTripGame(trip(),'fri',original,{id:'skins',status:'completed',netCents:{a:200,b:0}}),/ledger/);
 assert.throws(()=>correctTripGame(trip(),'fri',original,{id:'skins',status:'active'}),/Reopen round/);
});
