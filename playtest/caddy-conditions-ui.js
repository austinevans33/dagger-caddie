// Read-only, provenance-first course and conditions strip for the AI Caddy.
import {scorecardCoverage} from './course-scorecard-coverage.js';
// Never turn tee yardage into a pin distance or wind-from into wind-to.
export function describeCaddyConditions(active,environment,{now=Date.now(),fetchedAt=0,loading=false}={}){
 if(!active?.selection)return {
  course:'No course checked in',hole:'Select a course and tee at the Starter’s Desk.',
  weather:'No course weather available.',status:'Course not selected'
 };
 const {course,tee}=active.selection;
 const number=Number(active.holeNumber)||active.selection.holeNumber;
 const heading=course.name+' · '+tee.name+' tees';
 const hole=Array.isArray(environment?.holes)?environment.holes.find(h=>h.number===number):null;
 const holeText=hole&&Number.isInteger(hole.par)&&Number.isInteger(hole.yards)
  ?'Hole '+number+' · Par '+hole.par+' · '+hole.yards+' yd from tee (not pin distance)'
  :'Hole '+number+' · Verified hole yardage unavailable';
 const w=environment?.weather;
 const valid=!!w&&environment.weatherState==='model-current'&&w.source==='open-meteo-model'&&
  Number.isFinite(w.observedAt)&&w.observedAt<=now+5*60000&&now-w.observedAt<=90*60000&&
  Number.isFinite(w.windMph)&&Number.isFinite(w.windDegrees)&&Number.isFinite(w.temperatureF);
 const weather=valid
  ?'Open-Meteo model · '+Math.round(w.temperatureF)+'°F · '+Math.round(w.windMph)+' mph wind FROM '+Math.round(w.windDegrees)+'°'
  :'Modeled weather unavailable — ask your caddy using conditions you observe.';
 const age=Number.isFinite(fetchedAt)&&fetchedAt>0&&fetchedAt<=now
  ?' · checked '+Math.max(0,Math.floor((now-fetchedAt)/60000))+'m ago':'';
 const coverage=scorecardCoverage(environment?.holes);
 const status=loading?'Checking course and conditions…':
  !environment?'Waiting for verified course information…':
  environment.state==='offline-cached'?'Offline scorecard cache · '+coverage.verifiedHoles+'/18 holes'+age:
  environment.state==='ready'?'Verified tee data · '+coverage.verifiedHoles+'/18 holes'+age:
  'Course data unavailable'+age;
 return {course:heading,hole:holeText,weather,status};
}
export function mountCaddyConditions({doc=document,onRefresh}={}){
 if(doc.getElementById('dcc-caddy-conditions'))return null;
 const heading=doc.getElementById('aiHeading');
 if(!heading)return null;
 const style=doc.createElement('style');
 style.textContent=`
 #dcc-caddy-conditions{margin:13px 0 14px;padding:12px 14px;border:1px solid #b79c62;border-radius:11px;background:#f3ecda;color:#173729;display:grid;gap:6px;font:12px/1.4 system-ui,sans-serif}
 #dcc-caddy-conditions .dcc-conditions-label{font-size:10px;font-weight:800;letter-spacing:.13em;color:#655535}
 #dcc-caddy-conditions .dcc-conditions-course{font:700 17px/1.25 Georgia,serif;overflow-wrap:anywhere}
 #dcc-caddy-conditions .dcc-conditions-weather{font-weight:600}
 #dcc-caddy-conditions .dcc-conditions-footer{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;color:#596453;font-size:11px}
 #dcc-caddy-conditions button{background:transparent;border:1px solid #b79c62;color:#173729;border-radius:7px;padding:7px 10px;font:700 11px system-ui;min-height:35px;cursor:pointer}
 #dcc-caddy-conditions button:disabled{opacity:.55;cursor:wait}
 `;
 doc.head.append(style);
 const card=doc.createElement('section');card.id='dcc-caddy-conditions';
 card.setAttribute('aria-label','Selected course and modeled conditions');
 const label=doc.createElement('span');label.className='dcc-conditions-label';label.textContent='THE CADDY’S COURSE REPORT';
 const course=doc.createElement('strong');course.className='dcc-conditions-course';
 const hole=doc.createElement('span');
 const weather=doc.createElement('span');weather.className='dcc-conditions-weather';
 const footer=doc.createElement('div');footer.className='dcc-conditions-footer';
 const status=doc.createElement('span');
 const refresh=doc.createElement('button');refresh.type='button';refresh.textContent='Refresh conditions';
 footer.append(status,refresh);card.append(label,course,hole,weather,footer);
 const anchor=heading.closest('.dcc-caddy-heading')||heading;
 anchor.insertAdjacentElement('afterend',card);
 let busy=false;
 refresh.addEventListener('click',async()=>{
  if(busy||typeof onRefresh!=='function')return;
  busy=true;refresh.disabled=true;
  try{await onRefresh();}finally{busy=false;refresh.disabled=false;}
 });
 return {render(data){
  course.textContent=data.course;hole.textContent=data.hole;
  weather.textContent=data.weather;status.textContent=data.status;
 },setLoading(value){refresh.disabled=!!value||busy;}};
}
