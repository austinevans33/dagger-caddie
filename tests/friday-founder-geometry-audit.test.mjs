import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditFounderGeometry,mappedRouteYards} from '../playtest/founder-geometry-audit.js';
import {BAYONET_PAR,BAYONET_TEES} from '../playtest/bayonet-verified-scorecard.js';
const bundle=JSON.parse(readFileSync(new URL('../playtest/course-art/bayonet-at-puppy-creek.json',import.meta.url)));
const holes=BAYONET_PAR.map((par,i)=>({number:i+1,par,yards:BAYONET_TEES.white.yards[i]}));
const valid=()=>({records:bundle.features,holes,metadata:bundle.metadata,expectedRef:'nc/bayonet-at-puppy-creek'});
test('real 18-hole Bayonet artwork passes matched geometry and yardage route checks',()=>{
 const audit=auditFounderGeometry(valid());
 assert.equal(audit.pass,true);
 assert.equal(audit.quality.mappedHoles,18);
 assert.equal(audit.quality.ghostOnSameHoleReady,true);
 assert.deepEqual(audit.ratioErrors,[]);
});
test('map from a different club cannot masquerade as the chosen founder',()=>{
 const audit=auditFounderGeometry({...valid(),expectedRef:'nc/quail-ridge-golf-club'});
 assert.equal(audit.pass,false);assert.equal(audit.reason,'wrong-course-or-scorecard');
});
test('a hole-number swap triggers a scorecard-distance mismatch',()=>{
 const records=structuredClone(bundle.features);
 for(const r of records){
  const hs=r.properties?.holes;
  if(!Array.isArray(hs))continue;
  r.properties.holes=hs.map(n=>n===3?17:n===17?3:n);
 }
 const audit=auditFounderGeometry({...valid(),records});
 assert.equal(audit.pass,false);
 assert.ok(audit.ratioErrors.includes(3)||audit.ratioErrors.includes(17));
});
test('one missing mapped playing line never passes the course',()=>{
 const records=bundle.features.filter(r=>!(r.properties?.layer==='hole'&&r.properties?.holes?.includes(4)));
 const audit=auditFounderGeometry({...valid(),records});
 assert.equal(audit.pass,false);
 assert.ok(audit.ratioErrors.includes(4));
 assert.equal(mappedRouteYards(records,4),null);
});
test('duplicate primary routes on one hole are ambiguous and fail closed',()=>{
 const copy=structuredClone(bundle.features);
 const route=structuredClone(copy.find(r=>r.properties?.layer==='hole'&&r.properties?.holes?.includes(1)));
 copy.push(route);
 const audit=auditFounderGeometry({...valid(),records:copy});
 assert.equal(audit.pass,false);
 assert.ok(audit.ratioErrors.includes(1));
});
