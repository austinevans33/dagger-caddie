// All Heart Moments: deterministic, opt-in suggestions only.
// No bets are created, no money moves, and no score/round state is modified.
export function chooseAllHeartMoment(context = {}, history = {}) {
  const {courseId, holeNumber, par, strokeIndex, moneyRoomPlayers = 0,
    historicalChallenge = null, ghostRival = null} = context;
  if (!courseId || !Number.isInteger(holeNumber) || holeNumber < 1 || holeNumber > 27) return null;
  if (context.enabled === false || context.roundActive === false) return null;
  const key = String(courseId) + ':' + holeNumber;
  const dismissed = new Set(history.dismissedKeys ?? []);
  const shown = new Set(history.shownKeys ?? []);
  if (dismissed.has(key) || shown.has(key)) return null;
  const lastHole = Number(history.lastShownHole ?? -99);
  const cooldown = Number.isFinite(context.cooldownHoles) ? Math.max(0, context.cooldownHoles) : 3;
  if ((context.playPosition ?? holeNumber) - lastHole <= cooldown) return null;
  const maxPerRound = Number.isFinite(context.maxPerRound) ? Math.max(0, context.maxPerRound) : 3;
  if ((history.shownCount ?? 0) >= maxPerRound) return null;
  // Only source-verified facts may be used in a historical challenge.
  if (historicalChallenge?.verified === true &&
      historicalChallenge.courseId === courseId &&
      historicalChallenge.holeNumber === holeNumber &&
      typeof historicalChallenge.player === 'string' && historicalChallenge.player.trim().length > 0 &&
      typeof historicalChallenge.event === 'string' && historicalChallenge.event.trim().length > 0 &&
      Number.isInteger(historicalChallenge.strokes) &&
      historicalChallenge.strokes > 0 &&
      typeof historicalChallenge.sourceUrl === 'string' &&
      /^https:\/\//.test(historicalChallenge.sourceUrl)) {
    return {key, type:'legend', title:'WALK WITH THE LEGENDS',
      description:`${historicalChallenge.player} made ${historicalChallenge.strokes} here in ${historicalChallenge.event}. Can you match it?`,
      sourceUrl:historicalChallenge.sourceUrl, targetStrokes:historicalChallenge.strokes, action:'accept-challenge'};
  }
  if (moneyRoomPlayers >= 2 && par === 4 && Number.isInteger(strokeIndex) && strokeIndex >= 13) {
    return {key, type:'dare', title:'THIS HOLE IS BEGGING FOR ACTION',
      description:'Friendly par 4. The boys are watching. Open a side-bet proposal?',
      action:'open-ticket-window'};
  }
  // Solo rounds can still have a non-monetary Dare. Never imply other players
  // are present and never open a betting form for a solo challenge.
  if (moneyRoomPlayers < 2 && par === 4 && Number.isInteger(strokeIndex) && strokeIndex >= 13) {
    return {key, type:'dare', title:'ALL HEART. NO EXCUSES.',
      description:'A friendly par 4. Commit to a par or better.', targetStrokes:par,
      action:'accept-challenge'};
  }
  if (ghostRival?.eligible === true && Number.isInteger(ghostRival.strokes) && ghostRival.strokes > 0) {
    if(ghostRival.clubLegend===true)return {key,type:'grudge',title:'CLUB LEGENDS',traveling:true,
      holeNumber,targetStrokes:ghostRival.strokes,
      description:`Your saved best here is ${ghostRival.strokes}. Can you go one lower?`,action:'accept-challenge'};
    return {key, type:'grudge', title:'BEAT YOUR GHOST',
      description:`Your rival shot ${ghostRival.strokes} here. Can you beat it?`, targetStrokes:ghostRival.strokes,
      action:'accept-challenge'};
  }
  const adapted=context.legendaryAdaptation;
  if(adapted&&typeof adapted.fact==='string'&&typeof adapted.challenge==='string'&&
      adapted.sourceUrl==='https://thejourney.theopen.com/2017'&&
      Number.isInteger(adapted.targetStrokes)&&adapted.targetStrokes>=2&&adapted.targetStrokes<=5)return {key,type:'legend',title:'WALK WITH THE LEGENDS',traveling:true,holeNumber,
    targetStrokes:adapted.targetStrokes,sourceUrl:adapted.sourceUrl,action:'accept-challenge',
    description:adapted.fact+' Your adapted challenge: '+adapted.challenge};
  return null;
}
