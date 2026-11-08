// Pure caddy-book annotation engine. Derives route and trouble labels only from
// explicitly hole-assigned, positioned polygons; no invented doglegs or distances.
const midpoint=shape=>shape.points.reduce((sum,[x,y])=>[sum[0]+x/shape.points.length,sum[1]+y/shape.points.length],[0,0]);
const valid=s=>s&&Array.isArray(s.points)&&s.points.length>=3&&s.points.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite));
export function pencilBookAnnotations(shapes=[],mappedPath=null){
 const given=Array.isArray(shapes)?shapes.filter(valid):[];
 const tees=given.filter(s=>s.type==='tee'),greens=given.filter(s=>s.type==='green');
 const hasPath=Array.isArray(mappedPath)&&mappedPath.length>=2&&mappedPath.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite));
 const hasRoute=tees.length===1&&greens.length===1||hasPath;
 const tee=tees.length===1?midpoint(tees[0]):hasPath?mappedPath[0]:null;
 const green=greens.length===1?midpoint(greens[0]):hasPath?mappedPath.at(-1):null;
 const dx=hasRoute?green[0]-tee[0]:0,dy=hasRoute?green[1]-tee[1]:0;
 const length=Math.hypot(dx,dy);
 const path=hasPath
  ?[tee,...mappedPath.slice(1,-1),green]:[tee,green];
 const route=hasRoute&&length>=10?Object.freeze({tee:Object.freeze(tee),green:Object.freeze(green),path:Object.freeze(path)}):null;
 let routeLength=0;
 const segments=route?path.slice(1).map(([x,y],i)=>{
  const [a,b]=path[i],dx=x-a,dy=y-b,length=Math.hypot(dx,dy);
  const segment={a,b,dx,dy,length,offset:routeLength};
  routeLength+=length;
  return segment;
 }).filter(segment=>segment.length>0):[];
 const labels=[];
 for(const shape of given){
  if(!['bunker','water'].includes(shape.type))continue;
  const center=midpoint(shape);
  let side='position unconfirmed',stage='position unconfirmed';
  if(route){
   let nearest=null;
   for(const segment of segments){
    const {a,b,dx,dy,length,offset}=segment;
    const rawProgress=((center[0]-a)*dx+(center[1]-b)*dy)/(length*length);
    const progress=Math.max(0,Math.min(1,rawProgress));
    const distance=Math.hypot(center[0]-a-dx*progress,center[1]-b-dy*progress);
    if(!nearest||distance<nearest.distance){
     const extended=segment===segments.at(-1)?Math.max(progress,rawProgress):progress;
     nearest={distance,across:(dx*(center[1]-b)-dy*(center[0]-a))/length,along:(offset+extended*length)/routeLength};
    }
   }
   const {across,along}=nearest;
   side=Math.abs(across)<4?'center':across>0?'right':'left';
   stage=along<.25?'tee zone':along<.67?'landing corridor':along<=1.1?'approach':'beyond green';
  }
  labels.push(Object.freeze({type:shape.type,side,stage,point:Object.freeze(center)}));
 }
 return Object.freeze({route,labels:Object.freeze(labels),mappedFairway:given.some(s=>s.type==='fairway')});
}
