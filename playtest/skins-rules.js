// Pure Skins rules engine. No bets, ledger writes, storage, or Firebase side effects.
// scoresByHole: [{hole:1, scores:{playerId: grossStrokes}}].
// Incomplete holes remain pending; tied holes carry over.
export function calculateSkins(scoresByHole, playerIds, {startValue = 1} = {}) {
  if (!Array.isArray(scoresByHole) || !Array.isArray(playerIds) || playerIds.length < 2 ||
      new Set(playerIds).size !== playerIds.length || playerIds.some(id => typeof id !== 'string' || !id) ||
      !Number.isSafeInteger(startValue) || startValue < 1) throw new TypeError('Invalid skins input');
  const players = new Set(playerIds);
  const totals = Object.fromEntries(playerIds.map(id => [id, 0]));
  const awards = [];
  let carry = 0, previousHole = 0;
  for (const entry of scoresByHole) {
    if (!entry || !Number.isInteger(entry.hole) || entry.hole <= previousHole || entry.hole > 27)
      throw new TypeError('Holes must be ascending and unique');
    previousHole = entry.hole;
    const scores = entry.scores;
    if (!scores || typeof scores !== 'object' || Object.keys(scores).some(id => !players.has(id)))
      throw new TypeError('Invalid scores');
    const values = playerIds.map(id => scores[id]);
    if (values.some(v => v === undefined || v === null)) {
      awards.push({hole:entry.hole, status:'pending', carry});
      break; // Do not settle beyond an incomplete hole.
    }
    if (values.some(v => !Number.isInteger(v) || v < 1 || v > 30))
      throw new TypeError('Invalid stroke count');
    const low = Math.min(...values);
    const winners = playerIds.filter(id => scores[id] === low);
    if (winners.length !== 1) {
      carry += startValue;
      awards.push({hole:entry.hole, status:'carry', carry});
      continue;
    }
    const winner = winners[0], skins = carry + startValue;
    totals[winner] += skins;
    awards.push({hole:entry.hole, status:'won', winner, skins, carry:0});
    carry = 0;
  }
  return {totals, awards, unresolvedCarry:carry, unit:'skins'};
}
