import {readActiveRound} from './starters-desk-session.js';
import {readRoundScoreSnapshot} from './round-score-snapshot.js';
import {bayonetVerifiedScorecard} from './bayonet-verified-scorecard.js';

import {founderVerifiedScorecard} from './founders-verified-scorecards.js';

function pilotFounderCard(selection){
 const id=selection.course.providerCourseId;
 if(id==="kings-grant-fayetteville-nc"||(id==="quail-ridge-sanford-nc"&&selection.tee.providerTeeId==="black")){
  return founderVerifiedScorecard(selection);
 }
 return null;
}
export function verifiedAllHeartHoleFromRound(storage){
 const round=readActiveRound(storage);
 const score=readRoundScoreSnapshot(storage);
 if(!round||!score)return null;
 const card=bayonetVerifiedScorecard(round.selection)??pilotFounderCard(round.selection);
 if(!card)return null;
 const hole=card.holes[score.activeHole-1];
 if(!hole||hole.number!==score.activeHole)return null;
 return Object.freeze({
  verified:true,courseId:round.selection.course.providerCourseId,
  holeNumber:hole.number,par:hole.par,strokeIndex:hole.handicapMen,
  provenance:card.source
 });
}
export function emitVerifiedAllHeartHole(doc,storage){
 const hole=verifiedAllHeartHoleFromRound(storage);
 if(!hole||!doc?.dispatchEvent)return false;
 doc.dispatchEvent(new CustomEvent('dcc:verified-hole-context',{detail:hole}));
 return true;
}
