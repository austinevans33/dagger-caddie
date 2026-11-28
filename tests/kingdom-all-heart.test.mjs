import test from 'node:test';
import assert from 'node:assert/strict';
import {founderCatalogRecords,founderTeesForCourse,founderVerifiedScorecard} from '../app/61f9e9de0a/founders-verified-scorecards.js';
import {readActiveRound,saveActiveRound} from '../app/61f9e9de0a/starters-desk-session.js';
import {startSoloCard,setSoloHole,saveSoloScore} from '../app/61f9e9de0a/solo-scorecard.js';
import {allHeartRoundOffer,respondToAllHeart,completeAllHeartHole,allHeartClubRecord,ALL_HEART_DISABLED} from '../app/61f9e9de0a/all-heart-journal.js';
import {saveMatchbookRound,soloMatchbook} from '../app/61f9e9de0a/matchbook.js';
import {chooseAllHeartMoment} from '../app/61f9e9de0a/all-heart-moments.js';

const [course]=founderCatalogRecords('Shining Rock');
const [tee]=founderTeesForCourse(course);
const scorecard=founderVerifiedScorecard({course,tee});
function memory(){
 const map=new Map();
 return {getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value)};
}
function setup(holeNumber, id=1700000000000, storage=memory()){
 assert(saveActiveRound(storage,{course,tee,holeNumber},id));
 const active=readActiveRound(storage);
 return {storage,active,card:startSoloCard(storage)};
}
const force={gate:()=>true}; // Development-only injection; production uses the normal gate.

test('verified Dare persists acceptance, survives reload and uses the normal score once',()=>{
 const {storage,active,card}=setup(17);
 const offer=allHeartRoundOffer(storage,active,card,force);
 assert.equal(offer.moment.type,'dare');
 assert.equal(offer.moment.targetStrokes,4);
 assert.equal(allHeartRoundOffer(storage,active,startSoloCard(storage),{gate:()=>false}).moment.key,offer.moment.key);
 assert(respondToAllHeart(storage,card,offer,true));
 assert.equal(allHeartRoundOffer(storage,active,card,force).state,'accepted');
 assert(!respondToAllHeart(storage,card,offer,true));
 const next=saveSoloScore(storage,4);
 assert.equal(completeAllHeartHole(storage,next,17).outcome,'matched');
 completeAllHeartHole(storage,next,17);
 assert.equal(allHeartClubRecord(storage).length,1);
 assert.equal(storage.getItem('dcc_side_bets_local_r66_v1'),null);
});

test('a same-tee completed Ghost supplies a Grudge for its physical hole',()=>{
 const {storage,active,card}=setup(1);
 storage.setItem('dcc_house_ghost_archive_v1',JSON.stringify([{
  course:JSON.stringify({selection:{course,tee}}),
  result:{status:'Completed'},
  holes:[{holeNumber:18,ghost:3},{holeNumber:1,ghost:5}],
 }]));
 const offer=allHeartRoundOffer(storage,active,card,force);
 assert.equal(offer.moment.title,'BEAT YOUR GHOST');
 assert.equal(offer.moment.targetStrokes,5);
 assert(respondToAllHeart(storage,card,offer,false));
 assert.equal(allHeartRoundOffer(storage,active,card,force),null);
});

test('Club Legends uses a real saved round on the same course and tee',()=>{
 const first=setup(1);
 let prior=first.card;
 for(let i=0;i<18;i++)prior=saveSoloScore(first.storage,4);
 saveMatchbookRound(first.storage,soloMatchbook(first.active,prior,scorecard));
 const next=setup(1,first.active.selectedAt+1,first.storage);
 const offer=allHeartRoundOffer(next.storage,next.active,next.card,force);
 assert.equal(offer.moment.title,'CLUB LEGENDS');
 assert.equal(offer.moment.targetStrokes,4);
 assert(respondToAllHeart(next.storage,next.card,offer,true));
 assert.equal(completeAllHeartHole(next.storage,saveSoloScore(next.storage,3),1).outcome,'beat');
 const later=setSoloHole(next.storage,10);
 assert.notEqual(allHeartRoundOffer(next.storage,next.active,later,force)?.moment.title,'CLUB LEGENDS');
});

