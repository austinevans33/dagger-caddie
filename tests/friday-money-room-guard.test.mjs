import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {invitationFrom} from '../room-session.js';
import {invitationMatrix} from '../invitation-qr.js';
const room=readFileSync(new URL('../money-room.js',import.meta.url),'utf8');
const page=readFileSync(new URL('../playtest/index.html',import.meta.url),'utf8');
test('host QR is shown on host phone and never requires a share sheet',()=>{
 assert.match(room,/function\s+\w*Qr\w*\s*\(/i);
 assert.match(room,/SCAN TO JOIN THIS ROOM/);
 assert.match(room,/roomHostQrCanvas/);
 assert.match(room,/drawInvitationQr\(\$\('roomHostQrCanvas'\), link\)/);
 assert.match(room,/roomHostQr.*remove\(\)/);
});
test('scanned invitation joins only after Firebase initialization',()=>{
 assert.match(room,/initialization\.then\(\(\)=>\{if\(incomingInvitation&&!roomId\)/);
 assert.match(room,/joinOnce\(\)/);
 assert.match(room,/recoverRoom\(/);
 assert.match(room,/auth\.currentUser/);
});
test('QR encodes room and invite without remote QR service',()=>{
 const id='0123456789abcdef0123456789abcdef',code='0123456789abcdef';
 const url='https://example.com/playtest/?room='+id+'&invite='+code;
 const matrix=invitationMatrix(url);
 assert.equal(matrix.url,url);
 assert(matrix.size>20);
 assert.equal(typeof matrix.dark(0,0),'boolean');
 assert.deepEqual(invitationFrom(url),{id,code});
 assert.equal(invitationFrom('https://example.com/?room='+id+'&invite=bad'),null);
 assert.throws(()=>invitationMatrix('http://example.com/?room='+id+'&invite='+code),/secure/i);
});
test('live playtest still contains Money Room and its host editor',()=>{
 assert.match(page,/id="moneyRoomSection"/);
 assert.match(page,/id="roomCreate"/);
 assert.match(page,/id="roomJoin"/);
});

test('QR joins time out safely and verify active server room instead of cached data',()=>{
 const live=readFileSync(new URL('../playtest/money-room.js',import.meta.url),'utf8');
 assert.match(live,/readWithDeadline\(\(\)=>setDoc\(memberRef/);
 assert.match(live,/readWithDeadline\(\(\)=>getDocFromServer\(doc\(db,'rooms',id\)\)\)/);
 assert.match(live,/snapshot\.data\(\)\?\.archived/);
 assert.match(live,/Connection verification timed out/);
 assert.match(live,/const createOnce=singleFlight\(create\),joinOnce=singleFlight\(join\)/);
});

test('host room creation has bounded server writes and does not falsely report success after timeout',()=>{
 const live=readFileSync(new URL('../playtest/money-room.js',import.meta.url),'utf8');
 assert.match(live,/readWithDeadline\(\(\)=>setDoc\(doc\(db,'rooms',id\),model\)\)/);
 assert.match(live,/readWithDeadline\(\(\)=>setDoc\(doc\(db,'rooms',id,'members',user\.uid\)/);
 assert.match(live,/Could not confirm room creation/);
 assert.match(live,/No new room was confirmed on this phone/);
});

test('live Nassau cannot archive before 18 holes and old partial archive is not called final',()=>{
 const live=readFileSync(new URL('../playtest/money-room.js',import.meta.url),'utf8');
 assert.match(live,/room\.format==='nassau'&&x\.settled<18/);
 assert.match(live,/Enter all 18 holes before finishing the Money Room/);
 assert.match(live,/ARCHIVED · INCOMPLETE NASSAU/);
 assert.match(live,/Not a final settlement/);
});

test('Money Room finish rechecks server Nassau completion atomically before archive',()=>{
 const live=readFileSync(new URL('../playtest/money-room.js',import.meta.url),'utf8');
 const finish=live.slice(live.indexOf("$('roomFinish').onclick"),live.indexOf('async function init()'));
 assert.match(finish,/functions\.runTransaction\(db,async transaction=>/);
 assert.match(finish,/const ref=functions\.doc\(db,'rooms',id\),snap=await transaction\.get\(ref\)/);
 assert.match(finish,/current\.format==='nassau'&&compute\(current\)\.settled!==18/);
 assert.match(finish,/transaction\.update\(ref,\{archived:true/);
 assert.doesNotMatch(finish,/await functions\.updateDoc\(/);
 assert.match(live,/INCOMPLETE NASSAU · NOT FINAL/);
});

test('live skins never award later holes until preceding scores are known',async()=>{
 const {runInNewContext}=await import('node:vm');
 const live=readFileSync(new URL('../playtest/money-room.js',import.meta.url),'utf8');
 const start=live.indexOf('function compute(model){'),end=live.indexOf('\nfunction roomLabel()',start);
 assert.ok(start>=0&&end>start);
 const compute=runInNewContext(live.slice(start,end)+'\ncompute');
 const base={format:'skins',players:['A','B'],stake:5,holes:{2:[3,5]}};
 const pending=compute(base);
 assert.deepEqual(Array.from(pending.totals),[0,0]);
 assert.equal(pending.skinsPending,true);
 assert.match(pending.ledger[1].event,/Pending earlier hole/);
 const settled=compute({...base,holes:{1:[4,4],2:[3,5]}});
 assert.deepEqual(Array.from(settled.totals),[10,-10]);
 assert.equal(settled.skinsPending,false);
 const changed=compute({...base,holes:{1:[3,5],2:[3,5]}});
 assert.deepEqual(Array.from(changed.totals),[10,-10]);
 assert.match(live,/later skins pending earlier hole scores/);
});
