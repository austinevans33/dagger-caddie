import test from 'node:test';
import assert from 'node:assert/strict';
import {previewSkinsAction} from '../skins-action-preview.js';
test('round with one recorded hole has provisional live standings',()=>{
 const x=previewSkinsAction({playerIds:['a','b','c','d'],holes:[[3,4,4,5]],stakeCents:500});
 assert.equal(x.state,'provisional');assert.equal(x.canSettle,false);
 assert.deepEqual(x.balances.map(b=>b.netCents),[1500,-500,-500,-500]);
});
test('18 scored holes can be declared final',()=>{
 const x=previewSkinsAction({playerIds:['a','b'],holes:Array.from({length:18},()=>[3,4]),stakeCents:100});
 assert.equal(x.state,'final');assert.equal(x.canSettle,true);
});
test('duplicate golfer identity rejected',()=>{
 assert.throws(()=>previewSkinsAction({playerIds:['a','a'],holes:[],stakeCents:100}),/Invalid golfers/);
});
