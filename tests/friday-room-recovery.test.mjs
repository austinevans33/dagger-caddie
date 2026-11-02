import test from 'node:test';
import assert from 'node:assert/strict';
import {ROOM_BOOKMARK_KEY,rememberRoom,readRoomBookmark,forgetRoom,recoverRoom} from '../room-recovery.js';
const uid='host-user',id='a'.repeat(32),invite='b'.repeat(16);
const info={uid,id,invite,name:'Host'};
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}};
test('room bookmark contains only locator data and is scoped to the Firebase UID',()=>{
 const store=storage();assert.equal(rememberRoom(store,{...info,role:'host',scores:[1,2],payout:999}),true);
 assert.deepEqual(JSON.parse(store.getItem(ROOM_BOOKMARK_KEY)),{version:1,...info});
 assert.equal(readRoomBookmark(store,'another-user'),null);
 assert.equal(forgetRoom(store,'another-user'),false);
 assert.equal(forgetRoom(store,uid,id),true);
});
test('invalid and unavailable storage fail closed',()=>{
 const store=storage();store.setItem(ROOM_BOOKMARK_KEY,'{bad json');
 assert.equal(readRoomBookmark(store,uid),null);
 assert.equal(rememberRoom(store,{...info,invite:'invalid'}),false);
 const broken={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')},removeItem(){throw Error('blocked')}};
 assert.equal(readRoomBookmark(broken,uid),null);assert.equal(rememberRoom(broken,info),false);assert.equal(forgetRoom(broken,uid),false);
});
test('active room recovery reads authoritative server state',async()=>{
 const store=storage();rememberRoom(store,info);
 const room={invite,players:['Host','Guest'],archived:false,hostUid:uid};
 const result=await recoverRoom({storage:store,uid,readRoom:async key=>{assert.equal(key,id);return room},isCurrent:()=>true});
 assert.deepEqual(result,{bookmark:{version:1,...info},room});
});
test('archived and invitation-changed rooms cannot reopen',async()=>{
 for(const room of [{invite,archived:true},{invite:'c'.repeat(16),archived:false},null]){
  const store=storage();rememberRoom(store,info);
  const result=await recoverRoom({storage:store,uid,readRoom:async()=>room,isCurrent:()=>true});
  assert.equal(result,null);assert.equal(readRoomBookmark(store,uid),null);
 }
});
test('a different incoming room supersedes old room recovery',async()=>{
 const store=storage();rememberRoom(store,info);let calls=0;
 const result=await recoverRoom({storage:store,uid,incoming:{id:'c'.repeat(32),code:invite},readRoom:async()=>{calls++;return null},isCurrent:()=>true});
 assert.equal(result,null);assert.equal(calls,0);assert.notEqual(readRoomBookmark(store,uid),null);
});
test('late server result cannot restore a superseded connection',async()=>{
 const store=storage();rememberRoom(store,info);let current=true;
 const result=await recoverRoom({storage:store,uid,readRoom:async()=>{current=false;return {invite,archived:false}},isCurrent:()=>current});
 assert.equal(result,null);
});
test('transient failures preserve bookmark but permission denial revokes it',async()=>{
 for(const code of ['unavailable','permission-denied']){
  const store=storage();rememberRoom(store,info);
  await assert.rejects(recoverRoom({storage:store,uid,readRoom:async()=>{throw Object.assign(Error('fail'),{code})},isCurrent:()=>true}));
  assert.equal(!!readRoomBookmark(store,uid),code==='unavailable');
 }
});
