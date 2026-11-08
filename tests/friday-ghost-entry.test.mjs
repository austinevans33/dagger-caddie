import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../playtest/index.html',import.meta.url),'utf8');
const preview=readFileSync(new URL('../playtest/ghost-preview.html',import.meta.url),'utf8');
test('House Ghost uses the integrated match playback without wager writes in the viewer',()=>{
 assert.match(app,/id="dccGhostPlay"/);
 assert.match(app,/ghost-preview\.html\?match=1/);
 assert.match(preview,/ghostShotPlayback/);
 assert.match(preview,/does not change scores, games, or wagers/i);
});
test('Ghost preview has clear navigation and fully isolated user-facing controls',()=>{
 assert.match(preview,/href="\.\/"/);
 assert.match(preview,/id="next"/);
 assert.match(preview,/id="back"/);
 assert.match(preview,/id="hole"/);
 assert.match(preview,/id="length"/);
});
