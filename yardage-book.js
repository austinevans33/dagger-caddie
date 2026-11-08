// Pure 18-hole yardage-book view model: no guessed course facts or score mutations.
import {normalizeHole} from './course-weather-context.js';
export function yardageBookPage({holes=[],holeNumber=1,courseName='Selected course',teeName='Selected tees'}={}){
 if(!Array.isArray(holes)||!Number.isInteger(holeNumber)||holeNumber<1||holeNumber>18)throw Error('Invalid yardage book selection');
 const valid=new Map();
 for(const raw of holes){const hole=normalizeHole(raw);if(hole&&!valid.has(hole.number))valid.set(hole.number,hole);}
 const hole=valid.get(holeNumber)||null;
 return Object.freeze({
  courseName:String(courseName).slice(0,160),teeName:String(teeName).slice(0,60),
  holeNumber,hole,verified:!!hole,
  displayPar:hole?String(hole.par):'Not verified',
  displayYards:hole?String(hole.yards):'Not verified',
  hazards:hole?.hazards||[],
  previousHole:holeNumber>1?holeNumber-1:null,nextHole:holeNumber<18?holeNumber+1:null,
  verifiedHoleCount:valid.size
 });
}
