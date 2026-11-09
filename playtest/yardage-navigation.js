// Course-aware Yardage Book navigation. UI-only; never writes round scores or wagers.
import {readActiveRound} from './starters-desk-session.js';
export const YARDAGE_HOLE_KEY='dccFridayYardageHole';
export const YARDAGE_SELECTION_KEY='dccYardageSelectionKey_v1';
export function yardageHoleRange(holeCount,nine){
 if(holeCount===9||nine==='front')return {start:1,end:9};
 if(nine==='back')return {start:10,end:18};
 return {start:1,end:18};
}
function validHole(n){const value=Number(n);return Number.isInteger(value)&&value>=1&&value<=18?value:null;}
export function yardageSelectionKey(selection){
 const c=selection?.course,t=selection?.tee;
 if(!c?.provider||!c.providerCourseId||!t?.providerTeeId)return null;
 return [c.provider,c.providerCourseId,t.providerTeeId].join('|');
}
export function readYardageHole({session,local}={}){
 const active=readActiveRound(local)?.selection;
 const identity=yardageSelectionKey(active);
 const fromRound=validHole(active?.holeNumber)||1;
 try{
  const known=session.getItem(YARDAGE_SELECTION_KEY);
  const stored=validHole(session.getItem(YARDAGE_HOLE_KEY));
  // Existing installations only had a hole key, not a selection key:
  // preserve it until a course-and-tee selection exists.
  if(!identity)return stored||fromRound;
  if(known===identity)return stored||fromRound;
  if(known===null&&stored===null)return fromRound;
  if(known===null)return fromRound; // prevent stale hole from a different course
  return fromRound;
 }catch{return fromRound}
}
export function saveYardageHole({session,local,hole}={}){
 const n=validHole(hole);
 if(!n)return false;
 const identity=yardageSelectionKey(readActiveRound(local)?.selection);
 try{
  session.setItem(YARDAGE_HOLE_KEY,String(n));
  if(identity)session.setItem(YARDAGE_SELECTION_KEY,identity);
  else session.removeItem(YARDAGE_SELECTION_KEY);
  return true;
 }catch{return false}
}
