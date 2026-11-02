import test from 'node:test';
import assert from 'node:assert/strict';
import {previewWeekendFromRoom} from '../weekend-money-room-preview.js';
const games=[{id:'skins',format:'skins',stakeCents:100},{id:'hole',format:'hole',stakeCents:500}];
test('two-phone room snapshot calculates two games without mutation',()=>{
 const room={players:['You','Buddy'],holes:{1:[4,5],2:[5,4]},archived:false};
 const prior=JSON.stringify(room);const result=previewWeekendFromRoom({room,games});
 assert.equal(result.recordedHoles,2);assert.equal(result.results.length,2);
 assert.equal(result.readyForFinal,false);assert.equal(JSON.stringify(room),prior);
});
test('a corrected shared hole recalculates all side games',()=>{
 const room={players:['A','B'],holes:{1:[4,5]},archived:false};
 const first=previewWeekendFromRoom({room,games});
 const edited=previewWeekendFromRoom({room:{...room,holes:{1:[5,4]}},games});
 assert.equal(edited.balances[0],-first.balances[0]);
});
test('archiving an incomplete room never authorizes final results',()=>{
 const preview=previewWeekendFromRoom({room:{players:['A','B'],holes:{1:[4,5]},archived:true},games});
 assert.equal(preview.readyForFinal,false);
});
test('invalid shared scores fail closed',()=>assert.throws(
 ()=>previewWeekendFromRoom({room:{players:['A','B'],holes:{1:[4,0]}},games}),/Invalid shared hole/));
