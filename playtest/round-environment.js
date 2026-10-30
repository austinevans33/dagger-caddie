// Shared read-only round environment. Never infer course location from device GPS.
// Every asynchronous result is bound to the same selected course and tee.
import {readActiveRound} from './starters-desk-session.js';
import {sameCourseSelection} from './course-identity.js';
import {getActiveCourseContext} from './active-course-context.js';
import {loadCourseLocation} from './course-location.js';
import {loadOpenMeteoWeather} from './open-meteo-weather.js';
export async function getRoundEnvironment({storage,fetcher,signal,now=Date.now()}={}){
 const active=readActiveRound(storage);
 if(!active)return Object.freeze({state:'not-selected',holes:[],weather:null,livePinDistance:false});
 const selection=active.selection;
 const scorecard=await getActiveCourseContext({storage,fetcher,signal,now});
 const same=()=>{const latest=readActiveRound(storage);return !!latest&&sameCourseSelection(latest.selection,selection);};
 if(!same())return Object.freeze({state:'selection-changed',holes:[],weather:null,livePinDistance:false});
 let weather=null,weatherState='unavailable';
 try{
  const location=await loadCourseLocation(selection.course,{fetcher,signal});
  if(!same())return Object.freeze({state:'selection-changed',holes:[],weather:null,livePinDistance:false});
  if(location){
   weather=await loadOpenMeteoWeather(location.coordinates,{fetcher,signal,now});
   weatherState=weather?'model-current':'model-unavailable';
  }else weatherState='location-unavailable';
 }catch{weatherState='unavailable';}
 if(!same())return Object.freeze({state:'selection-changed',holes:[],weather:null,livePinDistance:false});
 return Object.freeze({
  state:scorecard.state,selection,holes:scorecard.holes||[],
  scorecardSource:scorecard.source||null,weather,weatherState,
  weatherSource:weather?.source||null,livePinDistance:false
 });
}
