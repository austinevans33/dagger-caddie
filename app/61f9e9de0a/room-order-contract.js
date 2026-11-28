import {roundHoleOrder} from './round-hole-order.js';

const roomIdPattern = /^(?:r2-)?[0-9a-f]{32}$/;
export function validRoomId(id) {
  return typeof id === 'string' && roomIdPattern.test(id);
}

// Old clients accept exactly 32 hex characters. A versioned ID keeps a
// rotated room out of stale readers while pending games keep the original IDs.
export function moneyRoomOrder(id, model) {
  if (!validRoomId(id)) return null;
  if (!id.startsWith('r2-')) return model?.playOrder === undefined ? roundHoleOrder() : null;
  const order = model?.playOrder;
  if (order?.version !== 2 || !Number.isInteger(order.startHole) || order.startHole < 1 || order.startHole > 18) return null;
  return roundHoleOrder({startHole:order.startHole});
}

export function computeRoomSettlement(model,order){
 const players=model.players||[];const n=players.length,holes=model.holes||{},stake=Number(model.stake)||0;
 const totals=Array(n).fill(0),ledger=[];let carry=1,settled=0;
 let cumulativeMatch=0;
 // Skins cannot award later holes until every preceding hole is scored.
 // Otherwise a late score correction can rewrite money already shown as won.
 let skinsSequenceComplete=true,skinsBlockedByGap=false;
 const segs=[{from:1,to:9,finished:false},{from:10,to:18,finished:false},{from:1,to:18,finished:false}];
 for(const [position,hole] of order.entries()){
   const ordinal=position+1;
   const scores=holes[hole];const valid=Array.isArray(scores)&&scores.length===n&&scores.every(v=>Number.isInteger(v)&&v>=1&&v<=20);
   let event='—';
   if(!valid&&model.format==='skins')skinsSequenceComplete=false;
   if(valid){
     settled++;
     if(model.format==='skins'){
       if(!skinsSequenceComplete){skinsBlockedByGap=true;event='Pending earlier hole · skins not settled';}
       else {
        const low=Math.min(...scores), winners=scores.map((x,i)=>x===low?i:-1).filter(i=>i>=0);
        if(winners.length===1){const win=winners[0],pot=stake*carry;totals[win]+=(n-1)*pot;for(let i=0;i<n;i++)if(i!==win)totals[i]-=pot;event=players[win]+' · '+carry+' skin'+(carry===1?'':'s');carry=1;}
        else{event='Tie · carry '+carry+' → '+(carry+1);carry++;}
       }
     } else if(model.format==='hole'){
       if(scores[0]===scores[1])event='Halved';else{const w=scores[0]<scores[1]?0:1;totals[w]+=stake;totals[1-w]-=stake;cumulativeMatch+=w===0?1:-1;event=players[w]+' wins';}
     } else if(model.format==='vegas'){
       const a=Math.min(scores[0],scores[1])*10+Math.max(scores[0],scores[1]),b=Math.min(scores[2],scores[3])*10+Math.max(scores[2],scores[3]);const diff=(b-a)*stake;
       totals[0]+=diff/2;totals[1]+=diff/2;totals[2]-=diff/2;totals[3]-=diff/2;event=a+'–'+b+' · '+(diff===0?'Tie':diff>0?'Team 1':'Team 2');
     } else if(model.format==='nassau'){
       event=scores[0]===scores[1]?'Halved':players[scores[0]<scores[1]?0:1]+' wins hole';
     }
   }
   // Nassau settlements are provisional until all holes in a segment are entered.
   if(model.format==='nassau'&&n===2){
     for(const seg of segs){if(seg.to!==ordinal)continue;let diff=0,count=0;for(let k=seg.from;k<=seg.to;k++){const v=holes[order[k-1]];if(Array.isArray(v)&&v.length===2&&v.every(x=>Number.isInteger(x)&&x>=1&&x<=20)){count++;diff+=v[0]<v[1]?1:v[0]>v[1]?-1:0;}}
       if(count===seg.to-seg.from+1){seg.finished=true;if(diff!==0){const w=diff>0?0:1;totals[w]+=stake;totals[1-w]-=stake;event+=' · Nassau segment settled';}}}}
   ledger.push({hole,scores:valid?scores:null,event,totals:[...totals],carry});
 }
 return {totals,carry,settled,ledger,matchDiff:cumulativeMatch,skinsPending:model.format==='skins'&&skinsBlockedByGap};
}
