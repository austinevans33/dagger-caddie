// Pure Matchbook receipt builder for opt-in All Heart challenges.
// Call only after a real score exists; never writes to storage, Ledger or Firebase.
export function buildAllHeartReceipt(moment, result) {
  if (!moment || !['legend','grudge','dare'].includes(moment.type) ||
      typeof moment.key !== 'string' || !moment.key ||
      !result || typeof result.roundId !== 'string' || !result.roundId ||
      !Number.isInteger(result.hole) || result.hole < 1 || result.hole > 27) return null;
  if (!result.accepted || !result.completed) return null;
  if (!Number.isInteger(result.strokes) || result.strokes < 1 || result.strokes > 30) return null;
  if (moment.type === 'dare') {
    // A proposal alone is not a settled bet. Only an authoritative game result can create a receipt.
    if (result.settlementVerified !== true || !['won','lost','push'].includes(result.outcome)) return null;
    return {id:`all-heart:${result.roundId}:${moment.key}`,type:'all-heart',kind:'dare',
      hole:result.hole,headline:result.outcome==='won'?'TOOK THE DARE. WON.':result.outcome==='lost'?'TOOK THE DARE. LOST.':'THE DARE WAS A PUSH.',
      strokes:result.strokes,outcome:result.outcome};
  }
  if (!Number.isInteger(result.targetStrokes) || result.targetStrokes < 1 || result.targetStrokes > 30) return null;
  const outcome=result.strokes<result.targetStrokes?'beat':result.strokes===result.targetStrokes?'matched':'missed';
  return {id:`all-heart:${result.roundId}:${moment.key}`,type:'all-heart',kind:moment.type,
    hole:result.hole,headline:outcome==='beat'?'BEAT THE CHALLENGE.':outcome==='matched'?'MATCHED THE CHALLENGE.':'THE CHALLENGE WON THIS TIME.',
    strokes:result.strokes,targetStrokes:result.targetStrokes,outcome,
    ...(moment.type==='legend' && /^https:\/\//.test(moment.sourceUrl??'') ? {sourceUrl:moment.sourceUrl} : {})};
}
