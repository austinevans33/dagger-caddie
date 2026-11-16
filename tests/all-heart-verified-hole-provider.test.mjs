import test from 'node:test';
import assert from 'node:assert/strict';
import {verifiedAllHeartHoleFromRound} from '../playtest/all-heart-verified-hole-provider.js';
import {BAYONET_COURSE_ID} from '../playtest/bayonet-verified-scorecard.js';
import {ACTIVE_ROUND_KEY} from '../playtest/starters-desk-session.js';
import {SOLO_CARD_KEY} from '../playtest/solo-scorecard.js';
function fixture(courseId=BAYONET_COURSE_ID,teeName='Regular / White',totalYards=5752){
 const course={provider:'opengolfapi',providerCourseId:courseId,name:'Bayonet at Puppy Creek',region:'NC'};
 const tee={providerTeeId:'white',name:teeName,totalYards};
 const selectedAt=12345;
 const identity=course.providerCourseId+'|'+tee.providerTeeId+'|'+selectedAt;
 const values={
 [ACTIVE_ROUND_KEY]:JSON.stringify({version:1,selectedAt,selection:{course,tee,holeNumber:1}}),
 [SOLO_CARD_KEY]:JSON.stringify({version:1,identity,hole:1,scores:Array(18).fill(null),length:18})
 };
 return {getItem:k=>values[k]??null};
}
test('audited Bayonet hole 1 par and stroke index are sourced',()=>{
 const hole=verifiedAllHeartHoleFromRound(fixture());
 assert.equal(hole.holeNumber,1);
 assert.equal(hole.par,5);
 assert.equal(hole.strokeIndex,7);
 assert.equal(hole.provenance,'bayonet-club-scorecard');
});
test('rejects unknown course and tee mismatch',()=>{
 assert.equal(verifiedAllHeartHoleFromRound(fixture('unknown')),null);
 assert.equal(verifiedAllHeartHoleFromRound(fixture(BAYONET_COURSE_ID,'Blue',5752)),null);
});
