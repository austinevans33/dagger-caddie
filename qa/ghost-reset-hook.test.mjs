import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('House Ghost recovery hook is independent of Firebase/AI initialization',()=>{
 const source=readFileSync(new URL('../staging-app/dcc-game-search.js',import.meta.url),'utf8');
 const ai=readFileSync(new URL('../staging-app/ai-chat.js',import.meta.url),'utf8');
 assert.match(source,/import\('\.\/ghost-partial-archive\.js'\)/);
 assert.match(source,/DOMContentLoaded/);
 assert.match(source,/installPartialGhostArchive\(\)/);
 assert.doesNotMatch(ai,/installPartialGhostArchive\(\)/);
});
