import test from 'node:test';
import assert from 'node:assert/strict';
import {searchOpenGolfCourses,loadOpenGolfTees} from '../staging-app/opengolf-catalog.js';
const course={id:'abc123',course_name:'Example Golf Club',city:'Sampletown',state:'NC'};
test('Starter Desk limits search to 12 real provider results',async()=>{
 const fetcher=async()=>({ok:true,json:async()=>({courses:Array(20).fill(0).map((_,i)=>({...course,id:'id'+i}))})});
 const rows=await searchOpenGolfCourses('Sample',{fetcher});
 assert.equal(rows.length,12);assert.equal(rows[0].provider,'opengolfapi');
});
test('tee check-in uses detail for exact matching course only',async()=>{
 const selected=(await searchOpenGolfCourses('Sample',{fetcher:async()=>({ok:true,json:async()=>({courses:[course]})})}))[0];
 const fetcher=async()=>({ok:true,json:async()=>({id:'abc123',tees:[{name:'Blue',total_yardage:6250}]})});
 const rows=await loadOpenGolfTees(selected,{fetcher});
 assert.equal(rows[0].tees[0].totalYards,6250);
 const mismatch=await loadOpenGolfTees(selected,{fetcher:async()=>({ok:true,json:async()=>({id:'other',tees:[{name:'Blue',total_yardage:6250}]})})});
 assert.deepEqual(mismatch,[]);
});
test('invalid query does not invoke provider',async()=>{
 let called=false;
 assert.deepEqual(await searchOpenGolfCourses('x',{fetcher:()=>{called=true;}}),[]);
 assert.equal(called,false);
});

test('tee data uses the documented course-specific tees endpoint',async()=>{
 const selected={provider:'opengolfapi',providerCourseId:'abc123',name:'Example Golf Club',region:'NC'};
 let requested='';
 const rows=await loadOpenGolfTees(selected,{fetcher:async url=>{
  requested=url;return {ok:true,json:async()=>({tees:[{name:'White',total_yardage:6000}]})};
 }});
 assert.match(requested,/\/v1\/courses\/abc123\/tees$/);
 assert.equal(rows[0].tees[0].name,'White');
});
