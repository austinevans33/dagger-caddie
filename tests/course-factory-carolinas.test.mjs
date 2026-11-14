import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {auditFounderGeometry} from '../playtest/founder-geometry-audit.js';
import {founderCatalogRecords,founderMapRecord,founderTeesForCourse,founderVerifiedScorecard} from '../playtest/founders-verified-scorecards.js';

const read = name => readFileSync(new URL(name,import.meta.url));
const json = name => JSON.parse(read(name));

for(const {state,id,query,totals,example,fairways=18,handicap=true} of [
 {state:'north-carolina',id:'gates-four-fayetteville-nc',query:'Gates Four',
  totals:{black:6895,blue:6433,white:6072,gold:5506,red:5365},example:{number:13,par:5,yards:536}},
 {state:'south-carolina',id:'crooked-oaks-seabrook-sc',query:'Crooked Oaks',
  totals:{hawk:6706,mallard:6367,osprey:5980,egret:5622,finch:5092,heron:4599},example:{number:13,par:3,yards:175}},
 {state:'north-carolina',id:'tanglewood-championship-clemmons-nc',query:'Tanglewood Park Championship',
  totals:{gold:7101,blue:6637,white:6014,black:5333,red:4562,family:3404},example:{number:13,par:4,yards:400}},
 {state:'south-carolina',id:'hidden-cypress-bluffton-sc',query:'Hidden Cypress',
  totals:{red:6953,gold:6549,blue:6051,white:5556,black:4974,orange:4227},example:{number:13,par:5,yards:512},fairways:17},
 {state:'north-carolina',id:'longleaf-southern-pines-nc',query:'Longleaf',
  totals:{'right-start':2423,'tee-1':3103,'tee-2':3702,'tee-3':4316,'tee-4':4872,'tee-5':5491,'tee-6':6153},
  example:{number:13,par:4,yards:380}},
 {state:'north-carolina',id:'sanford-municipal-nc',query:'Sanford Municipal',
  totals:{mens:6304,white:5901,gold:5164,women:4882},example:{number:13,par:4,yards:409},handicap:false},
 {state:'north-carolina',id:'pudding-ridge-mocksville-nc',query:'Pudding Ridge',
  totals:{black:6713,blue:6132,gold:4835,red:4110},example:{number:13,par:4,yards:445}},
 {state:'north-carolina',id:'oak-island-nc',query:'Oak Island',
  totals:{blue:6717,black:6401,white:5940,gold:5423,red:4903},
  example:{number:13,par:4,yards:391},fairways:17},
 {state:'north-carolina',id:'the-woods-whispering-pines-nc',query:'The Woods',
  totals:{oak:6070,dogwood:5643,hickory:5041,'long-leaf-pine':4356},example:{number:13,par:5,yards:509}},
 {state:'north-carolina',id:'mill-creek-mebane-nc',query:'Mill Creek Golf Club',
  totals:{black:6992,blue:6325,white:5638,yellow:4881,orange:4089,
   'blue-women':6325,'white-women':5638,'yellow-women':4881,'orange-women':4089},
  example:{number:13,par:3,yards:156},fairways:17},
 {state:'north-carolina',id:'hillandale-durham-nc',query:'Hillandale',
  totals:{blue:6425,white:6026,gold:5395,red:4823,'light-blue':3677,
   'white-women':6026,'gold-women':5395,'red-women':4823,'light-blue-women':3677},
  example:{number:13,par:4,yards:368}},
 {state:'north-carolina',id:'greensboro-national-summerfield-nc',query:'Greensboro National',
  totals:{blue:6806,white:6261,gold:5609,red:4715},example:{number:13,par:4,yards:434},fairways:17},
 {state:'north-carolina',id:'12-oaks-holly-springs-nc',query:'12 Oaks',
  totals:{gold:7093,nicklaus:6759,blue:6545,'green-oaks':6216,white:5985,silver:5583,red:5026,yellow:4397,family:3433},
  example:{number:13,par:5,yards:594},fairways:17},
 {state:'north-carolina',id:'hope-valley-durham-nc',query:'Hope Valley',
  totals:{ross:6720,valley:6369,mashburn:5702,crichton:5226,hope:4228,
   'valley-women':6369,'mashburn-women':5702,'crichton-women':5226,'hope-women':4228},
  example:{number:13,par:4,yards:366},fairways:17},
 {state:'north-carolina',id:'country-hills-gibsonville-nc',query:'Country Hills Golf Course',
  totals:{blue:5873,white:5511,gold:5097,red:4525},example:{number:13,par:4,yards:244}},
]){
 test(`${query} promotes only the source-pinned 18-hole course and official tee card`,()=>{
  const root='../qa/course-factory/'+state+'/';
  const manifest=json(root+'manifest.json');
  const coverage=json(root+'coverage.json');
  const row=coverage.courses.find(course=>course.id===id);
  assert.equal(coverage.pbfSha256,manifest.pbfSha256);
  assert.equal(coverage.snapshotSha256,manifest.snapshotSha256);
  assert.equal(row.id,id);
  assert.equal(row.status,'strict-pass');
  assert.equal(row.cardSha256,manifest.courses.find(course=>course.id===id).scorecard.sha256);
  const course=founderCatalogRecords(query).find(course=>course.providerCourseId===id);
  assert.ok(course);
  assert.equal(founderMapRecord({...course,region:'Unrelated club'}),null);
  const tees=founderTeesForCourse(course);
  assert.deepEqual(Object.fromEntries(tees.map(tee=>[tee.providerTeeId,tee.totalYards])),totals);
  const tee=tees.find(tee=>tee.providerTeeId===row.auditTee);
  const {holes,provenance}=founderVerifiedScorecard({course,tee});
  const source=manifest.courses.find(course=>course.id===id).scorecard;
  assert.deepEqual(provenance.additionalSources,source.additionalSources?.map(({url,sha256})=>({url,sha256})));
  const {number,par,yards}=holes[12];
  assert.deepEqual({number,par,yards},example);
  if(handicap) assert.equal(new Set(holes.map(hole=>hole.handicapMen)).size,18);
  else assert.ok(holes.every(hole=>hole.handicapMen===undefined));
  const map=founderMapRecord(course);
  const bytes=read('../playtest/course-art/'+map.file);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),row.bundleSha256);
  const {features,metadata}=JSON.parse(bytes);
  const review=json(root+'reviews/'+id+'.json');
  assert.equal(metadata.source_sha256,review.sha256);
  assert.equal(metadata.license,coverage.license);
  assert.equal(metadata[review.boundary_type==='way'?'osm_way':'osm_relation'],review.boundary);
  const audit=auditFounderGeometry({records:features,holes,metadata,expectedRef:map.ref});
  assert.equal(audit.pass,true);
  assert.equal(audit.quality.mappedHoles,18);
  assert.equal(audit.quality.fairwayHoles,fairways);
  assert.deepEqual(audit.ratioErrors,[]);
  assert.ok(!features.some(feature=>feature.properties.reference_tee||feature.properties.tee_alignment));
 });
}

