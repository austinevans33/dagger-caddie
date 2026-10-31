// Strictly descriptive Caddy facts from the currently selected, fresh round environment.
// Course facts are browser/provider-sourced; the backend must still treat them as untrusted.
export function buildCaddyCourseFacts(environment,holeNumber){
 if(!environment?.selection||!Number.isInteger(holeNumber)||holeNumber<1||holeNumber>18)return null;
 const {course,tee}=environment.selection;
 if(!course?.name||!tee?.name)return null;
 const facts={courseName:course.name,teeName:tee.name,holeNumber};
 const hole=Array.isArray(environment.holes)?environment.holes.find(h=>h.number===holeNumber):null;
 if(hole&&Number.isInteger(hole.par)&&hole.par>=3&&hole.par<=6&&
    Number.isInteger(hole.yards)&&hole.yards>=50&&hole.yards<=800){
  facts.par=hole.par;
  facts.teeYards=hole.yards;
  facts.scorecardSource='opengolfapi-scorecard';
  facts.scorecardCached=['offline-cached','cached-no-provider-holes'].includes(environment.state);
 }
 const w=environment.weather;
 if(['model-current','model-cached'].includes(environment.weatherState)&&w?.source==='open-meteo-model'&&
  Number.isFinite(w.windMph)&&w.windMph>=0&&w.windMph<=150&&
  Number.isFinite(w.windDegrees)&&w.windDegrees>=0&&w.windDegrees<=360&&
  Number.isFinite(w.temperatureF)&&w.temperatureF>=-100&&w.temperatureF<=150&&
  Number.isSafeInteger(w.observedAt)&&w.observedAt>0){
  facts.weather={source:'open-meteo-model',windMph:w.windMph,windFromDegrees:w.windDegrees,
   temperatureF:w.temperatureF,observedAt:w.observedAt,isObservation:false};
 }
 return facts;
}
