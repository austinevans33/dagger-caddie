import test from 'node:test';
import assert from 'node:assert/strict';
import {settleLedgerWager,installLedgerSettlement} from '../ledger-settlement.js';
const game=(holes,stake=10)=>({format:'nassau',players:['A','B'],stake,holes});
const win=[4,5],lose=[5,4],tie=[4,4];
test('Nassau does not settle incomplete front, back or full round',()=>{
 const original=()=>{throw Error('Nassau must not use legacy settlement')};
 assert.deepEqual(settleLedgerWager(game(Array(8).fill(win)),original).score,[0,0]);
 assert.deepEqual(settleLedgerWager(game([...Array(9).fill(win),...Array(8).fill(lose)]),original).score,[10,-10]);
});
test('completed front nine settles once, no unfinished back or overall',()=>{
 const result=settleLedgerWager(game(Array(9).fill(win)),()=>null);
 assert.deepEqual(result.score,[10,-10]);
});
test('completed eighteen settle front, back and overall independently',()=>{
 assert.deepEqual(settleLedgerWager(game([...Array(9).fill(win),...Array(9).fill(lose)]),()=>null).score,[0,0]);
 assert.deepEqual(settleLedgerWager(game(Array(18).fill(win)),()=>null).score,[30,-30]);
});
test('ties and corrected holes recalculate without stale payout',()=>{
 const holes=[...Array(9).fill(win),...Array(9).fill(tie)];
 assert.deepEqual(settleLedgerWager(game(holes),()=>null).score,[20,-20]);
 const corrected=[...Array(9).fill(lose),...Array(9).fill(tie)];
 assert.deepEqual(settleLedgerWager(game(corrected),()=>null).score,[-20,20]);
});
test('invalid or missing strokes never count as a completed segment',()=>{
 for(const invalid of [[null,4],[0,4],[21,4],[4],[3.5,4]]){
  const holes=Array(18).fill(win).map(h=>[...h]);holes[4]=invalid;
  assert.deepEqual(settleLedgerWager(game(holes),()=>null).score,[10,-10]);
 }
});
test('non-Nassau preserves existing wagering engine and install wraps once at initialization',()=>{
 const original=()=>({score:[7,-7],carry:3});
 assert.deepEqual(settleLedgerWager({format:'skins'},original),{score:[7,-7],carry:3});
 let renders=0;const target={wagerMath:original,renderFoursome:()=>renders++};
 assert.equal(installLedgerSettlement(target),true);assert.equal(renders,1);
 assert.deepEqual(target.wagerMath({format:'skins'}),{score:[7,-7],carry:3});
});
