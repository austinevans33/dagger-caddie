// Keep the approved Ledger UI intact; settle Nassau only from complete segments.
export function settleLedgerWager(game, original) {
  if (game.format !== 'nassau') return original(game);
  const score = game.players.map(() => 0);
  const stake = Number(game.stake) || 0;
  if (score.length !== 2) return {score, carry: 1};
  for (const [start, end] of [[0, 9], [9, 18], [0, 18]]) {
    const holes = game.holes.slice(start, end);
    if (holes.length !== end - start || !holes.every(h =>
      Array.isArray(h) && h.length === 2 && h.every(v => Number.isInteger(v) && v >= 1 && v <= 20))) continue;
    const wins = holes.reduce((total, h) => total + Math.sign(h[1] - h[0]), 0);
    score[0] += Math.sign(wins) * stake;
    score[1] -= Math.sign(wins) * stake;
  }
  return {score, carry: 1};
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
