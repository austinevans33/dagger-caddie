// Read-only bridge between round selection and the verified Yardage Book.
// Does not modify scores, wagers, persisted rounds, Firebase, or browser history.
import {normalizeCourseSelection} from './course-identity.js';
import {selectedYardagePage} from './yardage-selection.js';

export function roundYardageTransition({selection,record,direction='current'}={}) {
 const current=selection && typeof selection==='object' ? normalizeCourseSelection(selection) : null;
 if(!current) return Object.freeze({ok:false,reason:'invalid-selection',selection:null,page:null});
 if(!['current','previous','next'].includes(direction)) return Object.freeze({ok:false,reason:'invalid-direction',selection:current,page:null});
 const nextNumber=current.holeNumber+(direction==='next'?1:direction==='previous'?-1:0);
 if(nextNumber<1||nextNumber>18) return Object.freeze({ok:false,reason:'round-boundary',selection:current,page:null});
 const next=normalizeCourseSelection({course:current.course,tee:current.tee,holeNumber:nextNumber});
 const page=selectedYardagePage({selection:next,record});
 return Object.freeze({ok:true,reason:null,selection:next,page});
}
export function canReuseYardageRecord(selection,record) {
 return !!selectedYardagePage({selection,record})?.selectionMatched;
}
