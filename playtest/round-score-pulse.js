// Read-only reflection of the existing paper scorecard in The Grounds.
// NEVER modifies strokes, game formats, bets, Ledger, Money Room or Firebase.
import {readRoundScoreSnapshot,compareRoundScoreSnapshots} from './round-score-snapshot.js';
import {projectPaperScoresIntoGame} from './round-game-score-adapter.js';
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
 const preview=doc.createElement('details');preview.id='dccGameScorePreview';preview.style.cssText='margin-top:10px;border-top:1px solid #c8ae81;padding-top:9px';
 const previewTitle=doc.createElement('summary');previewTitle.textContent='Check scorecard against active game (preview only)';
 const previewBody=doc.createElement('div');previewBody.style.cssText='display:grid;gap:8px;margin-top:9px';
 const playerSelect=doc.createElement('select');playerSelect.id='dccGameScorePlayer';playerSelect.setAttribute('aria-label','Which player uses this paper scorecard?');playerSelect.style.cssText='min-height:44px;max-width:100%;border:1px solid #b89b68;border-radius:8px;padding:8px;background:#fffaf0;color:#173d2c';
 const compare=doc.createElement('button');compare.type='button';compare.id='dccGameScoreCompare';compare.textContent='Preview my game scores';
 const result=doc.createElement('p');result.id='dccGameScoreCompareResult';result.setAttribute('role','status');result.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere';
 const disclosure=doc.createElement('p');disclosure.textContent='Preview only. No game, money, settlement, or Firebase data changes.';disclosure.style.cssText='font-size:11px';
 previewBody.append(playerSelect,compare,result,disclosure);preview.append(previewTitle,previewBody);
 panel.append(kicker,title,summary,action,boundary,preview);
 const getWager=()=>{try{const game=JSON.parse(storage.getItem('dagger_foursome_active')||'null');return game&&typeof game==='object'?game:null;}catch{return null;}};
 function refreshPlayers(){
  const game=getWager(),players=Array.isArray(game?.players)?game.players:[];
  const previous=playerSelect.value;playerSelect.replaceChildren();
  const placeholder=doc.createElement('option');placeholder.value='';placeholder.textContent='Choose your name on this game';playerSelect.append(placeholder);
  players.forEach((name,i)=>{const option=doc.createElement('option');option.value=String(i);option.textContent=String(name);playerSelect.append(option)});
  if([...playerSelect.options].some(option=>option.value===previous))playerSelect.value=previous;
  else playerSelect.value='';
 }
 preview.addEventListener('toggle',()=>{if(preview.open){refreshPlayers();result.textContent='Choose your name, then preview. Nothing will be saved.'}});
 compare.addEventListener('click',()=>{
  const card=readRoundScoreSnapshot(storage),game=getWager(),player=playerSelect.value;
  if(!card||!game||!['nassau','skins'].includes(game.format)){result.textContent='Open a paper scorecard and an active Nassau or skins game first.';return;}
  if(player===''||!Number.isInteger(Number(player))){result.textContent='Select your matching player name first.';return;}
  if(game.roundIdentity&&game.roundIdentity!==card.identity){result.textContent='This wager belongs to a different round. No scores connected.';return;}
  const synced=projectPaperScoresIntoGame(card,game,{roundIdentity:card.identity,playerIndex:Number(player)});
  if(!synced.holes){result.textContent='The game or scorecard is incompatible. No scores connected.';return;}
  const assigned=synced.holes.filter(row=>row[Number(player)]!==null).length;
  result.textContent=card.courseName+' · '+card.teeName+'\n'+assigned+'/18 paper scores available for '+game.players[Number(player)]+'. '+synced.changedHoles.length+' hole(s) differ from the game.\\nPreview only — game and Ledger unchanged.';
 });
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
