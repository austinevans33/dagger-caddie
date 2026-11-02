import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrip,addTripRound} from '../trip-roster.js';
import {changeTripRoundStatus} from '../trip-round-status.js';
const roster=[{id:'p1',name:'A'},{id:'p2',name:'B'}];
const original=()=>addTripRound(createTrip({tripId:'trip',name:'Weekend',players:roster}),{id:'fri',name:'Friday',status:'draft',groups:[{id:'group',playerIds:['p1','p2']}]});
test('start a drafted trip round without changing existing object',()=>{
 const draft=original(),result=changeTripRoundStatus(draft,'fri','active');
 assert.equal(draft.rounds[0].status,'draft');
 assert.equal(result.trip.rounds[0].status,'active');
 assert.equal(result.summary.provisional,true);
});
test('do not complete a round with no games or unfinished wagers',()=>{
 const active=changeTripRoundStatus(original(),'fri','active').trip;
 assert.throws(()=>changeTripRoundStatus(active,'fri','completed'),/Every game/);
 const withPending=createTrip({tripId:'trip',name:'Weekend',players:roster,rounds:[{...active.rounds[0],games:[{id:'skins',status:'active'}]}]});
 assert.throws(()=>changeTripRoundStatus(withPending,'fri','completed'),/Every game/);
});
test('finished recorded game can complete round and settle exactly once',()=>{
 const active=changeTripRoundStatus(original(),'fri','active').trip;
 const withGame=createTrip({tripId:'trip',name:'Weekend',players:roster,rounds:[{...active.rounds[0],games:[{id:'skins',status:'completed',netCents:{p1:300,p2:-300}}]}]});
 const done=changeTripRoundStatus(withGame,'fri','completed');
 assert.equal(done.summary.provisional,false);
 assert.deepEqual(done.summary.transfers,[{from:'p2',to:'p1',amountCents:300}]);
 assert.throws(()=>changeTripRoundStatus(done.trip,'fri','completed'),/Only active/);
});
test('reject impossible transitions and empty groups',()=>{
 assert.throws(()=>changeTripRoundStatus(original(),'fri','completed'),/Only active/);
 assert.throws(()=>changeTripRoundStatus(original(),'missing','active'),/Unknown/);
 const empty=createTrip({tripId:'trip',name:'Weekend',players:roster,rounds:[{id:'r1',name:'First',status:'draft',groups:[]}]});
 assert.throws(()=>changeTripRoundStatus(empty,'r1','active'),/Assign golfers/);
});
