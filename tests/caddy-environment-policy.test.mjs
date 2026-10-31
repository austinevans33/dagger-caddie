import test from 'node:test';
import assert from 'node:assert/strict';
import {needsCaddyEnvironmentRefresh,safeCaddyEnvironment,CADDY_ENVIRONMENT_MAX_AGE_MS} from '../playtest/caddy-environment-policy.js';
import {createShotRecordContext} from '../playtest/shot-record-context.js';
const now=Date.parse('2026-10-30T18:00:00Z');
const course={provider:'opengolfapi',providerCourseId:'123',name:'Example Club',region:'NC'};
const tee={providerTeeId:'white',name:'White',totalYards:6300};
const active={selection:{course,tee,holeNumber:1}};
const environment={selection:active.selection,holes:[{number:1,par:4,yards:370}],scorecardSource:'opengolfapi-scorecard',weatherState:'model-current',weather:{source:'open-meteo-model',observedAt:now-10*60000,windMph:12,windDegrees:270,temperatureF:70}};
test('Caddy refreshes missing, expired and different-course conditions',()=>{
 assert.equal(needsCaddyEnvironmentRefresh(active,null,0,now),true);
 assert.equal(needsCaddyEnvironmentRefresh(active,environment,now-CADDY_ENVIRONMENT_MAX_AGE_MS+1,now),false);
 assert.equal(needsCaddyEnvironmentRefresh(active,environment,now-CADDY_ENVIRONMENT_MAX_AGE_MS,now),true);
 assert.equal(needsCaddyEnvironmentRefresh(active,{...environment,selection:{...active.selection,course:{...course,providerCourseId:'456'}}},now,now),true);
});
test('Caddy does not expose stale modeled weather',()=>{
 assert.equal(safeCaddyEnvironment(active,environment,now-1000,now).weather.windMph,12);
 const stale={...environment,weather:{...environment.weather,observedAt:now-91*60000}};
 assert.equal(safeCaddyEnvironment(active,stale,now-1000,now).weather,null);
 assert.equal(safeCaddyEnvironment(active,environment,now-16*60000,now),null);
});
test('Shot records retain course, tee, hole and verified yardage without fake GPS or dispersion',()=>{
 const shot=createShotRecordContext(active,1,environment,now-1000,now);
 assert.equal(shot.course.providerCourseId,'123');
 assert.equal(shot.tee.providerTeeId,'white');
 assert.deepEqual(shot.scorecard,{par:4,teeYards:370,source:'opengolfapi-scorecard'});
 assert.equal(shot.measuredCarryYards,null);
 assert.equal(shot.measuredLateralYards,null);
 assert.equal(shot.locationSource,'selected-course-not-shot-gps');
 assert.equal(shot.weather.isObservation,false);
});
test('Missing selection or stale weather is never fabricated',()=>{
 assert.equal(createShotRecordContext(null,1,environment,now,now),null);
 assert.equal(createShotRecordContext(active,19,environment,now,now),null);
 const shot=createShotRecordContext(active,2,environment,now-16*60000,now);
 assert.equal(shot.scorecard,undefined);
 assert.equal(shot.weather,undefined);
});
