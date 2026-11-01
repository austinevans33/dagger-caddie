import {createTrip,addTripRound,tripRosterSummary} from './trip-roster.js';
import {changeTripRoundStatus} from './trip-round-status.js';
import {summarizeTrip} from './trip-settlement.js';
// Local draft only: do not confuse this UI with live shared Trip Mode.
export function mountTripDesk({doc=document,storage=localStorage}={}){
 if(doc.getElementById('dcc-trip-open'))return;
 const style=doc.createElement('style');
 style.textContent='#dcc-trip-open{background:#183d2f;color:#f7ecd6;border:1px solid #bca275;border-radius:10px;padding:10px 13px;font-weight:800}#dcc-trip-dialog{width:min(92vw,560px);max-height:88vh;overflow:auto;padding:20px;border:2px solid #ac9366;border-radius:14px;background:#f2ebda;color:#234333}#dcc-trip-dialog::backdrop{background:#081b16bc}#dcc-trip-dialog h2{font:700 29px Georgia,serif}#dcc-trip-dialog input{width:100%;box-sizing:border-box;padding:10px;margin:6px 0 14px;background:#fffaf0;border:1px solid #b9a77e;border-radius:7px}#dcc-trip-dialog button{padding:10px 12px;background:#1f4234;color:#fff3d9;border:1px solid #aa936b;border-radius:8px;font-weight:800}';
 doc.head.append(style);
 const open=doc.createElement('button');open.id='dcc-trip-open';open.type='button';open.textContent='Golf Trip Desk';
 (doc.getElementById('dcc-starter-open')?.parentElement||doc.body).append(open);
 const dialog=doc.createElement('dialog');dialog.id='dcc-trip-dialog';
 const title=doc.createElement('h2');title.textContent='DAGGER · Golf Trip Desk';
 const body=doc.createElement('div'),close=doc.createElement('button');
 close.textContent='Close';close.onclick=()=>dialog.close();
 dialog.append(title,body,close);doc.body.append(dialog);
 const key='dcc_trip_preview_v1',makeId=()=>crypto.randomUUID().replace(/-/g,'').slice(0,16);
 const input=placeholder=>{const el=doc.createElement('input');el.placeholder=placeholder;return el;};
 function action(label,fn){const b=doc.createElement('button');b.textContent=label;b.onclick=()=>{try{fn();}catch(e){const p=doc.createElement('p');p.textContent=e.message;body.append(p);}};return b;}
 function read(){try{const raw=storage.getItem(key);if(!raw||raw.length>60000)return null;const v=JSON.parse(raw);return createTrip({tripId:v.id,name:v.name,players:v.players,rounds:v.rounds});}catch{return null;}}
 const addText=text=>{const p=doc.createElement('p');p.textContent=text;body.append(p);};
 function draw(){
  body.replaceChildren();
  addText('PRIVATE LOCAL DRAFT · No shared joining, Firebase sync, or live payouts.');
  const trip=read();
  if(!trip){
   const name=input('Trip name'),names=input('Golfer names, separated by commas');
   body.append(name,names,action('Create Trip Draft',()=>{
    const players=names.value.split(',').map(s=>s.trim()).filter(Boolean).map(n=>({id:makeId(),name:n}));
    storage.setItem(key,JSON.stringify(createTrip({tripId:makeId(),name:name.value,players})));draw();
   }));return;
  }
  const roster=tripRosterSummary(trip);
  const h=doc.createElement('h3');h.textContent=trip.name+' · '+roster.playerCount+' golfers · '+roster.roundCount+' rounds';body.append(h);
  addText(trip.players.map(p=>p.name).join(' · '));
  for(const round of trip.rounds){
   addText(round.name+' · '+round.groups.length+' groups · '+round.status);
   if(round.status==='draft')body.append(action('Start '+round.name,()=>{
    storage.setItem(key,JSON.stringify(changeTripRoundStatus(read(),round.id,'active').trip));draw();
   }));
  }
  const ledger=summarizeTrip(trip);
  const h2=doc.createElement('h3');h2.textContent='TRIP LEDGER · '+(ledger.provisional?'PROVISIONAL':'FINAL');body.append(h2);
  addText(ledger.countedGames+' completed games · '+ledger.pendingGames+' pending games · '+ledger.pendingRounds+' unfinished rounds');
  for(const player of trip.players){const c=ledger.netCents[player.id];addText(player.name+' · '+(c>=0?'+':'−')+'$'+(Math.abs(c)/100).toFixed(2));}
  if(!ledger.provisional)for(const transfer of ledger.transfers){
   const who=id=>trip.players.find(p=>p.id===id)?.name||id;
   addText(who(transfer.from)+' owes '+who(transfer.to)+' $'+(transfer.amountCents/100).toFixed(2));
  }
  const roundName=input('Next round — Friday');
  body.append(roundName,action('Add Draft Round',()=>{
   const groups=[];for(let i=0;i<trip.players.length;i+=4)
    groups.push({id:makeId(),playerIds:trip.players.slice(i,i+4).map(p=>p.id)});
   storage.setItem(key,JSON.stringify(addTripRound(read(),{id:makeId(),name:roundName.value,status:'draft',groups})));draw();
  }));
 }
 open.onclick=()=>{draw();dialog.showModal();};
}
