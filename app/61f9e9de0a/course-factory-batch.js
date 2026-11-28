// Read-only batch preflight using the same pencil renderer as the live Yardage Book.
// No synthetic hazards, no score writes, no automatic publication.
import {loadHoleSketch} from './hole-sketch.js';
import {buildGhostRound} from './house-ghost-round.js';
export async function inspectFactoryBatch(entries,{loadSketch=loadHoleSketch,concurrency=3,signal}={}){
 if(!Array.isArray(entries)||!Number.isInteger(concurrency)||concurrency<1||concurrency>8)throw Error('Invalid factory batch');
 const results=Array(entries.length);let cursor=0;
 async function worker(){
  while(cursor<entries.length){
   signal?.throwIfAborted();
   const i=cursor++,entry=entries[i],selection=entry?.selection,count=selection?.course?.holeCount??18;
   const holes=entry?.holes;
   const valid=[9,18].includes(count)&&Array.isArray(holes)&&holes.length===count&&
    new Set(holes.map(h=>h.number)).size===count&&holes.every(h=>Number.isInteger(h.number)&&h.number>=1&&h.number<=count&&[3,4,5].includes(h.par)&&Number.isInteger(h.yards)&&h.yards>=80&&h.yards<=750);
   if(!valid){results[i]={index:i,status:'scorecard-blocked',mapped:0};continue;}
   const drawings=[];
   for(let n=1;n<=count;n++){
    signal?.throwIfAborted();
    try{
     const sketch=await loadSketch(selection,n,{signal});
     drawings.push({hole:n,coverage:sketch.coverage,ready:sketch.coverage==='layout'&&Boolean(sketch.annotations?.route)&&sketch.shapes?.some(s=>s.type==='green')===true});
    }catch(error){signal?.throwIfAborted();drawings.push({hole:n,coverage:'unavailable',ready:false});}
   }
   const mapped=drawings.filter(h=>h.ready).length;
   const ghost=buildGhostRound({courseName:selection?.course?.name,holes,count});
   const ghostReady=ghost.length===count&&ghost.every(h=>h.coverage==='scorecard'&&h.shots.length===h.score);
   results[i]={index:i,id:selection?.course?.providerCourseId,count,mapped,ghostReady,drawings,status:mapped===count&&ghostReady?'candidate-ready':'mapping-incomplete'};
  }
 }
 await Promise.all(Array.from({length:Math.min(concurrency,entries.length)},worker));
 return results;
}
