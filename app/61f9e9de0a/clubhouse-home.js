/* Dagger Clubhouse: navigation facade only. Do not own scoring, bets or round state. */
import {readYardageHole} from './yardage-navigation.js';
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
 <button class="dcc-home-course" type="button" data-dcc-go="course"><span><strong>Change Course</strong><small>Open the Starter’s Desk · keep saved rounds</small></span><span aria-hidden="true">›</span></button>
 <footer class="dcc-home-heritage" aria-label="Dagger Country Club heritage seal"><img src="dcc-approved-seal.png" alt="Dagger Country Club circular seal — As It Lies" loading="lazy"></footer>
`;
 caddy.parentNode.insertBefore(section,caddy);
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
  else if(target==='course'){
   // Reuse the existing Starter's Desk instead of creating competing course state.
   const starter=document.getElementById('dcc-starter-open');
   if(starter){starter.click();return}
   const dialog=document.getElementById('dcc-starter-dialog');
   if(dialog&&typeof dialog.showModal==='function'){if(!dialog.open)dialog.showModal();return}
   // Older builds retain course tools under Club Services.
   openTab('settings');
   const course=document.getElementById('legacyCourseTools');
   if(course){course.scrollIntoView({block:'start'});course.querySelector('#course')?.focus({preventScroll:true})}
  }
  else if(target==='ledger'){openTab('bets')}
  else if(target==='ticket'){openTab('bets');document.getElementById('dccPropBets')?.scrollIntoView({block:'start'})}
  else if(target==='money'){openTab('bets');document.querySelector('#moneyRoomSection [data-r62-open="roomSetup"]')?.click();document.getElementById('moneyRoomSection')?.scrollIntoView({block:'start'})}
  else if(target==='caddy'){caddy.scrollIntoView({block:'start',behavior:'instant'})}
  else if(target==='bag'||target==='settings'){openTab(target)}
 });
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