import test from 'node:test';
import assert from 'node:assert/strict';
import {saveActiveRound} from '../app/61f9e9de0a/starters-desk-session.js';
import {startSoloCard,saveSoloScore,readSoloCard} from '../app/61f9e9de0a/solo-scorecard.js';
import {founderCatalogRecords,founderTeesForCourse} from '../app/61f9e9de0a/founders-verified-scorecards.js';
test('solo scoring follows shotgun order and persists physical hole scores',()=>{
 const [course]=founderCatalogRecords('Shining Rock');
 const tee=founderTeesForCourse(course)[0];
 const entries=new Map();const storage={getItem:k=>entries.get(k)??null,setItem:(k,v)=>entries.set(k,v)};
 assert(saveActiveRound(storage,{course,tee,holeNumber:17},123));
 assert.equal(startSoloCard(storage).hole,17);
 const order=[17,18,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
 for(const hole of order){assert.equal(readSoloCard(storage).hole,hole);assert(saveSoloScore(storage,4));}
 assert.equal(readSoloCard(storage).hole,16);
 assert.deepEqual(readSoloCard(storage).scores,Array(18).fill(4));
});
