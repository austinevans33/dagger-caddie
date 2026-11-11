import {simulateGhostHole} from './house-ghost-trail.js?v=ghost-match-1';
// One deterministic Ghost round for ANY selected course: verified par/yards when present,
// clearly labeled planning defaults when absent. Never label a fallback as a course fact.
export function buildGhostRound({courseName='Selected course',holes=[],seed='house-ghost',count=18,tier=null,matchHole}={}){
 if(![9,18].includes(count)||!Array.isArray(holes))throw Error('Invalid round');
 const byNumber=new Map();
 for(const h of holes)if(Number.isInteger(h?.number)&&h.number>=1&&h.number<=18&&!byNumber.has(h.number))byNumber.set(h.number,h);
 return Array.from({length:count},(_,index)=>{
  const holeNumber=index+1,h=byNumber.get(holeNumber);
  const verifiedPar=Number.isInteger(h?.par)&&h.par>=3&&h.par<=5;
  const verifiedYards=Number.isInteger(h?.yards)&&h.yards>=80&&h.yards<=750;
  const planned=matchHole?.hole===holeNumber?matchHole:null;
  const par=planned?.par??(verifiedPar?h.par:4),teeYards=verifiedYards?h.yards:390;
  return {...simulateGhostHole({holeNumber,par,teeYards,seed:seed+':'+courseName,tier,strokeCount:planned?.ghost}),
   courseName,courseParVerified:verifiedPar,courseYardsVerified:verifiedYards,
   coverage:verifiedPar&&verifiedYards?'scorecard':'schematic-fallback'};
 });
}
