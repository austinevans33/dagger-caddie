// Shared read-only round environment. Never infer course location from device GPS.
// Every asynchronous result is bound to the same selected course and tee.
import {readActiveRound,sameActiveRound} from './starters-desk-session.js';
import {getActiveCourseContext} from './active-course-context.js?v=cached-fallback-16';
import {loadCourseLocation} from './course-location.js?v=location-shapes-23';
import {loadOpenMeteoWeather} from './open-meteo-weather.js';
import {readCachedCourseWeather,saveCachedCourseWeather} from './course-weather-cache.js';
const pendingByStorage=new WeakMap();
export function getRoundEnvironment(options={}){
 const {storage,fetcher,signal,now}=options;
 const active=readActiveRound(storage);
 if(!active||fetcher||signal||now!==undefined)return readRoundEnvironment(active,options);
 const existing=pendingByStorage.get(storage);
 if(existing&&sameActiveRound(active,existing.active))return existing.promise;
 const promise=readRoundEnvironment(active,options).finally(()=>{
  if(pendingByStorage.get(storage)?.promise===promise)pendingByStorage.delete(storage);
 });
 pendingByStorage.set(storage,{active,promise});
 return promise;
}
async function readRoundEnvironment(active,{storage,fetcher,signal,now=Date.now()}){

 if(!active)return Object.freeze({state:'not-selected',holes:[],weather:null,livePinDistance:false});
 const selection=active.selection;
 // Course scorecard and course-coordinate lookup are independent public reads.
 // Run them concurrently to avoid three serial network waits on the first tee.
 const same=()=>sameActiveRound(active,readActiveRound(storage));
 const scorecardTask=getActiveCourseContext({storage,fetcher,signal,now});
 const weatherTask=(async()=>{
  try{
   const location=await loadCourseLocation(selection.course,{fetcher,signal});
   if(!same())return {weather:null,weatherState:'selection-changed'};
   if(!location){
    const cached=readCachedCourseWeather(storage,selection.course,now);
    return {weather:cached,weatherState:cached?'model-cached':'location-unavailable'};
   }
   const weather=await loadOpenMeteoWeather(location.coordinates,{fetcher,signal,now});
   if(weather){
    // Never cache a response if the player changed course while it loaded.
    if(same())saveCachedCourseWeather(storage,selection.course,weather,now);
    return {weather,weatherState:'model-current'};
   }
   const cached=readCachedCourseWeather(storage,selection.course,now);
   return {weather:cached,weatherState:cached?'model-cached':'model-unavailable'};
  }catch{
   const cached=readCachedCourseWeather(storage,selection.course,now);
   return {weather:cached,weatherState:cached?'model-cached':'unavailable'};
  }
 })();
 const [scorecard,{weather,weatherState}]=await Promise.all([scorecardTask,weatherTask]);
 if(!same())return Object.freeze({state:'selection-changed',holes:[],weather:null,livePinDistance:false});
 return Object.freeze({
  state:scorecard.state,selection,selectedAt:active.selectedAt,holes:scorecard.holes||[],
  scorecardSource:scorecard.source||null,weather,weatherState,
  weatherSource:weather?.source||null,livePinDistance:false
 });
}
