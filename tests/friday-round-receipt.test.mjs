import test from 'node:test';import assert from 'node:assert/strict';import {makeRoundReceipt} from '../round-receipt.js';
test('balanced group recap shows correct winner and full receipt',()=>{
 const s=makeRoundReceipt({course:'Pines',holes:18,game:'Nassau',players:[{name:'Keith',net:15},{name:'Buddy',net:-15}],highlight:'Three putts from four feet'});
 assert.match(s,/Keith: \+\$15\.00/);assert.match(s,/Buddy: -\$15\.00/);assert.match(s,/Top earner: Keith/);assert.match(s,/Three putts/);
});
test('unbalanced totals and missing players cannot generate misleading receipt',()=>{
 assert.throws(()=>makeRoundReceipt({players:[{name:'A',net:10},{name:'B',net:-9}]}),/add up/);
 assert.throws(()=>makeRoundReceipt({players:[{name:'A',net:10}]}),/2 to 4/);
});

import {readRoundRecap} from '../playtest/round-recap.js';

const selection = {
 course:{provider:'opengolfapi',providerCourseId:'course',name:'Pines',region:'NC'},
 tee:{providerTeeId:'blue',name:'Blue',totalYards:6200},holeNumber:1
};
const active = {version:1,selection,selectedAt:100};
const card = {version:1,identity:'course|blue|100',hole:3,length:9,scores:[4,5,...Array(16).fill(null)]};
const storage = records => ({getItem:key => Object.hasOwn(records,key) ? JSON.stringify(records[key]) : null});

test('recap combines the scored card with archived games from the exact round',()=>{
 const text = readRoundRecap(storage({
  dcc_active_round_course_v1:active,dcc_solo_scorecard_v1:card,
  dagger_bbb_history:[
   {roundIdentity:card.identity,ended:200,players:['A','B'],holes:[[0,0,1]],stake:2},
   {roundIdentity:'course|blue|80',ended:95,players:['Old A','Old B'],holes:[[0,0,0]],stake:2}
  ]
 }));
 assert.match(text,/Pines · Blue\n9 strokes · 2 of 9 holes recorded/);
 assert.match(text,/Bingo Bango Bongo.*\nA · 2 pts · \+\$2\.00/);
 assert.doesNotMatch(text,/Old A/);
});

test('latest finished Money Room uses archived balances and excludes a newer live snapshot',()=>{
 const match = {format:'hole',players:['A','B'],holes:{1:[4,5]},payouts:[2,-2],ended:200,archived:true};
 const text = readRoundRecap(storage({dagger_room_archives:[match,{...match,archived:false,ended:300,players:['Live A','Live B']}]}));
 assert.match(text,/Money Room · Head-to-head · 1 holes recorded\nA · \+\$2\.00/);
 assert.doesNotMatch(text,/Live A/);
});

test('archived card works after check-out and an unrelated active card is rejected',()=>{
 assert.match(readRoundRecap(storage({
  dcc_active_round_course_v1:{...active,selectedAt:999},dcc_solo_scorecard_v1:card,
  dcc_solo_round_archive_v1:[{selection,selectedAt:100,archivedAt:200,card}]
 })),/9 strokes/);
 assert.equal(readRoundRecap(storage({dcc_active_round_course_v1:{...active,selectedAt:999},dcc_solo_scorecard_v1:card})), '');
});
