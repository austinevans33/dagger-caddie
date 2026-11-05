// The paper card remains the source of the golfer's own strokes.
// This prefill is deliberately explicit and never saves, settles, or changes a wager.
export function paperStrokeForGameHole(snapshot,game,{playerIndex,holeNumber}={}){
 const fail=reason=>Object.freeze({ok:false,reason});
 if(!snapshot||snapshot.version!==1||typeof snapshot.identity!=='string'||!snapshot.identity||
    snapshot.source!=='solo-scorecard'||snapshot.maySettleWagers!==false||
    !Array.isArray(snapshot.scores)||snapshot.scores.length!==18)return fail('No compatible paper scorecard.');
 if(!game||!['skins','nassau','hole'].includes(game.format)||!Array.isArray(game.players)||
    !Number.isInteger(playerIndex)||playerIndex<0||playerIndex>=game.players.length)return fail('Choose your matching game player.');
 if(typeof game.roundIdentity!=='string'||!game.roundIdentity)return fail('This older game is not linked to a course. Enter scores manually to protect existing wagers.');
 if(game.roundIdentity!==snapshot.identity)return fail('This game belongs to another course or round.');
 if(!Array.isArray(game.holes)||game.holes.length>18||!Number.isInteger(holeNumber)||
    holeNumber!==game.holes.length+1||holeNumber<1||holeNumber>18)return fail('Only the current unscored game hole can be prefilled.');
 const value=snapshot.scores[holeNumber-1];
 if(!Number.isInteger(value)||value<1||value>15)return fail('Score this hole on the paper card first.');
 return Object.freeze({ok:true,score:value,holeNumber,playerIndex,roundIdentity:snapshot.identity});
}
