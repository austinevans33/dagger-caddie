// Strict adapter between an explicitly selected course/tee and verified hole records.
// No network calls, fallback distances, saved-round mutations, or invented provenance.
import {normalizeCourseSelection} from './course-identity.js';
import {yardageBookPage} from './yardage-book.js';

export function selectedYardagePage({selection,record}={}) {
 const selected=normalizeCourseSelection(selection);
 if(!selected) return null;
 const base={courseName:selected.course.name,teeName:selected.tee.name,holeNumber:selected.holeNumber};
 const verified=record && record.verified===true &&
   record.provider===selected.course.provider &&
   record.providerCourseId===selected.course.providerCourseId &&
   record.providerTeeId===selected.tee.providerTeeId &&
   Array.isArray(record.holes);
 const page=yardageBookPage({...base,holes:verified?record.holes:[]});
 return Object.freeze({...page,courseId:selected.course.providerCourseId,
   teeId:selected.tee.providerTeeId,selectionMatched:!!verified,
   source:verified?'verified-provider-record':'unverified-selection'});
}
