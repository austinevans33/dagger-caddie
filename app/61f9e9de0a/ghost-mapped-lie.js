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
