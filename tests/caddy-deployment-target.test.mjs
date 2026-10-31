import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {resolveCaddyDeploymentTarget}=require('../functions/deployment-target.js');
test('Existing production deployment identity is preserved by default',()=>{
 const target=resolveCaddyDeploymentTarget({});
 assert.equal(target.project,'dagger-caddie-money-room');
 assert.equal(target.serviceAccount,'dagger-caddie-ai-runtime@dagger-caddie-money-room.iam.gserviceaccount.com');
});
test('Staging requires explicit same-project service account',()=>{
 assert.throws(()=>resolveCaddyDeploymentTarget({DAGGER_CADDY_PROJECT:'dagger-country-club-staging'}),/explicit staging-project/);
 assert.throws(()=>resolveCaddyDeploymentTarget({
  DAGGER_CADDY_PROJECT:'dagger-country-club-staging',
  DAGGER_CADDY_SERVICE_ACCOUNT:'dagger-caddie-ai-runtime@dagger-caddie-money-room.iam.gserviceaccount.com'
 }),/explicit staging-project/);
 const target=resolveCaddyDeploymentTarget({
  DAGGER_CADDY_PROJECT:'dagger-country-club-staging',
  DAGGER_CADDY_SERVICE_ACCOUNT:'dagger-caddie-ai-runtime@dagger-country-club-staging.iam.gserviceaccount.com'
 });
 assert.equal(target.project,'dagger-country-club-staging');
});
test('Unknown project and unexpected production identity fail closed',()=>{
 assert.throws(()=>resolveCaddyDeploymentTarget({DAGGER_CADDY_PROJECT:'another-project'}),/Unrecognized/);
 assert.throws(()=>resolveCaddyDeploymentTarget({
  DAGGER_CADDY_PROJECT:'dagger-caddie-money-room',
  DAGGER_CADDY_SERVICE_ACCOUNT:'another-account@dagger-caddie-money-room.iam.gserviceaccount.com'
 }),/mismatch/);
});
