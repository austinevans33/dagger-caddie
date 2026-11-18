import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {founderCatalogRecords,founderTeesForCourse,founderVerifiedScorecard} from '../app/61f9e9de0a/founders-verified-scorecards.js';
import {loadHoleSketch} from '../app/61f9e9de0a/hole-sketch.js';
import {saveActiveRound} from '../app/61f9e9de0a/starters-desk-session.js';
import {readCourseScorecard} from '../app/61f9e9de0a/active-course-context.js';
import {startSoloCard,saveSoloScore,setSoloHole,readSoloCard} from '../app/61f9e9de0a/solo-scorecard.js';
import {ghostShotPlayback} from '../app/61f9e9de0a/house-ghost-playback.js';

const [course]=founderCatalogRecords('Shining Rock');
const tees=founderTeesForCourse(course);
const sum=values=>values.reduce((a,b)=>a+b,0);
const art=JSON.parse(readFileSync(new URL('../app/61f9e9de0a/course-art/shining-rock-northbridge-ma.json',import.meta.url),'utf8'));
const fetchArt=async()=>({ok:true,json:async()=>art});

test('The Rock official tee cards match both nines, totals and Red number 4',()=>{
 assert.equal(course.providerCourseId,'shining-rock-northbridge-ma');
 assert.deepEqual(founderCatalogRecords('Shinning Rock'),[course]);
 assert.deepEqual(founderCatalogRecords('Shining Rock Acorn'),[]);
 const official=[
  ['gold',3330,3398,6728,72,343,11],
  ['blue',3202,3269,6471,72,328,11],
  ['green',3023,3173,6196,72,282,11],
  ['white',2915,3089,6004,72,282,11],
  ['red',2507,2814,5321,72,275,5],
  ['red-par-3',2340,2814,5154,71,108,5],
 ];
 const normalized=tees.map(tee=>{
  const {holes}=founderVerifiedScorecard({course,tee});
  assert.deepEqual(holes.map(h=>h.number),Array.from({length:18},(_,i)=>i+1));
  assert.deepEqual([...holes.map(h=>h.handicapMen)].sort((a,b)=>a-b),Array.from({length:18},(_,i)=>i+1));
  return [tee.providerTeeId,sum(holes.slice(0,9).map(h=>h.yards)),sum(holes.slice(9).map(h=>h.yards)),
   tee.totalYards,sum(holes.map(h=>h.par)),holes[3].yards,holes[3].handicapMen];
 });
 assert.deepEqual(normalized,official);
});

test('Shining Rock full scoring survives reload and corrections while Ghost reads official par',async()=>{
 const tee=tees.find(t=>t.providerTeeId==='red-par-3');
 const selection={course,tee,holeNumber:1};
 const entries=new Map();
 const storage={getItem:k=>entries.get(k)??null,setItem:(k,v)=>entries.set(k,v)};
 assert(saveActiveRound(storage,selection,1));
 const {holes}=readCourseScorecard(storage,selection);
 assert.equal(holes[3].par,3);
 assert(startSoloCard(storage));
 for(const hole of holes){
  assert(saveSoloScore(storage,hole.par));
  const ghost=ghostShotPlayback({holeNumber:hole.number,holes,shotsRevealed:100});
  assert.equal(ghost.par,hole.par);
  assert(ghost.complete);
  assert.equal((await loadHoleSketch(selection,hole.number,{
   fetcher:fetchArt
  })).coverage,'layout');
 }
 assert.equal(sum(readSoloCard(storage).scores),71);
 setSoloHole(storage,4);
 saveSoloScore(storage,4);
 assert.equal(readSoloCard(storage).scores[3],4);
 assert.equal(readSoloCard(storage).hole,5);
});

test('completed Ghost archive stays with original handler and partial archive retains selected course',async()=>{
 const {archivePartialGhost}=await import('../app/61f9e9de0a/ghost-partial-archive.js');
 const snapshot=JSON.stringify({version:1,selection:{course,tee:tees[0],holeNumber:1},selectedAt:123});
 const entries=new Map();
 const storage={getItem:key=>entries.get(key)??null,setItem:(key,value)=>entries.set(key,value)};
 const draft={version:1,tier:'scratch',holesPlanned:18,course:snapshot,holes:Array.from({length:18},()=>({par:4,player:4,ghost:4}))};
 storage.setItem('dcc_house_ghost_draft_v1',JSON.stringify(draft));
 assert.deepEqual(archivePartialGhost(storage,{confirmArchive:()=>assert.fail('completed match must use original archive handler')}),{handled:false});
 assert.equal(storage.getItem('dcc_house_ghost_archive_v1'),null);
 draft.holes=draft.holes.slice(0,3);
 storage.setItem('dcc_house_ghost_draft_v1',JSON.stringify(draft));
 assert.equal(archivePartialGhost(storage,{confirmArchive:()=>true,now:123456}).archived,true);
 const archive=JSON.parse(storage.getItem('dcc_house_ghost_archive_v1'));
 assert.equal(archive.length,1);
 assert.equal(archive[0].course,snapshot);
 assert.deepEqual(archive[0].holes,draft.holes);
 assert.deepEqual(JSON.parse(storage.getItem('dcc_house_ghost_draft_v1')).holes,[]);
});

test('all reviewed Shining Rock maps meet existing Bayonet structure and retain tee-specific cards',async()=>{
 const {auditFounderGeometry,mappedRouteYards}=await import('../app/61f9e9de0a/founder-geometry-audit.js');
 const gold=founderVerifiedScorecard({course,tee:tees[0]});
 const audit=auditFounderGeometry({records:art.features,holes:gold.holes,metadata:art.metadata,expectedRef:'ma/shining-rock-golf-club'});
 assert.equal(audit.pass,true);
 assert.equal(audit.quality.mappedHoles,18);
 assert.equal(audit.quality.fairwayHoles,18);
 assert(mappedRouteYards(art.features,18)>490);
 assert.equal(gold.holes[17].yards,389);
 for(const tee of tees){
  for(let number=1;number<=18;number++){
   const sketch=await loadHoleSketch({course,tee,holeNumber:number},number,{fetcher:fetchArt});
   assert.equal(sketch.coverage,'layout');
   assert(sketch.annotations.route.tee[1]>sketch.annotations.route.green[1]);
   assert(sketch.shapes.some(s=>s.type==='green'));
   assert(sketch.shapes.some(s=>s.type==='tee'));
   assert(sketch.shapes.some(s=>s.type==='fairway'));
   assert.match(sketch.layoutNote,/unassigned/);
  }
 }
 assert(!art.features.some(f=>['way/901999595','way/901999597','way/902019411','way/1262825179','way/1262825180'].includes(f.properties.osm_id)));
});

test('missing reviewed artwork falls back without requesting unverified provider geometry',async()=>{
 const {loadHoleSketch:fresh}=await import('../app/61f9e9de0a/hole-sketch.js?missing-rock-art');
 let requests=0;
 const sketch=await fresh({course,tee:tees[0],holeNumber:18},18,{fetcher:async url=>{
  requests++;
  assert.match(String(url),/course-art\/shining-rock-northbridge-ma.json$/);
  return {ok:false};
 }});
 assert.equal(sketch.coverage,'scorecard');
 assert.equal(requests,1);
});