test('Oak Island Red preserves the ladies par and stroke indexes',()=>{
 const course=founderCatalogRecords('Oak Island').find(({providerCourseId})=>providerCourseId==='oak-island-nc');
 const tee=founderTeesForCourse(course).find(({providerTeeId})=>providerTeeId==='red');
 const {holes}=founderVerifiedScorecard({course,tee});
 assert.equal(holes[8].par,5);
 assert.equal(holes[8].handicapMen,11);
 assert.equal(holes[13].par,4);
 assert.equal(holes[13].handicapMen,2);
});


test('Seven Lakes keeps verified tees selectable while withholding its unaudited map',()=>{
 const course=founderCatalogRecords('7 Lakes').find(({providerCourseId})=>providerCourseId==='seven-lakes-west-end-nc');
 assert.ok(course);
 assert.deepEqual(founderCatalogRecords('Seven Lakes'),[course]);
 const tees=founderTeesForCourse(course);
 assert.deepEqual(Object.fromEntries(tees.map(tee=>[tee.providerTeeId,tee.totalYards])),
  {black:6856,blue:6552,white:6062,'white-gold':5640,gold:5197,red:4830,green:4144,'green-red':4533});
 const coverage=json('../qa/course-factory/north-carolina/coverage.json').courses.find(({id})=>id===course.providerCourseId);
 assert.equal(coverage.cardVerified,true);
 assert.equal(coverage.status,'playable-partial');
 assert.deepEqual(coverage.audit.ratioErrors,[16]);
 assert.equal(founderMapRecord(course).status,'source-review-blocked');
 const tee=tees.find(({providerTeeId})=>providerTeeId==='green-red');
 const {holes}=founderVerifiedScorecard({course,tee});
 assert.equal(holes[11].yards,319);
 assert.equal(holes[11].handicapMen,4);
});


