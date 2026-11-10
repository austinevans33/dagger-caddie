import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAllHeartReceipt} from '../playtest/all-heart-receipts.js';
import {projectMatchbookReceipts} from '../playtest/matchbook-receipt-feed.js';
const moment={type:'grudge',key:'bayonet:6'};
const result={roundId:'r1',hole:6,accepted:true,completed:true,strokes:3,targetStrokes:4};
test('round receipt survives projection without duplicate replay',()=>{
 const receipt=buildAllHeartReceipt(moment,result);
 assert.deepEqual(projectMatchbookReceipts([receipt,receipt]),[receipt]);
});
test('feed filters invalid entries and separates rounds',()=>{
 const a=buildAllHeartReceipt(moment,result);
 const b=buildAllHeartReceipt({...moment,key:'bayonet:7'},{...result,roundId:'r2',hole:7});
 assert.deepEqual(projectMatchbookReceipts([null,{id:'junk'},a,b],{roundId:'r1'}),[a]);
});
test('proposal without verified settlement never appears',()=>{
 const dare={type:'dare',key:'bayonet:4'};
 const proposal=buildAllHeartReceipt(dare,{...result,outcome:'won'});
 assert.equal(proposal,null);
 assert.deepEqual(projectMatchbookReceipts([proposal]),[]);
 const settled=buildAllHeartReceipt(dare,{...result,outcome:'won',settlementVerified:true});
 assert.deepEqual(projectMatchbookReceipts([settled]),[settled]);
});
test('invalid limits and empty feed',()=>{
 assert.throws(()=>projectMatchbookReceipts([],{limit:-1}));
 assert.deepEqual(projectMatchbookReceipts([]),[]);
});
