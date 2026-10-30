import {readActiveRound} from './starters-desk-session.js';
import {startSoloCard,saveSoloScore,setSoloHole} from './solo-scorecard.js';
export function mountSoloScorecard({doc=document,storage=localStorage}={}){
 if(doc.getElementById('dcc-solo-scorecard'))return;
 const card=doc.createElement('section');card.id='dcc-solo-scorecard';
 card.style.cssText='margin:12px 0;padding:16px;border:1px solid #b79c62;border-radius:14px;background:#173528;color:#f3e9d3;font:14px system-ui';
 const header=doc.createElement('div');header.style.cssText='font:700 11px system-ui;letter-spacing:.12em;color:#d8ba77';header.textContent='THE CADDY’S SCORECARD';
 const info=doc.createElement('p'),progress=doc.createElement('p'),controls=doc.createElement('div'),scores=doc.createElement('div');
 controls.style.cssText='display:flex;gap:9px;align-items:center;flex-wrap:wrap';
 scores.style.cssText='display:flex;gap:7px;flex-wrap:wrap;margin-top:12px';
 const back=doc.createElement('button'),next=doc.createElement('button');
 back.textContent='← Previous';next.textContent='Next →';
 for(const b of [back,next])b.style.cssText='padding:10px;border:1px solid #b79c62;border-radius:9px;background:#f5f0e5;color:#143126;font-weight:700';
 controls.append(back,next);
 card.append(header,info,progress,controls,scores);
 const target=doc.querySelector('.ai-card[data-tab="play"]')||doc.querySelector('[data-tab="play"]');
 if(target)target.append(card);else doc.body.append(card);
 function render(){
  const active=readActiveRound(storage),state=startSoloCard(storage);
  if(!active||!state){card.hidden=true;return;}card.hidden=false;
  info.textContent=active.selection.course.name+' · '+active.selection.tee.name;
  const done=state.scores.filter(x=>x!==null);
  progress.textContent='Hole '+state.hole+' of 18 · '+done.length+' recorded · '+done.reduce((a,b)=>a+b,0)+' strokes';
  back.disabled=state.hole===1;next.disabled=state.hole===18;
  scores.replaceChildren();
  for(let n=2;n<=10;n++){
   const b=doc.createElement('button');b.textContent=String(n);
   b.setAttribute('aria-label','Record '+n+' strokes on hole '+state.hole);
   b.style.cssText='min-width:38px;min-height:42px;border-radius:9px;border:1px solid #b79c62;background:'+(state.scores[state.hole-1]===n?'#d8ba77':'#f5f0e5')+';color:#143126;font-weight:800';
   b.addEventListener('click',()=>{if(saveSoloScore(storage,n)){render();doc.dispatchEvent(new CustomEvent('dcc:solo-hole-change',{detail:{hole:startSoloCard(storage).hole}}));}});
   scores.append(b);
  }
 }
 back.addEventListener('click',()=>{const s=startSoloCard(storage);if(s&&setSoloHole(storage,Math.max(1,s.hole-1))){render();doc.dispatchEvent(new CustomEvent('dcc:solo-hole-change',{detail:{hole:s.hole-1}}));}});
 next.addEventListener('click',()=>{const s=startSoloCard(storage);if(s&&setSoloHole(storage,Math.min(18,s.hole+1))){render();doc.dispatchEvent(new CustomEvent('dcc:solo-hole-change',{detail:{hole:s.hole+1}}));}});
 doc.addEventListener('dcc:course-selected',render);
 render();
}
