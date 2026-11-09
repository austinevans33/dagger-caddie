import test from 'node:test';
import assert from 'node:assert/strict';
import {searchStarterDesk} from '../playtest/starter-desk-search.js';
const courses=[
 {provider:'dagger-founder',providerCourseId:'kings-grant',name:"King's Grant",region:'Fayetteville, NC'},
 {provider:'dagger-founder',providerCourseId:'quail',name:'Quail Ridge',region:'Sanford, NC'},
 {provider:'dagger-founder',providerCourseId:'kings-grant',name:"King's Grant",region:'Fayetteville, NC'},
 {provider:'dagger-founder',providerCourseId:'quail-other',name:'Quail Ridge East',region:'Elsewhere'}
];
test('requires a meaningful query and does not mutate input',()=>{
 assert.deepEqual(searchStarterDesk(courses,'q'),[]);
 assert.deepEqual(searchStarterDesk(courses,''),[]);
 assert.equal(courses.length,4);
});
test('matches course and region, deduplicates identity',()=>{
 assert.deepEqual(searchStarterDesk(courses,'fayetteville').map(x=>x.providerCourseId),['kings-grant']);
 assert.deepEqual(searchStarterDesk(courses,'kings grant').map(x=>x.providerCourseId),['kings-grant']);
 assert.deepEqual(searchStarterDesk(courses,'quail').map(x=>x.providerCourseId),['quail','quail-other']);
});
test('stable relevance, favorites and limit',()=>{
 assert.equal(searchStarterDesk(courses,'quail',{favoriteIds:['quail-other']})[0].providerCourseId,'quail-other');
 assert.equal(searchStarterDesk(courses,'quail',{limit:1}).length,1);
 assert.deepEqual(searchStarterDesk(null,'quail'),[]);
});
