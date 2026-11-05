import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCourseFeatures,pencilGeometry,loadCourseFeatures} from '../playtest/course-pencil-geometry.js';
const poly=(type,coordinates,hole=1)=>({type:'Feature',properties:{type,hole},geometry:{type:'Polygon',coordinates:[coordinates]}});
const green=poly('green',[[-79,35],[-78.9999,35],[-78.9999,35.0001],[-79,35]],1);
test('only mapped provider hole geometry is accepted, with no invented features',()=>{
 const shapes=normalizeCourseFeatures({features:[green,poly('water',[[-79,35],[-78.9999,35],[-78.9999,35.0001],[-79,35]],2),poly('other',[[-79,35],[-78.9999,35],[-78.9999,35.0001],[-79,35]])]},{holeNumber:1});
 assert.equal(shapes.length,1);assert.equal(shapes[0].type,'green');
 assert.equal(normalizeCourseFeatures({},{}).length,0);
});
test('invalid geometry is rejected and normalized schematic stays finite and bounded',()=>{
 assert.deepEqual(normalizeCourseFeatures({features:[poly('green',[[-79,35],[500,35],[-79,35]])]}),[]);
 const p=pencilGeometry(normalizeCourseFeatures({features:[green]}));
 assert.equal(p.length,1);assert.equal(p[0].points.length,4);
 for(const point of p[0].points){assert.ok(point.every(Number.isFinite));assert.ok(point[0]>=0&&point[0]<=300);assert.ok(point[1]>=0&&point[1]<=220)}
});
test('unrecognized provider is never requested',async()=>{
 let called=false;
 const result=await loadCourseFeatures({course:{provider:'other',providerCourseId:'x'}},1,{fetcher:async()=>{called=true;throw Error('should not call')}});
 assert.deepEqual(result,[]);assert.equal(called,false);
});
test('endpoint is hole-scoped and invalid response fails closed',async()=>{
 let calledUrl='';
 const chosen={course:{provider:'opengolfapi',providerCourseId:'test-101'}};
 const result=await loadCourseFeatures(chosen,1,{fetcher:async url=>{calledUrl=url;return {ok:true,json:async()=>({features:[green]})}}});
 assert.equal(result.length,1);assert.match(calledUrl,/course=test-101/);assert.match(calledUrl,/hole=1/);
 await assert.rejects(()=>loadCourseFeatures(chosen,1,{fetcher:async()=>({ok:false,status:500})}));
});

test('course-wide and unassigned features cannot masquerade as a specific hole',()=>{
 const base=[[-79,35],[-78.9999,35],[-78.9999,35.0001],[-79,35]];
 const unassigned={type:'Feature',properties:{type:'bunker'},geometry:{type:'Polygon',coordinates:[base]}};
 const spelled={type:'Feature',properties:{type:'green',hole:'1'},geometry:{type:'Polygon',coordinates:[base]}};
 const wrong=poly('water',base,2);
 const actual=normalizeCourseFeatures({features:[unassigned,spelled,wrong]},{holeNumber:1});
 assert.deepEqual(actual.map(x=>x.type),['green']);
 const onlyUnassigned=normalizeCourseFeatures({features:[unassigned]},{holeNumber:1});
 assert.deepEqual(onlyUnassigned,[]);
});
