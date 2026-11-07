// Two practical, personality-specific pencil notes for the selected hole.
// Give a tee target and an approach decision, not an inventory of the drawing.
// Relative sides are only suggestions from hole-assigned outlines, not surveyed carries.
const names=Object.freeze({keith:'Keith',reginald:'Reginald',vinny:'Vinny',kyle:'Kyle'});
const tone=Object.freeze({
 keith:{tee:'No hero ball.',approach:'Make the boring number.'},
 reginald:{tee:'Restraint is still in fashion, sir.',approach:'A dignified choice.'},
 vinny:{tee:'Don’t donate the hole.',approach:'We like paid-up pars.'},
 kyle:{tee:'Stick to the mission.',approach:'No unnecessary heroics.'}
});
const validSides=new Set(['left','right','center']);
const stages=new Set(['tee zone','landing corridor','approach']);
function risks(annotations,at){
 const labels=Array.isArray(annotations?.labels)?annotations.labels:[];
 const found=labels.filter(x=>x&&['water','bunker'].includes(x.type)&&validSides.has(x.side)&&stages.has(x.stage)&&at.includes(x.stage));
 return found;
}
function planFor(found,stage,par){
 if(!found.length)return null;
 const water=found.filter(x=>x.type==='water');
 const highest=water.length?water:found;
 const types=water.length?'water':'sand';
 const sides=new Set(highest.map(x=>x.side));
 if(sides.has('center')||(sides.has('left')&&sides.has('right')))
  return stage==='tee'
   ?'Trouble splits the landing area. Favor a controlled tee ball, not maximum distance.'
   :'Trouble guards the middle or both sides. Favor a comfortable green section.';
 const side=sides.has('left')?'left':'right';
 const away=side==='left'?'right':'left';
 if(stage==='tee'){
  if(par===3)return 'Trouble '+side+' of the green. Favor the '+away+' half, not a sucker pin.';
  return (types==='water'?'Water':'Bunkers')+' '+side+' off the tee. Start your line center-'+away+'; check the carry.';
 }
 return (types==='water'?'Water':'Sand')+' '+side+' on approach. Favor center-'+away+'; ignore the pin.';
}
function generalTee(par,yards){
 if(par===3)return 'Tee: Pick a reachable part of the green. Center beats a heroic miss.';
 if(par===5)return 'Tee: Find a playable landing area first. Earn the chance to attack in two.';
 if(par===4&&Number.isInteger(yards)&&yards>=430)return 'Tee: Long par 4. Prioritize a clean second shot over a few extra yards.';
 return 'Tee: Pick a landing target you can actually hit. Save the hero swing.';
}
function generalApproach(par){
 return par===3?'Green: Use the middle as your default target. Two putts beats a penalty.':
 par===5?'Second shot: Lay up to a full, comfortable number unless the carry is genuinely there.':
 'Approach: Take the club that covers the front, then favor the fat part of the green.';
}
export function pocketCaddyNotes({caddy='keith',hole=null,annotations=null}={}){
 const id=Object.hasOwn(names,caddy)?caddy:'keith';
 const par=Number(hole?.par),yards=Number(hole?.yards);
 const tee=risks(annotations,['tee zone','landing corridor']);
 const approach=risks(annotations,['approach']);
 const teePlan=planFor(tee,'tee',par);
 const approachPlan=planFor(approach,'approach',par);
 // A caddy can be funny without drowning out the golf decision.
 const first=(teePlan||generalTee(par,yards));
 const second=(approachPlan||generalApproach(par));
 return Object.freeze({name:names[id],lines:Object.freeze([
  first+' '+tone[id].tee,
  second+' '+tone[id].approach
 ]),mapped:!!(teePlan||approachPlan)});
}
