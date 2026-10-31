// Resilient, provenance-preserving modeled weather cache for one selected course.
// Only a real Open-Meteo response can populate it. No location guessing.
import {normalizeCourse} from './course-identity.js';
export const COURSE_WEATHER_CACHE_KEY='dcc_course_weather_v1';
export const COURSE_WEATHER_MAX_AGE_MS=90*60*1000;
function identity(course){
 const c=normalizeCourse(course);
 return c&&c.provider==='opengolfapi'?c.provider+'|'+c.providerCourseId:null;
}
function validWeather(weather,now){
 return weather?.source==='open-meteo-model'&&weather.isObservation===false&&
  Number.isSafeInteger(weather.observedAt)&&weather.observedAt>0&&
  weather.observedAt<=now+5*60000&&now-weather.observedAt<=COURSE_WEATHER_MAX_AGE_MS&&
  Number.isFinite(weather.windMph)&&weather.windMph>=0&&weather.windMph<=150&&
  Number.isFinite(weather.windDegrees)&&weather.windDegrees>=0&&weather.windDegrees<360&&
  Number.isFinite(weather.temperatureF)&&weather.temperatureF>=-70&&weather.temperatureF<=150;
}
export function readCachedCourseWeather(storage,course,now=Date.now()){
 const key=identity(course);
 if(!key||!storage)return null;
 try{
  const raw=storage.getItem(COURSE_WEATHER_CACHE_KEY);
  if(!raw||raw.length>16000)return null;
  const cache=JSON.parse(raw);
  if(cache?.version!==1||!Array.isArray(cache.entries))return null;
  const item=cache.entries.find(x=>x?.key===key);
  return validWeather(item?.weather,now)?Object.freeze({...item.weather}):null;
 }catch{return null;}
}
export function saveCachedCourseWeather(storage,course,weather,now=Date.now()){
 const key=identity(course);
 if(!key||!storage||!validWeather(weather,now))return false;
 try{
  const raw=storage.getItem(COURSE_WEATHER_CACHE_KEY);
  let entries=[];
  if(raw&&raw.length<16000){
   const old=JSON.parse(raw);
   if(old?.version===1&&Array.isArray(old.entries))entries=old.entries;
  }
  entries=entries.filter(x=>x&&x.key!==key&&typeof x.key==='string').slice(0,7);
  entries.unshift({key,weather:{
   source:'open-meteo-model',isObservation:false,observedAt:weather.observedAt,
   windMph:weather.windMph,windDegrees:weather.windDegrees,temperatureF:weather.temperatureF
  }});
  storage.setItem(COURSE_WEATHER_CACHE_KEY,JSON.stringify({version:1,entries}));
  return true;
 }catch{return false;}
}
