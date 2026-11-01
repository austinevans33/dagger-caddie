// Normalize source-provided GeoJSON into hole sketches ONLY when feature-to-hole attribution is explicit.
// No nearest-hole guesses: those require a separate validated spatial association process.
const types={fairway:'fairway',green:'green',tee:'tee',bunker:'bunker',water:'water',hole:'hole'};
const validPoint=p=>Array.isArray(p)&&p.length>=2&&p.slice(0,2).every(n=>typeof n==='number'&&Number.isFinite(n));
function featureType(p){const key=String(p?.golf||p?.type||p?.feature||'').toLowerCase();return types[key]||null;}
function holeNumber(p){for(const k of ['holeNumber','hole_number','hole','ref']){const n=Number(p?.[k]);if(Number.isInteger(n)&&n>=1&&n<=18)return n;}return null;}
export function verifiedGeometryFromGeoJSON(data,{sourceVerified=false}={}){
 if(!sourceVerified||data?.type!=='FeatureCollection'||!Array.isArray(data.features)||data.features.length>3000)return [];
 const groups=new Map();
 for(const f of data.features){
  const n=holeNumber(f?.properties),type=featureType(f?.properties),geometry=f?.geometry;
  if(!n||!type||!geometry)continue;
  let paths=[];
  if(geometry.type==='Polygon')paths=geometry.coordinates?.slice(0,1)||[];
  if(geometry.type==='MultiPolygon')paths=(geometry.coordinates||[]).flatMap(poly=>poly.slice(0,1));
  if(geometry.type==='LineString'&&type==='hole')paths=[geometry.coordinates];
  for(const path of paths){
   if(!Array.isArray(path)||path.length<2||path.length>6000||!path.every(validPoint))continue;
   const list=groups.get(n)||[];list.push({type,coordinates:path.map(p=>p.slice(0,2))});groups.set(n,list);
  }
 }
 return [...groups].sort((a,b)=>a[0]-b[0]).map(([n,features])=>({holeNumber:n,source:'verified-geometry',features}));
}
