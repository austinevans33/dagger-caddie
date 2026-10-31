import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {saveActiveRound,readActiveRound} from '../playtest/starters-desk-session.js';
import {startSoloCard,readSoloCard,saveSoloScore,setSoloHole,setSoloLength,summarizeSoloCard,soloRange,SOLO_CARD_KEY} from '../playtest/solo-scorecard.js';
import {archiveAndClearSoloRound,SOLO_ARCHIVE_KEY} from '../playtest/solo-round-reset.js';
import {normalizeOpenGolfHoles,loadOpenGolfHoles} from '../playtest/opengolf-holes.js';
import {getActiveCourseContext,readCourseScorecard} from '../playtest/active-course-context.js';
export const selection={course:{provider:'opengolfapi',providerCourseId:'qa-pines',name:'QA Pines (fixture)',region:'NC'},tee:{providerTeeId:'blue',name:'Blue',totalYards:6300},holeNumber:1};
export const holes=Array.from({length:18},(_,i)=>({hole_number:i+1,par:4,yardages:{blue:350,white:300}}));
export function memory(){const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};}
function ready(){const s=memory();saveActiveRound(s,selection,100);return s;}
test('all 15 valid scores, progression, correction and persisted reload',()=>{
 const s=ready();for(let n=1;n<=15;n++)assert.equal(saveSoloScore(s,n).scores[n-1],n);
 assert.equal(readSoloCard(s).hole,16);setSoloHole(s,2);saveSoloScore(s,15);
 assert.equal(readSoloCard(s).scores[1],15);assert.equal(saveSoloScore(s,16),null);
});
test('front/back nine boundaries preserve every saved score through length switches',()=>{
 const s=ready();saveSoloScore(s,5);setSoloHole(s,10);saveSoloScore(s,12);
 const back=setSoloLength(s,9);assert.deepEqual(soloRange(back),{start:10,end:18});
 assert.equal(setSoloHole(s,9),null);setSoloHole(s,18);assert.equal(saveSoloScore(s,4).hole,18);
 const summary=summarizeSoloCard(readSoloCard(s),Array(18).fill(4));assert.equal(summary.total,16);assert.equal(summary.relativeToPar,8);
 assert.equal(setSoloLength(s,18).scores[0],5);assert.equal(readSoloCard(s).scores[9],12);
 const f=ready();setSoloLength(f,9);assert.deepEqual(soloRange(readSoloCard(f)),{start:1,end:9});assert.equal(setSoloHole(f,10),null);
});
test('legacy cards retain scores and completed card recap totals are exact',()=>{
 const s=ready(),c=startSoloCard(s);delete c.length;c.scores=Array(18).fill(4);s.setItem(SOLO_CARD_KEY,JSON.stringify(c));
 assert.equal(readSoloCard(s).scores.length,18);
 assert.deepEqual([summarizeSoloCard(c,Array(18).fill(4)).total,summarizeSoloCard(c,Array(18).fill(4)).relativeToPar],[72,0]);
 assert.equal(summarizeSoloCard(c,[]).relativeToPar,null);
});
test('tee-specific mapping never substitutes another tee or missing hole',async()=>{
 assert.equal(normalizeOpenGolfHoles({holes},selection).length,18);
 assert.equal(normalizeOpenGolfHoles({holes},selection)[0].yards,350);
 assert.equal(normalizeOpenGolfHoles({holes}, {...selection,tee:{...selection.tee,providerTeeId:'red',name:'Red'}}).length,0);
 assert.equal(normalizeOpenGolfHoles({holes:[{hole_number:1,par:4,yardages:{white:300}}]},selection).length,0);
 const h=await loadOpenGolfHoles(selection,{fetcher:async url=>{assert.match(url,/qa-pines\/holes$/);return {ok:true,json:async()=>({holes})};}});assert.equal(h.length,18);
});
test('actual Pines provider number schema maps all 18 holes to the selected tees',()=>{
 const body=JSON.parse(readFileSync(new URL('./fixtures/pines-provider-holes.json',import.meta.url)));
 for(const [name,total] of [['White',6397],['Blue',7049]]){
  const facts=normalizeOpenGolfHoles(body,{...selection,tee:{name,providerTeeId:name,totalYards:total}});
  assert.equal(facts.length,18);assert.equal(facts.reduce((n,h)=>n+h.par,0),72);
  assert.equal(facts.reduce((n,h)=>n+h.yards,0),total);
 }
 assert.equal(normalizeOpenGolfHoles({holes:[{number:2,hole_number:1,par:4,yardages:{blue:350}}]},selection).length,0);
});
test('cached exact-course facts survive offline; mismatched tee/course never leaks',async()=>{
 const s=ready();await getActiveCourseContext({storage:s,fetcher:async()=>({ok:true,json:async()=>({holes})})});
 assert.equal(readCourseScorecard(s,selection).holes.length,18);
 assert.equal((await getActiveCourseContext({storage:s,fetcher:async()=>{throw Error('offline');}})).state,'offline-cached');
 saveActiveRound(s,{...selection,course:{...selection.course,providerCourseId:'other'}},101);
 assert.equal(readCourseScorecard(s,readActiveRound(s).selection),null);
 assert.equal((await getActiveCourseContext({storage:s,fetcher:async()=>{throw Error('offline');}})).holes.length,0);
});
test('late network response cannot overwrite a new course selection',async()=>{
 const s=ready();let finish;const pending=getActiveCourseContext({storage:s,fetcher:()=>new Promise(r=>{finish=r;})});
 saveActiveRound(s,{...selection,course:{...selection.course,providerCourseId:'next'}},102);
 finish({ok:true,json:async()=>({holes})});assert.equal((await pending).state,'selection-changed');
 assert.equal(readCourseScorecard(s,readActiveRound(s).selection),null);
});
test('partially played archive preserves all scores and unrelated game data',()=>{
 const s=ready();s.setItem('dagger_room_archives','keep');s.setItem('dcc_house_ghost_draft_v1','keep');saveSoloScore(s,15);
 assert.equal(archiveAndClearSoloRound(s,{now:200}).archived,true);
 assert.equal(JSON.parse(s.getItem(SOLO_ARCHIVE_KEY))[0].card.scores[0],15);
 assert.equal(readActiveRound(s),null);assert.equal(readSoloCard(s),null);
 assert.equal(s.getItem('dagger_room_archives'),'keep');assert.equal(s.getItem('dcc_house_ghost_draft_v1'),'keep');
});
test('failed archive write retains the current partial round and scores',()=>{
 const s=ready();saveSoloScore(s,7);const set=s.setItem;s.setItem=(k,v)=>{if(k===SOLO_ARCHIVE_KEY)throw Error('quota');set(k,v);};
 assert.equal(archiveAndClearSoloRound(s).ok,false);assert.equal(readSoloCard(s).scores[0],7);assert.ok(readActiveRound(s));
});
