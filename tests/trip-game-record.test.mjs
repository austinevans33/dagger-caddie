import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrip,addTripRound} from '../trip-roster.js';
import {recordTripGame} from '../trip-game-record.js';
const golfers=[{id:'a',name:'Austin'},{id:'b',name:'Buddy'}];
const base=()=>addTripRound(createTrip({tripId:'trip1',name:'Weekend',players:golfers}),{id:'r1',name:'Round one',status:'active',groups:[{id:'group',playerIds:['a','b']}]});
test('pending games do not become final trip liabilities',()=>{
 const x=recordTripGame(base(),'r1',{id:'room1',status:'active'});
 assert.equal(x.summary.pendingGames,1);
 assert.deepEqual(x.summary.transfers,[]);
});
test('duplicate Money Room import cannot double count payouts',()=>{
 const t=base();const game={id:'room1',status:'completed',netCents:{a:500,b:-500}};
 const x=recordTripGame(t,'r1',game);
 assert.throws(()=>recordTripGame(x.trip,'r1',game),/already recorded/);
 assert.equal(x.trip.rounds[0].games.length,1);
 assert.deepEqual(x.summary.transfers,[]); // round remains active, not final
});
test('complete round with finalized game creates net trip settlement',()=>{
 const round={...base().rounds[0],status:'completed'};
 const trip=createTrip({tripId:'trip1',name:'Weekend',players:golfers,rounds:[round]});
 const x=recordTripGame(trip,'r1',{id:'room1',status:'completed',netCents:{a:500,b:-500}});
 assert.deepEqual(x.summary.transfers,[{from:'b',to:'a',amountCents:500}]);
});
test('unknown and draft rounds cannot accept wager results',()=>{
 const t=base();
 assert.throws(()=>recordTripGame(t,'missing',{id:'x',status:'active'}),/Unknown/);
 const draft=createTrip({tripId:'t',name:'Trip',players:golfers,rounds:[{id:'r',name:'Round',status:'draft',groups:[]}]});
 assert.throws(()=>recordTripGame(draft,'r',{id:'x',status:'active'}),/Start round/);
});
