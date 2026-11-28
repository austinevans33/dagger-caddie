// Target yardages, outcomes and simulated Ghost traces are not measurements.
export function normalizeShotMeasurement(value) {
  if (value?.source !== 'launch-monitor' ||
      !Number.isFinite(value.carryYards) || value.carryYards < 1 || value.carryYards > 700 ||
      !Number.isFinite(value.lateralYards) || Math.abs(value.lateralYards) > 300) return null;
  return {source:'launch-monitor',carryYards:value.carryYards,lateralYards:value.lateralYards};
}

export function measuredClubDispersion(shots,club) {
  if (!Array.isArray(shots) || typeof club !== 'string' || !club.trim()) return null;
  const measured = shots.filter(shot=>shot?.club===club)
    .map(shot=>normalizeShotMeasurement(shot.measurement))
    .filter(Boolean).slice(-30);
  if (measured.length < 3) return null;
  const carries=measured.map(shot=>shot.carryYards),misses=measured.map(shot=>shot.lateralYards);
  return {count:measured.length,carry:[Math.min(...carries),Math.max(...carries)],lateral:[Math.min(...misses),Math.max(...misses)]};
}

export function describeMeasuredBag(shots,clubNames) {
  if(!Array.isArray(clubNames))return '';
  const rounded=range=>range.map(value=>Math.round(value*10)/10).join(' to ');
  const observations=[];
  for(const club of [...new Set(clubNames)].slice(0,14)) {
    const result=measuredClubDispersion(shots,club);
    if(!result)continue;
    observations.push(club+' ('+result.count+' measured, carry '+rounded(result.carry)+
      ' yd, lateral '+rounded(result.lateral)+' yd)');
  }
  return observations.join('; ');
}
