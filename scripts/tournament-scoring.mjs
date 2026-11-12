// Tournament HQ scoring domain prototype. No Firebase writes, wagers or UI side effects.
// Actual course holes are the only source of par; missing par never becomes a guessed score.
export function shotgunOrder(startHole, holeCount=18) {
 if(![9,18].includes(holeCount)||!Number.isInteger(startHole)||startHole<1||startHole>holeCount)throw new RangeError('Invalid shotgun hole or course size');
 return Array.from({length:holeCount},(_,i)=>(startHole+i-1)%holeCount+1);
}
export function normalizeHolePars(holes,holeCount=18) {
 if(![9,18].includes(holeCount)||!Array.isArray(holes))throw new TypeError('A verified scorecard is required');
 const map=new Map();
 for(const h of holes){
  if(!Number.isInteger(h?.number)||h.number<1||h.number>holeCount||![3,4,5].includes(h.par)||map.has(h.number))continue;
  map.set(h.number,h.par);
 }
 return map;
}
export function validScrambleScore(score) {
 return Number.isInteger(score)&&score>=1&&score<=20;
}
export function validateCaptainScore({team,actorId,hole,strokes,expectedRevision,holeCount=18}) {
 if(!team||!actorId||team.captainId!==actorId)return {ok:false,reason:'not-captain'};
 if(!Number.isInteger(hole)||hole<1||hole>holeCount)return {ok:false,reason:'invalid-hole'};
 if(!validScrambleScore(strokes))return {ok:false,reason:'invalid-score'};
 if(team.locked||team.disqualified)return {ok:false,reason:'locked'};
 if(!Number.isSafeInteger(expectedRevision)||expectedRevision!==team.revision)return {ok:false,reason:'stale-revision'};
 const order=shotgunOrder(team.startHole,holeCount);
 const scores=team.scores||{};
 const next=order.find(h=>!Object.hasOwn(scores,String(h)));
 if(next!==hole)return {ok:false,reason:Object.hasOwn(scores,String(hole))?'already-scored':'out-of-order'};
 return {ok:true};
}
// Deliberately pure; the future backend must enforce the same rules transactionally.
export function recordCaptainScore({team,actorId,hole,strokes,expectedRevision,holeCount=18}) {
 const check=validateCaptainScore({team,actorId,hole,strokes,expectedRevision,holeCount});
 if(!check.ok)return {ok:false,reason:check.reason,team};
 return {ok:true,team:{...team,revision:team.revision+1,scores:{...(team.scores||{}),[hole]:strokes}}};
}
export function teamStanding(team,verifiedPars,holeCount=18) {
 const order=shotgunOrder(team.startHole,holeCount);
 const scores=team.scores||{};
 const played=order.filter(h=>Object.hasOwn(scores,String(h))&&validScrambleScore(scores[h]));
 let relative=0,netStrokes=0,hasUnknownPar=false;
 for(const hole of played){
  const par=verifiedPars.get(hole);
  if(par===undefined)hasUnknownPar=true;
  else relative+=scores[hole]-par;
  netStrokes+=scores[hole];
 }
 return {id:team.id,name:team.name,played:played.length,thru:played.at(-1)??null,nextHole:played.length<holeCount?order[played.length]:null,relative:hasUnknownPar?null:relative,strokes:netStrokes,complete:played.length===holeCount,disqualified:!!team.disqualified};
}
export function leaderboard(teams,verifiedPars,holeCount=18) {
 const standings=teams.map(team=>teamStanding(team,verifiedPars,holeCount));
 standings.sort((a,b)=>{
  if(a.disqualified!==b.disqualified)return a.disqualified?1:-1;
  if(a.relative===null||b.relative===null)return a.relative===null?(b.relative===null?0:1):-1;
  if(a.complete!==b.complete)return a.complete?-1:1;
  return a.relative-b.relative||b.played-a.played||a.name.localeCompare(b.name);
 });
 let lastKey=null,rank=0;
 return standings.map((row,i)=>{
  const key=row.disqualified?'DQ'+i:row.relative===null?'UNVERIFIED'+i:`${row.complete}|${row.relative}|${row.played}`;
  if(key!==lastKey){rank=i+1;lastKey=key}
  return {...row,rank:row.disqualified||row.relative===null?null:rank};
 });
}
