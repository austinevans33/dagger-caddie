// OpenGolfAPI catalog adapter: public read-only API, no credentials or writes.
// Provider attribution and ODbL terms: https://opengolfapi.org
import {normalizeCatalog} from './course-catalog.js';
const BASE='https://api.opengolfapi.org/v1/courses';
const provider='opengolfapi';
const validId=x=>typeof x==='string'||typeof x==='number'?String(x).trim().slice(0,80):'';
function courseOf(x){
 const providerCourseId=validId(x?.id);
 if(!providerCourseId)return null;
 return {provider,providerCourseId,name:String(x.course_name||'').trim(),region:[x.city,x.state].filter(Boolean).join(', ')};
}
function teesOf(detail){
 const raw=Array.isArray(detail?.tees)?detail.tees:[];
 return raw.map((t,i)=>({
  providerTeeId:validId(t.id??t.tee_id??t.name??t.tee_name??''),
  name:String(t.name??t.tee_name??'').trim(),
  totalYards:Number(t.total_yardage??t.total_yards??t.yardage??t.yards??NaN)
 })).filter(t=>t.providerTeeId&&t.name&&Number.isInteger(t.totalYards));
}
export function searchResultCourses(body){
 const rows=Array.isArray(body?.courses)?body.courses:[];
 return rows.slice(0,12).map(courseOf).filter(Boolean).filter(x=>x.name&&x.region);
}
export function courseDetailToCatalog(course,detail){
 if(!course||!detail)return [];
 if(validId(detail.id)!==course.providerCourseId)return [];
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
 const url=BASE+'/search?q='+encodeURIComponent(q)+'&limit=12';
 const response=await fetcher(url,{headers:{Accept:'application/json'},signal});
 if(!response.ok)throw Error('Course search unavailable ('+response.status+').');
 return searchResultCourses(await response.json());
}
export async function loadOpenGolfTees(course,{fetcher=fetch,signal}={}){
 if(course?.provider!==provider||!course.providerCourseId||!/^[a-zA-Z0-9._:-]+$/.test(course.providerCourseId))return [];
 const url=BASE+'/'+encodeURIComponent(course.providerCourseId);
 const response=await fetcher(url,{headers:{Accept:'application/json'},signal});
 if(!response.ok)throw Error('Course details unavailable ('+response.status+').');
 return courseDetailToCatalog(course,await response.json());
}
