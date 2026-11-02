import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeTrip} from '../trip-settlement.js';
const players=[{id:'a',name:'A'},{id:'b',name:'B'},{id:'c',name:'C'}];
const game=(id,netCents,status='completed')=>({id,status,netCents});
test('three golfers, two rounds, multiple games, one net settlement',()=>{
 const result=summarizeTrip({players,rounds:[
  {id:'r1',status:'completed',games:[game('skins',{a:1000,b:-500,c:-500}),game('nassau',{a:-300,b:300,c:0})]},
  {id:'r2',status:'completed',games:[game('wolf',{a:0,b:-200,c:200})]}
 ]});
 assert.deepEqual(result.netCents,{a:700,b:-400,c:-300});
 assert.deepEqual(result.transfers,[{from:'b',to:'a',amountCents:400},{from:'c',to:'a',amountCents:300}]);
 assert.equal(result.countedGames,3);
 assert.equal(result.provisional,false);
});
test('in-progress round and game are not claimed as settled',()=>{
 const result=summarizeTrip({players,rounds:[
  {id:'r1',status:'completed',games:[game('skins',{a:100,b:-100,c:0}),game('nassau',null,'active')]},
  {id:'r2',status:'active',games:[game('skins',{a:200,b:-200,c:0})]}
 ]});
 assert.deepEqual(result.netCents,{a:100,b:-100,c:0});
 assert.equal(result.pendingRounds,1);assert.equal(result.pendingGames,2);assert.equal(result.provisional,true);
});
test('reject duplicate games and invalid zero-sum payments',()=>{
 assert.throws(()=>summarizeTrip({players,rounds:[{id:'r1',status:'completed',games:[game('x',{a:1,b:-1,c:0}),game('x',{a:1,b:-1,c:0})]}]}),/duplicate game/);
 assert.throws(()=>summarizeTrip({players,rounds:[{id:'r1',status:'completed',games:[game('x',{a:100,b:0,c:0})]}]}),/Non-zero-sum/);
});
test('empty trip is safe and does not award imaginary winnings',()=>{
 const result=summarizeTrip({players,rounds:[]});
 assert.deepEqual(result.transfers,[]);assert.deepEqual(result.netCents,{a:0,b:0,c:0});
});
