import test from 'node:test';import assert from 'node:assert/strict';
import {bingoPayout} from '../staging-app/bbb-money.js';
test('two-player awards transfer stake per point',()=>assert.deepEqual(bingoPayout(['A','B'],[[0,0,1]],1.25).score,[1.25,-1.25]));
test('four-player winner receives stake from each opponent',()=>assert.deepEqual(bingoPayout(['A','B','C','D'],[[0,null,null]],2).score,[6,-2,-2,-2]));
test('ties pay nothing and points-only stake pays nothing',()=>{assert.deepEqual(bingoPayout(['A','B'],[[null,null,null]],5).score,[0,0]);assert.deepEqual(bingoPayout(['A','B'],[[0,0,0]],0).score,[0,0]);});
test('fractional cents and invalid awards rejected',()=>{for(const n of [-1,Infinity,NaN,0.001,10001])assert.throws(()=>bingoPayout(['A','B'],[],n));for(const h of [[2,null,null],[-1,0,1],['0',0,1],[0,1]])assert.throws(()=>bingoPayout(['A','B'],[h],1));});
test('integer cent accounting stays zero sum for all supported group sizes',()=>{for(const n of [2,3,4]){const players=Array.from({length:n},(_,i)=>String(i));const holes=Array.from({length:18},(_,i)=>[i%n,(i+1)%n,null]);const x=bingoPayout(players,holes,0.1);assert.equal(x.score.reduce((sum,v)=>sum+Math.round(v*100),0),0);assert.equal(x.points.reduce((a,b)=>a+b),36);}});

// Ledger adapter uses the same authoritative payout calculations without inventing payments.
import {bingoArchiveReceipts} from '../staging-app/bbb-money.js';
test('visible Ledger BBB receipts are idempotent and read-only',()=>{
 const item={format:'bingo',bingoId:'round-1',players:['Host','Buddy'],bingoAwards:[[0,0,0]],stake:1.25,ended:1234};
 const prior=JSON.stringify(item);
 const results=bingoArchiveReceipts([item,{format:'nassau'},item]);
 assert.equal(results.length,1); // A second record with the same ID cannot duplicate the displayed receipt.
 assert.deepEqual(results[0].score,[3.75,-3.75]);
 assert.deepEqual(results[0].points,[3,0]);
 assert.equal(JSON.stringify(item),prior);
 assert.equal('paid' in results[0],false);
});

// Real-world round-dollar stakes are expected even though fractional stakes are allowed.
test('common whole-dollar stakes settle exactly, including a full 18-hole round',()=>{
 for(const stake of [1,5,10,20]){
  const holes=Array.from({length:18},()=>[0,0,0]);
  const x=bingoPayout(['Host','Buddy'],holes,stake);
  assert.deepEqual(x.points,[54,0]);
  assert.deepEqual(x.score,[54*stake,-54*stake]);
  assert.equal(x.score.reduce((a,b)=>a+b,0),0);
 }
});
test('whole-dollar four-player distribution remains zero sum',()=>{
 const x=bingoPayout(['A','B','C','D'],[[0,1,2],[3,0,1]],10);
 assert.deepEqual(x.points,[2,2,1,1]);
 assert.deepEqual(x.score,[20,20,-20,-20]);
});
