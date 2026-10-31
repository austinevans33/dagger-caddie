// The Caddy's paper scorecard: presentation-only replacement for solo scoring.
// Scores remain in the original isolated localStorage key; no bets/Ghost writes.
import {readActiveRound} from './starters-desk-session.js';
import {startSoloCard,saveSoloScore,setSoloHole,setSoloLength,summarizeSoloCard,soloRange} from './solo-scorecard.js?v=premium-paper-9';
import {readCourseScorecard} from './active-course-context.js?v=premium-paper-9';

const paperCSS=`
#dcc-solo-scorecard{box-sizing:border-box;margin:18px -10px;border:1px solid #ac9364;border-radius:4px;background:#f4ecd6;color:#302e26;box-shadow:0 2px 0 #d6c6a3;font-family:Georgia,serif;overflow:hidden}
#dcc-solo-scorecard *{box-sizing:border-box}
#dcc-solo-scorecard .dcc-paper-head{background:#143729;color:#f7efd8;padding:22px 14px 18px;text-align:center;border-bottom:3px double #d2b777}
#dcc-solo-scorecard .dcc-paper-head small{display:block;letter-spacing:.20em;color:#ddc388;font:700 10px system-ui;margin-bottom:7px}
#dcc-solo-scorecard .dcc-paper-head strong{font:clamp(17px,4.2vw,24px) Georgia,serif;letter-spacing:.03em;color:#f7efd8}
#dcc-solo-scorecard .dcc-paper-body{padding:16px;background:repeating-linear-gradient(0deg,transparent 0,transparent 32px,#806f4d0c 33px),#f4ecd6}
#dcc-solo-scorecard .dcc-paper-meta{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;font:700 11px system-ui;letter-spacing:.03em}
#dcc-solo-scorecard .dcc-paper-meta select{border:1px solid #a98b56;border-radius:4px;background:#fffaed;color:#243c2d;padding:8px}
#dcc-solo-scorecard .dcc-paper-nine{margin:16px 0 0}
#dcc-solo-scorecard .dcc-paper-nine-title{font:700 10px system-ui;letter-spacing:.16em;color:#31503a;padding:0 0 6px}
#dcc-solo-scorecard .dcc-paper-grid{display:grid;grid-template-columns:minmax(40px,1.28fr) repeat(9,minmax(0,1fr)) minmax(29px,1.15fr);border-top:1px solid #ac9364;border-left:1px solid #ac9364;background:#fff9e8}
#dcc-solo-scorecard .dcc-paper-grid>div,#dcc-solo-scorecard .dcc-paper-grid>button{min-width:0;min-height:30px;border:0;border-right:1px solid #c9b994;border-bottom:1px solid #c9b994;display:flex;justify-content:center;align-items:center;text-align:center;padding:4px 1px;background:transparent;color:#2e4436;font:700 clamp(10px,2.7vw,12px) Georgia,serif}
#dcc-solo-scorecard .dcc-paper-grid .dcc-paper-label{justify-content:flex-start;padding-left:3px;background:#eee3c8;color:#314735;font:700 9px Georgia,serif;letter-spacing:.01em}
#dcc-solo-scorecard .dcc-paper-grid .dcc-paper-hole{background:#e9ddbc;color:#263c30}
#dcc-solo-scorecard .dcc-paper-grid .dcc-paper-sum{background:#e9ddbc;font-weight:800}
#dcc-solo-scorecard .dcc-paper-grid>button{border-radius:0!important;margin:0;box-shadow:none;border:0!important;border-right:1px solid #c9b994!important;border-bottom:1px solid #c9b994!important;letter-spacing:0;width:auto}
#dcc-solo-scorecard .dcc-paper-grid .dcc-paper-score{font:italic clamp(14px,4.2vw,20px) 'Bradley Hand','Segoe Print','Comic Sans MS',cursive;color:#3b423d;min-height:42px;cursor:pointer}
#dcc-solo-scorecard .dcc-paper-grid .dcc-paper-score.current{background:#eddca8;box-shadow:inset 0 0 0 2px #37664b}
#dcc-solo-scorecard .dcc-paper-grid .dcc-paper-score:focus-visible{outline:2px solid #1d5b41;outline-offset:-3px}
#dcc-solo-scorecard .dcc-paper-grid .dcc-paper-missing{color:#877d67}
#dcc-solo-scorecard .dcc-paper-total{margin-top:13px;border-top:1px double #ac9364;padding:9px 2px 0;text-align:right;font:700 11px/1.6 system-ui;color:#2e4937}
#dcc-solo-scorecard .dcc-paper-navigation{display:flex;align-items:center;justify-content:space-between;gap:4px;margin:15px 0}
#dcc-solo-scorecard .dcc-paper-navigation button,#dcc-solo-scorecard .dcc-paper-scorebuttons button{border:1px solid #bca576;border-radius:5px;background:#fffaf0;color:#1b3b2b;min-height:42px;padding:8px;font-weight:800}
#dcc-solo-scorecard .dcc-paper-navigation button{font:700 11px Georgia,serif;white-space:nowrap;flex:0 0 auto;width:auto;min-width:0;padding:4px}
#dcc-solo-scorecard #dcc-paper-progress{font-size:12px;text-align:center;white-space:nowrap}
#dcc-solo-scorecard .dcc-paper-scorebuttons{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}
#dcc-solo-scorecard .dcc-paper-scorebuttons button.selected{background:#d6bb82}
#dcc-solo-scorecard .dcc-paper-pencil{font:italic 16px 'Bradley Hand','Segoe Print','Comic Sans MS',cursive;color:#625f56}
#dcc-solo-scorecard .dcc-paper-actions{display:flex;justify-content:flex-end;margin-top:18px;padding-top:12px;border-top:1px solid #c9b994}
#dcc-solo-scorecard .dcc-paper-actions button{border:1px solid #a98b56;border-radius:5px;background:#fffaed;color:#234333;padding:10px 12px;min-height:40px;font:700 10px system-ui;letter-spacing:.07em;text-transform:uppercase;cursor:pointer}
#dcc-solo-scorecard .dcc-paper-recap{margin-top:15px;border-top:1px dashed #927e57;padding-top:14px}
#dcc-solo-scorecard .dcc-paper-recap strong{display:block;font:700 12px system-ui;letter-spacing:.08em;color:#1d4934}
#dcc-solo-scorecard .dcc-paper-recap p{margin:7px 0 0;font:italic 16px/1.45 Georgia,serif}
@media(max-width:390px){#dcc-solo-scorecard .dcc-paper-body{padding:8px}#dcc-solo-scorecard .dcc-paper-grid>div,#dcc-solo-scorecard .dcc-paper-grid>button{padding:4px 0;letter-spacing:0}}
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
 card.innerHTML=`<div class="dcc-paper-head"><small>AS IT LIES · TO THE STANDARD</small><strong>DAGGER COUNTRY CLUB</strong><div style="font-size:12px;margin-top:4px;letter-spacing:.12em">THE CADDY’S SCORECARD</div></div><div class="dcc-paper-body"><div class="dcc-paper-meta"><span id="dcc-paper-course"></span><label>Round <select id="dcc-paper-length"><option value="18">18 holes</option><option value="9">9 holes</option></select></label></div><div id="dcc-paper-grid"></div><div class="dcc-paper-total" id="dcc-paper-totals" aria-live="polite"></div><div class="dcc-paper-navigation"><button type="button" id="dcc-paper-prev">← PREV</button><span id="dcc-paper-progress" class="dcc-paper-pencil"></span><button type="button" id="dcc-paper-next">NEXT →</button></div><p class="dcc-paper-pencil">Pencil in your strokes</p><div class="dcc-paper-scorebuttons" id="dcc-paper-entries"></div><div class="dcc-paper-recap" id="dcc-paper-recap" hidden><strong id="dcc-paper-recap-title"></strong><p id="dcc-paper-recap-copy"></p><small style="display:block;margin-top:8px">Score-based preview · full AI Caddy recap comes with the verified backend</small></div><div class="dcc-paper-actions"><button type="button" id="dcc-paper-new-round">Change Course / New Round</button></div></div>`;
 const target=doc.querySelector('.ai-card[data-tab="play"]')||doc.querySelector('[data-tab="play"]');
 (target||doc.body).append(card);
 const $=id=>card.querySelector('#'+id);
 function broadcast(hole){doc.dispatchEvent(new CustomEvent('dcc:solo-hole-change',{detail:{hole}}));}
 function render(){
  const active=readActiveRound(storage),state=startSoloCard(storage);
  if(!active||!state){card.hidden=true;return;}card.hidden=false;
  const length=state.length===9?9:18,scorecard=readCourseScorecard(storage,active.selection);
  const range=soloRange(state);
  const pars=Array.from({length:18},(_,i)=>scorecard?.holes.find(h=>h.number===i+1)?.par??null);
  $('dcc-paper-course').textContent=active.selection.course.name+' · '+active.selection.tee.name;
  $('dcc-paper-length').value=String(length);
  $('dcc-paper-progress').textContent='Hole '+state.hole+' · '+length+' holes';
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
  for(let score=1;score<=15;score++){
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
 $('dcc-paper-new-round').addEventListener('click',()=>doc.dispatchEvent(new CustomEvent('dcc:request-new-round')));
 $('dcc-paper-prev').addEventListener('click',()=>{const state=startSoloCard(storage);if(state&&state.hole>soloRange(state).start){const next=setSoloHole(storage,state.hole-1);if(next){render();broadcast(next.hole);}}});
 $('dcc-paper-next').addEventListener('click',()=>{const state=startSoloCard(storage);if(state&&state.hole<soloRange(state).end){const next=setSoloHole(storage,state.hole+1);if(next){render();broadcast(next.hole);}}});
 $('dcc-paper-length').addEventListener('change',event=>{const next=setSoloLength(storage,Number(event.target.value));if(next){render();broadcast(next.hole);}});
 doc.addEventListener('dcc:round-environment',render);doc.addEventListener('dcc:course-selected',render);doc.addEventListener('dcc:course-cleared',render);doc.addEventListener('click',event=>{if(event.target.closest?.('.staff-pick'))setTimeout(render,0);});
 render();
}
