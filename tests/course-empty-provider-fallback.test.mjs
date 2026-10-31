import test from 'node:test';
import assert from 'node:assert/strict';
import {getActiveCourseContext} from '../playtest/active-course-context.js';
import {saveActiveRound} from '../playtest/starters-desk-session.js';
import {saveCachedCourseScorecard} from '../playtest/course-scorecard-cache.js';
const selection={course:{provider:'opengolfapi',providerCourseId:'fixture-1',name:'Fixture',region:'NC'},tee:{providerTeeId:'white',name:'White',totalYards:6300},holeNumber:1};
function store(){const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};}
const response=body=>({ok:true,json:async()=>body});
test('Empty provider response retains a previously verified tee-specific scorecard',async()=>{
 const storage=store();saveActiveRound(storage,selection,1000);
 saveCachedCourseScorecard(storage,selection,[{number:1,par:4,yards:390}],1000);
 const result=await getActiveCourseContext({storage,now:2000,fetcher:async()=>response({holes:[]})});
 assert.equal(result.state,'cached-no-provider-holes');
 assert.equal(result.holes[0].yards,390);
 assert.equal(result.livePinDistance,false);
});
test('Never fabricates hole facts for a course with no provider data or cache',async()=>{
 const storage=store();saveActiveRound(storage,selection,1000);
 const result=await getActiveCourseContext({storage,now:2000,fetcher:async()=>response({holes:[]})});
 assert.equal(result.state,'no-verified-holes');
 assert.deepEqual(result.holes,[]);
});
test('Cache from another tee cannot fill a missing tee',async()=>{
 const storage=store();saveActiveRound(storage,selection,1000);
 const other={...selection,tee:{providerTeeId:'blue',name:'Blue',totalYards:6900}};
 saveCachedCourseScorecard(storage,other,[{number:1,par:4,yards:420}],1000);
 const result=await getActiveCourseContext({storage,now:2000,fetcher:async()=>response({holes:[]})});
 assert.equal(result.state,'no-verified-holes');
});
