import {buildGhostRound} from './house-ghost-round.js';
// Single source for traced Ghost strokes and Ledger match results.
// Incomplete golfer holes do not count as played or settled.
export function ghostLedgerSnapshot({courseName,holes=[],playerScores=[],seed='house-ghost',count=18}={}){
 const round=buildGhostRound({courseName,holes,seed,count});
 if(!Array.isArray(playerScores))throw Error('Invalid golfer scores');
 let lead=0,played=0,blocked=false;const ledger=[];
 for(let i=0;i<count;i++){
  const player=playerScores[i],ghost=round[i];
  const valid=Number.isInteger(player)&&player>=1&&player<=20;
  if(!valid)blocked=true;
  const result=blocked?'pending':player<ghost.score?'golfer':player>ghost.score?'ghost':'halved';
  if(!blocked){played++;lead+=Math.sign(ghost.score-player);}
  ledger.push({holeNumber:i+1,player:valid?player:null,ghost:ghost.score,result,lead:blocked?null:lead,shotCount:ghost.shots.length});
 }
 const remaining=count-played;
 return {round,ledger,holesPlayed:played,holesRemaining:remaining,lead,matchStatus:blocked?'incomplete':Math.abs(lead)>remaining?(lead>0?'golfer-wins':'ghost-wins'):remaining===0?(lead>0?'golfer-wins':lead<0?'ghost-wins':'halved'):'active'};
}
