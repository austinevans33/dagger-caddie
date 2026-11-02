import {buildGhostRound} from './house-ghost-round.js';
import {parseGolfDistance} from './golf-distance-range.js';
import {sketchVerifiedHole} from './yardage-sketch.js';
import {classifyYardageCoverage} from './yardage-coverage.js';
import {readActiveRound} from './starters-desk-session.js';
import {getRoundEnvironment} from './round-environment.js';
import {buildCaddyCourseFacts} from './caddy-course-facts.js';
import {buildYardagePage} from './yardage-book.js';

// Standalone, opt-in paper-book overlay. No modifications to Scorecard or Money Room.
export function mountYardageBook({doc=document,storage=localStorage}={}) {
 if(doc.getElementById('dcc-yardage-open'))return;
 const css=doc.createElement('style');
 css.textContent=`
 #dcc-yardage-open{border:1px solid #b89d68;background:#183b2d;color:#f8efda;border-radius:10px;padding:10px 13px;font-weight:800;cursor:pointer}
 #dcc-yardage-dialog{background:#f3eedf;color:#213b2e;border:2px solid #ad956b;border-radius:13px;width:min(92vw,500px);max-height:87vh;overflow:auto;padding:0;box-shadow:0 25px 70px #0008}
 #dcc-yardage-dialog::backdrop{background:#0c1c17bb}
 .dcc-book-cover{padding:20px 20px 12px;text-align:center;border-bottom:2px double #ad956b}
 .dcc-book-overline{font-size:10px;letter-spacing:.19em;font-weight:800}
 .dcc-book-hole{font-family:Georgia,serif;font-size:37px;font-weight:700;letter-spacing:.04em;margin:12px 0 2px}
 .dcc-book-page{padding:20px;background:repeating-linear-gradient(0deg,transparent,transparent 28px,#746b4a09 29px)}
 .dcc-book-stat{font:700 18px Georgia,serif;text-align:center;padding:12px;border-block:1px solid #b9aa89}
 .dcc-book-notes{border-left:3px solid #b49a67;padding:4px 0 4px 13px;margin:20px 0;font:italic 17px/1.5 Georgia,serif}
 .dcc-book-call{background:#1b4131;color:#f7ecd4;border-radius:8px;text-align:center;padding:15px;margin-top:14px}
 .dcc-book-call strong{font:800 clamp(30px,7vw,48px)/1.1 system-ui;display:block}
 .dcc-book-foot{font-size:11px;line-height:1.4;opacity:.78;margin-top:16px}
 .dcc-book-controls{display:flex;gap:10px;padding:10px 16px;justify-content:space-between;align-items:center}
 .dcc-book-controls button{border:1px solid #aa956e;border-radius:7px;padding:9px;background:transparent;color:inherit;font-weight:700}
 `;
 doc.head.append(css);
 const btn=doc.createElement('button');btn.id='dcc-yardage-open';btn.type='button';btn.textContent='▤ OPEN YARDAGE BOOK';btn.style.cssText='display:block;width:100%;min-height:48px;margin:8px 0 14px;font-size:15px';
 const caddyCard=doc.getElementById('aiInput')?.closest('.ai-card');
 const target=caddyCard || doc.getElementById('dcc-starter-open')?.parentElement || doc.body;
 if(caddyCard)target.insertBefore(btn,target.firstChild);else target.append(btn);
 const dlg=doc.createElement('dialog');dlg.id='dcc-yardage-dialog';dlg.setAttribute('aria-label','Dagger Country Club Yardage Book');
 dlg.innerHTML='<div class="dcc-book-controls"><span class="dcc-book-overline">DAGGER COUNTRY CLUB</span><button type="button" id="dcc-book-close">Close ×</button></div><div id="dcc-book-content" aria-live="polite"></div><div class="dcc-book-controls"><button type="button" id="dcc-book-prev">← Previous</button><label for="dcc-book-hole-select">HOLE <select id="dcc-book-hole-select" aria-label="Choose hole"></select></label><button type="button" id="dcc-book-next">Next →</button></div>';
 doc.body.append(dlg);
 const shot=doc.createElement('div');shot.style.cssText='padding:12px 16px;border-top:1px solid #c5b38b;display:flex;gap:10px;align-items:end;flex-wrap:wrap';
 const distanceLabel=doc.createElement('label');distanceLabel.textContent='Actual distance (yards) ';distanceLabel.style.cssText='flex:1;min-width:145px;font-size:12px;font-weight:800';
 const distance=doc.createElement('input');distance.type='text';distance.inputMode='text';distance.placeholder='e.g. 165 or 235-240';distance.style.cssText='width:100%;min-height:43px;font-size:17px;padding:7px;box-sizing:border-box';distanceLabel.append(distance);
 const lieLabel=doc.createElement('label');lieLabel.textContent='Lie ';lieLabel.style.cssText='flex:1;min-width:130px;font-size:12px;font-weight:800';
 const lie=doc.createElement('select');lie.style.cssText='width:100%;min-height:43px;font-size:16px';
 for(const name of ['Unknown','Tee','Fairway','Rough','Sand','Recovery']){const option=doc.createElement('option');option.value=name;option.textContent=name;lie.append(option);}
 lieLabel.append(lie);shot.append(distanceLabel,lieLabel);
 dlg.querySelector('#dcc-book-content').after(shot);
 const ask=doc.createElement('button');ask.type='button';ask.id='dcc-book-ask';ask.textContent='Ask Caddy about this hole';ask.style.cssText='display:block;width:calc(100% - 32px);margin:0 16px 12px;background:#204332;color:#f8efd8;padding:13px;border:1px solid #b79a64;border-radius:9px;font-weight:800';dlg.querySelector('#dcc-book-content').after(ask);
 const yardageFeedback=doc.createElement('small');
 yardageFeedback.textContent='Rough numbers welcome: about 165 or 235-240.';
 yardageFeedback.style.cssText='display:block;margin:4px 0 0;color:#536b58;font:italic 13px Georgia,serif';
 distanceLabel.append(yardageFeedback);
 distance.addEventListener('input',()=>{
  const value=distance.value.trim();
  const parsed=parseGolfDistance(value);
  yardageFeedback.textContent=!value?'Rough numbers welcome: about 165 or 235-240.':parsed?'Got it: '+parsed.label+'. No fake precision.':'Try about 165 or 235-240.';
 });
 const content=dlg.querySelector('#dcc-book-content');
 const selector=dlg.querySelector('#dcc-book-hole-select');
 for(let n=1;n<=18;n++){const opt=doc.createElement('option');opt.value=String(n);opt.textContent=String(n);selector.append(opt);}
 const compactStyle=doc.createElement('style');
 compactStyle.textContent='#dcc-yardage-dialog .dcc-book-controls{position:sticky;bottom:0;background:#f3eedf;z-index:2;border-top:1px solid #c5b38b}#dcc-yardage-dialog select{font-size:16px;background:#fff9eb;color:#213b2e;padding:8px;border:1px solid #ad956b;border-radius:7px}#dcc-book-ask:focus-visible,#dcc-yardage-open:focus-visible{outline:3px solid #d9b36a;outline-offset:3px}';
 doc.head.append(compactStyle);
 const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let hole=1,env=null,token=0,ghostStep=1;
 function draw(){
  selector.value=String(hole);
  const active=readActiveRound(storage);
  const fallback={holeNumber:hole,courseName:active?.selection?.course?.name,teeName:active?.selection?.tee?.name};
  const facts=env?.selection?buildCaddyCourseFacts(env,hole):fallback;
  const coverage=classifyYardageCoverage({course:active?.selection?.course||env?.selection?.course,holes:env?.holes,geometry:env?.geometry||[]});
  const page=buildYardagePage(facts)||buildYardagePage({holeNumber:hole});
  const sketch=sketchVerifiedHole({geometry:env?.geometry||[],holeNumber:hole,course:active?.selection?.course||env?.selection?.course});
  const ghost=buildGhostRound({courseName:page.courseName,holes:env?.holes||[]})[hole-1];
  ghostStep=Math.max(1,Math.min(ghostStep,ghost.shots.length));
  const selectedGhostShot=ghost.shots[ghostStep-1];
  const dots=ghost.shots.slice(0,ghostStep).map((p,i)=>'<circle cx="'+(20+p.x*180).toFixed(1)+'" cy="'+(15+p.y*300).toFixed(1)+'" r="5" fill="#624a6b"/><text x="'+(28+p.x*180).toFixed(1)+'" y="'+(10+p.y*300).toFixed(1)+'" font-size="11">'+(i+1)+'</text>').join('');
  const ghostPanel='<div style="margin:16px 0;padding:12px;border:1px solid #ad956b"><strong>HOUSE GHOST · SHOT '+ghostStep+'/'+ghost.shots.length+'</strong><svg viewBox="0 0 220 330" style="display:block;width:100%;max-height:240px"><path d="M85 315 Q55 240 89 165 Q119 90 115 25 Q170 15 179 56 Q166 130 145 187 Q160 270 145 315Z" fill="#bdd0aa" stroke="#668367"/>'+dots+'</svg><p>'+safe(selectedGhostShot.club)+' · '+safe(selectedGhostShot.distanceLabel)+' · '+safe(selectedGhostShot.lie)+'</p><button type="button" id="dcc-ghost-prev">Previous shot</button> <button type="button" id="dcc-ghost-next">Next shot</button><p style="font-size:11px">SIMULATED SCHEMATIC · not actual course geometry. Ghost score: '+ghost.score+'</p></div>';
  content.innerHTML=`<div class="dcc-book-cover"><div class="dcc-book-overline">THE MEMBER'S FIELD GUIDE</div><div class="dcc-book-hole">HOLE ${String(hole).padStart(2,'0')}</div><div>${safe(page.courseName)} · ${safe(page.teeName)}</div></div>
   <div class="dcc-book-page"><div class="dcc-book-sketch" style="max-width:270px;margin:0 auto 14px">${sketch||'<div style="padding:32px 10px;text-align:center;border:1px dashed #b4a582;font:italic 15px Georgia,serif">Hole drawing unavailable until its layout is verified.</div>'}</div><div class="dcc-book-overline" style="text-align:center;opacity:.75;margin-bottom:8px">${safe(coverage.tier.toUpperCase())} EDITION</div><div class="dcc-book-stat">${page.par?'PAR '+page.par:'PAR UNAVAILABLE'} · ${safe(page.yardageLabel)}</div>
   <div class="dcc-book-notes"><div class="dcc-book-overline">THE CADDY'S NOTES · PLAY SMART</div>${safe(page.strategy)}<div style="font:700 13px/1.5 system-ui;margin-top:10px">COURSE MANAGEMENT: Favor a playable miss. Avoid trouble you cannot confidently carry. Choose the next shot, not the heroic one.</div></div>
   <div class="dcc-book-call"><span class="dcc-book-overline">YOUR CLUB</span><strong>${page.club?safe(page.club):'ASK YOUR CADDY'}</strong></div>
   ${ghostPanel}<div class="dcc-book-foot">${safe(page.hazards)}<br/>${safe(coverage.notice)}<br/>Scorecard yardage is not live distance to the pin. No hole map without verified geometry.</div></div>`;
  content.querySelector('#dcc-ghost-prev')?.addEventListener('click',()=>{ghostStep=Math.max(1,ghostStep-1);draw();});
  content.querySelector('#dcc-ghost-next')?.addEventListener('click',()=>{ghostStep=Math.min(ghost.shots.length,ghostStep+1);draw();});
 }
 btn.addEventListener('click',async()=>{
  const active=readActiveRound(storage);
  const selectedHole=Number(active?.selection?.holeNumber);hole=Number.isInteger(selectedHole)&&selectedHole>=1&&selectedHole<=18?selectedHole:1; env=null;ghostStep=1;draw();dlg.showModal();
  const thisToken=++token;
  if(active){try{const loaded=await getRoundEnvironment({storage});if(thisToken===token&&dlg.open){env=loaded;draw();}}catch{/* Keep honest offline fallback. */}}
 });
 dlg.querySelector('#dcc-book-close').addEventListener('click',()=>dlg.close());
 dlg.addEventListener('close',()=>{token++;});
 dlg.querySelector('#dcc-book-prev').addEventListener('click',()=>{hole=Math.max(1,hole-1);draw();});
 dlg.querySelector('#dcc-book-next').addEventListener('click',()=>{hole=Math.min(18,hole+1);draw();});
 selector.addEventListener('change',()=>{const next=Number(selector.value);if(Number.isInteger(next)&&next>=1&&next<=18){hole=next;draw();}});
 ask.addEventListener('click',()=>{
  const input=doc.getElementById('aiInput');if(!input)return;
  const active=readActiveRound(storage);
  const facts=env?.selection?buildCaddyCourseFacts(env,hole):{holeNumber:hole,courseName:active?.selection?.course?.name,teeName:active?.selection?.tee?.name};
  const page=buildYardagePage(facts);
  const context=['Help me play hole '+hole+' at '+(page?.courseName||'this course'),page?.par?'par '+page.par:null,page?.yards?'scorecard yardage '+page.yards+' yards':null,parseGolfDistance(distance.value)?'actual distance '+parseGolfDistance(distance.value).label:null,lie.value!=='Unknown'?'lie '+lie.value:null,'Recommend a club based on my known distances, a safe target, and the biggest course-management risk. If information is missing say so; never invent pin or hazards. Keep it brief.'].filter(Boolean).join('. ');
  dlg.close();doc.getElementById('tab-play')?.click();
  input.value=context;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();
 });
}
