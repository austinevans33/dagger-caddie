import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditFounderBook} from '../playtest/founders-book-quality.js';
import {buildHoleSketch,courseArtFeatures} from '../playtest/hole-sketch.js';
import {BAYONET_PAR,BAYONET_TEES} from '../playtest/bayonet-verified-scorecard.js';
import {founderCatalogRecords,founderTeesForCourse,founderVerifiedScorecard} from '../playtest/founders-verified-scorecards.js';
const art=JSON.parse(readFileSync(new URL('../playtest/course-art/bayonet-at-puppy-creek.json',import.meta.url)));
const bayonetHoles=BAYONET_PAR.map((par,i)=>({number:i+1,par,yards:BAYONET_TEES.white.yards[i]}));
test('Bayonet itself satisfies the B/B+ founder contract',()=>{
 const sketches=Array.from({length:18},(_,i)=>buildHoleSketch(courseArtFeatures(art.features,i+1)));
 const result=auditFounderBook({holes:bayonetHoles,sketches,source:'bundled Bayonet'});
 assert.equal(result.grade,'B+ yardage book');
 assert.equal(result.mappedHoles,18);
 assert.ok(result.fairwayHoles>=17);
 assert.equal(result.ghostOnSameHoleReady,true);
});
test('a complete Kings Grant / Quail Ridge scorecard is NOT enough to call the illustrated book finished',()=>{
 for(const name of ['Kings Grant','Quail Ridge','Tobacco Road','Pelican Pointe']){
  const course=founderCatalogRecords(name)[0],tee=founderTeesForCourse(course)[0];
  const card=founderVerifiedScorecard({course,tee});
  const result=auditFounderBook({holes:card.holes,sketches:[]});
  assert.equal(result.scorecardComplete,true);
  assert.equal(result.grade,'needs mapped hole art');
  assert.equal(result.ghostOnSameHoleReady,false);
 }
});
test('an invented line without matched tee, green and fairway does not pass',()=>{
 const sketch={shapes:[],annotations:{route:{tee:[150,400],green:[150,30]}}};
 const result=auditFounderBook({holes:bayonetHoles,sketches:Array(18).fill(sketch)});
 assert.equal(result.mappedHoles,0);
 assert.equal(result.grade,'needs mapped hole art');
});
test('partial 17-hole artwork never gets mislabeled as a full book',()=>{
 const sketches=Array.from({length:18},(_,i)=>buildHoleSketch(courseArtFeatures(art.features,i+1)));
 sketches[4]=null;
 const result=auditFounderBook({holes:bayonetHoles,sketches});
 assert.equal(result.mappedHoles,17);
 assert.equal(result.grade,'needs mapped hole art');
});
