// A read-only, repeatable 19th Hole recap built entirely from recorded facts.
// No invented shots, player names, games, bets, or scorecard writes.
import {soloRange} from './solo-scorecard.js';

const validScore=v=>Number.isInteger(v)&&v>=1&&v<=15;
const validPar=v=>Number.isInteger(v)&&v>=3&&v<=6;
const tidy=(value,limit)=>typeof value==='string'?value.trim().slice(0,limit):'';
export function buildNineteenthRecap({active,card,scorecard,caddy='keith'}={}){
 const selection=active?.selection;
 if(!selection?.course?.providerCourseId||!selection?.tee?.providerTeeId||!Number.isSafeInteger(active.selectedAt))return null;
 const expected=[selection.course.providerCourseId,selection.tee.providerTeeId,active.selectedAt].join('|');
 if(!card||card.identity!==expected||!Array.isArray(card.scores)||card.scores.length!==18)return null;
 const {start,end}=soloRange(card);
 const holes=Array.isArray(scorecard?.holes)?scorecard.holes:[];
 const byNumber=new Map(holes.filter(h=>Number.isInteger(h?.number)&&h.number>=1&&h.number<=18&&validPar(h.par)).map(h=>[h.number,h]));
 const played=[];
 for(let number=start;number<=end;number++){
  const strokes=card.scores[number-1];if(!validScore(strokes))continue;
  const par=byNumber.get(number)?.par;
  played.push({number,strokes,par:validPar(par)?par:null});
 }
 const total=played.reduce((sum,h)=>sum+h.strokes,0);
 const complete=played.length===end-start+1;
 const known=played.filter(h=>h.par!==null);
 const relative=known.length===played.length?played.reduce((sum,h)=>sum+h.strokes-h.par,0):null;
 const birdies=known.filter(h=>h.strokes===h.par-1).length;
 const eagles=known.filter(h=>h.strokes<=h.par-2).length;
 const pars=known.filter(h=>h.strokes===h.par).length;
 const doubles=known.filter(h=>h.strokes>=h.par+2).length;
 const worst=known.slice().sort((a,b)=>(b.strokes-b.par)-(a.strokes-a.par)||a.number-b.number)[0]||null;
 const best=known.slice().sort((a,b)=>(a.strokes-a.par)-(b.strokes-b.par)||a.number-b.number)[0]||null;
 const name=({keith:'Keith',reginald:'Reginald',vinny:'Vinny',kyle:'Kyle'})[caddy]||'Your caddy';
 const course=tidy(selection.course.name,100)||'The course';
 const tee=tidy(selection.tee.name,50)||'Selected';
 const heading=complete?'The card is signed.':'An unfinished investigation.';
 const opening=complete
  ?name==='Vinny'?'The books are closed. The excuses remain open.'
   :name==='Reginald'?'An official examination of today’s sporting conduct.'
   :name==='Kyle'?'After-action report: all recorded strokes accounted for.'
   :'Eighteen holes of evidence, or nine if you knew when to quit.'
  :'The round is still underway. We only report the damage already recorded.';
 const lines=[
  course+' · '+tee+' tees · '+played.length+'/'+(end-start+1)+' holes scored.',
  played.length?total+' recorded strokes'+(relative!==null?' · '+(relative>0?'+':'')+relative+' to par.':'.'):'No strokes recorded yet.',
 ];
 if(known.length){
  lines.push(eagles+' eagle'+(eagles===1?'':'s')+' · '+birdies+' birdie'+(birdies===1?'':'s')+' · '+pars+' par'+(pars===1?'':'s')+' · '+doubles+' double bogey or worse.');
  if(best&&best.strokes<best.par)lines.push('Bright spot: Hole '+best.number+' ('+(best.strokes-best.par)+'). We have witnesses.');
  if(worst&&worst.strokes>=worst.par+2)lines.push('The hole that deserves a hearing: '+worst.number+' ('+(worst.strokes-worst.par)+' over par).');
 }
 if(played.length&&!complete)lines.push('No final verdict until the remaining holes are scored.');
 if(played.length===0)lines.push('No made-up highlights. Enter a score and the story writes itself.');
 return Object.freeze({course,tee,name,heading,opening,lines:Object.freeze(lines),complete,scored:played.length,expected:end-start+1,relative,total,knownParHoles:known.length,text:['DAGGER COUNTRY CLUB · THE 19TH HOLE',heading,opening,...lines,'— '+name+', Dagger Country Club'].join('\n')});
}
