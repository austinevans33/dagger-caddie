import {yardageHoleFeatures,classifyYardageCoverage} from './yardage-coverage.js';
// Verified geographic geometry only. Convert coordinates into a compact pencil-style SVG.
// No guessed obstacles, yardages, tee orientation or pin location.
export function sketchVerifiedHole({geometry=[],holeNumber,course=null}={}){
 const coverage=classifyYardageCoverage({course,geometry});
 const features=yardageHoleFeatures(coverage,geometry,holeNumber);
 if(!features?.length)return null;
 // A stray mapped hazard is not a usable hole illustration.
 if(!features.some(f=>f.type==='hole'||f.type==='fairway'))return null;
 const all=features.flatMap(f=>f.coordinates);
 // Bound untrusted provider complexity to keep page flips responsive on phones.
 if(all.length>6000)return null;
 const xs=all.map(p=>p[0]),ys=all.map(p=>p[1]);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 if(![minX,maxX,minY,maxY].every(Number.isFinite))return null;
 const spanX=maxX-minX,spanY=maxY-minY;
 if(spanX<=0||spanY<=0||spanX>360||spanY>180)return null;
 // Longitude degrees shrink by cos(latitude); correct map aspect on phone.
 const midLatitude=(maxY+minY)/2;
 const xFactor=Math.max(.01,Math.cos(midLatitude*Math.PI/180));
 const physicalWidth=spanX*xFactor;
 const scale=Math.min(174/physicalWidth,300/spanY);
 const offsetX=(220-physicalWidth*scale)/2,offsetY=(340-spanY*scale)/2;
 const point=([x,y])=>[offsetX+(x-minX)*xFactor*scale,offsetY+(maxY-y)*scale].map(v=>v.toFixed(2)).join(',');
 const palette={fairway:'#b9c99a',green:'#9dbb81',tee:'#7a9f6d',bunker:'#e7d5ad',water:'#a6c1bd',hole:'none'};
 const paths=features.map(f=>{
  const closed=['fairway','green','tee','bunker','water'].includes(f.type);
  if(closed&&f.coordinates.length<3)return '';
  if(!closed&&f.coordinates.length<2)return '';
  const d=f.coordinates.map((p,i)=>(i?'L':'M')+point(p).replace(',',' ')).join(' ')+(closed?' Z':'');
  const stroke=f.type==='hole'?'#475d4d':'#59735a';
  return '<path d="'+d+'" fill="'+palette[f.type]+'" stroke="'+stroke+'" stroke-width="'+(f.type==='hole'?1.8:1.5)+'" stroke-linejoin="round" stroke-linecap="round" opacity=".94"/>';
 }).join('');
 if(!paths)return null;
 return '<svg viewBox="0 0 220 340" role="img" aria-label="Source-verified overhead hole sketch" xmlns="http://www.w3.org/2000/svg"><rect width="220" height="340" fill="#f2ead9"/>'+paths+'</svg>';
}
