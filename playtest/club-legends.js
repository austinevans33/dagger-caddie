import {readRoundScoreSnapshot} from './round-score-snapshot.js';
import {buildAllHeartReceipt} from './all-heart-receipts.js';
import {projectMatchbookReceipts} from './matchbook-receipt-feed.js';

const KEY='dcc_club_legend_v1';
function read(storage){
 const entries=JSON.parse(storage.getItem(KEY)||'[]');
 if(!Array.isArray(entries))throw Error('Invalid Club Legends history');
 return entries;
}
function find(storage,roundKey){
 try{return read(storage).find(row=>row?.roundKey===roundKey);}catch{return null;}
}
export function clubLegendOffered(storage,roundKey){
 try{return read(storage).some(row=>row?.roundKey===roundKey);}catch{return true;}
}
export function offerClubLegend(storage,roundKey,moment){
 if(clubLegendOffered(storage,roundKey))return false;
 try{
  const entries=read(storage);
  entries.unshift({roundKey,moment,accepted:false});
  storage.setItem(KEY,JSON.stringify(entries.slice(0,50)));
  return true;
 }catch{return false;}
}
export function acceptClubLegend(storage,roundKey,moment){
 const saved=find(storage,roundKey);
 const round=readRoundScoreSnapshot(storage);
 if(saved?.roundKey!==roundKey||saved.moment?.key!==moment.key||saved.accepted||
    round?.identity!==roundKey||round.activeHole!==saved.moment.holeNumber||round.scores[round.activeHole-1]!==null)return;
 try{
  const entries=read(storage).map(row=>row?.roundKey===roundKey?{...saved,accepted:true}:row);
  storage.setItem(KEY,JSON.stringify(entries));
 }catch{/* Scorecard remains independent. */}
}
export function clubLegendReceipts(storage,card){
 const saved=find(storage,card?.identity);
 const moment=saved?.moment;
 if(saved?.roundKey!==card?.identity||saved?.accepted!==true||moment?.traveling!==true)return [];
 const hole=moment.holeNumber, strokes=card.scores[hole-1];
 const receipt=buildAllHeartReceipt(moment,{roundId:card.identity,hole,strokes,targetStrokes:moment.targetStrokes,
  accepted:true,completed:Number.isInteger(strokes)});
 return projectMatchbookReceipts([receipt],{roundId:card.identity});
}
