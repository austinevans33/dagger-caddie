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

test('Money Room retains host-device QR and automatic guest join',()=>{
 const room=source('money-room.js');
 const qr=source('invitation-qr.js');
 assert.match(room,/drawInvitationQr/);
 assert.match(room,/incomingInvitation&&!roomId/);
 assert.match(room,/joinOnce\(\)/);
 assert.match(qr,/drawInvitationQr/);
 assert.match(qr,/canvas\.getContext\('2d'\)/);
});
test('playtest still includes its Money Room and does not substitute trial for it',()=>{
 const html=source('playtest/index.html');
 assert.match(html,/money-room\.js/);
 assert.match(html,/ai-chat\.js/);
});

test('yardage book rejects previous course or tee environment',()=>{const book=source('yardage-book-ui.js');assert.match(book,/const matchSelection=/);assert.match(book,/if\(env&&!matchSelection\)env=null/);});

test('course refresh rejects stale selection and provides a manual retry',()=>{const src=source('yardage-book-ui.js');assert.match(src,/reloadCurrentCourse/);assert.match(src,/dcc-book-refresh/);assert.match(src,/thisToken!==token/);});

test('Ghost matchup can refresh from saved scorecard without writing scores',()=>{const book=source('yardage-book-ui.js');assert.match(book,/dcc-book-refresh-match/);assert.match(book,/refreshScores\.addEventListener\('click',\(\)=>draw\(\)\)/);assert.match(book,/readSoloCard\(storage\)/);});

test('the Yardage Book renders Ghost shots from the exact Ledger snapshot',()=>{const book=source('yardage-book-ui.js');assert.match(book,/const ghost=standing\.round\[hole-1\]/);assert.doesNotMatch(book,/const ghost=buildGhostRound\(/);});
