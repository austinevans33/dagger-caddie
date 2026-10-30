// Dagger course/weather foundation — pure normalization, no network or UI.
// Do not invent course details or forecast values. Only trusted verified records
// should be passed in by a future authorized data provider.
export function normalizeHole(input) {
 if(!input || typeof input!=='object') return null;
 const hole=Number(input.number),par=Number(input.par),yards=Number(input.yards);
 if(!Number.isInteger(hole)||hole<1||hole>18||!Number.isInteger(par)||par<3||par>6||
    !Number.isFinite(yards)||yards<50||yards>800) return null;
 const hazards=Array.isArray(input.hazards)?input.hazards:[];
 if(hazards.length>20) return null;
 const safeHazards=[];
 for(const h of hazards){
  if(!h||!['water','bunker','out-of-bounds','trees','other'].includes(h.type)||
     typeof h.note!=='string'||h.note.length>160) return null;
  safeHazards.push({type:h.type,note:h.note.trim()});
 }
 return Object.freeze({number:hole,par,yards,hazards:Object.freeze(safeHazards)});
}
export function normalizeWeather(input, now=Date.now()){
 if(!input||typeof input!=='object')return null;
 const observed=Number(input.observedAt),windMph=Number(input.windMph),windDegrees=Number(input.windDegrees);
 if(!Number.isFinite(observed)||Math.abs(now-observed)>3*60*60*1000||
    !Number.isFinite(windMph)||windMph<0||windMph>150||
    !Number.isFinite(windDegrees)||windDegrees<0||windDegrees>=360)return null;
 const temperatureF=input.temperatureF==null?null:Number(input.temperatureF);
 if(temperatureF!==null&&(!Number.isFinite(temperatureF)||temperatureF< -70||temperatureF>150))return null;
 return Object.freeze({observedAt:observed,windMph,windDegrees,temperatureF});
}
export function buildShotContext({hole,weather}={}){
 const h=normalizeHole(hole);
 const w=normalizeWeather(weather);
 if(!h)return null;
 return Object.freeze({hole:h,weather:w,weatherVerified:!!w,
  source:'verified-provider-required',liveDistances:false});
}
