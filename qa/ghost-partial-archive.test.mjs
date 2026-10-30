import test from 'node:test';
import assert from 'node:assert/strict';
import {archivePartialGhost} from '../staging-app/ghost-partial-archive.js';
const D='dcc_house_ghost_draft_v1',A='dcc_house_ghost_archive_v1';
function make(){const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),map:m};}
const partial={version:1,tier:'tenFifteen',holesPlanned:18,condition:'normal',holes:[{par:4,player:5,ghost:4}]};
test('unfinished match archives before resetting without losing recorded holes',()=>{
 const s=make();s.setItem(D,JSON.stringify(partial));
 const result=archivePartialGhost(s,{confirmArchive:()=>true,now:10000});
 assert.deepEqual(result,{handled:true,archived:true});
 assert.deepEqual(JSON.parse(s.getItem(A))[0].holes,partial.holes);
 assert.equal(JSON.parse(s.getItem(D)).holes.length,0);
});
test('declining archive leaves draft and history untouched',()=>{
 const s=make();s.setItem(D,JSON.stringify(partial));
 assert.equal(archivePartialGhost(s,{confirmArchive:()=>false}).archived,false);
 assert.equal(s.getItem(A),null);
 assert.deepEqual(JSON.parse(s.getItem(D)),partial);
});
test('failed archive write never clears draft',()=>{
 const m=new Map([[D,JSON.stringify(partial)]]);
 const s={getItem:k=>m.get(k)||null,setItem:(k,v)=>{if(k===A)throw Error('quota');m.set(k,v);}};
 assert.throws(()=>archivePartialGhost(s,{confirmArchive:()=>true}));
 assert.equal(JSON.parse(s.getItem(D)).holes.length,1);
});
test('empty matches remain untouched, completed matches archive and reset',()=>{
 const s=make();s.setItem(D,JSON.stringify({...partial,holes:[]}));
 assert.equal(archivePartialGhost(s).handled,false);
 const complete={...partial,holes:Array(18).fill({par:4,player:4,ghost:4})};
 s.setItem(D,JSON.stringify(complete));
 assert.equal(archivePartialGhost(s,{confirmArchive:()=>true}).archived,true);
 assert.equal(JSON.parse(s.getItem(A))[0].result.status,'Completed · 18 of 18 holes');
 assert.equal(JSON.parse(s.getItem(D)).holes.length,0);
});

test('match won 7&5 after 13 holes can archive and restart',()=>{
 const s=make();const holes=Array.from({length:13},(_,i)=>({par:4,player:i<7?4:5,ghost:i<7?5:5}));
 s.setItem(D,JSON.stringify({...partial,holes}));
 const result=archivePartialGhost(s,{confirmArchive:()=>true,now:20000});
 assert.equal(result.archived,true);
 assert.equal(JSON.parse(s.getItem(A))[0].holes.length,13);
 assert.match(JSON.parse(s.getItem(A))[0].result.status,/Completed/);
 assert.deepEqual(JSON.parse(s.getItem(D)).holes,[]);
});
