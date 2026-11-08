// Read-only recap of saved cards and recorded game results on this device.
import {readActiveRound} from './starters-desk-session.js';
import {normalizeCourseSelection} from './course-identity.js';
import {readSoloCard, summarizeSoloCard} from './solo-scorecard.js';
import {readCourseScorecard} from './active-course-context.js';
import {foursomeMoney} from './foursome-money-math.js';
import {bingoPayout} from './bbb-money.js';

const formats = new Map([
 ['hole', 'Head-to-head'], ['nassau', 'Nassau'], ['skins', 'Skins'],
 ['vegas', 'Vegas']
]);
const clean = value => typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
const time = value => Number.isFinite(value) ? value : 0;
function savedList(storage, key) {
 try {
  const records = JSON.parse(storage.getItem(key) || '[]');
  return Array.isArray(records) ? records.filter(record => record && typeof record === 'object') : [];
 } catch {
  return [];
 }
}

function cardRecap(storage, record) {
 const {card, selectedAt} = record;
 const selection = normalizeCourseSelection(record.selection);
 if (!selection || !Number.isSafeInteger(selectedAt) || card?.version !== 1 ||
     !Array.isArray(card.scores) || card.scores.length !== 18 ||
     !card.scores.every(score => score === null || Number.isInteger(score) && score >= 1 && score <= 15)) return null;
 const identity = [selection.course.providerCourseId, selection.tee.providerTeeId, selectedAt].join('|');
 if (card.identity !== identity) return null;
 const holes = readCourseScorecard(storage, selection)?.holes || [];
 const pars = Array.from({length: 18}, (_, index) => holes.find(hole => hole.number === index + 1)?.par);
 const score = summarizeSoloCard(card, pars);
 if (!score.count) return null;

 const relative = score.relativeToPar;
 const toPar = relative === null ? '' : relative === 0 ? ' · even par' : ` · ${relative > 0 ? '+' : ''}${relative} to par`;
 const joke = relative < 0 ? 'The course has asked for a rematch.' :
  relative > 0 ? 'The pencil did more work than the putter. It has requested a raise.' :
  'The scorecard has been admitted into evidence.';
 const lines = [
  `${selection.course.name} · ${selection.tee.name}`,
  `${score.total} strokes · ${score.count} of ${score.length} holes recorded${toPar}`,
  joke
 ];
 if (score.best?.toPar < 0) lines.push(`Hole ${score.best.hole} went ${-score.best.toPar} under. Put that one in the group chat.`);
 return {identity, at: time(record.archivedAt) || selectedAt, lines, games: []};
}

function playerRows(players, score, points) {
 if (!Array.isArray(players) || players.length < 2 || players.length > 4 || players.some(name => !clean(name))) return [];
 const hasMoney = Array.isArray(score) && score.length === players.length && score.every(Number.isFinite);
 return players.flatMap((name, index) => {
  const balance = hasMoney ? score[index] : null;
  const money = balance === null ? '' : `${balance < 0 ? '−' : balance > 0 ? '+' : ''}$${Math.abs(balance).toFixed(2)}`;
  const details = [points ? `${points[index]} pts` : '', money].filter(Boolean);
  return details.length ? [`${clean(name)} · ${details.join(' · ')}`] : [];
 });
}

function gameRecap(game, kind) {
 const at = time(game.ended);
 if (!at || !game.holes) return null;
 let title = formats.get(game.format);
 let rows, holes;
 if (kind === 'bingo') {
  if (!Array.isArray(game.holes) || !game.holes.length || game.holes.length > 18) return null;
  const result = bingoPayout(game.players, game.holes, Number(game.stake ?? 0));
  title = 'Bingo Bango Bongo';
  holes = game.holes.length;
  rows = playerRows(game.players, Number(game.stake) > 0 ? result.score : null, result.points);
 } else if (kind === 'room') {
  if (game.archived !== true || !title || !Array.isArray(game.players)) return null;
  title = 'Money Room · ' + title;
  holes = Object.entries(game.holes).filter(([hole, strokes]) => /^(?:[1-9]|1[0-8])$/.test(hole) &&
   Array.isArray(strokes) && strokes.length === game.players.length &&
   strokes.every(score => Number.isInteger(score) && score >= 1 && score <= 20)).length;
  rows = playerRows(game.players, game.payouts);
 } else {
  const result = foursomeMoney(game);
  if (!title || !result || result.pending.length) return null;
  holes = game.holes.length;
  rows = playerRows(game.players, result.score);
 }
 if (!holes || !rows.length) return null;
 return {
  identity: game.roundIdentity, at,
  lines: [`${title} · ${holes} holes recorded`, ...rows, 'The club treasurer has declined to comment.']
 };
}

export function readRoundRecap(storage) {
 const active = readActiveRound(storage);
 const cards = savedList(storage, 'dcc_solo_round_archive_v1');
 if (active) cards.push({...active, card: readSoloCard(storage)});
 const recaps = cards.map(record => cardRecap(storage, record)).filter(Boolean);
 for (const [key, kind] of [
  ['dagger_foursome_history', 'foursome'],
  ['dagger_bbb_history', 'bingo'],
  ['dagger_room_archives', 'room']
 ]) {
  for (const game of savedList(storage, key)) {
   let recap;
   try { recap = gameRecap(game, kind); } catch { continue; }
   if (!recap) continue;
   const card = recap.identity && recaps.find(record => record.identity === recap.identity && record.games);
   if (card) {
    card.at = Math.max(card.at, recap.at);
    card.games.push(recap.lines.join('\n'));
   } else {
    recaps.push(recap);
   }
  }
 }
 for (const ghost of savedList(storage, 'dcc_house_ghost_archive_v1')) {
  const at = Date.parse(ghost.archivedAt);
  const holes = ghost.holes;
  if (!Number.isFinite(at) || !Array.isArray(holes) || !holes.length || holes.length > 18 ||
      !holes.every(hole => [hole?.player, hole?.ghost].every(score => Number.isInteger(score) && score >= 1 && score <= 20))) continue;
  const player = holes.reduce((sum, hole) => sum + hole.player, 0);
  const house = holes.reduce((sum, hole) => sum + hole.ghost, 0);
  recaps.push({at, lines: [
   `House Ghost · ${holes.length} holes recorded`,
   `You · ${player} strokes
House Ghost · ${house} strokes`,
   clean(ghost.result?.status),
   'The Ghost has signed its card. Penmanship remains suspicious.'
  ].filter(Boolean)});
 }
 const latest = recaps.sort((a, b) => b.at - a.at)[0];
 return latest ? [latest.lines.join('\n'), ...(latest.games || []), 'As It Lies.'].join('\n\n') : '';
}
