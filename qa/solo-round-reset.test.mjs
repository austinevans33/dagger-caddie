import test from 'node:test';import assert from 'node:assert/strict';
import {saveActiveRound,readActiveRound} from '../staging-app/starters-desk-session.js';
import {saveSoloScore,readSoloCard} from '../staging-app/solo-scorecard.js';
import {archiveAndClearSoloRound,SOLO_ARCHIVE_KEY} from '../staging-app/solo-round-reset.js';
const sel={course:{provider:'opengolfapi',providerCourseId:'bayonet',name:'Bayonet',region:'NC'},tee:{providerTeeId:'blue',name:'Blue',totalYards:6200},holeNumber:1};
function memory(){const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};}
test('archive before switching course preserves scoring and leaves games untouched',()=>{
 const s=memory();saveActiveRound(s,sel,1234);saveSoloScore(s,5);s.setItem('dcc_house_ghost_draft_v1','ghost');s.setItem('dagger_foursome_active','wagers');
 assert.deepEqual(archiveAndClearSoloRound(s,{now:5678}),{ok:true,archived:true});
 assert.equal(readActiveRound(s),null);assert.equal(readSoloCard(s),null);
 const saved=JSON.parse(s.getItem(SOLO_ARCHIVE_KEY));assert.equal(saved[0].card.scores[0],5);
 assert.equal(s.getItem('dcc_house_ghost_draft_v1'),'ghost');assert.equal(s.getItem('dagger_foursome_active'),'wagers');
 saveActiveRound(s,{...sel,course:{...sel.course,providerCourseId:'westborough'}},9999);
 assert.equal(readActiveRound(s).selection.course.providerCourseId,'westborough');
});
test('failed archive write retains old course and scorecard',()=>{
 const s=memory();saveActiveRound(s,sel,1234);saveSoloScore(s,4);const bad={...s,setItem(k,v){if(k===SOLO_ARCHIVE_KEY)throw Error('Storage full');s.setItem(k,v);}};
 assert.equal(archiveAndClearSoloRound(bad).ok,false);
 assert.equal(readSoloCard(s).scores[0],4);assert.equal(readActiveRound(s).selection.course.providerCourseId,'bayonet');
});
test('empty round can be cleared without creating fake archive',()=>{
 const s=memory();saveActiveRound(s,sel,1234);
 assert.equal(archiveAndClearSoloRound(s).ok,true);assert.equal(s.getItem(SOLO_ARCHIVE_KEY),null);
});
