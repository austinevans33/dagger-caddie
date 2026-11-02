// Pure two-player games. One scorecard, independent stakes and results.
export function calculateGames(holes,games) {
 if (!Array.isArray(holes)||holes.length>18||!Array.isArray(games)||games.length>12) throw Error('Invalid setup');
 const valid=h=>Array.isArray(h)&&h.length===2&&h.every(n=>Number.isInteger(n)&&n>=1&&n<=20);
 if(holes.some(h=>h!=null&&!valid(h))) throw Error('Invalid hole score');
 const ids=new Set();
 return games.map(g=>{
  if(!g||typeof g.id!=='string'||!g.id||ids.has(g.id)||!['skins','nassau','hole'].includes(g.format)||!Number.isSafeInteger(g.stakeCents)||g.stakeCents<0||g.stakeCents>1000000) throw Error('Invalid or duplicate game');
  ids.add(g.id);
  let balance=0,carry=1;const events=[];
  const score=Array.from({length:18},(_,i)=>holes[i]);
  for(let i=0;i<18;i++){
   const h=score[i];
   if(!valid(h)){events.push({hole:i+1,status:'pending'});continue;}
   const winner=h[0]<h[1]?0:h[1]<h[0]?1:-1;
   if(g.format==='skins'){
    if(winner<0){carry++;events.push({hole:i+1,status:'carry'});}
    else{balance+=(winner===0?1:-1)*carry*g.stakeCents;events.push({hole:i+1,status:'won',winner,skins:carry});carry=1;}
   }else if(g.format==='hole'){
    if(winner>=0)balance+=(winner===0?1:-1)*g.stakeCents;
    events.push({hole:i+1,status:winner<0?'halved':'won',winner});
   }else events.push({hole:i+1,status:winner<0?'halved':'won',winner});
  }
  if(g.format==='nassau'){
   for(const [from,to] of [[0,9],[9,18],[0,18]]){
    const segment=score.slice(from,to);
    if(segment.length!==to-from||!segment.every(valid))continue;
    const lead=segment.reduce((sum,h)=>sum+Math.sign(h[1]-h[0]),0);
    balance+=Math.sign(lead)*g.stakeCents;
   }
  }
  return {id:g.id,format:g.format,netCents:[balance,-balance],events,
   completed:score.every(valid),pendingCarry:g.format==='skins'?carry-1:0};
 });
}
