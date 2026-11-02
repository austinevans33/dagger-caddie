import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateGames} from '../multi-game-core.js';
const holes=Array.from({length:18},()=>[4,5]);
test('one card calculates three independent games',()=>{
 const results=calculateGames(holes,[{id:'skins',format:'skins',stakeCents:100},{id:'nassau',format:'nassau',stakeCents:500},{id:'hole',format:'hole',stakeCents:50}]);
 assert.deepEqual(results.map(x=>x.netCents[0]),[1800,1500,900]);
 assert(results.every(x=>x.completed));
});
test('partial Nassau is not final but front nine may be decided',()=>{
 const x=calculateGames(holes.slice(0,9),[{id:'n',format:'nassau',stakeCents:500}])[0];
 assert.equal(x.netCents[0],500);assert.equal(x.completed,false);
});
test('correcting a score recalculates without doubling money',()=>{
 const g=[{id:'hole',format:'hole',stakeCents:100}];
 assert.equal(calculateGames(holes,g)[0].netCents[0],1800);
 assert.equal(calculateGames([[5,4],...holes.slice(1)],g)[0].netCents[0],1600);
});
test('tie carries skins and incomplete games are pending',()=>{
 const x=calculateGames([[4,4],null],[{id:'s',format:'skins',stakeCents:100}])[0];
 assert.equal(x.netCents[0],0);assert.equal(x.pendingCarry,1);assert.equal(x.completed,false);
});
test('invalid or duplicate games are rejected',()=>{
 assert.throws(()=>calculateGames(holes,[{id:'x',format:'skins',stakeCents:1},{id:'x',format:'hole',stakeCents:1}]),/duplicate/);
 assert.throws(()=>calculateGames([[21,4]],[{id:'x',format:'skins',stakeCents:1}]),/score/);
});
