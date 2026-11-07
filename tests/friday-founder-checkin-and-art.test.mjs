import test from 'node:test';
import assert from 'node:assert/strict';
import {searchOpenGolfCourses,loadOpenGolfTees} from '../playtest/opengolf-catalog.js';
import {founderCatalogRecords,founderVerifiedScorecard} from '../playtest/founders-verified-scorecards.js';
import {getActiveCourseContext,readCourseScorecard} from '../playtest/active-course-context.js';
import {saveActiveRound} from '../playtest/starters-desk-session.js';
import {loadHoleSketch} from '../playtest/hole-sketch.js';
const memory=()=>{const m=new Map();return {getItem:key=>m.get(key)||null,setItem:(key,value)=>m.set(key,String(value)),removeItem:key=>m.delete(key)}};
const find=q=>founderCatalogRecords(q)[0];
test('Founders appear first in course search, including offline',async()=>{
 const result=await searchOpenGolfCourses('Kings Grant',{fetcher:async()=>({ok:true,json:async()=>({courses:[{id:'other',course_name:'Kings Grant Park',city:'Elsewhere',state:'MI'}]})})});
 assert.equal(result[0].provider,'dagger-founder');assert.equal(result[0].region,'Fayetteville, NC');
 assert.equal(result[1].region,'Elsewhere, MI');
 const offline=await searchOpenGolfCourses('Quail Ridge',{fetcher:async()=>{throw Error('Offline');}});
 assert.equal(offline[0].name,'The Golf Club at Quail Ridge');assert.equal(offline[0].region,'Sanford, NC');
});
test('Founder check-in loads all tees and all eighteen holes entirely offline',async()=>{
 for(const name of ['Kings Grant','Quail Ridge']){
  const course=find(name),tees=(await loadOpenGolfTees(course,{fetcher:async()=>{throw Error('Must not fetch founder tees')}}))[0].tees;
  assert.ok(tees.length>=3);
  for(const tee of tees){
   const store=memory();assert.equal(saveActiveRound(store,{course,tee,holeNumber:1},123456),true);
   const card=await getActiveCourseContext({storage:store,fetcher:async()=>{throw Error('Must not fetch founder holes')}});
   assert.equal(card.holes.length,18);
   assert.deepEqual(readCourseScorecard(store,{course,tee,holeNumber:1}).holes,card.holes);
   assert.equal(card.holes.reduce((n,h)=>n+h.yards,0),tee.totalYards);
  }
 }
});
test('Kings Grant rejects one-hole-only remote art instead of showing an unverified Ghost map',async()=>{
 const course=find('Kings Grant');
 const selection={course,tee:(await loadOpenGolfTees(course))[0].tees.find(tee=>tee.providerTeeId==='white')};
 const point=(lng,lat)=>[lng,lat];
 const features=[{type:'Feature',properties:{holes:[1],layer:'hole'},geometry:{type:'LineString',coordinates:[point(-78.8,35),point(-78.8,35.002)]}},
 {type:'Feature',properties:{holes:[1],layer:'tee'},geometry:{type:'Polygon',coordinates:[[point(-78.8001,35),point(-78.8,35),point(-78.8,35.0001),point(-78.8001,35)]]}},
 {type:'Feature',properties:{holes:[1],layer:'green'},geometry:{type:'Polygon',coordinates:[[point(-78.8001,35.002),point(-78.8,35.002),point(-78.8,35.0021),point(-78.8001,35.002)]]}}];
 const fetcher=async url=>({ok:true,json:async()=>String(url).includes('zommagolf')?{metadata:{course_ref:'nc/kings-grant-golf-and-country-club'},features}:{features:[]}});
 const art=await loadHoleSketch(selection,1,{fetcher});
 assert.equal(art.coverage,'scorecard');
 const other=await loadHoleSketch({...selection,course:{...selection.course,providerCourseId:'incorrect'}},1,{fetcher});
 assert.equal(other.coverage,'scorecard');
});
test('Quail Ridge mismatched map hole numbering must not be used as mapped reality',async()=>{
 const selection={course:find('Quail Ridge')};
 const calls=[];
 const art=await loadHoleSketch(selection,1,{fetcher:async url=>{calls.push(String(url));return {ok:true,json:async()=>({features:[]})};}});
 assert.equal(art.coverage,'scorecard');
 assert.equal(calls.some(url=>url.includes('zommagolf.com')),false);
 assert.ok(founderVerifiedScorecard({course:selection.course,tee:(await loadOpenGolfTees(selection.course))[0].tees[0]}));
});
