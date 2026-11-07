// Carry a Yardage Book question into the existing caddy composer in one tap.
// No new form, no automatic AI send, and no score/bet mutation.
import {takeHoleQuestion} from './yardage-caddy-handoff.js?v=friday-book-1';
function install(){
 const draft=takeHoleQuestion(sessionStorage,Date.now(),{withContext:true});
 if(!draft)return;
 const field=document.getElementById('aiInput');
 if(!field)return;
 document.body.classList.remove('dcc-clubhouse-focus');
 // Preserve a user's unfinished typed message instead of silently deleting it.
 const occupied=field.value.trim().length>0;
 function apply(){
  field.dataset.yardageDraftContext=JSON.stringify(draft.context);
  document.dispatchEvent(new CustomEvent('dcc:yardage-caddy-context',{detail:draft.context}));
  field.value=draft.question;
  field.dispatchEvent(new Event('input',{bubbles:true}));
  field.focus({preventScroll:true});
  field.scrollIntoView({block:'center'});
 }
 document.getElementById('tab-play')?.click();
 if(!occupied){apply();return;}
 const bar=document.createElement('div');
 bar.id='dccYardageCaddyArrival';
 bar.className='dcc-yardage-caddy-arrival';
 bar.style.cssText='display:flex;align-items:center;gap:10px;flex-wrap:wrap;width:100%;margin:10px 0;padding:10px 12px;background:#e8e0c8;color:#183c2b;border:1px solid #b49a60;border-radius:12px;font:600 13px/1.4 system-ui';
 const note=document.createElement('span');note.textContent='Hole question ready';
 note.style.cssText='flex:1 1 120px;min-width:0';
 const button=document.createElement('button');button.type='button';button.textContent='Use question';
 button.style.cssText='flex:0 0 auto;max-width:100%;min-height:44px;padding:8px 12px;border-radius:9px;background:#173c2c;color:#fff4d9;font:700 13px system-ui';
 button.addEventListener('click',()=>{apply();bar.remove()});
 bar.append(note,button);
 const anchor=field.closest('.ai-row');
 (anchor?.parentNode||field.parentElement).insertBefore(bar,anchor||null);
 bar.scrollIntoView({block:'nearest'});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
