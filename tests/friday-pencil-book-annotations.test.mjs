import test from 'node:test';
import assert from 'node:assert/strict';
import {pencilBookAnnotations} from '../playtest/pencil-book-annotations.js';
const shape=(type,x,y)=>({type,points:[[x-3,y-3],[x+3,y-3],[x+3,y+3],[x-3,y+3]]});
test('mapped tee and green support pencil route and left/right trouble positions',()=>{
 const data=pencilBookAnnotations([shape('tee',150,190),shape('green',150,25),shape('fairway',150,105),shape('bunker',115,115),shape('water',185,115)]);
 assert.ok(data.route);
 assert.deepEqual(data.labels.map(x=>[x.type,x.side,x.stage]),[['bunker','left','landing corridor'],['water','right','landing corridor']]);
 assert.equal(data.mappedFairway,true);
});
test('no invented course line when tee or green missing or ambiguous',()=>{
 const onlyGreen=pencilBookAnnotations([shape('green',140,30),shape('bunker',100,90)]);
 assert.equal(onlyGreen.route,null);
 assert.equal(onlyGreen.labels[0].side,'position unconfirmed');
 const doubled=pencilBookAnnotations([shape('tee',140,180),shape('tee',150,180),shape('green',140,30)]);
 assert.equal(doubled.route,null);
});
test('missing polygons and malformed points do not create hazard labels',()=>{
 const data=pencilBookAnnotations([{type:'water',points:[[1,2]]},null,shape('rough',50,50)]);
 assert.equal(data.route,null);
 assert.deepEqual(data.labels,[]);
 assert.equal(data.mappedFairway,false);
});