test('the documented Legend adaptation uses the previous played hole across wraparound',()=>{
 const {storage,active}=setup(18);
 saveSoloScore(storage,4); // No. 18 par.
 saveSoloScore(storage,4); // No. 1 par.
 const card=saveSoloScore(storage,5); // Bogey the No. 2 par 4.
 assert.equal(card.hole,3);
 const offer=allHeartRoundOffer(storage,active,card,force);
 assert.equal(offer.moment.type,'legend');
 assert.match(offer.moment.description,/Royal Birkdale/);
 assert.equal(offer.moment.targetStrokes,4);
 assert(respondToAllHeart(storage,card,offer,true));
 assert.equal(completeAllHeartHole(storage,saveSoloScore(storage,5),3).outcome,'missed');
});

test('exact-hole Legend requires source-backed facts and rejects another hole',()=>{
 const context={courseId:'source-course',holeNumber:3,par:4,roundActive:true};
 const historicalChallenge={courseId:'source-course',holeNumber:3,verified:true,
  player:'Jordan Spieth',event:'The 2017 Open',strokes:3,sourceUrl:'https://thejourney.theopen.com/2017'};
 assert.equal(chooseAllHeartMoment({...context,historicalChallenge}).targetStrokes,3);
 assert.equal(chooseAllHeartMoment({...context,historicalChallenge:{...historicalChallenge,holeNumber:4}}),null);
});

test('complete simulated scorecard rounds see occasional natural offers and a strict per-round cap',t=>{
 let roundsWithOffers=0,total=0;
 for(let i=0;i<240;i++){
  const {storage,active}=setup(i%2?10:1,1700000000000+i);
  let card=startSoloCard(storage),offered=0,last=-5;
  for(let pos=0;pos<18;pos++){
   const offer=allHeartRoundOffer(storage,active,card);
   if(offer){
    assert(pos-last>4);
    assert(respondToAllHeart(storage,card,offer,true));
    assert.equal(allHeartRoundOffer(storage,active,card).state,'accepted');
    offered++;last=pos;
   }
   const physical=card.hole;
   card=saveSoloScore(storage,scorecard.holes[physical-1].par+(pos%3===0?1:0));
   if(offer)assert(completeAllHeartHole(storage,card,physical));
  }
  assert(offered<=2);
  if(offered)roundsWithOffers++;
  total+=offered;
 }
 t.diagnostic(roundsWithOffers+'/240 rounds saw '+total+' offers');
 assert(roundsWithOffers>=120&&roundsWithOffers<225);
});

test('the opt-out holds even when the test draw is forced',()=>{
 const {storage,active,card}=setup(17);
 storage.setItem(ALL_HEART_DISABLED,'true');
 assert.equal(allHeartRoundOffer(storage,active,card,force),null);
});

test('reopening the scorecard repairs a missed receipt after the score was saved',async()=>{
 const {reconcileAllHeartScores}=await import('../app/61f9e9de0a/all-heart-journal.js');
 const {storage,active,card}=setup(17);
 const offer=allHeartRoundOffer(storage,active,card,force);
 assert(respondToAllHeart(storage,card,offer,true));
 const saved=saveSoloScore(storage,4);
 assert.equal(allHeartClubRecord(storage).length,0);
 reconcileAllHeartScores(storage,saved);
 reconcileAllHeartScores(storage,saved);
 assert.equal(allHeartClubRecord(storage).length,1);
 assert.equal(allHeartClubRecord(storage)[0].receipt.outcome,'matched');
});

test('the actual Sawgrass 17 scorecard offers and records the sourced Tiger Woods Legend', () => {
  const storage = memory();
  const [sawgrass] = founderCatalogRecords('TPC Sawgrass');
  const [selectedTee] = founderTeesForCourse(sawgrass);
  assert(saveActiveRound(storage,{course:sawgrass, tee:selectedTee, holeNumber:17},1700000000200));
  const active = readActiveRound(storage), card = startSoloCard(storage);
  const offer = allHeartRoundOffer(storage,active,card,force);
  assert.equal(offer.moment.type,'legend');
  assert.match(offer.moment.description,/Tiger Woods made 2 here/);
  assert.match(offer.moment.sourceUrl,/pgatour\.com/);
  assert.equal(offer.moment.targetStrokes,2);
  assert(respondToAllHeart(storage,card,offer,true));
  assert.equal(completeAllHeartHole(storage,saveSoloScore(storage,2),17).outcome,'matched');
  assert.equal(allHeartClubRecord(storage)[0].hole,17);
  assert.notEqual(allHeartRoundOffer(storage,active,setSoloHole(storage,18),force)?.moment.sourceUrl,offer.moment.sourceUrl);
});
