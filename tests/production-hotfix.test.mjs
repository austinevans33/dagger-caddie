import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const js=readFileSync('app/61f9e9de0a/clubhouse-home.js','utf8');
const css=readFileSync('app/61f9e9de0a/clubhouse-home.css','utf8');
const gate=readFileSync('scripts/production-bundle.py','utf8');
test('original seal appears inside focused Clubhouse',()=>{
 assert.match(js,/dcc-home-heritage/);
 assert.match(js,/dcc-approved-seal\.png/);
 assert.match(css,/dcc-home-heritage img/);
});
test('course picker uses published records and existing active-round persistence',()=>{
 assert.match(js,/founderCatalogRecords\(search\.value\)/);
 assert.match(js,/founderTeesForCourse\(course\)/);
 assert.match(js,/saveActiveRound\(localStorage/);
 assert.match(js,/dccHomeCourseConfirm/);
 assert.match(js,/Switch Yardage Book course and tee/);
});
test('handicap routes to real Player Locker profile editor',()=>{
 assert.match(js,/openTab\('bag'\)/);
 assert.match(js,/getElementById\('golferHandicap'\)/);
 assert.doesNotMatch(js,/localStorage\.setItem\(['"]handicap/);
});
test('mobile content has safe clearance below navigation',()=>{
 assert.match(css,/safe-area-inset-bottom/);
 assert.match(css,/padding-bottom:calc\(155px/);
});
test('production hotfix gate allows only two explicit assets',()=>{
 assert.match(gate,/HOTFIX_FILES = frozenset/);
 assert.match(gate,/clubhouse-home\.js/);
 assert.match(gate,/clubhouse-home\.css/);
});
