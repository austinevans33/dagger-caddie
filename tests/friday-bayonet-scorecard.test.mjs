import test from 'node:test';
import assert from 'node:assert/strict';
import {BAYONET_TEES,BAYONET_PAR,BAYONET_SCORECARD_PROVENANCE,bayonetVerifiedScorecard,bayonetTeeForSelection} from '../playtest/bayonet-verified-scorecard.js';
import {getActiveCourseContext,readCourseScorecard} from '../playtest/active-course-context.js';
import {saveActiveRound} from '../playtest/starters-desk-session.js';
const makeSelection=(color='white',overrides={})=>({course:{provider:'opengolfapi',providerCourseId:'actual-provider-id-from-search',name:'Bayonet at Puppy Creek',region:'Raeford, NC',...(overrides.course||{})},tee:{providerTeeId:color,name:color.charAt(0).toUpperCase()+color.slice(1),totalYards:BAYONET_TEES[color]?.total||5752,...(overrides.tee||{})},holeNumber:1});
const memory=()=>{const data=new Map();return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),keys:()=>[...data.keys()]}};
test('all five photographed Bayonet tees reconcile front/back/18 and par 36+36',()=>{
 assert.equal(BAYONET_PAR.slice(0,9).reduce((a,b)=>a+b),36);assert.equal(BAYONET_PAR.slice(9).reduce((a,b)=>a+b),36);
 for(const [color,tee] of Object.entries(BAYONET_TEES)){
  assert.equal(tee.yards.length,18,color);
  assert.equal(tee.yards.slice(0,9).reduce((a,b)=>a+b),tee.front,color);
  assert.equal(tee.yards.slice(9).reduce((a,b)=>a+b),tee.back,color);
  assert.equal(tee.front+tee.back,tee.total,color);
  const ctx=bayonetVerifiedScorecard(makeSelection(color));
  assert.equal(ctx.holes.length,18,color);assert.equal(ctx.verifiedTee,color);
  assert.ok(ctx.holes.every((h,i)=>h.par===BAYONET_PAR[i]&&h.yards===tee.yards[i]));
  assert.deepEqual(new Set(ctx.holes.map(h=>h.handicapMen)).size,18);
  assert.deepEqual(new Set(ctx.holes.map(h=>h.handicapWomen)).size,18);
 }
 assert.equal(BAYONET_TEES.white.yards[17],450);
 assert.match(BAYONET_SCORECARD_PROVENANCE.audit,/459/);
});
test('a different course, provider or mismatched yardage/tee name cannot receive Bayonet data',()=>{
 assert.equal(bayonetVerifiedScorecard(makeSelection('white',{course:{name:'Bayonet at Fort Bragg'}})),null);
 assert.equal(bayonetVerifiedScorecard(makeSelection('white',{course:{provider:'other'}})),null);
 assert.equal(bayonetVerifiedScorecard(makeSelection('white',{tee:{totalYards:5761}})),null);
 assert.equal(bayonetVerifiedScorecard(makeSelection('white',{tee:{name:'Gold'}})),null);
 assert.equal(bayonetTeeForSelection(makeSelection('white')).color,'white');
});
test('matching Bayonet row works offline and never writes a fake provider cache',async()=>{
 const storage=memory();saveActiveRound(storage,makeSelection('white'),123456);
 let fetched=false;
 const ctx=await getActiveCourseContext({storage,fetcher:async()=>{fetched=true;throw Error('offline')}});
 assert.equal(fetched,false);
 assert.equal(ctx.source,'bayonet-club-scorecard');
 assert.equal(ctx.state,'club-scorecard');
 assert.equal(ctx.holes[17].yards,450);
 assert.equal(readCourseScorecard(storage,makeSelection('white')).holes[0].yards,433);
 assert.equal(storage.keys().some(k=>k.includes('scorecard')),false);
});
