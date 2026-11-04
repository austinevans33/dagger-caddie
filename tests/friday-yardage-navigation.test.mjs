import test from 'node:test';
import assert from 'node:assert/strict';
import {readYardageHole,saveYardageHole,YARDAGE_HOLE_KEY,YARDAGE_SELECTION_KEY} from '../playtest/yardage-navigation.js';
import {saveActiveRound} from '../playtest/starters-desk-session.js';
function store(){const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}}
const select=(course='pines',tee='white',holeNumber=1)=>({course:{provider:'opengolfapi',providerCourseId:course,name:course,region:'NC'},tee:{providerTeeId:tee,name:tee,totalYards:6500},holeNumber});
test('Yardage navigation uses selected round hole on first visit',()=>{
 const session=store(),local=store();saveActiveRound(local,select('pines','white',7));
 assert.equal(readYardageHole({session,local}),7);
});
test('Yardage remembers chosen hole and keeps same course/tee',()=>{
 const session=store(),local=store();saveActiveRound(local,select('pines','white',7));
 assert.equal(saveYardageHole({session,local,hole:9}),true);
 assert.equal(session.getItem(YARDAGE_HOLE_KEY),'9');
 assert.equal(session.getItem(YARDAGE_SELECTION_KEY),'opengolfapi|pines|white');
 assert.equal(readYardageHole({session,local}),9);
});
test('Switching course or tee never reuses the previous course hole',()=>{
 const session=store(),local=store();saveActiveRound(local,select('pines','white',7));
 saveYardageHole({session,local,hole:16});
 saveActiveRound(local,select('bayonet','white',2));
 assert.equal(readYardageHole({session,local}),2);
 saveYardageHole({session,local,hole:6});
 saveActiveRound(local,select('bayonet','blue',3));
 assert.equal(readYardageHole({session,local}),3);
});
test('Legacy hole works without active course and invalid changes are rejected',()=>{
 const session=store(),local=store();
 session.setItem(YARDAGE_HOLE_KEY,'8');assert.equal(readYardageHole({session,local}),8);
 assert.equal(saveYardageHole({session,local,hole:19}),false);
 assert.equal(readYardageHole({session,local}),8);
});
