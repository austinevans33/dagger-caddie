import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {foursomeMoney} from '../playtest/foursome-money-math.js';
const app=readFileSync(new URL('../playtest/index.html',import.meta.url),'utf8');
const begin=app.indexOf('function wagerMath(game){'),end=app.indexOf('\nfunction money(v)',begin);
assert.ok(begin>0&&end>begin,'live scorer function exists');
const live=runInNewContext(app.slice(begin,end)+'\nwagerMath',Object.create(null));
const game=(format,holes)=>({format,players:['A','B'],stake:5,holes});
const hole=(a,b)=>[a,b];
const same=(x)=>{const a=live(x),b=foursomeMoney(x);assert.deepEqual(JSON.parse(JSON.stringify(a)),b);return b};
test('Nassau cannot settle nine or match before their segment finishes',()=>{
 let x=game('nassau',[hole(3,5)]);
 assert.equal(same(x).score[0],0);
 assert.equal(same(x).pending.length,3);
 x=game('nassau',Array(8).fill(hole(3,5)));
 assert.equal(same(x).score[0],0);
 assert.equal(same(x).pending[0].leader,1);
});
test('front nine settles at 9, back and overall not until 18',()=>{
 const x=game('nassau',Array(9).fill(hole(3,5)));
 assert.equal(same(x).score[0],5);
 assert.equal(same(x).pending.length,2);
 const complete=game('nassau',[...Array(9).fill(hole(3,5)),...Array(9).fill(hole(5,3))]);
 assert.equal(same(complete).score[0],0);
 assert.equal(same(complete).pending.length,0);
});
test('skins carry and hole match preserve net zero across players',()=>{
 const skins=game('skins',[hole(4,4),hole(3,4)]);
 const r=same(skins);assert.equal(r.score[0],10);assert.equal(r.score[1],-10);
 assert.equal(same(game('hole',[hole(3,5)])).score[0],5);
});
test('out-of-range and fractional strokes cannot create settled money',()=>{
 const cases=[game('skins',[hole(0,3)]),game('nassau',[hole(16,4)]),game('hole',[hole(3.5,4)])];
 for(const x of cases){assert.equal(foursomeMoney(x),null);assert.equal(live(x).invalid,true)}
 assert.match(app,/const wVal=\(n\)=>n!==''&&Number\.isInteger/);
});
