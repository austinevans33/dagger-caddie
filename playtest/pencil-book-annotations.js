// Pure caddy-book annotation engine. Derives route and trouble labels only from
// explicitly hole-assigned, positioned polygons; no invented doglegs or distances.
const midpoint=shape=>shape.points.reduce((sum,[x,y])=>[sum[0]+x/shape.points.length,sum[1]+y/shape.points.length],[0,0]);
const valid=s=>s&&Array.isArray(s.points)&&s.points.length>=3&&s.points.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite));
export function pencilBookAnnotations(shapes=[]){
 const given=Array.isArray(shapes)?shapes.filter(valid):[];
 const tees=given.filter(s=>s.type==='tee'),greens=given.filter(s=>s.type==='green');
 const hasRoute=tees.length===1&&greens.length===1;
 const tee=hasRoute?midpoint(tees[0]):null,green=hasRoute?midpoint(greens[0]):null;
 const dx=hasRoute?green[0]-tee[0]:0,dy=hasRoute?green[1]-tee[1]:0;
 const length=Math.hypot(dx,dy);
 const route=hasRoute&&length>=10?Object.freeze({tee:Object.freeze(tee),green:Object.freeze(green)}):null;
 const labels=[];
 for(const shape of given){
  if(!['bunker','water'].includes(shape.type))continue;
  const center=midpoint(shape);
  let side='position unconfirmed',stage='position unconfirmed';
  if(route){
   const cross=dx*(center[1]-tee[1])-dy*(center[0]-tee[0]);
   const along=((center[0]-tee[0])*dx+(center[1]-tee[1])*dy)/(length*length);
   // Screen y increases down. A positive cross is golfer-right when facing green.
   side=Math.abs(cross)<length*4?'center':cross>0?'right':'left';
   stage=along<.25?'tee zone':along<.67?'landing corridor':along<=1.1?'approach':'beyond green';
  }
  labels.push(Object.freeze({type:shape.type,side,stage,point:Object.freeze(center)}));
 }
 return Object.freeze({route,labels:Object.freeze(labels),mappedFairway:given.some(s=>s.type==='fairway')});
}
