// Solo round history is separate from House Ghost, wagers and Firebase.
import {readSoloCard,SOLO_CARD_KEY} from './solo-scorecard.js';
import {readActiveRound,clearActiveRound} from './starters-desk-session.js';
export const SOLO_ARCHIVE_KEY='dcc_solo_round_archive_v1';
export function archiveAndClearSoloRound(storage,{now=Date.now()}={}){
 const card=readSoloCard(storage),round=readActiveRound(storage);
 if(!round)return {ok:false,reason:'no-round'};
 if(!Number.isSafeInteger(now))return {ok:false,reason:'invalid-time'};
 if(card&&card.scores.some(Number.isInteger)){
  let archive;
  try{
   const raw=storage.getItem(SOLO_ARCHIVE_KEY);
   archive=raw?JSON.parse(raw):[];
   if(!Array.isArray(archive)||archive.length>100)return {ok:false,reason:'archive-invalid'};
   // Deduplicate a retry after a partially successful previous archive.
   if(!archive.some(item=>item.identity===card.identity)){
    archive=[...archive,{version:1,identity:card.identity,selection:round.selection,
      selectedAt:round.selectedAt,archivedAt:now,card}].slice(-100);
    storage.setItem(SOLO_ARCHIVE_KEY,JSON.stringify(archive));
   }
  }catch{return {ok:false,reason:'archive-unavailable'};}
 }
 // Clear solo records only after the archival write succeeded.
 try{storage.removeItem(SOLO_CARD_KEY);if(!clearActiveRound(storage))return {ok:false,reason:'round-clear-failed'};return {ok:true,archived:!!card?.scores.some(Number.isInteger)};}
 catch{return {ok:false,reason:'storage-unavailable'};}
}
