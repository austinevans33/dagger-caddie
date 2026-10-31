import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCaddyClubBaseline,formatCaddyClubBaseline} from '../playtest/caddy-club-baseline.js';
const clubs=[
 {name:'7 iron',manualCarry:164},{name:'8 iron',manualCarry:151},
 {name:'6 iron',manualCarry:177},{name:'Wedge',carry:125}
];
test('Golfer carries produce a neutral reference, not a promised shot result',()=>{
 const result=buildCaddyClubBaseline(clubs,168);
 assert.equal(result.source,'golfer-saved-carry');
 assert.deepEqual(result.choices.map(c=>c.name),['7 iron','6 iron']);
 assert.deepEqual(result.choices.map(c=>c.differenceYards),[-4,9]);
 assert.match(formatCaddyClubBaseline(result),/neutral conditions only/);
});
test('No actual target or club data never produces a made-up club',()=>{
 assert.equal(buildCaddyClubBaseline(clubs,null),null);
 assert.equal(buildCaddyClubBaseline(clubs,''),null);
 assert.equal(buildCaddyClubBaseline(clubs,900),null);
 assert.equal(buildCaddyClubBaseline([],165),null);
 assert.match(formatCaddyClubBaseline(null),/Save club carry/);
});
test('Reject out-of-range or unnamed carries and preserve manual carry precedence',()=>{
 const result=buildCaddyClubBaseline([
  {name:'4 iron',manualCarry:212,carry:235},
  {name:'Bad',manualCarry:999},
  {name:'',carry:165},
  {name:'5 iron',carry:195}
 ],210);
 assert.equal(result.choices[0].carry,212);
 assert.equal(result.choices.length,2);
});
