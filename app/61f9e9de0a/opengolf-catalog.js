// OpenGolfAPI catalog adapter: public read-only API, no credentials or writes.
// Provider attribution and ODbL terms: https://opengolfapi.org
import {BAYONET_TEES,isBayonetCourse} from './bayonet-verified-scorecard.js';
import {normalizeCatalog} from './course-catalog.js';
import {founderCatalogRecords,founderTeesForCourse} from './founders-verified-scorecards.js';
const BASE='https://api.opengolfapi.org/v1/courses';
const provider='opengolfapi';
const SEARCH_LIMIT=40; // Provider-backed results, never synthetic courses.
const validId=x=>typeof x==='string'||typeof x==='number'?String(x).trim().slice(0,80):'';
function courseOf(x){
 const providerCourseId=validId(x?.id);
 if(!providerCourseId)return null;
 return {provider,providerCourseId,name:String(x.course_name||'').trim(),region:[x.city,x.state].filter(Boolean).join(', ')};
}
function teesOf(detail){
 const raw=Array.isArray(detail?.tees)?detail.tees:Array.isArray(detail)?detail:[];
 return raw.map((t,i)=>({
  providerTeeId:validId(t.id??t.tee_id??t.name??t.tee_name??''),
  name:String(t.name??t.tee_name??'').trim(),
  totalYards:Number(t.total_yardage??t.total_yards??t.yardage??t.yards??NaN)
 })).filter(t=>t.providerTeeId&&t.name&&Number.isInteger(t.totalYards));
}
export function searchResultCourses(body){
 const rows=Array.isArray(body?.courses)?body.courses:[];
 return rows.slice(0,SEARCH_LIMIT).map(courseOf).filter(Boolean).filter(x=>x.name&&x.region);
}
export function courseDetailToCatalog(course,detail){
 if(!course||!detail)return [];
 if(detail.id!=null&&validId(detail.id)!==course.providerCourseId)return [];
 return normalizeCatalog([{course,tees:teesOf(detail)}]);
}
async function getJSON(url,fetcher){
 const response=await fetcher(url,{headers:{Accept:'application/json'}});
 if(!response.ok)throw Error('Course service unavailable ('+response.status+').');
 return response.json();
}
export async function searchOpenGolfCourses(query,{fetcher=fetch,signal}={}){
 const q=String(query||'').trim();
 if(q.length<2||q.length>100)return [];
 const local=founderCatalogRecords(q);
 const url=BASE+'/search?q='+encodeURIComponent(q)+'&limit='+SEARCH_LIMIT;
 try{
  const response=await fetcher(url,{headers:{Accept:'application/json'},signal});
  if(!response.ok)throw Error('Course search unavailable ('+response.status+').');
  const remote=searchResultCourses(await response.json());
  const normalized=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const filtered=remote.filter(course=>!local.some(f=>{
   const region=normalized(course.region),city=normalized(f.region.split(',')[0]);
   const remoteName=normalized(course.name),founderName=normalized(f.name).replace(/^the/,'');
   return region.includes(city)&&(remoteName.includes(founderName)||founderName.includes(remoteName));
  }));
  return [...local,...filtered];
 }catch(error){
  if(signal?.aborted)throw error;
  if(local.length)return local;
  throw error;
 }
}
export async function loadOpenGolfTees(course,{fetcher=fetch,signal}={}){
 const local=founderTeesForCourse(course);
 if(local.length)return normalizeCatalog([{course,tees:local}]);
 if(course?.provider!==provider||!course.providerCourseId||!/^[a-zA-Z0-9._:-]+$/.test(course.providerCourseId))return [];
 // The matched club scorecard and provider disagree on Bayonet tee totals.
 // Offer a coherent club tee row for new check-ins. Saved rounds retain their tee.
 if(isBayonetCourse(course)){
  const tees=Object.entries(BAYONET_TEES).map(([providerTeeId,tee])=>({
   providerTeeId,name:tee.label,totalYards:tee.total
  }));
  return normalizeCatalog([{course,tees}]);
 }
 const url=BASE+'/'+encodeURIComponent(course.providerCourseId)+'/tees';
 const response=await fetcher(url,{headers:{Accept:'application/json'},signal});
 if(!response.ok)throw Error('Course details unavailable ('+response.status+').');
 return courseDetailToCatalog(course,await response.json());
}
