import {mountAllHeartMoment} from './all-heart-moment-card.js';

// A round controller must dispatch 'dcc:all-heart-context' with a trusted,
// verified context and roundKey. Never derive hole, score or wagers from DOM.
export function installAllHeartBridge({document:doc=globalThis.document}={}){
 if(!doc?.addEventListener)return ()=>{};
 let activeRound=null,shown=new Set(),dismissed=new Set(),lastShownHole=-99;
 let shownCount=0,enabled=true;
 const onContext=event=>{
  const detail=event?.detail;
  if(!detail || typeof detail!=='object' || typeof detail.roundKey!=='string' || !detail.roundKey.trim())return;
  if(detail.roundKey!==activeRound){
   activeRound=detail.roundKey;shown=new Set();dismissed=new Set();lastShownHole=-99;shownCount=0;
  }
  const root=doc.getElementById?.('dccAllHeartMoment');
  if(!root)return;
  const context=detail.context;
  if(!context || context.roundActive!==true || context.verifiedCourse!==true){root.replaceChildren();return;}
  const moment=mountAllHeartMoment({root,
   context:{...context,enabled:enabled&&context.enabled!==false},
   history:{shownKeys:[...shown],dismissedKeys:[...dismissed],lastShownHole,shownCount},
   onAccept:m=>{
    // Consumer must explicitly handle the action; never write bets or scores.
    doc.dispatchEvent(new CustomEvent('dcc:all-heart-accepted',{detail:{roundKey:activeRound,moment:m}}));
   },
   onDismiss:m=>{dismissed.add(m.key)}
  });
  if(moment){shown.add(moment.key);shownCount++;lastShownHole=context.holeNumber}
 };
 const onToggle=event=>{if(typeof event?.detail?.enabled==='boolean')enabled=event.detail.enabled};
 doc.addEventListener('dcc:all-heart-context',onContext);
 doc.addEventListener('dcc:all-heart-enabled',onToggle);
 return ()=>{
  doc.removeEventListener('dcc:all-heart-context',onContext);
  doc.removeEventListener('dcc:all-heart-enabled',onToggle);
 };
}
