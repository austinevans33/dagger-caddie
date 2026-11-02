import {calculateGroupSkins} from './group-skins.js';
// Lightweight match moments grounded strictly in recorded hole results.
export function skinsMoments({names,holes,stakeCents}){
 if(!Array.isArray(names)||names.length<2||names.length>4||names.some(n=>typeof n!=='string'||!n.trim()))throw Error('Invalid names');
 const result=calculateGroupSkins(holes,stakeCents,names.length);
 const events=result.events.filter(e=>e.status!=='pending');
 const moments=[];
 for(let i=0;i<events.length;i++){
  const e=events[i];
  if(e.status==='carry'&&e.skins===1)moments.push({hole:e.hole,text:'Nobody takes hole '+e.hole+'. The pot rolls on.'});
  if(e.status==='won'){
   const amount=e.skins*stakeCents*(names.length-1);
   moments.push({hole:e.hole,text:names[e.winner]+' takes '+e.skins+' '+(e.skins===1?'skin':'skins')+' on '+e.hole+' (+'+'$'+(amount/100).toFixed(2)+').'});
  }
 }
 return {moments:moments.slice(-4),pendingCarry:result.pendingCarry,final:result.settlementEligible};
}
