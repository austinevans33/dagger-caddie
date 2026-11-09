// Honest completeness indicator for verified tee-specific hole facts.
// This module never fills missing pars, yardages, stroke indices, or pin distances.
export function scorecardCoverage(holes,expected=18){
 const total=expected===9?9:18;
 const byNumber=new Map();
 for(const hole of Array.isArray(holes)?holes:[]){
  const n=Number(hole?.number);
  if(!Number.isInteger(n)||n<1||n>total||byNumber.has(n))continue;
  const par=Number(hole?.par),yards=Number(hole?.yards);
  if(!Number.isInteger(par)||par<3||par>6||!Number.isInteger(yards)||yards<50||yards>800)continue;
  byNumber.set(n,hole);
 }
 const missing=[];
 for(let n=1;n<=total;n++)if(!byNumber.has(n))missing.push(n);
 const count=byNumber.size;
 return Object.freeze({
  verifiedHoles:count,expectedHoles:total,complete:count===total,
  missingHoles:Object.freeze(missing),
  label:count===total?'Complete verified scorecard · '+total+'/'+total+' holes':
   count?'Partial verified scorecard · '+count+'/'+total+' holes':
   'Hole-by-hole course data unavailable · 0/'+total+' holes',
  detail:count===total?'Par and selected-tee yardage verified for every hole.':
   count?'Missing provider details on hole'+(missing.length===1?' ':'s ')+missing.join(', ')+'. Scores can still be entered.':
   'Scores can still be entered. Dagger will not invent par or tee yardages.'
 });
}
