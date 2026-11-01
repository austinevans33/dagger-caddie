import {changeSkinsTrialHole,undoSkinsTrialHole} from './skins-trial-edits.js';
import {previewSkinsAction} from './skins-action-preview.js';
// Standalone local Skins score-entry trial. No live Money Room mutations.
export function mountSkinsTrial({doc=document,storage=localStorage}={}){
 if(doc.getElementById('dcc-skins-trial'))return;
 const button=doc.createElement('button');button.id='dcc-skins-trial';button.textContent='Skins Trial · Local';
 button.type='button';button.style.cssText='background:#193e30;color:#f6eed8;border:1px solid #ad956e;border-radius:9px;padding:11px;margin:8px';
 (doc.getElementById('dcc-starter-open')?.parentElement||doc.body).append(button);
 const dialog=doc.createElement('dialog');dialog.style.cssText='width:min(92vw,480px);max-height:85vh;overflow:auto;background:#f4ecd9;color:#213e30;border:2px solid #ad956e;border-radius:12px;padding:20px';
 const heading=doc.createElement('h2');heading.textContent='THE ACTION · Skins';heading.style.cssText='font:700 27px Georgia,serif;margin:4px 0 14px';
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
  const status=doc.createElement('div');status.style.cssText='font-weight:800;font-size:13px;letter-spacing:.06em;margin:12px 0';status.textContent='HOLE '+Math.min(18,holes.length+1)+' · '+holes.length+'/18 SCORED · '+result.state.toUpperCase();area.append(status);
  paragraph(result.pendingCarry?'SKINS CARRIED: '+result.pendingCarry:'NO SKINS CARRIED');
  const board=doc.createElement('div');board.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0';
  for(let i=0;i<4;i++){const tile=doc.createElement('div');tile.style.cssText='border:1px solid #baaa85;border-radius:8px;padding:11px;background:#fff8e8';const label=doc.createElement('div');label.style.cssText='font:700 12px system-ui';label.textContent=state.names[i];const sum=doc.createElement('div');sum.style.cssText='font:700 23px Georgia,serif;margin-top:5px';const amount=result.balances[i].netCents;sum.textContent=(amount>=0?'+':'−')+'
  if(holes.length<18){
   const inputs=[];
   for(let i=0;i<4;i++){
    const label=doc.createElement('label');label.textContent=state.names[i]+' strokes ';
    const input=doc.createElement('input');input.type='number';input.min='1';input.max='20';input.inputMode='numeric';input.style.cssText='width:66px;min-height:44px;font-size:19px;margin:5px';label.append(input);area.append(label,doc.createElement('br'));inputs.push(input);
   }
   control('Save Hole '+(holes.length+1),()=>{
    const scores=inputs.map(el=>Number(el.value));
    if(inputs.some(el=>!el.value)||scores.some(s=>!Number.isInteger(s)||s<1||s>20)){paragraph('Enter valid strokes from 1 to 20 for all golfers.');return;}
    const next=changeSkinsTrialHole(state,holes.length+1,scores);storage.setItem(key,JSON.stringify(next));draw();
   });
  }
  if(holes.length)control('Undo Last Hole',()=>{storage.setItem(key,JSON.stringify(undoSkinsTrialHole(state)));draw();});
  if(holes.length){
   const details=doc.createElement('details');const summary=doc.createElement('summary');summary.textContent='Correct last hole';details.append(summary);area.append(details);
   const edits=[];
   paragraph('Correct last saved hole · '+holes.length);
   for(let i=0;i<4;i++){
    const label=doc.createElement('label');label.textContent=state.names[i]+' ';
    const inp=doc.createElement('input');inp.type='number';inp.min='1';inp.max='20';inp.inputMode='numeric';inp.value=String(holes.at(-1)[i]);inp.style.width='65px';
    label.append(inp);details.append(label);edits.push(inp);
   }
   const correct=doc.createElement('button');correct.textContent='Save corrected hole';correct.style.cssText='padding:10px;background:#234634;color:white;border-radius:8px';details.append(correct);correct.onclick=()=>{
    if(edits.some(e=>e.value==='')){paragraph('Enter all four strokes.');return;}
    try{const next=changeSkinsTrialHole(state,holes.length,edits.map(e=>Number(e.value)));
     storage.setItem(key,JSON.stringify(next));draw();
    }catch(e){paragraph(e.message);}
   };
  }
  if(result.canSettle)paragraph('18 holes recorded. Demonstration complete; no actual wagers or payments initiated.');
 }
 button.onclick=()=>{try{draw();dialog.showModal();}catch(e){area.textContent=e.message;dialog.showModal();}};
}
+(Math.abs(amount)/100).toFixed(2);tile.append(label,sum);board.append(tile);}area.append(board);
  if(holes.length<18){
   const inputs=[];
   for(let i=0;i<4;i++){
    const label=doc.createElement('label');label.textContent=state.names[i]+' strokes ';
    const input=doc.createElement('input');input.type='number';input.min='1';input.max='20';input.inputMode='numeric';input.style.width='65px';label.append(input);area.append(label,doc.createElement('br'));inputs.push(input);
   }
   control('Save Hole '+(holes.length+1),()=>{
    const scores=inputs.map(el=>Number(el.value));
    if(inputs.some(el=>!el.value)||scores.some(s=>!Number.isInteger(s)||s<1||s>20)){paragraph('Enter valid strokes from 1 to 20 for all golfers.');return;}
    const next=changeSkinsTrialHole(state,holes.length+1,scores);storage.setItem(key,JSON.stringify(next));draw();
   });
  }
  if(holes.length)control('Undo Last Hole',()=>{storage.setItem(key,JSON.stringify(undoSkinsTrialHole(state)));draw();});
  if(holes.length){
   const edits=[];
   paragraph('Correct last saved hole · '+holes.length);
   for(let i=0;i<4;i++){
    const label=doc.createElement('label');label.textContent=state.names[i]+' ';
    const inp=doc.createElement('input');inp.type='number';inp.min='1';inp.max='20';inp.inputMode='numeric';inp.value=String(holes.at(-1)[i]);inp.style.width='65px';
    label.append(inp);area.append(label);edits.push(inp);
   }
   control('Correct Hole '+holes.length,()=>{
    if(edits.some(e=>e.value==='')){paragraph('Enter all four strokes.');return;}
    try{const next=changeSkinsTrialHole(state,holes.length,edits.map(e=>Number(e.value)));
     storage.setItem(key,JSON.stringify(next));draw();
    }catch(e){paragraph(e.message);}
   });
  }
  if(result.canSettle)paragraph('18 holes recorded. Demonstration complete; no actual wagers or payments initiated.');
 }
 button.onclick=()=>{try{draw();dialog.showModal();}catch(e){area.textContent=e.message;dialog.showModal();}};
}
