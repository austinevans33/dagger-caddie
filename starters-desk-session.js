// Starter's Desk — local active-round selection only. No backend write.
// A course/tee selection is not proof of valid distances or live conditions.
import {normalizeCourseSelection} from './course-identity.js';
export const ACTIVE_ROUND_KEY='dcc_active_round_course_v1';
export function saveActiveRound(storage,selection,now=Date.now()){
 const value=normalizeCourseSelection(selection);
 if(!value||!Number.isSafeInteger(now))return false;
 try{storage.setItem(ACTIVE_ROUND_KEY,JSON.stringify({version:1,selection:value,selectedAt:now}));return true;}catch{return false;}
}
export function readActiveRound(storage){
 try{
  const raw=storage.getItem(ACTIVE_ROUND_KEY);
  if(!raw||raw.length>3000)return null;
  const parsed=JSON.parse(raw);
  if(parsed.version!==1||!Number.isSafeInteger(parsed.selectedAt))return null;
  const selection=normalizeCourseSelection(parsed.selection);
  return selection?{selection,selectedAt:parsed.selectedAt}:null;
 }catch{return null;}
}
export function clearActiveRound(storage){
 try{storage.removeItem(ACTIVE_ROUND_KEY);return true;}catch{return false;}
}
export function shouldOfferStarterDesk(storage){return !readActiveRound(storage);}
