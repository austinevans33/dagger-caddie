import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pocketCaddyNotes} from '../playtest/pocket-caddy-notes.js';
const hole={par:4,yards:380};
test('each caddy has exactly two short, different pocket notes',()=>{
 const outputs=['keith','reginald','vinny','kyle'].map(caddy=>pocketCaddyNotes({caddy,hole}));
 for(const result of outputs){assert.equal(result.lines.length,2);for(const line of result.lines)assert.ok(line.length<=120);}
 assert.equal(new Set(outputs.map(result=>result.lines.join('|'))).size,4);
});
test('unknown hole and unverified features never create named hazards',()=>{
 const result=pocketCaddyNotes({caddy:'keith',hole,annotations:null});
 assert.equal(result.mapped,false);assert.doesNotMatch(result.lines.join(' '),/water|bunker|left side|right side/i);
});
test('verified annotated hazard informs quick note without invented carry',()=>{
 const annotations={labels:[{type:'water',side:'right',stage:'approach'}]};
 const result=pocketCaddyNotes({caddy:'vinny',hole,annotations});
 assert.equal(result.mapped,true);assert.match(result.lines[1],/Water/i);assert.match(result.lines[1],/right/i);
 assert.match(result.lines[1],/center-left/i);
 assert.doesNotMatch(result.lines.join(' '),/\b\d+\s*(?:yards|yds)\b/);
});
test('invalid feature labels do not become tactical claims',()=>{
 const result=pocketCaddyNotes({caddy:'kyle',hole,annotations:{labels:[{type:'water',side:'unknown',stage:'approach'}]}});
 assert.equal(result.mapped,false);
});
test('Yardage Book keeps actions above the art and two caddy notes without a duplicate map inventory',()=>{
 const html=readFileSync(new URL('../playtest/yardage-preview.html',import.meta.url),'utf8');
 const art=html.indexOf('<div class="field-sketch" aria-label="Hole illustration">');
 const pocket=html.indexOf('<aside class="pocket-note"');
 const actions=html.indexOf('<div class="book-actions">');
 assert.ok(actions>=0&&art>actions&&pocket>art);
 assert.doesNotMatch(html,/Mapped trouble and scorecard details|More hole details/);
 assert.doesNotMatch(html,/id="hazards"|id="gamePlan"/);
 assert.match(html,/pocketCaddyNotes\(\{caddy:readYardageCaddy\(localStorage\)/);
});

test('tee and approach risks produce two distinct actionable lines',()=>{
 const annotations={labels:[
  {type:'water',side:'left',stage:'tee zone'},
  {type:'bunker',side:'right',stage:'approach'}
 ]};
 const result=pocketCaddyNotes({caddy:'keith',hole,annotations});
 assert.match(result.lines[0],/center-right/);
 assert.match(result.lines[1],/center-left/);
 assert.equal(result.lines.length,2);
});
test('hazards on both sides never imply the opposite side is clear',()=>{
 const annotations={labels:[
  {type:'water',side:'left',stage:'landing corridor'},
  {type:'water',side:'right',stage:'landing corridor'}
 ]};
 const result=pocketCaddyNotes({caddy:'reginald',hole,annotations});
 assert.match(result.lines[0],/controlled tee ball/);
 assert.doesNotMatch(result.lines[0],/center-left|center-right/);
});
