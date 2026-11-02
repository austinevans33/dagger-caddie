import test from 'node:test';
import assert from 'node:assert/strict';
import {verifiedGeometryFromGeoJSON} from '../yardage-geojson-import.js';
const fixture={type:'FeatureCollection',features:[
 {type:'Feature',properties:{golf:'fairway',hole:1},geometry:{type:'Polygon',coordinates:[[[0,0],[1,0],[1,1],[0,0]]]}},
 {type:'Feature',properties:{golf:'bunker'},geometry:{type:'Polygon',coordinates:[[[2,0],[3,0],[3,1],[2,0]]]}}
]};
test('unverified GeoJSON is never promoted to genuine hole mapping',()=>assert.deepEqual(verifiedGeometryFromGeoJSON(fixture),[]));
test('explicit hole attribution can be imported while unknown bunkers are excluded',()=>{
 const result=verifiedGeometryFromGeoJSON(fixture,{sourceVerified:true});
 assert.equal(result.length,1);assert.equal(result[0].holeNumber,1);
 assert.equal(result[0].features.length,1);assert.equal(result[0].features[0].type,'fairway');
});
test('out-of-range source hole is discarded',()=>{
 const f=structuredClone(fixture);f.features[0].properties.hole=99;
 assert.deepEqual(verifiedGeometryFromGeoJSON(f,{sourceVerified:true}),[]);
});
