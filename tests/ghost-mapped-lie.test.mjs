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
