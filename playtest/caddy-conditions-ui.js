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
  ['offline-cached','cached-no-provider-holes'].includes(environment.state)?'Previously verified scorecard cache · '+coverage.verifiedHoles+'/18 holes'+age:
  environment.state==='ready'?'Verified tee data · '+coverage.verifiedHoles+'/18 holes'+age:
  'Course data unavailable'+age;
 const weatherSummary=valid
  ?'Conditions · '+Math.round(w.temperatureF)+'°F · '+Math.round(w.windMph)+' mph wind'
  :'Conditions · weather unavailable';
 return {course:heading,hole:holeText,weather,weatherSummary,status};
}
export function mountCaddyConditions({doc=document,onRefresh}={}){
 if(doc.getElementById('dcc-caddy-conditions'))return null;
 const heading=doc.getElementById('aiHeading');
 if(!heading)return null;
 const style=doc.createElement('style');
 style.textContent=`
 #dcc-caddy-conditions{margin:10px 0 12px;padding:10px 12px;border:1px solid #b79c62;border-radius:11px;background:#f3ecda;color:#173729;font:12px/1.35 system-ui,sans-serif}
 #dcc-caddy-conditions .dcc-conditions-label{font-size:9px;font-weight:800;letter-spacing:.13em;color:#655535}
 #dcc-caddy-conditions .dcc-conditions-course{display:block;font:700 15px/1.2 Georgia,serif;overflow-wrap:anywhere;min-width:0}
 #dcc-caddy-conditions .dcc-conditions-top{display:flex;justify-content:space-between;gap:10px;align-items:start}
 #dcc-caddy-conditions .dcc-conditions-heading{min-width:0;flex:1}
 #dcc-caddy-conditions .dcc-conditions-hole{display:block;margin-top:4px;font-size:11px;color:#3a5142}
 #dcc-caddy-conditions .dcc-conditions-details{margin-top:7px;border-top:1px solid #d4c5a3;padding-top:7px}
 #dcc-caddy-conditions .dcc-conditions-details summary{cursor:pointer;font:700 11px system-ui;color:#315740;list-style-position:inside;padding:3px 0;touch-action:manipulation}
 #dcc-caddy-conditions .dcc-conditions-weather{display:block;font-size:11px;margin:8px 0 5px;font-weight:600}
 #dcc-caddy-conditions .dcc-conditions-clubs{display:block;padding-top:6px;border-top:1px solid #d3c6a6;font-size:11px;color:#38543f}
 #dcc-caddy-conditions .dcc-conditions-footer{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;color:#596453;font-size:10px;margin-top:8px}
 #dcc-caddy-conditions button{background:transparent;border:1px solid #b79c62;color:#173729;border-radius:7px;padding:6px 9px;font:700 10px system-ui;min-height:34px;cursor:pointer}
 #dcc-caddy-conditions button:disabled{opacity:.55;cursor:wait}
 #dcc-caddy-conditions #dcc-starter-open{background:transparent;color:#173729;white-space:nowrap;flex-shrink:0;font:700 10px system-ui;letter-spacing:0}
 `;
 doc.head.append(style);
 const card=doc.createElement('section');card.id='dcc-caddy-conditions';
 card.setAttribute('aria-label','Selected course and modeled conditions');
 const top=doc.createElement('div');top.className='dcc-conditions-top';
 const headingText=doc.createElement('div');headingText.className='dcc-conditions-heading';
 const label=doc.createElement('span');label.className='dcc-conditions-label';label.textContent='THE CADDY’S COURSE REPORT';
 const course=doc.createElement('strong');course.className='dcc-conditions-course';
 const hole=doc.createElement('span');hole.className='dcc-conditions-hole';
 headingText.append(label,course,hole);
 const actions=doc.createElement('div');actions.id='dcc-caddy-conditions-actions';
 top.append(headingText,actions);
 const details=doc.createElement('details');details.className='dcc-conditions-details';
 const summary=doc.createElement('summary');summary.textContent='Weather, club distances & data sources';
 const weather=doc.createElement('span');weather.className='dcc-conditions-weather';
 const clubs=doc.createElement('span');clubs.className='dcc-conditions-clubs';
 const footer=doc.createElement('div');footer.className='dcc-conditions-footer';
 const status=doc.createElement('span');
 const refresh=doc.createElement('button');refresh.type='button';refresh.textContent='Refresh conditions';
 footer.append(status,refresh);details.append(summary,weather,clubs,footer);card.append(top,details);
 const anchor=doc.getElementById('aiHeading').closest('.dcc-caddy-heading')||doc.getElementById('aiHeading');
 anchor.insertAdjacentElement('afterend',card);
 let busy=false;
 refresh.addEventListener('click',async()=>{
  if(busy||typeof onRefresh!=='function')return;
  busy=true;refresh.disabled=true;
  try{await onRefresh();}finally{busy=false;refresh.disabled=false;}
 });
 return {render(data){
  course.textContent=data.course;hole.textContent=data.hole;
  summary.textContent=data.weatherSummary||'Conditions & course data';
  weather.textContent=data.weather;clubs.textContent=data.clubBaseline||'';status.textContent=data.status;
 },setLoading(value){refresh.disabled=!!value||busy;}};
}
