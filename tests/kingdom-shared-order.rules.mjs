import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';

const require=createRequire(import.meta.url);
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,updateDoc}=require('firebase/firestore');
const projectId='demo-dcc-kingdom';
if(!/^127\.0\.0\.1:[0-9]+$/.test(process.env.FIRESTORE_EMULATOR_HOST||'')){
 throw Error('This test requires a loopback Firestore emulator');
}

const env=await initializeTestEnvironment({projectId,firestore:{
 rules:readFileSync(new URL('../firestore.rules',import.meta.url),'utf8')
}});
try{
 const host=env.authenticatedContext('qa-host').firestore();
 const guest=env.authenticatedContext('qa-guest').firestore();
 const id='r2-'+'a'.repeat(32),invite='b'.repeat(16);
 const open=db=>doc(db,'rooms',id);
 const member=db=>doc(db,'rooms',id,'members','qa-guest');
 await assertSucceeds(setDoc(open(host),{
  hostUid:'qa-host',players:['Host','Guest'],format:'nassau',stake:1,
  invite,archived:false,holes:{},playOrder:{version:2,startHole:18}
 }));
 await assertFails(getDoc(open(guest)));
 await assertFails(setDoc(member(guest),{uid:'qa-guest',name:'Guest',invite:'wrong'}));
 await assertSucceeds(setDoc(member(guest),{uid:'qa-guest',name:'Guest',invite}));
 await assertSucceeds(updateDoc(open(host),{'holes.18':[4,5],lastChange:1,lastEditor:'Host'}));
 await assertSucceeds(updateDoc(open(host),{'holes.1':[5,5],lastChange:2,lastEditor:'Host'}));
 const snapshot=await assertSucceeds(getDoc(open(guest)));
 assert.deepEqual(snapshot.data().playOrder,{version:2,startHole:18});
 assert.deepEqual(snapshot.data().holes,{18:[4,5],1:[5,5]});
 await assertFails(updateDoc(open(guest),{'holes.1':[3,5]}));
 await assertFails(updateDoc(open(host),{'playOrder.startHole':1}));
 await assertSucceeds(updateDoc(open(host),{archived:true,lastChange:3}));
 await assertFails(updateDoc(open(host),{'holes.1':[3,5]}));
 console.log('Emulator passed versioned creation, invitation, host scoring, immutable order and archive lock.');
} finally {
 await env.cleanup();
}
