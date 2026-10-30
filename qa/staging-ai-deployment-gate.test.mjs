import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {inspectAiDeploymentSource} from './staging-ai-deployment-gate.mjs';
const current=readFileSync(new URL('../functions/index.js',import.meta.url),'utf8');
test('actual staging backend deploy remains blocked while production identity is hardcoded',()=>{
 const r=inspectAiDeploymentSource(current,{targetProject:'dagger-country-club-staging'});
 assert.equal(r.status,'BLOCKED');
 assert.ok(r.errors.some(x=>x.includes('Production runtime service account')));
 assert.ok(r.errors.some(x=>x.includes('Production Firebase project guard')));
});
test('gate rejects production target regardless of code',()=>{
 const clean=current.replaceAll('dagger-caddie-ai-runtime@dagger-caddie-money-room','dagger-caddie-ai-runtime@dagger-country-club-staging').replace("const PROJECT='dagger-caddie-money-room'","const PROJECT='dagger-country-club-staging'");
 assert.equal(inspectAiDeploymentSource(clean,{targetProject:'dagger-caddie-money-room'}).status,'BLOCKED');
 assert.equal(inspectAiDeploymentSource(clean,{targetProject:'dagger-country-club-staging'}).status,'SOURCE_PREFLIGHT_PASS');
});
