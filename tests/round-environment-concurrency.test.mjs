import test from 'node:test';
import assert from 'node:assert/strict';
import {saveActiveRound} from '../playtest/starters-desk-session.js';
import {getRoundEnvironment} from '../playtest/round-environment.js';
const now=Date.parse('2026-10-31T12:00:00Z');
function storage(){
 const m=new Map();
 return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};
}
const selection={course:{provider:'opengolfapi',providerCourseId:'123',name:'Fixture Golf',region:'NC'},tee:{providerTeeId:'white',name:'White',totalYards:6300},holeNumber:1};
const ok=body=>({ok:true,json:async()=>body});
test('Scorecard and weather lookup start independently, with no made-up pin distance',async()=>{
 const store=storage();assert.equal(saveActiveRound(store,selection,now),true);
 const requested=[];let releaseHoles;
 const holesPending=new Promise(resolve=>releaseHoles=resolve);
 const fetcher=async url=>{
  requested.push(url);
  if(url.endsWith('/holes'))return holesPending;
  if(url.endsWith('/123'))return ok({id:'123',latitude:35.2,longitude:-79.1});
  if(url.includes('api.open-meteo.com'))return ok({
   current_units:{wind_speed_10m:'mph',temperature_2m:'°F'},
   current:{time:'2026-10-31T11:45',wind_speed_10m:8,wind_direction_10m:245,temperature_2m:67}
  });
  throw Error('Unexpected URL: '+url);
 };
 const resultPromise=getRoundEnvironment({storage:store,fetcher,now});
 // Weather must be requested while the hole lookup remains unresolved.
 await new Promise(resolve=>setImmediate(resolve));
 assert.ok(requested.some(url=>url.endsWith('/holes')));
 assert.ok(requested.some(url=>url.endsWith('/123')));
 assert.ok(requested.some(url=>url.includes('api.open-meteo.com')));
 releaseHoles(ok({holes:[{number:1,par:4,yardages:{white:381}}]}));
 const result=await resultPromise;
 assert.equal(result.state,'ready');
 assert.equal(result.holes[0].yards,381);
 assert.equal(result.weather.windMph,8);
 assert.equal(result.livePinDistance,false);
});
test('A changed course during an in-flight response never receives the old course data',async()=>{
 const store=storage();saveActiveRound(store,selection,now);
 let releaseHoles;const pending=new Promise(resolve=>releaseHoles=resolve);
 const fetcher=async url=>{
  if(url.endsWith('/holes'))return pending;
  if(url.endsWith('/123'))return ok({id:'123',latitude:35.2,longitude:-79.1});
  if(url.includes('open-meteo.com'))return ok({current_units:{wind_speed_10m:'mph',temperature_2m:'°F'},current:{time:'2026-10-31T11:45',wind_speed_10m:8,wind_direction_10m:245,temperature_2m:67}});
  throw Error('Unexpected URL');
 };
 const resultPromise=getRoundEnvironment({storage:store,fetcher,now});
 saveActiveRound(store,{...selection,course:{...selection.course,providerCourseId:'456'}},now+1);
 releaseHoles(ok({holes:[{number:1,par:4,yardages:{white:381}}]}));
 const result=await resultPromise;
 assert.equal(result.state,'selection-changed');
 assert.equal(result.weather,null);
 assert.equal(result.holes.length,0);
});
