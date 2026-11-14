import {createTrip,addTripRound,tripRosterSummary} from './trip-roster.js';
import {changeTripRoundStatus} from './trip-round-status.js';
import {summarizeTrip} from './trip-settlement.js';
import {cupStandings} from './trip-cup.js';
import {reconcileTripScorecard} from './trip-scorecard-reconcile.js';
import {buildTripRecap} from './trip-recap.js';
// All data stays on this device. Live multiplayer is intentionally not implied.
export function mountTripDesk({doc=document,storage=localStorage}={}){
 if(doc.getElementById('dcc-trip-open'))return;
 const style=doc.createElement('style');
 style.textContent='#dcc-trip-open{background:#183d2f;color:#f7ecd6;border:1px solid #bca275;border-radius:10px;padding:10px 13px;font-weight:800}#dcc-trip-dialog{width:min(92vw,560px);max-height:88vh;overflow:auto;padding:20px;border:2px solid #ac9366;border-radius:14px;background:#f2ebda;color:#234333}#dcc-trip-dialog::backdrop{background:#081b16bc}#dcc-trip-dialog h2{font:700 29px Georgia,serif}#dcc-trip-dialog input{width:100%;box-sizing:border-box;padding:10px;margin:6px 0 14px;background:#fffaf0;border:1px solid #b9a77e;border-radius:7px}#dcc-trip-dialog button{padding:10px 12px;background:#1f4234;color:#fff3d9;border:1px solid #aa936b;border-radius:8px;font-weight:800}';
 doc.head.append(style);
 const open=doc.createElement('button');open.id='dcc-trip-open';open.type='button';open.textContent='Golf Trip Desk';
 (doc.getElementById('dcc-starter-open')?.parentElement||doc.body).append(open);
 const dlg=doc.createElement('dialog');dlg.id='dcc-trip-dialog';
 const title=doc.createElement('h2');title.textContent='DAGGER · Golf Trip Desk';
 const body=doc.createElement('div'),close=doc.createElement('button');
 close.textContent='Close';close.onclick=()=>dlg.close();
 dlg.append(title,body,close);doc.body.append(dlg);
 const key='dcc_trip_preview_v1',id=()=>crypto.randomUUID().replace(/-/g,'').slice(0,16);
 const input=placeholder=>{const e=doc.createElement('input');e.placeholder=placeholder;return e;};
 const money=cents=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
 const para=(parent,text)=>{const e=doc.createElement('p');e.textContent=text;parent.append(e);};
 const button=(label,fn)=>{const e=doc.createElement('button');e.type='button';e.textContent=label;e.onclick=()=>{try{fn();}catch(err){para(body,err.message);}};return e;};
 function read(){try{const raw=storage.getItem(key);if(!raw||raw.length>60000)return null;const x=JSON.parse(raw);return createTrip({tripId:x.id,name:x.name,players:x.players,rounds:x.rounds});}catch{return null;}}
 function save(trip){storage.setItem(key,JSON.stringify(trip));draw();}
 function openScorecard(trip,round,group){
  const card=doc.createElement('form');
  card.setAttribute('aria-label',round.name+' skins scorecard');
  const holes=group.scores??Array(18).fill(null);
  const firstMissing=holes.indexOf(null);
  const names=group.playerIds.map(id=>trip.players.find(player=>player.id===id).name);
  const picker=doc.createElement('select');
  picker.setAttribute('aria-label','Scoring hole');
  for(let index=0;index<18;index++)picker.add(new Option('Hole '+(index+1),String(index)));
  picker.value=String(firstMissing<0?17:firstMissing);
  const row=doc.createElement('fieldset');
  const fields=names.map(name=>{
   const label=doc.createElement('label');label.textContent=name;
   const field=doc.createElement('input');field.type='number';field.inputMode='numeric';
   field.min='1';field.max='20';field.required=true;
   label.append(field);row.append(label);return field;
  });
  const populate=()=>fields.forEach((field,index)=>{field.value=holes[Number(picker.value)]?.[index]??'';});
  picker.onchange=populate;
  populate();
  const submit=doc.createElement('button');submit.textContent='Save hole';
  const status=doc.createElement('p');status.setAttribute('role','status');
  card.append(picker,row,submit,status);
  const standings=cupStandings(trip);
  const leader=standings[0];
  if(leader.skins){
   const tied=standings.filter(entry=>entry.skins===leader.skins);
   para(card,(tied.length>1?'Tied lead · ':'Leader · ')+tied.map(entry=>entry.name).join(', ')+' · '+leader.skins+' skins');
  }
  const expected=storage.getItem(key);
  card.addEventListener('submit',event=>{
   event.preventDefault();
   try{
    if(storage.getItem(key)!==expected)throw Error('Trip changed. Reopen the scorecard before saving.');
    const updated=[...holes];updated[Number(picker.value)]=fields.map(field=>field.valueAsNumber);
    const revised={...trip,rounds:trip.rounds.map(item=>item.id===round.id
     ?{...item,groups:item.groups.map(entry=>entry.id===group.id?{...entry,scores:updated}:entry)}:item)};
    const next=reconcileTripScorecard(revised,round.id,{playerIds:group.playerIds,holes:updated,
     games:[{id:'practice-'+group.id,format:'skins',stakeCents:0}]});
    save(next);
    const nextRound=next.rounds.find(item=>item.id===round.id);
    openScorecard(next,nextRound,nextRound.groups.find(entry=>entry.id===group.id));
   }catch(error){status.textContent=error.message;}
  });
  body.querySelector('form')?.remove();
  body.append(card);
  card.scrollIntoView({block:'start'});fields[0][0].focus();
 }
 function draw(){
  body.replaceChildren();para(body,'PRIVATE LOCAL DRAFT · No guest joining, Firebase sync or live payouts.');
  const trip=read();
  if(!trip){
   const name=input('Trip name'),people=input('Names separated by commas');
   body.append(name,people,button('Create Draft',()=>{
    const players=people.value.split(',').map(x=>x.trim()).filter(Boolean).map(name=>({id:id(),name}));
    save(createTrip({tripId:id(),name:name.value,players}));
   }));return;
  }
  const info=tripRosterSummary(trip);const heading=doc.createElement('h3');
  heading.textContent=trip.name+' · '+info.playerCount+' golfers · '+info.roundCount+' rounds';body.append(heading);
  para(body,trip.players.map(p=>p.name).join(' · '));
  for(const round of trip.rounds){
   para(body,round.name+' · '+round.groups.length+' groups · '+round.status);
   if(round.status==='active'){
    for(const [index,group] of round.groups.entries()){
     if(group.playerIds.length<2)continue;
     const recorded=round.games.some(game=>game.id==='practice-'+group.id&&game.status==='completed');
     body.append(button((recorded?'Review group ':'Score group ')+(index+1),()=>openScorecard(trip,round,group)));
    }
    const playable=round.groups.filter(group=>group.playerIds.length>=2);
    if(playable.length&&playable.every(group=>round.games.some(game=>game.id==='practice-'+group.id&&game.status==='completed'))&&
       round.games.every(game=>game.status==='completed')){
     body.append(button('Finish '+round.name,()=>save(changeTripRoundStatus(read(),round.id,'completed').trip)));
    }
   }
   if(round.status==='draft')body.append(button('Start '+round.name,()=>save(changeTripRoundStatus(read(),round.id,'active').trip)));
  }
  const standings=doc.createElement('h3');standings.textContent='Cup De Diesel Nips · Practice standings';body.append(standings);
  for(const row of cupStandings(trip))para(body,row.name+' · '+row.skins+' skins · '+row.holes+' holes scored');
  const ledger=summarizeTrip(trip);const h=doc.createElement('h3');
  h.textContent='TRIP LEDGER · '+(ledger.provisional?'PROVISIONAL':'FINAL');body.append(h);
  para(body,ledger.countedGames+' counted games · '+ledger.pendingGames+' pending games');
  for(const p of trip.players)para(body,p.name+' · '+money(ledger.netCents[p.id])+' net');
  body.append(button('Open Clubhouse Report',()=>{
   const previous=doc.getElementById('dcc-trip-report');if(previous)previous.remove();
   const report=buildTripRecap(read()),page=doc.createElement('section');page.id='dcc-trip-report';
   page.style.cssText='background:#fff7e5;border:2px solid #aa936b;padding:16px;margin:12px 0;color:#224133;font-family:Georgia,serif';
   const hh=doc.createElement('h3');hh.textContent=report.title;page.append(hh);
   para(page,report.status+' · '+report.completedRounds+' rounds · '+report.countedGames+' games');
   for(const row of report.leaderboard)para(page,row.name+' · '+money(row.netCents));
   for(const line of report.headlines)para(page,line);
   para(page,report.disclaimer);
   if(report.status==='FINAL')for(const t of report.settlements)para(page,t.from+' pays '+t.to+' '+money(t.amountCents));
   body.append(page);
  }));
  const next=input('New round name');
  body.append(next,button('Add Draft Round',()=>{
   const groups=[];
   for(let i=0;i<trip.players.length;){
    const remaining=trip.players.length-i;
    const size=remaining===5?3:Math.min(remaining,4);
    groups.push({id:id(),playerIds:trip.players.slice(i,i+size).map(p=>p.id)});
    i+=size;
   }
   save(addTripRound(read(),{id:id(),name:next.value,status:'draft',groups}));
  }));
 }
 open.onclick=()=>{draw();dlg.showModal();};
}
