import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeOpenGolfLocation} from '../playtest/course-location.js';
const course={provider:'opengolfapi',providerCourseId:'NC-123',name:'Whispering Pines',region:'NC'};
test('Direct verified course record yields coordinates',()=>{
 const result=normalizeOpenGolfLocation(course,{id:'NC-123',latitude:35.2,longitude:-79.1});
 assert.deepEqual(result.coordinates,{latitude:35.2,longitude:-79.1});
 assert.equal(result.source,'opengolfapi-course-location');
});
test('Nested detail and location coordinates retain exact provider identity',()=>{
 const result=normalizeOpenGolfLocation(course,{course:{id:'NC-123',location:{latitude:35.2,longitude:-79.1}}});
 assert.equal(result.coordinates.longitude,-79.1);
 assert.equal(normalizeOpenGolfLocation(course,{course:{id:'OTHER',latitude:35.2,longitude:-79.1}}),null);
 assert.equal(normalizeOpenGolfLocation(course,{id:'OTHER',course:{id:'NC-123',latitude:35.2,longitude:-79.1}}),null);
});
test('GeoJSON point coordinates use longitude then latitude',()=>{
 const result=normalizeOpenGolfLocation(course,{id:'NC-123',geometry:{type:'Point',coordinates:[-79.1,35.2]}});
 assert.deepEqual(result.coordinates,{latitude:35.2,longitude:-79.1});
});
test('Never infer weather location from a similarly named course or invalid coordinates',()=>{
 assert.equal(normalizeOpenGolfLocation(course,{id:'NC-999',latitude:35.2,longitude:-79.1}),null);
 assert.equal(normalizeOpenGolfLocation(course,{id:'NC-123',latitude:999,longitude:-79.1}),null);
 assert.equal(normalizeOpenGolfLocation(course,{id:'NC-123',location:{latitude:'35.2',longitude:'-79.1'}}),null);
 assert.equal(normalizeOpenGolfLocation(course,{id:'NC-123',geometry:{type:'LineString',coordinates:[-79.1,35.2]}}),null);
});
