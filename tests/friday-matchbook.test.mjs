import test from 'node:test';
import assert from 'node:assert/strict';
import {soloMatchbook,saveMatchbookRound,pastRoundTarget,ghostMatchbook,matchbookText} from '../playtest/matchbook.js';
import {recordedDepthNotes} from '../playtest/shot-record-context.js';

const selection={course:{provider:'test',providerCourseId:'links',name:'Dagger Links'},tee:{providerTeeId:'white',name:'White',totalYards:6200}};
const active={selection,selectedAt:10};
const card={identity:'links|white|10',length:9,nineStart:10,hole:18,scores:[...Array(9).fill(null),3,...Array(8).fill(4)]};
const facts={holes:Array.from({length:18},(_,i)=>({number:i+1,par:4}))};

test('Matchbook records only a completed selected nine and Ghost of You uses the same tees and holes',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 assert.equal(soloMatchbook(active,{...card,scores:Array(18).fill(null)},facts),null);
 assert.equal(soloMatchbook({...active,selectedAt:11},card,facts),null);
 const matchbook=soloMatchbook(active,card,facts);
 assert.equal(matchbook.headline,'35 strokes · -1 to par');
 assert.equal(matchbook.hole,10);
 assert.match(matchbookText(matchbook),/Dagger Links · White tees/);
 saveMatchbookRound(storage,matchbook);
 saveMatchbookRound(storage,matchbook);
 assert.equal(JSON.parse(data.values().next().value).length,1);
 assert.equal(pastRoundTarget(storage,active,card),null);
 const next={...card,identity:'links|white|11',hole:10,scores:[...Array(9).fill(null),4,...Array(8).fill(null)]};
 assert.deepEqual(pastRoundTarget(storage,{...active,selectedAt:11},next),{holeStrokes:3,difference:1,compared:1});
 assert.equal(pastRoundTarget(storage,{selection:{...selection,tee:{...selection.tee,totalYards:6100}}},next),null);
 assert.equal(pastRoundTarget(storage,active,{...next,nineStart:1}),null);
});

test('A Ghost recap names the hole that put the eventual winner ahead',()=>{
 const holes=[[4,4],[5,4],[4,5],[3,4],[4,4],[4,4],[4,4],[4,4],[4,4]].map(([player,ghost])=>({player,ghost}));
 assert.equal(ghostMatchbook({holes:holes.slice(0,4),holesPlanned:9}),null);
 const result=ghostMatchbook({holes,holesPlanned:9,opponent:'The Undertaker',selection});
 assert.equal(result.headline,'You won · 1 up');
 assert.equal(result.hole,4);
 assert.match(result.highlight,/Turning point · No. 4/);
 assert.equal(ghostMatchbook({holes:holes.map(h=>({...h,ghost:h.player})),holesPlanned:9}).headline,'Match halved');
});

test('Caddy depth evidence counts comparable confirmed approaches and excludes other shot contexts',()=>{
 const shot={club:'7 Iron',yards:160,shotMode:'approach'};
 const receipts=[
  {...shot,receiptId:'1',result:'Long'},{...shot,receiptId:'1',result:'Short'},
  {...shot,receiptId:'2',result:'Pin high'},{...shot,receiptId:'3',result:'Short'},
  {...shot,receiptId:'4',shotMode:'tee',result:'Long'},
  {...shot,receiptId:'5',yards:200,result:'Long'},
  {...shot,result:'Long'}
 ];
 assert.deepEqual(recordedDepthNotes(receipts,['7 Iron'],170),[
  '7 Iron (3 golfer-reported approaches within 15 yd of target: 2 short, 1 pin high, 0 long)'
 ]);
 assert.deepEqual(recordedDepthNotes(receipts,['7 Iron'],220),[]);
});
