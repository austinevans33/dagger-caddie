import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('Starter Desk searches real catalog, supports tee check-in and skip',()=>{
 const ui=readFileSync(new URL('../staging-app/starters-desk-ui.js',import.meta.url),'utf8');
 const chat=readFileSync(new URL('../staging-app/ai-chat.js',import.meta.url),'utf8');
 assert.match(ui,/searchOpenGolfCourses\(query\.value\)/);
 assert.match(ui,/loadOpenGolfTees\(course\)/);
 assert.match(ui,/saveActiveRound\(storage,/);
 assert.match(ui,/My course isn’t listed yet/);
 assert.match(ui,/dialog\.showModal\(\)/);
 assert.match(ui,/readActiveRound\(storage\)/);
 assert.match(chat,/mountStartersDesk\(\)/);
});
