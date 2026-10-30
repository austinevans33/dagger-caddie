import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeHole,normalizeWeather,buildShotContext} from '../staging-app/course-weather-context.js';
const hole={number:7,par:4,yards:412,hazards:[{type:'bunker',note:'Front right'}]};
test('hole retains only validated course facts',()=>{
 assert.deepEqual(normalizeHole(hole),hole);
 for(const bad of [{...hole,number:19},{...hole,yards:-1},{...hole,hazards:[{type:'dragon',note:'Fake'}]}])assert.equal(normalizeHole(bad),null);
});
test('weather refuses stale observations and impossible values',()=>{
 const now=Date.now();
 assert.equal(normalizeWeather({observedAt:now-4*3600000,windMph:8,windDegrees:90},now),null);
 assert.equal(normalizeWeather({observedAt:now,windMph:-3,windDegrees:90},now),null);
 assert.equal(normalizeWeather({observedAt:now,windMph:8,windDegrees:360},now),null);
 assert.equal(normalizeWeather({observedAt:now,windMph:8,windDegrees:90},now).windMph,8);
});
test('no invented weather or live yardage without provider',()=>{
 const result=buildShotContext({hole});
 assert.equal(result.weather,null);
 assert.equal(result.weatherVerified,false);
 assert.equal(result.liveDistances,false);
 assert.equal(buildShotContext({weather:{observedAt:Date.now(),windMph:5,windDegrees:30}}),null);
});
