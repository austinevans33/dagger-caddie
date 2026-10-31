import test from 'node:test';import assert from 'node:assert/strict';
import {bingoPayout} from '../../playtest/bbb-money.js';
test('two-player awards transfer stake per point',()=>assert.deepEqual(bingoPayout(['A','B'],[[0,0,1]],1.25).score,[1.25,-1.25]));
test('four-player winner receives stake from each opponent',()=>assert.deepEqual(bingoPayout(['A','B','C','D'],[[0,null,null]],2).score,[6,-2,-2,-2]));
test('ties pay nothing and points-only stake pays nothing',()=>{assert.deepEqual(bingoPayout(['A','B'],[[null,null,null]],5).score,[0,0]);assert.deepEqual(bingoPayout(['A','B'],[[0,0,0]],0).score,[0,0]);});
test('fractional cents and invalid awards rejected',()=>{for(const n of [-1,Infinity,NaN,0.001,10001])assert.throws(()=>bingoPayout(['A','B'],[],n));for(const h of [[2,null,null],[-1,0,1],['0',0,1],[0,1]])assert.throws(()=>bingoPayout(['A','B'],[h],1));});
test('integer cent accounting stays zero sum for all supported group sizes',()=>{for(const n of [2,3,4]){const players=Array.from({length:n},(_,i)=>String(i));const holes=Array.from({length:18},(_,i)=>[i%n,(i+1)%n,null]);const x=bingoPayout(players,holes,0.1);assert.equal(x.score.reduce((sum,v)=>sum+Math.round(v*100),0),0);assert.equal(x.points.reduce((a,b)=>a+b),36);}});
