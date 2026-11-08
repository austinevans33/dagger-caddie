import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../playtest/index.html',import.meta.url),'utf8');
const preview=readFileSync(new URL('../playtest/yardage-preview.html',import.meta.url),'utf8');
test('Caddy provides one isolated Yardage Book QA entry',()=>{
 assert.equal((app.match(/id="dccFridayYardageLink"/g)||[]).length,1);
 assert.match(app,/link\.href='yardage-preview\.html\?hole='\+picker\.value/);
 assert.match(preview,/loadYardageState/);
});
test('Yardage Book supports all 18 holes, previous, next, return and missing course data',()=>{
 assert.match(preview,/Array\.from\(\{length:holeCount\}/);
 assert.match(preview,/id="prev"/);assert.match(preview,/id="next"/);
 assert.match(preview,/id="return"/);assert.match(preview,/location\.assign\('\.\/'\)/);
 assert.match(preview,/Tee distances unavailable for this course/);
 assert.match(preview,/sessionStorage\.setItem\('dccFridayYardageHole'/);
 assert.match(app,/sessionStorage\.getItem\('dccFridayYardageHole'/);
});
