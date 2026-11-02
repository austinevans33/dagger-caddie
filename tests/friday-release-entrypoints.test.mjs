import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
test('Friday playtest entrypoints and read-only previews are all present',()=>{
 for(const p of ['playtest/index.html','playtest/yardage-preview.html','playtest/ghost-preview.html','yardage-book.js','yardage-selection.js','money-room.js','invitation-qr.js'])assert(existsSync(resolve(root,p)),p);
});
test('all local module script references in Friday HTML resolve on disk',()=>{
 for(const p of ['playtest/index.html','playtest/yardage-preview.html','playtest/ghost-preview.html']){
  const source=read(p);
  const scriptTags=[...source.matchAll(/<script\b[^>]*type=["']module["'][^>]*src=["']([^"']+)["']/gi)].map(m=>m[1]);
  for(const target of scriptTags){
   if(/^(https?:|\/\/)/.test(target))continue;
   assert(existsSync(resolve(root,dirname(p),target.split(/[?#]/)[0])),p+': '+target);
  }
  const imports=[...source.matchAll(/\bimport\s+(?:[^'"]+\s+from\s+)?["'](\.[^'"]+)["']/g)].map(m=>m[1]);
  for(const target of imports)assert(existsSync(resolve(root,dirname(p),target)),p+': '+target);
 }
});
test('Playtest preserves live scoring and Money Room entrypoints',()=>{
 const app=read('playtest/index.html');
 for(const id of ['moneyRoomSection','roomCreate','roomJoin','roomSaveHole'])assert(app.includes('id="'+id+'"'),id);
 assert(app.includes('yardage-preview.html'));
 assert(app.includes('ghost-preview.html'));
});
