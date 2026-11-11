import {readRoundScoreSnapshot} from './round-score-snapshot.js';
import {readActiveRound} from './starters-desk-session.js';
import {readSoloCard,soloRange} from './solo-scorecard.js';

// Bridge the real solo scorecard to All Heart only when a course-data provider
// independently certifies this exact hole and its par/stroke index.
// Never infer verified geometry, history, rivals, or multiplayer attendance.
export function buildAllHeartRoundDetail(storage,verifiedHole){
 const round=readRoundScoreSnapshot(storage);
 const selection=readActiveRound(storage)?.selection;
 const card=readSoloCard(storage);
 if(!round || !selection || !card || !verifiedHole || verifiedHole.verified!==true)return null;
 const range=soloRange(card);
 if(card.scores.slice(range.start-1,range.end).every(Number.isInteger))return null;
 const hole=round.activeHole;
 if(hole<range.start||hole>range.end)return null;
 if(!Number.isInteger(hole)||hole<1||hole>18||verifiedHole.holeNumber!==hole)return null;
 if(verifiedHole.courseId!==selection.course.providerCourseId)return null;
 if(![3,4,5].includes(verifiedHole.par))return null;
 if(!Number.isInteger(verifiedHole.strokeIndex)||verifiedHole.strokeIndex<1||verifiedHole.strokeIndex>18)return null;
 return {
  roundKey:round.identity,
  context:{
   courseId:verifiedHole.courseId,holeNumber:hole,par:verifiedHole.par,
   strokeIndex:verifiedHole.strokeIndex,verifiedCourse:true,roundActive:true,
   // These are deliberately absent until authoritative live sources exist.
   moneyRoomPlayers:0,ghostRival:null,historicalChallenge:null
  }
 };
}
export function emitAllHeartRoundDetail(doc,storage,verifiedHole){
 const detail=buildAllHeartRoundDetail(storage,verifiedHole);
 if(!detail||!doc?.dispatchEvent)return false;
 doc.dispatchEvent(new CustomEvent('dcc:all-heart-context',{detail}));
 return true;
}
