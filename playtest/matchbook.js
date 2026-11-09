import {soloRange} from './solo-scorecard.js';

const HISTORY_KEY='dagger_matchbook_rounds_v1';
const validStroke=n=>Number.isInteger(n)&&n>=1&&n<=20;
const validPar=n=>Number.isInteger(n)&&n>=3&&n<=6;
const sum=values=>values.reduce((total,value)=>total+value,0);
const clean=value=>typeof value==='string'?value.replace(/\s+/g,' ').trim().slice(0,160):'';

function roundScope({course,tee},{start,end}){
 return JSON.stringify([course.provider,course.providerCourseId,tee.providerTeeId,tee.totalYards,start,end]);
}

export function soloMatchbook(active,card,scorecard){
 const selection=active?.selection;
 const {course,tee}=selection||{};
 if(!course||!tee||!Array.isArray(card?.scores)||card.scores.length!==18||
    card.identity!==course.providerCourseId+'|'+tee.providerTeeId+'|'+active.selectedAt)return null;
 const range=soloRange(card),{start,end}=range;
 const strokes=card.scores.slice(start-1,end);
 if(!strokes.every(validStroke))return null;
 const pars=strokes.map((_,i)=>scorecard?.holes?.find(h=>h.number===start+i)?.par);
 const relative=pars.every(validPar)?sum(strokes)-sum(pars):null;
 const best=relative===null?0:strokes.reduce((low,score,i)=>score-pars[i]<strokes[low]-pars[low]?i:low,0);
 return {roundId:card.identity,scope:roundScope(selection,range),strokes,selection,
  course:clean(course.name),tee:clean(tee.name),hole:start+best,
  headline:sum(strokes)+' strokes'+(relative===null?'':relative===0?' · Even par':' · '+(relative>0?'+':'')+relative+' to par'),
  highlight:relative===null?'Opened with '+strokes[0]+' strokes on No. '+start+'.':
   'Best against par · No. '+(start+best)+' in '+strokes[best]+' on a par '+pars[best]+'.'};
}

function readHistory(storage){
 const history=JSON.parse(storage.getItem(HISTORY_KEY)||'[]');
 if(!Array.isArray(history))throw Error('Invalid Matchbook history');
 return history;
}

export function saveMatchbookRound(storage,card){
 if(!card)return;
 try{
  const {roundId,scope,strokes}=card;
  const history=readHistory(storage).filter(row=>row?.roundId!==roundId||row.scope!==scope);
  history.unshift({roundId,scope,strokes});
  storage.setItem(HISTORY_KEY,JSON.stringify(history.slice(0,50)));
 }catch{/* Matchbook history is optional. */}
}

export function pastRoundTarget(storage,active,card){
 const range=soloRange(card),{start,end}=range;
 const scope=roundScope(active.selection,range);
 try{
  const prior=readHistory(storage).find(row=>row?.scope===scope&&row.roundId!==card.identity&&
   Array.isArray(row.strokes)&&row.strokes.length===end-start+1&&row.strokes.every(validStroke));
  if(!prior)return null;
  const deltas=card.scores.slice(start-1,end).flatMap((score,i)=>validStroke(score)?[score-prior.strokes[i]]:[]);
  return {holeStrokes:prior.strokes[card.hole-start],difference:sum(deltas),compared:deltas.length};
 }catch{return null;}
}

export function ghostMatchbook({holes,holesPlanned,opponent,selection}={}){
 if(![9,18].includes(holesPlanned)||!Array.isArray(holes)||!holes.length||holes.length>holesPlanned||
    !holes.every(h=>validStroke(h?.player)&&validStroke(h?.ghost)))return null;
 let lead=0;
 const leads=holes.map(h=>(lead+=Math.sign(h.ghost-h.player)));
 const remaining=holesPlanned-holes.length;
 if(remaining>0&&Math.abs(lead)<=remaining)return null;
 const winner=Math.sign(lead);
 let turning=-1;
 for(let i=1;i<leads.length;i++){
  if(Math.sign(leads[i-1])!==winner&&Math.sign(leads[i])===winner)turning=i;
 }
 const index=Math.max(0,turning),h=holes[index],rival=clean(opponent)||'House Ghost';
 return {course:clean(selection?.course?.name),tee:clean(selection?.tee?.name),selection,opponent:rival,
  played:holes.length,hole:index+1,
  headline:winner===0?'Match halved':(winner>0?'You won':rival+' won')+' · '+Math.abs(lead)+(remaining?' & '+remaining:' up'),
  highlight:(turning<0?'Opening hole':'Turning point')+' · No. '+(index+1)+'. You '+h.player+', '+rival+' '+h.ghost+'.'};
}

export function matchbookText(card){
 return ['DAGGER COUNTRY CLUB · THE MATCHBOOK',
  [card.course,card.tee&&card.tee+' tees'].filter(Boolean).join(' · '),
  card.opponent?'vs '+card.opponent+' · '+card.played+' holes played':'',
  card.headline,card.highlight,'As It Lies.'].filter(Boolean).join('\n');
}
