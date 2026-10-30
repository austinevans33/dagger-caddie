// Independent solo scorecard. Never writes wagers, Ghost matches or money rooms.
import {readActiveRound} from './starters-desk-session.js';
export const SOLO_CARD_KEY='dcc_solo_scorecard_v1';
const validScore=n=>Number.isInteger(n)&&n>=1&&n<=15;
export function readSoloCard(storage){
 try{const x=JSON.parse(storage.getItem(SOLO_CARD_KEY)||'null');if(x?.version!==1||!Array.isArray(x.scores)||x.scores.length!==18||x.scores.some(n=>n!==null&&!validScore(n))||!Number.isInteger(x.hole)||x.hole<1||x.hole>18)return null;return x;}catch{return null;}
}
export function startSoloCard(storage){
 const round=readActiveRound(storage);if(!round)return null;
 const old=readSoloCard(storage);
 const identity=round.selection.course.providerCourseId+'|'+round.selection.tee.providerTeeId+'|'+round.selectedAt;
 if(old?.identity===identity)return old;
 const card={version:1,identity,hole:round.selection.holeNumber,scores:Array(18).fill(null)};
 try{storage.setItem(SOLO_CARD_KEY,JSON.stringify(card));return card;}catch{return null;}
}
export function saveSoloScore(storage,score){
 const card=startSoloCard(storage);if(!card||!validScore(score))return null;
 const next={...card,scores:[...card.scores]};next.scores[next.hole-1]=score;
 if(next.hole<18)next.hole++;
 try{storage.setItem(SOLO_CARD_KEY,JSON.stringify(next));return next;}catch{return null;}
}
export function setSoloHole(storage,hole){
 const card=startSoloCard(storage);if(!card||!Number.isInteger(hole)||hole<1||hole>18)return null;
 const next={...card,hole};try{storage.setItem(SOLO_CARD_KEY,JSON.stringify(next));return next;}catch{return null;}
}
