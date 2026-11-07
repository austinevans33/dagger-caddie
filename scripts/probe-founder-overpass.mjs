// ONE respectful one-off Overpass query for Kings Grant source geometry.
// Purpose: collect open OSM fairway/green/bunker polygons for manual review,
// not an app runtime dependency. Never retry a 429, never bulk scrape.
const q='Kings Grant',city='Fayetteville',state='NC';
const response=await fetch('https://api.opengolfapi.org/v1/courses/search?q='+encodeURIComponent(q)+'&limit=12');
if(!response.ok)throw Error('OpenGolf discovery HTTP '+response.status);
const entries=(await response.json()).courses||[];
const course=entries.find(x=>x.city===city&&x.state===state);
if(!course||!Number.isFinite(course.latitude)||!Number.isFinite(course.longitude))throw Error('Exact city/state coordinate not available');
const query='[out:json][timeout:20];way(around:1200,'+course.latitude+','+course.longitude+')["golf"];out geom;';
const url='https://overpass.kumi.systems/api/interpreter?data='+encodeURIComponent(query);
const headers={'User-Agent':'DaggerCountryClubCourseArtAudit/1.0 (+https://github.com/austinevans33/dagger-caddie)','Accept':'application/json'};
const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),26000);
try{
 const result=await fetch(url,{headers,signal:ctrl.signal});
 const raw=await result.text();
 console.log('OVERPASS SOURCE '+JSON.stringify({status:result.status,bodySize:raw.length,
  sample:result.ok?raw.slice(0,100):raw.slice(0,300)}));
 if(result.ok){
  const data=JSON.parse(raw);
  const counts={};
  for(const el of data.elements||[]){const type=el.tags?.golf||'unknown';counts[type]=(counts[type]||0)+1}
  console.log('OVERPASS GOLF LAYERS '+JSON.stringify({course:course.course_name,city,state,latitude:course.latitude,longitude:course.longitude,
   features:data.elements?.length||0,counts}));
  const fs=await import('node:fs/promises');
  await fs.mkdir('artifacts/founders-map-audit',{recursive:true});
  await fs.writeFile('artifacts/founders-map-audit/kings-grant-overpass-source.json',raw);
 }
}catch(error){console.log('OVERPASS SOURCE '+JSON.stringify({error:String(error?.message||error)}))}
finally{clearTimeout(timer)}
