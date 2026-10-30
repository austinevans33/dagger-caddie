// Bind verified tee-specific hole records to an explicit selection.
// No guessed tee yardage, no fallbacks across courses or tees.
import {normalizeCourseSelection} from './course-identity.js';
import {normalizeHole,normalizeWeather} from './course-weather-context.js';
export function resolveVerifiedHole(selection,record,weather=null,now=Date.now()){
 const selected=normalizeCourseSelection(selection);
 if(!selected||!record||typeof record!=='object')return null;
 const source=record.source;
 if(source!=='verified-provider'||record.provider!==selected.course.provider||
    record.providerCourseId!==selected.course.providerCourseId||
    record.providerTeeId!==selected.tee.providerTeeId)return null;
 const hole=normalizeHole(record.hole);
 if(!hole||hole.number!==selected.holeNumber)return null;
 const observedAt=Number(record.retrievedAt);
 if(!Number.isFinite(observedAt)||observedAt>now+60000||
    now-observedAt>30*24*60*60*1000)return null;
 const conditions=normalizeWeather(weather,now);
 return Object.freeze({
  course:selected.course,tee:selected.tee,hole,
  source:'verified-provider',retrievedAt:observedAt,
  weather:conditions,weatherVerified:!!conditions,
  liveDistanceToPin:false
 });
}
