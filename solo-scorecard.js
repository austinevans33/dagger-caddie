// Independent solo scorecard. Never writes wagers, Ghost matches or money rooms.
import {readActiveRound} from './starters-desk-session.js';
export const SOLO_CARD_KEY='dcc_solo_scorecard_v1';
const validScore=n=>Number.isInteger(n)&&n>=1&&n<=15;
export function soloRange(card){
 const start=card?.length===9&&card.nineStart===10?10:1;
 return {start,end:card?.length===9?start+8:18};
}
export function readSoloCard(storage){
 try{const x=JSON.parse(storage.getItem(SOLO_CARD_KEY)||'null');if(x?.version!==1||!Array.isArray(x.scores)||x.scores.length!==18||x.scores.some(n=>n!==null&&!validScore(n))||!Number.isInteger(x.hole)||x.hole<1||x.hole>18||![undefined,9,18].includes(x.length)||![undefined,1,10].includes(x.nineStart))return null;return x;}catch{return null;}
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
 if(next.hole<soloRange(card).end)next.hole++;
 try{storage.setItem(SOLO_CARD_KEY,JSON.stringify(next));return next;}catch{return null;}
}
export function setSoloHole(storage,hole){
 const card=startSoloCard(storage);if(!card||!Number.isInteger(hole)||hole<soloRange(card).start||hole>soloRange(card).end)return null;
 const next={...card,hole};try{storage.setItem(SOLO_CARD_KEY,JSON.stringify(next));return next;}catch{return null;}
}

export function setSoloLength(storage,length){
 const old=startSoloCard(storage);
 if(!old||![9,18].includes(length))return null;
 // Enter nine-hole mode on the currently selected nine; keep all 18 saved scores.
 const nineStart=length===9&&old.length!==9?(old.hole>=10?10:1):(old.nineStart??1);
 const range=soloRange({length,nineStart});
 const next={...old,length,nineStart,hole:Math.max(range.start,Math.min(old.hole,range.end))};
 try{storage.setItem(SOLO_CARD_KEY,JSON.stringify(next));return next;}catch{return null;}
}
export function summarizeSoloCard(card,pars=[]){
 if(!card)return null;
 const length=card.length===9?9:18;
 const {start,end}=soloRange(card);
 const scored=card.scores.slice(start-1,end);
 pars=pars.slice(start-1,end);
 const count=scored.filter(Number.isInteger).length;
 const total=scored.reduce((sum,n)=>sum+(Number.isInteger(n)?n:0),0);
 const validPar=scored.every((n,i)=>!Number.isInteger(n)||(Number.isInteger(pars[i])&&pars[i]>=3&&pars[i]<=6));
 const parForScored=validPar?scored.reduce((sum,n,i)=>sum+(Number.isInteger(n)?pars[i]:0),0):null;
 const front=scored.slice(0,9),back=scored.slice(9);
 const sum=a=>a.reduce((v,n)=>v+(Number.isInteger(n)?n:0),0);
 return {length,count,total,front:sum(front),back:length===18?sum(back):null,
  relativeToPar:parForScored===null?null:total-parForScored,
  complete:count===length,
  turnComplete:length===18&&front.every(Number.isInteger),
  best:validPar?scored.flatMap((n,i)=>Number.isInteger(n)?[{hole:start+i,toPar:n-pars[i]}]:[]).sort((a,b)=>a.toPar-b.toPar)[0]||null:null};
}
