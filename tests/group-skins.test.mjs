import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateGroupSkins} from '../group-skins.js';
test('four golfers distribute a single skin as zero-sum',()=>{
 const r=calculateGroupSkins([[3,4,5,4]],100);
 assert.deepEqual(r.netCents,[300,-100,-100,-100]);
 assert.equal(r.settlementEligible,false);
});
test('a tied hole carries to the next unique winner',()=>{
 const r=calculateGroupSkins([[4,4,4,4],[4,4,3,5]],100);
 assert.deepEqual(r.netCents,[-200,-200,600,-200]);
 assert.equal(r.events[1].skins,2);
});
test('correction recalculates rather than double counts',()=>{
 const a=calculateGroupSkins([[3,4,5,4]],100);
 const b=calculateGroupSkins([[4,3,5,4]],100);
 assert.deepEqual(b.netCents,[-100,300,-100,-100]);
 assert.notDeepEqual(a.netCents,b.netCents);
});
test('full round qualifies for settlement',()=>{
 const r=calculateGroupSkins(Array.from({length:18},()=>[3,4,4,5]),100);
 assert.equal(r.complete,true);
 assert.equal(r.netCents.reduce((a,b)=>a+b,0),0);
});
