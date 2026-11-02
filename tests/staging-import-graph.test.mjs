import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const start=['playtest/ai-chat.js','yardage-book-ui.js','weekend-match-ui.js'];
test('all local modules reachable by staging Ghost/Yardage entry resolve',()=>{
 const visited=new Set(),missing=[];
 function walk(rel){
  if(visited.has(rel))return;visited.add(rel);
  const absolute=resolve(root,rel);
  if(!existsSync(absolute)){missing.push(rel);return;}
  const source=readFileSync(absolute,'utf8');
  for(const match of source.matchAll(/(?:import|export)\s+(?:[^'"]+?\s+from\s+)?['"]([^'"]+)['"]/g)){
   const target=match[1].split('?')[0];
   if(!target.startsWith('.'))continue;
   const dependency=resolve(dirname(absolute),target);
   if(!dependency.startsWith(root)){missing.push(target);continue;}
   walk(dependency.slice(root.length));
  }
 }
 start.forEach(walk);
 assert.deepEqual(missing,[]);
});
