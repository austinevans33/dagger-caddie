import test from 'node:test';
import assert from 'node:assert/strict';
import {formatSoloScorecardBackup} from '../playtest/solo-scorecard-backup.js';
const active={selection:{course:{name:'Whispering Pines — Pines'},tee:{name:'White'}}};
const card={length:18,hole:2,scores:[4,5,...Array(16).fill(null)]};
test('Backup exports scored holes and verified tee facts, not fake pin distance',()=>{
 const text=formatSoloScorecardBackup(active,card,{holes:[{number:1,par:4,yards:382},{number:2,par:5,yards:511}]});
 assert.match(text,/Whispering Pines/);
 assert.match(text,/01 \| 4 \| 382 \| 4/);
 assert.match(text,/02 \| 5 \| 511 \| 5/);
 assert.match(text,/STROKES: 9 \(2\/18 holes scored\)/);
 assert.match(text,/Tee yardages are not live pin distances/);
 assert.doesNotMatch(text,/\bGPS pin\b/);
});
test('Missing provider facts are visibly blank without invented par',()=>{
 const text=formatSoloScorecardBackup(active,card,{holes:[]});
 assert.match(text,/01 \| — \| — \| 4/);
 assert.doesNotMatch(text,/TO VERIFIED PAR/);
});
test('Nine-hole back-nine backup includes only holes 10–18',()=>{
 const nine={length:9,nineStart:10,hole:12,scores:Array(9).fill(null).concat([4,5],Array(7).fill(null))};
 const text=formatSoloScorecardBackup(active,nine,null);
 assert.match(text,/9-hole round · Back nine/);
 assert.match(text,/10 \| — \| — \| 4/);
 assert.doesNotMatch(text,/01 \|/);
 assert.match(text,/STROKES: 9 \(2\/9 holes scored\)/);
});
test('Invalid or missing active round cannot create a fake backup',()=>{
 assert.equal(formatSoloScorecardBackup(null,card,null),null);
 assert.equal(formatSoloScorecardBackup(active,null,null),null);
 assert.equal(formatSoloScorecardBackup(active,{...card,scores:[]},null),null);
});
