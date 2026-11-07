import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('playable app and tested engine use same BBB settlement code',()=>{
 const settlement=p=>file(p).split('export function installBingoMoney')[0];
 assert.equal(settlement('bbb-money.js'),settlement('playtest/bbb-money.js'));
});
test('playable app and tested engine use same Nassau settlement code',()=>{
 assert.equal(file('ledger-settlement.js'),file('playtest/ledger-settlement.js'));
});
test('playable app and tested QR/recovery logic stay identical',()=>{
 assert.equal(file('invitation-qr.js'),file('playtest/invitation-qr.js'));
 assert.equal(file('room-recovery.js'),file('playtest/room-recovery.js'));
});
