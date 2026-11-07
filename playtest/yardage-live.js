// Yardage Book live view model: exact active Starter's Desk course and tee.
// Never treat tee yardage as live pin distance. Never invent missing holes.
import {readActiveRound} from './starters-desk-session.js';
import {getActiveCourseContext} from './active-course-context.js';
import {scorecardCoverage} from './course-scorecard-coverage.js';
import {yardageBookPage} from '../yardage-book.js';
export function resolveYardageState({active,context,holeNumber=1}={}){
 const selection=active?.selection||context?.selection||null;
 const holes=Array.isArray(context?.holes)?context.holes:[];
 const page=yardageBookPage({holes,holeNumber,courseName:selection?.course?.name||'No course selected',teeName:selection?.tee?.name||'No tees selected'});
 const coverage=scorecardCoverage(holes);
 const source=context?.source==='bayonet-club-scorecard'?'Bayonet club scorecard · cross-checked hole yardages':context?.source==='kings-grant-club-scorecard'?'King’s Grant club scorecard · selected tee':context?.source==='quail-ridge-sanford-black-card'?'Quail Ridge Sanford Black · USGA total cross-check':context?.source==='quail-ridge-sanford-published-hole-card'?'Quail Ridge Sanford published hole card · totals checked':holes.length?['offline-cached','cached-no-provider-holes'].includes(context?.state)?'Previously verified scorecard · offline cache':'Provider scorecard · selected tee':'No verified hole data';
 return {page,coverage,source,selection,holes,hasCourse:!!selection,livePinDistance:false,state:context?.state||'not-selected'};
}
export async function loadYardageState({storage,fetcher,signal,holeNumber=1}={}){
 const active=readActiveRound(storage);
 if(!active)return resolveYardageState({active:null,context:null,holeNumber});
 const context=await getActiveCourseContext({storage,fetcher,signal});
 return resolveYardageState({active,context,holeNumber});
}
