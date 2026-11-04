// Remember which on-course tab opened the Yardage Book.
// Navigation-only: no score, game, wager, or Firebase writes.
const KEY='dccYardageReturnTab_v1';
const valid=new Set(['play','games','bets']);
export function rememberYardageOrigin(session,tab){
 if(!valid.has(tab))return false;
 try{session.setItem(KEY,tab);return true}catch{return false}
}
export function takeYardageOrigin(session){
 try{const tab=session.getItem(KEY);session.removeItem(KEY);return valid.has(tab)?tab:null}catch{return null}
}
function install(){
 document.addEventListener('click',event=>{
  const link=event.target.closest?.('a[href*="yardage-preview.html"]');
  if(!link)return;
  const panel=link.closest('[data-tab]');
  rememberYardageOrigin(sessionStorage,valid.has(panel?.dataset.tab)?panel.dataset.tab:'play');
 },true);
 // Return only once. The existing tab click handler owns visibility and rendering.
 const destination=takeYardageOrigin(sessionStorage);
 if(destination&&destination!=='play'){
  const tab=document.getElementById('tab-'+destination);
  if(tab)tab.click();
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
