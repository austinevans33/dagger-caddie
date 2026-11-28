import test from 'node:test';
import assert from 'node:assert/strict';
import {saveActiveRound} from '../app/61f9e9de0a/starters-desk-session.js';
import {getRoundEnvironment} from '../app/61f9e9de0a/round-environment.js';
import {safeCaddyEnvironment} from '../app/61f9e9de0a/caddy-environment-policy.js';
import {createShotRecordContext} from '../app/61f9e9de0a/shot-record-context.js';
import {measuredClubDispersion} from '../app/61f9e9de0a/measured-shot-dispersion.js';

const now=Date.parse('2026-11-27T18:00:00Z');
const selection={course:{provider:'opengolfapi',providerCourseId:'123',name:'Fixture Golf',region:'NC'},
 tee:{providerTeeId:'white',name:'White',totalYards:6300},holeNumber:1};
const weather={source:'open-meteo-model',observedAt:now-60000,windMph:9,windDegrees:220,temperatureF:65};
const ok=body=>({ok:true,json:async()=>body});
function memory(){
 const map=new Map();
 return {getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value)};
}

test('a new round on the same course and tee rejects the previous round’s response',async()=>{
 const storage=memory();
 saveActiveRound(storage,selection,now);
 let releaseHoles;
 const deferred=new Promise(resolve=>releaseHoles=resolve);
 const fetcher=url=>url.endsWith('/holes')?deferred:Promise.resolve({ok:false});
 const earlier=getRoundEnvironment({storage,fetcher,now});
 saveActiveRound(storage,selection,now+1);
 releaseHoles(ok({holes:[{number:1,par:4,yardages:{white:381}}]}));
 assert.deepEqual(await earlier,{state:'selection-changed',holes:[],weather:null,livePinDistance:false});
 const current=await getRoundEnvironment({storage,fetcher,now:now+1});
 assert.equal(current.selectedAt,now+1);
 assert.equal(current.holes[0].yards,381);
});

test('Caddy and shot context reject modeled conditions from another exact round',()=>{
 const active={selection,selectedAt:now};
 const earlier={selection,selectedAt:now-1,holes:[{number:1,par:4,yards:381}],
  weather,weatherState:'model-current',weatherSource:weather.source};
 assert.equal(safeCaddyEnvironment(active,earlier,now-1,now),null);
 const shot=createShotRecordContext(active,1,earlier,now-1,now);
 assert.equal(shot.roundSelectedAt,now);
 assert.equal(shot.weather,undefined);
 assert.equal(shot.scorecard,undefined);
 assert.equal(shot.measuredCarryYards,null);
 assert.equal(safeCaddyEnvironment(active,{...earlier,selectedAt:now},now-1,now).weather,weather);
});

test('dispersion uses only explicitly measured carry and signed lateral values of the same club',()=>{
 const mark=(club,carryYards,lateralYards,source='launch-monitor')=>({club,measurement:{source,carryYards,lateralYards}});
 const shots=[{club:'7 Iron',yards:165,horizontal:'Right'},mark('7 Iron',162,-10),mark('7 Iron',169,0),
  mark('7 Iron',165,12),mark('7 Iron',192,27,'simulated-ghost'),mark('8 Iron',145,10),
  mark('7 Iron',154,3.5,'unknown'),mark('7 Iron','171',0)];
 assert.deepEqual(measuredClubDispersion(shots,'7 Iron'),{count:3,carry:[162,169],lateral:[-10,12]});
 assert.equal(measuredClubDispersion(shots,'8 Iron'),null);
});
