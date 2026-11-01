import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrip,addTripRound,tripRosterSummary} from '../trip-roster.js';
const players=Array.from({length:8},(_,i)=>({id:'p'+(i+1),name:'Golfer '+(i+1)}));
const groups=[{id:'g1',playerIds:['p1','p2','p3','p4']},{id:'g2',playerIds:['p5','p6','p7','p8']}];
test('eight golfers, two foursomes, and multi-round schedule',()=>{
 const trip=createTrip({tripId:'fall26',name:'Fall Member Guest',players});
 const first=addTripRound(trip,{id:'friday',name:'Friday',status:'draft',groups});
 const second=addTripRound(first,{id:'saturday',name:'Saturday',status:'draft',groups:[{id:'g1',playerIds:['p1','p5','p2','p6']},{id:'g2',playerIds:['p3','p7','p4','p8']}]});
 assert.equal(trip.rounds.length,0);
 assert.deepEqual(tripRosterSummary(second).rounds.map(r=>r.assignedGolfers),[8,8]);
});
test('rejects golfer assigned twice and unknown player',()=>{
 const trip=createTrip({tripId:'t1',name:'Trip',players});
 assert.throws(()=>addTripRound(trip,{id:'r1',name:'Round',status:'draft',groups:[{id:'a',playerIds:['p1','p2']},{id:'b',playerIds:['p2']}] }),/Unknown or duplicate golfer/);
 assert.throws(()=>addTripRound(trip,{id:'r1',name:'Round',status:'draft',groups:[{id:'a',playerIds:['stranger']}] }),/Unknown or duplicate golfer/);
});
test('does not allow duplicate golfer IDs or invalid group sizes',()=>{
 assert.throws(()=>createTrip({tripId:'t',name:'Trip',players:[players[0],players[0]]}),/Duplicate golfer/);
 const trip=createTrip({tripId:'t',name:'Trip',players});
 assert.throws(()=>addTripRound(trip,{id:'r',name:'Round',status:'draft',groups:[{id:'g',playerIds:players.slice(0,5).map(p=>p.id)}]}),/Invalid foursome/);
});
