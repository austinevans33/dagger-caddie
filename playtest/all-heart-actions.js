// Explicit action routing for All Heart. A dare opens the existing Ticket
// Window proposal UI; it never submits a bet or changes a score.
export function installAllHeartActions({document:doc=globalThis.document}={}){
 if(!doc?.addEventListener)return ()=>{};
 const onAccept=event=>{
  const moment=event?.detail?.moment;
  if(!moment || typeof moment!=='object')return;
  if(moment.type==='dare' && moment.action==='open-ticket-window'){
   const tab=doc.getElementById?.('tab-bets');
   const opener=doc.getElementById?.('dccPropNew');
   const form=doc.getElementById?.('dccPropFormWrap');
   if(!tab || !opener || !form)return;
   tab.click();
   if(!form.open)opener.click();
   doc.getElementById?.('dccPropText')?.focus?.();
   return;
  }
  if((moment.type==='grudge'||moment.type==='legend'||moment.type==='dare') && moment.action==='accept-challenge'){
   // An opt-in challenge is informational until the round engine explicitly
   // records it. No synthetic score or wager is generated here.
   doc.dispatchEvent(new CustomEvent('dcc:all-heart-challenge-selected',{
    detail:{roundKey:event.detail.roundKey,moment}
   }));
  }
 };
 doc.addEventListener('dcc:all-heart-accepted',onAccept);
 return ()=>doc.removeEventListener('dcc:all-heart-accepted',onAccept);
}