test('The Woods uses the club hole order on both nines',()=>{
 const {features}=json('../playtest/course-art/the-woods-whispering-pines-nc.json');
 const routes=features.filter(({properties})=>properties.layer==='hole');
 assert.deepEqual(routes.map(({properties})=>properties.osm),[
  'w1157231212','w1157231220','w1157231225','w1157231230','w1157231236','w1157231242',
  'w1157231247','w1157231252','w1157231258','w1157425828','w1157425852','w1157093634',
  'w1157093641','w1157093650','w1157093651','w1157093655','w1157093658','w1157093663',
 ]);
});

test('Hillandale and Mill Creek preserve the published women’s card facts',()=>{
 const hillandale=founderCatalogRecords('Hillandale')[0];
 const hillandaleTee=founderTeesForCourse(hillandale).find(({providerTeeId})=>providerTeeId==='white-women');
 const {holes:hillandaleHoles}=founderVerifiedScorecard({course:hillandale,tee:hillandaleTee});
 assert.equal(hillandaleHoles[7].par,5);
 assert.equal(hillandaleHoles[7].yards,383);
 const millCreek=founderCatalogRecords('Mill Creek Golf Club')[0];
 const millCreekTee=founderTeesForCourse(millCreek).find(({providerTeeId})=>providerTeeId==='white-women');
 const {holes:millCreekHoles}=founderVerifiedScorecard({course:millCreek,tee:millCreekTee});
 assert.equal(millCreekHoles[16].handicapMen,15);
});


test('Carolina Colours uses the official card with its geometry held for review',()=>{
 const course=founderCatalogRecords('Carolina Colours')[0];
 assert.equal(course.providerCourseId,'carolina-colours-new-bern-nc');
 const tee=founderTeesForCourse(course).find(({providerTeeId})=>providerTeeId==='teal-women');
 const {holes}=founderVerifiedScorecard({course,tee});
 assert.equal(tee.totalYards,4316);
 assert.equal(holes[12].handicapMen,2);
 assert.equal(founderMapRecord(course).status,'source-review-blocked');
});


test('12 Oaks preserves printed combo picks and the Yellow par on No. 7',()=>{
 const course=founderCatalogRecords('12 Oaks')[0];
 const tees=founderTeesForCourse(course);
 const card=id=>founderVerifiedScorecard({course,tee:tees.find(tee=>tee.providerTeeId===id)}).holes;
 assert.equal(card('nicklaus')[2].yards,204);
 assert.equal(card('nicklaus')[3].yards,402);
 assert.equal(card('green-oaks')[12].yards,481);
 assert.equal(card('green-oaks')[13].yards,388);
 assert.equal(card('gold')[6].par,5);
 assert.equal(card('yellow')[6].par,4);
 assert.equal(card('yellow')[6].yards,187);
});

