// All Heart history is local club history. It never settles a Money Room or ticket.
import {chooseAllHeartMoment} from './all-heart-moments.js';
import {buildAllHeartReceipt} from './all-heart-receipts.js';
import {founderVerifiedScorecard} from './founders-verified-scorecards.js';
import {bayonetVerifiedScorecard} from './bayonet-verified-scorecard.js';
import {matchbookPersonalBest} from './matchbook.js';
import {legendaryAdaptation} from './legendary-adaptations.js';
import {soloPlayOrder} from './solo-scorecard.js';

export const ALL_HEART_HISTORY = 'dcc_all_heart_history_v1';
export const ALL_HEART_DISABLED = 'dcc_all_heart_disabled_v1';
const MAX_ROUND_OFFERS = 2;
const COOLDOWN_HOLES = 4;

function readJournal(storage) {
  const value = JSON.parse(storage.getItem(ALL_HEART_HISTORY) || '[]');
  if (!Array.isArray(value)) throw Error('All Heart history is invalid');
  return value;
}

function writeJournal(storage, entries) {
  storage.setItem(ALL_HEART_HISTORY, JSON.stringify(entries.slice(0, 120)));
}

// A deterministic round/hole draw cannot be retried by refreshing.
export function naturalAllHeartGate(roundId, hole) {
  let hash = 2166136261;
  for (const char of roundId + ':' + hole) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  return ((hash ^ (hash >>> 16)) >>> 0) / 2 ** 32 < 0.28;
}

function archivedGhostTarget(storage, selection, hole) {
  let list;
  try { list = JSON.parse(storage.getItem('dcc_house_ghost_archive_v1') || '[]'); } catch { return null; }
  if (!Array.isArray(list)) return null;
  for (const row of list) {
    if (!row?.result || !Array.isArray(row.holes) || String(row.result.status || '').startsWith('Unfinished')) continue;
    let previous;
    try { previous = JSON.parse(row.course || 'null')?.selection; } catch { continue; }
    if (previous?.course?.provider !== selection.course.provider ||
        previous.course.providerCourseId !== selection.course.providerCourseId ||
        previous.tee?.providerTeeId !== selection.tee.providerTeeId ||
        previous.tee.totalYards !== selection.tee.totalYards) continue;
    const played = row.holes.find((score,index) => (score?.holeNumber ?? index+1) === hole);
    if (Number.isInteger(played?.ghost) && played.ghost >= 2 && played.ghost <= 20) return played.ghost;
  }
  return null;
}

export function allHeartRoundOffer(storage, active, card, {gate = naturalAllHeartGate} = {}) {
  if (!active || !card || storage.getItem(ALL_HEART_DISABLED) === 'true') return null;
  const {selection, selectedAt} = active;
  const {course, tee} = selection;
  const identity = course.providerCourseId + '|' + tee.providerTeeId + '|' + selectedAt;
  if (identity !== card.identity || card.scores[card.hole-1] !== null) return null;
  const order = soloPlayOrder(card, course.holeCount ?? 18);
  const position = order.indexOf(card.hole);
  if (position < 0) return null;
  const scorecard = bayonetVerifiedScorecard(selection) ?? founderVerifiedScorecard(selection);
  const facts = scorecard?.holes.find(row => row.number === card.hole);
  if (!facts || ![3,4,5].includes(facts.par)) return null;
  const entries = readJournal(storage);
  const round = entries.filter(entry => entry.roundId === card.identity);
  const prior = round.find(entry => entry.hole === card.hole);
  if (prior) return ['offered','accepted'].includes(prior.state) ? prior : null;
  if (!gate(card.identity, card.hole)) return null;
  const hasTraveling = round.some(entry => entry.moment.traveling);
  const best = hasTraveling ? null : matchbookPersonalBest(storage, active, card);
  const adaptation = hasTraveling || best !== null ? null : legendaryAdaptation(storage, selection, card, card.hole);
  const ghost = archivedGhostTarget(storage, selection, card.hole);
  const context = {
    courseId: course.providerCourseId, holeNumber: card.hole, playPosition: position,
    par: facts.par, roundActive: true, maxPerRound: MAX_ROUND_OFFERS, cooldownHoles: COOLDOWN_HOLES,
    legendaryAdaptation: adaptation,
    ghostRival: best > 1 ? {eligible:true, strokes:best, clubLegend:true} :
      ghost ? {eligible:true, strokes:ghost} : null
  };
  const history = {shownCount:round.length, lastShownHole:Math.max(-99,...round.map(entry=>entry.position))};
  const moment = chooseAllHeartMoment(context, history) ??
    chooseAllHeartMoment({...context, strokeIndex:facts.handicapMen}, history);
  if (!moment) return null;
  const entry = {roundId:card.identity, course:course.name, hole:card.hole, position, moment, state:'offered'};
  writeJournal(storage, [entry,...entries]);
  return entry;
}

export function respondToAllHeart(storage, card, offer, accepted) {
  if (card?.identity !== offer?.roundId || card.hole !== offer.hole || card.scores[offer.hole-1] !== null) return false;
  const rows = readJournal(storage);
  const index = rows.findIndex(row=>row.roundId===offer.roundId&&row.hole===offer.hole&&row.state==='offered');
  if (index < 0) return false;
  rows[index] = {...rows[index], state:accepted?'accepted':'dismissed'};
  writeJournal(storage,rows);
  return true;
}

export function completeAllHeartHole(storage, card, hole) {
  const rows = readJournal(storage);
  const index = rows.findIndex(row=>row.roundId===card.identity&&row.hole===hole);
  if (index < 0) return null;
  const entry = rows[index];
  if (entry.state === 'offered') {
    rows[index] = {...entry,state:'passed'};
    writeJournal(storage,rows);
    return null;
  }
  if (entry.state !== 'accepted' && entry.state !== 'completed') return null;
  const strokes = card.scores[hole-1];
  const receipt = buildAllHeartReceipt(entry.moment,{roundId:card.identity,hole,strokes,
    targetStrokes:entry.moment.targetStrokes,accepted:true,completed:Number.isInteger(strokes)});
  if (!receipt) return null;
  rows[index] = {...entry,state:'completed',receipt};
  writeJournal(storage,rows);
  return receipt;
}

export function allHeartClubRecord(storage) {
  return readJournal(storage).filter(row=>row.state==='completed'&&row.receipt);
}
