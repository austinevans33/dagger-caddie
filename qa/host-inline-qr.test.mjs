import test from 'node:test';
import assert from 'node:assert/strict';
import {drawInvitationQr, invitationMatrix} from '../staging-app/invitation-qr.js';
const link='https://dagger-country-club-staging--m1-acceptance-qt6fd31c.web.app/?room='+'a'.repeat(32)+'&invite='+'b'.repeat(16);
test('inline host QR paints white background, dark modules and four-module quiet zone',()=>{
 const boxes=[];
 const ctx={fillStyle:'',fillRect(x,y,w,h){boxes.push({x,y,w,h,color:this.fillStyle});}};
 const canvas={width:0,height:0,getContext:type=>type==='2d'?ctx:null};
 const matrix=invitationMatrix(link);
 const result=drawInvitationQr(canvas,link,{scale:6});
 assert.equal(canvas.width,(matrix.size+8)*6);
 assert.equal(canvas.height,canvas.width);
 assert.equal(result.url,link);
 assert.deepEqual(boxes[0],{x:0,y:0,w:canvas.width,h:canvas.height,color:'#fff'});
 assert.ok(boxes.length>150);
 for(const b of boxes.slice(1)){
  assert.equal(b.color,'#000');assert.ok(b.x>=24&&b.y>=24);
  assert.ok(b.x+b.w<=canvas.width-24&&b.y+b.h<=canvas.height-24);
 }
});
test('inline QR rejects invalid links and canvas failures',()=>{
 const canvas={getContext:()=>null};
 assert.throws(()=>drawInvitationQr(canvas,'https://example.test/'));
 assert.throws(()=>drawInvitationQr(canvas,link),/unavailable/);
 assert.throws(()=>drawInvitationQr(canvas,link,{quiet:0}),/size/);
});
