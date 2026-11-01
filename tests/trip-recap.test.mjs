import test from 'node:test';
import assert from 'node:assert/strict';
import {buildTripRecap} from '../trip-recap.js';
const people=[{id:'a',name:'Austin'},{id:'b',name:'Mike'}];
const trip={name:'Fall Classic',players:people,rounds:[{id:'r',status:'completed',games:[{id:'skins',status:'completed',netCents:{a:2500,b:-2500}}]}]};
test('real balances drive recap and transfer',()=>{
 const r=buildTripRecap(trip);
 assert.equal(r.status,'FINAL');assert.match(r.headlines[0],/Austin/);
 assert.equal(r.settlements[0].amountCents,2500);
});
test('unfinished trip has no final transfers',()=>{
 const r=buildTripRecap({...trip,rounds:[{...trip.rounds[0],status:'active'}]});
 assert.equal(r.status,'PROVISIONAL');assert.deepEqual(r.settlements,[]);
});
test('even ledger creates no invented winner',()=>{
 const r=buildTripRecap({...trip,rounds:[{...trip.rounds[0],games:[{id:'s',status:'completed',netCents:{a:0,b:0}}]}]});
 assert.match(r.headlines[0],/ledger is even/);
});