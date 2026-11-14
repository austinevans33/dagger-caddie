import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrip} from '../trip-roster.js';
import {reconcileTripScorecard} from '../trip-scorecard-reconcile.js';
import {cupStandings} from '../trip-cup.js';

test('Cup standings update from saved scores and recalculate after a correction',()=>{
 const scores=[[4,4],[3,4],null,[4,3],...Array(14).fill(null)];
 const trip=createTrip({tripId:'cup',name:'Cup De Diesel Nips',players:[{id:'a',name:'A'},{id:'b',name:'B'}],
  rounds:[{id:'r',name:'Round one',status:'active',groups:[{id:'g',playerIds:['a','b'],scores}]}]});
 const game={id:'practice-g',format:'skins',stakeCents:0};
 const save=(snapshot,holes)=>reconcileTripScorecard(snapshot,'r',{playerIds:['a','b'],holes,games:[game]});
 const saved=save(trip,scores);
 assert.deepEqual(cupStandings(saved).map(({skins,holes})=>[skins,holes]),[[2,2],[0,2]]);
 scores[1]=[4,3];
 assert.equal(cupStandings(saved)[0].id,'a');
 const corrected=createTrip({tripId:'cup',name:trip.name,players:trip.players,
  rounds:[{...saved.rounds[0],groups:[{...saved.rounds[0].groups[0],scores}]}]});
 assert.equal(cupStandings(save(corrected,scores))[0].id,'b');
 assert.throws(()=>createTrip({tripId:'cup',name:trip.name,players:trip.players,
  rounds:[{...saved.rounds[0],groups:[{...saved.rounds[0].groups[0],scores:[[0,4]]}]}]}),/Invalid group scorecard/);
});
