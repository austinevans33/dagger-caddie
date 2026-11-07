import test from 'node:test';
import assert from 'node:assert/strict';
import {composeHoleQuestion,saveHoleQuestion,takeHoleQuestion} from '../playtest/yardage-caddy-handoff.js';
const store=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}};
test('verified tee facts never masquerade as live pin distance',()=>{
 const q=composeHoleQuestion({courseName:'Pines',teeName:'Blue',holeNumber:4,par:4,yards:421});
 assert.match(q,/421 yards from the Blue tee/);
 assert.match(q,/NOT my current distance to the pin/);
 assert.match(q,/ask me for current distance/);
});
test('missing provider facts do not invent par, yardage or hazard',()=>{
 const q=composeHoleQuestion({courseName:'Bayonet',teeName:'White',holeNumber:12});
 assert.match(q,/not yet verified/);
 assert.doesNotMatch(q,/\d{3} yards/);
 assert.equal(composeHoleQuestion({courseName:'Pines',teeName:'Blue',holeNumber:0}),null);
});
test('one-time question handoff expires and never persists indefinitely',()=>{
 const s=store(),q=composeHoleQuestion({courseName:'Pines',teeName:'White',holeNumber:1,par:4,yards:400});
 assert.equal(saveHoleQuestion(s,q,10000),true);
 assert.equal(takeHoleQuestion(s,10001),q);
 assert.equal(takeHoleQuestion(s,10002),null);
 assert.equal(saveHoleQuestion(s,q,10000),true);
 assert.equal(takeHoleQuestion(s,10000+21*60*1000),null);
});
