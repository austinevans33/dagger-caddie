import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeOpenGolfLocation,loadCourseLocation} from '../staging-app/course-location.js';
const course={provider:'opengolfapi',providerCourseId:'123',name:'Test Club',region:'NC'};
test('course coordinates are accepted for exact provider course ID',async()=>{
 let request='';
 const found=await loadCourseLocation(course,{fetcher:async url=>{request=url;return {ok:true,json:async()=>({id:'123',latitude:35.1,longitude:-78.9})};}});
 assert.match(request,/\/courses\/123$/);
 assert.deepEqual(found.coordinates,{latitude:35.1,longitude:-78.9});
});
test('reject mismatched or absent course coordinates',()=>{
 assert.equal(normalizeOpenGolfLocation(course,{id:'another',latitude:35.1,longitude:-78.9}),null);
 assert.equal(normalizeOpenGolfLocation(course,{id:'123',latitude:null,longitude:-78.9}),null);
 assert.equal(normalizeOpenGolfLocation(course,{id:'123',latitude:99,longitude:-78.9}),null);
});
