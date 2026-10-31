// OpenGolfAPI hole scorecard facts; never interpret scorecard yardage as GPS pin distance.
import {normalizeCourseSelection} from './course-identity.js';
import {normalizeHole} from './course-weather-context.js';
const base='https://api.opengolfapi.org/v1/courses/';
function teeYardage(hole,selection){
 const yards=hole?.yardages;
 if(!yards||typeof yards!=='object')return null;
 const entries=Object.entries(yards);
 const key=selection.tee.providerTeeId.toLowerCase(),name=selection.tee.name.toLowerCase();
 const matched=entries.find(([k])=>k.toLowerCase()===key)||entries.find(([k])=>k.toLowerCase()===name);
 return matched?Number(matched[1]):null;
}
export function normalizeOpenGolfHoles(body,selection){
 const chosen=normalizeCourseSelection(selection);
 if(!chosen||chosen.course.provider!=='opengolfapi')return [];
 const raw=Array.isArray(body?.holes)?body.holes:[];
 const seen=new Set(),out=[];
 for(const source of raw){
  // Current provider uses `number`; keep the older documented fixture format too.
  // Conflicting aliases are ambiguous and must never be assigned to a hole.
  if(source?.number!=null&&source?.hole_number!=null&&Number(source.number)!==Number(source.hole_number))continue;
  const number=Number(source?.number??source?.hole_number),par=Number(source?.par);
  const yards=teeYardage(source,chosen);
  if(seen.has(number))continue;
  const normalized=normalizeHole({number,par,yards,hazards:[]});
  if(!normalized)continue;
  seen.add(number);out.push(normalized);
 }
 return out.sort((a,b)=>a.number-b.number);
}
export async function loadOpenGolfHoles(selection,{fetcher=fetch,signal}={}){
 const chosen=normalizeCourseSelection(selection);
 if(!chosen||chosen.course.provider!=='opengolfapi'||!/^[a-zA-Z0-9._:-]+$/.test(chosen.course.providerCourseId))return [];
 const response=await fetcher(base+encodeURIComponent(chosen.course.providerCourseId)+'/holes',{headers:{Accept:'application/json'},signal});
 if(!response.ok)throw Error('Scorecard unavailable ('+response.status+').');
 return normalizeOpenGolfHoles(await response.json(),chosen);
}
