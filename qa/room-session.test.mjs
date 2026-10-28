import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoomSession,singleFlight,invitationFrom} from '../staging-app/room-session.js';

test('current permanent account survives failed anonymous startup',async()=>{
 const auth={currentUser:null,authStateReady:async()=>{}};
 const s=createRoomSession(auth,async()=>{throw Error('restricted');});
 await assert.rejects(s.current(),/restricted/);
 auth.currentUser={uid:'member'};
 assert.equal((await s.current()).uid,'member');
});
test('concurrent guest operations share one signup and can retry failure',async()=>{
 let count=0,release;
 const auth={currentUser:null,authStateReady:async()=>{}};
 const s=createRoomSession(auth,async()=>{count++;await new Promise(r=>release=r);return {user:auth.currentUser={uid:'guest'}};});
 const a=s.current(),b=s.current();await new Promise(r=>setTimeout(r,0));release();
 assert.deepEqual(await Promise.all([a,b]),[{uid:'guest'},{uid:'guest'}]);assert.equal(count,1);
});
test('account replacement and signout revoke stale identity',()=>{
 const auth={currentUser:{uid:'new'}};const s=createRoomSession(auth,()=>{});
 assert.throws(()=>s.assertIdentity('old'),/Account changed/);s.assertIdentity('new');
 auth.currentUser=null;assert.throws(()=>s.assertIdentity('new'),/Account changed/);
});
test('duplicate join taps coalesce; next attempt can proceed',async()=>{
 let count=0;const action=singleFlight(async()=>{count++;return 'joined';});
 assert.deepEqual(await Promise.all([action(),action()]),['joined','joined']);assert.equal(count,1);
 await action();assert.equal(count,2);
});
test('invitation validates complete link and compact code',()=>{
 const id='a'.repeat(32),code='b'.repeat(16);
 assert.deepEqual(invitationFrom(`https://example.test/?room=${id}&invite=${code}`),{id,code});
 assert.deepEqual(invitationFrom(`${id}:${code}`),{id,code});
 for(const invalid of ['','missing','abc:123',`https://example.test/?room=${id}`,`${id}:${code}x`])assert.equal(invitationFrom(invalid),null);
});
