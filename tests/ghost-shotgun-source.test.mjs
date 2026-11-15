import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync('index.html','utf8');
test('Ghost uses real course hole number for scorecard lookup and pending simulation',()=>{
 assert.match(html,/function dccGhostActualHole\(played\)/);
 assert.match(html,/const hole = dccGhostActualHole\(dccGhostHoles\.length\)/);
 assert.match(html,/facts\.number === hole/);
 assert.match(html,/pending\?\.hole === dccGhostActualHole\(saved\.holes\.length\)/);
});
test('Ghost starts on selected hole and locks selection once a match is underway',()=>{
 assert.match(html,/id='dccGhostStartHole'/);
 assert.match(html,/startControl\.disabled=locked/);
 assert.match(html,/startHole:dccGhostStartHole/);
 assert.match(html,/holeNumber:dccGhostActualHole\(dccGhostHoles\.length\)/);
 assert.match(html,/hole\.holeNumber\|\|dccGhostActualHole\(index\)/);
});
