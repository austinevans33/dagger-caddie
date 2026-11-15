import {scorecardToTripGames} from './scorecard-trip-bridge.js';
import {recordTripGame} from './trip-game-record.js';
import {correctTripGame} from './trip-game-correction.js';
// Replace recorded results atomically in a pure copy, matching by game ID.
// Calling code must persist the entire returned snapshot with a revision guard.
export function reconcileTripScorecard(trip,roundId,card){
 const round=trip?.rounds?.find(row=>row.id===roundId);
 if(!round)throw Error('Unknown round');
 const calculated=scorecardToTripGames(card);
 if(!round.groups.some(group=>group.playerIds.length===card.playerIds.length&&
    card.playerIds.every(id=>group.playerIds.includes(id))))throw Error('Scorecard must match an assigned group');
 let next=trip;
 for(const calculatedGame of calculated){
  const result=calculatedGame.status==='completed'?{...calculatedGame,
   netCents:Object.fromEntries(trip.players.map(({id})=>[id,calculatedGame.netCents[id]??0]))}:calculatedGame;
  const round=next.rounds?.find(r=>r.id===roundId);
  if(!round)throw Error('Unknown round');
  const prior=round.games?.find(g=>g.id===result.id);
  if(!prior)next=recordTripGame(next,roundId,result).trip;
  else if(JSON.stringify(prior)!==JSON.stringify(result))
   next=correctTripGame(next,roundId,prior,result).trip;
 }
 return next;
}

// Apply one group's hole to the latest snapshot. The expected row lets a
// transaction retry over other saved holes without overwriting a correction.
export function applyCupHole(trip,{roundId,groupId,holeIndex,expected,scores}){
 const round=trip?.rounds?.find(entry=>entry.id===roundId);
 const group=round?.groups.find(entry=>entry.id===groupId);
 if(!group||round.status!=='active')throw Error('This group is no longer open for scoring.');
 if(!Number.isInteger(holeIndex)||holeIndex<0||holeIndex>=18||
    !Array.isArray(scores)||scores.length!==group.playerIds.length||
    scores.some(score=>!Number.isInteger(score)||score<1||score>20))throw Error('Enter a valid score for every golfer.');
 const holes=(group.scores??Array(18).fill(null)).slice();
 if(JSON.stringify(holes[holeIndex])===JSON.stringify(scores))return trip;
 if(JSON.stringify(holes[holeIndex])!==JSON.stringify(expected))throw Error('This hole changed. Reopen the scorecard before correcting it.');
 holes[holeIndex]=scores.slice();
 const revised={...trip,rounds:trip.rounds.map(entry=>entry.id===roundId
  ?{...entry,groups:entry.groups.map(row=>row.id===groupId?{...row,scores:holes}:row)}:entry)};
 return reconcileTripScorecard(revised,roundId,{playerIds:group.playerIds,holes,
  games:[{id:'practice-'+groupId,format:'skins',stakeCents:0}]});
}
