/* Dagger Clubhouse: navigation facade only. Do not own scoring, bets or round state. */
import {readYardageHole} from './yardage-navigation.js';
(function(){
'use strict';
function openTab(id){
 const tab=document.getElementById('tab-'+id);
 if(tab)tab.click();
}
function selectedHole(){return readYardageHole({session:sessionStorage,local:localStorage})}
function mount(){
 if(document.getElementById('dccClubhouseHome'))return;
 const caddy=document.querySelector('section.caddie-roster[data-tab="play"]');
 if(!caddy||!caddy.parentNode)return;
 const section=document.createElement('section');
 section.id='dccClubhouseHome';
 section.className='dcc-home';
 section.dataset.tab='play';
 section.setAttribute('aria-label','Dagger Country Club Clubhouse shortcuts');
 section.innerHTML=`
 <header class="dcc-home-header"><div><div class="dcc-home-kicker">DAGGER COUNTRY CLUB</div><h2>The Clubhouse</h2></div><img class="dcc-home-seal" src="dcc-approved-seal.png" alt="Dagger Country Club circular seal"></header>
 <a class="dcc-home-feature" id="dccHomeYardage" href="yardage-preview.html?hole=1">
  <span class="dcc-home-line"><span>YOUR YARDAGE BOOK · <span id="dccHomeHole">HOLE 1</span></span><span class="dcc-home-hole">YARDAGE BOOK</span></span>
  <strong class="dcc-home-feature-title">Yardage Book</strong>
  <span class="dcc-home-feature-description">Your hole, course notes and caddy—without leaving the round behind.</span>
  <span class="dcc-home-view"><span>▤ &nbsp; View the hole</span><span aria-hidden="true">›</span></span>
 </a>
 <div class="dcc-home-grid">
  <button class="dcc-home-tile" type="button" data-dcc-go="games"><span class="dcc-home-tile-icon" aria-hidden="true">♜</span><span class="dcc-home-tile-name">Games</span><span class="dcc-home-tile-caption">Your matches</span></button>
  <a class="dcc-home-tile" href="ghost-preview.html"><span class="dcc-home-tile-icon" aria-hidden="true">♧</span><span class="dcc-home-tile-name">House Ghost</span><span class="dcc-home-tile-caption">Simulated shot action</span></a>
  <button class="dcc-home-tile" type="button" data-dcc-go="ticket"><span class="dcc-home-tile-icon" aria-hidden="true">▣</span><span class="dcc-home-tile-name">Ticket Window</span><span class="dcc-home-tile-caption">Open wagers</span></button>
  <button class="dcc-home-tile" type="button" data-dcc-go="ledger"><span class="dcc-home-tile-icon" aria-hidden="true">▤</span><span class="dcc-home-tile-name">Ledger</span><span class="dcc-home-tile-caption">Balances &amp; statements</span></button>
 </div>
 <button class="dcc-home-money" type="button" data-dcc-go="money"><span><strong>◉ Live Money Room</strong><small>Start or join · host QR code</small></span><span aria-hidden="true">›</span></button>
`;
 caddy.parentNode.insertBefore(section,caddy);
 // Retain the entire original header, saved state, and caddy infrastructure.
 // Expose only the approved Clubhouse doors in the home tab.
 document.body.classList.add('dcc-clubhouse-focus');
 const nav=document.getElementById('tab-play');
 if(nav){
  nav.setAttribute('aria-label','The Clubhouse');
  nav.title='The Clubhouse';
  const title=nav.querySelector('.dcc-tab-title');
  if(title)title.textContent='The Clubhouse';
  nav.addEventListener('click',()=>document.body.classList.add('dcc-clubhouse-focus'));
 }
 const groundsHeader=document.querySelector('section.dcc-competition-portal[data-tab="games"]');
 if(groundsHeader&&!document.getElementById('dccGroundsDoors')){
  const doors=document.createElement('section');
  doors.id='dccGroundsDoors';doors.dataset.tab='games';
  doors.setAttribute('aria-label','Grounds shortcuts');
  doors.innerHTML='<div class="dcc-grounds-door-grid">'+
   '<a href="yardage-preview.html" id="dccGroundsBook" class="dcc-grounds-door"><span aria-hidden="true">▤</span><strong>Yardage Book</strong></a>'+
   '<button type="button" class="dcc-grounds-door" data-dcc-door="ticket"><span aria-hidden="true">▣</span><strong>Ticket Window</strong></button>'+
   '<button type="button" class="dcc-grounds-door" data-dcc-door="money"><span aria-hidden="true">♟</span><strong>Money Room</strong></button>'+
   '<button type="button" class="dcc-grounds-door" data-dcc-door="score"><span aria-hidden="true">□</span><strong>Scorecard</strong></button>'+
   '</div>';
  groundsHeader.after(doors);
  doors.addEventListener('click',e=>{
   const action=e.target.closest('[data-dcc-door]')?.dataset.dccDoor;
   if(action==='ticket'){openTab('bets');document.getElementById('dccPropBets')?.scrollIntoView({block:'start'})}
   if(action==='money'){openTab('bets');document.getElementById('moneyRoomSection')?.scrollIntoView({block:'start'})}
   if(action==='score'){
    // The paper scorecard's existing launcher lives in the original play tab.
    document.body.classList.remove('dcc-clubhouse-focus');
    const launch=document.getElementById('dccScorePulseOpen');
    if(launch)launch.click();else openTab('play');
   }
  });
  doors.querySelector('#dccGroundsBook').addEventListener('click',e=>{
   e.currentTarget.href='yardage-preview.html?hole='+selectedHole();
  });
 }
 function syncHole(){const hole=selectedHole();const label=document.getElementById('dccHomeHole');const link=document.getElementById('dccHomeYardage');if(label)label.textContent='HOLE '+hole;if(link)link.href='yardage-preview.html?hole='+hole}
 syncHole();
 section.addEventListener('click',function(e){
  const button=e.target.closest('[data-dcc-go]');
  if(!button)return;
  const target=button.dataset.dccGo;
  if(target==='games'){openTab('games');document.getElementById('gamesMenu')?.scrollIntoView({block:'start'})}
  else if(target==='ledger'){openTab('bets')}
  else if(target==='ticket'){openTab('bets');document.getElementById('dccPropNew')?.click()}
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
 window.addEventListener('pageshow',syncHole);

}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();