import test from 'node:test';import assert from 'node:assert/strict';
import {saveActiveRound} from '../staging-app/starters-desk-session.js';
import {startSoloCard,saveSoloScore,setSoloLength,summarizeSoloCard} from '../staging-app/solo-scorecard.js';
import {readFileSync} from 'node:fs';
const selection={course:{provider:'opengolfapi',providerCourseId:'bayonet',name:'Bayonet',region:'NC'},tee:{providerTeeId:'blue',name:'Blue',totalYards:6200},holeNumber:1};
const store=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};};
test('9 hole completion stops at hole 9 and produces accurate report',()=>{
 const s=store();saveActiveRound(s,selection,111);setSoloLength(s,9);
 for(let i=0;i<9;i++)saveSoloScore(s,4);
 const card=startSoloCard(s),report=summarizeSoloCard(card,Array(9).fill(4));
 assert.equal(card.hole,9);assert.equal(report.total,36);assert.equal(report.complete,true);assert.equal(report.relativeToPar,0);
});
test('18 holes gives a turn recap before completing back nine',()=>{
 const s=store();saveActiveRound(s,selection,222);for(let i=0;i<9;i++)saveSoloScore(s,5);
 const report=summarizeSoloCard(startSoloCard(s));assert.equal(report.turnComplete,true);assert.equal(report.complete,false);assert.equal(report.front,45);assert.equal(report.relativeToPar,null);
});
test('pencil UI does not overwrite House Ghost or betting data',()=>{
 const ui=readFileSync(new URL('../staging-app/solo-scorecard-ui.js',import.meta.url),'utf8');
 assert.match(ui,/DAGGER COUNTRY CLUB/);assert.match(ui,/score<=10/);assert.doesNotMatch(ui,/textContent='10\+'/);assert.match(ui,/Pencil in your strokes/);
 assert.doesNotMatch(ui,/setItem\(['"](?:dcc_house_ghost|dagger_foursome|dcc_bet)/);
});
