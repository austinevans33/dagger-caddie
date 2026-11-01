// Named real-course acceptance targets, not fabricated course geometry.
// Sources are recorded for human verification and permitted import evaluation.
export const YARDAGE_TEST_COURSES=Object.freeze([
 Object.freeze({id:'bayonet-puppy-creek',name:'Bayonet at Puppy Creek',city:'Raeford',state:'NC',expectedHoles:18,
  official:'https://www.bayonetgolf.com/course-tour/',
  mappingReference:'https://openyardage.com/en/course/bayonet-at-puppy-creek.html',
  mappingClaim:'third-party-reports-18-mapped-holes',importedVerifiedGeometry:false}),
 Object.freeze({id:'ryder-fort-bragg',name:'Ryder Golf Course',city:'Fort Bragg',state:'NC',expectedHoles:18,
  official:'https://bragg.armymwr.com/programs/golf',
  mappingReference:'https://www.golfcore.org/courses/ryder-golf-course/',
  mappingClaim:'third-party-reports-18-mapped-holes',importedVerifiedGeometry:false})
]);
export function yardageTestReadiness(course,importedGeometry=[]){
 if(!course||!Number.isInteger(course.expectedHoles)||course.expectedHoles<1||course.expectedHoles>18)throw Error('Invalid test course');
 const numbers=new Set(importedGeometry.filter(h=>h&&h.source==='verified-geometry'&&Number.isInteger(h.holeNumber)&&h.holeNumber>=1&&h.holeNumber<=course.expectedHoles&&Array.isArray(h.features)&&h.features.length>0).map(h=>h.holeNumber));
 return {id:course.id,expectedHoles:course.expectedHoles,verifiedDrawings:numbers.size,
 missingHoles:Array.from({length:course.expectedHoles},(_,i)=>i+1).filter(n=>!numbers.has(n)),
 fullyIllustrated:numbers.size===course.expectedHoles};
}
