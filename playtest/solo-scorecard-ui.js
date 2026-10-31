// The Caddy's paper scorecard: presentation-only replacement for solo scoring.
// Scores remain in the original isolated localStorage key; no bets/Ghost writes.
import {readActiveRound} from './starters-desk-session.js';
import {startSoloCard,saveSoloScore,setSoloHole,setSoloLength,summarizeSoloCard} from './solo-scorecard.js';
import {readCourseScorecard} from './active-course-context.js';

const paperCSS=`
#dcc-solo-scorecard{box-sizing:border-box;margin:18px 0;padding:0;border:1px solid #a98b56;border-radius:10px;background:#f4ecd6;color:#302e26;box-shadow:0 7px 0 #d6c6a3,0 15px 25px #10291a35;font-family:Georgia,serif;overflow:hidden}
#dcc-solo-scorecard *{box-sizing:border-box}
.dcc-paper-head{background:#143729;color:#f7efd8;padding:20px 18px 16px;text-align:center;border-bottom:4px double #d2b777}
.dcc-paper-head small{display:block;letter-spacing:.22em;color:#ddc388;font:700 10px system-ui;margin-bottom:6px}
.dcc-paper-head strong{font:24px Georgia,serif;letter-spacing:.06em}
.dcc-paper-body{padding:17px;background:repeating-linear-gradient(0deg,transparent 0,transparent 32px,#806f4d13 33px),#f4ecd6}
.dcc-paper-meta{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;font:700 11px system-ui;letter-spacing:.05em}
.dcc-paper-meta select{border:1px solid #a98b56;border-radius:6px;background:#fffaed;color:#243c2d;padding:8px}
.dcc-paper-scoregrid{display:grid;grid-template-columns:repeat(9,minmax(0,1fr));gap:2px;margin:15px 0}
.dcc-paper-cell{text-align:center;border:1px solid #c9b994;background:#fff9e8;padding:5px 1px;min-width:0;min-height:49px}
.dcc-paper-cell.current{outline:2px solid #1d5b41;outline-offset:-2px;background:#f1e0ae}
.dcc-paper-cell small{display:block;color:#776d53;font:700 9px system-ui}
.dcc-paper-facts{font:700 9px/1.35 system-ui;color:#375140;white-space:nowrap;letter-spacing:-.015em}
.dcc-paper-facts.missing{color:#817763}
.dcc-paper-totals{margin-top:5px;font:700 10px/1.5 system-ui;color:#344f3e;text-align:center}
.dcc-paper-cell strong{display:block;padding-top:2px;font:italic 21px 'Bradley Hand','Segoe Print','Comic Sans MS',cursive;color:#3e4241;transform:rotate(-5deg)}
.dcc-paper-navigation{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:12px 0}
.dcc-paper-navigation button,.dcc-paper-scorebuttons button{border:1px solid #bca576;border-radius:5px;background:#fffaf0;color:#1b3b2b;min-height:42px;padding:8px;font-weight:800}
.dcc-paper-scorebuttons{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}
.dcc-paper-scorebuttons button.selected{background:#d6bb82}
.dcc-paper-pencil{font:italic 16px 'Bradley Hand','Segoe Print','Comic Sans MS',cursive;color:#625f56;transform:rotate(-2deg)}
.dcc-paper-actions{display:flex;justify-content:flex-end;margin-top:18px;padding-top:12px;border-top:1px solid #c9b994}
.dcc-paper-actions button{border:1px solid #a98b56;border-radius:5px;background:#fffaed;color:#234333;padding:10px 12px;min-height:40px;font:700 10px system-ui;letter-spacing:.07em;text-transform:uppercase;cursor:pointer}
.dcc-paper-actions button:focus-visible{outline:2px solid #1d5b41;outline-offset:3px}
.dcc-paper-recap{margin-top:15px;border-top:1px dashed #927e57;padding-top:14px}
.dcc-paper-recap strong{display:block;font:700 12px system-ui;letter-spacing:.08em;color:#1d4934}
.dcc-paper-recap p{margin:7px 0 0;font:italic 16px/1.45 Georgia,serif}
@media(max-width:390px){.dcc-paper-body{padding:12px}.dcc-paper-cell strong{font-size:18px}}
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
 card.innerHTML=`<div class="dcc-paper-head"><small>AS IT LIES · TO THE STANDARD</small><strong>DAGGER COUNTRY CLUB</strong><div style="font-size:12px;margin-top:4px;letter-spacing:.12em">THE CADDY’S SCORECARD</div></div><div class="dcc-paper-body"><div class="dcc-paper-meta"><span id="dcc-paper-course"></span><label>Round <select id="dcc-paper-length"><option value="18">18 holes</option><option value="9">9 holes</option></select></label></div><div class="dcc-paper-scoregrid" id="dcc-paper-grid"></div><div class="dcc-paper-totals" id="dcc-paper-totals" aria-live="polite"></div><div class="dcc-paper-navigation"><button type="button" id="dcc-paper-prev">← PREV</button><span id="dcc-paper-progress" class="dcc-paper-pencil"></span><button type="button" id="dcc-paper-next">NEXT →</button></div><p class="dcc-paper-pencil">Pencil in your strokes</p><div class="dcc-paper-scorebuttons" id="dcc-paper-entries"></div><div class="dcc-paper-recap" id="dcc-paper-recap" hidden><strong id="dcc-paper-recap-title"></strong><p id="dcc-paper-recap-copy"></p><small style="display:block;margin-top:8px">Score-based preview · full AI Caddy recap comes with the verified backend</small></div><div class="dcc-paper-actions"><button type="button" id="dcc-paper-new-round">Change Course / New Round</button></div></div>`;
 const target=doc.querySelector('.ai-card[data-tab="play"]')||doc.querySelector('[data-tab="play"]');
 (target||doc.body).append(card);
 const $=id=>card.querySelector('#'+id);
 function broadcast(hole){doc.dispatchEvent(new CustomEvent('dcc:solo-hole-change',{detail:{hole}}));}
 function render(){
  const active=readActiveRound(storage),state=startSoloCard(storage);
  if(!active||!state){card.hidden=true;return;}card.hidden=false;
  const length=state.length===9?9:18,scorecard=readCourseScorecard(storage,active.selection);
  const pars=Array.from({length},(_,i)=>scorecard?.holes.find(h=>h.number===i+1)?.par??null);
  $('dcc-paper-course').textContent=active.selection.course.name+' · '+active.selection.tee.name;
  $('dcc-paper-length').value=String(length);
  $('dcc-paper-progress').textContent='Hole '+state.hole+' of '+length;
  $('dcc-paper-prev').disabled=state.hole<=1;$('dcc-paper-next').disabled=state.hole>=length;
  const grid=$('dcc-paper-grid');grid.replaceChildren();
  for(let i=0;i<length;i++){
   const cell=doc.createElement('div');cell.className='dcc-paper-cell'+(i+1===state.hole?' current':'');
   const number=doc.createElement('small');number.textContent=String(i+1);
   const fact=scorecard?.holes.find(h=>h.number===i+1);
   const details=doc.createElement('div');details.className='dcc-paper-facts'+(fact?'':' missing');
   details.textContent=fact?'P'+fact.par+' · '+fact.yards+'y':'P— · —y';
   details.title=fact?'Verified tee scorecard yardage, not distance to the pin':'Par and yardage not yet verified';
   const pencil=doc.createElement('strong');pencil.textContent=state.scores[i]??'—';cell.append(number,details,pencil);grid.append(cell);
  }
  const totals=$('dcc-paper-totals');
  const groups=[{name:'OUT',from:0,to:9},...(length===18?[{name:'IN',from:9,to:18}]:[]),{name:'TOTAL',from:0,to:length}];
  totals.textContent=groups.map(group=>{
   const holes=Array.from({length:group.to-group.from},(_,j)=>scorecard?.holes.find(h=>h.number===group.from+j+1));
   const verified=holes.every(h=>h&&Number.isInteger(h.par)&&Number.isInteger(h.yards));
   const strokes=state.scores.slice(group.from,group.to).reduce((sum,n)=>sum+(Number.isInteger(n)?n:0),0);
   return group.name+' '+strokes+' strokes · Par '+(verified?holes.reduce((n,h)=>n+h.par,0):'—')+' · '+(verified?holes.reduce((n,h)=>n+h.yards,0)+' yd':'— yd');
  }).join('  |  ');
  const entries=$('dcc-paper-entries');entries.replaceChildren();
  for(let score=1;score<=10;score++){
   const b=doc.createElement('button');b.type='button';b.textContent=String(score);
   if(state.scores[state.hole-1]===score)b.className='selected';
   b.setAttribute('aria-label','Pencil '+score+' strokes for hole '+state.hole);
   b.addEventListener('click',()=>{const next=saveSoloScore(storage,score);if(next){render();broadcast(next.hole);}});
   entries.append(b);
  }
  if(state.scores[state.hole-1]>10){const more=doc.createElement('button');more.textContent='Other: '+state.scores[state.hole-1];more.setAttribute('aria-label','Previously entered '+state.scores[state.hole-1]+' strokes');more.disabled=true;entries.append(more);}
  const summary=summarizeSoloCard(state,pars);
  const selectedCaddy=doc.querySelector('.staff-pick.active')?.dataset.caddie||'keith';
  const recap=writeRecap(summary,selectedCaddy);
  $('dcc-paper-recap').hidden=!recap;
  if(recap){$('dcc-paper-recap-title').textContent=recap.title;$('dcc-paper-recap-copy').textContent=recap.line;}
 }
 $('dcc-paper-new-round').addEventListener('click',()=>doc.dispatchEvent(new CustomEvent('dcc:request-new-round')));
 $('dcc-paper-prev').addEventListener('click',()=>{const state=startSoloCard(storage);if(state&&state.hole>1){const next=setSoloHole(storage,state.hole-1);if(next){render();broadcast(next.hole);}}});
 $('dcc-paper-next').addEventListener('click',()=>{const state=startSoloCard(storage);if(state&&state.hole<(state.length===9?9:18)){const next=setSoloHole(storage,state.hole+1);if(next){render();broadcast(next.hole);}}});
 $('dcc-paper-length').addEventListener('change',event=>{if(setSoloLength(storage,Number(event.target.value)))render();});
 doc.addEventListener('dcc:round-environment',render);doc.addEventListener('dcc:course-selected',render);doc.addEventListener('dcc:course-cleared',render);doc.addEventListener('click',event=>{if(event.target.closest?.('.staff-pick'))setTimeout(render,0);});
 render();
}
