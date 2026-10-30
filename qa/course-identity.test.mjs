import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCourse,normalizeTee,normalizeCourseSelection,sameCourseSelection} from '../staging-app/course-identity.js';
const course={provider:'verified-course-feed',providerCourseId:'course-18',name:'Sample Course',region:'NC'};
const tee={providerTeeId:'blue',name:'Blue',totalYards:6400};
test('course and tee retain provider provenance',()=>{
 assert.deepEqual(normalizeCourse(course),course);
 assert.deepEqual(normalizeTee(tee),tee);
 assert.equal(normalizeCourse({...course,providerCourseId:''}),null);
 assert.equal(normalizeCourse({...course,provider:'invalid provider!'}),null);
 assert.equal(normalizeTee({...tee,totalYards:0}),null);
});
test('selection is bound to an exact course, tee and hole',()=>{
 const selected={course,tee,holeNumber:7};
 assert.deepEqual(normalizeCourseSelection(selected),selected);
 assert.ok(sameCourseSelection(selected,{course:{...course},tee:{...tee},holeNumber:7}));
 assert.equal(sameCourseSelection(selected,{...selected,holeNumber:8}),false);
 assert.equal(sameCourseSelection(selected,{...selected,tee:{...tee,providerTeeId:'white'}}),false);
 assert.equal(normalizeCourseSelection({...selected,holeNumber:19}),null);
});
test('unknown provider identities cannot masquerade as verified courses',()=>{
 assert.equal(normalizeCourseSelection({course:{name:'Guess',region:'NC'},tee,holeNumber:1}),null);
});
