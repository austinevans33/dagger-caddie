import test from 'node:test';
import assert from 'node:assert/strict';
import {moneyRoomToTripGame} from '../trip-money-room-adapter.js';
import {summarizeTrip} from '../trip-settlement.js';
const full=Object.fromEntries(Array.from({length:18},(_,i)=>[i+1,[4,5]]));
const room={players:['Alex','Blair'],holes:full,archived:true};
test('completed Money Room becomes one trip game with stable roster IDs',()=>{
 const game=moneyRoomToTripGame({roomId:'room123',room,playerIds:['member1','member2'],calculated:{totals:[25,-25],settled:18}});
 assert.deepEqual(game,{id:'room123',status:'completed',netCents:{member1:2500,member2:-2500}});
 const result=summarizeTrip({players:[{id:'member1',name:'Alex'},{id:'member2',name:'Blair'}],rounds:[{id:'sunday',status:'completed',games:[game]}]});
 assert.deepEqual(result.transfers,[{from:'member2',to:'member1',amountCents:2500}]);
});
test('archived early Money Room cannot generate finalized trip winnings',()=>{
 const game=moneyRoomToTripGame({roomId:'test1',room:{...room,holes:{}},playerIds:['a','b'],calculated:{totals:[100,-100],settled:0}});
 assert.equal(game.status,'active');
 assert.equal(Object.hasOwn(game,'netCents'),false);
});
test('rejects missing mapping, invalid settlement and non-cent values',()=>{
 const args={roomId:'test2',room,playerIds:['a','b'],calculated:{totals:[1,-1],settled:18}};
 assert.throws(()=>moneyRoomToTripGame({...args,playerIds:['a','a']}),/mapping/);
 assert.throws(()=>moneyRoomToTripGame({...args,calculated:{totals:[1,0],settled:18}}),/zero-sum/);
 assert.throws(()=>moneyRoomToTripGame({...args,calculated:{totals:[0.123,-0.123],settled:18}}),/Non-cent/);
});
test('unarchived live room cannot be settled even with 18 scores',()=>{
 const game=moneyRoomToTripGame({roomId:'test3',room:{...room,archived:false},playerIds:['a','b'],calculated:{totals:[0,0],settled:18}});
 assert.equal(game.status,'active');
});
