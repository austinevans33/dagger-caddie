// Dagger Games: one immutable hole scorecard, multiple independent games.
// Monetary amounts use integer cents. Never finalize incomplete games.
const validId=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{1,64}$/.test(s);
function assertRound(input){
 if(!input||!Array.isArray(input.players)||input.players.length<2||input.players.length>4||
 input.players.some(p=>!p||!validId(p.id))||
 new Set(input.players.map(p=>p.id)).size!==input.players.length||
 !Array.isArray(input.holes)||input.holes.length>18)throw Error('Invalid round');
 for(let i=0;i<input.holes.length;i++){
  const h=input.holes[i];
  if(h===null)continue;
  if(!Array.isArray(h)||h.length!==input.players.length||
  !h.every(s=>Number.isInteger(s)&&s>=1&&s<=20))throw Error('Invalid hole '+(i+1));
 }
}
function checkGame(g,players){
 if(!g||!validId(g.id)||!['skins','nassau','hole'].includes(g.format)||
 !Number.isSafeInteger(g.stakeCents)||g.stakeCents<0||g.stakeCents>10000000)
 throw Error('Invalid game');
 if(g.format!=='skins'&&players.length!==2)throw Error('Format needs two golfers');
}
export function scoreConcurrentGames(round,games){
 assertRound(round);
 if(!Array.isArray(games)||games.length<1||games.length>12)throw Error('Invalid game list');
 const ids=round.players.map(p=>p.id);
 if(new Set(games.map(g=>g?.id)).size!==games.length)throw Error('Duplicate game ID');
 const full=Array.from({length:18},(_,i)=>round.holes[i]);
 const results=[];
 for(const g of games){
  checkGame(g,ids);
  const balances=Object.fromEntries(ids.map(id=>[id,0]));
  const perHole=[];
  let carry=1,unawardedCents=0;
  const award=(win,amount)=>{for(let i=0;i<ids.length;i++)
   balances[ids[i]]+=(i===win?(ids.length-1)*amount:-amount);};
  for(let i=0;i<18;i++){
   const h=full[i],valid=Array.isArray(h);
   if(!valid){perHole.push({hole:i+1,status:'pending'});continue;}
   if(g.format==='skins'){
    const low=Math.min(...h),winners=h.map((n,k)=>n===low?k:-1).filter(k=>k!==-1);
    if(winners.length===1){
     const pot=g.stakeCents*carry;award(winners[0],pot);
     perHole.push({hole:i+1,status:'won',winner:ids[winners[0]],skins:carry});carry=1;
    }else{perHole.push({hole:i+1,status:'carry',skins:carry});carry++;}
   }else if(g.format==='hole'){
    if(h[0]===h[1])perHole.push({hole:i+1,status:'halved'});
    else{const winner=h[0]<h[1]?0:1;award(winner,g.stakeCents);
     perHole.push({hole:i+1,status:'won',winner:ids[winner]});}
   }else perHole.push({hole:i+1,status:h[0]===h[1]?'halved':'won',
    ...(h[0]===h[1]?{}:{winner:ids[h[0]<h[1]?0:1]})});
  }
  const completed=full.every(Array.isArray);
  if(g.format==='nassau'){
   for(const [from,to] of [[0,9],[9,18],[0,18]]){
    const segment=full.slice(from,to);
    if(segment.every(Array.isArray)){
     const diff=segment.reduce((d,h)=>d+Math.sign(h[1]-h[0]),0);
     if(diff)award(diff>0?0:1,g.stakeCents);
    }
   }
  }
  if(g.format==='skins'&&carry>1)unawardedCents=(carry-1)*g.stakeCents*ids.length;
  results.push({id:g.id,format:g.format,status:completed?'completed':'active',netCents:balances,
   holesRecorded:full.filter(Array.isArray).length,perHole,
   carry,unawardedCents,settlementEligible:completed});
 }
 return results;
}
