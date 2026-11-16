import test from 'node:test';
import assert from 'node:assert/strict';
import {installAllHeartActions} from '../playtest/all-heart-actions.js';
function fixture(){
 const listeners=new Map();const clicks=[];
 const nodes={'tab-bets':{click(){clicks.push('tab')}},dccPropNew:{click(){clicks.push('open')}},dccPropFormWrap:{open:false},dccPropText:{focus(){clicks.push('focus')}}};
 const doc={addEventListener(k,fn){listeners.set(k,fn)},removeEventListener(k){listeners.delete(k)},getElementById(k){return nodes[k]},dispatchEvent(e){listeners.get(e.type)?.(e)}};
 return {doc,clicks,emit:(moment)=>doc.dispatchEvent({type:'dcc:all-heart-accepted',detail:{roundKey:'r1',moment}})};
}
test('Dare only opens existing ticket proposal, never submits',()=>{
 const f=fixture();installAllHeartActions({document:f.doc});
 f.emit({type:'dare',action:'open-ticket-window'});
 assert.deepEqual(f.clicks,['tab','open','focus']);
});
test('unknown action does nothing',()=>{
 const f=fixture();installAllHeartActions({document:f.doc});
 f.emit({type:'dare',action:'submit-bet'});assert.deepEqual(f.clicks,[]);
});
test('missing Ticket Window does not attempt submission',()=>{
 const f=fixture();f.doc.getElementById=()=>null;installAllHeartActions({document:f.doc});
 f.emit({type:'dare',action:'open-ticket-window'});assert.deepEqual(f.clicks,[]);
});
