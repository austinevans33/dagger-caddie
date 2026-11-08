import test from 'node:test';
import assert from 'node:assert/strict';
import {bayonetOsmTrouble} from '../playtest/bayonet-osm-trouble.js';
import {yardageCaddyNote} from '../playtest/yardage-caddy-notes.js';
const selection={course:{provider:'opengolfapi',providerCourseId:'1c31d1fb-faa1-4d9f-80a2-f281982df126',name:'Bayonet at Puppy Creek'}};
test('Bayonet 18-hole OSM trouble survey is course-specific and not a guessed map',()=>{
 const results=Array.from({length:18},(_,i)=>bayonetOsmTrouble(selection,i+1));
 assert.equal(results.filter(Boolean).length,17);
 assert.equal(results[10],null,'hole eleven is not surveyed for obstacles');
 assert.equal(results[3].left,true);
 assert.equal(results[3].right,true);
 assert.equal(bayonetOsmTrouble({course:{provider:'opengolfapi',name:'Other Course'}},4),null);
 assert.equal(bayonetOsmTrouble(selection,19),null);
 assert.doesNotMatch(results[3].label,/bunker|water|carry \d+/i);
});
test('survey side hints improve Bayonet plan without claiming selected-tee carries',()=>{
 const survey=bayonetOsmTrouble(selection,4);
 const note=yardageCaddyNote({hole:{par:4,yards:386},survey,features:[]});
 assert.match(note.advice,/trouble on both sides/);
 assert.match(note.second,/check the actual fairway width/i);
 assert.match(note.disclaimer,/not measured from your selected tees/);
 assert.doesNotMatch(note.advice,/\b\d+\s*(?:yard|yd)\s+carry/i);
});
