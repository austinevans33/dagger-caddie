// Course identity and tee selection. Pure data contracts, no fabricated course facts.
// External provider adapters must supply authoritative IDs and provenance.
const idPattern=/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,79}$/;
const text=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.trim().length<=max?v.trim():null;
export function normalizeCourse(input){
 if(!input||typeof input!=='object')return null;
 const provider=text(input.provider,50),providerCourseId=text(input.providerCourseId,80);
 const name=text(input.name,160),region=text(input.region,120);
 if(!provider||!providerCourseId||!idPattern.test(provider)||!idPattern.test(providerCourseId)||!name||!region)return null;
 return Object.freeze({provider,providerCourseId,name,region});
}
export function normalizeTee(input){
 if(!input||typeof input!=='object')return null;
 const providerTeeId=text(input.providerTeeId,80),name=text(input.name,60);
 if(!providerTeeId||!idPattern.test(providerTeeId)||!name)return null;
 const yards=Number(input.totalYards);
 if(!Number.isInteger(yards)||yards<900||yards>10000)return null;
 return Object.freeze({providerTeeId,name,totalYards:yards});
}
export function normalizeCourseSelection({course,tee,holeNumber}={}){
 const c=normalizeCourse(course),t=normalizeTee(tee);
 if(!c||!t||!Number.isInteger(holeNumber)||holeNumber<1||holeNumber>18)return null;
 return Object.freeze({course:c,tee:t,holeNumber});
}
export function sameCourseSelection(a,b){
 const x=normalizeCourseSelection(a),y=normalizeCourseSelection(b);
 return !!x&&!!y&&x.course.provider===y.course.provider&&
 x.course.providerCourseId===y.course.providerCourseId&&
 x.tee.providerTeeId===y.tee.providerTeeId&&x.holeNumber===y.holeNumber;
}
