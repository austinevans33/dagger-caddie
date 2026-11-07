import test from 'node:test';
import assert from 'node:assert/strict';
import {searchOpenGolfCourses,searchResultCourses} from '../playtest/opengolf-catalog.js';
const course=i=>({id:'course-'+i,course_name:'Pine Course '+i,city:'Town',state:'NC'});
test('find up to forty real provider results instead of dropping everything after twelve',()=>{
 const list=searchResultCourses({courses:Array.from({length:55},(_,i)=>course(i+1))});
 assert.equal(list.length,40);
 assert.equal(list[0].providerCourseId,'course-1');
 assert.equal(list.at(-1).providerCourseId,'course-40');
 assert.ok(list.every(c=>c.provider==='opengolfapi'));
});
test('provider query asks for larger, bounded search results and does not fabricate entries',async()=>{
 const calls=[];
 const result=await searchOpenGolfCourses('Pinehurst',{fetcher:async(url,options)=>{
  calls.push({url,options});
  return {ok:true,json:async()=>({courses:[course(1),course(2)]})};
 }});
 const providerMatches=result.filter(item=>item.provider==='opengolfapi');
 assert.equal(providerMatches.length,2);
 assert.match(calls[0].url,/q=Pinehurst&limit=40$/);
 assert.equal(providerMatches[1].providerCourseId,'course-2');
 assert.ok(result.some(item=>item.name==='Pinehurst No. 3'));
});
test('missing provider data still means no courses',async()=>{
 assert.deepEqual(searchResultCourses({courses:[]}),[]);
 assert.deepEqual(searchResultCourses({courses:Array.from({length:5},()=>({course_name:'No ID'}))}),[]);
 const result=await searchOpenGolfCourses('Missing',{fetcher:async()=>({ok:true,json:async()=>({courses:[]})})});
 assert.deepEqual(result,[]);
});
test('short query makes zero provider requests',async()=>{
 let count=0;assert.deepEqual(await searchOpenGolfCourses('x',{fetcher:()=>{count++;}}),[]);
 assert.equal(count,0);
});
