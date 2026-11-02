import {createTrip} from './trip-roster.js';
import {summarizeTrip} from './trip-settlement.js';
// Round transitions are explicit, never inferred from elapsed time or UI state.
export function changeTripRoundStatus(trip,roundId,newStatus){
 const current=createTrip({tripId:trip?.id,name:trip?.name,players:trip?.players,rounds:trip?.rounds});
 const round=current.rounds.find(r=>r.id===roundId);
 if(!round)throw new Error('Unknown trip round');
 if(newStatus==='active'){
  if(round.status!=='draft')throw new Error('Only draft rounds can be started');
  if(!round.groups.length)throw new Error('Assign golfers before starting');
 }else if(newStatus==='completed'){
  if(round.status!=='active')throw new Error('Only active rounds can be completed');
  if(!round.games.length||round.games.some(g=>g.status!=='completed'))
   throw new Error('Every game must be completed before finishing round');
 }else throw new Error('Unsupported status transition');
 const next=createTrip({tripId:current.id,name:current.name,players:current.players,
  rounds:current.rounds.map(r=>r.id===roundId?{...r,status:newStatus}:r)});
 return {trip:next,summary:summarizeTrip(next)};
}
