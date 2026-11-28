// Physical hole numbers stay fixed; only the order of play rotates.
// Shared by Ghost and future wager adapters for shotgun and back-nine starts.
export function roundHoleOrder({count=18,startHole=1}={}){
 if(![9,18].includes(count)||!Number.isInteger(startHole)||startHole<1||startHole>count)throw Error('Invalid starting hole');
 return Object.freeze(Array.from({length:count},(_,i)=>((startHole-1+i)%count)+1));
}
export function orderedRoundScores(scores,{count=18,startHole=1}={}){
 if(!Array.isArray(scores))throw Error('Invalid scores');
 return roundHoleOrder({count,startHole}).map(holeNumber=>scores[holeNumber-1]??null);
}
