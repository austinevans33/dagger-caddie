import test from 'node:test';
import assert from 'node:assert/strict';
import {installAllHeartBridge} from '../playtest/all-heart-bridge.js';
class Node {
 constructor(doc){this.ownerDocument=doc;this.children=[];this.listeners={};this.attributes={}}
 replaceChildren(...c){this.children=c}
 append(...c){this.children.push(...c)}
 setAttribute(k,v){this.attributes[k]=v}
 addEventListener(k,fn){this.listeners[k]=fn}
}
function fixture(){
 const listeners=new Map();
 const doc={addEventListener(k,fn){listeners.set(k,fn)},removeEventListener(k){listeners.delete(k)},
 getElementById(){return root},createElement(){return new Node(doc)},dispatchEvent(e){listeners.get(e.type)?.(e)}};
 const root=new Node(doc);
 return {doc,root,emit:(detail)=>listeners.get('dcc:all-heart-context')?.({detail})};
}
const context={courseId:'verified-course',holeNumber:6,par:4,strokeIndex:15,moneyRoomPlayers:3,roundActive:true,verifiedCourse:true};
test('bridge requires verified active round and nonempty round key',()=>{
 const f=fixture();installAllHeartBridge({document:f.doc});
 f.emit({roundKey:'r1',context:{...context,verifiedCourse:false}});
 assert.equal(f.root.children.length,0);
 f.emit({roundKey:'r1',context});
 assert.equal(f.root.children.length,1);
 f.emit({roundKey:'r1',context});
 assert.equal(f.root.children.length,0);
});
test('bridge resets per-round limits only for new round identity',()=>{
 const f=fixture();installAllHeartBridge({document:f.doc});
 f.emit({roundKey:'r1',context});assert.equal(f.root.children.length,1);
 f.emit({roundKey:'r2',context});assert.equal(f.root.children.length,1);
});
