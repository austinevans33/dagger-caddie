// Progressive yardage-book coverage: recognizable pages everywhere,
// never fabricated hole facts or geometry. No network or storage side effects.
const integer=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
export function classifyYardageCoverage({course=null,holes=[],geometry=[]}={}) {
 const identified=!!(course&&typeof course.name==='string'&&course.name.trim());
 const verified=Array.isArray(holes)?holes.filter(h=>h&&integer(h.number,1,18)&&integer(h.par,3,6)&&integer(h.yards,50,800)): [];
 const distinct=new Set(verified.map(h=>h.number));
 const mapped=Array.isArray(geometry)?geometry.filter(g=>g&&integer(g.holeNumber,1,18)&&g.source==='verified-geometry'&&
  Array.isArray(g.features)&&g.features.some(f=>f&&Array.isArray(f.coordinates)&&f.coordinates.length>=2)): [];
 const mappedNumbers=new Set(mapped.map(g=>g.holeNumber));
 const tier=!identified?'unavailable':mappedNumbers.size?'illustrated':distinct.size?'scorecard':'basic';
 return Object.freeze({tier,holesWithVerifiedScorecard:distinct.size,holesWithVerifiedGeometry:mappedNumbers.size,
  supported:identified,canDrawMappedHole:mappedNumbers.size>0,
  notice:tier==='illustrated'?'Only explicitly mapped holes have geographic diagrams.':
   tier==='scorecard'?'Verified par and tee yardages; hole shapes are not verified.':
   tier==='basic'?'Course identified; individual hole details may be unavailable.':
   'Choose a supported course to open the yardage book.'});
}
export function yardageHoleFeatures(coverage,geometry,holeNumber){
 if(coverage?.tier!=='illustrated'||!integer(holeNumber,1,18)||!Array.isArray(geometry))return null;
 const g=geometry.find(x=>x?.holeNumber===holeNumber&&x?.source==='verified-geometry');
 if(!g||!Array.isArray(g.features)||!g.features.some(f=>Array.isArray(f?.coordinates)&&f.coordinates.length>=2))return null;
 // Never remap untrusted source coordinates to geographic claims.
 return g.features.filter(f=>['fairway','green','tee','bunker','water','hole'].includes(f?.type)&&
   Array.isArray(f.coordinates)&&f.coordinates.length>=2&&f.coordinates.every(x=>Array.isArray(x)&&x.length===2&&x.every(Number.isFinite)))
  .map(f=>({type:f.type,coordinates:f.coordinates.map(x=>[...x])}));
}
