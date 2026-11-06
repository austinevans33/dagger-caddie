import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {invitationFrom} from '../room-session.js';
import {invitationMatrix} from '../invitation-qr.js';
// The published Friday page loads playtest/money-room.js; the root copy is legacy.
const room=readFileSync(new URL('../playtest/money-room.js',import.meta.url),'utf8');
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

test('skipped-hole skins cannot archive using stale host state or server data',async()=>{
 const {runInNewContext}=await import('node:vm');
 const live=readFileSync(new URL('../playtest/money-room.js',import.meta.url),'utf8');
 const finish=live.slice(live.indexOf("$('roomFinish').onclick"),live.indexOf('async function init()'));
 assert.match(finish,/room\.format==='skins'&&x\.skinsPending/);
 assert.match(finish,/current\.format==='skins'&&compute\(current\)\.skinsPending/);
 assert.match(live,/ARCHIVED · INCOMPLETE SKINS/);
 assert.match(live,/INCOMPLETE SKINS · NOT FINAL/);
 const start=live.indexOf('function compute(model){'),end=live.indexOf('\nfunction roomLabel()',start);
 const compute=runInNewContext(live.slice(start,end)+'\ncompute');
 assert.equal(compute({format:'skins',players:['A','B'],stake:5,holes:{2:[3,4]}}).skinsPending,true);
 assert.equal(compute({format:'skins',players:['A','B'],stake:5,holes:{1:[4,4],2:[3,4]}}).skinsPending,false);
});

