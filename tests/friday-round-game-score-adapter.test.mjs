import test from 'node:test';
import assert from 'node:assert/strict';
import {projectPaperScoresIntoGame as project} from '../playtest/round-game-score-adapter.js';
const snapshot=(scores=Array(18).fill(null),identity='course|blue|123')=>({version:1,identity,scores});
const game=()=>({format:'nassau',roundIdentity:'course|blue|123',players:['A','B'],holes:[[4,5],[5,4]]});
test('projects only selected paper-card player without modifying protected game',()=>{
 const source=game(),before=JSON.stringify(source);
 const scores=Array(18).fill(null);scores[0]=3;scores[1]=5;
 const result=project(snapshot(scores),source,{roundIdentity:source.roundIdentity,playerIndex:0});
 assert.equal(result.status,'preview-updated');
 assert.deepEqual(result.changedHoles,[1]);
 assert.deepEqual(result.holes[0],[3,5]);
 assert.deepEqual(result.holes[1],[5,4]);
 assert.deepEqual(result.holes[2],[null,null]);
 assert.equal(JSON.stringify(source),before);
 assert.equal(result.maySettleWagers,false);
 assert.ok(Object.isFrozen(result.holes[0]));
});
test('corrections remove stale strokes, preserving opponent data',()=>{
 const source=game(),scores=Array(18).fill(null);scores[0]=4;scores[1]=null;
 const result=project(snapshot(scores),source,{roundIdentity:source.roundIdentity,playerIndex:0});
 assert.deepEqual(result.changedHoles,[2]);
 assert.deepEqual(result.holes[1],[null,4]);
});
test('game identity mismatch, missing player and unsupported formats refuse projection',()=>{
 const source=game();
 assert.equal(project(snapshot([], 'other'),source,{roundIdentity:source.roundIdentity,playerIndex:0}).status,'incompatible');
 assert.equal(project(snapshot(),source,{roundIdentity:source.roundIdentity,playerIndex:2}).status,'incompatible');
 assert.equal(project(snapshot(),{...source,format:'bingo'},{roundIdentity:source.roundIdentity,playerIndex:0}).status,'incompatible');
 assert.equal(project(snapshot(),source,{playerIndex:0}).status,'incompatible');
 assert.equal(project(snapshot(),{...source,roundIdentity:'wrong'},{roundIdentity:'course|blue|123',playerIndex:0}).status,'incompatible');
});
test('invalid historic game scores or card strokes never enter a money preview',()=>{
 const source=game();
 assert.equal(project(snapshot(),{...source,holes:[[99,4]]},{roundIdentity:source.roundIdentity,playerIndex:0}).status,'invalid-game');
 const scores=Array(18).fill(null);scores[0]=20;
 assert.equal(project(snapshot(scores),source,{roundIdentity:source.roundIdentity,playerIndex:0}).status,'invalid-card');
});
test('skins uses the same safe projection and does not auto-settle',()=>{
 const source={...game(),format:'skins'};
 const result=project(snapshot(),source,{roundIdentity:source.roundIdentity,playerIndex:1});
 assert.equal(result.status,'preview-updated');
 assert.deepEqual(result.holes[0],[4,null]);
 assert.equal(result.maySettleWagers,false);
});

test('preview refuses to project scores into legacy games without an explicit bound round',()=>{
 const source=game();delete source.roundIdentity;
 const result=project(snapshot(),source,{roundIdentity:'course|blue|123',playerIndex:0});
 assert.equal(result.status,'incompatible');
 assert.equal(result.holes,null);
 assert.equal(result.maySettleWagers,false);
});
