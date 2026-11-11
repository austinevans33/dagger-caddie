// Read-only single-score snapshot for future game/ledger consumers.
// No wagers, multiplayer sessions, Firestore, or solo card writes.
import {readActiveRound} from './starters-desk-session.js';
import {readSoloCard} from './solo-scorecard.js';
export function readRoundScoreSnapshot(storage){
 const round=readActiveRound(storage),card=readSoloCard(storage);
 if(!round||!card)return null;
 const selection=round.selection;
 if(!selection?.course?.providerCourseId||!selection?.tee?.providerTeeId||!Number.isFinite(round.selectedAt))return null;
 const identity=selection.course.providerCourseId+'|'+selection.tee.providerTeeId+'|'+round.selectedAt;
 if(card.identity!==identity)return null;
 const scores=Object.freeze(card.scores.map(value=>Number.isInteger(value)&&value>=1&&value<=15?value:null));
 const completedHoles=Object.freeze(scores.flatMap((value,index)=>value===null?[]:[index+1]));
 const total=scores.reduce((sum,n)=>sum+(n??0),0);
 return Object.freeze({
  version:1,
  identity,
  courseName:selection.course.name||'Selected course',
  teeName:selection.tee.name||'Selected tees',
  activeHole:card.hole,
  scores,
  completedHoles,
  completedCount:completedHoles.length,
  totalStrokes:total,
  complete:completedHoles.length===18,
  source:'solo-scorecard',
  maySettleWagers:false
 });
}
export function compareRoundScoreSnapshots(before,after){
 if(!before||!after||before.identity!==after.identity)return Object.freeze({kind:'different-round',changes:Object.freeze([])});
 const changes=Object.freeze(after.scores.flatMap((score,index)=>score===before.scores[index]?[]:[Object.freeze({hole:index+1,before:before.scores[index],after:score})]));
 return Object.freeze({kind:changes.length?'updated':'unchanged',changes});
}
