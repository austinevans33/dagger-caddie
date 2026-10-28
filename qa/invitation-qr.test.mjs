import test from 'node:test';
import assert from 'node:assert/strict';
import jsQR from 'jsqr';
import {invitationMatrix,createInvitationSharing} from '../staging-app/invitation-qr.js';

const url='https://dagger-country-club-staging--qr-candidate-abcdef.web.app/?room='+'a'.repeat(32)+'&invite='+'b'.repeat(16);
const file={name:'dagger-money-room-invitation.png',type:'image/png'};
function setup(overrides={}){
 const calls=[];
 const navigator={canShare:()=>true,share:async payload=>calls.push(['share',payload]),clipboard:{writeText:async value=>calls.push(['copy',value])},...overrides};
 const sharing=createInvitationSharing({navigator,makeFile:async()=>file,saveFile:value=>calls.push(['download',value])});
 return {sharing,calls};
}
test('real QR raster decodes to the full invitation with quiet zone',()=>{
 const matrix=invitationMatrix(url),scale=6,quiet=4,width=(matrix.size+quiet*2)*scale;
 const pixels=new Uint8ClampedArray(width*width*4);pixels.fill(255);
 for(let y=0;y<matrix.size;y++)for(let x=0;x<matrix.size;x++)if(matrix.dark(y,x)){
  for(let dy=0;dy<scale;dy++)for(let dx=0;dx<scale;dx++){
   const offset=(((y+quiet)*scale+dy)*width+(x+quiet)*scale+dx)*4;
   pixels[offset]=pixels[offset+1]=pixels[offset+2]=0;
  }
 }
 assert.equal(jsQR(pixels,width,width)?.data,url);
});
test('QR rejects insecure, incomplete and credential-bearing invitations',()=>{
 for(const invalid of ['javascript:alert(1)','https://example.test/','http://example.test/?room='+'a'.repeat(32)+'&invite='+'b'.repeat(16),url.replace('https://','https://name:password@')])assert.throws(()=>invitationMatrix(invalid));
});
test('native QR sharing includes PNG and tappable invitation URL',async()=>{
 const {sharing,calls}=setup();await sharing.prepare(url);assert.equal((await sharing.share(url,{qr:true})).kind,'qr-share');
 assert.equal(calls.length,1);assert.deepEqual(calls[0][1],{title:'Dagger Money Room',url,files:[file]});
});
test('unsupported native file sharing saves QR and copies link',async()=>{
 const {sharing,calls}=setup({canShare:()=>false});await sharing.prepare(url);
 assert.deepEqual(await sharing.share(url,{qr:true}),{kind:'qr-download',linkCopied:true});assert.deepEqual(calls,[['download',file],['copy',url]]);
});
test('native file-share error falls back to QR download',async()=>{
 const {sharing,calls}=setup({share:async()=>{throw new TypeError('files unsupported');}});await sharing.prepare(url);
 assert.equal((await sharing.share(url,{qr:true})).kind,'qr-download');assert.equal(calls[0][0],'download');
});
test('cancelled QR share has no clipboard or download side effects',async()=>{
 const {sharing,calls}=setup({share:async()=>{throw Object.assign(Error('cancelled'),{name:'AbortError'});}});await sharing.prepare(url);
 assert.equal((await sharing.share(url,{qr:true})).kind,'cancelled');assert.equal(calls.length,0);
});
test('existing invitation-link control does not attach or download QR',async()=>{
 const {sharing,calls}=setup();await sharing.prepare(url);assert.equal((await sharing.share(url)).kind,'link-share');
 assert.equal(calls[0][1].url,url);assert.equal(calls[0][1].files,undefined);assert.equal(calls.length,1);
});
test('link-only sharing copies when native sharing is absent',async()=>{
 const {sharing,calls}=setup({share:undefined});assert.equal((await sharing.share(url)).kind,'link-copy');assert.deepEqual(calls,[['copy',url]]);
});
test('QR download remains usable when clipboard is unavailable',async()=>{
 const {sharing,calls}=setup({canShare:()=>false,clipboard:undefined});await sharing.prepare(url);
 assert.deepEqual(await sharing.share(url,{qr:true}),{kind:'qr-download',linkCopied:false});assert.equal(calls[0][0],'download');
});
test('QR preparation failure preserves link sharing',async()=>{
 const calls=[];const sharing=createInvitationSharing({navigator:{share:async p=>calls.push(p)},makeFile:async()=>{throw Error('canvas unavailable');}});
 await sharing.prepare(url);assert.equal((await sharing.share(url,{qr:true})).kind,'link-share');assert.equal(calls[0].url,url);
});
test('clearing an account discards an in-flight old QR',async()=>{
 let resolve;const calls=[];const sharing=createInvitationSharing({navigator:{share:async p=>calls.push(p)},makeFile:()=>new Promise(r=>resolve=r)});
 const pending=sharing.prepare(url);await Promise.resolve();sharing.clear();resolve(file);assert.equal(await pending,null);
 const other=url.replace('b'.repeat(16),'c'.repeat(16));assert.equal((await sharing.share(other)).kind,'link-share');assert.equal(calls[0].files,undefined);
});
