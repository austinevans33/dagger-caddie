import {buildGhostRound} from './house-ghost-round.js';
import {roundHoleOrder} from './round-hole-order.js';
// Single source for traced Ghost strokes and Ledger match results.
// Incomplete golfer holes do not count as played or settled.
export function ghostLedgerSnapshot({courseName,holes=[],playerScores=[],seed='house-ghost',count=18,tier=null,matchHoles=[],startHole=1}={}){
 const round=buildGhostRound({courseName,holes,seed,count,tier,matchHoles});
 if(!Array.isArray(playerScores))throw Error('Invalid golfer scores');
 const order=roundHoleOrder({count,startHole});
 let lead=0,played=0,blocked=false,hasOutOfOrderScores=false;const ledger=[];
 for(let i=0;i<count;i++){
  const holeNumber=order[i],player=playerScores[holeNumber-1],ghost=round[holeNumber-1];
  const valid=Number.isInteger(player)&&player>=1&&player<=20;
  if(!valid)blocked=true;
  else if(blocked)hasOutOfOrderScores=true;
  const result=blocked?'pending':player<ghost.score?'golfer':player>ghost.score?'ghost':'halved';
  if(!blocked){played++;lead+=Math.sign(ghost.score-player);}
  ledger.push({holeNumber,player:valid?player:null,ghost:ghost.score,result,lead:blocked?null:lead,shotCount:ghost.shots.length});
 }
 const remaining=count-played;
 return {round,ledger,startHole,playOrder:order,holesPlayed:played,holesRemaining:remaining,lead,matchStatus:hasOutOfOrderScores?'incomplete':Math.abs(lead)>remaining?(lead>0?'golfer-wins':'ghost-wins'):remaining===0?(lead>0?'golfer-wins':lead<0?'ghost-wins':'halved'):'active'};
}
