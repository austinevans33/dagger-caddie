import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseAllHeartMoment} from '../playtest/all-heart-moments.js';
const base={courseId:'verified-course',holeNumber:6,par:4,strokeIndex:15,moneyRoomPlayers:3};
test('offers a suggestion but never creates a bet',()=>{
 assert.deepEqual(chooseAllHeartMoment(base),{key:'verified-course:6',type:'dare',title:'THIS HOLE IS BEGGING FOR ACTION',description:'Short par 4. The boys are watching. Open a side-bet proposal?',action:'open-ticket-window'});
});
test('respects dismissal, cooldown, max and opt-out',()=>{
 assert.equal(chooseAllHeartMoment(base,{dismissedKeys:['verified-course:6']}),null);
 assert.equal(chooseAllHeartMoment(base,{lastShownHole:4}),null);
 assert.equal(chooseAllHeartMoment(base,{shownCount:3}),null);
 assert.equal(chooseAllHeartMoment({...base,enabled:false}),null);
});
test('rejects unverified historic claims',()=>{
 const historic={courseId:'verified-course',holeNumber:6,player:'Pro',strokes:4,event:'2024 Open',sourceUrl:'https://example.org/results'};
 assert.equal(chooseAllHeartMoment({...base,moneyRoomPlayers:0,historicalChallenge:historic}),null);
 assert.equal(chooseAllHeartMoment({...base,historicalChallenge:{...historic,verified:true}}).type,'legend');
 assert.equal(chooseAllHeartMoment({...base,historicalChallenge:{...historic,verified:true,sourceUrl:'javascript:alert(1)'}}).type,'dare');
});
test('never invents ghost scores or shows on inactive rounds',()=>{
 assert.equal(chooseAllHeartMoment({...base,moneyRoomPlayers:0,ghostRival:{strokes:4}}),null);
 assert.equal(chooseAllHeartMoment({...base,moneyRoomPlayers:0,ghostRival:{eligible:true,strokes:4}}).type,'grudge');
 assert.equal(chooseAllHeartMoment({...base,roundActive:false}),null);
});
