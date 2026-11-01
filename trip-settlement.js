// Dagger Country Club — pure Golf Trip settlement foundation.
// No Firebase, DOM, room mutations, or automatic payment instructions.
const validId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(value);
const cents = value => Number.isSafeInteger(value) && Math.abs(value) <= 100000000;
function checkPlayers(players) {
  if (!Array.isArray(players) || players.length < 2 || players.length > 64 ||
      players.some(p => !p || !validId(p.id) || typeof p.name !== 'string' ||
        !p.name.trim() || p.name.trim().length > 80) ||
      new Set(players.map(p => p.id)).size !== players.length) throw new Error('Invalid trip roster');
}
/**
 * A completed game records net winnings (positive) and losses (negative) in
 * integer cents, never dollar floats. Every game's net must sum to zero.
 *
 * Input: {players:[{id,name}], rounds:[{id,status,games:[
 *   {id,status,netCents:{[playerId]:signedInteger}}
 * ]}]}
 *
 * Incomplete games/rounds are excluded and counted, never projected as settled.
 * A game ID is unique within a round; a round ID is unique across a trip.
 */
export function summarizeTrip(trip) {
  if (!trip || typeof trip !== 'object') throw new Error('Invalid trip');
  checkPlayers(trip.players);
  if (!Array.isArray(trip.rounds) || trip.rounds.length > 100)
    throw new Error('Invalid trip rounds');
  const playerIds = trip.players.map(p => p.id);
  const allowed = new Set(playerIds);
  const net = Object.fromEntries(playerIds.map(id => [id, 0]));
  const seenRounds = new Set();
  let completedRounds = 0, countedGames = 0, pendingGames = 0, pendingRounds = 0;
  for (const round of trip.rounds) {
    if (!round || !validId(round.id) || seenRounds.has(round.id) ||
        !Array.isArray(round.games) || round.games.length > 100)
      throw new Error('Invalid or duplicate round');
    seenRounds.add(round.id);
    const completed = round.status === 'completed';
    if (!completed && round.status !== 'active' && round.status !== 'draft')
      throw new Error('Invalid round status');
    if (!completed) { pendingRounds++; pendingGames += round.games.length; continue; }
    completedRounds++;
    const seenGames = new Set();
    for (const game of round.games) {
      if (!game || !validId(game.id) || seenGames.has(game.id))
        throw new Error('Invalid or duplicate game');
      seenGames.add(game.id);
      if (game.status !== 'completed') {
        if (game.status !== 'active' && game.status !== 'draft')
          throw new Error('Invalid game status');
        pendingGames++;
        continue;
      }
      const entries = game.netCents;
      if (!entries || typeof entries !== 'object' || Array.isArray(entries) ||
          Object.keys(entries).length !== playerIds.length ||
          Object.keys(entries).some(id => !allowed.has(id)) ||
          playerIds.some(id => !cents(entries[id])))
        throw new Error('Invalid game settlement');
      if (playerIds.reduce((sum, id) => sum + entries[id], 0) !== 0)
        throw new Error('Non-zero-sum game settlement');
      for (const id of playerIds) {
        net[id] += entries[id];
        if (!Number.isSafeInteger(net[id])) throw new Error('Trip balance overflow');
      }
      countedGames++;
    }
  }
  const debtors = playerIds.filter(id => net[id] < 0).map(id => ({id, left: -net[id]}));
  const creditors = playerIds.filter(id => net[id] > 0).map(id => ({id, left: net[id]}));
  const transfers = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amountCents = Math.min(debtors[i].left, creditors[j].left);
    transfers.push({from: debtors[i].id, to: creditors[j].id, amountCents});
    debtors[i].left -= amountCents;
    creditors[j].left -= amountCents;
    if (!debtors[i].left) i++;
    if (!creditors[j].left) j++;
  }
  return {netCents:net, transfers, completedRounds, pendingRounds, countedGames, pendingGames,
    provisional:pendingRounds > 0 || pendingGames > 0};
}
