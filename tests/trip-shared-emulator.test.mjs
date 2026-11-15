import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sharedTripStore} from '../trip-shared.js';

test('shared Cup enforces membership and syncs transactional corrections',
 {skip:!process.env.FIRESTORE_EMULATOR_HOST,timeout:45000},async()=>{
 const {initializeTestEnvironment,assertFails}=await import('@firebase/rules-unit-testing');
 const sdk=await import('firebase/firestore');
 const env=await initializeTestEnvironment({projectId:'demo-dcc-trip',firestore:{
  rules:await readFile(new URL('../firestore.trip-emulator.rules',import.meta.url),'utf8')
 }});
 try {
  const db=uid=>env.authenticatedContext(uid).firestore();
  const host=sharedTripStore(db('host'),sdk);
  const keeper=sharedTripStore(db('keeper'),sdk);
  const guest=sharedTripStore(db('guest'),sdk);
  const draft={id:'cup',name:'Cup De Diesel Nips',players:[{id:'a',name:'Alex'},{id:'b',name:'Bailey'}],
   rounds:[{id:'r',name:'Opening round',status:'active',groups:[{id:'g',playerIds:['a','b']}]}]};
  await host.publish(draft,'host',{'r~g':'keeper'});
  await assertFails(keeper.load('cup'));
  await assertFails(guest.grant('cup','guest'));
  await host.grant('cup','keeper');
  await host.grant('cup','guest');
  const loaded=await guest.load('cup');
  const save=(store,hole,expected,strokes)=>store.save('cup',{roundId:'r',groupId:'g',hole,expected,strokes});
  await assertFails(save(guest,1,null,[4,5]));
  await assertFails(save(keeper,1,null,[4,5,6]));
  await assertFails(sdk.setDoc(sdk.doc(db('keeper'),'cupTrips/cup/holes/r~g~2'),
   {groupKey:'r~g',hole:1,holeKey:'1',strokes:[4,5]}));
  await Promise.all([save(keeper,1,null,[4,5]),save(keeper,2,null,[4,5])]);
  const readStandings=(store,expected)=>new Promise((resolve,reject)=>{
   const stop=store.watch('cup',loaded,update=>{
    if(!update.fromCache&&update.standings[0].skins===expected){stop();resolve(update.standings);}
   },error=>{stop();reject(error);});
  });
  assert.deepEqual((await readStandings(guest,2))[0],{id:'a',name:'Alex',holes:2,skins:2});
  await save(keeper,1,[4,5],[5,4]);
  await assert.rejects(save(keeper,1,[4,5],[3,4]),/This hole changed/);
  await save(keeper,1,[4,5],[5,4]);
  const reconnect=sharedTripStore(db('guest'),sdk);
  const standings=await readStandings(reconnect,1);
  assert.deepEqual(standings.map(row=>row.skins),[1,1]);
 } finally {await env.cleanup();}
});
