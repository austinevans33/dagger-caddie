// Starter's Desk UI prototype. No fictitious course search results.
// Opens on member request until a verified course catalog is connected.
import {readActiveRound,clearActiveRound} from './starters-desk-session.js';
export function mountStartersDesk({doc=document,storage=localStorage}={}){
 if(doc.getElementById('dcc-starter-open'))return;
 const style=doc.createElement('style');
 style.textContent=`
 #dcc-starter-open{border:1px solid #b79c62;background:#173528;color:#f3e9d3;border-radius:12px;padding:10px 14px;font:700 12px system-ui;cursor:pointer}
 #dcc-starter-dialog{border:1px solid #b79c62;border-radius:18px;background:#f5f0e5;color:#143126;max-width:min(92vw,490px);width:100%;padding:0;box-shadow:0 15px 60px #0008}
 #dcc-starter-dialog::backdrop{background:#101e19b8}
 .dcc-starter-head{background:#173528;color:#f3e9d3;text-align:center;padding:28px 22px;border-radius:17px 17px 0 0}
 .dcc-starter-eyebrow{color:#d8ba77;letter-spacing:.18em;font:800 10px system-ui}
 .dcc-starter-head h2{font:normal 30px Georgia,serif;margin:10px 0}
 .dcc-starter-body{padding:24px;display:grid;gap:14px}
 .dcc-starter-body p{margin:0;line-height:1.5}
 .dcc-starter-body button{padding:12px;border-radius:10px;border:1px solid #b79c62;background:#173528;color:#f3e9d3;cursor:pointer}
 .dcc-starter-body button.secondary{background:transparent;color:#173528}
 `;
 doc.head.append(style);
 const button=doc.createElement('button');button.id='dcc-starter-open';button.type='button';button.textContent='THE STARTER’S DESK';
 const dialog=doc.createElement('dialog');dialog.id='dcc-starter-dialog';
 dialog.setAttribute('aria-label','Dagger Country Club Starter’s Desk');
 dialog.innerHTML=`<div class="dcc-starter-head"><div class="dcc-starter-eyebrow">DAGGER COUNTRY CLUB · THE FIRST TEE</div><h2>The Starter’s Desk</h2><p>“Where shall we be conducting today’s investigation into your handicap?”</p></div><div class="dcc-starter-body"><p id="dcc-starter-current"></p><p>Course and tee selection is being connected to a verified golf course catalog. No imaginary yardages will be issued by the committee.</p><button class="secondary" id="dcc-starter-later" type="button">Return to the Clubhouse</button></div>`;
 button.addEventListener('click',()=>{
  const active=readActiveRound(storage);
  dialog.querySelector('#dcc-starter-current').textContent=active?`Checked in: ${active.selection.course.name} · ${active.selection.tee.name} · Hole ${active.selection.holeNumber}`:'No course checked in yet.';
  if(!dialog.open)dialog.showModal();
 });
 dialog.querySelector('#dcc-starter-later').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
 const mast=doc.querySelector('.app-shell .mast')||doc.querySelector('[data-tab="settings"]')||doc.body;
 mast.append(button);doc.body.append(dialog);
 return {open:()=>button.click(),clear:()=>clearActiveRound(storage)};
}
