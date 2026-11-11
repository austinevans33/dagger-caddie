import test from 'node:test';
import assert from 'node:assert/strict';
import {installAllHeartScoreEvents} from '../playtest/all-heart-score-events.js';
function fixture(){
 const handlers=new Map();let clears=0;
 const root={replaceChildren(){clears++}};
 const doc={addEventListener(k,fn){handlers.set(k,fn)},removeEventListener(k){handlers.delete(k)},getElementById(){return root}};
 return {doc,handlers,root,get clears(){return clears},emit:(type,detail)=>handlers.get(type)?.({detail})};
}
test('unverified Course Factory context clears All Heart and does not write storage',()=>{
 const f=fixture();let reads=0;
 const storage={getItem(){reads++;return null}};
 installAllHeartScoreEvents({doc:f.doc,storage});
 f.emit('dcc:verified-hole-context',{verified:false,courseId:'x',holeNumber:1});
 assert.equal(f.clears,1);assert.equal(reads,0);
 f.emit('dcc:solo-hole-change');
 assert.equal(reads,0);
});
test('course changes invalidate previously verified hole context',()=>{
 const f=fixture();let reads=0;
 const storage={getItem(){reads++;return null}};
 installAllHeartScoreEvents({doc:f.doc,storage});
 f.emit('dcc:verified-hole-context',{verified:true,courseId:'x',holeNumber:1});
 assert.ok(reads>0);
 const before=reads;
 f.emit('dcc:course-selected');f.emit('dcc:solo-hole-change');
 assert.equal(reads,before);assert.ok(f.clears>0);
});
test('cleanup removes all listeners',()=>{
 const f=fixture();const stop=installAllHeartScoreEvents({doc:f.doc,storage:{getItem(){return null}}});
 stop();assert.equal(f.handlers.size,0);
});
