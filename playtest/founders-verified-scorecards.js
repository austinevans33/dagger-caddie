// Curated founder course books, separate from OpenGolfAPI identity.
// Never alias another course from just its name; Founder course IDs are exact.
// King’s Grant holes are from its club-published scorecard. Quail Ridge's
// per-hole card comes from the Sanford-specific Zomma source; its printed
// total rows conflict with their hole sums, so we expose sums only.
const founderProvider='dagger-founder';
const holeRange=Array.from({length:18},(_,i)=>i+1);
const founders=Object.freeze([
 {
  id:'kings-grant-fayetteville-nc',name:"King's Grant Golf & Country Club",region:'Fayetteville, NC',
  par:[4,5,4,3,4,5,3,4,4,4,3,4,3,4,5,3,4,5],
  handicapMen:[5,18,6,9,2,10,14,7,16,13,15,1,17,8,11,4,3,12],
  handicapWomen:[5,18,6,9,2,10,14,7,16,13,15,1,17,8,11,4,3,12],
  tees:{
   black:{label:'Black',yards:[406,460,370,191,396,521,173,407,329,361,168,404,140,370,501,222,381,509]},
   blue:{label:'Blue',yards:[376,417,351,180,394,509,159,388,288,330,156,370,132,348,468,205,352,470]},
   white:{label:'White',yards:[346,385,335,160,378,464,148,363,272,280,139,333,122,275,426,177,328,421]},
   gold:{label:'Gold',yards:[299,380,316,146,318,427,129,291,237,245,116,275,99,272,366,148,310,383]},
   red:{label:'Red',yards:[293,332,284,141,288,423,121,286,229,240,109,248,90,216,359,143,235,380]},
   forward:{label:'Forward',yards:[222,247,175,82,213,313,68,206,179,173,63,174,81,187,259,69,201,299]}
  },
  source:'kings-grant-club-scorecard',
  provenance:{source:'King’s Grant official scorecard',url:'https://kingsgrantgolfcc.com/course-details/',checked:'2026-11-07',
   geography:'Fayetteville, North Carolina',teeYardageIsNotPinDistance:true},
  map:{source:'https://zommagolf.com/courses/nc/kings-grant-golf-and-country-club/geo.json',ref:'nc/kings-grant-golf-and-country-club',status:'external-unverified-hole-assignment'}
 },
 {
  id:'quail-ridge-sanford-nc',name:'The Golf Club at Quail Ridge',region:'Sanford, NC',
  par:[4,4,3,5,4,4,3,5,4,4,3,4,3,5,4,5,4,4],
  handicapMen:[13,1,17,3,15,9,11,7,5,10,18,2,16,4,8,12,6,14],
  tees:{
   white:{label:'White',yards:[363,386,154,458,349,340,163,471,377,372,158,389,177,438,352,416,396,361]},
   gold:{label:'Gold',yards:[310,331,142,408,307,324,124,421,326,341,123,346,160,408,286,375,334,303]},
   red:{label:'Red',yards:[256,271,120,312,217,303,89,382,278,245,97,306,116,308,222,330,261,229]}
  },
  source:'quail-ridge-sanford-published-hole-card',
  provenance:{source:'Quail Ridge Golf Club · Sanford hole-by-hole listing',url:'https://zommagolf.com/courses/nc/quail-ridge-golf-club',
   checked:'2026-11-07',geography:'Sanford, North Carolina',
   audit:'Published total yardages disagree with the sum of individual hole distances. Dagger uses exact published hole values and the arithmetic sum; blue tee hole values are not published.',
   teeYardageIsNotPinDistance:true},
  map:{source:'https://zommagolf.com/courses/nc/quail-ridge-golf-club/geo.json',ref:'nc/quail-ridge-golf-club',status:'hole-numbering-requires-confirmation'}
 }  ,
 {
  id:'ryder-fort-bragg-nc',name:'Ryder Golf Course',region:'Fort Bragg, NC',
  par:[4,4,4,4,3,4,5,5,3,4,4,3,4,4,5,3,4,5],
  tees:{
   blue:{label:'Blue',yards:[406,404,332,383,191,381,527,526,190,333,294,175,403,353,501,149,367,487]},
   white:{label:'White',yards:[389,396,306,381,171,351,520,517,174,328,288,163,380,314,491,137,339,469]},
   red:{label:'Red',yards:[373,328,228,268,137,293,471,460,158,318,277,132,357,296,415,128,292,407]}
  },
  source:'ryder-fort-bragg-published-hole-card',
  provenance:{source:'Ryder Golf Course Fort Bragg hole card, reported figures (not checked against the club)',
   url:'https://zommagolf.com/courses/nc/ryder-golf-course',checked:'2026-11-07',
   geography:'Fort Bragg, North Carolina',teeYardageIsNotPinDistance:true,
   audit:'No published stroke index and no traced hole-specific greens or fairways. Do not invent.'},
  map:{source:'https://zommagolf.com/courses/nc/ryder-golf-course/geo.json',
   ref:'nc/ryder-golf-course',status:'outline-only'}
 },
 {
  id:'tobacco-road-sanford-nc',name:'Tobacco Road Golf Club',region:'Sanford, NC',
  par:[5,4,3,5,4,3,4,3,4,4,5,4,5,3,4,4,3,4],
  handicapMen:[3,11,17,9,15,13,7,5,1,6,10,14,2,8,12,16,18,4],
  tees:{
   ripper:{label:'Ripper',yards:[558,392,152,535,333,148,411,178,427,441,531,419,573,194,365,326,142,432]},
   disc:{label:'Disc',yards:[547,377,147,507,322,143,401,173,415,421,511,412,536,178,358,321,134,414]},
   plow:{label:'Plow',yards:[521,344,125,478,315,133,383,152,394,398,486,380,497,152,351,281,127,369]},
   points:{label:'Points',yards:[478,301,112,466,309,107,353,142,364,365,361,347,455,111,311,266,102,352]},
   cultivator:{label:'Cultivator',yards:[315,280,91,368,297,107,248,132,269,242,290,291,429,96,267,248,84,242]}
  },
  source:'tobacco-road-published-hole-card',
  provenance:{source:'Tobacco Road Golf Club published 18-hole open-data card',
   url:'https://zommagolf.com/courses/nc/tobacco-road-golf-club',checked:'2026-11-07',
   geography:'Sanford, North Carolina',teeYardageIsNotPinDistance:true},
  map:{source:'https://zommagolf.com/courses/nc/tobacco-road-golf-club/geo.json',
   ref:'nc/tobacco-road-golf-club',status:'external-unverified-hole-assignment'}
 }

]);
const sum=values=>values.reduce((n,x)=>n+x,0);
for(const founder of founders){
 if(founder.par.length!==18||founder.par.some(v=>![3,4,5,6].includes(v)))throw Error('Invalid founder pars '+founder.id);
 if(founder.handicapMen&&(founder.handicapMen.length!==18||new Set(founder.handicapMen).size!==18))throw Error('Invalid handicap '+founder.id);
 for(const [color,tee] of Object.entries(founder.tees)){
  if(tee.yards.length!==18||tee.yards.some(y=>!Number.isInteger(y)||y<50||y>800))throw Error('Invalid founder tee '+founder.id+':'+color);
  tee.totalYards=sum(tee.yards);
  Object.freeze(tee.yards);Object.freeze(tee);
 }
 Object.freeze(founder.tees);Object.freeze(founder.par);if(founder.handicapMen)Object.freeze(founder.handicapMen);
 Object.freeze(founder.handicapWomen||[]);Object.freeze(founder.provenance);Object.freeze(founder.map);Object.freeze(founder);
}
function exactFounder(course){
 if(course?.provider!==founderProvider)return null;
 return founders.find(f=>f.id===course.providerCourseId&&f.name===course.name&&f.region===course.region)||null;
}
export const FOUNDERS_READY_COUNT=founders.length;
export function founderCatalogRecords(query=''){
 const term=String(query).trim().toLowerCase();
 if(term.length<2)return [];
 return founders.filter(f=>(f.name+' '+f.region).toLowerCase().includes(term)||
  (f.id==='kings-grant-fayetteville-nc'&&/kings?\s+grant|king.s\s+grant/i.test(term))||
  (f.id==='quail-ridge-sanford-nc'&&/quail\s+ridge/i.test(term))
 ).map(f=>({provider:founderProvider,providerCourseId:f.id,name:f.name,region:f.region}));
}
export function founderTeesForCourse(course){
 const f=exactFounder(course);
 if(!f)return [];
 return Object.entries(f.tees).map(([color,tee])=>({providerTeeId:color,name:tee.label,totalYards:tee.totalYards}));
}
export function founderVerifiedScorecard(selection){
 const f=exactFounder(selection?.course);
 if(!f)return null;
 const key=selection?.tee?.providerTeeId;
 const tee=f.tees[key];
 if(!tee||selection.tee.totalYards!==tee.totalYards||selection.tee.name!==tee.label)return null;
 const holes=holeRange.map(number=>Object.freeze({
  number,par:f.par[number-1],yards:tee.yards[number-1],
  ...(f.handicapMen?.length?{handicapMen:f.handicapMen[number-1]}:{}),
  ...(f.handicapWomen?.length?{handicapWomen:f.handicapWomen[number-1]}:{}),
  hazards:Object.freeze([])
 }));
 return Object.freeze({version:1,selection,holes:Object.freeze(holes),source:f.source,
  provenance:f.provenance,livePinDistance:false,state:'published-hole-scorecard',verifiedTee:key});
}
export function founderMapRecord(course){
 const f=exactFounder(course);
 return f?.map||null;
}
