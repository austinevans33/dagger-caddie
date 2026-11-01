import {createTrip} from './trip-roster.js';
import {summarizeTrip} from './trip-settlement.js';
// Explicit version-checked replacement of an existing trip game.
// A caller must reconcile Money Room revisions and pass the expected prior
// snapshot; silent overwrites, duplicate payouts, and deletions are prohibited.
const signature=game=>JSON.stringify(game);
export function correctTripGame(trip,roundId,expectedGame,replacement){
 const base=createTrip({tripId:trip?.id,name:trip?.name,players:trip?.players,rounds:trip?.rounds});
 const round=base.rounds.find(r=>r.id===roundId);
 if(!round)throw new Error('Unknown trip round');
 if(!expectedGame||!replacement||expectedGame.id!==replacement.id)
  throw new Error('Game identity cannot change');
 const previous=round.games.find(g=>g.id===expectedGame.id);
 if(!previous||signature(previous)!==signature(expectedGame))
  throw new Error('Game changed since last read; refresh before correcting');
 // Completed round can only be corrected to a completed valid game;
 // otherwise use explicit round reopening before de-settling.
 if(round.status==='completed'&&replacement.status!=='completed')
  throw new Error('Reopen round before marking a result unfinished');
 const changed=base.rounds.map(r=>r.id!==roundId?r:{...r,games:r.games.map(g=>g.id===replacement.id?replacement:g)});
 const next=createTrip({tripId:base.id,name:base.name,players:base.players,rounds:changed});
 return {trip:next,summary:summarizeTrip(next)};
}
