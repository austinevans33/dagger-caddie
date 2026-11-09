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
 const labelBounds=[];
 const mapLabel=(caption,point,{endpoint=false,reference=false,below=false}={})=>{
  // Reserve space for the lettering and its paper outline in both map sizes.
  const size=endpoint?11:10;
  const labelWidth=caption.length*size*.72+4;
  const x=Math.max(4,Math.min(point[0]+7,width-labelWidth-4));
  const baseline=point[1]+(below?18:-6);
  for(const shift of [0,13,-13,26,-26]){
   const y=Math.max(size+4,Math.min(baseline+shift,height-5));
   const box={left:x-2,right:x+labelWidth,top:y-size-2,bottom:y+4};
   if(labelBounds.some(other=>box.left<other.right&&box.right>other.left&&box.top<other.bottom&&box.bottom>other.top))continue;
   labelBounds.push(box);
   svg.append(item('text',{x,y,class:endpoint?'pencil-map-label':'hazard-tag',
    fill:endpoint?'#294437':reference?'#3b5c68':'#4a483c',
    'font-family':endpoint?'Georgia,serif':'system-ui,sans-serif','font-size':size,
    'font-weight':700,'font-style':endpoint||reference?'italic':'normal',
    'paint-order':'stroke',stroke:'#f7f0dd','stroke-width':3,'stroke-linejoin':'round'},caption));
   return true;
  }
  return false;
 };
 if(annotations.route){
  const {tee,green,path=[tee,green]}=annotations.route;
  svg.append(item('path',{d:'M '+path.map(point=>point.join(' ')).join(' L '),class:'route-mark',fill:'none',stroke:'#42584a','stroke-width':1,'stroke-dasharray':'3 5','stroke-opacity':.65}));
  svg.append(item('circle',{cx:tee[0],cy:tee[1],r:3,class:'route-target',fill:'#f7f0dd',stroke:'#42584a'}));
  mapLabel(annotations.approximateTee?'TEE (APPROX.)':'TEE',tee,{endpoint:true,below:true});
  mapLabel('GREEN',green,{endpoint:true});
 }
 if(annotations.reference){
  const {point,label}=annotations.reference;
  mapLabel(label+' *',point,{reference:true,below:point===annotations.route?.green});
 }
 const labels=[];
 for(const hazard of annotations.labels||[]){
  if(labels.length>=5||labels.some(other=>Math.hypot(other[0]-hazard.point[0],other[1]-hazard.point[1])<22))continue;
  if(mapLabel(hazard.type==='water'?'WATER':'BKR',hazard.point))labels.push(hazard.point);
 }
 return polygons;
}
