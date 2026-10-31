import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {inspectAiDeploymentSource} from './staging-ai-deployment-gate.mjs';
const source=readFileSync(new URL('../staging-functions/index.js',import.meta.url),'utf8');
test('isolated AI staging source passes project identity preflight',()=>{const r=inspectAiDeploymentSource(source,{targetProject:'dagger-country-club-staging'});assert.deepEqual(r.errors,[]);assert.equal(r.status,'SOURCE_PREFLIGHT_PASS')});
test('staging AI source has no production runtime/project references',()=>{assert.doesNotMatch(source,/dagger-caddie-money-room/);assert.match(source,/dagger-country-club-staging/);});
