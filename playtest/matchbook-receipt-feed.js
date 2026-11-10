// Read-only projection for the Matchbook. No persistence, wagers or network calls.
// Deduplicate by stable receipt ID so replays/rejoins cannot duplicate memories.
export function projectMatchbookReceipts(receipts = [], {limit = 20, roundId = null} = {}) {
  if (!Array.isArray(receipts) || !Number.isInteger(limit) || limit < 0 || limit > 200)
    throw new TypeError('Invalid receipt feed input');
  const byId = new Map();
  for (const item of receipts) {
    if (!item || item.type !== 'all-heart' || typeof item.id !== 'string' ||
        !/^all-heart:[^:]+:.+/.test(item.id) ||
        !['legend','grudge','dare'].includes(item.kind) ||
        !Number.isInteger(item.hole) || item.hole < 1 || item.hole > 27 ||
        typeof item.headline !== 'string' || !item.headline ||
        !Number.isInteger(item.strokes) || item.strokes < 1 || item.strokes > 30 ||
        !['beat','matched','missed','won','lost','push'].includes(item.outcome)) continue;
    if (roundId !== null && (typeof roundId !== 'string' || !item.id.startsWith(`all-heart:${roundId}:`))) continue;
    if (item.kind === 'dare' && !['won','lost','push'].includes(item.outcome)) continue;
    if (item.kind !== 'dare' && !['beat','matched','missed'].includes(item.outcome)) continue;
    if (item.kind !== 'dare' && (!Number.isInteger(item.targetStrokes) || item.targetStrokes < 1 || item.targetStrokes > 30)) continue;
    // First valid record wins. Never silently overwrite a historical result on replay.
    if (!byId.has(item.id)) byId.set(item.id, {
      id:item.id, kind:item.kind, hole:item.hole, headline:item.headline,
      strokes:item.strokes, outcome:item.outcome,
      ...(item.kind !== 'dare' ? {targetStrokes:item.targetStrokes} : {}),
      ...(item.kind === 'legend' && typeof item.sourceUrl === 'string' && /^https:\/\//.test(item.sourceUrl) ? {sourceUrl:item.sourceUrl} : {})
    });
  }
  return [...byId.values()].sort((a,b)=>a.id.localeCompare(b.id) || a.hole-b.hole).slice(0,limit);
}
