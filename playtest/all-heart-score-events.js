import {emitAllHeartRoundDetail} from './all-heart-scorecard-context.js';

// Course Factory is responsible for emitting a verified hole record. Keep
// only that record; re-check it against the active solo round on every score
// or hole change. An unverified course never creates an All Heart moment.
export function installAllHeartScoreEvents({doc=globalThis.document,storage=globalThis.localStorage}={}){
 if(!doc?.addEventListener || !storage?.getItem)return ()=>{};
 let verifiedHole=null;
 const clear=()=>doc.getElementById?.('dccAllHeartMoment')?.replaceChildren();
 const refresh=()=>{if(!verifiedHole || !emitAllHeartRoundDetail(doc,storage,verifiedHole))clear()};
 const onVerified=event=>{
  const hole=event?.detail;
  verifiedHole=hole?.verified===true?hole:null;
  if(verifiedHole)refresh();
  else clear();
 };
 const onCourseChange=()=>{verifiedHole=null;clear()};
 doc.addEventListener('dcc:verified-hole-context',onVerified);
 doc.addEventListener('dcc:solo-hole-change',refresh);
 doc.addEventListener('dcc:course-selected',onCourseChange);
 doc.addEventListener('dcc:course-cleared',onCourseChange);
 return ()=>{
  doc.removeEventListener('dcc:verified-hole-context',onVerified);
  doc.removeEventListener('dcc:solo-hole-change',refresh);
  doc.removeEventListener('dcc:course-selected',onCourseChange);
  doc.removeEventListener('dcc:course-cleared',onCourseChange);
 };
}
