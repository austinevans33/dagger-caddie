import test from 'node:test';
import assert from 'node:assert/strict';
import {yardageBookPage} from '../yardage-book.js';
const holes=[{number:1,par:4,yards:405,hazards:[{type:'bunker',note:'Left of green'}]},{number:18,par:5,yards:550}];
test('book navigates first through last hole with safe bounds',()=>{for(let n=1;n<=18;n++){const x=yardageBookPage({holes,holeNumber:n});assert.equal(x.holeNumber,n);assert.equal(x.previousHole,n===1?null:n-1);assert.equal(x.nextHole,n===18?null:n+1);}});
test('only verified data appears, never invented yardages',()=>{const a=yardageBookPage({holes,holeNumber:1});assert.equal(a.displayYards,'405');assert.equal(a.hazards.length,1);const x=yardageBookPage({holes,holeNumber:2});assert.equal(x.verified,false);assert.equal(x.displayYards,'Not verified');assert.equal(x.displayPar,'Not verified');assert.equal(x.hazards.length,0);});
test('invalid and duplicate holes cannot override first validated record',()=>{const x=yardageBookPage({holes:[{number:1,par:4,yards:405},{number:1,par:5,yards:580},{number:3,par:9,yards:400}]});assert.equal(x.displayYards,'405');assert.equal(x.verifiedHoleCount,1);});
test('invalid navigation is rejected',()=>{for(const n of [0,19,1.5,NaN])assert.throws(()=>yardageBookPage({holeNumber:n}));});
