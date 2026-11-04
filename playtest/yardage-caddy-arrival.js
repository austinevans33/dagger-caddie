// Yardage Book question arrives as an editable draft, never an automatic AI request.
import {takeHoleQuestion} from './yardage-caddy-handoff.js';
function install(){
 const question=takeHoleQuestion(sessionStorage);
 if(!question)return;
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
  field.value=question;
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
// Wait for the page's existing draft initialization before deciding whether to prefill.
if(document.readyState==='complete')install();else document.addEventListener('DOMContentLoaded',install,{once:true});
