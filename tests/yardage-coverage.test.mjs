import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyYardageCoverage,yardageHoleFeatures} from '../yardage-coverage.js';
const course={name:'Example Country Club'};
test('identified course gets honest basic book even with no scorecard',()=>{
 const result=classifyYardageCoverage({course});
 assert.equal(result.tier,'basic');assert.equal(result.holesWithVerifiedScorecard,0);
});
test('verified pars and tee yards upgrade book without invented maps',()=>{
 const result=classifyYardageCoverage({course,holes:[{number:1,par:4,yards:410}]});
 assert.equal(result.tier,'scorecard');assert.equal(result.canDrawMappedHole,false);
});
test('verified geometry enables only holes actually mapped',()=>{
 const geometry=[{holeNumber:4,source:'verified-geometry',features:[{type:'fairway',coordinates:[[1,2],[3,4]]}]}];
 const coverage=classifyYardageCoverage({course,geometry});
 assert.equal(coverage.tier,'illustrated');assert.equal(coverage.holesWithVerifiedGeometry,1);
 assert.equal(yardageHoleFeatures(coverage,geometry,3),null);
 assert.deepEqual(yardageHoleFeatures(coverage,geometry,4),[{type:'fairway',coordinates:[[1,2],[3,4]]}]);
});
test('untrusted geometry and missing course cannot imply detailed coverage',()=>{
 assert.equal(classifyYardageCoverage({}).tier,'unavailable');
 assert.equal(classifyYardageCoverage({course,geometry:[{holeNumber:2,source:'guess',features:[{coordinates:[[1,2],[3,4]]}]}]}).tier,'basic');
});
