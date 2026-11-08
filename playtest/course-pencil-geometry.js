// Read-only spatial adapter for OpenGolfAPI's free, coarse OSM course features.
// Does not claim surveyed boundaries, pin position, or measured GPS distances.
const BASE='https://api.opengolfapi.org/api/v1/features';
const TYPES=new Set(['green','fairway','bunker','water','rough','tee','hole']);
function coordinate(v){return Array.isArray(v)&&v.length>=2&&Number.isFinite(v[0])&&Number.isFinite(v[1])&&v[0]>=-180&&v[0]<=180&&v[1]>=-90&&v[1]<=90;}
function ring(points){
 if(!Array.isArray(points)||points.length<4||points.length>1000||!points.every(coordinate))return null;
 return points.map(([lng,lat])=>Object.freeze([lng,lat]));
}
function polygon(coordinates){
 if(!Array.isArray(coordinates)||!coordinates.length)return null;
 const [points,...interiors]=coordinates.map(ring);
 if(!points||new Set(points.map(pt=>pt.join(','))).size<3||interiors.some(inner=>!inner))return null;
 return {points,...(interiors.length?{interiors:Object.freeze(interiors)}:{})};
}
export function normalizeCourseFeatures(payload,{holeNumber=1}={}){
 if(!Number.isInteger(holeNumber)||holeNumber<1||holeNumber>18)return [];
 const raw=payload?.features;
 if(!Array.isArray(raw)||raw.length>150)return [];
 const result=[];
 for(const item of raw){
  const props=item?.properties||{};
  const tags=Array.isArray(item?.tags)?item.tags.filter(tag=>typeof tag==='string'):[];
  const tagValue=key=>tags.find(tag=>tag.startsWith(key+'='))?.slice(key.length+1);
  const kind=String(props.type||props.feature_type||props.golf||tagValue('golf')||'').toLowerCase().replace(/[- ]/g,'_');
  if(!TYPES.has(kind))continue;
  // Hole identity must be explicit. Course-wide OSM features may overlap
  // multiple holes, so drawing unassigned polygons would mislead golfers.
  const hole=props.hole??props.hole_number??tagValue('hole')??(kind==='hole'?tagValue('ref'):null);
  if(hole==null||!/^([1-9]|1[0-8])$/.test(String(hole))||Number(hole)!==holeNumber)continue;
  const geometry=item?.geometry;
  if(kind==='hole'){
   const points=geometry?.type==='LineString'?geometry.coordinates:null;
   if(Array.isArray(points)&&points.length>=2&&points.length<=1000&&points.every(coordinate)){
    result.push(Object.freeze({type:kind,points:Object.freeze(points.map(([lng,lat])=>Object.freeze([lng,lat])))}));
    if(result.length>=100)return Object.freeze(result);
   }
   continue;
  }
  const polygons=geometry?.type==='Polygon'?[geometry.coordinates]:
   geometry?.type==='MultiPolygon'?geometry.coordinates:null;
  if(!Array.isArray(polygons)||polygons.length>20)continue;
  for(const coords of polygons){
   const outline=polygon(coords);
   if(!outline)continue;
   result.push(mapOutline({type:kind,...outline},point=>point));
   if(result.length>=100)return Object.freeze(result);
  }
 }
 return Object.freeze(result);
}
export async function loadCourseFeatures(selection,holeNumber,{fetcher=fetch,signal}={}){
 const c=selection?.course;
 if(c?.provider!=='opengolfapi'||typeof c.providerCourseId!=='string'||!/^[a-zA-Z0-9._:-]{1,80}$/.test(c.providerCourseId)||!Number.isInteger(holeNumber)||holeNumber<1||holeNumber>18)return [];
 const query=new URLSearchParams({course:c.providerCourseId,hole:String(holeNumber)});
 const response=await fetcher(BASE+'?'+query,{headers:{Accept:'application/json'},signal});
 if(!response.ok)throw Error('Spatial course features unavailable ('+response.status+')');
 return normalizeCourseFeatures(await response.json(),{holeNumber});
}
// Orient only when both a verified tee and green polygon are available.
// This is an artwork transform, not an invented bearing, pin, or path.
function featureBounds(features){
 let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
 for(const feature of features){
  for(const [x,y] of feature.points){
   left=Math.min(left,x);right=Math.max(right,x);
   top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
 }
 return {left,right,top,bottom};
}
function mapOutline(shape, project) {
 const points=Object.freeze(shape.points.map(project));
 const interiors=shape.interiors?.map(inner=>Object.freeze(inner.map(project)));
 return Object.freeze({type:shape.type,points,...(interiors?.length?{interiors:Object.freeze(interiors)}:{})});
}

export function orientPencilTeeToGreen(shapes,{width=300,height=220,padding=16}={}){
 if(!Array.isArray(shapes)||!shapes.length)return shapes;
 const tee=shapes.filter(s=>s.type==='tee'),greens=shapes.filter(s=>s.type==='green');
 const paths=shapes.filter(s=>s.type==='hole');
 if((tee.length!==1||greens.length!==1)&&paths.length!==1)return shapes;
 const center=s=>s.points.reduce((a,p)=>[a[0]+p[0]/s.points.length,a[1]+p[1]/s.points.length],[0,0]);
 const start=tee.length===1?center(tee[0]):paths[0].points[0];
 const end=greens.length===1?center(greens[0]):paths[0].points.at(-1);
 const dx=end[0]-start[0],dy=end[1]-start[1];
 if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.hypot(dx,dy)<3)return shapes;
 const angle=-Math.PI/2-Math.atan2(dy,dx),cos=Math.cos(angle),sin=Math.sin(angle);
 const projected=shapes.map(shape=>mapOutline(shape,([x,y])=>[
  (x-start[0])*cos-(y-start[1])*sin,
  (x-start[0])*sin+(y-start[1])*cos
 ]));
 const {left,right,top,bottom}=featureBounds(projected);
 if(![left,right,top,bottom].every(Number.isFinite))return shapes;
 const spanX=right-left,spanY=bottom-top;
 if(spanX<=0&&spanY<=0)return shapes;
 const scale=Math.min((width-padding*2)/spanX,(height-padding*2)/spanY);
 if(!Number.isFinite(scale)||scale<=0)return shapes;
 const offX=(width-spanX*scale)/2,offY=(height-spanY*scale)/2;
 return projected.map(shape=>mapOutline(shape,([x,y])=>Object.freeze([
  +(offX+(x-left)*scale).toFixed(2),+(offY+(y-top)*scale).toFixed(2)
 ])));
}

export function pencilGeometry(features,{width=300,height=220,padding=16}={}){
 if(!Array.isArray(features)||!features.length)return [];
 const {left:minX,right:maxX,top:minY,bottom:maxY}=featureBounds(features);
 if(![minX,maxX,minY,maxY].every(Number.isFinite)||(maxX===minX&&maxY===minY))return [];
 const latScale=Math.cos(((minY+maxY)/2)*Math.PI/180);
 if(latScale<.01)return [];
 const spanX=(maxX-minX)*latScale,spanY=maxY-minY,scale=Math.min((width-2*padding)/spanX,(height-2*padding)/spanY);
 const xOff=(width-spanX*scale)/2,yOff=(height-spanY*scale)/2;
 return features.map(f=>mapOutline(f,([lng,lat])=>Object.freeze([
  +(xOff+(lng-minX)*latScale*scale).toFixed(2),+(yOff+(maxY-lat)*scale).toFixed(2)
 ])));
}
