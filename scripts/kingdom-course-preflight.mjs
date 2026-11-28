// Rehearse real catalog entries using the same scorecards, pencil art and Ghost as the app.
import {createHash} from 'node:crypto';
import {readFile,readdir,rename,writeFile} from 'node:fs/promises';
import {parseArgs} from 'node:util';
import {founderFactoryEntries} from '../app/61f9e9de0a/founders-verified-scorecards.js';
import {inspectFactoryBatch} from '../app/61f9e9de0a/course-factory-batch.js';
import {loadHoleSketch} from '../app/61f9e9de0a/hole-sketch.js';

const {values,positionals}=parseArgs({
  allowPositionals:true,
  options:{checkpoint:{type:'string'},region:{type:'string'}},
});
const queries=new Set(positionals);
const catalog=founderFactoryEntries();
const entries=catalog.filter(({selection:{course}})=>
  (!queries.size||queries.has(course.providerCourseId)) &&
  (!values.region||course.region.endsWith(', '+values.region.toUpperCase())));
if(queries.size&&entries.length!==queries.size)throw Error('One or more requested course IDs are absent from the curated catalog');
const fetchBundled=async url=>{
  if(!(url instanceof URL)||url.protocol!=='file:')return {ok:false};
  try {return {ok:true,json:async()=>JSON.parse(await readFile(url,'utf8'))};}
  catch {return {ok:false};}
};
const options={loadSketch:(selection,hole,{signal})=>loadHoleSketch(selection,hole,{signal,fetcher:fetchBundled})};

async function runWithCheckpoint(path) {
  const root=new URL('../app/61f9e9de0a/',import.meta.url);
  const files=(await readdir(root,{recursive:true,withFileTypes:true})).filter(entry=>entry.isFile())
    .map(entry=>entry.parentPath+'/'+entry.name).sort();
  const digest=createHash('sha256');
  for(const file of files) {
    digest.update(file.slice(root.pathname.length)+'\0');
    digest.update(await readFile(file));
    digest.update('\0');
  }
  const ids=entries.map(entry=>entry.selection.course.providerCourseId);
  const pin=digest.digest('hex');
  let saved={version:1,pin,ids,rows:[]};
  try {saved=JSON.parse(await readFile(path,'utf8'));}
  catch(error) {if(error.code!=='ENOENT')throw error;}
  if(saved.version!==1||saved.pin!==pin||JSON.stringify(saved.ids)!==JSON.stringify(ids) ||
      !Array.isArray(saved.rows)||saved.rows.length>ids.length||
      saved.rows.some((row,index)=>row.id!==ids[index]||row.index!==index)) {
    throw Error('Checkpoint does not match this exact runtime and course selection');
  }
  for(const [index,entry] of entries.entries()) {
    if(index<saved.rows.length)continue;
    const [row]=await inspectFactoryBatch([entry],options);
    saved.rows.push({...row,index,id:ids[index]});
    const pending=path+'.'+process.pid+'.tmp';
    await writeFile(pending,JSON.stringify(saved,null,2)+'\n',{flag:'wx'});
    await rename(pending,path);
  }
  return saved.rows;
}

const rows=values.checkpoint?await runWithCheckpoint(values.checkpoint):await inspectFactoryBatch(entries,options);
const counts={
  discovered:entries.length,
  scorecardReady:rows.filter(r=>r.status!=='scorecard-blocked').length,
  fullyDrawn:rows.filter(r=>r.mapped===r.count).length,
  someDrawings:rows.filter(r=>r.mapped>0).length,
  ghostReady:rows.filter(r=>r.ghostReady).length,
  passedCoursePreflight:rows.filter(r=>r.status==='candidate-ready').length
};
const exceptions=rows.filter(row=>row.status!=='candidate-ready').map(row=>({
  id:row.id??entries[row.index].selection.course.providerCourseId,
  status:row.status,
  holes:row.drawings?.filter(drawing=>!drawing.ready).map(({hole,coverage})=>({hole,coverage}))??[],
}));
console.log(JSON.stringify({counts,...values.checkpoint&&{exceptions},courses:rows.map(r=>({
  id:r.id??entries[r.index].selection.course.providerCourseId,
  mappedHoles:r.mapped,holeCount:r.count??entries[r.index].holes.length,
  partialHoles:r.drawings?.filter(h=>h.coverage==='partial').map(h=>h.hole)??[],
  ghostReady:r.ghostReady??false,status:r.status
}))},null,2));
