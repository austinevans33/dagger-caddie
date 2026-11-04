// Read-only reflection of the existing paper scorecard in The Grounds.
// NEVER modifies strokes, game formats, bets, Ledger, Money Room or Firebase.
import {readRoundScoreSnapshot,compareRoundScoreSnapshots} from './round-score-snapshot.js';
const fmt=(snapshot)=>snapshot?String(snapshot.completedCount)+'/18': '0/18';
export function formatRoundScorePulse(snapshot){
 if(!snapshot)return Object.freeze({ready:false,progress:'NO ACTIVE SCORECARD',summary:'Choose a course and tee at the Starter’s Desk to begin a round.',recent:'',complete:false});
 const scored=snapshot.completedHoles;
 const last=scored.slice(-3).map(n=>'H'+n+': '+snapshot.scores[n-1]).join(' · ');
 return Object.freeze({
  ready:true,
  progress:fmt(snapshot)+' HOLES SCORED',
  summary:snapshot.courseName+' · '+snapshot.teeName+' · '+snapshot.totalStrokes+' recorded strokes',
  recent:last||'No scores entered yet.',
  complete:snapshot.complete
 });
}
export function mountRoundScorePulse({doc=document,storage=localStorage}={}){
 const games=doc.getElementById('gamesMenu');
 if(!games||doc.getElementById('dccScorePulse'))return null;
 const style=doc.createElement('style');
 style.textContent=`
 #dccScorePulse{border:1px solid #ac946b;border-radius:13px;background:#f0e5cf;color:#19392b;padding:12px 13px;margin:0 0 14px;font:14px/1.4 system-ui,sans-serif}
 #dccScorePulse .dcc-pulse-kicker{display:block;font-size:10px;font-weight:850;letter-spacing:.15em;color:#425943;margin-bottom:5px}
 #dccScorePulse strong{display:block;font:700 20px/1.2 Georgia,serif}
 #dccScorePulse p{margin:6px 0;color:#405143;font-size:12px}
 #dccScorePulse .dcc-pulse-action{display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap}
 #dccScorePulse button{min-height:44px;border:1px solid #b89b68;border-radius:10px;background:#173d2c;color:#fbf2da;padding:9px 12px;font:700 12px/1.2 system-ui,sans-serif}
 #dccScorePulse .dcc-pulse-boundary{font-size:10px;color:#695b46;margin-bottom:0}
 `;
 doc.head.append(style);
 const panel=doc.createElement('aside');panel.id='dccScorePulse';
 panel.setAttribute('aria-label','Live paper scorecard round summary');
 const kicker=doc.createElement('span');kicker.className='dcc-pulse-kicker';kicker.textContent='YOUR PAPER SCORECARD · LIVE ROUND';
 const title=doc.createElement('strong');title.id='dccScorePulseProgress';
 const summary=doc.createElement('p');summary.id='dccScorePulseSummary';
 const recent=doc.createElement('p');recent.id='dccScorePulseRecent';
 const button=doc.createElement('button');button.type='button';button.id='dccScorePulseOpen';button.textContent='Open Scorecard';
 const action=doc.createElement('div');action.className='dcc-pulse-action';action.append(recent,button);
 const boundary=doc.createElement('p');boundary.className='dcc-pulse-boundary';boundary.textContent='Read-only round display · wagers and settlements are managed separately.';
 panel.append(kicker,title,summary,action,boundary);
 games.insertBefore(panel,games.firstChild);
 let last=null;
 function render(){
  const current=readRoundScoreSnapshot(storage),display=formatRoundScorePulse(current);
  title.textContent=display.progress;
  summary.textContent=display.summary;
  recent.textContent=display.recent;
  button.disabled=!display.ready;
  if(last&&current){
   const change=compareRoundScoreSnapshots(last,current);
   if(change.kind==='updated')panel.dataset.lastChangedHole=String(change.changes[change.changes.length-1].hole);
   else if(change.kind==='different-round')delete panel.dataset.lastChangedHole;
  }else delete panel.dataset.lastChangedHole;
  last=current;
 }
 button.addEventListener('click',()=>{
  // Existing Caddy tab and paper scorecard own all score entry.
  doc.getElementById('tab-play')?.click();
  doc.getElementById('dcc-paper-launch')?.click();
 });
 doc.addEventListener('dcc:solo-hole-change',render);
 doc.addEventListener('dcc:course-selected',render);
 doc.addEventListener('dcc:course-cleared',render);
 doc.addEventListener('dcc:request-new-round',()=>queueMicrotask(render));
 doc.getElementById('tab-games')?.addEventListener('click',render);
 if(typeof window!=='undefined')window.addEventListener('storage',event=>{
  if(!event.key||['dcc_active_round_course_v1','dcc_solo_scorecard_v1'].includes(event.key))render();
 });
 render();
 return Object.freeze({element:panel,render});
}
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>mountRoundScorePulse(),{once:true});
 else mountRoundScorePulse();
}
