// Independent four-player skins engine. Stakes are cents per loser per skin.
// Recalculate from the full scorecard on each edit; never mutate saved scores.
export function calculateGroupSkins(holes,stakeCents,playerCount=4){
 if(!Number.isInteger(playerCount)||playerCount<2||playerCount>4||
 !Array.isArray(holes)||holes.length>18||
 !Number.isSafeInteger(stakeCents)||stakeCents<0||stakeCents>1000000)
 throw Error('Invalid skins setup');
 const balances=Array(playerCount).fill(0),events=[];
 let carry=1;
 for(let i=0;i<18;i++){
  const h=holes[i];
  if(h==null){events.push({hole:i+1,status:'pending'});continue;}
  if(!Array.isArray(h)||h.length!==playerCount||!h.every(n=>Number.isInteger(n)&&n>=1&&n<=20))
   throw Error('Invalid skins hole');
  const low=Math.min(...h),winners=h.map((n,j)=>n===low?j:-1).filter(j=>j>=0);
  if(winners.length!==1){events.push({hole:i+1,status:'carry',skins:carry});carry++;continue;}
  const winner=winners[0],amount=carry*stakeCents;
  for(let j=0;j<playerCount;j++)balances[j]+=j===winner?amount*(playerCount-1):-amount;
  events.push({hole:i+1,status:'won',winner,skins:carry});carry=1;
 }
 const complete=Array.from({length:18},(_,i)=>holes[i]).every(h=>Array.isArray(h)&&h.length===playerCount);
 return {netCents:balances,events,complete,pendingCarry:carry-1,settlementEligible:complete};
}
