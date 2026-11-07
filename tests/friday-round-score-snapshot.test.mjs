import test from 'node:test';
import assert from 'node:assert/strict';
import {saveActiveRound} from '../playtest/starters-desk-session.js';
import {startSoloCard,saveSoloScore,setSoloHole} from '../playtest/solo-scorecard.js';
import {readRoundScoreSnapshot,compareRoundScoreSnapshots} from '../playtest/round-score-snapshot.js';
function store(){const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}}
const selection=(course='pines',tee='white')=>({course:{provider:'opengolfapi',providerCourseId:course,name:course,region:'NC'},tee:{providerTeeId:tee,name:tee,totalYards:6500},holeNumber:1});
test('score snapshot is read-only and exposes correctly identified strokes',()=>{
 const storage=store();assert.equal(readRoundScoreSnapshot(storage),null);
 assert.equal(saveActiveRound(storage,selection(),123456),true);
 startSoloCard(storage);
 saveSoloScore(storage,4);
 const snapshot=readRoundScoreSnapshot(storage);
 assert.equal(snapshot.scores[0],4);assert.equal(snapshot.scores[1],null);
 assert.deepEqual(snapshot.completedHoles,[1]);assert.equal(snapshot.completedCount,1);
 assert.equal(snapshot.totalStrokes,4);assert.equal(snapshot.maySettleWagers,false);
 assert.ok(Object.isFrozen(snapshot));assert.ok(Object.isFrozen(snapshot.scores));
});
test('corrections are represented by hole, never as a duplicate score',()=>{
 const storage=store();saveActiveRound(storage,selection(),123457);
 startSoloCard(storage);saveSoloScore(storage,5);
 const before=readRoundScoreSnapshot(storage);
 setSoloHole(storage,1);saveSoloScore(storage,4);
 const after=readRoundScoreSnapshot(storage);
 assert.deepEqual(compareRoundScoreSnapshots(before,after),{kind:'updated',changes:[{hole:1,before:5,after:4}]});
 assert.equal(after.completedCount,1);assert.equal(after.totalStrokes,4);
});
test('course switches do not leak prior course scores',()=>{
 const storage=store();saveActiveRound(storage,selection(),123458);
 startSoloCard(storage);saveSoloScore(storage,4);
 const old=readRoundScoreSnapshot(storage);
 saveActiveRound(storage,selection('bayonet','blue'),123459);
 assert.equal(readRoundScoreSnapshot(storage),null);
 startSoloCard(storage);const next=readRoundScoreSnapshot(storage);
 assert.equal(next.completedCount,0);
 assert.equal(compareRoundScoreSnapshots(old,next).kind,'different-round');
});
test('reading snapshot never alters unrelated wagers or local keys',()=>{
 const storage=store();saveActiveRound(storage,selection(),123460);
 startSoloCard(storage);storage.setItem('dagger_foursome_active','{"protected":true}');
 const original=storage.getItem('dagger_foursome_active');
 readRoundScoreSnapshot(storage);
 assert.equal(storage.getItem('dagger_foursome_active'),original);
});
