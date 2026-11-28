import {roundHoleOrder} from './round-hole-order.js';
// Keep the approved Ledger UI intact; settle Nassau only from complete segments.
export function settleLedgerWager(game, original) {
  if (game.format !== 'nassau') return original(game);
  const players = Array.isArray(game.players) ? game.players : [];
  const score = players.map(() => 0), pending = [];
  const stake = Number(game.stake), startHole = game.startHole ?? 1;
  const valid = row => Array.isArray(row) && row.length === 2 &&
    row.every(value => Number.isInteger(value) && value >= 1 && value <= 20);
  if (score.length !== 2 || !Number.isFinite(stake) || stake < 0 ||
      !Array.isArray(game.holes) || game.holes.length > 18 ||
      game.holes.some(row => row != null && !valid(row)) ||
      !Number.isInteger(startHole) || startHole < 1 || startHole > 18) {
    return {score, carry: 1, pending, invalid: true};
  }
  // Existing local tickets store rows in play order. Importers may instead
  // explicitly supply physical slots for rotating a full round.
  const order = roundHoleOrder({startHole});
  const physicalSlots = game.nassauSegments === 'play-order';
  const rows = physicalSlots ? order.map(hole => game.holes[hole - 1]) : game.holes;
  const rotated = startHole !== 1 && (physicalSlots || game.courseHoles === 18);
  const segments = [[0, 9, rotated ? 'First nine played' : 'Front nine'],
    [9, 18, rotated ? 'Second nine played' : 'Back nine'], [0, 18, 'Overall']];
  for (const [start, end, label] of segments) {
    const holes = rows.slice(start, end).filter(valid);
    const wins = holes.reduce((total, row) => total + Math.sign(row[1] - row[0]), 0);
    if (holes.length !== end - start) {
      pending.push({label, played: holes.length, required: end - start, leader: Math.sign(wins)});
      continue;
    }
    score[0] += Math.sign(wins) * stake;
    score[1] -= Math.sign(wins) * stake;
  }
  return {score, carry: 1, pending};
}

export function installLedgerSettlement(target) {
  const original = target.wagerMath;
  if (typeof original !== 'function') return false;
  target.wagerMath = game => settleLedgerWager(game, original);
  // Initial inline rendering ran before this deferred module loaded.
  // Recompute existing saved rows using the corrected settlement engine.
  if (typeof target.renderFoursome === 'function') target.renderFoursome();
  return true;
}
