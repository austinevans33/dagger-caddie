import {calculateGroupSkins} from './group-skins.js';
// Read-only live-facing preview; never exposes provisional money as payable.
// Scores are submitted once, then this view is recomputed on every edit.
export function previewSkinsAction({playerIds,holes,stakeCents}){
 if(!Array.isArray(playerIds)||playerIds.length<2||playerIds.length>4||
 new Set(playerIds).size!==playerIds.length||
 playerIds.some(id=>typeof id!=='string'||!id))throw Error('Invalid golfers');
 const result=calculateGroupSkins(holes,stakeCents,playerIds.length);
 return {state:result.complete?'final':'provisional',
  balances:playerIds.map((id,i)=>({playerId:id,netCents:result.netCents[i]})),
  nextHole:Math.min(18,holes.length+1),pendingCarry:result.pendingCarry,
  events:result.events,canSettle:result.settlementEligible};
}
