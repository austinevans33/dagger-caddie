// Bounded offline cache of *provider-verified* hole scorecards by course and tee.
// Retain multiple courses for golf trips; never infer missing hole facts.
import {normalizeCourseSelection} from './course-identity.js';
export const COURSE_SCORECARD_CACHE_KEY='dcc_course_scorecards_v2';
const LIMIT=12;
function identity(selection){
 const s=normalizeCourseSelection(selection);
 return s?s.course.provider+'|'+s.course.providerCourseId+'|'+s.tee.providerTeeId:null;
}
function validHoles(holes){
 if(!Array.isArray(holes)||holes.length<1||holes.length>18)return null;
 const seen=new Set(),out=[];
 for(const h of holes){
  if(!Number.isInteger(h?.number)||h.number<1||h.number>18||seen.has(h.number)||
   !Number.isInteger(h.par)||h.par<3||h.par>6||
   !Number.isInteger(h.yards)||h.yards<50||h.yards>800)return null;
  seen.add(h.number);
  out.push({number:h.number,par:h.par,yards:h.yards,hazards:[]});
 }
 return out.sort((a,b)=>a.number-b.number);
}
function records(storage){
 try{
  const raw=storage.getItem(COURSE_SCORECARD_CACHE_KEY);
  if(!raw||raw.length>60000)return [];
  const data=JSON.parse(raw);
  return data?.version===2&&Array.isArray(data.entries)?data.entries.slice(0,LIMIT):[];
 }catch{return [];}
}
export function readCachedCourseScorecard(storage,selection){
 const key=identity(selection);
 if(!key)return null;
 const entry=records(storage).find(e=>e?.key===key);
 const holes=validHoles(entry?.holes);
 if(!holes||!Number.isSafeInteger(entry?.loadedAt)||entry.loadedAt<=0)return null;
 return {holes,loadedAt:entry.loadedAt,course:selection.course,tee:selection.tee,
  source:'opengolfapi-scorecard',livePinDistance:false};
}
export function saveCachedCourseScorecard(storage,selection,holes,loadedAt=Date.now()){
 const key=identity(selection),safe=validHoles(holes);
 if(!key||!safe||!Number.isSafeInteger(loadedAt)||loadedAt<=0)return false;
 const existing=records(storage).filter(e=>e?.key!==key&&typeof e?.key==='string');
 const entries=[{key,holes:safe,loadedAt},...existing].slice(0,LIMIT);
 try{storage.setItem(COURSE_SCORECARD_CACHE_KEY,JSON.stringify({version:2,entries}));return true;}
 catch{return false;}
}
