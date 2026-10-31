'use strict';
// Explicit target selection. Never infer a staging deployment from .firebaserc,
// which currently defaults to the separate historical Money Room project.
const PRODUCTION='dagger-caddie-money-room';
const STAGING='dagger-country-club-staging';
const PROD_ACCOUNT='dagger-caddie-ai-runtime@dagger-caddie-money-room.iam.gserviceaccount.com';
function resolveCaddyDeploymentTarget(env=process.env){
 const project=env.DAGGER_CADDY_PROJECT||PRODUCTION;
 if(project!==PRODUCTION&&project!==STAGING)throw Error('Unrecognized Dagger AI deployment project');
 const configured=env.DAGGER_CADDY_SERVICE_ACCOUNT||'';
 if(project===PRODUCTION){
  if(configured&&configured!==PROD_ACCOUNT)throw Error('Production service account mismatch');
  return Object.freeze({project,serviceAccount:PROD_ACCOUNT});
 }
 // Staging service account must be verified in IAM by the deployer; never
 // assume an account exists or silently borrow the production identity.
 if(!/^[a-z][a-z0-9-]{4,29}@dagger-country-club-staging\.iam\.gserviceaccount\.com$/.test(configured)){
  throw Error('Staging Caddy requires an explicit staging-project service account');
 }
 return Object.freeze({project,serviceAccount:configured});
}
module.exports={resolveCaddyDeploymentTarget,PRODUCTION,STAGING};
