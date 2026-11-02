import test from 'node:test';
import assert from 'node:assert/strict';
import {scorecardToTripGames} from '../scorecard-trip-bridge.js';
import {createTrip} from '../trip-roster.js';
import {recordTripGame} from '../trip-game-record.js';
import {changeTripRoundStatus} from '../trip-round-status.js';
test('four golfers can finish skins and post one balanced Trip game',()=>{
 const players=['a','b','c','d'];
 const holes=Array.from({length:18},()=>[3,4,4,5]);
 const [game]=scorecardToTripGames({playerIds:players,holes,games:[{id:'skins',format:'skins',stakeCents:100}]});
 assert.equal(game.status,'completed');
 assert.deepEqual(game.netCents,{a:5400,b:-1800,c:-1800,d:-1800});
});
test('unfinished card must not produce trip payouts',()=>{
 const [game]=scorecardToTripGames({playerIds:['a','b'],holes:[[3,4]],games:[{id:'skins',format:'skins',stakeCents:100}]});
 assert.deepEqual(game,{id:'skins',status:'active'});
});
test('two games on one card post independently and settle with trip engine',()=>{
 const players=[{id:'a',name:'A'},{id:'b',name:'B'}];
 const draft=createTrip({tripId:'t',name:'Trip',players,rounds:[{id:'r',name:'Round',status:'draft',groups:[{id:'g',playerIds:['a','b']}]}]});
 let trip=changeTripRoundStatus(draft,'r','active').trip;
 const games=scorecardToTripGames({playerIds:['a','b'],holes:Array.from({length:18},()=>[4,5]),games:[{id:'skins',format:'skins',stakeCents:100},{id:'nassau',format:'nassau',stakeCents:500}]});
 for(const game of games)trip=recordTripGame(trip,'r',game).trip;
 const end=changeTripRoundStatus(trip,'r','completed');
 assert.equal(end.summary.provisional,false);
 assert.equal(end.summary.transfers[0].amountCents,3300);
});
test('no 4 player Nassau claims until real supported rules exist',()=>{
 assert.throws(()=>scorecardToTripGames({playerIds:['a','b','c','d'],holes:[],games:[{id:'n',format:'nassau',stakeCents:100}]}),/Only skins/);
});
