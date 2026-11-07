// A single course/hole drawing for the book and simulated Ghost playback.
import {loadCourseFeatures, normalizeCourseFeatures, pencilGeometry, orientPencilTeeToGreen} from './course-pencil-geometry.js?v=founders-osm-1';
import {pencilBookAnnotations} from './pencil-book-annotations.js?v=friday-book-1';

import {BAYONET_COURSE_ID} from './bayonet-verified-scorecard.js';
import {founderMapRecord, founderTeesForCourse, founderVerifiedScorecard} from './founders-verified-scorecards.js';

export const SKETCH_WIDTH = 300;
export const SKETCH_HEIGHT = 440;

const courseArt = new Map([
  ['opengolfapi:' + BAYONET_COURSE_ID, {
    file: new URL('./course-art/bayonet-at-puppy-creek.json', import.meta.url),
    ref: 'nc/bayonet-at-puppy-creek',
    credit: '© OpenStreetMap contributors via Zomma Golf (ODbL 1.0)',
    source: 'https://zommagolf.com/courses/nc/bayonet-at-puppy-creek/geo.json',
    referenceNotes: {7: {bend: 1, label: 'Water near turn', note: 'The club booklet shows water near the turn into the green. Check the carry before taking that line.'}}
  }]
]);
const catalogCache = new Map();
const providerCache = new Map();
const bundledAudits = new WeakMap();

function readCourseArt(entry, fetcher) {
  if (!catalogCache.has(entry.ref)) {
    const request = fetcher(entry.file).then(async response => {
      if (!response.ok) throw Error('Course artwork unavailable');
      const data = await response.json();
      if (data.metadata?.course_ref !== entry.ref || !Array.isArray(data.features)) {
        throw Error('Course artwork identity mismatch');
      }
      return data.features;
    }).catch(error => {
      catalogCache.delete(entry.ref);
      throw error;
    });
    catalogCache.set(entry.ref, request);
  }
  return catalogCache.get(entry.ref);
}

export function courseArtFeatures(records, holeNumber) {
  return normalizeCourseFeatures({
    features: records.filter(record => record.properties?.holes?.includes(holeNumber)).map(record => ({
      geometry: record.geometry,
      properties: {type: record.properties.layer, hole: holeNumber}
    }))
  }, {holeNumber});
}

export function buildHoleSketch(features, provenance = {}) {
  const size = {width: SKETCH_WIDTH, height: SKETCH_HEIGHT, padding: 22};
  const projected = orientPencilTeeToGreen(pencilGeometry(features, size), size);
  const routes = projected.filter(shape => shape.type === 'hole');
  const layers = ['rough', 'fairway', 'water', 'bunker', 'tee', 'green'];
  const shapes = projected.filter(shape => shape.type !== 'hole')
    .sort((a, b) => layers.indexOf(a.type) - layers.indexOf(b.type));
  const mapped = pencilBookAnnotations(shapes, routes.length === 1 ? routes[0].points : null);
  const reference = provenance.referenceNote;
  const referencePoint = mapped.route?.path[reference?.bend];
  const annotations = referencePoint
    ? {...mapped, reference: {...reference, point: referencePoint}}
    : mapped;
  return {
    ...provenance, shapes, annotations,
    coverage: annotations.route && shapes.some(shape => shape.type === 'fairway')
      ? 'layout' : (shapes.length || annotations.route) ? 'partial' : 'scorecard'
  };
}

