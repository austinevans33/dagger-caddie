// Compact, provenance-aware facts for Caddy prompts. No inferred pin GPS or club choice.
export function createCaddyCourseBriefing(environment,holeNumber){
 if(!environment?.selection||!Number.isInteger(holeNumber)||holeNumber<1||holeNumber>18)return null;
 const {course,tee}=environment.selection;
 const lines=['COURSE DATA (read-only, verified facts only):', 'Course: '+course.name,'Tee: '+tee.name,'Hole: '+holeNumber];
 const hole=Array.isArray(environment.holes)?environment.holes.find(h=>h.number===holeNumber):null;
 if(hole)lines.push('Scorecard: par '+hole.par+', '+hole.yards+' yards from selected tee. NOT a live target/pin distance.');
 else lines.push('Hole scorecard not verified. Ask golfer for yardage, par and target.');
 const w=environment.weather;
 if(w&&['model-current','model-cached'].includes(environment.weatherState)&&w.source==='open-meteo-model'){
  lines.push('Weather: modeled '+w.windMph+' mph wind FROM '+w.windDegrees+'°; '+(w.temperatureF===null?'temperature unavailable':w.temperatureF+'°F')+'. Not on-course measured.');
 }else lines.push('Weather unavailable or unverified. Do not assume wind or temperature.');
 lines.push('No live GPS pin, hazard distances, elevation or exact wind effect verified. Ask for actual shot distance, lie and aim direction before a specific club.');
 return lines.join('\n');
}
