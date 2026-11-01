import {summarizeTrip} from './trip-settlement.js';
import {changeTripRoundStatus} from './trip-round-status.js';
import {createTrip,addTripRound,tripRosterSummary} from './trip-roster.js';
// Deliberately local-only preview: do not imply shared, synced, or live trip functionality.
export function mountTripDesk({doc=document,storage=localStorage}={}){
 if(doc.getElementById('dcc-trip-open'))return;
 const style=doc.createElement('style');
 style.textContent='#dcc-trip-open{background:#183d2f;color:#f7ecd6;border:1px solid #bca275;border-radius:10px;padding:10px 13px;font-weight:800}#dcc-trip-dialog{width:min(92vw,560px);max-height:88vh;overflow:auto;padding:20px;border:2px solid #ac9366;border-radius:14px;background:#f2ebda;color:#234333}#dcc-trip-dialog::backdrop{background:#081b16bc}#dcc-trip-dialog h2{font:700 29px Georgia,serif}#dcc-trip-dialog input{width:100%;box-sizing:border-box;padding:10px;margin:6px 0 14px;background:#fffaf0;border:1px solid #b9a77e;border-radius:7px}#dcc-trip-dialog button{padding:10px 12px;background:#1f4234;color:#fff3d9;border:1px solid #aa936b;border-radius:8px;font-weight:800}';
 doc.head.append(style);
 const button=doc.createElement('button');button.id='dcc-trip-open';button.type='button';button.textContent='Golf Trip Desk';
 (doc.getElementById('dcc-starter-open')?.parentElement||doc.body).append(button);
 const dialog=doc.createElement('dialog');dialog.id='dcc-trip-dialog';
 const title=doc.createElement('h2');title.textContent='DAGGER · Golf Trip Desk';
 const body=doc.createElement('div');
 const close=doc.createElement('button');close.textContent='Close';close.onclick=()=>dialog.close();
 dialog.append(title,body,close);doc.body.append(dialog);
 const key='dcc_trip_preview_v1';
 const makeId=()=>crypto.randomUUID().replace(/-/g,'').slice(0,16);
 function read(){try{const raw=storage.getItem(key);if(!raw||raw.length>60000)return null;const v=JSON.parse(raw);return createTrip({tripId:v.id,name:v.name,players:v.players,rounds:v.rounds});}catch{return null;}}
 function input(placeholder){const v=doc.createElement('input');v.placeholder=placeholder;return v;}
 function action(label,callback){const b=doc.createElement('button');b.textContent=label;b.onclick=()=>{try{callback();}catch(e){const p=doc.createElement('p');p.textContent=e.message;body.append(p);}};return b;}
 function draw(){
  body.replaceChildren();
  const trip=read();
  const notice=doc.createElement('p');notice.textContent='PRIVATE PLANNING DRAFT · Local to this phone. No joining, Firebase sync, or live payouts yet.';body.append(notice);
  if(!trip){
   const name=input('Trip name — Fall Member–Guest'),names=input('Golfer names separated by commas');
   body.append(name,names,action('Create trip draft',()=>{
    const players=names.value.split(',').map(x=>x.trim()).filter(Boolean).map(n=>({id:makeId(),name:n}));
    storage.setItem(key,JSON.stringify(createTrip({tripId:makeId(),name:name.value,players})));draw();
   }));return;
  }
  const summary=tripRosterSummary(trip),heading=doc.createElement('h3');
  heading.textContent=trip.name+' · '+summary.playerCount+' golfers · '+summary.roundCount+' rounds';body.append(heading);
  const roster=doc.createElement('p');roster.textContent=trip.players.map(p=>p.name).join(' · ');body.append(roster);
  for(const round of trip.rounds){const p=doc.createElement('p');p.textContent=round.name+' · '+round.groups.length+' foursomes · '+round.status;body.append(p);if(round.status==='draft')body.append(action('Start '+round.name,()=>{storage.setItem(key,JSON.stringify(changeTripRoundStatus(read(),round.id,'active').trip));draw();}));}
  const ledger=summarizeTrip(trip);
  const ledgerTitle=doc.createElement('h3');ledgerTitle.textContent='TRIP LEDGER · '+(ledger.provisional?'PROVISIONAL':'FINAL');
  body.append(ledgerTitle);
  const explanation=doc.createElement('p');
  explanation.textContent=ledger.countedGames+' settled games · '+ledger.pendingGames+' pending games · '+ledger.pendingRounds+' unfinished rounds';
  body.append(explanation);
  const money=amount=>(amount<0?'−':'')+'
  body.append(roundName,action('Add draft round',()=>{
   const groups=[];for(let i=0;i<trip.players.length;i+=4)groups.push({id:makeId(),playerIds:trip.players.slice(i,i+4).map(p=>p.id)});
   storage.setItem(key,JSON.stringify(addTripRound(trip,{id:makeId(),name:roundName.value,status:'draft',groups})));draw();
  }));
 }
 button.onclick=()=>{draw();dialog.showModal();};
}
+(Math.abs(amount)/100).toFixed(2);
  for(const golfer of trip.players){
   const line=doc.createElement('p');
   line.textContent=golfer.name+' · '+(ledger.netCents[golfer.id]>=0?'+':'')+money(ledger.netCents[golfer.id]);
   body.append(line);
  }
  if(!ledger.provisional&&ledger.transfers.length){
   const settlement=doc.createElement('p');settlement.textContent='FINAL TRANSFERS';body.append(settlement);
   for(const transfer of ledger.transfers){
    const from=trip.players.find(p=>p.id===transfer.from)?.name||transfer.from;
    const to=trip.players.find(p=>p.id===transfer.to)?.name||transfer.to;
    const line=doc.createElement('p');line.textContent=from+' owes '+to+' '+money(transfer.amountCents);body.append(line);
   }
  }
  const roundName=input('New round — Friday');
  body.append(roundName,action('Add draft round',()=>{
   const groups=[];for(let i=0;i<trip.players.length;i+=4)groups.push({id:makeId(),playerIds:trip.players.slice(i,i+4).map(p=>p.id)});
   storage.setItem(key,JSON.stringify(addTripRound(trip,{id:makeId(),name:roundName.value,status:'draft',groups})));draw();
  }));
 }
 button.onclick=()=>{draw();dialog.showModal();};
}
