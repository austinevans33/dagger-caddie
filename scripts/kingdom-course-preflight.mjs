// Rehearse real catalog entries using the same scorecards, pencil art and Ghost as the app.
import {readFile} from 'node:fs/promises';
import {founderFactoryEntries} from '../app/61f9e9de0a/founders-verified-scorecards.js';
import {inspectFactoryBatch} from '../app/61f9e9de0a/course-factory-batch.js';
import {loadHoleSketch} from '../app/61f9e9de0a/hole-sketch.js';

const queries=new Set(process.argv.slice(2));
const catalog=founderFactoryEntries();
const entries=catalog.filter(({selection})=>!queries.size||queries.has(selection.course.providerCourseId));
if(queries.size&&entries.length!==queries.size)throw Error('One or more requested course IDs are absent from the curated catalog');
const fetchBundled=async url=>{
  if(!(url instanceof URL)||url.protocol!=='file:')return {ok:false};
  try {return {ok:true,json:async()=>JSON.parse(await readFile(url,'utf8'))};}
  catch {return {ok:false};}
};
const rows=await inspectFactoryBatch(entries,{
  loadSketch:(selection,hole,{signal})=>loadHoleSketch(selection,hole,{signal,fetcher:fetchBundled})
});
const counts={
  discovered:entries.length,
  scorecardReady:entries.length,
  fullyDrawn:rows.filter(r=>r.mapped===r.count).length,
  someDrawings:rows.filter(r=>r.mapped>0).length,
  ghostReady:rows.filter(r=>r.ghostReady).length,
  passedCoursePreflight:rows.filter(r=>r.status==='candidate-ready').length
};
console.log(JSON.stringify({counts,courses:rows.map(r=>({
  id:r.id??entries[r.index].selection.course.providerCourseId,
  mappedHoles:r.mapped,holeCount:r.count??entries[r.index].holes.length,
  partialHoles:r.drawings?.filter(h=>h.coverage==='partial').map(h=>h.hole)??[],
  ghostReady:r.ghostReady??false,status:r.status
}))},null,2));
