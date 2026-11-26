// Acquire candidate scorecards through existing read-only provider adapters.
// Search partitions are explicit; a capped search is never claimed exhaustive.
import {searchOpenGolfCourses,loadOpenGolfTees} from './opengolf-catalog.js';
import {loadOpenGolfHoles} from './opengolf-holes.js';
import {founderVerifiedScorecard} from './founders-verified-scorecards.js';
export async function acquireFactoryCandidates(queries,{search=searchOpenGolfCourses,loadTees=loadOpenGolfTees,loadHoles=loadOpenGolfHoles,signal}={}){
 if(!Array.isArray(queries)||queries.some(q=>typeof q!=='string'||q.trim().length<2||q.length>100))throw Error('Invalid search partitions');
 const courses=new Map(),issues=[],partitions=[];
 for(const query of [...new Set(queries.map(q=>q.trim()))]){
  signal?.throwIfAborted();
  try{
   const rows=await search(query,{signal});
   partitions.push({query,returned:rows.length,possiblyCapped:rows.length>=40});
   for(const course of rows)courses.set(course.provider+':'+course.providerCourseId,course);
  }catch(error){signal?.throwIfAborted();issues.push({query,stage:'search',message:String(error.message)});}
 }
 const entries=[];
 for(const [id,course] of courses){
  signal?.throwIfAborted();
  try{
   const catalog=await loadTees(course,{signal});
   const tees=catalog.find(r=>r.course.providerCourseId===course.providerCourseId)?.tees??[];
   let accepted=false;
   for(const tee of tees){
    const selection={course,tee,holeNumber:1};
    const official=founderVerifiedScorecard(selection);
    const holes=official?.holes??await loadHoles(selection,{signal});
    const count=course.holeCount??18;
    if(![9,18].includes(count)||holes.length!==count||new Set(holes.map(h=>h.number)).size!==count||!holes.every(h=>Number.isInteger(h.number)&&h.number>=1&&h.number<=count&&Number.isInteger(h.par)&&h.par>=3&&h.par<=6&&Number.isInteger(h.yards)&&h.yards>=50&&h.yards<=800)||holes.reduce((s,h)=>s+h.yards,0)!==tee.totalYards)continue;
    entries.push({selection,holes,source:official?.source??'opengolfapi',provenance:official?.provenance??{url:'https://api.opengolfapi.org/v1/courses/'+encodeURIComponent(course.providerCourseId)+'/holes',providerReported:true}});
    accepted=true;break;
   }
   if(!accepted)issues.push({id,stage:'scorecard',message:'No complete tee with matching published total'});
  }catch(error){signal?.throwIfAborted();issues.push({id,stage:'acquisition',message:String(error.message)});}
 }
 return {entries,issues,partitions,discovered:courses.size};
}
