import test from 'node:test';
import assert from 'node:assert/strict';
import {founderFactoryEntries,founderFactoryInventory,founderVerifiedScorecard} from '../app/61f9e9de0a/founders-verified-scorecards.js';
test('batch input enumerates every verified founder exactly once without search limits',()=>{
 const entries=founderFactoryEntries(),inventory=founderFactoryInventory();
 assert.equal(entries.length,inventory.length);
 assert.equal(new Set(entries.map(e=>e.selection.course.providerCourseId)).size,entries.length);
 for(const e of entries){assert.deepEqual(e.holes,founderVerifiedScorecard(e.selection).holes);assert.equal(e.holes.length,e.selection.course.holeCount??18);assert(e.source);}
});
