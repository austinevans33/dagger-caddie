import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('Starter Desk prototype does not claim verified course lookup',()=>{
 const ui=readFileSync(new URL('../staging-app/starters-desk-ui.js',import.meta.url),'utf8');
 const chat=readFileSync(new URL('../staging-app/ai-chat.js',import.meta.url),'utf8');
 assert.match(ui,/verified golf course catalog/);
 assert.match(ui,/Return to the Clubhouse/);
 assert.match(ui,/dialog\.showModal\(\)/);
 assert.match(ui,/readActiveRound\(storage\)/);
 assert.match(chat,/mountStartersDesk\(\)/);
 assert.doesNotMatch(ui,/saveActiveRound\(/);
});
