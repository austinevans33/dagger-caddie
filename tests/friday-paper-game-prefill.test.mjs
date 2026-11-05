import test from 'node:test';
import assert from 'node:assert/strict';
import {paperStrokeForGameHole as pick} from '../playtest/paper-to-game-prefill.js';
const scores=Array(18).fill(null);scores[0]=4;scores[1]=5;
const card={version:1,identity:'course|blue|123',source:'solo-scorecard',maySettleWagers:false,scores};
const game={format:'skins',players:['A','B'],holes:[]};
test('paper score prefill returns the current hole for explicitly selected player',()=>{
 const result=pick(card,game,{playerIndex:0,holeNumber:1});
 assert.deepEqual(result,{ok:true,score:4,holeNumber:1,playerIndex:0,roundIdentity:card.identity});
 assert.deepEqual(game.holes,[]);
});
test('correction is read live on following request without duplicating saved hole',()=>{
 const revised={...card,scores:[3,...scores.slice(1)]};
 assert.equal(pick(revised,game,{playerIndex:1,holeNumber:1}).score,3);
 assert.equal(pick(card,{...game,holes:[[4,5]]},{playerIndex:0,holeNumber:2}).score,5);
});
test('never copy stale round or missing strokes',()=>{
 assert.equal(pick(card,{...game,roundIdentity:'other'},{playerIndex:0,holeNumber:1}).ok,false);
 assert.equal(pick(card,game,{playerIndex:0,holeNumber:3}).ok,false);
 assert.equal(pick(card,game,{playerIndex:0,holeNumber:2}).ok,false);
 assert.equal(pick(card,game,{playerIndex:2,holeNumber:1}).ok,false);
});
test('only compatible game formats may copy and no ticket settlement is triggered',()=>{
 for(const format of ['skins','nassau','hole'])assert.equal(pick(card,{...game,format},{playerIndex:0,holeNumber:1}).ok,true);
 assert.equal(pick(card,{...game,format:'bingo'},{playerIndex:0,holeNumber:1}).ok,false);
 const invalid={...card,maySettleWagers:true};
 assert.equal(pick(invalid,game,{playerIndex:0,holeNumber:1}).ok,false);
});
