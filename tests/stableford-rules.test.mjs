import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreStableford} from '../playtest/stableford-rules.js';
test('gross and explicitly allocated net strokes produce correct points',()=>{
 const r=scoreStableford([{hole:1,par:4,scores:{a:5,b:4},strokesReceived:{a:1,b:0}},
 {hole:2,par:3,scores:{a:2,b:5},strokesReceived:{a:0,b:0}}],['a','b']);
 assert.deepEqual(r.totals,{a:5,b:2});
 assert.equal(r.complete,true);
});
test('missing score stays pending rather than fabricating points',()=>{
 const r=scoreStableford([{hole:1,par:4,scores:{a:4},strokesReceived:{a:0,b:0}}],['a','b']);
 assert.deepEqual(r.totals,{a:2,b:0});
 assert.equal(r.complete,false);
 assert.equal(r.holes[0].players.b.status,'pending');
});
test('rejects absent handicap allocation and duplicate holes',()=>{
 assert.throws(()=>scoreStableford([{hole:1,par:4,scores:{a:4},strokesReceived:{}}],['a']));
 assert.throws(()=>scoreStableford([{hole:1,par:4,scores:{a:4},strokesReceived:{a:0}},{hole:1,par:4,scores:{a:4},strokesReceived:{a:0}}],['a']));
});
test('custom points and net albatross work',()=>{
 const r=scoreStableford([{hole:1,par:5,scores:{a:2},strokesReceived:{a:0}}],['a'],{points:{doubleBogeyOrWorse:0,bogey:1,par:2,birdie:3,eagle:4,albatross:8}});
 assert.equal(r.totals.a,8);
});
