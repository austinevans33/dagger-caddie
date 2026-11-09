// Offline batch runner. Generated files go to a scratch output directory for review.
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditFounderGeometry} from '../playtest/founder-geometry-audit.js';

const script = name => fileURLToPath(new URL(name, import.meta.url));
const python = (name, args) => execFileSync('python3', [script(name), ...args],
  {encoding:'utf8', maxBuffer:16 * 1024 * 1024, stdio:['ignore', 'pipe', 'pipe']});
const json = value => JSON.stringify(value, null, 2) + '\n';
const sum = values => values.reduce((total, value) => total + value, 0);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export function buildBatch(manifestPath, snapshotPath, scorecardCache, outputPath) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const catalogSlug = manifest.catalogSlug ?? 'florida';
  if (!/^[a-z]+(?:-[a-z]+)*$/.test(catalogSlug)) throw Error('Invalid catalog slug');
  for (const field of ['pbfSha256','snapshotSha256']) {
    if (!/^[a-f0-9]{64}$/.test(manifest[field])) throw Error('Invalid source pin '+field);
  }
  const ids = new Set();
  const bounds = new Map();
  const mapRefs = new Set();
  for (const course of manifest.courses) {
    const siblingRoutes = bounds.get(course.boundary);
    const routeName = course.routeName ?? '';
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(course.id) || ids.has(course.id) ||
        (course.boundary !== null && (!/^[wr][1-9][0-9]*$/.test(course.boundary) ||
         siblingRoutes && (!routeName || siblingRoutes.has('') || siblingRoutes.has(routeName)))) ||
        !/^[a-z]{2}\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(course.mapRef) || mapRefs.has(course.mapRef)) {
      throw Error('Invalid or duplicate course identity '+course.id);
    }
    ids.add(course.id);
    if (course.boundary !== null) {
      if (!siblingRoutes) bounds.set(course.boundary,new Set());
      bounds.get(course.boundary).add(routeName);
    }
    mapRefs.add(course.mapRef);
  }
  const temp = mkdtempSync(join(tmpdir(), 'dagger-course-factory-'));
  const coverage = [];
  const catalog = [];
  try {
    const reviews = JSON.parse(python('course-factory-review.py', [snapshotPath, '--manifest', manifestPath, '--subsets', temp]));
    const cards = JSON.parse(python('course-factory-card.py', [manifestPath, scorecardCache]));
    // A fresh output path keeps old candidate artifacts from being promoted accidentally.
    if (existsSync(outputPath)) throw Error('Choose a new output directory');
    mkdirSync(join(outputPath, 'course-art'), {recursive:true});
    mkdirSync(join(outputPath, 'reviews'));
    for (const course of manifest.courses) {
      const {id, name, region, boundary, mapRef, auditTee, scorecard} = course;
      const {review, issues} = reviews[id];
      const {card, issue} = cards[id];
      const tee = card?.tees[auditTee];
      const auditPars = tee?.par ?? card?.par;
      const report = {id, name, region, boundary, mapRef, auditTee, scorecard:scorecard?.url ?? null,
        cardSha256:scorecard?.sha256 ?? null, cardVerified:!!card, issues:[...issues]};
      if (issue) report.issues.push({issue:'scorecard-unverified', detail:issue});
      if (card && review) review.holes.forEach(({mappedPar}, index)=>{
        if (mappedPar !== undefined && mappedPar !== String(auditPars[index])) {
          const alternateTees = Object.entries(card.tees)
            .filter(([key,tee])=>key!==auditTee && mappedPar===String(tee.par?.[index]))
            .map(([key])=>key);
          report.issues.push(alternateTees.length
            ? {hole:index+1,issue:'mapped-par-tee-variant',mappedPar,officialPar:auditPars[index],alternateTees}
            : {hole:index+1,issue:'mapped-par-conflict',mappedPar,officialPar:auditPars[index]});
        }
      });
      const counts = {};
      for (const key of ['route','tee','green','fairway']) {
        counts[key] = review?.holes.filter(hole => hole[key]?.length).length ?? 0;
      }
      report.counts = counts;
      if (review) writeFileSync(join(outputPath, 'reviews', id+'.json'), json(review));
      report.status = card ? (counts.route > 0 && counts.tee > 0 && counts.green > 0 ? 'playable-partial' : 'scorecard-only') : 'blocked';
      if (card && !tee) report.issues.push({issue:'reference-tee-unverified'});
      if (tee && counts.route === 18) {
        const reviewPath = join(outputPath, 'reviews', id+'.json');
        const bundlePath = join(temp, 'bundle.json');
        try {
          python('import-founder-osm.py', [reviewPath, join(temp,id+'.osm'), bundlePath]);
          const bytes = readFileSync(bundlePath);
          const bundle = JSON.parse(bytes);
          const holes = auditPars.map((par,index)=>({number:index+1,par,yards:tee.yards[index]}));
          const audit = auditFounderGeometry({records:bundle.features, holes, metadata:bundle.metadata, expectedRef:mapRef});
          report.audit = {pass:audit.pass, reason:audit.reason, ratioErrors:audit.ratioErrors,
            teeHoles:audit.quality?.teeHoles, greenHoles:audit.quality?.greenHoles, fairwayHoles:audit.quality?.fairwayHoles};
          // Published par takes precedence only after an explicit source review. The Florida batch
          // withholds conflicting mapped routes even if they happen to pass the broad distance test.
          if (audit.pass && !report.issues.some(row=>row.issue==='mapped-par-conflict')) {
            report.status = 'strict-pass';
            report.bundleSha256 = sha256(bytes);
            writeFileSync(join(outputPath,'course-art',id+'.json'),bytes);
          }
        } catch (error) {
          const detail = String(error.stderr || error.message).trim().split('\n').at(-1);
          report.issues.push({issue:'importer-rejected',detail});
        }
      }
      if (card) {
        const map = report.status === 'strict-pass'
          ? {file:id+'.json',source:`https://www.openstreetmap.org/${boundary[0]==='w'?'way':'relation'}/${boundary.slice(1)}`,
             ref:mapRef,status:'bundled-reviewed-osm',auditTee}
          : {ref:mapRef,status:'source-review-blocked'};
        report.teeTotals = Object.fromEntries(Object.entries(card.tees).map(([key, row])=>[key,sum(row.yards)]));
        const additionalSources = scorecard.additionalSources?.map(({url,sha256})=>({url,sha256}));
        catalog.push({id,name,region,...card,source:'course-factory-official-scorecard',
          provenance:{source:'Official course scorecard',url:scorecard.url,sourceSha256:scorecard.sha256,
            ...(additionalSources?.length?{additionalSources}:{}),
            checked:course.reviewDate??manifest.reviewDate,geography:region,teeYardageIsNotPinDistance:true},map});
      }
      coverage.push(report);
    }
    writeFileSync(join(outputPath,'coverage.json'), json({source:manifest.source,pbfSha256:manifest.pbfSha256,
      snapshotSha256:manifest.snapshotSha256,license:'https://opendatacommons.org/licenses/odbl/1-0/',courses:coverage}));
    const catalogExport = catalogSlug === 'florida' ? 'floridaCourses' : 'courseFactoryCourses';
    writeFileSync(join(outputPath,catalogSlug+'-course-factory.js'),
      '// Generated by scripts/course-factory-batch.mjs. See qa/course-factory/'+catalogSlug+'.\n'+
      'export const '+catalogExport+' = '+JSON.stringify(catalog,null,2)+';\n');
    return coverage;
  } finally {
    rmSync(temp,{recursive:true,force:true});
  }
}

if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length!==4) throw Error('Usage: course-factory-batch.mjs MANIFEST SNAPSHOT SCORECARD_CACHE NEW_OUTPUT');
  const coverage = buildBatch(...args);
  console.table(coverage.map(({id,status,counts})=>({id,status,...counts})));
}
