import test from 'node:test';
import assert from 'node:assert/strict';
import {ROOM_BOOKMARK_KEY,readRoomBookmark,rememberRoom,forgetRoom,recoverRoom,readWithDeadline} from '../staging-app/room-recovery.js';
const record={uid:'host',id:'a'.repeat(32),invite:'b'.repeat(16),name:'Host'};
function storage(){const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};}
function args(s,extra={}){return {storage:s,uid:'host',readRoom:async()=>({invite:record.invite,hostUid:'host',holes:{1:[4,5]},archived:false}),isCurrent:()=>true,...extra};}
test('bookmark persists only locator fields, never scores or authority',()=>{
 const s=storage();assert.equal(rememberRoom(s,{...record,host:true,holes:{1:[1,1]}}),true);
 assert.deepEqual(readRoomBookmark(s,'host'),{version:1,...record});assert.equal(readRoomBookmark(s,'other'),null);
});
test('corrupt or invalid bookmark does not throw or overwrite original',()=>{
 const s=storage();s.setItem(ROOM_BOOKMARK_KEY,'{broken');assert.equal(readRoomBookmark(s,'host'),null);assert.equal(s.getItem(ROOM_BOOKMARK_KEY),'{broken');
 for(const change of [{uid:''},{id:'bad'},{invite:'bad'},{name:''},{name:'a'.repeat(25)}])assert.equal(rememberRoom(s,{...record,...change}),false);
});
test('storage denial does not break live room operations',()=>{
 const s={getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('full');},removeItem:()=>{throw Error('blocked');}};
 assert.equal(readRoomBookmark(s,'host'),null);assert.equal(rememberRoom(s,record),false);assert.equal(forgetRoom(s,'host'),false);
});
test('clearing another account or older room preserves newer bookmark',()=>{
 const s=storage();rememberRoom(s,record);assert.equal(forgetRoom(s,'other'),false);assert.equal(forgetRoom(s,'host','c'.repeat(32)),false);
 assert.ok(readRoomBookmark(s,'host'));assert.equal(forgetRoom(s,'host',record.id),true);
});
test('recovery uses fresh backend scores and host identity',async()=>{
 const s=storage();rememberRoom(s,record);const result=await recoverRoom(args(s));assert.deepEqual(result.room.holes,{1:[4,5]});assert.equal(result.room.hostUid,'host');
});
test('explicit invitation to another room takes precedence without server reads',async()=>{
 const s=storage();rememberRoom(s,record);let reads=0;
 assert.equal(await recoverRoom(args(s,{incoming:{id:'c'.repeat(32),code:record.invite},readRoom:async()=>{reads++;}})),null);assert.equal(reads,0);
});
test('matching invitation can reconnect without registering membership again',async()=>{
 const s=storage();rememberRoom(s,record);assert.ok(await recoverRoom(args(s,{incoming:{id:record.id,code:record.invite}})));
});
test('response arriving after another user action cannot restore old room',async()=>{
 const s=storage();rememberRoom(s,record);assert.equal(await recoverRoom(args(s,{isCurrent:()=>false})),null);assert.ok(readRoomBookmark(s,'host'));
});
test('archived, removed or changed invitations clear only matching locator',async()=>{
 for(const room of [null,{archived:true,invite:record.invite},{archived:false,invite:'c'.repeat(16)}]){
  const s=storage();rememberRoom(s,record);assert.equal(await recoverRoom(args(s,{readRoom:async()=>room})),null);assert.equal(readRoomBookmark(s,'host'),null);
 }
});
test('permission loss clears locator, temporary network failure retains it',async()=>{
 for(const code of ['permission-denied','unavailable']){
  const s=storage();rememberRoom(s,record);await assert.rejects(recoverRoom(args(s,{readRoom:async()=>{throw Object.assign(Error(code),{code});}})),{code});
  assert.equal(!!readRoomBookmark(s,'host'),code==='unavailable');
 }
});
test('a stalled server read has a deadline and keeps the locator for retry',async()=>{
 const s=storage();rememberRoom(s,record);
 await assert.rejects(recoverRoom(args(s,{readRoom:()=>readWithDeadline(()=>new Promise(()=>{}),3)})),{code:'unavailable'});
 assert.ok(readRoomBookmark(s,'host'));
});
test('successful server read returns before its deadline',async()=>{
 assert.deepEqual(await readWithDeadline(async()=>({official:true}),100),{official:true});
});
