// Prevent stale modeled weather or a previous course from entering Caddy prompts.
// This is a freshness policy, not a claim of live on-course measurements.
import {sameCourseSelection} from './course-identity.js';
export const CADDY_ENVIRONMENT_MAX_AGE_MS=15*60*1000;
export function needsCaddyEnvironmentRefresh(active,environment,fetchedAt,now=Date.now()){
 if(!active?.selection)return false;
 if(!environment?.selection||!sameCourseSelection(active.selection,environment.selection))return true;
 if(!Number.isFinite(fetchedAt)||fetchedAt<=0||fetchedAt>now)return true;
 return now-fetchedAt>=CADDY_ENVIRONMENT_MAX_AGE_MS;
}
export function safeCaddyEnvironment(active,environment,fetchedAt,now=Date.now()){
 if(!active?.selection||!environment?.selection)return null;
 if(needsCaddyEnvironmentRefresh(active,environment,fetchedAt,now))return null;
 const weather=environment.weather;
 const validWeather=weather&&environment.weatherState==='model-current'&&
  Number.isFinite(weather.observedAt)&&weather.observedAt<=now+5*60000&&
  now-weather.observedAt<=90*60000;
 return validWeather?environment:{...environment,weather:null,weatherState:'unavailable',weatherSource:null};
}
