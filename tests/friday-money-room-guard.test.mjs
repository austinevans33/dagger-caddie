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
