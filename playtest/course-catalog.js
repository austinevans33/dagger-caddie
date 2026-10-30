// Provider-neutral course catalog adapter. Catalog entries must be supplied by
// an approved backend/provider: this module makes no requests or claims of coverage.
import {normalizeCourse,normalizeTee} from './course-identity.js';
export function normalizeCatalog(records){
 if(!Array.isArray(records)||records.length>250)return [];
 const found=new Set(),out=[];
 for(const record of records){
  const course=normalizeCourse(record?.course);
  if(!course||!Array.isArray(record.tees)||record.tees.length>12)continue;
  const key=course.provider+':'+course.providerCourseId;
  if(found.has(key))continue;
  const seenTees=new Set(),tees=[];
  for(const candidate of record.tees){
   const tee=normalizeTee(candidate);
   if(!tee||seenTees.has(tee.providerTeeId))continue;
   seenTees.add(tee.providerTeeId);tees.push(tee);
  }
  if(!tees.length)continue;
  found.add(key);out.push(Object.freeze({course,tees:Object.freeze(tees)}));
 }
 return out;
}
export function searchCatalog(catalog,query,{limit=12}={}){
 const term=String(query||'').trim().toLocaleLowerCase();
 if(term.length<2||term.length>100)return [];
 return normalizeCatalog(catalog).filter(x=>(x.course.name+' '+x.course.region).toLocaleLowerCase().includes(term)).slice(0,Math.max(1,Math.min(20,limit)));
}
