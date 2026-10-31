// Independent solo scorecard. Never writes wagers, Ghost matches or money rooms.
import {readActiveRound} from './starters-desk-session.js';
export const SOLO_CARD_KEY='dcc_solo_scorecard_v1';
const validScore=n=>Number.isInteger(n)&&n>=1&&n<=15;
export function readSoloCard(storage){
 try{const x=JSON.parse(storage.getItem(SOLO_CARD_KEY)||'null');if(x?.version!==1||!Array.isArray(x.scores)||x.scores.length!==18||x.scores.some(n=>n!==null&&!validScore(n))||!Number.isInteger(x.hole)||x.hole<1||x.hole>18||![undefined,9,18].includes(x.length))return null;return x;}catch{return null;}
}
export function startSoloCard(storage){
 const round=readActiveRound(storage);if(!round)return null;
 const old=readSoloCard(storage);
 const identity=round.selection.course.providerCourseId+'|'+round.selection.tee.providerTeeId+'|'+round.selectedAt;
 if(old?.identity===identity)return old;
 const card={version:1,identity,hole:round.selection.holeNumber,scores:Array(18).fill(null),length:18};
 try{storage.setItem(SOLO_CARD_KEY,JSON.stringify(card));return card;}catch{return null;}
}
export function saveSoloScore(storage,score){
 const card=startSoloCard(storage);if(!card||!validScore(score))return null;
 const next={...card,scores:[...card.scores]};next.scores[next.hole-1]=score;
 if(next.hole<(card.length===9?9:18))next.hole++;
 try{storage.setItem(SOLO_CARD_KEY,JSON.stringify(next));return next;}catch{return null;}
}
export function setSoloHole(storage,hole){
 const card=startSoloCard(storage);if(!card||!Number.isInteger(hole)||hole<1||hole>18)return null;
 const next={...card,hole};try{storage.setItem(SOLO_CARD_KEY,JSON.stringify(next));return next;}catch{return null;}
}

export function setSoloLength(storage,length){
 const old=startSoloCard(storage);
 if(!old||![9,18].includes(length))return null;
 const next={...old,length,hole:Math.min(old.hole,length)};
 try{storage.setItem(SOLO_CARD_KEY,JSON.stringify(next));return next;}catch{return null;}
}
export function summarizeSoloCard(card,pars=[]){
 if(!card)return null;
 const length=card.length===9?9:18;
 const scored=card.scores.slice(0,length);
 const count=scored.filter(Number.isInteger).length;
 const total=scored.reduce((sum,n)=>sum+(Number.isInteger(n)?n:0),0);
 const validPar=scored.every((n,i)=>!Number.isInteger(n)||(Number.isInteger(pars[i])&&pars[i]>=3&&pars[i]<=6));
 const parForScored=validPar?scored.reduce((sum,n,i)=>sum+(Number.isInteger(n)?pars[i]:0),0):null;
 const front=scored.slice(0,9),back=scored.slice(9);
 const sum=a=>a.reduce((v,n)=>v+(Number.isInteger(n)?n:0),0);
 return {length,count,total,front:sum(front),back:length===18?sum(back):null,
  relativeToPar:parForScored===null?null:total-parForScored,
  complete:count===length,
  turnComplete:front.every(Number.isInteger),
  best:validPar?scored.flatMap((n,i)=>Number.isInteger(n)?[{hole:i+1,toPar:n-pars[i]}]:[]).sort((a,b)=>a.toPar-b.toPar)[0]||null:null};
}