test('Hope Valley preserves the ladies’ pars and indexes from the club card',()=>{
 const course=founderCatalogRecords('Hope Valley')[0];
 const tee=founderTeesForCourse(course).find(tee=>tee.providerTeeId==='valley-women');
 const {holes}=founderVerifiedScorecard({course,tee});
 assert.equal(holes[3].par,5);
 assert.equal(holes[3].handicapMen,15);
 assert.equal(holes[15].par,5);
 assert.equal(holes.reduce((total,hole)=>total+hole.par,0),72);
});

test('Neuse uses the current published tee rows and withholds ambiguous Forward indexes',()=>{
 const course=founderCatalogRecords('Neuse Country Club').find(({providerCourseId})=>providerCourseId==='neuse-clayton-nc');
 assert.ok(course);
 const tees=founderTeesForCourse(course);
 assert.deepEqual(Object.fromEntries(tees.map(({providerTeeId,totalYards})=>[providerTeeId,totalYards])),
  {championship:6891,blue:6448,white:5953,silver:5481,'silver-forward':4743,forward:3931});
 const card=id=>founderVerifiedScorecard({course,tee:tees.find(({providerTeeId})=>providerTeeId===id)});
 const coverage=json('../qa/course-factory/north-carolina/coverage.json').courses.find(({id})=>id===course.providerCourseId);
 assert.equal(coverage.cardVerified,true);
 assert.equal(coverage.status,'playable-partial');
 assert.deepEqual(coverage.issues,[{hole:8,issue:'route-crosses-boundary',candidates:['w756794598']}]);
 assert.equal(founderMapRecord(course).status,'source-review-blocked');
 const forward=card('forward');
 assert.deepEqual([forward.holes[7].par,forward.holes[7].yards],[4,255]);
 assert.ok(forward.holes.every(hole=>hole.handicapMen===undefined));
 assert.equal(forward.holes.reduce((total,hole)=>total+hole.par,0),71);
 const championship=card('championship');
 assert.deepEqual([championship.holes[7].par,championship.holes[7].yards,championship.holes[7].handicapMen],[5,528,10]);
 assert.equal(championship.provenance.sourceSha256,'04b7e353983cd1ea210db1e0b5c56403c094846605eccb230fc901543a2c192b');
 const combo=card('silver-forward');
 assert.equal(combo.holes[7].par,5);
 assert.equal(combo.holes[7].yards,431);
});

test('Pine Island keeps the official combo tees while withholding conflicting geometry',()=>{
 const course=founderCatalogRecords('Pine Island Country Club').find(({providerCourseId})=>providerCourseId==='pine-island-charlotte-nc');
 assert.ok(course);
 const tees=founderTeesForCourse(course);
 assert.deepEqual(Object.fromEntries(tees.map(({providerTeeId,totalYards})=>[providerTeeId,totalYards])),
  {blue:6377,'blue-white':6141,white:5974,'white-gold':5724,gold:5431,'gold-green':5037,green:4865});
 const card=founderVerifiedScorecard({course,tee:tees.find(({providerTeeId})=>providerTeeId==='gold-green')});
 assert.deepEqual([card.holes[9].par,card.holes[9].yards,card.holes[9].handicapMen],[5,467,3]);
 assert.equal(founderMapRecord(course).status,'source-review-blocked');
 const audit=json('../qa/course-factory/north-carolina/coverage.json').courses.find(({id})=>id===course.providerCourseId);
 assert.deepEqual(audit.audit.ratioErrors,[2,3,4]);
});

test('Starter’s Desk distinguishes bundled drawings, approximate tees and scorecard coverage',async()=>{
 const {courseCoverageLabel}=await import('../playtest/starters-desk-ui.js');
 assert.equal(courseCoverageLabel(founderCatalogRecords('Pine Island')[0]),'Verified scorecard');
 assert.equal(courseCoverageLabel(founderCatalogRecords('Country Hills')[0]),'Full Yardage Book');
 assert.match(courseCoverageLabel(founderCatalogRecords('Kings Grant')[0]),/approximate/);
 assert.equal(courseCoverageLabel({provider:'opengolfapi',providerCourseId:'unknown'}),'Coverage varies by tee');
});
