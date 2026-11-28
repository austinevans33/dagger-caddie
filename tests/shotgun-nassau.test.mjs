import test from 'node:test';
import assert from 'node:assert/strict';
import {settleLedgerWager} from '../app/61f9e9de0a/ledger-settlement.js';
const original=()=>{throw Error('unexpected fallback')};
const ticket=()=>({format:'nassau',players:['A','B'],stake:10,startHole:17,holes:Array(18).fill(null)});
test('shotgun Nassau settles first nine played only when explicitly selected',()=>{
 const game=ticket();for(const n of [17,18,1,2,3,4,5,6,7])game.holes[n-1]=[4,5];
 assert.deepEqual(settleLedgerWager(game,original).score,[0,0]);
 game.nassauSegments='play-order';
 assert.deepEqual(settleLedgerWager(game,original).score,[10,-10]);
 for(const n of [8,9,10,11,12,13,14,15,16])game.holes[n-1]=[4,5];
 assert.deepEqual(settleLedgerWager(game,original).score,[30,-30]);
});
test('legacy Nassau keeps physical front nine regardless of starting hole',()=>{
 const game=ticket();for(let i=0;i<9;i++)game.holes[i]=[5,4];
 assert.deepEqual(settleLedgerWager(game,original).score,[-10,10]);
});
test('non-Nassau wager retains original settlement',()=>{
 const game={format:'skins'};assert.equal(settleLedgerWager(game,g=>g),game);
});
test('packed shotgun wager never reports pending segments as settled',()=>{
 const game={format:'nassau',players:['A','B'],stake:5,startHole:18,courseHoles:18,holes:Array.from({length:9},()=>[4,5])};
 const result=settleLedgerWager(game,original);
 assert.deepEqual(result.score,[5,-5]);
 assert.deepEqual(result.pending.map(row=>[row.label,row.played]),[['Second nine played',0],['Overall',9]]);
 game.holes.push(...Array.from({length:9},()=>[4,5]));
 assert.deepEqual(settleLedgerWager(game,original),{score:[15,-15],carry:1,pending:[]});
});
