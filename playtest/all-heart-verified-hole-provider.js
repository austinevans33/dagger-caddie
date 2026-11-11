import {readActiveRound} from './starters-desk-session.js';
import {readRoundScoreSnapshot} from './round-score-snapshot.js';
import {bayonetVerifiedScorecard} from './bayonet-verified-scorecard.js';

// The first automatic All Heart source is Bayonet's audited scorecard.
// It verifies par and men's stroke index, NOT map geometry or live pin.
export function verifiedAllHeartHoleFromRound(storage){
 const round=readActiveRound(storage);
 const score=readRoundScoreSnapshot(storage);
 if(!round||!score)return null;
 const card=bayonetVerifiedScorecard(round.selection);
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
