// Shared read-only round environment. Never infer course location from device GPS.
// Every asynchronous result is bound to the same selected course and tee.
import {readActiveRound} from './starters-desk-session.js';
import {sameCourseSelection} from './course-identity.js';
import {getActiveCourseContext} from './active-course-context.js?v=multi-course-15';
import {loadCourseLocation} from './course-location.js';
import {loadOpenMeteoWeather} from './open-meteo-weather.js';
export async function getRoundEnvironment({storage,fetcher,signal,now=Date.now()}={}){
 const active=readActiveRound(storage);
 if(!active)return Object.freeze({state:'not-selected',holes:[],weather:null,livePinDistance:false});
 const selection=active.selection;
 // Course scorecard and course-coordinate lookup are independent public reads.
 // Run them concurrently to avoid three serial network waits on the first tee.
 const same=()=>{const latest=readActiveRound(storage);return !!latest&&sameCourseSelection(latest.selection,selection);};
 const scorecardTask=getActiveCourseContext({storage,fetcher,signal,now});
 const weatherTask=(async()=>{
  try{
   const location=await loadCourseLocation(selection.course,{fetcher,signal});
   if(!same())return {weather:null,weatherState:'selection-changed'};
   if(!location)return {weather:null,weatherState:'location-unavailable'};
   const weather=await loadOpenMeteoWeather(location.coordinates,{fetcher,signal,now});
   return {weather,weatherState:weather?'model-current':'model-unavailable'};
  }catch{return {weather:null,weatherState:'unavailable'};}
 })();
 const [scorecard,{weather,weatherState}]=await Promise.all([scorecardTask,weatherTask]);
 if(!same())return Object.freeze({state:'selection-changed',holes:[],weather:null,livePinDistance:false});
 return Object.freeze({
  state:scorecard.state,selection,holes:scorecard.holes||[],
  scorecardSource:scorecard.source||null,weather,weatherState,
  weatherSource:weather?.source||null,livePinDistance:false
 });
}
