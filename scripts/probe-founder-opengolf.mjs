// Read-only probe to match Founder clubs with exact OpenGolfAPI course IDs
// and inspect real per-hole geometry without assigning unverified hazards.
// CI logs show candidate name/city/state and feature types only.
const searches=[
 ['Kings Grant','Fayetteville','NC'],
 ['Quail Ridge','Sanford','NC'],
 ['Tobacco Road','Sanford','NC'],
 ['Pine Hills','Winder','GA'],
 ['Ocean Course','Kiawah Island','SC'],
 ['Hyland','Southern Pines','NC']
];
const base='https://api.opengolfapi.org/v1/courses';
for(const [name,city,state] of searches){
 try{
  const url=base+'/search?q='+encodeURIComponent(name)+'&limit=40';
  const res=await fetch(url,{headers:{Accept:'application/json'}});
  if(!res.ok)throw Error('search HTTP '+res.status);
  const data=await res.json();
  const rows=Array.isArray(data.courses)?data.courses:[];
  const matching=rows.filter(x=>String(x.city||'').toLowerCase().includes(city.toLowerCase())&&
    String(x.state||'').toUpperCase()===state);
  console.log('FOUNDER MATCH '+JSON.stringify({name,city,state,rows:rows.length,
    matches:matching.map(x=>({id:x.id,name:x.course_name||x.name,city:x.city,state:x.state}))}));
  for(const match of matching.slice(0,2)){
   for(const hole of [1,7,18]){
    try{
     const r=await fetch('https://api.opengolfapi.org/api/v1/features?course='+encodeURIComponent(match.id)+'&hole='+hole);
     if(!r.ok)throw Error('features HTTP '+r.status);
     const d=await r.json(),features=Array.isArray(d.features)?d.features:[];
     const types={};for(const f of features){
      const tags=f.tags||[],tag=tags.find(t=>t.startsWith('golf='))||'other';
      types[tag]=(types[tag]||0)+1;
     }
     console.log('FOUNDER HOLE '+JSON.stringify({name,id:match.id,hole,features:features.length,
      precise_included:d.precise_included,types,
      examples:features.slice(0,4).map(f=>({tags:f.tags,geometry:f.geometry?.type}))}));
    }catch(e){console.log('FOUNDER HOLE ERROR '+JSON.stringify({name,id:match.id,hole,error:e.message}))}
   }
  }
 }catch(e){console.log('FOUNDER MATCH ERROR '+JSON.stringify({name,error:e.message}))}
}
