import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('playable app and tested engine use same BBB settlement code',()=>{
 assert.equal(file('bbb-money.js'),file('playtest/bbb-money.js'));
});
test('playable app and tested engine use same Nassau settlement code',()=>{
 assert.equal(file('ledger-settlement.js'),file('playtest/ledger-settlement.js'));
});
test('playable app and tested QR/recovery logic stay identical',()=>{
 assert.equal(file('invitation-qr.js'),file('playtest/invitation-qr.js'));
 assert.equal(file('room-recovery.js'),file('playtest/room-recovery.js'));
});
