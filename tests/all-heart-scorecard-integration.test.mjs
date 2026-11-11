import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAllHeartRoundDetail} from '../playtest/all-heart-scorecard-context.js';
import {ACTIVE_ROUND_KEY} from '../playtest/starters-desk-session.js';
import {SOLO_CARD_KEY} from '../playtest/solo-scorecard.js';
function storage({hole=6,length=18,nineStart,scoreAll=false}={}){
 const course={provider:'verified',providerCourseId:'kings-grant-fayetteville-nc',name:'Kings Grant',region:'NC'};
 const tee={providerTeeId:'white',name:'White',totalYards:6000};
 const selectedAt=123456789;
 const identity=course.providerCourseId+'|'+tee.providerTeeId+'|'+selectedAt;
 const round={version:1,selectedAt,selection:{course,tee,holeNumber:hole}};
 const scores=Array(18).fill(null);
 if(scoreAll){const start=length===9&&nineStart===10?9:0;for(let i=start;i<start+(length===9?9:18);i++)scores[i]=4}
 const card={version:1,identity,hole,scores,length,...(nineStart?{nineStart}:{})};
 const map={[ACTIVE_ROUND_KEY]:JSON.stringify(round),[SOLO_CARD_KEY]:JSON.stringify(card)};
 return {getItem:key=>map[key]??null};
}
const hole={verified:true,courseId:'kings-grant-fayetteville-nc',holeNumber:6,par:4,strokeIndex:14};
test('verified live scorecard yields read-only challenge context',()=>{
 const detail=buildAllHeartRoundDetail(storage(),hole);
 assert.equal(detail.context.verifiedCourse,true);
 assert.equal(detail.context.moneyRoomPlayers,0);
 assert.equal(detail.context.ghostRival,null);
 assert.equal(detail.context.historicalChallenge,null);
});
test('rejects wrong course and wrong hole',()=>{
 assert.equal(buildAllHeartRoundDetail(storage(),{...hole,courseId:'other'}),null);
 assert.equal(buildAllHeartRoundDetail(storage(),{...hole,holeNumber:7}),null);
});
test('respects native nine-hole range and completion',()=>{
 assert.equal(buildAllHeartRoundDetail(storage({hole:6,length:9,scoreAll:true}),hole),null);
 assert.equal(buildAllHeartRoundDetail(storage({hole:10,length:9,nineStart:10}),{...hole,holeNumber:10}),null); // missing verified index
 const back={...hole,holeNumber:10,strokeIndex:14};
 assert.equal(buildAllHeartRoundDetail(storage({hole:10,length:9,nineStart:10}),back).context.holeNumber,10);
});
