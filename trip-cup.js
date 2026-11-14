import {calculateGroupSkins} from './group-skins.js';

export function cupStandings(trip) {
 const rows=new Map(trip.players.map(({id,name})=>[id,{id,name,skins:0,holes:0}]));
 for(const round of trip.rounds){
  for(const group of round.groups){
   if(group.playerIds.length<2||!group.scores)continue;
   // Only a contiguous run can resolve skins and carryovers in order.
   const gap=group.scores.findIndex(hole=>hole===null);
   const scores=gap<0?group.scores:group.scores.slice(0,gap);
   const result=calculateGroupSkins(scores,0,group.playerIds.length);
   for(const id of group.playerIds)rows.get(id).holes+=scores.length;
   for(const event of result.events){
    if(event.status==='won')rows.get(group.playerIds[event.winner]).skins+=event.skins;
   }
  }
 }
 return [...rows.values()].sort((a,b)=>b.skins-a.skins||a.name.localeCompare(b.name));
}
