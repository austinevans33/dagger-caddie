import test from 'node:test';import assert from 'node:assert/strict';
import {normalizeCourseCoordinates,normalizeOpenMeteoCurrent,loadOpenMeteoWeather} from '../staging-app/open-meteo-weather.js';
const now=Date.parse('2026-10-30T17:00:00Z');
const modeled={current:{time:'2026-10-30T16:45',wind_speed_10m:11,wind_direction_10m:240,temperature_2m:67},current_units:{wind_speed_10m:'mph',temperature_2m:'°F'}};
test('weather returns verified-provider model values with provenance',async()=>{
 let endpoint='';
 const conditions=await loadOpenMeteoWeather({latitude:35.05,longitude:-78.95},{now,fetcher:async url=>{endpoint=url;return {ok:true,json:async()=>modeled};}});
 assert.match(endpoint,/timezone=GMT/);
 assert.match(endpoint,/latitude=35.05/);
 assert.equal(conditions.windMph,11);assert.equal(conditions.temperatureF,67);
 assert.equal(conditions.source,'open-meteo-model');assert.equal(conditions.isObservation,false);
});
test('invalid coordinates prevent network calls',async()=>{
 let called=false;
 assert.equal(normalizeCourseCoordinates({latitude:200,longitude:-78}),null);
 assert.equal(await loadOpenMeteoWeather({latitude:'35',longitude:-78},{fetcher:()=>{called=true;}}),null);
 assert.equal(called,false);
});
test('reject stale modeled weather, wrong units and missing wind values',()=>{
 assert.equal(normalizeOpenMeteoCurrent({...modeled,current:{...modeled.current,time:'2026-10-30T14:00'}},now),null);
 assert.equal(normalizeOpenMeteoCurrent({...modeled,current_units:{...modeled.current_units,wind_speed_10m:'km/h'}},now),null);
 assert.equal(normalizeOpenMeteoCurrent({...modeled,current:{...modeled.current,wind_speed_10m:null}},now),null);
 assert.equal(normalizeOpenMeteoCurrent({...modeled,current:{...modeled.current,time:'2026-10-30T18:00'}},now),null);
});
