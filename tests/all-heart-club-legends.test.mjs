import test from 'node:test';
import assert from 'node:assert/strict';
import {founderCatalogRecords,founderTeesForCourse} from '../playtest/founders-verified-scorecards.js';
import {saveActiveRound,readActiveRound} from '../playtest/starters-desk-session.js';
import {startSoloCard,saveSoloScore,setSoloHole} from '../playtest/solo-scorecard.js';
import {verifiedAllHeartHoleFromRound} from '../playtest/all-heart-verified-hole-provider.js';
import {buildAllHeartRoundDetail} from '../playtest/all-heart-scorecard-context.js';
import {chooseAllHeartMoment} from '../playtest/all-heart-moments.js';
import {saveMatchbookRound,soloMatchbook} from '../playtest/matchbook.js';
import {acceptClubLegend,clubLegendOffered,clubLegendReceipts,offerClubLegend} from '../playtest/club-legends.js';

function fixture(name,teeId){
 const data=new Map();
 const storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
 const course=founderCatalogRecords(name)[0],tee=founderTeesForCourse(course).find(row=>row.providerTeeId===teeId);
 const selection={course,tee,holeNumber:1};
 saveActiveRound(storage,selection,100);
 startSoloCard(storage);
 return {storage,selection};
}

test('pilot verifies King’s Grant and Quail Ridge Black and excludes unverified Quail tees',()=>{
 assert.equal(verifiedAllHeartHoleFromRound(fixture('Kings Grant','blue').storage)?.provenance,'kings-grant-club-scorecard');
 assert.equal(verifiedAllHeartHoleFromRound(fixture('Quail Ridge','black').storage)?.provenance,'quail-ridge-sanford-black-card');
 assert.equal(verifiedAllHeartHoleFromRound(fixture('Quail Ridge','white').storage),null);
});

test('normal score resolves an accepted saved target with one offer across reloads',()=>{
 const {storage,selection}=fixture('Quail Ridge','black');
 const history=startSoloCard(storage);
 saveMatchbookRound(storage,soloMatchbook(readActiveRound(storage),{...history,scores:Array(18).fill(5)}));
 saveActiveRound(storage,selection,200);
 const active=startSoloCard(storage);
 setSoloHole(storage,2);
 const hole=verifiedAllHeartHoleFromRound(storage);
 const detail=buildAllHeartRoundDetail(storage,hole);
 const moment=chooseAllHeartMoment(detail.context);
 assert.equal(moment.title,'CLUB LEGENDS');
 assert.equal(moment.targetStrokes,5);
 assert(offerClubLegend(storage,active.identity,moment));
 assert(clubLegendOffered(storage,active.identity));
 assert.equal(offerClubLegend(storage,active.identity,moment),false);
 assert.equal(buildAllHeartRoundDetail(storage,hole).context.ghostRival,null);
 assert.deepEqual(clubLegendReceipts(storage,active),[]);
 acceptClubLegend(storage,active.identity,{...moment,targetStrokes:3});
 const saved=saveSoloScore(storage,4);
 const [receipt]=clubLegendReceipts(storage,saved);
 assert.equal(receipt.targetStrokes,5);
 assert.equal(receipt.outcome,'beat');
 setSoloHole(storage,2);
 assert.equal(clubLegendReceipts(storage,saveSoloScore(storage,5))[0].outcome,'matched');
});

test('verified Open facts stay separate from adapted targets, with no offer before a qualifying score',()=>{
 const {storage}=fixture('Quail Ridge','black');
 setSoloHole(storage,3);
 const context=()=>buildAllHeartRoundDetail(storage,verifiedAllHeartHoleFromRound(storage)).context;
 assert.equal(chooseAllHeartMoment(context()),null);
 setSoloHole(storage,2);
 saveSoloScore(storage,5);
 let moment=chooseAllHeartMoment(context());
 assert.equal(moment.targetStrokes,3);
 assert.match(moment.description,/Royal Birkdale.*Your adapted challenge/);
 assert.equal(moment.sourceUrl,'https://thejourney.theopen.com/2017');
 setSoloHole(storage,13);
 saveSoloScore(storage,4);
 moment=chooseAllHeartMoment(context());
 assert.equal(moment.targetStrokes,4);
 assert.match(moment.description,/eagled No. 15.*birdie or better/);
});
