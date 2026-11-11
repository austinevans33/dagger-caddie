import test from 'node:test';
import assert from 'node:assert/strict';
import {renderSharedHoleSketch} from '../playtest/shared-hole-sketch.js';
import {pencilBookAnnotations} from '../playtest/pencil-book-annotations.js';
const shape=(type,x,y)=>({type,points:[[x-3,y-3],[x+3,y-3],[x+3,y+3],[x-3,y+3]]});
function mockSvg(){
 const doc={createElementNS(_ns,name){
  return {name,attrs:{},children:[],setAttribute(k,v){this.attrs[k]=String(v);},
   append(...nodes){this.children.push(...nodes)},set textContent(v){this.text=String(v)}}}};
 return {ownerDocument:doc,attrs:{},children:[],setAttribute(k,v){this.attrs[k]=String(v)},
  replaceChildren(...nodes){this.children=[...nodes]},append(...nodes){this.children.push(...nodes)}};
}
test('one renderer gives Yardage and Ghost identical provider geometry',()=>{
 const features=[shape('tee',150,190),shape('green',150,25),shape('fairway',150,100),shape('bunker',110,120)];
 const notes=pencilBookAnnotations(features);
 const yardage=mockSvg(),ghost=mockSvg();
 const a=renderSharedHoleSketch(yardage,features,notes),b=renderSharedHoleSketch(ghost,features,notes);
 const geometry=svg=>svg.children.filter(node=>node.name!=='defs').map(node=>({name:node.name,attrs:{...node.attrs,fill:String(node.attrs.fill||'').replace(/dcc-pencil-\\d+-/g,'dcc-pencil-')},text:node.text}));
 assert.deepEqual(geometry(yardage),geometry(ghost));
 assert.equal(a.length,4);assert.equal(b.length,4);
 assert.equal(yardage.children.filter(x=>x.name==='path').length,1);
 assert.equal(yardage.children.filter(x=>x.name==='polygon').length,4);
 assert.equal(yardage.children.filter(x=>x.name==='text'&&x.text==='BKR').length,1);
});
test('incomplete geometry never gains a fictional route',()=>{
 const partial=[shape('green',150,25),shape('water',110,120)];
 const svg=mockSvg();
 renderSharedHoleSketch(svg,partial,pencilBookAnnotations(partial));
 assert.equal(svg.children.filter(x=>x.name==='path').length,0);
 assert.equal(svg.children.filter(x=>x.name==='polygon').length,2);
});

test('portrait yardage map scales across courses without altering Ghost dimensions',()=>{
 const features=[shape('tee',150,390),shape('green',150,40),shape('fairway',150,210),shape('water',110,320)];
 const map=mockSvg(),ghost=mockSvg();
 const notes=pencilBookAnnotations(features);
 renderSharedHoleSketch(map,features,notes,{height:440});
 renderSharedHoleSketch(ghost,features,notes);
 assert.equal(map.attrs.viewBox,'0 0 300 440');
 assert.equal(ghost.attrs.viewBox,'0 0 300 220');
 assert.equal(map.children.filter(x=>x.name==='polygon').length,4);
 assert.equal(map.children.filter(x=>x.name==='text'&&x.text==='WATER').length,1);
 assert.equal(map.children.filter(x=>x.name==='path').length,1);
});

test('greenside hazard text moves clear of the green label on both page sizes',()=>{
 const route={tee:[145,180],green:[145,35]};
 for(const height of [220,440]){
  const svg=mockSvg();
  renderSharedHoleSketch(svg,[],{route,labels:[{point:[147,35],type:'bunker'}]},{height});
  const green=svg.children.find(node=>node.text==='GREEN');
  const bunker=svg.children.find(node=>node.text==='BKR');
  assert.equal(green.attrs['paint-order'],'stroke');
  assert.ok(Math.abs(Number(green.attrs.y)-Number(bunker.attrs.y))>=16);
  assert.ok(Number(bunker.attrs.y)<height);
 }
});
