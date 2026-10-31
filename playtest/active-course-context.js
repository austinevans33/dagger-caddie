// Shared course context for Dagger's Caddies, Games and future shot tracking.
// Never invent missing hole data or imply live pin distance.
import {readActiveRound} from './starters-desk-session.js';
import {loadOpenGolfHoles} from './opengolf-holes.js?v=premium-paper-9';
import {sameCourseSelection} from './course-identity.js';
import {readCachedCourseScorecard,saveCachedCourseScorecard} from './course-scorecard-cache.js';
const CACHED='dcc_course_scorecard_v1';
export function readCourseScorecard(storage,selection){
 const multi=readCachedCourseScorecard(storage,selection);
 if(multi)return multi;
 try{
  const saved=JSON.parse(storage.getItem(CACHED)||'null');
  if(!saved||saved.version!==1||!sameCourseSelection(saved.selection,selection))return null;
  if(!Array.isArray(saved.holes)||saved.holes.length>18)return null;
  // Cache is only for a previously verified provider response for this exact selection.
  const holes=saved.holes.filter(h=>Number.isInteger(h?.number)&&h.number>=1&&h.number<=18&&Number.isInteger(h.par)&&Number.isInteger(h.yards)&&h.yards>=50&&h.yards<=800);
  if(holes.length!==saved.holes.length||new Set(holes.map(h=>h.number)).size!==holes.length)return null;
  return {holes,loadedAt:saved.loadedAt,course:selection.course,tee:selection.tee,source:'opengolfapi-scorecard',livePinDistance:false};
 }catch{return null;}
}
export async function getActiveCourseContext({storage,fetcher,signal,now=Date.now(),notify}={}){
 const active=readActiveRound(storage);
 if(!active)return {state:'not-selected',holes:[],livePinDistance:false};
 const selection=active.selection;
 let holes=[];
 try{
  holes=await loadOpenGolfHoles(selection,{fetcher,signal});
  // A selection made while a request is in flight must not receive another course's holes.
  const latest=readActiveRound(storage);
  if(!latest||!sameCourseSelection(latest.selection,selection))return {state:'selection-changed',holes:[],livePinDistance:false};
  if(!holes.length)return {state:'no-verified-holes',selection,holes:[],livePinDistance:false};
  const result={version:1,selection,holes,loadedAt:now};
  // Retain the legacy single-course cache for existing installations, while
  // keeping a bounded per-course/tee history for returning players.
  saveCachedCourseScorecard(storage,selection,holes,now);
  try{storage.setItem(CACHED,JSON.stringify(result));}catch{/* Memory-only success. */}
  const context={state:'ready',selection,holes,source:'opengolfapi-scorecard',livePinDistance:false,loadedAt:now};
  if(typeof notify==='function')notify(context);
  return context;
 }catch(error){
  const cached=readCourseScorecard(storage,selection);
  if(cached)return {state:'offline-cached',selection,...cached};
  return {state:'unavailable',selection,holes:[],livePinDistance:false,error:String(error?.message||'Course data unavailable')};
 }
}
