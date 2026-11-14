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
