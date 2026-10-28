// Reads one staging project only. Never emits the deployment access token.
const assert=require('assert/strict');
(async()=>{
 const token=process.env.STAGING_DEPLOY_TOKEN;assert.ok(token,'No Google deployment access token was issued');
 const response=await fetch('https://firebase.googleapis.com/v1beta1/projects/dagger-country-club-staging',{headers:{Authorization:'Bearer '+token}});
 const data=await response.json();
 console.log(JSON.stringify({project:'dagger-country-club-staging',status:response.status,error:response.ok?null:data.error?.message}));
 if(!response.ok)throw Error('The deployment identity cannot read this staging Firebase project. Check staging IAM access.');
 assert.equal(data.projectId,'dagger-country-club-staging');
})();
