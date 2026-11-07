import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCourseSelection,sameCourseSelection} from '../course-identity.js';
import {normalizeCatalog,searchCatalog} from '../course-catalog.js';
const course=(id,name)=>({provider:'verified-provider',providerCourseId:id,name,region:'North Carolina'});
const tee=(id='blue')=>({providerTeeId:id,name:'Blue',totalYards:6250});
test('changing course or tees never silently matches a previous selection',()=>{
 const a={course:course('first','First Course'),tee:tee(),holeNumber:1};
 const b={...a,course:course('second','Second Course')};
 const c={...a,tee:tee('white')};
 assert.equal(sameCourseSelection(a,a),true);
 assert.equal(sameCourseSelection(a,b),false);
 assert.equal(sameCourseSelection(a,c),false);
 assert.equal(sameCourseSelection(a,{...a,holeNumber:2}),false);
});
test('invalid hole selection and incomplete provider data are rejected',()=>{
 assert.equal(normalizeCourseSelection({course:course('first','First'),tee:tee(),holeNumber:0}),null);
 assert.equal(normalizeCourseSelection({course:course('first','First'),tee:tee(),holeNumber:19}),null);
 assert.equal(normalizeCourseSelection({course:{name:'Unverified'},tee:tee(),holeNumber:1}),null);
});
test('catalog deduplicates matching provider course IDs and tee identities',()=>{
 const entries=normalizeCatalog([{course:course('first','First'),tees:[tee(),tee(),tee('white')]},{course:course('first','Duplicate'),tees:[tee()]}]);
 assert.equal(entries.length,1);assert.equal(entries[0].tees.length,2);
});
test('catalog search requires a real query and never invents missing courses',()=>{
 const entries=normalizeCatalog([{course:course('first','First Course'),tees:[tee()]}]);
 assert.deepEqual(searchCatalog(entries,'Ki'),[]);
 assert.equal(searchCatalog(entries,'first').length,1);
 assert.deepEqual(searchCatalog(entries,'x'),[]);
});
