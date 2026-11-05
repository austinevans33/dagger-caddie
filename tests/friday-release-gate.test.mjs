import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync(new URL('../.github/workflows/friday-ghost-qa.yml',import.meta.url),'utf8');
test('candidate publication waits for deterministic tests and real browser checks',()=>{
 const jobs=workflow.split('\n  browser-smoke:');
 assert.equal(jobs.length,2,'browser job exists');
 assert.match(jobs[0],/name: dagger-friday-preflight/);
 assert.doesNotMatch(jobs[0],/name: dagger-friday-candidate/);
 assert.match(jobs[1],/needs: ghost-qa/);
 assert.match(jobs[1],/name: dagger-friday-preflight/);
 const smoke=jobs[1].indexOf('npx playwright test'),publish=jobs[1].indexOf('name: dagger-friday-candidate');
 assert.ok(smoke>=0&&publish>smoke,'final candidate published only after real-browser smoke');
 assert.match(jobs[1],/test "\$\(git rev-parse HEAD\)" = "\$\(cat candidate\/FRIDAY_CHECKED_OUT_SHA.txt\)"/);
 assert.match(jobs[1],/python3 tests\/friday-bundle-integrity\.py candidate/);
});

test('browser tests serve the packaged candidate and include both requested suites',()=>{
 assert.match(workflow,/http\.server 8765 --bind 127\.0\.0\.1 --directory candidate/);
 const config=readFileSync(new URL('../playwright.config.mjs',import.meta.url),'utf8');
 assert.match(config,/testMatch:\['friday-browser\.spec\.mjs','friday-game-score-preview\.spec\.mjs'\]/);
 assert.match(workflow,/npx playwright test tests\/friday-browser\.spec\.mjs tests\/friday-game-score-preview\.spec\.mjs/);
 const preview=readFileSync(new URL('./friday-game-score-preview.spec.mjs',import.meta.url),'utf8');
 assert.match(preview,/roundIdentity:'test-course\|blue\|123456'/);
});
