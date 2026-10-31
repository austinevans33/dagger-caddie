// Starter's Desk UI prototype. No fictitious course search results.
// Opens on member request until a verified course catalog is connected.
import {readActiveRound,clearActiveRound,saveActiveRound} from './starters-desk-session.js';
import {searchOpenGolfCourses,loadOpenGolfTees} from './opengolf-catalog.js';
import {getRoundEnvironment} from './round-environment.js';
import {readSoloCard} from './solo-scorecard.js';
import {archiveAndClearSoloRound} from './solo-round-reset.js';
export function mountStartersDesk({doc=document,storage=localStorage}={}){
 if(doc.getElementById('dcc-starter-open'))return;
 const style=doc.createElement('style');
 style.textContent=`
 #dcc-starter-open{border:1px solid #b79c62;background:#173528;color:#f3e9d3;border-radius:12px;padding:10px 14px;font:700 12px system-ui;cursor:pointer}
 #dcc-starter-dialog{border:1px solid #b79c62;border-radius:18px;background:#f5f0e5;color:#143126;max-width:min(92vw,490px);width:100%;padding:0;box-shadow:0 15px 60px #0008}
 #dcc-starter-dialog::backdrop{background:#101e19b8}
 .dcc-starter-head{background:#173528;color:#f3e9d3;text-align:center;padding:28px 22px;border-radius:17px 17px 0 0}
 .dcc-starter-eyebrow{color:#d8ba77;letter-spacing:.18em;font:800 10px system-ui}
 .dcc-starter-head h2{font:normal 30px Georgia,serif;margin:10px 0}
 .dcc-starter-body{padding:24px;display:grid;gap:14px}
 .dcc-starter-body p{margin:0;line-height:1.5}\n .dcc-starter-body input,.dcc-starter-body select{padding:11px;border-radius:8px;width:100%;box-sizing:border-box;border:1px solid #b79c62}\n #dcc-starter-results{display:grid;gap:6px;max-height:200px;overflow:auto}
 .dcc-starter-body button{padding:12px;border-radius:10px;border:1px solid #b79c62;background:#173528;color:#f3e9d3;cursor:pointer}
 #dcc-starter-dialog .dcc-starter-body,#dcc-starter-dialog .dcc-starter-body label,#dcc-starter-dialog #dcc-starter-current,#dcc-starter-dialog #dcc-starter-results{color:#173528}
 #dcc-starter-dialog .dcc-starter-head p{color:#f3e9d3}
 #dcc-starter-dialog .dcc-starter-body input,#dcc-starter-dialog .dcc-starter-body select{background:#fffcf3;color:#173528}
 #dcc-starter-dialog .dcc-starter-body input::placeholder{color:#59695d;opacity:1}
 #dcc-starter-dialog .dcc-starter-body button:disabled{opacity:.55;cursor:not-allowed}
 .dcc-starter-body button.secondary{background:transparent;color:#173528}
 `;
 doc.head.append(style);
 const button=doc.createElement('button');button.id='dcc-starter-open';button.type='button';button.textContent='THE STARTER’S DESK';
 const dialog=doc.createElement('dialog');dialog.id='dcc-starter-dialog';
 dialog.setAttribute('aria-label','Dagger Country Club Starter’s Desk');
 dialog.innerHTML=`<div class="dcc-starter-head"><div class="dcc-starter-eyebrow">DAGGER COUNTRY CLUB · THE FIRST TEE</div><h2>The Starter’s Desk</h2><p>“Where shall we be conducting today’s investigation into your handicap?”</p></div><div class="dcc-starter-body"><p id="dcc-starter-current"></p><label for="dcc-starter-query">Course name</label><input id="dcc-starter-query" placeholder="Search a golf course by name" maxlength="100"/><button type="button" id="dcc-starter-search">Find courses</button><div id="dcc-starter-results" aria-live="polite"></div><label for="dcc-starter-tees">Your tees</label><select id="dcc-starter-tees" disabled><option value="">Select a course first</option></select><button type="button" id="dcc-starter-checkin" disabled>Begin Round</button><button class="secondary" id="dcc-starter-later" type="button">My course isn’t listed yet — enter the clubhouse</button><p style="font-size:10px;opacity:.75">Course data © OpenStreetMap contributors (ODbL 1.0) via OpenGolfAPI.</p></div>`;
 const query=dialog.querySelector('#dcc-starter-query');
 const results=dialog.querySelector('#dcc-starter-results');
 const tees=dialog.querySelector('#dcc-starter-tees');
 const checkin=dialog.querySelector('#dcc-starter-checkin');
 let selected=null,available=[],requestId=0;
 dialog.querySelector('#dcc-starter-search').addEventListener('click',async()=>{
  const current=++requestId;selected=null;available=[];checkin.disabled=true;tees.disabled=true;
  tees.replaceChildren(new Option('Select a course first',''));
  results.textContent='Consulting the course register…';
  try{
   const list=await searchOpenGolfCourses(query.value);
   if(current!==requestId)return;
   results.replaceChildren();
   if(!list.length){results.textContent='No courses found. Try another name, or enter the clubhouse without checking in.';return;}
   for(const course of list){
    const item=doc.createElement('button');item.type='button';item.className='secondary';
    item.textContent=course.name+' · '+course.region;
    item.addEventListener('click',async()=>{
     const turn=++requestId;selected=null;checkin.disabled=true;tees.disabled=true;
     results.textContent='Checking the available tees…';
     try{
      const entries=await loadOpenGolfTees(course);
      if(turn!==requestId)return;
      if(!entries.length){results.textContent='No verified tees available for this course yet. Try another course or enter without checking in.';return;}
      selected=entries[0].course;available=entries[0].tees;
      results.textContent='Selected: '+selected.name;
      tees.replaceChildren(new Option('Select your tees',''),...available.map((t,i)=>new Option(t.name+' · '+t.totalYards+' yards',String(i))));
      tees.disabled=false;
     }catch{if(turn===requestId)results.textContent='Could not retrieve tee details. You can enter without checking in.';}
    });
    results.append(item);
   }
  }catch{if(current===requestId)results.textContent='Course register unavailable. Enter the clubhouse and try again later.';}
 });
 tees.addEventListener('change',()=>{checkin.disabled=!selected||!available[Number(tees.value)]||tees.value==='';});
 checkin.addEventListener('click',()=>{
  const tee=available[Number(tees.value)];
  if(!selected||!tee||tees.value==='')return;
  const previous=readActiveRound(storage);
  if(previous){
   const existing=readSoloCard(storage);
   const haveScores=!!existing?.scores.some(Number.isInteger);
   const explanation=haveScores?'Your current solo scorecard will be archived before starting this round. Continue?':'Start a new round and replace your existing course check-in?';
   if(!confirm(explanation))return;
   const result=archiveAndClearSoloRound(storage);
   if(!result.ok){results.textContent='Could not safely archive the current round. Your scores were retained.';return;}
  }
  if(saveActiveRound(storage,{course:selected,tee,holeNumber:1})){
   doc.dispatchEvent(new CustomEvent('dcc:course-selected',{detail:{course:selected,tee,holeNumber:1}}));
   dialog.close();
   // Check-in never waits on the network; verified hole data arrives separately.
   getRoundEnvironment({storage}).then(context=>{if(context.state!=='selection-changed')doc.dispatchEvent(new CustomEvent('dcc:round-environment',{detail:context}));}).catch(()=>{});
  }else results.textContent='This browser could not remember your selection. You can still enter without checking in.';
 });
 button.addEventListener('click',()=>{
  const active=readActiveRound(storage);
  dialog.querySelector('#dcc-starter-current').textContent=active?`Checked in: ${active.selection.course.name} · ${active.selection.tee.name} · Hole ${active.selection.holeNumber}`:'No course checked in yet.';
  if(!dialog.open)dialog.showModal();
 });
 doc.addEventListener('dcc:request-new-round',()=>{
  const active=readActiveRound(storage);
  if(!active)return;
  const existing=readSoloCard(storage);
  const haveScores=!!existing?.scores.some(Number.isInteger);
  if(!confirm(haveScores?'Archive your current solo scorecard and choose a new course?':'Clear your current check-in and choose a new course?'))return;
  const result=archiveAndClearSoloRound(storage);
  if(!result.ok){results.textContent='Could not safely archive your round. Nothing was intentionally discarded.';return;}
  selected=null;available=[];checkin.disabled=true;tees.disabled=true;tees.replaceChildren(new Option('Select a course first',''));
  results.textContent='Round archived. Search for a new course to check in.';
  dialog.querySelector('#dcc-starter-current').textContent='No course checked in yet.';
  doc.dispatchEvent(new CustomEvent('dcc:course-cleared'));
  if(!dialog.open)dialog.showModal();
 });
 dialog.querySelector('#dcc-starter-later').addEventListener('click',()=>{try{sessionStorage.setItem('dcc_starter_skipped_session_v1','1');}catch{}dialog.close();});
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
 const mast=doc.querySelector('.app-shell .mast')||doc.querySelector('[data-tab="settings"]')||doc.body;
 mast.append(button);doc.body.append(dialog);
 // First visit: offer the course register once per browser tab, without
 // blocking the clubhouse on repeat opens when a user chose to skip.
 try{
  if(!readActiveRound(storage)&&sessionStorage.getItem('dcc_starter_skipped_session_v1')!=='1'){
   setTimeout(()=>{if(!dialog.open)button.click();},0);
  }
 }catch{/* Session storage can be disabled; manual entry remains available. */}
 return {open:()=>button.click(),clear:()=>clearActiveRound(storage)};
}
