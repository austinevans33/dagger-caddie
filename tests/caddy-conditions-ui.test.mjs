import test from 'node:test';
import assert from 'node:assert/strict';
import {describeCaddyConditions} from '../playtest/caddy-conditions-ui.js';
const now=Date.parse('2026-10-31T12:00:00Z');
const active={selection:{course:{name:'Whispering Pines — Pines Course'},tee:{name:'White'},holeNumber:1},holeNumber:7};
const env={state:'ready',holes:[{number:7,par:4,yards:382}],weatherState:'model-current',weather:{source:'open-meteo-model',observedAt:now-5*60000,windMph:12.5,windDegrees:265,temperatureF:69.7}};
test('Caddy course report shows selected tee distance and correct wind FROM semantics',()=>{
 const d=describeCaddyConditions(active,env,{now,fetchedAt:now-1000});
 assert.match(d.course,/Whispering Pines/);
 assert.match(d.hole,/Hole 7 · Par 4 · 382 yd from tee \(not pin distance\)/);
 assert.match(d.weather,/70°F · 13 mph wind FROM 265°/);
 assert.match(d.status,/verified/);
});
test('Missing weather and scorecard are explicit, not invented',()=>{
 const d=describeCaddyConditions(active,{state:'unavailable',holes:[],weatherState:'unavailable',weather:null},{now});
 assert.match(d.hole,/unavailable/);
 assert.match(d.weather,/unavailable/);
 assert.match(d.status,/unavailable/);
});
test('Stale modeled weather is not shown',()=>{
 const d=describeCaddyConditions(active,{...env,weather:{...env.weather,observedAt:now-91*60000}},{now});
 assert.match(d.weather,/unavailable/);
});
test('No course selection prompts the Starter’s Desk',()=>{
 const d=describeCaddyConditions(null,env,{now});
 assert.match(d.hole,/Starter/);
 assert.match(d.status,/not selected/);
});
