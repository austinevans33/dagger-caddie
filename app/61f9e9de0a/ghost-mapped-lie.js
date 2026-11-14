// Classify simulated marker positions against the same projected Yardage Book shapes.
function inside(x,y,ring){
 let found=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const [a,b]=ring[i],[c,d]=ring[j];
  if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)found=!found;
 }
 return found;
}

export function mappedGhostShots(shots,shapes,width,height){
 const lies=[['water','Mapped water'],['bunker','Mapped bunker'],['green','Mapped green'],
  ['fairway','Mapped fairway'],['rough','Mapped rough']];
 return shots.map(shot=>{
  if(shot.lie==='Holed'||shot.club==='Putter')return shot;
  const x=shot.x*width,y=shot.y*height;
  const match=lies.find(([type])=>shapes.some(shape=>shape.type===type&&inside(x,y,shape.points)&&
   !shape.interiors?.some(ring=>inside(x,y,ring))));
  return match?{...shot,mappedLie:match[1]}:shot;
 });
}
