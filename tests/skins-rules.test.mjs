import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateSkins} from '../playtest/skins-rules.js';
const players=['a','b','c'];
test('unique low score wins skin, tie carries to next hole',()=>{
 const r=calculateSkins([
  {hole:1,scores:{a:4,b:4,c:5}},
  {hole:2,scores:{a:3,b:4,c:5}},
  {hole:3,scores:{a:5,b:3,c:4}}
 ],players);
 assert.deepEqual(r.totals,{a:2,b:1,c:0});
 assert.equal(r.awards[0].status,'carry');
 assert.equal(r.awards[1].skins,2);
 assert.equal(r.unresolvedCarry,0);
});
test('incomplete score halts awards and never creates phantom win',()=>{
 const r=calculateSkins([{hole:1,scores:{a:4,b:4,c:5}},{hole:2,scores:{a:3,b:4}},{hole:3,scores:{a:2,b:5,c:5}}],players);
 assert.deepEqual(r.totals,{a:0,b:0,c:0});
 assert.equal(r.unresolvedCarry,1);
 assert.equal(r.awards.length,2);
 assert.equal(r.awards[1].status,'pending');
});
test('value multiplier and unresolved end-of-round tie',()=>{
 const r=calculateSkins([{hole:1,scores:{a:4,b:4,c:6}}],players,{startValue:5});
 assert.equal(r.unresolvedCarry,5);
 assert.deepEqual(r.totals,{a:0,b:0,c:0});
});
test('invalid input rejected',()=>{
 assert.throws(()=>calculateSkins([{hole:1,scores:{a:0,b:4,c:5}}],players));
 assert.throws(()=>calculateSkins([{hole:2,scores:{a:3,b:4,c:5}},{hole:2,scores:{a:3,b:4,c:5}}],players));
 assert.throws(()=>calculateSkins([],[...players,'a']));
});
