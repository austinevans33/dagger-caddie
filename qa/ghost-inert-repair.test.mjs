import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('reparented House Ghost scorer clears stale inactive state only on Grounds',()=>{
 const src=readFileSync(new URL('../staging-app/dcc-game-search.js',import.meta.url),'utf8');
 assert.match(src,/solo\.contains\(ghost\)/);
 assert.match(src,/tab-games/);
 assert.match(src,/ghost\.removeAttribute\('inert'\)/);
 assert.match(src,/ghost\.removeAttribute\('aria-hidden'\)/);
 assert.match(src,/ghost\.classList\.remove\('hidden-panel'\)/);
});
