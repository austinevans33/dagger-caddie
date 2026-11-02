import test from 'node:test';import assert from 'node:assert/strict';import {makeRoundReceipt} from '../round-receipt.js';
test('balanced group recap shows correct winner and full receipt',()=>{
 const s=makeRoundReceipt({course:'Pines',holes:18,game:'Nassau',players:[{name:'Keith',net:15},{name:'Buddy',net:-15}],highlight:'Three putts from four feet'});
 assert.match(s,/Keith: \+\$15\.00/);assert.match(s,/Buddy: -\$15\.00/);assert.match(s,/Top earner: Keith/);assert.match(s,/Three putts/);
});
test('unbalanced totals and missing players cannot generate misleading receipt',()=>{
 assert.throws(()=>makeRoundReceipt({players:[{name:'A',net:10},{name:'B',net:-9}]}),/add up/);
 assert.throws(()=>makeRoundReceipt({players:[{name:'A',net:10}]}),/2 to 4/);
});
