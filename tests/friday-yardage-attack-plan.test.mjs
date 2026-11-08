import test from 'node:test';
import assert from 'node:assert/strict';
import {yardageCaddyNote} from '../playtest/yardage-caddy-notes.js';

const hole={par:4,yards:410};
const ring=[[-79,35],[-78.9999,35],[-78.9999,35.0001]];
const feature=type=>({type,points:ring});

test('mapped water and bunker outlines inform attack plan without inventing carries or safe side',()=>{
 const note=yardageCaddyNote({caddy:'vinny',hole,features:[feature('water'),feature('bunker')]});
 assert.match(note.advice,/Mapped trouble: 1 mapped water area and 1 mapped bunker/);
 assert.match(note.second,/Identify the water/);
 assert.match(note.disclaimer,/on-course confirmation/);
 assert.doesNotMatch(note.advice,/left|right|clear|carry \d+/i);
 assert.deepEqual(note.trouble,['1 mapped water area','1 mapped bunker']);
});

test('scorecard-only holes still give strategy but never claim hazard coverage',()=>{
 const note=yardageCaddyNote({caddy:'keith',hole,features:[]});
 assert.match(note.advice,/Par 4/);
 assert.match(note.disclaimer,/No unverified hazards/);
 assert.deepEqual(note.trouble,[]);
});

test('missing scorecard keeps distances unknown and unsupported feature shapes excluded',()=>{
 const note=yardageCaddyNote({caddy:'reginald',hole:null,features:[{type:'water',points:[]}]});
 assert.match(note.advice,/verified hole yardage/);
 assert.deepEqual(note.trouble,[]);
});
