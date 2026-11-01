import test from 'node:test';
import assert from 'node:assert/strict';
import {twoPlayerAction} from '../two-player-action.js';
const games=[{id:'skins',format:'skins',stakeCents:100},{id:'nassau',format:'nassau',stakeCents:500}];
test('two buddies play both games using the same hole entries',()=>{
 const x=twoPlayerAction({names:['Austin','Buddy'],holes:Array.from({length:18},()=>[4,5]),games});
 assert.deepEqual(x.balances,[3300,-3300]);assert.equal(x.completed,true);
});
test('ongoing match stays provisional',()=>{
 const x=twoPlayerAction({names:['Austin','Buddy'],holes:[[4,5]],games});
 assert.equal(x.provisional,true);assert.equal(x.completed,false);
});
test('score correction recalculates all games',()=>{
 const holes=Array.from({length:18},()=>[4,5]);
 const original=twoPlayerAction({names:['A','B'],holes,games});
 const adjusted=twoPlayerAction({names:['A','B'],holes:[[5,4],...holes.slice(1)],games});
 assert(adjusted.balances[0]<original.balances[0]);
});