test('Money Room guard tests use the deployed playtest module, not the legacy root duplicate',()=>{
 const entry=readFileSync(new URL('../playtest/index.html',import.meta.url),'utf8');
 assert.match(entry,/money-room\.js/);
 assert.match(room,/functions\.runTransaction\(db,async transaction=>/);
 assert.match(room,/current\.format==='skins'&&compute\(current\)\.skinsPending/);
});

test('live skins standings mark holes blocked by earlier missing scores as pending',()=>{
 assert.match(room,/x\.skinsPending\?' · Later skins awaiting missing earlier scores'/);
});

test('QR/create connection waits for server snapshot and rejects stale or failed rooms',async()=>{
 const {runInNewContext}=await import('node:vm');
 const source=readFileSync(new URL('../playtest/money-room.js',import.meta.url),'utf8');
 const start=source.indexOf('async function connect(id){'),end=source.indexOf('\nasync function create(){',start);
 assert.ok(start>0&&end>start,'live connection function exists');
 let publish,fail,renderCount=0,lastStatus='',unsubCount=0,qrRemoved=0;
 const panel={hidden:false,disabled:false,remove(){qrRemoved++}};
 const state={
  roomUnsub:null,roomId:'',connectionVersion:0,room:null,host:false,
  auth:{currentUser:{uid:'host-1'}},user:{uid:'host-1'},db:{},
  functions:{doc:(_,kind,id)=>({kind,id}),onSnapshot:(_,ok,bad)=>{publish=ok;fail=bad;return ()=>{unsubCount++}}},
  // The handshake is tested by controlled snapshot delivery, never a wall-clock race.
  readWithDeadline:fn=>Promise.resolve().then(fn),
  status:value=>{lastStatus=value},render:()=>{renderCount++},archiveLocal:()=>{},forgetRoom:()=>{},roomStore:{},
  $:id=>panel,roomLabel:()=> 'Scorekeeper'
 };
 const connect=runInNewContext(source.slice(start,end)+'\nconnect',state);
 const first=connect('room-1');await new Promise(resolve=>setTimeout(resolve,0));
 publish({exists:()=>true,metadata:{fromCache:true,hasPendingWrites:false},data:()=>({hostUid:'host-1',players:['A','B']})});
 await Promise.resolve();
 assert.equal(renderCount,0,'cached data cannot authorize LIVE status');
 assert.doesNotMatch(lastStatus,/^LIVE/);
 publish({exists:()=>true,metadata:{fromCache:false,hasPendingWrites:false},data:()=>({hostUid:'host-1',players:['A','B'],archived:false})});
 await first;
 assert.equal(renderCount,1);
 assert.match(lastStatus,/LIVE · Server-confirmed/);
 assert.equal(state.roomServerFresh,true);
 // Firebase can quietly fall back to cache without raising an error.
 publish({exists:()=>true,metadata:{fromCache:true,hasPendingWrites:false},data:()=>({archived:false})});
 assert.equal(state.roomServerFresh,false);
 assert.equal(panel.hidden,true);
 assert.equal(panel.disabled,true);
 assert.equal(qrRemoved,1,'host QR is hidden as soon as a cached snapshot replaces the live server');
 assert.match(lastStatus,/Scoring is locked until reconnected/);
 publish({exists:()=>true,metadata:{fromCache:false,hasPendingWrites:false},data:()=>({hostUid:'host-1',players:['A','B'],archived:false})});
 assert.equal(state.roomServerFresh,true);
 assert.equal(renderCount,2);
 // A real-time listener can die after the initial server confirmation.
 // The app must hide the editor rather than leave a stale LIVE room usable.
 fail(Error('transport closed'));
 assert.equal(qrRemoved,2,'a dead listener also clears the host QR');
 assert.equal(state.roomId,'');
 assert.equal(panel.hidden,true);
 assert.match(lastStatus,/Scoring has stopped/);
 assert.match(lastStatus,/reconnect/);
 const second=connect('room-2');await new Promise(resolve=>setTimeout(resolve,0));
 fail(Error('permission-denied'));
 await assert.rejects(second,/permission-denied/);
 assert.equal(state.roomId,'');
 assert.ok(unsubCount>=1,'failed listener was cleaned up');
 const third=connect('room-3');await new Promise(resolve=>setTimeout(resolve,0));
 publish({exists:()=>true,metadata:{fromCache:false,hasPendingWrites:false},data:()=>({archived:true,hostUid:'host-1'})});
 await assert.rejects(third,/already finished/);
 assert.equal(state.roomId,'');
});

test('Money Room editor and writes require fresh server data',()=>{
 const live=readFileSync(new URL('../playtest/money-room.js',import.meta.url),'utf8');
 assert.match(live,/roomServerFresh=false/);
 assert.match(live,/roomServerFresh=true/);
 assert.match(live,/roomEditor'\)\.hidden=!host\|\|!!room\.archived\|\|!roomServerFresh/);
 assert.match(live,/if\(!host\|\|!room\|\|room\.archived\|\|!roomServerFresh\)throw Error\('Scoring requires a fresh server connection/);
 assert.match(live,/roomSaveHole'\)\.disabled=!host\|\|room\.archived\|\|!roomServerFresh/);
 assert.match(live,/roomFinish'\)\.disabled=!host\|\|room\.archived\|\|!roomServerFresh/);
});

test('offline Money Room cannot keep a visible host QR or enabled score actions',()=>{
 const live=readFileSync(new URL('../playtest/money-room.js',import.meta.url),'utf8');
 const connect=live.slice(live.indexOf('async function connect(id){'),live.indexOf('\nasync function create(){'));
 assert.match(connect,/roomHostQr'\)\?\.remove\(\);displayedQrLink=''/);
 assert.match(connect,/roomSaveHole'\)\.disabled=true/);
 assert.match(connect,/roomUndoHole'\)\.disabled=true/);
 assert.match(connect,/roomFinish'\)\.disabled=true/);
});

test('host QR cannot reappear during a cached-only connection or after disconnect',()=>{
 const live=readFileSync(new URL('../playtest/money-room.js',import.meta.url),'utf8');
 const qr=live.slice(live.indexOf('function syncHostQr() {'),live.indexOf('\nfunction compute(model)',live.indexOf('function syncHostQr() {')));
 assert.match(qr,/if \(!host \|\| !roomServerFresh \|\| !roomId \|\| !invite \|\| room\?\.archived\)/);
 assert.match(qr,/if \(panel\) panel\.remove\(\)/);
 assert.match(qr,/drawInvitationQr/);
});
