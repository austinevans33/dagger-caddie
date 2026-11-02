import test from 'node:test';
import assert from 'node:assert/strict';
import {buildYardagePage} from '../yardage-book.js';
test('verified scorecard creates cautious printed-book facts',()=>{
 const x=buildYardagePage({holeNumber:7,courseName:'Pines',teeName:'Blue',par:4,teeYards:412,scorecardSource:'opengolfapi-scorecard'},'7 IRON');
 assert.equal(x.yards,412);assert.equal(x.club,'7 IRON');assert.equal(x.distanceToPinVerified,false);
 assert.match(x.hazards,/not verified/);
});
test('no unverifiable yardage or fictional hazards',()=>{
 const x=buildYardagePage({holeNumber:4,par:3,teeYards:164},null);
 assert.equal(x.yards,null);assert.equal(x.source,'hole-details-unavailable');
 assert.equal(x.club,null);
});
test('reject invalid holes',()=>assert.equal(buildYardagePage({holeNumber:19}),null));
