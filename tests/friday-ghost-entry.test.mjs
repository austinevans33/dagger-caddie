import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../playtest/index.html',import.meta.url),'utf8');
const preview=readFileSync(new URL('../playtest/ghost-preview.html',import.meta.url),'utf8');
test('Ghost QA is linked once, from playtest, without wiring live wager APIs',()=>{
 assert.equal((app.match(/id="dcc-friday-ghost-qa-link"/g)||[]).length,1);
 assert.match(app,/link\.href='ghost-preview\.html'/);
 assert.match(app,/Isolated simulated preview/);
 assert.match(preview,/ghostShotPlayback/);
 assert.match(preview,/does not read or change scores, bets, GPS, Firebase/i);
});
test('Ghost preview has clear navigation and fully isolated user-facing controls',()=>{
 assert.match(preview,/href="\.\/"/);
 assert.match(preview,/id="next"/);
 assert.match(preview,/id="back"/);
 assert.match(preview,/id="hole"/);
 assert.match(preview,/id="length"/);
});
