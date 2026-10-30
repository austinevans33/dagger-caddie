// Explicit preflight gate for staging AI deployment. Never reuse production runtime identity.
export function inspectAiDeploymentSource(source,{targetProject}={}){
 const errors=[];
 if(targetProject!=='dagger-country-club-staging')errors.push('Target must be the staging Firebase project.');
 if(/serviceAccount:\s*['"`]dagger-caddie-ai-runtime@dagger-caddie-money-room/.test(source))errors.push('Production runtime service account is hardcoded.');
 if(/const PROJECT\s*=\s*['"]dagger-caddie-money-room['"]/.test(source))errors.push('Production Firebase project guard is hardcoded.');
 if(!/exports\.caddieChat\s*=\s*onRequest/.test(source))errors.push('caddieChat function definition missing.');
 return Object.freeze({status:errors.length?'BLOCKED':'SOURCE_PREFLIGHT_PASS',errors});
}
