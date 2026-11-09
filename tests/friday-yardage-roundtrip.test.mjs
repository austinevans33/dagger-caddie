import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../playtest/index.html',import.meta.url),'utf8');
const book=readFileSync(new URL('../playtest/yardage-preview.html',import.meta.url),'utf8');

test('Yardage Book round-trip preserves a valid selected hole',()=>{
 assert.match(book,/sessionStorage\.setItem\('dccFridayYardageHole',String\(number\)\)/);
 assert.match(app,/sessionStorage\.getItem\('dccFridayYardageHole'\)/);
 assert.match(app,/Number\.isInteger\(n\)&&n>=1&&n<=18/);
 assert.match(app,/yardage-preview\.html\?hole='\+picker\.value/);
});
test('Back to Play goes to the same local playtest and never triggers a score write',()=>{
 assert.match(book,/id="backToPlay"/);
 assert.match(book,/location\.assign\('\.\/'\)/);
 assert.doesNotMatch(book,/setDoc\(|updateDoc\(|addDoc\(|localStorage\.setItem\(/);
});
test('Book hole changes save navigation state and stay inside the selected range',()=>{
 assert.match(book,/number=Math\.max\(start,Math\.min\(end,number\)\)/);
 assert.match(book,/Number\.isInteger\(requested\)&&requested>=1&&requested<=18/);
 assert.match(book,/readYardageHole/);
});
