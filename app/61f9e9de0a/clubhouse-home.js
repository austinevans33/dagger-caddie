/* Dagger Clubhouse: navigation facade only. Do not own scoring, bets or round state. */
import {readYardageHole} from './yardage-navigation.js';
import {founderCatalogRecords,founderTeesForCourse} from './founders-verified-scorecards.js';
import {saveActiveRound,readActiveRound} from './starters-desk-session.js';
(function(){
'use strict';
function openTab(id){
 const tab=document.getElementById('tab-'+id);
 if(tab)tab.click();
}
function selectedHole(){return readYardageHole({session:sessionStorage,local:localStorage})}
function openScorecard(){
 // One shared scorecard. Never create a second scoring state.
 const launch=document.getElementById('dcc-paper-launch');
 if(launch&&!launch.hidden){launch.click();return}
 const dialog=document.getElementById('dcc-paper-dialog');
 if(dialog&&document.getElementById('dcc-solo-scorecard')?.hidden===false){if(!dialog.open)dialog.showModal();return}
 // No active checked-in round: begin with the existing Starter's Desk.
 const starter=document.getElementById('dcc-starter-open');
 if(starter){starter.click();return}
 const tab=document.getElementById('tab-play');if(tab)tab.click();
}
function mount(){
 if(document.getElementById('dccClubhouseHome'))return;
 const caddy=document.querySelector('section.caddie-roster[data-tab="play"]');
 if(!caddy||!caddy.parentNode)return;
 const section=document.createElement('section');
 section.id='dccClubhouseHome';
 section.className='dcc-home';
 section.dataset.tab='play';
 section.setAttribute('aria-label','Dagger Country Club Clubhouse shortcuts');
 if(!document.getElementById('dcc-home-score-style'))document.head.insertAdjacentHTML('beforeend',"<style id=\"dcc-home-score-style\">\n.dcc-home-score{width:100%;min-height:84px;margin:14px 0;display:flex;align-items:center;gap:12px;text-align:left;background:#d2ac6d!important;color:#153729!important;border:1px solid #d4b778!important;border-radius:17px!important;padding:15px 18px!important;box-shadow:0 3px 0 #9e814e66;cursor:pointer}\n.dcc-home-score-icon{font:700 28px Georgia,serif;color:#163b2b;flex:0 0 auto}\n.dcc-home-score-copy{display:grid;gap:3px;min-width:0;flex:1}\n.dcc-home-score-copy strong{font:700 25px Georgia,serif;color:#153729}\n.dcc-home-score-copy small{font:13px/1.35 system-ui;color:#345040}\n.dcc-home-score-arrow{font:32px Georgia,serif}\n.dcc-home-score:focus-visible{outline:3px solid #f4e5bb;outline-offset:3px}\n@media(max-width:370px){.dcc-home-score{padding:13px!important;min-height:73px}.dcc-home-score-copy strong{font-size:22px}}\n</style>");
 section.innerHTML=`
 <header class="dcc-home-header"><div><div class="dcc-home-kicker">DAGGER COUNTRY CLUB</div><h2>The Clubhouse</h2></div><img class="dcc-home-seal" src="dcc-approved-seal.png" alt="Dagger Country Club circular seal"></header>
 <a class="dcc-home-feature" id="dccHomeYardage" href="yardage-preview.html?hole=1">
  <span class="dcc-home-line"><strong class="dcc-home-feature-title">Yardage Book</strong><span id="dccHomeHole" class="dcc-home-hole">HOLE 1</span></span>
  <span class="dcc-home-view"><span>View the hole</span><span aria-hidden="true">›</span></span>
 </a>
 <button class="dcc-home-score" id="dccHomeScorecard" type="button" data-dcc-go="score"><span class="dcc-home-score-icon" aria-hidden="true">✎</span><span class="dcc-home-score-copy"><strong>Scorecard</strong><small id="dccHomeScoreStatus">Your round, one score at a time</small></span><span class="dcc-home-score-arrow" aria-hidden="true">›</span></button>
 <div class="dcc-home-grid">
  <button class="dcc-home-tile" type="button" data-dcc-go="games"><span class="dcc-home-tile-icon" aria-hidden="true">♜</span><span class="dcc-home-tile-name">Games</span><span class="dcc-home-tile-caption">Your matches</span></button>
  <button class="dcc-home-tile" type="button" data-dcc-go="ghost"><span class="dcc-home-tile-icon" aria-hidden="true">♧</span><span class="dcc-home-tile-name">House Ghost</span><span class="dcc-home-tile-caption">Play the house</span></button>
  <button class="dcc-home-tile" type="button" data-dcc-go="ticket"><span class="dcc-home-tile-icon" aria-hidden="true">▣</span><span class="dcc-home-tile-name">Ticket Window</span><span class="dcc-home-tile-caption">Open wagers</span></button>
  <button class="dcc-home-tile" type="button" data-dcc-go="ledger"><span class="dcc-home-tile-icon" aria-hidden="true">▤</span><span class="dcc-home-tile-name">Ledger</span><span class="dcc-home-tile-caption">Balances &amp; statements</span></button>
 </div>
 <button class="dcc-home-money" type="button" data-dcc-go="money"><span><strong>◉ Live Money Room</strong><small>Start or join · host QR code</small></span><span aria-hidden="true">›</span></button>
 <button class="dcc-home-handicap" type="button" data-dcc-go="handicap"><span><strong>Handicap Index</strong><small>Tap to enter or update your index</small></span><span aria-hidden="true">›</span></button>
 <button class="dcc-home-course" type="button" data-dcc-go="course"><span><strong>Change Course</strong><small>Choose a verified course and tee</small></span><span aria-hidden="true">›</span></button>
 <dialog id="dccHomeHandicapDialog" aria-label="Edit Handicap Index" style="width:min(90vw,400px);max-height:80dvh;overflow:auto;position:relative;padding:24px 20px;border:2px solid #b79c62;border-radius:18px;background:#f3ead7;color:#163b2c">
  <button type="button" id="dccHomeHandicapClose" aria-label="Close handicap editor" style="position:absolute;top:10px;right:10px;width:44px;height:44px;min-height:44px;min-width:44px;max-width:44px;margin:0;padding:0;border:1px solid #b79c62;border-radius:50%;background:#e8dcc2;color:#163b2c;font:normal 26px/1 Georgia,serif;box-shadow:none;-webkit-appearance:none">×</button>
  <h3 style="font:700 27px Georgia,serif;margin:8px 46px 12px 0">Handicap Index</h3>
  <p style="font:14px/1.5 system-ui">Enter your current Handicap Index. Plus handicaps use a negative number.</p>
  <label for="dccHomeHandicapInput" style="display:block;margin:16px 0 6px">Your index</label>
  <input id="dccHomeHandicapInput" type="number" inputmode="decimal" min="-10" max="54" step="0.1" placeholder="e.g. 9.1" style="display:block;width:100%;min-height:48px;font-size:20px">
  <p id="dccHomeHandicapStatus" role="status" aria-live="polite" style="font:13px/1.5 system-ui;min-height:24px"></p>
  <button type="button" id="dccHomeHandicapSave" style="width:100%;min-height:48px;border:1px solid #a78a4f;border-radius:10px;background:#d2ac6d;color:#163b2c;font-weight:700">Save Handicap</button>
 </dialog>
 <dialog id="dccHomeCourseDialog" aria-label="Choose course and tees" style="width:min(92vw,440px);max-height:82dvh;overflow:auto;border:2px solid #b79c62;border-radius:18px;background:#f3ead7;color:#163b2c;padding:20px;position:relative">
  <form method="dialog" style="display:contents"><button type="submit" aria-label="Close Starter’s Desk" style="position:absolute;top:12px;right:12px;display:grid;place-items:center;width:44px;height:44px;min-width:44px;min-height:44px;max-width:44px;padding:0;margin:0;border:1px solid #b79c62;border-radius:50%;background:#e8dcc2;color:#163b2c;font:normal 26px/1 Georgia,serif;box-shadow:none;appearance:none;-webkit-appearance:none">×</button></form>
  <h3 style="font:700 25px Georgia,serif;margin:4px 0 12px">Starter’s Desk</h3>
  <p style="font:13px system-ui">Search published course scorecards. Choosing a new course updates the Yardage Book selection; it does not delete your saved scores.</p>
  <label for="dccHomeCourseSearch">Find a course</label><input id="dccHomeCourseSearch" type="search" autocomplete="off" placeholder="e.g. Kings Grant" style="width:100%;min-height:44px">
  <label for="dccHomeCourseSelect">Course</label><select id="dccHomeCourseSelect" style="width:100%;min-height:44px"></select>
  <label for="dccHomeTeeSelect">Tees</label><select id="dccHomeTeeSelect" style="width:100%;min-height:44px"></select>
  <p id="dccHomeCourseStatus" role="status" style="font:13px system-ui"></p>
  <button id="dccHomeCourseConfirm" type="button" style="width:100%;min-height:48px;background:#d2ac6d;color:#153729;border:1px solid #aa8855;border-radius:10px;font-weight:700">Use This Course</button>
 </dialog>
 <footer class="dcc-home-heritage" aria-label="Dagger Country Club heritage seal"><img src="dcc-approved-seal.png" alt="Dagger Country Club circular seal — As It Lies" loading="lazy"></footer>
`;
 caddy.parentNode.insertBefore(section,caddy);
 // A real source-backed course/tee picker. Never fabricate course identities.
 const search=section.querySelector('#dccHomeCourseSearch');
 const courses=section.querySelector('#dccHomeCourseSelect');
 const tees=section.querySelector('#dccHomeTeeSelect');
 const status=section.querySelector('#dccHomeCourseStatus');
 const confirm=section.querySelector('#dccHomeCourseConfirm');
 let records=[];
 function renderTees(){
  const course=courses.value!==''?records[Number(courses.value)]:null;
  const available=course?founderTeesForCourse(course):[];
  tees.replaceChildren(...available.map((tee,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=tee.name+' · '+tee.totalYards+' yards';return option}));
  confirm.disabled=!available.length;
  status.textContent=course?course.name+' · '+course.region:'Type at least two letters to find a published course';
 }
 search.addEventListener('input',()=>{
  records=founderCatalogRecords(search.value).slice(0,100);
  courses.replaceChildren(...records.map((course,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=course.name+' · '+course.region;return option}));
  renderTees();
 });
 courses.addEventListener('change',renderTees);
 confirm.addEventListener('click',()=>{
  const course=courses.value!==''?records[Number(courses.value)]:null;
  const tee=course&&tees.value!==''?founderTeesForCourse(course)[Number(tees.value)]:null;
  if(!course||!tee)return;
  const previous=readActiveRound(localStorage)?.selection;
  if(previous&&(previous.course.providerCourseId!==course.providerCourseId||previous.tee.providerTeeId!==tee.providerTeeId)){
   if(!window.confirm('Switch Yardage Book course and tee? Saved scores stay intact, but the active course context will change.'))return;
  }
  if(!saveActiveRound(localStorage,{course,tee,holeNumber:1})){status.textContent='Could not save course selection on this device';return}
  document.dispatchEvent(new CustomEvent('dcc:course-selected',{detail:{course,tee}}));
  section.querySelector('#dccHomeCourseDialog').close();
  status.textContent='Course selected';
  section.querySelector('#dccHomeHole').textContent='HOLE 1';
 });

 // Retain the entire original header, saved state, and caddy infrastructure.
 // Expose only the approved Clubhouse doors in the home tab.
 document.body.classList.add('dcc-clubhouse-focus');
 // An explicit Ask Your Caddy action from the Yardage Book may reveal its
 // existing editable composer; never let a hidden question appear "lost".
 if(document.getElementById('dccYardageCaddyArrival')||document.getElementById('aiInput')?.dataset.yardageDraftContext){
  document.body.classList.remove('dcc-clubhouse-focus');
 }
 const nav=document.getElementById('tab-play');
 if(nav){
  nav.setAttribute('aria-label','The Clubhouse');
  nav.title='The Clubhouse';
  const title=nav.querySelector('.dcc-tab-title');
  if(title)title.textContent='The Clubhouse';
  nav.addEventListener('click',()=>document.body.classList.add('dcc-clubhouse-focus'));
 }
 document.getElementById('dccLedgerArchive')?.addEventListener('click',()=>{
  openTab('games');
  const archive=document.getElementById('dccSavedGamesPanel');
  if(!archive)return;
  archive.open=true;
  archive.scrollIntoView({block:'start'});
  archive.querySelector('summary')?.focus({preventScroll:true});
 });
 function syncHole(){const hole=selectedHole();const label=document.getElementById('dccHomeHole');const link=document.getElementById('dccHomeYardage');if(label)label.textContent='HOLE '+hole;if(link)link.href='yardage-preview.html?hole='+hole}
 syncHole();
 section.addEventListener('click',function(e){
  const button=e.target.closest('[data-dcc-go]');
  if(!button)return;
  const target=button.dataset.dccGo;
  if(target==='score')openScorecard();
  else if(target==='games'){openTab('games');document.getElementById('gamesMenu')?.scrollIntoView({block:'start'})}
  else if(target==='ghost'){
   openTab('games');
   const ghost=document.getElementById('dccR91SoloPanel');
   if(ghost){ghost.open=true;ghost.scrollIntoView({block:'start'});}
  }
  else if(target==='handicap'){openHandicapPopup()}
  else if(target==='course'){
   const dialog=document.getElementById('dccHomeCourseDialog');
   if(dialog&&!dialog.open)dialog.showModal();
   document.getElementById('dccHomeCourseSearch')?.focus();
  }
  else if(target==='ledger'){openTab('bets')}
  else if(target==='ticket'){openTab('bets');document.getElementById('dccPropBets')?.scrollIntoView({block:'start'})}
  else if(target==='money'){openTab('bets');document.querySelector('#moneyRoomSection [data-r62-open="roomSetup"]')?.click();document.getElementById('moneyRoomSection')?.scrollIntoView({block:'start'})}
  else if(target==='caddy'){caddy.scrollIntoView({block:'start',behavior:'instant'})}
  else if(target==='bag'||target==='settings'){openTab(target)}
 });
 // Direct popup; the existing Firebase Golfer Memory editor remains the only writer.
 const handicapDialog=section.querySelector('#dccHomeHandicapDialog');
 const handicapInput=section.querySelector('#dccHomeHandicapInput');
 const handicapStatus=section.querySelector('#dccHomeHandicapStatus');
 const handicapSave=section.querySelector('#dccHomeHandicapSave');
 function openHandicapPopup(){
  const source=document.getElementById('golferHandicap');
  handicapInput.value=source?.value||'';
  handicapSave.disabled=!source||source.disabled;
  handicapStatus.textContent=!source?'Golfer Memory is not available. Try reopening Dagger.':source.disabled?'Sign in to your permanent Golfer Account to edit your index.':'Your index is saved to your existing Golfer Memory.';
  if(!handicapDialog.open)handicapDialog.showModal();
 }
 section.querySelector('#dccHomeHandicapClose').addEventListener('click',()=>handicapDialog.close());
 handicapSave.addEventListener('click',()=>{
  const source=document.getElementById('golferHandicap');
  const originalSave=document.getElementById('saveGolferProfile');
  const raw=handicapInput.value.trim();const value=Number(raw);
  if(!source||!originalSave||source.disabled||originalSave.disabled){handicapStatus.textContent='Golfer Memory is not ready. Sign in to your Golfer Account.';return}
  if(!raw||!Number.isFinite(value)||value< -10||value>54||Math.round(value*10)!==value*10){handicapStatus.textContent='Enter an index from -10.0 to 54.0, in tenths.';return}
  source.value=raw;
  source.dispatchEvent(new Event('input',{bubbles:true}));
  originalSave.click();
  handicapStatus.textContent='Saving to Golfer Memory…';
  handicapSave.disabled=true;
  const realStatus=document.getElementById('golferProfileStatus');
  if(!realStatus){handicapSave.disabled=false;handicapStatus.textContent='Save status unavailable.';return}
  const observer=new MutationObserver(()=>{
   const message=realStatus.textContent||'';
   if(/Handicap Index saved to Golfer Memory!/i.test(message)){
    observer.disconnect();handicapSave.disabled=false;handicapDialog.close();
    const header=document.getElementById('dccR106Handicap');if(header)header.textContent='HCP '+value.toFixed(1);
   }else if(/Could not save:|Please sign in|Enter a valid Handicap/i.test(message)){
    observer.disconnect();handicapSave.disabled=false;handicapStatus.textContent=message;
   }
  });
  observer.observe(realStatus,{childList:true,characterData:true,subtree:true});
 });
 // Intercept the legacy banner click before its incorrect Settings navigation.
 document.addEventListener('click',event=>{
  if(event.target.closest('#dccR106Handicap')){event.preventDefault();event.stopImmediatePropagation();openHandicapPopup()}
 },true);
 // Existing navigation handlers remain intact; these two doors are simply off the bottom bar.
 for(const tabName of ['bag','settings']){
  const sections=Array.from(document.querySelectorAll('[data-tab="'+tabName+'"]')).filter(el=>el.tagName==='SECTION');
  const first=sections[0];
  if(!first||document.getElementById('dccReturnFrom'+tabName))continue;
  const button=document.createElement('button');button.type='button';
  button.id='dccReturnFrom'+tabName;button.className='dcc-home-return';
  button.textContent='← Back to The Clubhouse';
  button.addEventListener('click',()=>openTab('play'));
  first.insertBefore(button,first.firstChild);
 }
 section.querySelector('#dccHomeYardage').addEventListener('click',syncHole);
 // Keep the House Ghost's real character picker in The Grounds as the source
 // of truth for the cinematic preview. Never modify a wager or match score.
 const ghostTier=document.getElementById('dccGhostTier');
 if(ghostTier){
  const saveGhostTier=()=>{try{sessionStorage.setItem('dccGhostPreviewTier',ghostTier.value)}catch{}};
  saveGhostTier();
  ghostTier.addEventListener('change',saveGhostTier);
 }
 window.addEventListener('pageshow',syncHole);

}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();