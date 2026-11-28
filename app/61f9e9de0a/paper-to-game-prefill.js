// The paper card remains the source of the golfer's own strokes.
// This prefill is deliberately explicit and never saves, settles, or changes a wager.
import {roundHoleOrder} from './round-hole-order.js';
export function paperStrokeForGameHole(snapshot,game,{playerIndex,holeNumber}={}){
 const fail=reason=>Object.freeze({ok:false,reason});
 if(!snapshot||snapshot.version!==1||typeof snapshot.identity!=='string'||!snapshot.identity||
    snapshot.source!=='solo-scorecard'||snapshot.maySettleWagers!==false||
    !Array.isArray(snapshot.scores)||snapshot.scores.length!==18)return fail('No compatible paper scorecard.');
 if(!game||!['skins','nassau','hole'].includes(game.format)||!Array.isArray(game.players)||
    !Number.isInteger(playerIndex)||playerIndex<0||playerIndex>=game.players.length)return fail('Choose your matching game player.');
 if(typeof game.roundIdentity!=='string'||!game.roundIdentity)return fail('This older game is not linked to a course. Enter scores manually to protect existing wagers.');
 if(game.roundIdentity!==snapshot.identity)return fail('This game belongs to another course or round.');
 const count=game.courseHoles??18,startHole=game.startHole??1;
 if(![9,18].includes(count)||!Number.isInteger(startHole)||startHole<1||startHole>count||
    !Array.isArray(game.holes)||game.holes.length>=count||!Number.isInteger(holeNumber)||
    holeNumber!==roundHoleOrder({count,startHole})[game.holes.length])return fail('Only the current unscored game hole can be prefilled.');
 const value=snapshot.scores[holeNumber-1];
 if(!Number.isInteger(value)||value<1||value>15)return fail('Score this hole on the paper card first.');
 return Object.freeze({ok:true,score:value,holeNumber,playerIndex,roundIdentity:snapshot.identity});
}
