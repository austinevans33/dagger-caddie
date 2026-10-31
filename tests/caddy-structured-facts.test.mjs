import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {buildCaddyCourseFacts} from '../playtest/caddy-course-facts.js';
const require=createRequire(import.meta.url);
const {caddyContext,structuredCourseFacts}=require('../functions/caddy-context.js');
const now=Date.now();
const selection={course:{name:'Whispering Pines — Pines Course'},tee:{name:'White'},holeNumber:1};
const environment={selection,state:'ready',holes:[{number:7,par:4,yards:382}],
 weatherState:'model-current',weather:{source:'open-meteo-model',observedAt:now-5*60000,
 windMph:12,windDegrees:270,temperatureF:71}};
test('Typed client facts survive backend validation without becoming a pin distance',()=>{
 const facts=buildCaddyCourseFacts(environment,7);
 const context=caddyContext({courseFacts:facts,yardage:'168',remainingDistanceSource:'golfer-reported'});
 assert.equal(context.courseFacts.courseName,'Whispering Pines — Pines Course');
 assert.equal(context.courseFacts.holeNumber,7);
 assert.equal(context.courseFacts.par,4);
 assert.equal(context.courseFacts.teeYards,382);
 assert.equal(context.courseFacts.scorecardCached,false);
 assert.equal(context.courseFacts.weather.windFromDegrees,270);
 assert.equal(context.courseFacts.weather.isObservation,false);
 assert.equal(context.yardage,'168');
 assert.equal('pinDistance' in context.courseFacts,false);
});
test('Incomplete hole data remains incomplete without invented yardage',()=>{
 const facts=buildCaddyCourseFacts({...environment,holes:[]},7);
 const result=caddyContext({courseFacts:facts,remainingDistanceSource:'golfer-needed',yardage:'168'});
 assert.equal(result.courseFacts.holeNumber,7);
 assert.equal('par' in result.courseFacts,false);
 assert.equal('teeYards' in result.courseFacts,false);
 assert.equal(result.yardage,'');
});
test('Backend rejects stale model weather even when the browser supplies it',()=>{
 const facts=buildCaddyCourseFacts(environment,7);
 facts.weather.observedAt=now-100*60000;
 const result=structuredCourseFacts(facts,now);
 assert.equal(result.weather,undefined);
 assert.equal(result.teeYards,382);
});
test('Reject invalid hole facts and unrecognized provider/weather claims',()=>{
 const result=structuredCourseFacts({courseName:'Test',teeName:'Blue',holeNumber:4,
  par:99,teeYards:150,scorecardSource:'unknown',
  weather:{source:'device-observation',observedAt:now,windMph:12,windFromDegrees:270,temperatureF:70}},now);
 assert.equal(result.par,undefined);
 assert.equal(result.teeYards,undefined);
 assert.equal(result.weather,undefined);
});
test('Stale environment never manufactures course facts',()=>{
 assert.equal(buildCaddyCourseFacts(null,7),null);
 assert.equal(buildCaddyCourseFacts(environment,0),null);
 assert.equal(structuredCourseFacts({courseName:'Test',teeName:'White',holeNumber:99}),null);
});
test('Cached scorecards retain explicit provenance',()=>{
 const facts=buildCaddyCourseFacts({...environment,state:'offline-cached'},7);
 assert.equal(caddyContext({courseFacts:facts}).courseFacts.scorecardCached,true);
});
