// Dagger Country Club: validated, immutable Golf Trip organization.
// IDs are stable and do not depend on display names or foursome assignments.
const id = x => typeof x==='string' && /^[a-zA-Z0-9_-]{1,64}$/.test(x);
const label = x => typeof x==='string' && x.trim().length>0 && x.trim().length<=80;
export function createTrip({tripId,name,players,rounds=[]}) {
  if(!id(tripId)||!label(name)||!Array.isArray(players)||players.length<2||players.length>64)
    throw new Error('Invalid trip');
  const people=players.map(p=>{
    if(!p||!id(p.id)||!label(p.name))throw new Error('Invalid golfer');
    return {id:p.id,name:p.name.trim()};
  });
  if(new Set(people.map(p=>p.id)).size!==people.length)throw new Error('Duplicate golfer');
  const trip={schemaVersion:1,id:tripId,name:name.trim(),players:people,rounds:[]};
  for(const round of rounds)trip.rounds.push(validateRound(round,new Set(people.map(p=>p.id))));
  if(new Set(trip.rounds.map(r=>r.id)).size!==trip.rounds.length)throw new Error('Duplicate round');
  return trip;
}
function validateRound(round,roster){
  if(!round||!id(round.id)||!label(round.name)||!['draft','active','completed'].includes(round.status)||
     !Array.isArray(round.groups)||round.groups.length>16)throw new Error('Invalid trip round');
  const assigned=new Set();
  const groups=round.groups.map(group=>{
    if(!group||!id(group.id)||!Array.isArray(group.playerIds)||
       group.playerIds.length<1||group.playerIds.length>4)throw new Error('Invalid foursome');
    for(const playerId of group.playerIds){
      if(!roster.has(playerId)||assigned.has(playerId))throw new Error('Unknown or duplicate golfer in round');
      assigned.add(playerId);
    }
    return {id:group.id,playerIds:[...group.playerIds]};
  });
  if(new Set(groups.map(g=>g.id)).size!==groups.length)throw new Error('Duplicate foursome');
  return {id:round.id,name:round.name.trim(),status:round.status,groups,games:[]};
}
export function addTripRound(trip,round){
  const current=createTrip(trip);
  if(current.rounds.some(r=>r.id===round?.id))throw new Error('Duplicate round');
  if(current.rounds.length>=100)throw new Error('Too many trip rounds');
  current.rounds.push(validateRound(round,new Set(current.players.map(p=>p.id))));
  return current;
}
export function tripRosterSummary(trip){
  const current=createTrip(trip);
  return {playerCount:current.players.length,roundCount:current.rounds.length,
    rounds:current.rounds.map(r=>({id:r.id,status:r.status,
      foursomes:r.groups.length,assignedGolfers:r.groups.reduce((n,g)=>n+g.playerIds.length,0)}))};
}
