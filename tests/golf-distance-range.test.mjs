import test from 'node:test';
import assert from 'node:assert/strict';
import {parseGolfDistance} from '../golf-distance-range.js';
test('speaks golfer not surveyor',()=>{
 assert.deepEqual(parseGolfDistance('maybe 235-240'),{min:235,max:240,approximate:true,label:'235–240 yards'});
 assert.equal(parseGolfDistance('about 165').label,'about 165 yards');
 assert.equal(parseGolfDistance('237').approximate,false);
});
test('refuses unbounded or nonsensical numbers',()=>{
 for(const s of ['900','-6','300-200','100-300','driver',''])assert.equal(parseGolfDistance(s),null);
});
