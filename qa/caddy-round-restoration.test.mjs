import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../staging-app/ai-chat.js',import.meta.url),'utf8');
test('AI restores selected round context after app reopen',()=>{
 assert.match(source,/if\(readActiveRound\(localStorage\)\)refreshCaddyRoundEnvironment\(\)/);
 assert.match(source,/getRoundEnvironment\(\{storage:localStorage\}\)/);
});
test('Caddy refreshes missing context before posting, preserving source identity',()=>{
 assert.match(source,/await refreshCaddyRoundEnvironment\(\)/);
 assert.match(source,/sameCourseSelection\(current\.selection,result\.selection\)/);
 assert.match(source,/courseBriefing:courseBriefing\?\.slice/);
});
