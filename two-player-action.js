import {calculateGames} from './multi-game-core.js';
// Two golfers, multiple simultaneous matches, one scorecard.
export function twoPlayerAction({names,holes,games}){
 if(!Array.isArray(names)||names.length!==2||names.some(n=>typeof n!=='string'||!n.trim()))throw Error('Two golfers required');
 const results=calculateGames(holes,games);
 const balances=[0,0],summaries=[];
 for(const r of results){
  balances[0]+=r.netCents[0];balances[1]+=r.netCents[1];
  summaries.push({id:r.id,format:r.format,netCents:[...r.netCents],complete:r.completed});
 }
 if(!balances.every(Number.isSafeInteger)||balances[0]+balances[1]!==0)throw Error('Invalid combined ledger');
 return {players:names.slice(),balances,results:summaries,
   completed:results.length>0&&results.every(r=>r.completed),
   provisional:results.some(r=>!r.completed)};
}
