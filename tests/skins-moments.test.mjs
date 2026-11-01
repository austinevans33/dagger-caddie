import test from 'node:test';
import assert from 'node:assert/strict';
import {skinsMoments} from '../skins-moments.js';
test('only recorded ties and wins can produce match moments',()=>{
 const a=skinsMoments({names:['A','B','C','D'],holes:[[4,4,4,4],[3,4,4,5]],stakeCents:100});
 assert.equal(a.moments.length,2);
 assert.match(a.moments[1].text,/A takes 2 skins/);
 assert.equal(a.final,false);
});
test('empty round never fabricates highlights',()=>{
 const r=skinsMoments({names:['A','B'],holes:[],stakeCents:100});
 assert.deepEqual(r.moments,[]);
});
