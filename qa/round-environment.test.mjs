import test from 'node:test';
import assert from 'node:assert/strict';
import {getRoundEnvironment} from '../staging-app/round-environment.js';
import {saveActiveRound} from '../staging-app/starters-desk-session.js';
const now=Date.parse('2026-10-30T17:00:00Z');
const selected={course:{provider:'opengolfapi',providerCourseId:'abc',name:'Example',region:'NC'},tee:{providerTeeId:'blue',name:'Blue',totalYards:6300},holeNumber:1};
function memory(){const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};}
const model={current:{time:'2026-10-30T16:45',wind_speed_10m:12,wind_direction_10m:270,temperature_2m:72},current_units:{wind_speed_10m:'mph',temperature_2m:'°F'}};
function response(value){return {ok:true,json:async()=>value};}
test('round context contains real tee-specific hole and modeled weather separately',async()=>{
 const storage=memory();saveActiveRound(storage,selected);
 const fetcher=async url=>{
  if(url.endsWith('/holes'))return response({holes:[{hole_number:1,par:4,yardages:{blue:402}}]});
  if(url.endsWith('/abc'))return response({id:'abc',latitude:35.1,longitude:-78.9});
  if(url.includes('open-meteo.com'))return response(model);
  throw Error('Unexpected endpoint '+url);
 };
 const env=await getRoundEnvironment({storage,fetcher,now});
 assert.equal(env.state,'ready');assert.equal(env.holes[0].yards,402);
 assert.equal(env.weather.windMph,12);assert.equal(env.weatherSource,'open-meteo-model');
 assert.equal(env.livePinDistance,false);
});
test('missing course location never triggers made-up weather',async()=>{
 const storage=memory();saveActiveRound(storage,selected);
 let weatherCalls=0;
 const fetcher=async url=>{
  if(url.endsWith('/holes'))return response({holes:[{hole_number:1,par:4,yardages:{blue:402}}]});
  if(url.endsWith('/abc'))return response({id:'abc',latitude:null,longitude:null});
  weatherCalls++;throw Error('Unexpected weather call');
 };
 const env=await getRoundEnvironment({storage,fetcher,now});
 assert.equal(env.weather,null);assert.equal(env.weatherState,'location-unavailable');
 assert.equal(weatherCalls,0);
});
test('course switch during weather request discards old environment',async()=>{
 const storage=memory();saveActiveRound(storage,selected);
 const fetcher=async url=>{
  if(url.endsWith('/holes'))return response({holes:[{hole_number:1,par:4,yardages:{blue:402}}]});
  if(url.endsWith('/abc'))return response({id:'abc',latitude:35.1,longitude:-78.9});
  if(url.includes('open-meteo.com')){saveActiveRound(storage,{...selected,course:{...selected.course,providerCourseId:'new'}});return response(model);}
  throw Error('Unexpected endpoint');
 };
 const env=await getRoundEnvironment({storage,fetcher,now});
 assert.equal(env.state,'selection-changed');assert.equal(env.weather,null);assert.deepEqual(env.holes,[]);
});
