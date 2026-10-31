// The Caddy's paper scorecard: presentation-only replacement for solo scoring.
// Scores remain in the original isolated localStorage key; no bets/Ghost writes.
import {readActiveRound} from './starters-desk-session.js';
import {startSoloCard,readSoloCard,saveSoloScore,setSoloHole,setSoloLength,summarizeSoloCard,soloRange} from './solo-scorecard.js?v=premium-paper-9';
import {readCourseScorecard} from './active-course-context.js?v=cached-fallback-16';
import {scorecardCoverage} from './course-scorecard-coverage.js';
import {formatSoloScorecardBackup} from './solo-scorecard-backup.js';

const paperCSS=`
#dcc-paper-dialog{width:min(690px,calc(100vw - 16px));max-width:690px;max-height:calc(100dvh - 24px);margin:auto;padding:0;border:1px solid #b79c62;border-radius:12px;background:#f4ecd6;color:#173729;box-shadow:0 16px 50px #061e16a8;overflow:auto;overscroll-behavior:contain}
#dcc-paper-dialog::backdrop{background:rgba(5,22,16,.79)}
#dcc-paper-dialog .dcc-paper-dialog-bar{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;background:#143729;color:#f3ead7;border-bottom:1px solid #b79c62;padding:10px 12px;font:700 11px system-ui;letter-spacing:.1em}
#dcc-paper-dialog .dcc-paper-close{width:auto;min-height:40px;border:1px solid #c5ad78;border-radius:8px;background:#f4ecd6;color:#173729;padding:8px 12px;font:800 11px system-ui;cursor:pointer}
#dcc-paper-launch{display:block;width:100%;min-height:42px;margin:5px 0 12px;padding:10px 14px;border:1px solid #b79c62;border-radius:9px;background:#f3ecda;color:#173729;font:800 11px/1.3 system-ui;letter-spacing:.09em;text-align:center;cursor:pointer}
#dcc-paper-launch[hidden]{display:none}
#dcc-solo-scorecard{box-sizing:border-box;margin:10px -10px;border:1px solid #ac9364;border-radius:4px;background:#f4ecd6;color:#302e26;box-shadow:0 2px 0 #d6c6a3;font-family:Georgia,serif;overflow:hidden}
#dcc-solo-scorecard *{box-sizing:border-box}
#dcc-solo-scorecard .dcc-paper-head{background:#143729;color:#f7efd8;padding:12px 14px 11px;text-align:center;border-bottom:3px double #d2b777}
#dcc-solo-scorecard .dcc-paper-head small{display:block;letter-spacing:.20em;color:#ddc388;font:700 10px system-ui;margin-bottom:4px}
#dcc-solo-scorecard .dcc-paper-head strong{font:clamp(18px,4.5vw,23px) Georgia,serif;letter-spacing:.03em;color:#f7efd8}
#dcc-solo-scorecard .dcc-paper-body{padding:12px;background:repeating-linear-gradient(0deg,transparent 0,transparent 32px,#806f4d0c 33px),#f4ecd6}
#dcc-solo-scorecard .dcc-paper-meta{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;font:700 11px system-ui;letter-spacing:.03em}
#dcc-solo-scorecard .dcc-paper-meta select{border:1px solid #a98b56;border-radius:4px;background:#fffaed;color:#243c2d;padding:8px}
#dcc-solo-scorecard .dcc-paper-coverage{margin-top:9px;border:1px solid #c9b994;border-radius:4px;padding:8px 9px;background:#fff9e8;font:11px/1.45 system-ui;color:#304636}
#dcc-solo-scorecard .dcc-paper-coverage strong{display:block;font-size:11px;letter-spacing:.02em}
#dcc-solo-scorecard .dcc-paper-coverage small{display:block;margin-top:2px;font-size:10px;color:#695f49}
#dcc-solo-scorecard .dcc-paper-nine{margin:10px 0 0}
#dcc-solo-scorecard .dcc-paper-nine-title{font:700 10px system-ui;letter-spacing:.16em;color:#31503a;padding:0 0 4px}
#dcc-solo-scorecard .dcc-paper-grid{display:grid;grid-template-columns:minmax(40px,1.28fr) repeat(9,minmax(0,1fr)) minmax(29px,1.15fr);border-top:1px solid #ac9364;border-left:1px solid #ac9364;background:#fff9e8}
#dcc-solo-scorecard .dcc-paper-grid>div,#dcc-solo-scorecard .dcc-paper-grid>button{min-width:0;min-height:27px;border:0;border-right:1px solid #c9b994;border-bottom:1px solid #c9b994;display:flex;justify-content:center;align-items:center;text-align:center;padding:4px 1px;background:transparent;color:#2e4436;font:700 clamp(10px,2.7vw,12px) Georgia,serif}
#dcc-solo-scorecard .dcc-paper-grid .dcc-paper-label{justify-content:flex-start;padding-left:3px;background:#eee3c8;color:#314735;font:700 9px Georgia,serif;letter-spacing:.01em}
#dcc-solo-scorecard .dcc-paper-grid .dcc-paper-hole{background:#e9ddbc;color:#263c30}
#dcc-solo-scorecard .dcc-paper-grid .dcc-paper-sum{background:#e9ddbc;font-weight:800}
#dcc-solo-scorecard .dcc-paper-grid>button{border-radius:0!important;margin:0;box-shadow:none;border:0!important;border-right:1px solid #c9b994!important;border-bottom:1px solid #c9b994!important;letter-spacing:0;width:auto}
#dcc-solo-scorecard .dcc-paper-grid .dcc-paper-score{font:italic clamp(14px,4.2vw,20px) 'Bradley Hand','Segoe Print','Comic Sans MS',cursive;color:#3b423d;min-height:42px;cursor:pointer}
#dcc-solo-scorecard .dcc-paper-grid .dcc-paper-score.current{background:#eddca8;box-shadow:inset 0 0 0 2px #37664b}
#dcc-solo-scorecard .dcc-paper-grid .dcc-paper-score:focus-visible{outline:2px solid #1d5b41;outline-offset:-3px}
#dcc-solo-scorecard .dcc-paper-grid .dcc-paper-missing{color:#877d67}
#dcc-solo-scorecard .dcc-paper-total{margin-top:8px;border-top:1px double #ac9364;padding:6px 2px 0;text-align:right;font:700 11px/1.6 system-ui;color:#2e4937}
#dcc-solo-scorecard .dcc-paper-navigation{display:flex;align-items:center;justify-content:space-between;gap:4px;margin:8px 0 7px}
#dcc-solo-scorecard .dcc-paper-navigation button,#dcc-solo-scorecard .dcc-paper-scorebuttons button{border:1px solid #bca576;border-radius:5px;background:#fffaf0;color:#1b3b2b;min-height:42px;padding:8px;font-weight:800}
#dcc-solo-scorecard .dcc-paper-navigation button{font:700 11px Georgia,serif;white-space:nowrap;flex:0 0 auto;width:auto;min-width:0;padding:4px}
#dcc-solo-scorecard #dcc-paper-progress{font-size:12px;text-align:center;white-space:nowrap}
#dcc-solo-scorecard .dcc-paper-scorebuttons{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px}
#dcc-solo-scorecard .dcc-paper-scorebuttons button.selected{background:#d6bb82}
#dcc-solo-scorecard .dcc-paper-pencil{font:italic 16px 'Bradley Hand','Segoe Print','Comic Sans MS',cursive;color:#625f56}
#dcc-solo-scorecard .dcc-paper-actions{display:flex;justify-content:flex-end;gap:7px;flex-wrap:wrap;margin-top:10px;padding-top:8px;border-top:1px solid #c9b994}
#dcc-solo-scorecard .dcc-paper-actions button{border:1px solid #a98b56;border-radius:5px;background:#fffaed;color:#234333;padding:10px 12px;min-height:40px;font:700 10px system-ui;letter-spacing:.07em;text-transform:uppercase;cursor:pointer}
#dcc-solo-scorecard .dcc-paper-recap{margin-top:10px;border-top:1px dashed #927e57;padding-top:14px}
#dcc-solo-scorecard .dcc-paper-recap strong{display:block;font:700 12px system-ui;letter-spacing:.08em;color:#1d4934}
#dcc-solo-scorecard .dcc-paper-recap p{margin:7px 0 0;font:italic 16px/1.45 Georgia,serif}
@media(max-width:390px){#dcc-solo-scorecard .dcc-paper-body{padding:8px}#dcc-solo-scorecard .dcc-paper-head{padding:11px 9px 10px}#dcc-solo-scorecard .dcc-paper-grid>div,#dcc-solo-scorecard .dcc-paper-grid>button{padding:4px 0;letter-spacing:0}}
`;
function writeRecap(summary,name){
 const voice={keith:'Keith',reginald:'Reginald',vinny:'Vinny',kyle:'Kyle'}[name]||'Your Caddy';
 const milestone=summary.complete?'Round finished':summary.turnComplete?'At the turn':null;
 if(!milestone)return null;
 const total=summary.complete?summary.total:summary.front;
 const wording=summary.relativeToPar!==null&&summary.complete?' ('+(summary.relativeToPar>0?'+':'')+summary.relativeToPar+' against verified par)':'';
 const line=voice==='Keith'?'Put the pencil down for a second. ':voice==='Reginald'?'A moment for the official record. ':voice==='Vinny'?'Alright, boss. Here’s the damage. ':'Here’s what the card says. ';
 return {title:milestone+' · '+voice,line:line+(summary.complete?summary.length+' holes':'Front nine')+' in '+total+' strokes'+wording+'. '+(summary.complete?'Card signed. Go get yourself something cold.':'Nine more if you’re playing eighteen. Keep it sensible.')};
}
export function mountSoloScorecard({doc=document,storage=localStorage}={}){
 if(doc.getElementById('dcc-solo-scorecard'))return;
 const style=doc.createElement('style');style.textContent=paperCSS;doc.head.append(style);
 const card=doc.createElement('section');card.id='dcc-solo-scorecard';
 card.innerHTML=`<div class="dcc-paper-head"><small>AS IT LIES · TO THE STANDARD</small><strong>DAGGER COUNTRY CLUB</strong><div style="font-size:12px;margin-top:4px;letter-spacing:.12em">THE CADDY’S SCORECARD</div></div><div class="dcc-paper-body"><div class="dcc-paper-meta"><span id="dcc-paper-course"></span><label>Round <select id="dcc-paper-length"><option value="18">18 holes</option><option value="9">9 holes</option></select></label></div><div class="dcc-paper-coverage" id="dcc-paper-coverage" role="status" aria-live="polite"><strong>Checking verified hole information…</strong></div><div id="dcc-paper-grid"></div><div class="dcc-paper-total" id="dcc-paper-totals" aria-live="polite"></div><div class="dcc-paper-navigation"><button type="button" id="dcc-paper-prev">← PREV</button><span id="dcc-paper-progress" class="dcc-paper-pencil"></span><button type="button" id="dcc-paper-next">NEXT →</button></div><div class="dcc-paper-scorebuttons" id="dcc-paper-entries"></div><div class="dcc-paper-recap" id="dcc-paper-recap" hidden><strong id="dcc-paper-recap-title"></strong><p id="dcc-paper-recap-copy"></p><small style="display:block;margin-top:8px">Score-based preview · full AI Caddy recap comes with the verified backend</small></div><div class="dcc-paper-actions"><button type="button" id="dcc-paper-copy">Copy Round Card</button><button type="button" id="dcc-paper-new-round">Change Course / New Round</button></div><div id="dcc-paper-copy-status" role="status" aria-live="polite" style="font:11px/1.4 system-ui;color:#34543c;margin-top:5px"></div></div>`;
 const dialog=doc.createElement('dialog');dialog.id='dcc-paper-dialog';
 dialog.setAttribute('aria-label','Dagger Country Club scorecard');
 const bar=doc.createElement('div');bar.className='dcc-paper-dialog-bar';
 const barTitle=doc.createElement('span');barTitle.textContent='THE OFFICIAL SCORECARD';
 const close=doc.createElement('button');close.type='button';close.className='dcc-paper-close';close.textContent='← BACK TO CADDY';
 bar.append(barTitle,close);dialog.append(bar,card);doc.body.append(dialog);
 const launch=doc.createElement('button');launch.type='button';launch.id='dcc-paper-launch';
 launch.textContent='OPEN SCORECARD';launch.hidden=true;
 const courseStrip=doc.getElementById('dcc-caddy-conditions');
 const target=doc.querySelector('.ai-card[data-tab="play"]')||doc.querySelector('[data-tab="play"]');
 if(courseStrip)courseStrip.insertAdjacentElement('afterend',launch);
 else (target||doc.body).prepend(launch);
 launch.addEventListener('click',()=>{if(launch.hidden||dialog.open)return;dialog.showModal();dialog.scrollTop=0;});
 close.addEventListener('click',()=>dialog.close());
 // Never move the live card or recreate its scoring listeners on open/close.
 // Native dialog Escape support and focus restoration work in iPhone Safari.
 const $=id=>card.querySelector('#'+id);
 function broadcast(hole){doc.dispatchEvent(new CustomEvent('dcc:solo-hole-change',{detail:{hole}}));}
 function render(){
  const active=readActiveRound(storage),state=startSoloCard(storage);
  if(!active||!state){card.hidden=true;launch.hidden=true;if(dialog.open)dialog.close();return;}card.hidden=false;launch.hidden=false;
  const scored=state.scores.filter(Number.isInteger).length;
  launch.textContent='OPEN SCORECARD  ·  '+scored+'/'+(state.length===9?9:18)+' HOLES SCORED';
  const length=state.length===9?9:18,scorecard=readCourseScorecard(storage,active.selection);
  const range=soloRange(state);
  const coverage=scorecardCoverage(scorecard?.holes);
  const coverageEl=$('dcc-paper-coverage');
  coverageEl.replaceChildren();
  const coverageTitle=doc.createElement('strong');coverageTitle.textContent=coverage.label;
  const coverageDetail=doc.createElement('small');coverageDetail.textContent=coverage.detail;
  coverageEl.append(coverageTitle,coverageDetail);
  const pars=Array.from({length:18},(_,i)=>scorecard?.holes.find(h=>h.number===i+1)?.par??null);
  $('dcc-paper-course').textContent=active.selection.course.name+' · '+active.selection.tee.name;
  $('dcc-paper-length').value=String(length);
  $('dcc-paper-progress').textContent='HOLE '+state.hole+'  ·  ENTER STROKES';
  $('dcc-paper-prev').disabled=state.hole<=range.start;$('dcc-paper-next').disabled=state.hole>=range.end;
  const grid=$('dcc-paper-grid');grid.replaceChildren();
  const allHoles=Array.from({length:18},(_,i)=>scorecard?.holes.find(h=>h.number===i+1)||null);
  const sumFacts=(facts,key)=>facts.every(h=>h&&Number.isInteger(h[key]))?facts.reduce((n,h)=>n+h[key],0):null;
  const scoreSum=(from,to)=>state.scores.slice(from,to).reduce((n,v)=>n+(Number.isInteger(v)?v:0),0);
  const makeCell=(value,cls='')=>{const d=doc.createElement('div');d.className=cls;d.textContent=value;return d;};
  const parts=[{start:0,end:9,title:'FRONT NINE',total:'OUT'},{start:9,end:18,title:'BACK NINE',total:'IN'}];
  for(const part of parts.filter(p=>length===18||p.start===range.start-1)){
   const section=doc.createElement('section');section.className='dcc-paper-nine';
   const title=doc.createElement('div');title.className='dcc-paper-nine-title';title.textContent=part.title;
   const table=doc.createElement('div');table.className='dcc-paper-grid';table.setAttribute('role','group');table.setAttribute('aria-label',part.title+' scorecard');
   const facts=allHoles.slice(part.start,part.end);
   table.append(makeCell('HOLE','dcc-paper-label'),...facts.map((_,i)=>makeCell(String(part.start+i+1),'dcc-paper-hole')),makeCell(part.total,'dcc-paper-sum'));
   for(const [key,label] of [['par','PAR'],['yards','YDS']]){
    table.append(makeCell(label,'dcc-paper-label'));
    facts.forEach(f=>table.append(makeCell(f?String(f[key]):'—',f?'':'dcc-paper-missing')));
    table.append(makeCell(sumFacts(facts,key)??'—','dcc-paper-sum'));
   }
   table.append(makeCell('SCORE','dcc-paper-label'));
   for(let i=part.start;i<part.end;i++){
    const button=doc.createElement('button');button.type='button';
    button.className='dcc-paper-score'+(state.hole===i+1?' current':'');
    button.textContent=state.scores[i]??'—';
    button.setAttribute('aria-current',state.hole===i+1?'step':'false');
    button.setAttribute('aria-label','Select hole '+(i+1)+', '+(state.scores[i]===null?'not scored':state.scores[i]+' strokes'));
    button.addEventListener('click',()=>{const next=setSoloHole(storage,i+1);if(next){render();broadcast(next.hole);}});
    table.append(button);
   }
   table.append(makeCell(String(scoreSum(part.start,part.end)),'dcc-paper-sum'));
   section.append(title,table);grid.append(section);
  }
  const selectedFacts=allHoles.slice(range.start-1,range.end);
  const totalPar=sumFacts(selectedFacts,'par'),totalYards=sumFacts(selectedFacts,'yards');
  $('dcc-paper-totals').textContent='TOTAL  ·  '+scoreSum(range.start-1,range.end)+' STROKES   /   PAR '+(totalPar??'—')+'   /   '+(totalYards??'—')+' YDS';
  const entries=$('dcc-paper-entries');entries.replaceChildren();
  for(let score=1;score<=10;score++){
   const b=doc.createElement('button');b.type='button';b.textContent=String(score);
   if(state.scores[state.hole-1]===score)b.className='selected';
   b.setAttribute('aria-label','Pencil '+score+' strokes for hole '+state.hole);
   b.addEventListener('click',()=>{const next=saveSoloScore(storage,score);if(next){render();broadcast(next.hole);}});
   entries.append(b);
  }
  const summary=summarizeSoloCard(state,pars);
  const selectedCaddy=doc.querySelector('.staff-pick.active')?.dataset.caddie||'keith';
  const recap=writeRecap(summary,selectedCaddy);
  $('dcc-paper-recap').hidden=!recap;
  if(recap){$('dcc-paper-recap-title').textContent=recap.title;$('dcc-paper-recap-copy').textContent=recap.line;}
 }
 $('dcc-paper-copy').addEventListener('click',async()=>{
  const active=readActiveRound(storage),state=readSoloCard(storage);
  const text=formatSoloScorecardBackup(active,state,active?readCourseScorecard(storage,active.selection):null);
  const status=$('dcc-paper-copy-status');
  if(!text){status.textContent='No active round to copy.';return;}
  try{
   if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
   await navigator.clipboard.writeText(text);
   status.textContent='Round card copied. Paste into Notes or a message for backup.';
  }catch{
   // iOS Safari may deny clipboard access. Share sheet provides a second
   // explicit user action without mutating the round or scores.
   status.textContent='Clipboard unavailable. Use Safari Share or take a screenshot of your card.';
  }
 });
 $('dcc-paper-new-round').addEventListener('click',()=>doc.dispatchEvent(new CustomEvent('dcc:request-new-round')));
 $('dcc-paper-prev').addEventListener('click',()=>{const state=startSoloCard(storage);if(state&&state.hole>soloRange(state).start){const next=setSoloHole(storage,state.hole-1);if(next){render();broadcast(next.hole);}}});
 $('dcc-paper-next').addEventListener('click',()=>{const state=startSoloCard(storage);if(state&&state.hole<soloRange(state).end){const next=setSoloHole(storage,state.hole+1);if(next){render();broadcast(next.hole);}}});
 $('dcc-paper-length').addEventListener('change',event=>{const next=setSoloLength(storage,Number(event.target.value));if(next){render();broadcast(next.hole);}});
 doc.addEventListener('dcc:round-environment',render);doc.addEventListener('dcc:course-selected',render);doc.addEventListener('dcc:course-cleared',render);doc.addEventListener('click',event=>{if(event.target.closest?.('.staff-pick'))setTimeout(render,0);});
 render();
}
