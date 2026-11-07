// Pure gross-score games ledger math. Only completed Nassau segments pay out;
// an early lead remains a live position, not a settled debt.
const stroke=n=>Number.isInteger(n)&&n>=1&&n<=15;
export function foursomeMoney(game){
 const names=Array.isArray(game?.players)?game.players:[];
 const score=names.map(()=>0),stake=Number(game?.stake);
 if(names.length<2||names.length>4||!Number.isFinite(stake)||stake<0||
    !Array.isArray(game?.holes)||game.holes.length>18)return null;
 let carry=1;const pending=[];
 const holes=game.holes;
 if(holes.some(h=>!Array.isArray(h)||h.length!==names.length||h.some(n=>!stroke(n))))return null;
 if(game.format==='skins'){
  for(const hole of holes){
   const low=Math.min(...hole),winners=hole.flatMap((n,i)=>n===low?[i]:[]);
   if(winners.length===1){
    const winner=winners[0],value=stake*carry;
    score[winner]+=value*(names.length-1);
    score.forEach((_,i)=>{if(i!==winner)score[i]-=value});
    carry=1;
   }else carry++;
  }
  return {score,carry,pending};
 }
 if(names.length!==2||!['hole','nassau'].includes(game.format))return null;
 if(game.format==='hole'){
  holes.forEach(h=>{const winner=h[0]<h[1]?0:h[1]<h[0]?1:-1;
   if(winner>=0){score[winner]+=stake;score[1-winner]-=stake}
  });
  return {score,carry,pending};
 }
 for(const [start,end,label] of [[0,9,'Front nine'],[9,18,'Back nine'],[0,18,'Overall']]){
  const played=Math.max(0,Math.min(holes.length,end)-start);
  const lead=holes.slice(start,end).reduce((n,h)=>n+(h[0]<h[1]?1:h[0]>h[1]?-1:0),0);
  if(played<end-start){pending.push({label,played,required:end-start,leader:Math.sign(lead)});continue}
  if(lead>0){score[0]+=stake;score[1]-=stake}
  if(lead<0){score[0]-=stake;score[1]+=stake}
 }
 return {score,carry,pending};
}
