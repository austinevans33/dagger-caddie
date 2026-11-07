import test from 'node:test';
import assert from 'node:assert/strict';
import {buildNineteenthRecap} from '../playtest/nineteenth-recap.js';
const active={selectedAt:123456,selection:{course:{providerCourseId:'course-A',name:'Bayonet at Puppy Creek'},tee:{providerTeeId:'blue',name:'Blue'}}};
const card=(scores,length=18)=>({identity:'course-A|blue|123456',length,scores:[...scores,...Array(18-scores.length).fill(null)],hole:1});
const scorecard={holes:Array.from({length:18},(_,i)=>({number:i+1,par:i===0?5:4}))};
test('19th Hole creates a complete true score-based recap without manual input',()=>{
 const scores=[4,...Array(17).fill(4)];
 const a=buildNineteenthRecap({active,card:card(scores),scorecard,caddy:'keith'});
 assert.equal(a.complete,true);assert.equal(a.scored,18);
 assert.equal(a.total,72);assert.equal(a.relative,-1);
 assert.match(a.text,/Bright spot: Hole 1/);
 assert.doesNotMatch(a.text,/wager|\$\d|bunker shot/i);
 assert.equal(a.text,buildNineteenthRecap({active,card:card(scores),scorecard,caddy:'keith'}).text);
});
test('unfinished rounds never claim to be complete',()=>{
 const a=buildNineteenthRecap({active,card:card([5,6]),scorecard,caddy:'vinny'});
 assert.equal(a.complete,false);assert.equal(a.scored,2);
 assert.match(a.text,/2\/18 holes scored/);
 assert.match(a.text,/No final verdict/);
});
test('unverified pars do not create invented birdies or to-par totals',()=>{
 const a=buildNineteenthRecap({active,card:card([3,4]),scorecard:{holes:[]}});
 assert.equal(a.relative,null);assert.equal(a.knownParHoles,0);
 assert.doesNotMatch(a.text,/birdie|to par|Bright spot/i);
});
test('round identity mismatch never recaps a different course or tee',()=>{
 const bad=card([4]);bad.identity='other|blue|123456';
 assert.equal(buildNineteenthRecap({active,card:bad,scorecard}),null);
 assert.equal(buildNineteenthRecap({active:null,card:card([4]),scorecard}),null);
});
test('nine-hole cards scope the recap and never use scores from the other nine',()=>{
 const scores=Array(18).fill(null);scores[9]=4;scores[10]=5;
 const a=buildNineteenthRecap({active,card:{...card(scores,9),nineStart:10},scorecard});
 assert.equal(a.scored,2);assert.equal(a.expected,9);assert.equal(a.total,9);
 assert.match(a.text,/2\/9 holes scored/);
});
test('malformed scores are ignored without writing or inventing facts',()=>{
 const bad=card([NaN,99,-1,null]);
 const before=JSON.stringify(bad);
 const a=buildNineteenthRecap({active,card:bad,scorecard,caddy:'notacaddy'});
 assert.equal(a.scored,0);assert.equal(a.total,0);assert.equal(a.name,'Your caddy');
 assert.equal(JSON.stringify(bad),before);
});
