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
 const valid=!!w&&['model-current','model-cached'].includes(environment.weatherState)&&w.source==='open-meteo-model'&&
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
 const holeSummary=hole&&Number.isInteger(hole.par)&&Number.isInteger(hole.yards)
  ?'Hole '+number+' · Par '+hole.par+' · '+hole.yards+' yd tee'
  :'Hole '+number+' · Yardage unavailable';
 return {course:heading,hole:holeText,holeSummary,weather,weatherSummary,status};
}
// A quiet on-course indicator. Conditions are consumed by the Caddy context
// behind the scenes; this UI does not claim weather is available.
export function mountCaddyConditions({doc=document,onRefresh}={}){
 if(doc.getElementById('dcc-caddy-conditions'))return null;
 const heading=doc.getElementById('aiHeading');
 if(!heading)return null;
 const style=doc.createElement('style');
 style.textContent=`
 #dcc-caddy-conditions{display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:0;margin:9px 0 11px;padding:9px 10px;border:1px solid #b79c62;border-radius:10px;background:#f3ecda;color:#173729;font:11px/1.3 system-ui,sans-serif}
 #dcc-caddy-conditions .dcc-conditions-heading{min-width:0;flex:1}
 #dcc-caddy-conditions .dcc-conditions-label{display:block;font:800 9px/1.2 system-ui;letter-spacing:.1em;color:#655535;margin-bottom:3px}
 #dcc-caddy-conditions .dcc-conditions-course{display:block;font:700 13px/1.2 Georgia,serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
 #dcc-caddy-conditions .dcc-conditions-hole{display:block;margin-top:3px;font:11px/1.3 system-ui;color:#3a5142}
 #dcc-caddy-conditions #dcc-caddy-conditions-actions{flex-shrink:0}
 #dcc-caddy-conditions #dcc-starter-open{border:1px solid #b79c62;background:transparent;color:#173729;border-radius:8px;padding:8px 9px;min-height:35px;font:700 10px/1.1 system-ui;white-space:nowrap;cursor:pointer}
 `;
 doc.head.append(style);
 const card=doc.createElement('section');card.id='dcc-caddy-conditions';
 card.setAttribute('aria-label','Current course and hole');
 const text=doc.createElement('div');text.className='dcc-conditions-heading';
 const label=doc.createElement('span');label.className='dcc-conditions-label';label.textContent='ON THE COURSE';
 const course=doc.createElement('strong');course.className='dcc-conditions-course';
 const hole=doc.createElement('span');hole.className='dcc-conditions-hole';
 text.append(label,course,hole);
 const actions=doc.createElement('div');actions.id='dcc-caddy-conditions-actions';
 card.append(text,actions);
 const anchor=heading.closest('.dcc-caddy-heading')||heading;
 anchor.insertAdjacentElement('afterend',card);
 return {render(data){
  course.textContent=data.course||'No course selected';
  course.title=data.course||'';
  hole.textContent=data.holeSummary||data.hole||'';
 },setLoading(){}};
}
