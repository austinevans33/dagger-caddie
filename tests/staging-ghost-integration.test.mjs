import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('playtest loads the shared Yardage Book and Ghost Ledger components',()=>{
 const entry=source('playtest/ai-chat.js');
 assert.match(entry,/import \{mountYardageBook\} from '\.\.\/yardage-book-ui\.js'/);
 assert.match(entry,/import \{mountWeekendMatch\} from '\.\.\/weekend-match-ui\.js'/);
 assert.match(entry,/mountYardageBook\(\)/);
 assert.match(entry,/mountWeekendMatch\(\)/);
});
test('Yardage Book provides visible exit and wired shot navigation',()=>{
 const book=source('yardage-book-ui.js');
 assert.match(book,/Back to Round/);
 assert.match(book,/backToRound\.addEventListener\('click',\(\)=>dlg\.close\(\)\)/);
 assert.match(book,/dcc-ghost-prev/);
 assert.match(book,/dcc-ghost-next/);
 assert.match(book,/ghostStep=1;draw\(\)/);
});
test('Weekend Ledger consumes canonical Ghost snapshot',()=>{
 const ledger=source('weekend-match-ui.js');
 assert.match(ledger,/import \{ghostLedgerSnapshot\}/);
 assert.match(ledger,/ghostLedgerSnapshot\(/);
});
