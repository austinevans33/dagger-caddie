import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildHoleSketch,courseArtFeatures,loadHoleSketch,placeGhostShots} from '../playtest/hole-sketch.js';
import {normalizeCourseFeatures} from '../playtest/course-pencil-geometry.js';
import {describeSketchTrouble,sketchGamePlan} from '../playtest/yardage-caddy-notes.js';

const bayonet=JSON.parse(readFileSync(new URL('../playtest/course-art/bayonet-at-puppy-creek.json',import.meta.url)));
const selection={course:{provider:'opengolfapi',providerCourseId:'1c31d1fb-faa1-4d9f-80a2-f281982df126'}};

test('all 18 Bayonet holes have distinct tee-up portrait routes and correctly assigned shapes',()=>{
 const routes=new Set();
 for(let hole=1;hole<=18;hole++){
  const features=courseArtFeatures(bayonet.features,hole);
  const sketch=buildHoleSketch(features);
  const {route}=sketch.annotations;
  assert.ok(route.tee[1]>route.green[1],`hole ${hole} runs up the page`);
  assert.equal(sketch.shapes.filter(shape=>shape.type==='green').length,1);
  assert.equal(sketch.shapes.filter(shape=>shape.type==='tee').length,1);
  assert.ok(sketch.shapes.every(shape=>shape.points.every(([x,y])=>x>=0&&x<=300&&y>=0&&y<=440)));
  routes.add(JSON.stringify(route.path));
 }
 assert.equal(routes.size,18);
 const first=buildHoleSketch(courseArtFeatures(bayonet.features,1));
 assert.equal(first.annotations.route.path.length,5);
 assert.equal(first.shapes.filter(shape=>shape.type==='water').length,2);
 assert.match(describeSketchTrouble(first.annotations),/water/);
});

test('bundled geometry uses the exact provider ID and preserves the generic course loader',async()=>{
 const calls=[];
 const fetcher=async url=>{
  calls.push(String(url));
  return {ok:true,json:async()=>String(url).startsWith('file:')?bayonet:{features:[]}};
 };
 const sketch=await loadHoleSketch(selection,1,{fetcher});
 assert.match(sketch.credit,/Zomma Golf/);
 assert.match(calls[0],/bayonet-at-puppy-creek\.json$/);
 const other=await loadHoleSketch({course:{provider:'opengolfapi',providerCourseId:'seaside-bayonet',name:'Bayonet'}},1,{fetcher});
 assert.equal(other.coverage,'scorecard');
 assert.match(calls[1],/course=seaside-bayonet&hole=1/);
});

test('live provider tagged route becomes a partial sketch without adding polygons',()=>{
 const body={features:[{tags:['golf=hole','ref=3'],geometry:{type:'LineString',coordinates:[[-79,35],[-79,35.002]]}}]};
 assert.equal(normalizeCourseFeatures(body,{holeNumber:2}).length,0);
 const sketch=buildHoleSketch(normalizeCourseFeatures(body,{holeNumber:3}));
 assert.equal(sketch.coverage,'partial');
 assert.equal(sketch.shapes.length,0);
 assert.equal(sketch.annotations.labels.length,0);
 assert.ok(sketch.annotations.route.green[1]<sketch.annotations.route.tee[1]);
});

test('Ghost traces start at the mapped tee and finish at the green without changing strokes',()=>{
 const {route}=buildHoleSketch(courseArtFeatures(bayonet.features,1)).annotations;
 const strokes=[{x:.54,y:.49,club:'Tee club',lie:'Tee'},{x:.5,y:.08,club:'Putter',lie:'Holed'}];
 const placed=placeGhostShots(strokes,route);
 assert.deepEqual(placed.start,{x:route.tee[0]/300,y:route.tee[1]/440});
 assert.deepEqual(placed.shots[1],{...strokes[1],x:route.green[0]/300,y:route.green[1]/440});
 assert.notEqual(placed.shots[0].x,strokes[0].x);
 assert.deepEqual(placeGhostShots(strokes,null).shots,strokes);
});

test('the game plan reflects a golfer’s saved carries and known hazards',()=>{
 const {annotations}=buildHoleSketch(courseArtFeatures(bayonet.features,1));
 const hole={par:5,yards:471};
 const first=sketchGamePlan({hole,annotations,profile:[{name:'Driver',carry:260},{name:'Mini Driver',manualCarry:238}]});
 const second=sketchGamePlan({hole,annotations,profile:[{name:'3 Wood',carry:195}]});
 assert.match(first.play,/Driver 260 yd \/ Mini Driver 238 yd/);
 assert.match(second.play,/3 Wood 195 yd/);
 assert.match(first.miss,/water|bunker/);
 assert.match(sketchGamePlan({hole}).miss,/unconfirmed/);
});

test('course strategy describes actual logged misses without treating unknown direction as straight',()=>{
 const plan=sketchGamePlan({hole:{par:4,yards:410},profile:[{name:'Driver',carry:252}],
  shotHistory:[{club:'Driver',horizontal:'Right'},{club:'Driver',horizontal:'Right'},
   {club:'Driver',horizontal:null},{club:'7 Iron',horizontal:'Left'}]});
 assert.match(plan.play,/Driver \(3 logged: 0 left, 2 right\)/);
 assert.doesNotMatch(plan.play,/straight|7 Iron/);
});
