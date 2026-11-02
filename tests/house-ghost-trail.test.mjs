import test from 'node:test';
import assert from 'node:assert/strict';
import {simulateGhostHole} from '../house-ghost-trail.js';
test('every simulated Ghost shot accounts for one stroke',()=>{
 for(const par of [3,4,5])for(let holeNumber=1;holeNumber<=18;holeNumber++){
  const g=simulateGhostHole({holeNumber,par});
  assert.equal(g.shots.length,g.score);assert.equal(g.shots.at(-1).lie,'Holed');
  assert(g.shots.every(s=>s.kind==='simulated'&&s.x>=0&&s.x<=1&&s.y>=0&&s.y<=1));
 }
});
test('repeatable but never falsely map-sourced',()=>{
 const a=simulateGhostHole({holeNumber:7,par:4,teeYards:415});
 assert.deepEqual(a,simulateGhostHole({holeNumber:7,par:4,teeYards:415}));
 assert.equal(a.schematicOnly,true);assert.equal(a.source,'schematic-simulation');
});
test('invalid hole details rejected',()=>assert.throws(()=>simulateGhostHole({holeNumber:19}),/Invalid/));
