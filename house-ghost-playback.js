// Read-only shot-by-shot view model for the schematic House Ghost.
// This module never updates a golfer score, settles a bet, or asserts real GPS.
import {buildGhostRound} from './house-ghost-round.js';

export function ghostShotPlayback({courseName,holes=[],seed='house-ghost',count=18,holeNumber=1,shotsRevealed=0,tier=null}={}){
  if(!Number.isInteger(holeNumber)||holeNumber<1||holeNumber>count)throw Error('Invalid Ghost playback hole');
  if(!Number.isInteger(shotsRevealed)||shotsRevealed<0)throw Error('Invalid Ghost playback position');
  const hole=buildGhostRound({courseName,holes,seed,count,tier})[holeNumber-1];
  const revealed=Math.min(shotsRevealed,hole.shots.length);
  const visibleShots=hole.shots.slice(0,revealed);
  const complete=revealed===hole.shots.length;
  return {
    holeNumber,par:hole.par,score:hole.score,
    source:hole.source,coverage:hole.coverage,schematicOnly:true,
    courseParVerified:hole.courseParVerified,courseYardsVerified:hole.courseYardsVerified,
    shotsRevealed:revealed,totalShots:hole.shots.length,
    visibleShots,nextShot:complete?null:hole.shots[revealed],
    complete,canAdvance:!complete,canRewind:revealed>0,
    label:complete?'Ghost holed out':revealed===0?'Ghost on the tee':`Ghost after stroke ${revealed}`
  };
}
