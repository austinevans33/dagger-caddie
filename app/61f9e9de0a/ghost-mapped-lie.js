// Classify simulated marker positions against the same projected Yardage Book shapes.
function inside(x,y,ring){
 let found=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const [a,b]=ring[i],[c,d]=ring[j];
  if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)found=!found;
 }
 return found;
}


const lies=[['water','Mapped water'],['bunker','Mapped bunker'],['green','Mapped green'],
 ['fairway','Mapped fairway'],['rough','Mapped rough']];

export function mappedGhostShots(shots,shapes,width,height){
 const classify=({x,y})=>lies.find(([type])=>shapes.some(shape=>shape.type===type&&
  inside(x*width,y*height,shape.points)&&!shape.interiors?.some(ring=>inside(x*width,y*height,ring))))?.[1];
 const played=[];
 for(const shot of shots){
  if(shot.lie==='Holed'||shot.club==='Putter'){
   played.push(shot);
   continue;
  }
  const previous=played.at(-1);
  const recovery=previous?.mappedLie==='Mapped bunker'?'Recovery wedge':
   previous?.mappedLie==='Mapped rough'?'Punch out':null;
  let next=shot;
  if(recovery){
   // Look for a shorter, mapped fairway target between the last marker and planned landing.
   for(const fraction of [.45,.6,.75]){
    const point={x:previous.x+(shot.x-previous.x)*fraction,y:previous.y+(shot.y-previous.y)*fraction};
    if(classify(point)!=='Mapped fairway')continue;
    next={...shot,...point,club:recovery,distanceLabel:'short recovery',
     comment:'The Ghost plays a shorter recovery to the mapped fairway.'};
    break;
   }
  }
  const mappedLie=classify(next);
  played.push(mappedLie?{...next,mappedLie}:next);
 }
 return played;
}

// Distances are simulated by scaling the reviewed drawing's route to the
// selected scorecard yardage. They are not measured shot or tee distances.
const skills=Object.freeze({
 scratch:{carry:270,spread:.055,putt:.86},
 fiveTen:{carry:250,spread:.08,putt:.76},
 tenFifteen:{carry:228,spread:.105,putt:.65},
 fifteenTwenty:{carry:205,spread:.13,putt:.54}
});

export function playMappedGhostHole({route,shapes,width,height,yards,par,tier,seed,condition}){
 const skill=Object.hasOwn(skills,tier)?skills[tier]:null;
 if(!skill||!Number.isFinite(yards)||yards<=0||!route?.path||width<=0||height<=0)return null;
 const {tee,green,path}=route;
 const classify=([x,y])=>lies.find(([type])=>shapes.some(shape=>shape.type===type&&
  inside(x,y,shape.points)&&!shape.interiors?.some(ring=>inside(x,y,ring))))?.[0];
 const hasFairway=shapes.some(shape=>shape.type==='fairway');
 if(classify(green)!=='green'||(!hasFairway&&par!==3))return null;
 const length=path.slice(1).reduce((sum,point,i)=>sum+Math.hypot(point[0]-path[i][0],point[1]-path[i][1]),0);
 if(!length)return null;
 const scale=yards/length;
 const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 const unit=([x,y])=>({x:x/width,y:y/height});
 const risk=condition==='normal'||!condition?1:1.12;
 let randomState=2166136261;
 for(const character of String(seed))randomState=Math.imul(randomState^character.charCodeAt(0),16777619);
 function random(){
  randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;
  return randomState/4294967296;
 }
 let position=tee;
 let lie='tee';
 let waypoint=1;
 let retryAfterWater=false;
 const shots=[];
 while(shots.length<18){
  const remaining=distance(position,green)*scale;
  if(lie==='green'){
   const holed=remaining<.35||random()<skill.putt/(1+(remaining/3)**1.6);
   const shortRoll=[green[0]+(position[0]-green[0])*.35,green[1]+(position[1]-green[1])*.35];
   position=holed||classify(shortRoll)!=='green'?green:shortRoll;
   shots.push({...unit(position),club:'Putter',distanceLabel:Math.max(1,Math.round(remaining*3))+' ft',
    lie:holed?'Holed':'Green',comment:holed?'The putt drops.':'The putt leaves a shorter look.'});
   if(holed)return {start:unit(tee),shots};
   continue;
  }
  const recovery=lie==='bunker'||lie==='rough'||lie===undefined;
  const carry=lie==='bunker'?Math.min(85,skill.carry*.33):recovery?skill.carry*.55:skill.carry;
  // Advance through nearby dogleg waypoints before taking a direct line at the pin.
  while(waypoint<path.length-1&&distance(position,path[waypoint])*scale<carry*.48)waypoint++;
  const aim=path[waypoint]??green;
  const aimingAtGreen=aim===green||waypoint===path.length-1;
  const target=aimingAtGreen?green:aim;
  const dx=target[0]-position[0],dy=target[1]-position[1];
  const line=Math.hypot(dx,dy);
  if(!line)return null;
  let planned=Math.min(line,carry/scale);
  if(retryAfterWater&&hasFairway){
   // After a penalty, look for a shorter target with usable ground on both sides.
   for(const fraction of [.8,.65,.5,.35]){
    const step=planned*fraction;
    const flank=step*skill.spread*risk;
    const supported=[-flank,0,flank].every(offset=>
     classify([position[0]+(dx*step-dy*offset)/line,position[1]+(dy*step+dx*offset)/line])==='fairway');
    if(supported){planned=step;break;}
   }
  }
  const club=lie==='bunker'?'Recovery wedge':recovery?'Punch out':planned*scale>190?'Driver':
   planned*scale>105?'Iron':planned*scale>35?'Wedge':'Chip';
  const miss=(random()-.5)*2*planned*skill.spread*risk;
  const travel=planned*(1+(random()-.5)*skill.spread*risk);
  let landing=[position[0]+(dx*travel-dy*miss)/line,position[1]+(dy*travel+dx*miss)/line];
  // A short shot uses the mapped green as its target. Misses can still leave a chip.
  if(remaining<=12&&aimingAtGreen&&classify(landing)===undefined)landing=[...green];
  if(landing[0]<0||landing[0]>width||landing[1]<0||landing[1]>height)return null;
  const nextLie=classify(landing);
  const mappedLie=lies.find(([type])=>type===nextLie)?.[1];
  shots.push({...unit(landing),club,distanceLabel:Math.max(1,Math.round(distance(position,landing)*scale))+' yd',
   lie:mappedLie||'Unclassified ground',mappedLie,comment:nextLie==='water'?'Water. The Ghost will replay with a penalty.':
    recovery?'The Ghost plays back toward the hole.':nextLie==='green'?'On the green. Putter next.':'The Ghost plays toward the next target.'});
  retryAfterWater=nextLie==='water';
  if(retryAfterWater){
   shots.push({...unit(position),club:'Penalty',distanceLabel:'Stroke and distance',lie:'Replay position',
    comment:'One penalty stroke. The Ghost plays again from the previous lie.'});
  }else{
   position=landing;
   lie=nextLie;
  }
 }
 // The caller can use the legacy experience if this map cannot support a finish.
 return null;
}
