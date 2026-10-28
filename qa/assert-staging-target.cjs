const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),app=path.join(root,'staging-app');
const config=fs.readFileSync(path.join(app,'firebase-config.js'),'utf8');
assert.match(config,/projectId:\s*"dagger-country-club-staging"/);
assert.match(config,/authDomain:\s*"dagger-country-club-staging\.firebaseapp\.com"/);
assert.equal(JSON.parse(fs.readFileSync(path.join(app,'.firebaserc'),'utf8')).projects.default,'dagger-country-club-staging');
assert.equal(JSON.parse(fs.readFileSync(path.join(app,'firebase.json'),'utf8')).hosting.public,'.');
assert.ok(!JSON.parse(fs.readFileSync(path.join(app,'firebase.json'),'utf8')).hosting.target,'Unexpected Hosting target override');
for(const name of fs.readdirSync(app).filter(n=>n.endsWith('.js'))){
 assert.ok(!fs.readFileSync(path.join(app,name),'utf8').includes('dagger-caddie-money-room'),'Production project reference in staging JavaScript: '+name);
}
console.log('Staging Firebase configuration and Hosting directory verified; production project absent.');
