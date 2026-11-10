import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAllHeartReceipt} from '../playtest/all-heart-receipts.js';
const moment={type:'legend',key:'pinehurst:6',sourceUrl:'https://example.org/verified'};
const base={roundId:'round-1',hole:6,accepted:true,completed:true,strokes:3,targetStrokes:4};
test('verified challenge outcome becomes deterministic matchbook receipt',()=>{
 const r=buildAllHeartReceipt(moment,base);
 assert.equal(r.id,'all-heart:round-1:pinehurst:6');
 assert.equal(r.outcome,'beat');
 assert.equal(r.sourceUrl,'https://example.org/verified');
 assert.equal(buildAllHeartReceipt(moment,{...base,strokes:4}).outcome,'matched');
 assert.equal(buildAllHeartReceipt(moment,{...base,strokes:5}).outcome,'missed');
});
test('unaccepted, unfinished and scoreless challenges never produce receipts',()=>{
 assert.equal(buildAllHeartReceipt(moment,{...base,accepted:false}),null);
 assert.equal(buildAllHeartReceipt(moment,{...base,completed:false}),null);
 assert.equal(buildAllHeartReceipt(moment,{...base,strokes:null}),null);
});
test('side bet requires authoritative settlement, not proposal',()=>{
 const dare={type:'dare',key:'bayonet:4'};
 assert.equal(buildAllHeartReceipt(dare,{...base,outcome:'won'}),null);
 assert.equal(buildAllHeartReceipt(dare,{...base,outcome:'won',settlementVerified:true}).outcome,'won');
 assert.equal(buildAllHeartReceipt(dare,{...base,outcome:'pending',settlementVerified:true}),null);
});
