import test from 'node:test';
import assert from 'node:assert/strict';
import {saveActiveRound,readActiveRound,clearActiveRound,shouldOfferStarterDesk} from '../staging-app/starters-desk-session.js';
const selection={course:{provider:'verified',providerCourseId:'18',name:'Sample',region:'NC'},tee:{providerTeeId:'white',name:'White',totalYards:6100},holeNumber:1};
function storage(){const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};}
test('Starter Desk checks in once then remembers exact course and tee',()=>{
 const s=storage();
 assert.equal(shouldOfferStarterDesk(s),true);
 assert.equal(saveActiveRound(s,selection,1000),true);
 assert.deepEqual(readActiveRound(s).selection,selection);
 assert.equal(shouldOfferStarterDesk(s),false);
 assert.equal(clearActiveRound(s),true);
 assert.equal(shouldOfferStarterDesk(s),true);
});
test('invalid selection cannot replace an existing round',()=>{
 const s=storage();saveActiveRound(s,selection,1000);
 assert.equal(saveActiveRound(s,{...selection,holeNumber:99},2000),false);
 assert.equal(readActiveRound(s).selectedAt,1000);
});
test('storage denial keeps app usable',()=>{
 const s={getItem(){throw Error('denied')},setItem(){throw Error('denied')},removeItem(){throw Error('denied')}};
 assert.equal(readActiveRound(s),null);
 assert.equal(saveActiveRound(s,selection),false);
 assert.equal(clearActiveRound(s),false);
});
