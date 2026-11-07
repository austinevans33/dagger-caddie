// Shared paper-hole renderer for Yardage Book and House Ghost.
// Only hole-assigned provider polygons enter this function. Ghost's simulated
// shot tracer remains separate: synthetic strokes are NOT GPS coordinates.
const NS='http://www.w3.org/2000/svg';
export const PENCIL_PALETTE=Object.freeze({
 green:['#bac8a0','#455c47'],fairway:['#ced7ae','#596955'],
 bunker:['#e9d8b1','#8d8265'],water:['#b8ccd0','#516d78'],
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
 const defs=item('defs',{});
 for(const [kind,[paper,pencil]] of Object.entries(PENCIL_PALETTE)){
  const pattern=item('pattern',{id:'pencil-'+kind,width:7,height:7,patternUnits:'userSpaceOnUse'});
  pattern.append(item('rect',{width:7,height:7,fill:paper}));
  pattern.append(item('path',{
   d:kind==='water'?'M0 2h7 M1 5h4':'M-1 5l6 -6 M2 8l6 -6 M5 10l5 -5',
   stroke:pencil,'stroke-opacity':.17,'stroke-width':.7,fill:'none'
  }));
  defs.append(pattern);
 }
 svg.append(defs);
 const polygons=[];
 // Provider fairway, rough, bunker and water first; route/labels stay readable.
 shapes.forEach((shape,i)=>{
  if(!PENCIL_PALETTE[shape.type]||!Array.isArray(shape.points))return;
  const points=ring=>ring.map(p=>p.join(',')).join(' ');
  const cutouts=shape.interiors;
  const geometry=cutouts?.length
   ? {d:[shape.points,...cutouts].map(ring=>'M '+points(ring)+' Z').join(' '),'fill-rule':'evenodd'}
   : {points:points(shape.points)};
  const polygon=item(cutouts?.length?'path':'polygon',{
   ...geometry,
   fill:'url(#pencil-'+shape.type+')',stroke:PENCIL_PALETTE[shape.type][1],
   'stroke-width':shape.type==='fairway'?1.6:1.1,'stroke-linejoin':'round',
   'data-map-feature':i
  });
  svg.append(polygon);
  polygons[i]=polygon;
 });
 if(annotations.route){
  const {tee,green,path=[tee,green]}=annotations.route;
  svg.append(item('path',{d:'M '+path.map(point=>point.join(' ')).join(' L '),class:'route-mark',fill:'none',stroke:'#42584a','stroke-width':1,'stroke-dasharray':'3 5','stroke-opacity':.65}));
  svg.append(item('circle',{cx:tee[0],cy:tee[1],r:3,class:'route-target',fill:'#f7f0dd',stroke:'#42584a'}));
  svg.append(item('text',{x:Math.min(tee[0]+8,254),y:Math.min(tee[1]+4,height-4),class:'pencil-map-label',fill:'#304a3a','font-size':11},'TEE'));
  svg.append(item('text',{x:Math.min(green[0]+8,width-56),y:Math.max(green[1]-7,12),class:'pencil-map-label',fill:'#304a3a','font-size':11},'GREEN'));
 }
 const labels=[];
 for(const hazard of annotations.labels||[]){
  if(labels.length>=5||labels.some(other=>Math.hypot(other[0]-hazard.point[0],other[1]-hazard.point[1])<22))continue;
  labels.push(hazard.point);
  const x=Math.max(4,Math.min(hazard.point[0]+6,width-40)),y=Math.max(12,Math.min(hazard.point[1]-5,height-10));
  svg.append(item('text',{x,y,class:'hazard-tag',fill:'#4a483c','font-size':10,'font-style':'italic','paint-order':'stroke',stroke:'#f7f0dd','stroke-width':2},hazard.type==='water'?'WATER':'BKR'));
 }
 if(annotations.reference){
  const {point,label}=annotations.reference;
  svg.append(item('text',{x:Math.min(point[0]+8,width-96),y:point[1]-9,class:'hazard-tag',
   fill:'#3b5c68','font-size':10,'font-style':'italic','paint-order':'stroke',stroke:'#f7f0dd','stroke-width':2},label+' *'));
 }
 return polygons;
}
