// Pure, read-only bridge between a paper scorecard snapshot and a game's hole scores.
// Callers must explicitly identify the same round and player; this never saves or settles wagers.
const validStroke = value => Number.isInteger(value) && value >= 1 && value <= 15;
export function projectPaperScoresIntoGame(snapshot, game, {roundIdentity, playerIndex} = {}) {
 if (!snapshot || snapshot.version !== 1 || snapshot.identity !== roundIdentity ||
     !Array.isArray(snapshot.scores) || snapshot.scores.length !== 18 ||
     !Array.isArray(game?.players) || !Number.isInteger(playerIndex) ||
     playerIndex < 0 || playerIndex >= game.players.length ||
     !['nassau', 'skins'].includes(game.format)) {
  return Object.freeze({status:'incompatible', holes:null, changedHoles:Object.freeze([]), maySettleWagers:false});
 }
 // Never infer that an unrelated or stale game belongs to the live course.
 if (typeof roundIdentity !== 'string' || !roundIdentity ||
     (game.roundIdentity !== undefined && game.roundIdentity !== roundIdentity)) {
  return Object.freeze({status:'incompatible', holes:null, changedHoles:Object.freeze([]), maySettleWagers:false});
 }
 const count=game.players.length;
 const existing=Array.isArray(game.holes)?game.holes:[];
 if (existing.length > 18 || existing.some(h=>!Array.isArray(h)||h.length!==count ||
     h.some(n=>n!==null&&!validStroke(n)))) {
  return Object.freeze({status:'invalid-game', holes:null, changedHoles:Object.freeze([]), maySettleWagers:false});
 }
 if (snapshot.scores.some(n=>n!==null&&!validStroke(n))) {
  return Object.freeze({status:'invalid-card', holes:null, changedHoles:Object.freeze([]), maySettleWagers:false});
 }
 const changes=[];
 const holes=Array.from({length:18},(_,i)=>{
  const row=existing[i]?[...existing[i]]:Array(count).fill(null);
  const score=snapshot.scores[i];
  if (row[playerIndex]!==score){changes.push(i+1);row[playerIndex]=score;}
  return Object.freeze(row);
 });
 return Object.freeze({
  status:changes.length?'preview-updated':'preview-unchanged',
  holes:Object.freeze(holes),
  changedHoles:Object.freeze(changes),
  roundIdentity,
  maySettleWagers:false
 });
}
