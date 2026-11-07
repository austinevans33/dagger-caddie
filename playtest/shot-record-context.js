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

// Count only the golfer's explicitly recorded directional outcomes.
export function recordedMissNotes(records, clubNames = []) {
 if (!Array.isArray(records) || !Array.isArray(clubNames)) return [];
 const byClub = new Map();
 for (const shot of records.slice(-30)) {
  if (!clubNames.includes(shot?.club)) continue;
  const counts = byClub.get(shot.club) || {total: 0, left: 0, right: 0};
  counts.total++;
  if (shot.horizontal === 'Left') counts.left++;
  if (shot.horizontal === 'Right') counts.right++;
  byClub.set(shot.club, counts);
 }
 return [...byClub].filter(([, counts]) => counts.total >= 3 && counts.left + counts.right > 0)
  .map(([club, counts]) => club + ' (' + counts.total + ' logged: ' + counts.left + ' left, ' + counts.right + ' right)');
}
