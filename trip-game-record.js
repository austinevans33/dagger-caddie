import {createTrip} from './trip-roster.js';
import {summarizeTrip} from './trip-settlement.js';
// Save a completed or pending Money Room-derived game exactly once per round.
// This is a pure operation: caller must explicitly persist a returned trip.
export function recordTripGame(trip,roundId,game){
 const current=createTrip({tripId:trip?.id,name:trip?.name,players:trip?.players,rounds:trip?.rounds});
 const round=current.rounds.find(r=>r.id===roundId);
 if(!round)throw new Error('Unknown trip round');
 if(round.status==='draft')throw new Error('Start round before recording games');
 if(!game||typeof game.id!=='string'||!game.id||!['active','draft','completed'].includes(game.status))
  throw new Error('Invalid game');
 if(round.games.some(g=>g.id===game.id))throw new Error('Game already recorded; use an explicit correction workflow');
 const updated={...round,games:[...round.games,game]};
 const next=createTrip({tripId:current.id,name:current.name,players:current.players,
   rounds:current.rounds.map(r=>r.id===roundId?updated:r)});
 return {trip:next,summary:summarizeTrip(next)};
}
