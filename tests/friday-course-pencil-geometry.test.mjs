import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCourseFeatures,pencilGeometry,orientPencilTeeToGreen,loadCourseFeatures} from '../playtest/course-pencil-geometry.js';
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

test('mapped tee and green orient from bottom to top, preserving hazards without invention',()=>{
 const shape=(type,x,y)=>({type,points:[[x-2,y-2],[x+2,y-2],[x+2,y+2],[x-2,y+2]]});
 const given=[shape('tee',40,110),shape('green',240,110),shape('bunker',160,95)];
 const oriented=orientPencilTeeToGreen(given);
 const midpoint=s=>s.points.reduce((a,p)=>[a[0]+p[0]/s.points.length,a[1]+p[1]/s.points.length],[0,0]);
 assert.ok(midpoint(oriented[0])[1]>midpoint(oriented[1])[1],'tee is nearer page bottom');
 assert.equal(oriented[2].type,'bunker');
 assert.deepEqual(oriented.map(x=>x.type),given.map(x=>x.type));
 assert.ok(oriented.every(x=>x.points.every(p=>p[0]>=0&&p[0]<=300&&p[1]>=0&&p[1]<=220)));
});
test('unverified routing is not invented without exactly one tee and one green',()=>{
 const shape=(type,x)=>({type,points:[[x,0],[x+2,0],[x+2,2],[x,2]]});
 const justGreen=[shape('green',20)];
 assert.equal(orientPencilTeeToGreen(justGreen),justGreen);
 const ambiguous=[shape('tee',10),shape('tee',12),shape('green',20)];
 assert.equal(orientPencilTeeToGreen(ambiguous),ambiguous);
});