export async function loadHoleSketch(selection, holeNumber, {fetcher = fetch, signal} = {}) {
  const course = selection?.course;
  if (!course || !Number.isInteger(holeNumber) || holeNumber < 1 || holeNumber > 18) {
    return buildHoleSketch([]);
  }
  const identity = course.provider + ':' + course.providerCourseId;
  const mappedFounder = founderMapRecord(course);
  const bundled = mappedFounder?.status === 'bundled-reviewed-osm';
  const safeFounderArt = bundled
    ? {file: new URL('./course-art/' + mappedFounder.file, import.meta.url),ref: mappedFounder.ref,
       credit:'© OpenStreetMap contributors (ODbL 1.0)',source:mappedFounder.source}
    : mappedFounder?.status === 'external-unverified-hole-assignment'
      ? {file: mappedFounder.source,ref: mappedFounder.ref,
         credit:'© OpenStreetMap contributors via Zomma Golf (ODbL 1.0)',source:mappedFounder.source}
      : null;
  const entry = courseArt.get(identity) || safeFounderArt;
  if (entry) {
    try {
      const records = await readCourseArt(entry, fetcher);
      signal?.throwIfAborted();
      if(mappedFounder){
        if(!founderVerifiedScorecard(selection))return buildHoleSketch([]);
        // The artwork represents the route, not every selected tee position.
        // A pinned, published card is used only for bundle-wide geometry QA.
        const tee=bundled
          ? founderTeesForCourse(course).find(t=>t.providerTeeId===mappedFounder.auditTee)
          : selection.tee;
        const official=founderVerifiedScorecard({course,tee});
        if(!official)return buildHoleSketch([]);
        const {auditFounderGeometry}=await import('./founder-geometry-audit.js');
        const audit=bundledAudits.get(records) || auditFounderGeometry({
          records,holes:official.holes,
          metadata:{course_ref:entry.ref},expectedRef:entry.ref
        });
        if(bundled)bundledAudits.set(records,audit);
        if(!audit.pass)return buildHoleSketch([]);
      }
      const features = courseArtFeatures(records, holeNumber);
      if (features.length) return buildHoleSketch(features, {credit: entry.credit, source: entry.source, referenceNote: entry.referenceNotes?.[holeNumber]});
    } catch (error) {
      if (signal?.aborted) throw error;
    }
  }
  const key = identity + ':' + holeNumber;
  if (providerCache.has(key)) return providerCache.get(key);
  const timeout = AbortSignal.timeout?.(5000);
  const requestSignal = signal && timeout && AbortSignal.any
    ? AbortSignal.any([signal, timeout]) : signal || timeout;
  const features = await loadCourseFeatures(selection, holeNumber, {fetcher, signal: requestSignal});
  signal?.throwIfAborted();
  const sketch = buildHoleSketch(features, {
    credit: '© OpenStreetMap contributors via OpenGolfAPI (ODbL 1.0)',
    source: 'https://opengolfapi.org/attribution'
  });
  if (providerCache.size >= 24) providerCache.delete(providerCache.keys().next().value);
  providerCache.set(key, sketch);
  return sketch;
}

// Reposition simulated progress on the shared route. The score and recorded
// stroke data are untouched. Offsets are visual, never measured dispersion.
export function placeGhostShots(shots, route) {
  if (!route) return {shots, start: undefined};
  const path = route.path || [route.tee, route.green];
  const segments = path.slice(1).map((end, index) => {
    const start = path[index];
    return {start, dx: end[0] - start[0], dy: end[1] - start[1],
      length: Math.hypot(end[0] - start[0], end[1] - start[1])};
  }).filter(segment => segment.length > 0);
  const length = segments.reduce((total, segment) => total + segment.length, 0);
  if (!length) return {shots, start: undefined};
  const unit = ([x, y]) => ({x: x / SKETCH_WIDTH, y: y / SKETCH_HEIGHT});
  const start = unit(route.tee);
  const positioned = shots.map(shot => {
    if (shot.lie === 'Holed') return {...shot, ...unit(route.green)};
    if (shot.club === 'Putter') return {...shot, ...unit([route.green[0] + 5, route.green[1] + 4])};
    let remaining = Math.min(1, Math.max(0, (.92 - shot.y) / .82)) * length;
    const segment = segments.find(part => {
      if (remaining <= part.length) return true;
      remaining -= part.length;
      return false;
    }) || segments.at(-1);
    const progress = Math.min(1, remaining / segment.length);
    const miss = (shot.x - .5) * SKETCH_WIDTH;
    return {...shot, ...unit([
      segment.start[0] + segment.dx * progress - segment.dy / segment.length * miss,
      segment.start[1] + segment.dy * progress + segment.dx / segment.length * miss
    ])};
  });
  return {shots: positioned, start};
}
