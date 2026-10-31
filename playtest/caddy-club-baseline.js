// Deterministic, wind-neutral club reference from the golfer's OWN saved carries.
// Never treat tee yardage as remaining distance or turn a model wind into an exact adjustment.
export function buildCaddyClubBaseline(profile,remainingYards){
 const target=Number(remainingYards);
 if(remainingYards==null||String(remainingYards).trim()===''||
  !Number.isFinite(target)||target<20||target>400)return null;
 if(!Array.isArray(profile))return null;
 const clubs=profile.slice(0,40).map(c=>{
  const carry=Number(c?.manualCarry??c?.carry);
  const name=typeof c?.name==='string'?c.name.trim().slice(0,36):'';
  return {name,carry};
 }).filter(c=>c.name&&Number.isFinite(c.carry)&&c.carry>=20&&c.carry<=400);
 if(!clubs.length)return null;
 clubs.sort((a,b)=>Math.abs(a.carry-target)-Math.abs(b.carry-target)||b.carry-a.carry);
 const picks=clubs.slice(0,2);
 return Object.freeze({
  targetYards:Math.round(target),
  choices:Object.freeze(picks.map(c=>Object.freeze({...c,differenceYards:Math.round(c.carry-target)}))),
  source:'golfer-saved-carry',
  instruction:'Neutral carry comparison only. Adjust for lie, elevation, observed wind direction, and rollout. No verified live pin distance.'
 });
}
export function formatCaddyClubBaseline(baseline){
 if(!baseline?.choices?.length)return 'Save club carry distances in your Locker to see a neutral club reference.';
 return 'Your carries · '+baseline.choices.map(c=>c.name+' '+Math.round(c.carry)+' yd').join(' / ')+
  ' · target '+baseline.targetYards+' yd · neutral conditions only';
}
