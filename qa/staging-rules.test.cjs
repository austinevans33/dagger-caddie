// Real Firestore rules emulator. No production/staging network calls.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {createRequire}=require('module');
const req=createRequire(process.env.DCC_FIREBASE_QA_ROOT||path.join(__dirname,'package.json'));
const {initializeTestEnvironment,assertSucceeds,assertFails}=req('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,updateDoc,getDocs,collection,deleteDoc}=req('firebase/firestore');
const checks=[];
async function pass(name,operation,allowed){await (allowed?assertSucceeds:assertFails)(operation);checks.push({name,pass:true});}
(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-dagger-qa',firestore:{host:'127.0.0.1',port:8087,rules:fs.readFileSync(path.join(__dirname,'staging-money-room.rules'),'utf8')}});
 const host=env.authenticatedContext('host').firestore(),guest=env.authenticatedContext('guest').firestore(),outsider=env.authenticatedContext('outsider').firestore(),anonymous=env.unauthenticatedContext().firestore();
 const id='a'.repeat(32),invite='b'.repeat(16),ref=db=>doc(db,'rooms',id),member=(db,uid)=>doc(db,'rooms',id,'members',uid);
 const room={name:'QA Money Room',hostUid:'host',hostName:'QA Host',players:['QA Host','QA Buddy'],format:'hole',stake:10,invite,holes:{},archived:false,created:1,lastChange:1,lastEditor:'QA Host'};
 const membership={uid:'guest',name:'QA Buddy',invite,joined:2};
 try{
  await env.clearFirestore();
  await pass('Unauthenticated room creation denied',setDoc(ref(anonymous),room),false);
  await pass('Room ownership forgery denied',setDoc(ref(guest),room),false);
  await pass('Host creates valid two-player room',setDoc(ref(host),room),true);
  await pass('Host can read own room before registering membership',getDoc(ref(host)),true);
  await pass('Nonmember room read denied',getDoc(ref(guest)),false);
  await pass('Unauthenticated room read denied',getDoc(ref(anonymous)),false);
  await pass('Wrong invitation denied',setDoc(member(outsider,'outsider'),{...membership,uid:'outsider',invite:'c'.repeat(16)}),false);
  await pass('Guest cannot write another UID membership',setDoc(member(guest,'outsider'),{...membership,uid:'outsider'}),false);
  await pass('Empty display name denied',setDoc(member(guest,'guest'),{...membership,name:''}),false);
  await pass('Membership privilege fields denied',setDoc(member(guest,'guest'),{...membership,host:true}),false);
  await pass('Guest joins with valid invitation without pre-read',setDoc(member(guest,'guest'),membership),true);
  await pass('Joined guest can read room',getDoc(ref(guest)),true);
  await pass('Guest can read own membership',getDoc(member(guest,'guest')),true);
  await pass('Host can read guest membership',getDoc(member(host,'guest')),true);
  await pass('Outsider cannot read guest membership',getDoc(member(outsider,'guest')),false);
  await pass('Returning guest may rejoin',setDoc(member(guest,'guest'),{...membership,joined:3}),true);
  await pass('Returning guest with wrong invite denied',setDoc(member(guest,'guest'),{...membership,invite:'c'.repeat(16)}),false);
  await pass('Guest cannot score even with forged editor name',updateDoc(ref(guest),{holes:{1:[4,5]},lastEditor:'QA Host',lastChange:4}),false);
  await pass('Host can save scores',updateDoc(ref(host),{holes:{1:[4,5]},lastEditor:'QA Host',lastChange:4}),true);
  const saved=await getDoc(ref(guest));assert.deepEqual(saved.data().holes,{1:[4,5]});checks.push({name:'Other identity reads saved scores',pass:true});
  for(const [field,value] of Object.entries({hostUid:'guest',players:['New','Players'],invite:'c'.repeat(16),format:'nassau',stake:100}))
   await pass('Host cannot change immutable '+field,updateDoc(ref(host),{[field]:value}),false);
  await pass('Room enumeration denied',getDocs(collection(guest,'rooms')),false);
  await pass('Membership enumeration denied',getDocs(collection(host,'rooms',id,'members')),false);
  await pass('Room deletion denied',deleteDoc(ref(host)),false);
  await pass('Unrelated golfer profile access remains denied',getDoc(doc(host,'golfers','host')),false);
  await pass('Unrelated document writes remain denied',setDoc(doc(host,'other','test'),{open:true}),false);
  await pass('Three-player match-by-hole creation denied',setDoc(doc(host,'rooms','d'.repeat(32)),{...room,players:['A','B','C']}),false);
  await pass('Negative stake denied',setDoc(doc(host,'rooms','e'.repeat(32)),{...room,stake:-10}),false);
  await pass('Guest cannot archive',updateDoc(ref(guest),{archived:true,lastChange:5}),false);
  await pass('Host can archive',updateDoc(ref(host),{archived:true,lastChange:5}),true);
  await pass('Archived scores cannot be edited',updateDoc(ref(host),{holes:{1:[3,5]},lastChange:6}),false);
  await pass('Archived match cannot be reopened',updateDoc(ref(host),{archived:false,lastChange:6}),false);
  await pass('Guest can still read archived match',getDoc(ref(guest)),true);
 }finally{
  await env.cleanup();fs.mkdirSync(path.join(__dirname,'results'),{recursive:true});fs.writeFileSync(path.join(__dirname,'results/staging-rules-emulator.json'),JSON.stringify({backend:'REAL Firestore rules emulator, simulated identities; not deployed staging',checks},null,2));
  console.log(JSON.stringify({checks:checks.length,passed:checks.length},null,2));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
