import test from 'node:test';import assert from 'node:assert/strict';
import {saveActiveRound} from '../staging-app/starters-desk-session.js';
import {startSoloCard,saveSoloScore,setSoloHole,readSoloCard} from '../staging-app/solo-scorecard.js';
const sel={course:{provider:'opengolfapi',providerCourseId:'b',name:'Bayonet',region:'NC'},tee:{providerTeeId:'blue',name:'Blue',totalYards:6200},holeNumber:1};
const store=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)}};
test('solo card saves strokes and moves to next hole, permits corrections',()=>{
 const s=store();saveActiveRound(s,sel,1234);assert.equal(startSoloCard(s).hole,1);
 assert.equal(saveSoloScore(s,5).hole,2);assert.equal(readSoloCard(s).scores[0],5);
 setSoloHole(s,1);saveSoloScore(s,4);assert.equal(readSoloCard(s).scores[0],4);
});
test('invalid scores do not write or advance',()=>{const s=store();saveActiveRound(s,sel,1234);startSoloCard(s);assert.equal(saveSoloScore(s,0),null);assert.equal(readSoloCard(s).hole,1)});
test('switching tee starts new solo card without modifying existing wager records',()=>{
 const s=store();saveActiveRound(s,sel,1234);saveSoloScore(s,5);
 s.setItem('dcc_house_ghost_draft_v1','important');s.setItem('dagger_foursome_active','preserve');
 saveActiveRound(s,{...sel,tee:{...sel.tee,providerTeeId:'white',name:'White'}},2345);
 assert.equal(startSoloCard(s).scores[0],null);assert.equal(s.getItem('dcc_house_ghost_draft_v1'),'important');assert.equal(s.getItem('dagger_foursome_active'),'preserve');
});
