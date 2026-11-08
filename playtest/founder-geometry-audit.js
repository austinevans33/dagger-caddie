// Founder mapping safety audit. External OSM feature bundles are not
// necessarily hole-accurate merely because their metadata names the club.
// A mapped route must be assigned to the RIGHT hole before Yardage and
// House Ghost are permitted to share it. No geography is synthesized.
import {courseArtFeatures,buildHoleSketch} from './hole-sketch.js';
import {auditFounderBook} from './founders-book-quality.js';
const RAD=Math.PI/180;
const YARDS_PER_METER=1.093613298;
function segmentYards(a,b){
 if(!Array.isArray(a)||!Array.isArray(b)||a.length<2||b.length<2||
    ![...a,...b].every(Number.isFinite))return NaN;
 const lat=(a[1]+b[1])/2*RAD;
 const east=(b[0]-a[0])*RAD*Math.cos(lat);
 const north=(b[1]-a[1])*RAD;
 return 6371000*Math.hypot(east,north)*YARDS_PER_METER;
}
export function mappedRouteYards(records,holeNumber){
 const routes=Array.isArray(records)?records.filter(item=>
  item?.properties?.layer==='hole'&&item.properties?.holes?.includes(holeNumber)&&
  item.geometry?.type==='LineString'): [];
 // Two competing primary routes mean that we cannot identify THE hole.
 if(routes.length!==1)return null;
 const points=routes[0].geometry.coordinates;
 if(!Array.isArray(points)||points.length<2||points.length>1000)return null;
 let yards=0;
 for(let i=1;i<points.length;i++){
  const segment=segmentYards(points[i-1],points[i]);
  if(!Number.isFinite(segment)||segment<=0)return null;
  yards+=segment;
 }
 return Number.isFinite(yards)?yards:null;
}
export function auditFounderGeometry({records,holes,metadata,expectedRef,referenceTees=[],holeCount=18}={}){
 const empty={pass:false,reason:'unverified-map',quality:null,ratioErrors:[]};
 if(![9,18].includes(holeCount)||!Array.isArray(records)||!Array.isArray(holes)||holes.length!==holeCount||
    metadata?.course_ref!==expectedRef||typeof expectedRef!=='string'||!expectedRef)
  return Object.freeze({...empty,reason:'wrong-course-or-scorecard'});
 const sketches=[];
 const ratioErrors=[];
 for(let number=1;number<=holeCount;number++){
  const yardage=holes[number-1];
  if(yardage?.number!==number||!Number.isInteger(yardage.yards)||yardage.yards<50)return Object.freeze({...empty,reason:'invalid-hole-card'});
  const route=mappedRouteYards(records,number);
  if(route===null){ratioErrors.push(number);sketches.push(buildHoleSketch([]));continue;}
  const ratio=route/yardage.yards;
  // Calibrated using actual Bayonet White playing lines, which range 0.98–1.29.
  // Allow broad slack for path curvature, tee sets and approximate OSM work.
  // It is a gross mismatch detector, NOT proof of correct geographic identity.
  if(ratio<0.7||ratio>1.6)ratioErrors.push(number);
  sketches.push(buildHoleSketch(courseArtFeatures(records,number)));
 }
 const quality=auditFounderBook({holes,sketches,source:metadata.course_ref,holeCount});
 const permittedReferenceTees=quality.checks.filter(hole=>!hole.tee&&hole.green&&hole.route&&
  referenceTees.includes(hole.number)&&records.some(record=>record.properties?.layer==='hole'&&
   record.properties?.holes?.includes(hole.number)&&record.properties?.reference_tee?.source&&
   record.properties?.reference_tee?.method)).map(hole=>hole.number);
 const referenceReady=ratioErrors.length===0&&quality.scorecardComplete&&quality.fairwayHoles>=17&&
  quality.mappedHoles+permittedReferenceTees.length===18&&permittedReferenceTees.length>0;
 return Object.freeze({
  pass:quality.ghostOnSameHoleReady&&ratioErrors.length===0,
  referenceReady,referenceTees:Object.freeze(permittedReferenceTees),
  reason:ratioErrors.length?'route-yardage-mismatch':
    quality.ghostOnSameHoleReady?'structural-parity':referenceReady?'reviewed-reference-tees':'incomplete-hole-art',
  quality,
  ratioErrors:Object.freeze(ratioErrors)
 });
}
