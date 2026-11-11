// DCC R11 — Competition data is a saved LOCAL snapshot, not a verified live match.
// Reads only; never alters a match or produces wager/settlement information.
export function summarizeMatchRecord(record, now = Date.now()) {
  if (!record || record.schemaVersion !== 1 || record.primaryFormat !== 'match-play' ||
      record.status !== 'active' || !Array.isArray(record.players) ||
      record.players.length !== 2 || !Array.isArray(record.scores) ||
      record.scores.length < 1 || record.scores.length > 18 ||
      !Number.isSafeInteger(record.updatedAt) || record.updatedAt > now + 60000 ||
      now - record.updatedAt > 12 * 60 * 60 * 1000) return null;

  const names = record.players.map(p =>
    p && typeof p.name === 'string' ? p.name.trim() : '');
  if (names.some(n => !n || n.length > 24)) return null;
  let lead = 0;
  for (let i = 0; i < record.scores.length; i++) {
    const h = record.scores[i];
    if (!h || h.hole !== i + 1 || !h.strokes ||
        !Number.isInteger(h.strokes.p1) || !Number.isInteger(h.strokes.p2) ||
        h.strokes.p1 < 1 || h.strokes.p1 > 20 ||
        h.strokes.p2 < 1 || h.strokes.p2 > 20) return null;
    lead += Math.sign(h.strokes.p2 - h.strokes.p1);
    if (Math.abs(lead) > 18 - (i + 1)) return null; // already clinched; 'active' is contradictory
  }
  if (record.scores.length === 18) return null;
  const remaining = 18 - record.scores.length;
  return {
    kind: 'saved-local-match-play',
    source: 'local-device',
    verifiedLive: false,
    matchId: typeof record.id === 'string' ? record.id.slice(0,100) : '',
    players: names,
    holesPlayed: record.scores.length,
    holesRemaining: remaining,
    lead,
    status: lead === 0 ? 'all square' : `${names[lead > 0 ? 0 : 1]} ${Math.abs(lead)} up`,
    updatedAt: record.updatedAt
  };
}

export function readLocalMatchSummary(storage, now = Date.now()) {
  try {
    const raw = storage.getItem('dcc_shared_match_v1');
    if (!raw || raw.length > 50000) return null;
    return summarizeMatchRecord(JSON.parse(raw), now);
  } catch (_) { return null; }
}
