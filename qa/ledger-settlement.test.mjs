import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {settleLedgerWager, installLedgerSettlement} from '../staging-app/ledger-settlement.js';
const html=fs.readFileSync(new URL('../staging-app/index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('function wagerMath(game){'),html.indexOf('function money(v){',html.indexOf('function wagerMath(game){')));
const context=vm.createContext({});vm.runInContext(source,context);
const wager=(holes,format='nassau')=>({players:['Host','Guest'],stake:5,holes,format});
const calc=holes=>settleLedgerWager(wager(holes),context.wagerMath);
const win=()=>[4,5],loss=()=>[5,4],tie=()=>[4,4];
test('partial round does not award front and overall stakes',()=>{
 assert.deepEqual(Array.from(context.wagerMath(wager([win()])).score),[10,-10]);
 assert.deepEqual(calc([win()]).score,[0,0]);
});
test('front nine settles once; unfinished back and overall remain unsettled',()=>assert.deepEqual(calc(Array.from({length:10},win)).score,[5,-5]));
test('complete sweep settles all three stakes',()=>assert.deepEqual(calc(Array.from({length:18},win)).score,[15,-15]));
test('opposite nine results and overall tie net to zero',()=>assert.deepEqual(calc([...Array.from({length:9},win),...Array.from({length:9},loss)]).score,[0,0]));
test('tied segments do not pay',()=>assert.deepEqual(calc(Array.from({length:18},tie)).score,[0,0]));
test('missing and invalid scores cannot settle a segment',()=>{
 for(const value of [null,undefined,0,21,'4',NaN]){
 const holes=Array.from({length:9},win);holes[4]=[value,5];assert.deepEqual(calc(holes).score,[0,0]);
 }
});
test('other game formats preserve original implementation',()=>{
 for(const format of ['skins','hole']){const game=wager([win(),tie(),loss()],format);assert.equal(JSON.stringify(settleLedgerWager(game,context.wagerMath)),JSON.stringify(context.wagerMath(game)));}
});
test('adapter replaces the existing global used by Ledger callers',()=>{
 const target={wagerMath:context.wagerMath};assert.equal(installLedgerSettlement(target),true);assert.deepEqual(target.wagerMath(wager([win()])).score,[0,0]);
});

test('installation refreshes existing saved rows after replacing calculation',()=>{
 let displayed;const target={wagerMath:context.wagerMath,renderFoursome(){displayed=this.wagerMath(wager([win()])).score[0];}};
 installLedgerSettlement(target);assert.equal(displayed,0);
});
