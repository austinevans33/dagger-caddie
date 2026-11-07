/* Dagger on-course UX: compact growing game catalog and a genuine caddy turn.
   The real game engine and AI composer remain mounted; this script only changes
   the surrounding navigation/presentation. No score, wager or backend writes. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const CADDIES={
 keith:{name:'Keith',role:'Head Caddy',photo:'keith_portrait.png'},
 reginald:{name:'Reginald',role:'Traditions',photo:'reginald_portrait.png'},
 vinny:{name:'Vinny',role:'Wagering',photo:'vinny_portrait.png'},
 kyle:{name:'Kyle',role:'Almost enlisted',photo:'kyle_portrait.png'}
};
function caddyId(){
 try{
  const saved=localStorage.getItem('dagger_selected_caddie');
  if(saved){
   let id=saved;
   try{id=JSON.parse(saved)}catch{}
   if(typeof id==='string'&&Object.hasOwn(CADDIES,id))return id;
  }
 }catch{}
 const active=document.querySelector('.staff-pick.active[data-caddie]')?.dataset.caddie;
 return Object.hasOwn(CADDIES,active)?active:'keith';
}
function mountGamePicker(){
 const section=$('gamesMenu');
 if(!section||$('dccGameLibraryToggle'))return;
 const heading=section.querySelector('.games-desk-heading');
 const choices=$('dccGameChoices');
 if(!heading||!choices)return;
 const count=choices.querySelectorAll('button.game-pick').length;
 const state=document.createElement('p');state.id='dccGameLibraryCurrent';
 state.className='dcc-game-library-current';state.hidden=true;
 const toggle=document.createElement('button');toggle.id='dccGameLibraryToggle';
 toggle.type='button';toggle.className='dcc-game-library-toggle';
 toggle.setAttribute('aria-controls','dccGameChoices');
 toggle.setAttribute('aria-expanded','false');
 const title=heading.querySelector('h2');if(title)title.textContent='Choose a Game';
 heading.append(toggle,state);
 let pickedByGolfer=false;
 function syncSelected(){
  const selected=choices.querySelector('.game-pick.selected');
  const name=selected?.querySelector('strong')?.textContent?.trim();
  const clean=typeof name==='string'?name.replace(/^[^A-Za-z0-9]+/,'').trim():'';
  state.hidden=!pickedByGolfer||!clean;
  if(!state.hidden)state.textContent='Your pick · '+clean;
 }
 // The original markup preselects Bingo for its internal scorer. That does
 // not mean the golfer has chosen it; never show a misleading "Selected:" line.
 choices.addEventListener('click',event=>{
  if(!event.target.closest('button.game-pick'))return;
  pickedByGolfer=true;
  queueMicrotask(syncSelected);
 });
 new MutationObserver(syncSelected).observe(choices,{subtree:true,attributes:true,attributeFilter:['class']});
 let open=false;
 function setOpen(value){
  open=!!value;
  section.dataset.dccCollapsed=open?'false':'true';
  toggle.setAttribute('aria-expanded',String(open));
  toggle.textContent=open?'Close Games':'Browse '+count+' Games';
 }
 setOpen(false);
 toggle.addEventListener('click',()=>{
  // On iPhone, focusing the search field automatically raises the keyboard.
  // Browsing the game list is not a search action; let golfers tap search explicitly.
  setOpen(!open);
 });
 // A user searching for games outside this menu still gets the real list.
 document.addEventListener('focusin',event=>{
  if(!open&&event.target===$('dccGameSearch'))setOpen(true);
 });
}
function returnHole(){
 let hole=1;
 try{const n=Number(sessionStorage.getItem('dccCaddyReturnHole'));if(Number.isInteger(n)&&n>=1&&n<=18)hole=n;}catch{}
 try{sessionStorage.removeItem('dccCaddyTurn');}catch{}
 location.assign('yardage-preview.html?hole='+hole);
}
function mountCaddyTurn(){
 const ai=document.querySelector('section.ai-card[data-tab="play"]');
 if(!ai||$('dccCaddyTurnHead'))return;
 const heading=ai.querySelector('.dcc-caddy-heading');
 if(!heading)return;
 const bar=document.createElement('section');bar.id='dccCaddyTurnHead';bar.className='dcc-caddy-turn-head';
 bar.setAttribute('aria-label','Your on-course caddy');
 bar.innerHTML='<div class="dcc-caddy-turn-top"><button type="button" id="dccBackToHole">← Back to hole</button><button type="button" id="dccTurnChangeCaddy">Change caddy</button></div><div class="dcc-caddy-turn-person"><img id="dccTurnPortrait" alt="" loading="eager"><div><small>ON YOUR BAG</small><h2 id="dccTurnName"></h2><p id="dccTurnRole"></p></div></div><p class="dcc-caddy-turn-prompt">What are we thinking on this shot?</p>';
 heading.before(bar);
 function refresh(){
  const id=caddyId(),caddy=CADDIES[id];
  $('dccTurnPortrait').src=caddy.photo;
  $('dccTurnPortrait').alt=caddy.name+' portrait';
  $('dccTurnName').textContent=caddy.name;
  $('dccTurnRole').textContent=caddy.role;
 }
 $('dccBackToHole').addEventListener('click',returnHole);
 $('dccTurnChangeCaddy').addEventListener('click',()=>{
  const starter=$('dcc-starter-open');
  if(starter)starter.click();
  else{
   // Fall back to the original roster without rewriting its selection logic.
   document.body.classList.remove('dcc-caddy-turn');
   document.querySelector('.caddie-roster')?.scrollIntoView({block:'start'});
  }
 });
 document.addEventListener('dcc:caddy-selected',refresh);
 document.querySelectorAll('.staff-pick[data-caddie]').forEach(pick=>pick.addEventListener('click',refresh));
 window.addEventListener('storage',event=>{if(event.key==='dagger_selected_caddie')refresh()});
 refresh();
 let activated=false;
 try{activated=sessionStorage.getItem('dccCaddyTurn')==='1'}catch{}
 if(!activated)return;
 $('tab-play')?.click();
 document.body.classList.remove('dcc-clubhouse-focus');
 document.body.classList.add('dcc-caddy-turn');
 // An explicit Clubhouse tab selection exits the conversation cleanly.
 $('tab-play')?.addEventListener('click',()=>{
  try{sessionStorage.removeItem('dccCaddyTurn')}catch{}
  document.body.classList.remove('dcc-caddy-turn');
  document.body.classList.add('dcc-clubhouse-focus');
 });
 // Keep the actual AI input, handler and history, rather than creating a fake assistant.
 ai.scrollIntoView({block:'start',behavior:'instant'});
 // Auto focus can cause Safari to zoom/jump; focus after user taps into the input.
}
function mount(){mountGamePicker();mountCaddyTurn();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();