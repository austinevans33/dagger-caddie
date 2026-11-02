import {scorecardToTripGames} from './scorecard-trip-bridge.js';
import {recordTripGame} from './trip-game-record.js';
import {correctTripGame} from './trip-game-correction.js';
// Replace recorded results atomically in a pure copy, matching by game ID.
// Calling code must persist the entire returned snapshot with a revision guard.
export function reconcileTripScorecard(trip,roundId,card){
 const calculated=scorecardToTripGames(card);
 let next=trip;
 for(const result of calculated){
  const round=next.rounds?.find(r=>r.id===roundId);
  if(!round)throw Error('Unknown round');
  const prior=round.games?.find(g=>g.id===result.id);
  if(!prior)next=recordTripGame(next,roundId,result).trip;
  else if(JSON.stringify(prior)!==JSON.stringify(result))
   next=correctTripGame(next,roundId,prior,result).trip;
 }
 return next;
}
