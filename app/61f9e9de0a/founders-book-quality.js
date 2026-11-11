// Bayonet-parity quality gate for the Founders books.
// A populated scorecard is useful, but NEVER a B/B+ Yardage Book by itself.
// Yardage and House Ghost share hole-sketch.js and shared-hole-sketch.js.
function shapeCount(sketch,type){
 return Array.isArray(sketch?.shapes)?sketch.shapes.filter(x=>x.type===type&&Array.isArray(x.points)&&x.points.length>=3).length:0;
}
export function auditFounderBook({holes=[],sketches=[],source='',holeCount=18}={}){
 const count=holeCount===9?9:18;
 const checks=[];
 const scorecard=holes.length===count&&holes.every((h,i)=>h?.number===i+1&&
  Number.isInteger(h.par)&&h.par>=3&&h.par<=6&&Number.isInteger(h.yards)&&h.yards>=50&&h.yards<=800);
 let routes=0,greens=0,tees=0,fairways=0,mapped=0;
 for(let i=0;i<count;i++){
  const sketch=sketches[i];
  const route=sketch?.annotations?.route;
  const oriented=Array.isArray(route?.tee)&&Array.isArray(route?.green)&&
   route.tee.length===2&&route.green.length===2&&
   route.tee.every(Number.isFinite)&&route.green.every(Number.isFinite)&&
   route.tee[1]>route.green[1];
  const green=shapeCount(sketch,'green')>0;
  const tee=shapeCount(sketch,'tee')>0;
  const fairway=shapeCount(sketch,'fairway')>0;
  if(oriented)routes++;
  if(green)greens++;
  if(tee)tees++;
  if(fairway)fairways++;
  if(oriented&&green&&tee)mapped++;
  checks.push(Object.freeze({number:i+1,scorecard:!!(scorecard&&holes[i]),route:!!oriented,green,tee,fairway}));
 }
 // Bayonet itself has 18 mapped routes/tee/green and 17 mapped fairways.
 // Do not silently lower that bar to "18 scorecards + generic drawing."
 // A native nine may omit a single unmapped fairway on a verified par 3.
 const fairwayPass=count===18?fairways>=17:
  fairways>=8&&checks.every(hole=>hole.fairway||holes[hole.number-1]?.par===3);
 const bayonetParity=scorecard&&mapped===count&&fairwayPass;
 return Object.freeze({
  scorecardComplete:scorecard,
  mappedHoles:mapped,
  fairwayHoles:fairways,
  drawnRoutes:routes,
  greenHoles:greens,
  teeHoles:tees,
  ghostOnSameHoleReady:bayonetParity,
  grade:bayonetParity?'B+ yardage book':'needs mapped hole art',
  source:source||'unknown',
  checks:Object.freeze(checks)
 });
}
