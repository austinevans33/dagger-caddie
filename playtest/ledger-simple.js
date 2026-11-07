/* One Ledger surface backed by the original ticket, payment, and room engines. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
function mount(){
 const desk=$('dccPropBets');
 if(!desk||$('dccSimpleLedger'))return;
 desk.classList.add('dcc-simple-ledger');
 const shell=document.createElement('div');
 shell.id='dccSimpleLedger';
 shell.innerHTML='<header class="dcc-simple-head"><small>DAGGER COUNTRY CLUB</small><h2>The Ledger</h2><p>All bets are gentlemen\'s agreements. Allegedly.</p></header>'+
  '<div class="dcc-simple-numbers"><div><small>OPEN BETS</small><strong id="dccSimpleBetCount">0</strong></div><div><small>ALL-TIME NET POSITION</small><strong id="dccSimpleNet">$0.00</strong></div></div>'+
  '<section class="dcc-simple-tickets"><div class="dcc-simple-tickets-title"><strong>My Tickets</strong><div id="dccSimpleTicketAction"></div></div><div id="dccSimpleListHost"></div></section>'+
  '<details class="dcc-simple-room"><summary>Live Money Room</summary><div id="dccSimpleRoomHost"></div></details>';
 desk.prepend(shell);
 const tickets=shell.querySelector('.dcc-simple-tickets');
 $('dccSimpleTicketAction').append($('dccPropNew'));
 $('dccSimpleListHost').append($('dccPropList'));
 tickets.append($('dccRecordedSettlements'),$('dccPropHistoryWrap'));
 const form=$('dccPropFormWrap');
 shell.insertBefore(form,tickets);
 const room=$('moneyRoomSection');
 if(room){
  room.removeAttribute('data-tab');
  room.classList.remove('hidden-panel');
  room.removeAttribute('inert');
  room.removeAttribute('aria-hidden');
  $('dccSimpleRoomHost').append(room);
 }
 const old=$('dccVisibleTickets');
 if(old)old.hidden=true;
 // Open the same connected room from every entrance, including invite recovery.
 function openRoom(){
  const drawer=shell.querySelector('.dcc-simple-room');
  if(drawer)drawer.open=true;
 }
 document.addEventListener('click',event=>{
  if(event.target.closest('[data-dcc-go="money"],[data-dcc-door="money"],#dccGamesMoneyRoom,[data-r62-open="roomSetup"]'))openRoom();
 },true);
 const live=$('roomScoreSection');
 const invited=$('roomInvitationBanner');
 const syncRoom=()=>{if(live&&!live.hidden||invited&&!invited.hidden)openRoom();};
 const roomObserver=new MutationObserver(syncRoom);
 for(const node of [live,invited])if(node)roomObserver.observe(node,{attributes:true,attributeFilter:['hidden']});
 syncRoom();
 const sync=()=>{
  $('dccSimpleBetCount').textContent=$('dccPropOpenCount')?.textContent||'0';
  $('dccSimpleNet').textContent=$('dccPropTotal')?.textContent||'$0.00';
 };
 const totals=desk.querySelector('.dcc-r66-stats');
 if(totals)new MutationObserver(sync).observe(totals,{childList:true,subtree:true});
 sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
