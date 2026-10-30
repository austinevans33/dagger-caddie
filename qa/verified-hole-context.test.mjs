import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveVerifiedHole} from '../staging-app/verified-hole-context.js';
const course={provider:'course-api',providerCourseId:'123',name:'Sample',region:'NC'};
const tee={providerTeeId:'blue',name:'Blue',totalYards:6300};
const selection={course,tee,holeNumber:4};
const now=Date.now();
const record={source:'verified-provider',provider:'course-api',providerCourseId:'123',providerTeeId:'blue',retrievedAt:now,hole:{number:4,par:4,yards:381,hazards:[]}};
test('exact verified selection resolves without fictional pin distances',()=>{
 const result=resolveVerifiedHole(selection,record,null,now);
 assert.equal(result.hole.yards,381);
 assert.equal(result.liveDistanceToPin,false);
 assert.equal(result.weatherVerified,false);
});
test('reject mismatched course, tee, hole and unverified records',()=>{
 for(const change of [{providerCourseId:'other'},{providerTeeId:'white'},{source:'unverified'},{hole:{...record.hole,number:5}},{retrievedAt:now-31*24*3600000}]){
  assert.equal(resolveVerifiedHole(selection,{...record,...change},null,now),null);
 }
});
test('stale weather cannot contaminate trusted course facts',()=>{
 const w={observedAt:now-4*3600000,windMph:15,windDegrees:180};
 const result=resolveVerifiedHole(selection,record,w,now);
 assert.ok(result);
 assert.equal(result.weather,null);
 assert.equal(result.weatherVerified,false);
});
