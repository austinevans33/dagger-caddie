import {twoPlayerAction} from './two-player-action.js';
import {weekendMatchReport} from './weekend-match-report.js';
// One-device demo of the weekend game. Multiplayer is NOT enabled here.
export function mountWeekendMatch({doc=document,storage=localStorage}={}){
 if(doc.getElementById('dcc-weekend-open'))return;
 const key='dcc_weekend_trial_v1';
 const defaults=()=>({names:['You','Buddy'],holes:[],games:[{id:'skins',format:'skins',stakeCents:100},{id:'nassau',format:'nassau',stakeCents:500}]});
 const read=()=>{try{return JSON.parse(storage.getItem(key))||defaults();}catch{return defaults();}};
 const save=x=>{storage.setItem(key,JSON.stringify(x));draw();};
 const open=doc.createElement('button');open.id='dcc-weekend-open';open.textContent='⚔ Weekend Match';open.type='button';
 open.style.cssText='background:#153e2f;color:#fff5dd;border:1px solid #b39b6b;padding:12px;border-radius:9px;font-weight:800;margin:8px';
 (doc.getElementById('dcc-starter-open')?.parentElement||doc.body).append(open);
 const dlg=doc.createElement('dialog');dlg.style.cssText='width:min(92vw,490px);max-height:88vh;overflow:auto;padding:18px;background:#f2ecdc;color:#153e2f;border:2px solid #ad956b;border-radius:13px';
 const area=doc.createElement('div'),close=doc.createElement('button');close.textContent='Close';close.onclick=()=>dlg.close();dlg.append(area,close);doc.body.append(dlg);
 const line=t=>{const p=doc.createElement('p');p.textContent=t;area.append(p);};
 const button=(label,fn)=>{const el=doc.createElement('button');el.textContent=label;el.style.cssText='padding:11px;margin:5px;background:#214b38;color:white;border:0;border-radius:8px';el.onclick=()=>{try{fn();}catch(e){line(e.message);}};area.append(el);};
 function draw(){
  area.replaceChildren();const x=read(),info=twoPlayerAction(x);
  const h=doc.createElement('h2');h.textContent='THE WEEKEND GRUDGE MATCH';h.style.fontFamily='Georgia,serif';area.append(h);
  line('LOCAL TRIAL ONLY · No Firebase sync, guests, or actual payments.');
  line('HOLE '+Math.min(18,x.holes.length+1)+' · '+x.holes.length+'/18 SAVED · '+(info.provisional?'IN PLAY':'FINAL'));
  for(let i=0;i<2;i++)line(x.names[i]+' · '+(info.balances[i]>=0?'+':'-')+'$'+(Math.abs(info.balances[i])/100).toFixed(2));
  for(const r of info.results)line(r.format.toUpperCase()+' · '+(r.netCents[0]>=0?'+':'-')+'$'+(Math.abs(r.netCents[0])/100).toFixed(2)+' for '+x.names[0]);
  if(x.holes.length<18){
   const inputs=[];
   for(const name of x.names){const label=doc.createElement('label');label.textContent=name+' strokes ';const v=doc.createElement('input');v.type='number';v.min='1';v.max='20';v.inputMode='numeric';v.style.cssText='width:64px;min-height:44px;font-size:18px;margin:7px';label.append(v);area.append(label);inputs.push(v);}
   button('Save Hole '+(x.holes.length+1),()=>{
    if(inputs.some(v=>v.value===''))throw Error('Enter both scores');
    const scores=inputs.map(v=>Number(v.value));
    if(scores.some(v=>!Number.isInteger(v)||v<1||v>20))throw Error('Scores must be 1–20');
    save({...x,holes:[...x.holes,scores]});
   });
  }
  if(x.holes.length)button('Undo Last Hole',()=>save({...x,holes:x.holes.slice(0,-1)}));
  button('Clubhouse Report',()=>{const r=weekendMatchReport(x);line(r.status+' · '+r.headline);line(r.disclaimer);});
 }
 open.onclick=()=>{draw();dlg.showModal();};
}
