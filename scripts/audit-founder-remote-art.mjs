// Read-only Founders map audit. Runs in GitHub Actions where remote GeoJSON
// can be fetched, checked, and saved as a QA artifact BEFORE adding it to app.
// Does not update Firestore, scorecards, Github branches or public staging.
import {mkdir,writeFile} from 'node:fs/promises';
import {founderCatalogRecords,founderMapRecord,founderTeesForCourse,founderVerifiedScorecard} from '../playtest/founders-verified-scorecards.js';
import {auditFounderGeometry} from '../playtest/founder-geometry-audit.js';
const audits=[
 ['Kings Grant','Fayetteville, NC'],
 ['Quail Ridge','Sanford, NC'],
 ['Tobacco Road','Sanford, NC'],
 ['Pine Hills','Winder, GA'],
 ['Ocean Course','Kiawah Island, SC']
];
const out='artifacts/founders-map-audit';
await mkdir(out,{recursive:true});
const results=[];
for(const [query,region] of audits){
 const course=founderCatalogRecords(query).find(x=>x.region===region);
 if(!course)throw Error('Missing exact founder '+query+' / '+region);
 const map=founderMapRecord(course);
 const entry={id:course.providerCourseId,course:course.name,region,mapSource:map?.source||null,
  metadataRef:map?.ref||null,status:'not-requested'};
 results.push(entry);
 if(!map?.source||!map?.ref){entry.status='no-published-map';continue;}
 try{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  let response;
  try{response=await fetch(map.source,{headers:{Accept:'application/json'},signal:controller.signal});}
  finally{clearTimeout(timer)}
  if(!response.ok)throw Error('HTTP '+response.status);
  const size=Number(response.headers.get('content-length'));
  if(Number.isFinite(size)&&size>5000000)throw Error('GeoJSON exceeds 5MB');
  const raw=await response.text();
  if(raw.length>5000000)throw Error('GeoJSON exceeds 5MB');
  const geo=JSON.parse(raw);
  entry.actualCourseRef=geo.metadata?.course_ref||null;
  entry.totalFeatures=geo.features?.length??0;
  const layerCounts={};
  for(const feature of geo.features||[]){
   const k=feature.properties?.layer||'unclassified';
   layerCounts[k]=(layerCounts[k]||0)+1;
  }
  entry.layerCounts=layerCounts;
  const tees=founderTeesForCourse(course);
  // Audit against all available tee sets; one tee might have an unusual
  // distance or different par. Bayonet White is the benchmark.
  entry.teeAudits=[];
  for(const tee of tees){
   const card=founderVerifiedScorecard({course,tee});
   if(!card)continue;
   const result=auditFounderGeometry({records:geo.features,holes:card.holes,
    metadata:geo.metadata,expectedRef:map.ref});
   entry.teeAudits.push({tee:tee.name,pass:result.pass,reason:result.reason,
    mappedHoles:result.quality?.mappedHoles??0,
    fairwayHoles:result.quality?.fairwayHoles??0,
    routeMismatches:result.ratioErrors});
  }
  entry.status=entry.teeAudits.some(x=>x.pass)?'candidate-passed-structural-audit':'needs-map-reconciliation';
  // Preserve the original immutable provider data for human review, even
  // when the strict audit fails. Do not deploy these artifacts automatically.
  await writeFile(out+'/'+course.providerCourseId+'.json',raw);
 }catch(error){entry.status='source-unavailable';entry.error=String(error?.message||error)}
 process.stdout.write(JSON.stringify(entry)+'\n');
}
await writeFile(out+'/report.json',JSON.stringify({generated:new Date().toISOString(),results},null,2));
const passed=results.filter(x=>x.status==='candidate-passed-structural-audit');
process.stdout.write('FOUNDER GEO ART: '+passed.length+'/'+results.length+
 ' have at least one 18-hole structurally qualified mapped tee. Human visual approval still required.\n');
