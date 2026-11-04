/* Dagger Clubhouse: navigation facade only. Do not own scoring, bets or round state. */
(function(){
'use strict';
function openTab(id){
 const tab=document.getElementById('tab-'+id);
 if(tab)tab.click();
}
function selectedHole(){
 try{const h=Number(sessionStorage.getItem('dccFridayYardageHole'));return Number.isInteger(h)&&h>=1&&h<=18?h:1}catch{return 1}
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
 section.innerHTML=`
 <header class="dcc-home-header"><div><div class="dcc-home-kicker">DAGGER COUNTRY CLUB</div><h2>The Clubhouse</h2></div><img class="dcc-home-seal" src="dcc-approved-seal.png" alt="Dagger Country Club circular seal"></header>
 <a class="dcc-home-feature" id="dccHomeYardage" href="yardage-preview.html?hole=1">
  <span class="dcc-home-line"><span>YOUR ROUND · <span id="dccHomeHole">HOLE 1</span></span><span class="dcc-home-hole">YARDAGE BOOK</span></span>
  <strong class="dcc-home-feature-title">Yardage Book</strong>
  <span class="dcc-home-feature-description">A place for the hole, the yardages, and your caddy. Course distances show only when verified.</span>
  <span class="dcc-home-view"><span>▤ &nbsp; View the hole</span><span aria-hidden="true">›</span></span>
 </a>
 <div class="dcc-home-grid">
  <button class="dcc-home-tile" type="button" data-dcc-go="games"><span class="dcc-home-tile-icon" aria-hidden="true">♜</span><span class="dcc-home-tile-name">Games</span><span class="dcc-home-tile-caption">Your matches</span></button>
  <a class="dcc-home-tile" href="ghost-preview.html"><span class="dcc-home-tile-icon" aria-hidden="true">♧</span><span class="dcc-home-tile-name">House Ghost</span><span class="dcc-home-tile-caption">Simulated shot action</span></a>
  <button class="dcc-home-tile" type="button" data-dcc-go="ticket"><span class="dcc-home-tile-icon" aria-hidden="true">▣</span><span class="dcc-home-tile-name">Ticket Window</span><span class="dcc-home-tile-caption">Open wagers</span></button>
  <button class="dcc-home-tile" type="button" data-dcc-go="ledger"><span class="dcc-home-tile-icon" aria-hidden="true">▤</span><span class="dcc-home-tile-name">Ledger</span><span class="dcc-home-tile-caption">Balances &amp; Money Room</span></button>
 </div>
 <button class="dcc-home-caddy" type="button" data-dcc-go="caddy"><span><span aria-hidden="true">◉</span> Ask Your Caddy</span><span aria-hidden="true">›</span></button>
 <div class="dcc-home-foot">THE CLUBHOUSE · YOUR ROUND, YOUR GAMES, YOUR ACTION</div>`;
 caddy.parentNode.insertBefore(section,caddy);
 function syncHole(){const hole=selectedHole();const label=document.getElementById('dccHomeHole');const link=document.getElementById('dccHomeYardage');if(label)label.textContent='HOLE '+hole;if(link)link.href='yardage-preview.html?hole='+hole}
 syncHole();
 section.addEventListener('click',function(e){
  const button=e.target.closest('[data-dcc-go]');
  if(!button)return;
  const target=button.dataset.dccGo;
  if(target==='games'){openTab('games');document.getElementById('gamesMenu')?.scrollIntoView({block:'start'})}
  else if(target==='ledger'){openTab('bets');document.getElementById('moneyRoomSection')?.scrollIntoView({block:'start'})}
  else if(target==='ticket'){openTab('bets');document.getElementById('dccPropNew')?.click()}
  else if(target==='caddy'){caddy.scrollIntoView({block:'start',behavior:'instant'})}
 });
 section.querySelector('#dccHomeYardage').addEventListener('click',syncHole);
 window.addEventListener('pageshow',syncHole);
 const nav=document.getElementById('tab-play');
 if(nav){nav.setAttribute('aria-label','The Clubhouse and Caddy');nav.title='The Clubhouse and Caddy';const caption=nav.querySelector('.dcc-tab-title');if(caption)caption.textContent='Clubhouse'}
 const settings=document.getElementById('tab-settings');
 if(settings){settings.setAttribute('aria-label','Member Desk');settings.title='Member Desk';const caption=settings.querySelector('.dcc-tab-title');if(caption)caption.textContent='Member Desk'}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();