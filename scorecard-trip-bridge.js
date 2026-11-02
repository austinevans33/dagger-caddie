import {calculateGames} from './multi-game-core.js';
import {calculateGroupSkins} from './group-skins.js';
// Convert one authoritative scorecard into independent Trip Ledger game records.
// Incomplete scores never create a completed ledger entry.
export function scorecardToTripGames({playerIds,holes,games}){
 if(!Array.isArray(playerIds)||playerIds.length<2||playerIds.length>4||
  new Set(playerIds).size!==playerIds.length||
  playerIds.some(id=>typeof id!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(id))||
  !Array.isArray(games)||games.length<1||games.length>12||
  new Set(games.map(g=>g?.id)).size!==games.length)throw Error('Invalid scorecard game setup');
 const records=[];
 for(const game of games){
  if(!game||typeof game.id!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(game.id))
   throw Error('Invalid game ID');
  let result;
  if(game.format==='skins')result=calculateGroupSkins(holes,game.stakeCents,playerIds.length);
  else{
   if(playerIds.length!==2)throw Error('Only skins supports group scorecards yet');
   result=calculateGames(holes,[game])[0];
  }
  const final=result.complete??result.completed;
  const values=result.netCents;
  if(values.length!==playerIds.length||values.some(n=>!Number.isSafeInteger(n))||
   values.reduce((s,n)=>s+n,0)!==0)throw Error('Invalid game balance');
  records.push(final?{id:game.id,status:'completed',netCents:Object.fromEntries(playerIds.map((id,i)=>[id,values[i]]))}:
   {id:game.id,status:'active'});
 }
 return records;
}
