import {previewSkinsAction} from './skins-action-preview.js';
// Standalone local Skins score-entry trial. No live Money Room mutations.
export function mountSkinsTrial({doc=document,storage=localStorage}={}){
 if(doc.getElementById('dcc-skins-trial'))return;
 const button=doc.createElement('button');button.id='dcc-skins-trial';button.textContent='Skins Trial · Local';
 button.type='button';button.style.cssText='background:#193e30;color:#f6eed8;border:1px solid #ad956e;border-radius:9px;padding:11px;margin:8px';
 doc.body.append(button);
 const dialog=doc.createElement('dialog');dialog.style.cssText='width:min(92vw,480px);max-height:85vh;overflow:auto;background:#f4ecd9;color:#213e30;border:2px solid #ad956e;border-radius:12px;padding:20px';
 const heading=doc.createElement('h2');heading.textContent='Dagger · Skins Trial';
 const area=doc.createElement('div'),close=doc.createElement('button');close.textContent='Close';close.onclick=()=>dialog.close();
 dialog.append(heading,area,close);doc.body.append(dialog);
 const key='dcc_skins_trial_v1';
 const read=()=>{try{const x=JSON.parse(storage.getItem(key)||'null');if(x&&Array.isArray(x.holes)&&Array.isArray(x.names))return x;}catch{}return {names:['Golfer 1','Golfer 2','Golfer 3','Golfer 4'],holes:[],stakeCents:100};};
 const paragraph=text=>{const p=doc.createElement('p');p.textContent=text;area.append(p);};
 const control=(label,fn)=>{const b=doc.createElement('button');b.textContent=label;b.style.cssText='margin:5px;padding:9px;background:#234634;color:#fff3dd;border:0;border-radius:6px';b.onclick=fn;area.append(b);};
 function draw(){
  area.replaceChildren();const state=read(),holes=state.holes;
  paragraph('PRIVATE ON-DEVICE TEST · Not connected to Money Room or Firebase.');
  const result=previewSkinsAction({playerIds:['a','b','c','d'],holes,stakeCents:state.stakeCents});
  paragraph('HOLES PLAYED: '+holes.length+' / 18 · '+result.state.toUpperCase());
  paragraph('UNCLAIMED SKINS CARRY: '+result.pendingCarry);
  for(let i=0;i<4;i++)paragraph(state.names[i]+': '+(result.balances[i].netCents/100).toFixed(2)+' dollars');
  if(holes.length<18){
   const inputs=[];
   for(let i=0;i<4;i++){
    const label=doc.createElement('label');label.textContent=state.names[i]+' strokes ';
    const input=doc.createElement('input');input.type='number';input.min='1';input.max='20';input.inputMode='numeric';input.style.width='65px';label.append(input);area.append(label,doc.createElement('br'));inputs.push(input);
   }
   control('Save Hole '+(holes.length+1),()=>{
    const scores=inputs.map(el=>Number(el.value));
    if(inputs.some(el=>!el.value)||scores.some(s=>!Number.isInteger(s)||s<1||s>20)){paragraph('Enter valid strokes from 1 to 20 for all golfers.');return;}
    const next={...state,holes:[...holes,scores]};storage.setItem(key,JSON.stringify(next));draw();
   });
  }
  if(holes.length)control('Undo Last Hole',()=>{storage.setItem(key,JSON.stringify({...state,holes:holes.slice(0,-1)}));draw();});
  if(result.canSettle)paragraph('18 holes recorded. Demonstration complete; no actual wagers or payments initiated.');
 }
 button.onclick=()=>{try{draw();dialog.showModal();}catch(e){area.textContent=e.message;dialog.showModal();}};
}
