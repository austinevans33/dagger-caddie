// Open-Meteo current model conditions adapter — no phone GPS, no invented location.
// Current data are modeled estimates, not on-course observations.
import {normalizeWeather} from './course-weather-context.js';
export function normalizeCourseCoordinates(input){
 const lat=input?.latitude,lon=input?.longitude;
 if(typeof lat!=='number'||typeof lon!=='number'||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return null;
 return Object.freeze({latitude:lat,longitude:lon});
}
export function normalizeOpenMeteoCurrent(body,now=Date.now()){
 const c=body?.current;
 if(!c||typeof c.time!=='string'||body?.current_units?.wind_speed_10m!=='mph'||body?.current_units?.temperature_2m!=='°F')return null;
 // Request UTC timezone, so provider timestamps need no local-time guesswork.
 const observedAt=Date.parse(c.time+'Z');
 if(!Number.isFinite(observedAt)||observedAt>now+5*60000||now-observedAt>90*60000)return null;
 if(typeof c.wind_speed_10m!=='number'||typeof c.wind_direction_10m!=='number'||typeof c.temperature_2m!=='number')return null;
 const w=normalizeWeather({observedAt,windMph:c.wind_speed_10m,windDegrees:c.wind_direction_10m,temperatureF:c.temperature_2m},now);
 return w?Object.freeze({...w,source:'open-meteo-model',isObservation:false}):null;
}
export async function loadOpenMeteoWeather(coordinates,{fetcher=fetch,signal,now=Date.now()}={}){
 const loc=normalizeCourseCoordinates(coordinates);
 if(!loc)return null;
 const url='https://api.open-meteo.com/v1/forecast?latitude='+encodeURIComponent(loc.latitude)+
 '&longitude='+encodeURIComponent(loc.longitude)+
 '&current=temperature_2m,wind_speed_10m,wind_direction_10m'+
 '&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=GMT';
 const response=await fetcher(url,{headers:{Accept:'application/json'},signal});
 if(!response.ok)throw Error('Weather provider unavailable ('+response.status+').');
 return normalizeOpenMeteoCurrent(await response.json(),now);
}
