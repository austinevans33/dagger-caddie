import test from 'node:test';
import assert from 'node:assert/strict';
import {createTournamentTransport} from '../scripts/tournament-sync.mjs';
function harness({uid='captain-123',response={data:{ok:true,eventId:'event-123',revision:1}},error=null}={}){
 const calls=[],subs=[];
 const sdk={
  auth:{currentUser:uid?{uid}:null},
  functions:{},firestore:{},
  httpsCallable:(functions,name)=>{
   assert.equal(name,'tournamentHQ');
   return async payload=>{calls.push(payload);if(error)throw error;return response};
  },
  doc:(firestore,collection,id)=>({collection,id}),
  onSnapshot:(ref,onNext,onError)=>{
   const value={ref,onNext,onError,closed:false};subs.push(value);return ()=>{value.closed=true};
  },
  mutationId:()=> 'mut-test-001'
 };
 return {transport:createTournamentTransport(sdk),calls,subs,sdk};
}
test('all score edits go to authenticated callable, never browser Firestore writes',async()=>{
 const h=harness();
 const x=await h.transport.send('score',{eventId:'event-123',teamId:'team-123',hole:4,strokes:3,expectedTeamRevision:0});
 assert.equal(x.ok,true);
 assert.deepEqual(h.calls[0],{eventId:'event-123',teamId:'team-123',hole:4,strokes:3,expectedTeamRevision:0,action:'score',mutationId:'mut-test-001'});
});
test('read command sends no mutation ID, create allocates one',async()=>{
 const h=harness();
 await h.transport.send('read',{eventId:'event-123'});
 await h.transport.send('create',{name:'Open',holes:18});
 assert.equal('mutationId' in h.calls[0],false);
 assert.equal(h.calls[1].mutationId,'mut-test-001');
 assert.equal('eventId' in h.calls[1],false);
});
test('no current auth session prohibits writes and watching',async()=>{
 const h=harness({uid:null});
 const r=await h.transport.send('score',{eventId:'event-123',teamId:'team-123'});
 assert.deepEqual(r,{ok:false,error:{code:'unauthenticated',message:'Sign in before using Tournament HQ'}});
 assert.equal(h.calls.length,0);
 let code=null;
 const stop=h.transport.watch('event-123',()=>{},error=>{code=error.code});
 assert.equal(code,'unauthenticated');stop();assert.equal(h.subs.length,0);
});
test('invalid event and unknown actions do not invoke backend',async()=>{
 const h=harness();
 await assert.rejects(()=>h.transport.send('delete-everything',{eventId:'event-123'}),/Unknown tournament action/);
 await assert.rejects(()=>h.transport.send('score',{eventId:'a'}),/Tournament event ID required/);
 assert.equal(h.calls.length,0);
});
test('server rejection is surfaced without changing client tournament state',async()=>{
 const h=harness({error:{code:'functions/permission-denied',message:'Not team captain'}});
 const r=await h.transport.send('score',{eventId:'event-123',teamId:'team-123'});
 assert.equal(r.ok,false);
 assert.equal(r.error.code,'functions/permission-denied');
});
test('live snapshot, offline/cached status, and cleanup are handled',()=>{
 const h=harness();const observed=[],errors=[];
 const stop=h.transport.watch('event-123',event=>observed.push(event),error=>errors.push(error));
 assert.deepEqual(h.subs[0].ref,{collection:'tournaments',id:'event-123'});
 const data={id:'event-123',version:1,teams:[]};
 h.subs[0].onNext({exists:()=>true,data:()=>data,metadata:{fromCache:false,hasPendingWrites:false}});
 h.subs[0].onNext({exists:()=>true,data:()=>data,metadata:{fromCache:true,hasPendingWrites:false}});
 assert.deepEqual(observed.map(e=>e.syncStatus),['live','cached']);
 h.subs[0].onNext({exists:()=>false});assert.equal(errors[0].code,'not-found');
 stop();assert.equal(h.subs[0].closed,true);
 h.subs[0].onNext({exists:()=>true,data:()=>data});
 assert.equal(observed.length,2);
});
test('malformed event is never shown as authoritative leaderboard data',()=>{
 const h=harness();const observed=[],errors=[];
 h.transport.watch('event-123',event=>observed.push(event),error=>errors.push(error));
 h.subs[0].onNext({exists:()=>true,data:()=>({id:'other-event',version:1,teams:[]})});
 assert.equal(observed.length,0);assert.equal(errors[0].code,'invalid-event');
});
test('all tournament write actions preserve caller mutation ids for retries',async()=>{
 const h=harness();
 await h.transport.send('score',{eventId:'event-123',mutationId:'stable-mut-123'});
 assert.equal(h.calls[0].mutationId,'stable-mut-123');
});
