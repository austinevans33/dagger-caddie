/* Dagger Ledger: one visible sportsbook desk. The original wager and room engines remain intact. */
(function(){'use strict';
const $=id=>document.getElementById(id);
function mount(){
 const desk=$('dccPropBets');if(!desk||$('dccSimpleLedger'))return;
 desk.classList.add('dcc-simple-ledger');
 const mount=document.createElement('div');mount.id='dccSimpleLedger';
 mount.innerHTML='<div class="dcc-simple-head"><small>DAGGER COUNTRY CLUB</small><h2>The Ledger</h2><p>All bets are gentlemen\'s agreements. Allegedly.</p></div><div class="dcc-simple-numbers"><div><small>LIFETIME BETS</small><strong id="dccSimpleBetCount">0</strong></div><div><small>LIFETIME NET</small><strong id="dccSimpleNet">$0.00</strong></div></div><button type="button" id="dccSimpleWrite">♧ &nbsp; Write a Ticket</button><div class="dcc-simple-tickets"><div class="dcc-simple-tickets-title"><strong>My Tickets</strong><span id="dccSimpleOpen">Open · Settled</span></div><div id="dccSimpleListHost"></div><details id="dccSimpleHistory"><summary>Match History</summary><div id="dccSimpleHistoryBody"></div></details></div><a class="dcc-simple-recap" href="19th-hole.html"><strong>The 19th Hole <span>›</span></strong><small>Round recap & bragging rights</small></a><details class="dcc-simple-room"><summary>Live Money Room</summary><div id="dccSimpleRoomHost"></div></details>';
 desk.insertBefore(mount,desk.firstChild);
 const ticket=$('dccPropList'),list=$('dccSimpleListHost');
 if(ticket)list.append(ticket); // preserve original delegated click handlers
 const balances=$('dccPropBalances');
 if(balances){balances.classList.add('dcc-simple-balances');list.append(balances);}
 const original=$('dccPropNew');
 $('dccSimpleWrite').addEventListener('click',()=>{original?.click();const form=$('dccPropFormWrap');if(form?.open)form.scrollIntoView({block:'nearest'});});
 const form=$('dccPropFormWrap');if(form)mount.insertBefore(form,mount.querySelector('.dcc-simple-tickets'));
 // Relocate instead of cloning existing records; retain listeners and data.
 const history=$('dccSimpleHistoryBody');
 for(const selector of ['#dccPropHistoryWrap','#dccR77RecordsDrawer','.dcc-r60-legacy-ticket[data-tab="bets"]','.dcc-r60-archives[data-tab="bets"]']){
  const node=document.querySelector(selector);
  if(node&&!history.contains(node)){node.removeAttribute('data-tab');node.classList.remove('hidden-panel');node.removeAttribute('inert');node.removeAttribute('aria-hidden');history.append(node);}
 }
 const records=$('clubRecordsSection');
 if(records&&!history.contains(records)){records.removeAttribute('data-tab');records.classList.remove('hidden-panel');records.removeAttribute('inert');records.removeAttribute('aria-hidden');history.append(records);}
 const room=$('moneyRoomSection');
 if(room){room.removeAttribute('data-tab');room.classList.remove('hidden-panel');room.removeAttribute('inert');room.removeAttribute('aria-hidden');$('dccSimpleRoomHost').append(room);}
 const recap=$('dcc19thHole');if(recap)recap.hidden=true;
 document.addEventListener('click',e=>{if(e.target.closest('[data-dcc-door="money"],#dccGamesMoneyRoom')){const roomDrawer=desk.querySelector('.dcc-simple-room');if(roomDrawer)roomDrawer.open=true;}},true);
 const sync=()=>{
  let records=[];try{const data=JSON.parse(localStorage.getItem('dcc_side_bets_local_r66_v1')||'[]');if(Array.isArray(data))records=data.filter(b=>b&&b.id&&b.text);}catch{}
  $('dccSimpleBetCount').textContent=String(records.length);
  const net=$('dccPropTotal');$('dccSimpleNet').textContent=net?.textContent||'$0.00';
  const open=$('dccPropOpenCount')?.textContent||'0';$('dccSimpleOpen').textContent=open+' open · Settled';
 };
 sync();if(ticket)new MutationObserver(sync).observe(ticket,{childList:true,subtree:true});
 window.addEventListener('storage',sync);
 // Match-history wrappers are already in one disclosure; avoid automatically expanding them.
 const old=$('dccPropHistoryWrap');if(old)old.open=true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();