import test from 'node:test';import assert from 'node:assert/strict';import {createCaddyCourseBriefing} from '../staging-app/caddy-course-briefing.js';
const selected={selection:{course:{name:'Pine Example'},tee:{name:'Blue'}},holes:[{number:4,par:4,yards:390}],weather:{source:'open-meteo-model',windMph:10,windDegrees:180,temperatureF:75},weatherState:'model-current'};
test('only selected hole and verified modeled conditions appear',()=>{
 const b=createCaddyCourseBriefing(selected,4);
 assert.match(b,/390 yards/);assert.match(b,/modeled 10 mph/);assert.match(b,/NOT a live target\/pin distance/);
});
test('missing hole and weather never fabricate data',()=>{
 const b=createCaddyCourseBriefing({...selected,weather:null,holes:[]},4);
 assert.match(b,/not verified/);assert.match(b,/Weather unavailable/);assert.doesNotMatch(b,/390 yards/);
});
test('invalid hole selection cannot be used as caddy context',()=>assert.equal(createCaddyCourseBriefing(selected,0),null));
