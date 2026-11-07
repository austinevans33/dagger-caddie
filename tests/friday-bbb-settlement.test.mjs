import test from 'node:test';
import assert from 'node:assert/strict';
import {bingoPayout,bingoArchiveReceipts} from '../bbb-money.js';
test('BBB point awards balance to zero across two through four players',()=>{
 for(let n=2;n<=4;n++){
  const players=Array.from({length:n},(_,i)=>'Player '+i);
  const awards=Array.from({length:18},(_,i)=>[i%n,(i+1)%n,(i+2)%n]);
  const result=bingoPayout(players,awards,2.5);
  assert.equal(result.points.reduce((a,b)=>a+b,0),54);
  assert.equal(Math.round(result.score.reduce((a,b)=>a+b,0)*100),0);
  assert.equal(result.carry,1);
 }
});
test('BBB awards support no award and tied money totals without negative zero',()=>{
 const x=bingoPayout(['A','B'],[[0,1,null],[1,0,null]],5);
 assert.deepEqual(x.points,[2,2]);assert.deepEqual(x.score,[0,0]);
 const empty=bingoPayout(['A','B','C'],[],0);
 assert.deepEqual(empty.score,[0,0,0]);
});
test('BBB one player earns all three awards and everyone else owes their share',()=>{
 const x=bingoPayout(['A','B','C'],[[0,0,0]],1.25);
 assert.deepEqual(x.points,[3,0,0]);assert.deepEqual(x.score,[7.5,-3.75,-3.75]);
});
test('BBB rejects malformed and out-of-range awards and monetary inputs',()=>{
 for(const bad of [[[0,1]],[[0,1,2,3]],[[0,-1,1]],[[0,2,1]],[[0,0,1.5]]])
  assert.throws(()=>bingoPayout(['A','B'],bad,1),/Invalid Bingo/);
 for(const stake of [-1,10000.01,0.001,NaN,Infinity])
  assert.throws(()=>bingoPayout(['A','B'],[],stake),/stake/i);
});
test('BBB archive receipts skip duplicates and do not mark payments settled',()=>{
 const record={format:'bingo',bingoId:'round-1',players:['A','B'],stake:2,ended:'2026-11-02',bingoAwards:[[0,1,0]]};
 const receipts=bingoArchiveReceipts([record,{...record}, {format:'skins'},null]);
 assert.equal(receipts.length,1);assert.deepEqual(receipts[0].points,[2,1]);
 assert.deepEqual(receipts[0].score,[2,-2]);assert.equal(Object.hasOwn(receipts[0],'paid'),false);
});
