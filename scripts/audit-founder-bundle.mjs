// Compare a reviewed geometry bundle with the published Black tee reference.
// Usage: node scripts/audit-founder-bundle.mjs "Quail Ridge" path/to/art.json
import {readFileSync} from 'node:fs';
import {auditFounderGeometry,mappedRouteYards} from '../playtest/founder-geometry-audit.js';
import {founderCatalogRecords,founderTeesForCourse,founderVerifiedScorecard,founderMapRecord} from '../playtest/founders-verified-scorecards.js';

const [query,path,teeId='black']=process.argv.slice(2);
const [course,...otherMatches]=founderCatalogRecords(query);
const map=founderMapRecord(course);
if(!map||otherMatches.length||!path)throw Error('Use an unambiguous founder query and a bundle path');
const tee=founderTeesForCourse(course).find(t=>t.providerTeeId===teeId);
const card=founderVerifiedScorecard({course,tee});
if(!card)throw Error('A verified comparison tee is required');
const {features,metadata}=JSON.parse(readFileSync(path,'utf8'));
const audit=auditFounderGeometry({records:features,holes:card.holes,metadata,expectedRef:map.ref});
const holes=card.holes.map((hole,index)=>({...audit.quality?.checks[index],
 par:hole.par,cardYards:hole.yards,routeYards:Math.round(mappedRouteYards(features,hole.number)??0)||null}));
console.log(JSON.stringify({
 course,tee,scorecard:card.provenance.url,source:metadata.source,sourceSha256:metadata.source_sha256,
 license:metadata.license,boundary:metadata.osm_relation,
 pass:audit.pass,reason:audit.reason,ratioErrors:audit.ratioErrors,
 mappedHoles:audit.quality?.mappedHoles??0,fairwayHoles:audit.quality?.fairwayHoles??0,
 teeHoles:audit.quality?.teeHoles??0,greenHoles:audit.quality?.greenHoles??0,
 routes:audit.quality?.drawnRoutes??0,holes
},null,2));
if(!audit.pass)process.exitCode=1;
