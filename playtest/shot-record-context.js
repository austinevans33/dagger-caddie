// Shot provenance for future real-data dispersion. Never manufacture GPS, carry or miss distances.
import {safeCaddyEnvironment} from './caddy-environment-policy.js';
export function createShotRecordContext(active,holeNumber,environment,fetchedAt,now=Date.now()){
 if(!active?.selection||!Number.isInteger(holeNumber)||holeNumber<1||holeNumber>18)return null;
 const {course,tee}=active.selection;
 if(!course?.providerCourseId||!tee?.providerTeeId)return null;
 const result={
  course:{provider:course.provider,providerCourseId:course.providerCourseId,name:course.name,region:course.region},
  tee:{providerTeeId:tee.providerTeeId,name:tee.name},
  holeNumber,
  locationSource:'selected-course-not-shot-gps',
  measuredCarryYards:null,
  measuredLateralYards:null
 };
 const verified=safeCaddyEnvironment(active,environment,fetchedAt,now);
 const hole=verified?.holes?.find(h=>h.number===holeNumber);
 if(hole&&Number.isInteger(hole.par)&&Number.isInteger(hole.yards)){
  result.scorecard={par:hole.par,teeYards:hole.yards,source:verified.scorecardSource||'opengolfapi-scorecard'};
 }
 if(verified?.weather&&verified.weatherState==='model-current'){
  result.weather={
   source:'open-meteo-model',observedAt:verified.weather.observedAt,
   windMph:verified.weather.windMph,windDegrees:verified.weather.windDegrees,
   temperatureF:verified.weather.temperatureF,isObservation:false
  };
 }
 return result;
}
