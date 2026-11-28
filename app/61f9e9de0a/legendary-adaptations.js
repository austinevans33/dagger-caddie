import {soloPlayOrder} from './solo-scorecard.js';
import {readCourseScorecard} from './active-course-context.js';

const BIRKDALE='https://thejourney.theopen.com/2017';

// Targets are Dagger challenges for the golfer's selected tee. The historical
// fact always names the original venue and stays separate from the adaptation.
export function legendaryAdaptation(storage,selection,card,hole){
 const order=soloPlayOrder(card,selection.course.holeCount??18);
 const previousHole=order[order.indexOf(hole)-1];
 if(previousHole===undefined)return null;
 const holes=readCourseScorecard(storage,selection)?.holes;
 const current=holes?.find(row=>row.number===hole);
 const previous=holes?.find(row=>row.number===previousHole);
 if(!current||!previous)return null;
 const lastScore=card.scores[previousHole-1];
 if(!Number.isInteger(lastScore)||lastScore<=previous.par)return null;
 if(current.par===3)return {
  fact:'At Royal Birkdale in the 2017 Open, Jordan Spieth followed a bogey at No. 13 with a birdie at No. 14.',
  challenge:'Answer your last hole with a par or better here.',
  targetStrokes:current.par,sourceUrl:BIRKDALE
 };
 if(current.par===5)return {
  fact:'Jordan Spieth eagled No. 15 in the final round of the 2017 Open at Royal Birkdale.',
  challenge:'Use this par 5 to bounce back with a birdie or better.',
  targetStrokes:current.par-1,sourceUrl:BIRKDALE
 };
 return null;
}
