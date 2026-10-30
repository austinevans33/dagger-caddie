import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCatalog,searchCatalog} from '../staging-app/course-catalog.js';
const course={provider:'verified-feed',providerCourseId:'abc',name:'Example Country Club',region:'North Carolina'};
const blue={providerTeeId:'blue',name:'Blue',totalYards:6350};
test('only complete provider-grounded catalog entries survive',()=>{
 const rows=normalizeCatalog([{course,tees:[blue,blue,{providerTeeId:'fake',name:'Bad',totalYards:-1}]},{course,tees:[blue]},{course:{name:'No provenance'},tees:[blue]}]);
 assert.equal(rows.length,1);assert.deepEqual(rows[0].tees,[blue]);
});
test('course searches match names and regions without inventing results',()=>{
 const data=[{course,tees:[blue]}];
 assert.equal(searchCatalog(data,'example').length,1);
 assert.equal(searchCatalog(data,'NORTH CAROLINA').length,1);
 assert.deepEqual(searchCatalog(data,'nonexistent'),[]);
 assert.deepEqual(searchCatalog(data,'e'),[]);
});
test('empty or invalid catalog data cannot create selections',()=>{
 assert.deepEqual(normalizeCatalog(null),[]);
 assert.deepEqual(normalizeCatalog([{course,tees:[]},{course,tees:[{name:'Blue'}]}]),[]);
});
