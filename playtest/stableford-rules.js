// Pure Stableford scorer; no state, network, wager or Ledger writes.
// strokesReceived is an explicit per-player per-hole handicap allocation from
// a separately verified handicap engine. Do not infer it from stroke index.
const DEFAULT_POINTS=Object.freeze({doubleBogeyOrWorse:0,bogey:1,par:2,birdie:3,eagle:4,albatross:5});
export function scoreStableford(holes, playerIds, {points=DEFAULT_POINTS}={}) {
 if(!Array.isArray(holes)||!Array.isArray(playerIds)||playerIds.length<1||
    playerIds.some(id=>typeof id!=='string'||!id)||new Set(playerIds).size!==playerIds.length)
   throw new TypeError('Invalid players or holes');
 const keys=['doubleBogeyOrWorse','bogey','par','birdie','eagle','albatross'];
 if(!points||keys.some(k=>!Number.isSafeInteger(points[k])||points[k]<0)) throw new TypeError('Invalid points');
 const totals=Object.fromEntries(playerIds.map(id=>[id,0]));
 const results=[], seen=new Set();
 for(const entry of holes) {
  if(!entry||!Number.isInteger(entry.hole)||entry.hole<1||entry.hole>27||seen.has(entry.hole)||
     !Number.isInteger(entry.par)||entry.par<3||entry.par>6) throw new TypeError('Invalid hole');
  seen.add(entry.hole);
  const scores=entry.scores, strokesReceived=entry.strokesReceived;
  if(!scores||typeof scores!=='object'||!strokesReceived||typeof strokesReceived!=='object'||
     Object.keys(scores).some(id=>!playerIds.includes(id))||
     Object.keys(strokesReceived).some(id=>!playerIds.includes(id))) throw new TypeError('Invalid player scores');
  const perPlayer={};
  for(const id of playerIds) {
   const gross=scores[id], allocation=strokesReceived[id];
   if(gross===undefined||gross===null) {perPlayer[id]={status:'pending'};continue;}
   if(!Number.isInteger(gross)||gross<1||gross>30||!Number.isInteger(allocation)||allocation<0||allocation>5)
     throw new TypeError('Invalid gross score or handicap strokes');
   const net=gross-allocation, diff=net-entry.par;
   const key=diff>=2?'doubleBogeyOrWorse':diff===1?'bogey':diff===0?'par':diff===-1?'birdie':diff===-2?'eagle':'albatross';
   const awarded=points[key];
   totals[id]+=awarded;
   perPlayer[id]={status:'scored',gross,net,points:awarded};
  }
  results.push({hole:entry.hole,par:entry.par,players:perPlayer});
 }
 return {totals,holes:results,complete:results.every(h=>playerIds.every(id=>h.players[id].status==='scored')),unit:'points'};
}
