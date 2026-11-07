// Yardage Book question arrives as an editable draft, never an automatic AI request.
import {takeHoleQuestion} from './yardage-caddy-handoff.js?v=friday-book-1';
function install(){
 const draft=takeHoleQuestion(sessionStorage,Date.now(),{withContext:true});
 if(!draft)return;
 // The Clubhouse is normally intentionally minimal. A golfer who explicitly
 // taps Ask Caddy in the Yardage Book may open the editor without losing it.
 document.body.classList.remove('dcc-clubhouse-focus');
 const field=document.getElementById('aiInput');
 if(!field)return;
 const composer=field.closest('.ai-card')||field.parentElement;
 const note=document.createElement('div');
 note.id='dccYardageCaddyArrival';
 note.setAttribute('role','status');
 note.className='dcc-yardage-caddy-arrival';
 const label=document.createElement('span');
 label.textContent='✎ Yardage Book question ready · review before sending';
 const button=document.createElement('button');
 button.type='button';
 button.textContent='Use hole question';
 function populate(){
  field.dataset.yardageDraftContext=JSON.stringify(draft.context);
  document.dispatchEvent(new CustomEvent('dcc:yardage-caddy-context',{detail:draft.context}));
  field.value=draft.question;
  field.dispatchEvent(new Event('input',{bubbles:true}));
  field.scrollIntoView({block:'center'});
  field.focus({preventScroll:true});
  note.remove();
 }
 button.addEventListener('click',populate);
 note.append(label,button);
 const anchor=field.closest('.ai-row');
 (anchor?.parentNode||composer).insertBefore(note,anchor||null);
 document.getElementById('tab-play')?.click();
 // Never replace any draft automatically. A single explicit tap inserts the hole question.
 note.scrollIntoView({block:'nearest'});
}
// Module scripts run after markup parsing. Avoid waiting for unrelated SDK modules.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
