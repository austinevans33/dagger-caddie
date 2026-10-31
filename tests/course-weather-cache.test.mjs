import test from 'node:test';
import assert from 'node:assert/strict';
import {readCachedCourseWeather,saveCachedCourseWeather} from '../playtest/course-weather-cache.js';
import {getRoundEnvironment} from '../playtest/round-environment.js';
import {saveActiveRound} from '../playtest/starters-desk-session.js';
import {buildCaddyCourseFacts} from '../playtest/caddy-course-facts.js';
import {safeCaddyEnvironment} from '../playtest/caddy-environment-policy.js';
const now=Date.parse('2026-10-31T12:00:00Z');
const course={provider:'opengolfapi',providerCourseId:'123',name:'Whispering Pines',region:'NC'};
const tee={providerTeeId:'white',name:'White',totalYards:6300};
const selection={course,tee,holeNumber:1};
const weather={source:'open-meteo-model',isObservation:false,observedAt:now-5*60000,windMph:11,windDegrees:265,temperatureF:68};
function storage(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};}
const ok=body=>({ok:true,json:async()=>body});
test('Recent modeled weather survives transient provider failure for the same course',async()=>{
 const store=storage();saveActiveRound(store,selection,now);
 assert.equal(saveCachedCourseWeather(store,course,weather,now),true);
 const fetcher=async url=>{
  if(url.endsWith('/holes'))return ok({holes:[{number:1,par:4,yardages:{white:352}}]});
  throw Error('Offline weather provider');
 };
 const result=await getRoundEnvironment({storage:store,fetcher,now});
 assert.equal(result.weatherState,'model-cached');
 assert.equal(result.weather.windMph,11);
 assert.equal(result.weather.observedAt,weather.observedAt);
 const safe=safeCaddyEnvironment({selection},result,now,now+1000);
 const facts=buildCaddyCourseFacts(safe,1);
 assert.equal(facts.weather.cached,true);
 assert.equal(facts.weather.windFromDegrees,265);
 assert.equal(facts.teeYards,352);
});
test('Expired weather is never supplied to Caddy as fresh conditions',()=>{
 const store=storage();
 assert.equal(saveCachedCourseWeather(store,course,{...weather,observedAt:now-91*60000},now),false);
 assert.equal(readCachedCourseWeather(store,course,now),null);
 assert.equal(saveCachedCourseWeather(store,course,weather,now),true);
 assert.equal(readCachedCourseWeather(store,course,now+91*60000),null);
});
test('Weather from another course is not substituted',()=>{
 const store=storage();saveCachedCourseWeather(store,course,weather,now);
 assert.equal(readCachedCourseWeather(store,{...course,providerCourseId:'456'},now),null);
});
test('Invalid weather or storage failures do not fabricate observations',()=>{
 const store=storage();
 assert.equal(saveCachedCourseWeather(store,course,{...weather,windDegrees:500},now),false);
 assert.equal(saveCachedCourseWeather(store,course,{...weather,isObservation:true},now),false);
 assert.equal(readCachedCourseWeather(store,course,now),null);
 assert.equal(saveCachedCourseWeather({setItem(){throw Error('private mode');},getItem(){return null;}},course,weather,now),false);
});
test('A fresh provider response replaces the cached estimate',async()=>{
 const store=storage();saveActiveRound(store,selection,now);saveCachedCourseWeather(store,course,weather,now);
 const fetcher=async url=>{
  if(url.endsWith('/holes'))return ok({holes:[{number:1,par:4,yardages:{white:352}}]});
  if(url.endsWith('/123'))return ok({id:'123',latitude:35.2,longitude:-79.1});
  if(url.includes('api.open-meteo.com'))return ok({
   current_units:{wind_speed_10m:'mph',temperature_2m:'°F'},
   current:{time:'2026-10-31T11:45',wind_speed_10m:8,wind_direction_10m:245,temperature_2m:67}
  });
  throw Error('Unexpected request '+url);
 };
 const result=await getRoundEnvironment({storage:store,fetcher,now});
 assert.equal(result.weatherState,'model-current');
 assert.equal(result.weather.windMph,8);
 assert.equal(readCachedCourseWeather(store,course,now).windMph,8);
});
