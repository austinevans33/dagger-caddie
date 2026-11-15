import test from 'node:test';
import assert from 'node:assert/strict';
import {mappedGhostShots} from '../app/61f9e9de0a/ghost-mapped-lie.js';
test('simulated marker respects polygon cutouts and prioritizes mapped hazards',()=>{
 const ring=[[0,0],[10,0],[10,10],[0,10]];
 const cut=[[4,4],[6,4],[6,6],[4,6]];
 const shapes=[{type:'fairway',points:ring},{type:'water',points:ring,interiors:[cut]}];
 const shots=[{x:.2,y:.2},{x:.5,y:.5},{x:.2,y:.2,lie:'Holed'},{x:2,y:2}];
 assert.deepEqual(mappedGhostShots(shots,shapes,10,10).map(s=>s.mappedLie),['Mapped water','Mapped fairway',undefined,undefined]);
 assert.deepEqual(mappedGhostShots(shots,[],10,10),shots);
 assert.equal(shots[0].mappedLie,undefined);
});

test('bunker and rough recoveries change the visible landing without rewriting scores or replay history',()=>{
 const box=(left,right)=>[[left,0],[right,0],[right,10],[left,10]];
 const original=[{x:.2,y:.5,club:'Tee club'},{x:.9,y:.5,club:'Approach club',distanceLabel:'about 150 yards'},
  {x:.95,y:.5,club:'Putter',lie:'Holed'}];
 for(const [type,club] of [['bunker','Recovery wedge'],['rough','Punch out']]){
  const shapes=[{type,points:box(0,3)},{type:'fairway',points:box(4,8)}];
  const shots=mappedGhostShots(original,shapes,10,10);
  assert.equal(shots[1].club,club);
  assert.equal(shots[1].mappedLie,'Mapped fairway');
  assert.ok(shots[1].x<original[1].x);
  assert.equal(shots[2],original[2]);
  assert.equal(shots.length,original.length);
  assert.deepEqual(mappedGhostShots(original.slice(0,2),shapes,10,10),shots.slice(0,2));
  assert.equal(mappedGhostShots(original,shapes.slice(0,1),10,10)[1],original[1]);
 }
});

import {readFile} from 'node:fs/promises';
import {BAYONET_COURSE_ID,BAYONET_TEES} from '../app/61f9e9de0a/bayonet-verified-scorecard.js';
import {loadHoleSketch,SKETCH_WIDTH,SKETCH_HEIGHT} from '../app/61f9e9de0a/hole-sketch.js';
import {playMappedGhostHole} from '../app/61f9e9de0a/ghost-mapped-lie.js';
import {ghostShotPlayback} from '../app/61f9e9de0a/house-ghost-playback.js';

test('Bayonet shotgun hole replay uses one stable mapped score for every skill level',async()=>{
 const holeNumber=4;
 const course={provider:'opengolfapi',providerCourseId:BAYONET_COURSE_ID,holeCount:18};
 const fetcher=async url=>new Response(await readFile(url));
 const sketch=await loadHoleSketch({course},holeNumber,{fetcher});
 assert.equal(sketch.reviewedGeometry,true);
 const {route}=sketch.annotations;
 const yards=BAYONET_TEES.white.yards[holeNumber-1];
 for(const tier of ['scratch','fiveTen','tenFifteen','fifteenTwenty']){
  const options={route,shapes:sketch.shapes,width:SKETCH_WIDTH,height:SKETCH_HEIGHT,yards,tier,seed:'bayonet|4|'+tier};
  const play=playMappedGhostHole(options);
  assert.ok(play,tier);
  assert.deepEqual(play,playMappedGhostHole(options));
  assert.deepEqual(play.start,{x:route.tee[0]/SKETCH_WIDTH,y:route.tee[1]/SKETCH_HEIGHT});
  assert.equal(play.shots.at(-1).lie,'Holed');
  const restored=JSON.parse(JSON.stringify(play));
  const matchHole={hole:holeNumber,par:4,ghost:play.shots.length};
  const view=ghostShotPlayback({count:9,holeNumber,matchHole,mappedPlay:restored,shotsRevealed:99});
  assert.equal(view.score,matchHole.ghost);
  assert.equal(view.complete,true);
  assert.deepEqual(view.visibleShots,restored.shots);
 }
});

test('mapped lie changes the next club and landing from the same prior position',()=>{
 const rectangle=(left,right)=>[[left,0],[right,0],[right,100],[left,100]];
 const route={tee:[10,50],green:[290,50],path:[[10,50],[290,50]]};
 const base={route,width:300,height:100,yards:400,tier:'scratch',seed:'recovery'};
 const shapes=[{type:'fairway',points:rectangle(0,278)},{type:'green',points:rectangle(278,300)}];
 const clear=playMappedGhostHole({...base,shapes});
 assert.ok(clear);
 const bunker={type:'bunker',points:rectangle(clear.shots[0].x*300-8,clear.shots[0].x*300+8)};
 const recovery=playMappedGhostHole({...base,shapes:[...shapes,bunker]});
 assert.ok(recovery);
 assert.equal(recovery.shots[0].x,clear.shots[0].x);
 assert.equal(recovery.shots[0].mappedLie,'Mapped bunker');
 assert.equal(recovery.shots[1].club,'Recovery wedge');
 assert.notEqual(recovery.shots[1].x,clear.shots[1].x);
 assert.equal(playMappedGhostHole({...base,shapes:[]}),null);
});
