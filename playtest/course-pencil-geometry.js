// Read-only spatial adapter for OpenGolfAPI's free, coarse OSM course features.
// Does not claim surveyed boundaries, pin position, or measured GPS distances.
const BASE='https://api.opengolfapi.org/api/v1/features';
const TYPES=new Set(['green','fairway','bunker','water','rough','tee']);
function coordinate(v){return Array.isArray(v)&&v.length>=2&&Number.isFinite(v[0])&&Number.isFinite(v[1])&&v[0]>=-180&&v[0]<=180&&v[1]>=-90&&v[1]<=90;}
function ring(points){
 if(!Array.isArray(points)||points.length<4||points.length>1000||!points.every(coordinate))return null;
 return points.map(([lng,lat])=>Object.freeze([lng,lat]));
}
function polygon(coordinates){
 if(!Array.isArray(coordinates)||!coordinates.length)return null;
 const exterior=ring(coordinates[0]);
 return exterior&&new Set(exterior.map(pt=>pt.join(','))).size>=3?exterior:null;
}
export function normalizeCourseFeatures(payload,{holeNumber=1}={}){
 if(!Number.isInteger(holeNumber)||holeNumber<1||holeNumber>18)return [];
 const raw=payload?.features;
 if(!Array.isArray(raw)||raw.length>150)return [];
 const result=[];
 for(const item of raw){
  const props=item?.properties||{};
  const kind=String(props.type||props.feature_type||props.golf||'').toLowerCase().replace(/[- ]/g,'_');
  if(!TYPES.has(kind))continue;
  // Hole identity must be explicit. Course-wide OSM features may overlap
  // multiple holes, so drawing unassigned polygons would mislead golfers.
  const hole=props.hole??props.hole_number;
  if(hole==null||!/^([1-9]|1[0-8])$/.test(String(hole))||Number(hole)!==holeNumber)continue;
  const geometry=item?.geometry;
  const polygons=geometry?.type==='Polygon'?[geometry.coordinates]:
   geometry?.type==='MultiPolygon'?geometry.coordinates:null;
  if(!Array.isArray(polygons)||polygons.length>20)continue;
  for(const coords of polygons){
   const outer=polygon(coords);
   if(!outer)continue;
   result.push(Object.freeze({type:kind,points:Object.freeze(outer)}));
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
export function pencilGeometry(features,{width=300,height=220,padding=16}={}){
 if(!Array.isArray(features)||!features.length)return [];
 const all=features.flatMap(f=>f.points);
 const xVals=all.map(p=>p[0]),yVals=all.map(p=>p[1]);
 const minX=Math.min(...xVals),maxX=Math.max(...xVals),minY=Math.min(...yVals),maxY=Math.max(...yVals);
 if(![minX,maxX,minY,maxY].every(Number.isFinite)||maxX===minX||maxY===minY)return [];
 const latScale=Math.cos(((minY+maxY)/2)*Math.PI/180);
 if(latScale<.01)return [];
 const spanX=(maxX-minX)*latScale,spanY=maxY-minY,scale=Math.min((width-2*padding)/spanX,(height-2*padding)/spanY);
 const xOff=(width-spanX*scale)/2,yOff=(height-spanY*scale)/2;
 return features.map(f=>Object.freeze({type:f.type,points:f.points.map(([lng,lat])=>Object.freeze([
  +(xOff+(lng-minX)*latScale*scale).toFixed(2),+(yOff+(maxY-lat)*scale).toFixed(2)
 ]))}));
}
