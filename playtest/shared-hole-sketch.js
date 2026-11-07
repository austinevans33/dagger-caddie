// Shared paper-hole renderer for Yardage Book and House Ghost.
// Only hole-assigned provider polygons enter this function. Ghost's simulated
// shot tracer remains separate: synthetic strokes are NOT GPS coordinates.
const NS='http://www.w3.org/2000/svg';
export const PENCIL_PALETTE=Object.freeze({
 green:['#d9e0c1','#455c47'],fairway:['#e2e5cc','#596955'],
 bunker:['#eee4c5','#8d8265'],water:['#d1dce0','#516d78'],
 rough:['#e3e1d3','#85816e'],tee:['#e1dec3','#6d725d']
});
export function renderSharedHoleSketch(svg,shapes=[],annotations={},options={}){
 const height=Number.isFinite(options.height)&&options.height>=180&&options.height<=700?options.height:220;
 const width=300;
 if(!svg||typeof svg.ownerDocument?.createElementNS!=='function')throw Error('SVG element required');
 svg.replaceChildren();
 svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
 const item=(tag,attributes,caption)=>{
  const node=svg.ownerDocument.createElementNS(NS,tag);
  for(const [key,value] of Object.entries(attributes))node.setAttribute(key,String(value));
  if(caption!==undefined)node.textContent=caption;
  return node;
 };
 const polygons=[];
 // Provider fairway, rough, bunker and water first; route/labels stay readable.
 shapes.forEach((shape,i)=>{
  if(!PENCIL_PALETTE[shape.type]||!Array.isArray(shape.points))return;
  const polygon=item('polygon',{
   points:shape.points.map(p=>p.join(',')).join(' '),
   fill:PENCIL_PALETTE[shape.type][0],stroke:PENCIL_PALETTE[shape.type][1],
   'stroke-width':shape.type==='fairway'?2.3:1.65,'stroke-dasharray':shape.type==='fairway'?'6 3':'3 3','stroke-linejoin':'round',
   'data-map-feature':i
  });
  svg.append(polygon);
  polygons[i]=polygon;
 });
 if(annotations.route){
  const {tee,green}=annotations.route;
  svg.append(item('path',{d:'M '+tee.join(' ')+' L '+green.join(' '),class:'route-mark',fill:'none',stroke:'#42584a','stroke-width':1.8,'stroke-dasharray':'7 5'}));
  svg.append(item('circle',{cx:tee[0],cy:tee[1],r:5,class:'route-target',fill:'#f7f0dd',stroke:'#42584a'}));
  svg.append(item('text',{x:Math.min(tee[0]+8,254),y:Math.min(tee[1]+4,height-4),class:'pencil-map-label',fill:'#304a3a','font-size':11},'TEE'));
  svg.append(item('text',{x:Math.min(green[0]+8,width-56),y:Math.max(green[1]-7,12),class:'pencil-map-label',fill:'#304a3a','font-size':11},'GREEN'));
 }
 for(const hazard of annotations.labels||[]){
  const x=Math.max(4,Math.min(hazard.point[0]+6,width-40)),y=Math.max(12,Math.min(hazard.point[1]-5,height-10));
  svg.append(item('text',{x,y,class:'hazard-tag',fill:'#4a483c','font-size':10},hazard.type==='water'?'WATER':'BKR'));
 }
 return polygons;
}
