import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeOpenGolfHoles,loadOpenGolfHoles} from '../staging-app/opengolf-holes.js';
const selection={course:{provider:'opengolfapi',providerCourseId:'course-1',name:'Test Club',region:'NC'},tee:{providerTeeId:'blue',name:'Blue',totalYards:6300},holeNumber:1};
test('retain only real per-tee hole distances and pars',()=>{
 const rows=normalizeOpenGolfHoles({holes:[{hole_number:2,par:5,yardages:{blue:512,white:470}},{hole_number:1,par:4,yardages:{blue:384}},{hole_number:3,par:4,yardages:{white:350}}]},selection);
 assert.deepEqual(rows.map(h=>[h.number,h.par,h.yards]),[[1,4,384],[2,5,512]]);
 assert.deepEqual(rows[0].hazards,[]);
});
test('reject provider and yardage mismatches instead of substituting other tees',()=>{
 const changed={...selection,tee:{...selection.tee,providerTeeId:'black',name:'Black'}};
 assert.deepEqual(normalizeOpenGolfHoles({holes:[{hole_number:1,par:4,yardages:{blue:384}}]},changed),[]);
 assert.deepEqual(normalizeOpenGolfHoles({holes:[]},{...selection,course:{...selection.course,provider:'other'}}),[]);
});
test('fetch exact selected course holes endpoint without requiring a key',async()=>{
 let requested='';
 const rows=await loadOpenGolfHoles(selection,{fetcher:async(url,options)=>{requested=url;assert.equal(options.headers.Accept,'application/json');return {ok:true,json:async()=>({holes:[{hole_number:1,par:4,yardages:{Blue:384}}]})};}});
 assert.match(requested,/\/v1\/courses\/course-1\/holes$/);
 assert.equal(rows[0].yards,384);
});
