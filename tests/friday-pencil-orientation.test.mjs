import test from 'node:test';
import assert from 'node:assert/strict';
import {pencilOrientation} from '../playtest/yardage-pencil-orientation.js';
test('all 18 holes produce an accessible sketch but no invented hazards or bends',()=>{
 for(let hole=1;hole<=18;hole++){
  const book=pencilOrientation({holeNumber:hole});
  assert.equal(book.hole,hole);
  assert.match(book.svg,/role="img"/);
  assert.match(book.svg,/actual hole direction, shape, and hazards are unknown/);
  assert.doesNotMatch(book.svg,/bunker|water|dogleg/i);
 }
});
test('verified par and yards can accompany a pencil orientation without becoming fabricated map distances',()=>{
 const p3=pencilOrientation({holeNumber:4,par:3,yards:165});
 const p5=pencilOrientation({holeNumber:9,par:5,yards:530});
 assert.equal(p3.yards,165);
 assert.equal(p5.par,5);
 assert.notEqual(p3.svg,p5.svg);
 assert.equal(pencilOrientation({par:9,yards:-2}).yards,null);
});
