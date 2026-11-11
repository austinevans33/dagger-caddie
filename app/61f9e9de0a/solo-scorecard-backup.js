// Human-readable, read-only backup of the player's local paper scorecard.
// Never touches Money Room, wagers, Ghost, or Firestore.
import {soloRange,summarizeSoloCard} from './solo-scorecard.js';
export function formatSoloScorecardBackup(active,card,scorecard){
 if(!active?.selection||!card||!Array.isArray(card.scores)||card.scores.length!==18)return null;
 const {course,tee}=active.selection;
 if(!course?.name||!tee?.name)return null;
 const {start,end}=soloRange(card);
 const verified=new Map();
 for(const hole of Array.isArray(scorecard?.holes)?scorecard.holes:[]){
  if(Number.isInteger(hole?.number)&&hole.number>=1&&hole.number<=18&&
     Number.isInteger(hole.par)&&hole.par>=3&&hole.par<=6&&
     Number.isInteger(hole.yards)&&hole.yards>=50&&hole.yards<=800)
   verified.set(hole.number,hole);
 }
 const pars=Array.from({length:18},(_,i)=>verified.get(i+1)?.par??null);
 const summary=summarizeSoloCard(card,pars);
 const lines=[
  'DAGGER COUNTRY CLUB — ROUND CARD',
  String(course.name)+' · '+String(tee.name)+' tees',
  (card.length===9?'9':'18')+'-hole round · '+(start===10?'Back nine':'Starting hole '+start),
  'HOLE | PAR | TEE YDS | STROKES'
 ];
 for(let n=start;n<=end;n++){
  const h=verified.get(n),score=card.scores[n-1];
  lines.push([String(n).padStart(2,'0'),h?String(h.par):'—',
   h?String(h.yards):'—',Number.isInteger(score)?String(score):'—'].join(' | '));
 }
 lines.push('STROKES: '+summary.total+' ('+summary.count+'/'+summary.length+' holes scored)');
 if(summary.relativeToPar!==null)lines.push('TO VERIFIED PAR: '+(summary.relativeToPar>0?'+':'')+summary.relativeToPar);
 lines.push('— indicates not entered or provider information unavailable.');
 lines.push('Tee yardages are not live pin distances. Saved locally in Dagger.');
 return lines.join('\n');
}
