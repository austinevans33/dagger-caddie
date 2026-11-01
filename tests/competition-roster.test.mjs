import test from 'node:test';
import assert from 'node:assert/strict';
import {DCC_GAME_ROSTER,compatibleAutoScoreGames} from '../competition-roster.js';
test('preserve existing favorites and House Ghost',()=>{
 for(const id of ['hole','skins','nassau','ghost','bbb','wolf','vegas','hammer','round-robin','snake','stableford'])
 assert(DCC_GAME_ROSTER.some(g=>g.id===id));
});
test('do not claim event-scored games can be derived from strokes alone',()=>{
 const ids=compatibleAutoScoreGames().map(g=>g.id);
 assert.deepEqual(ids,['hole','skins','nassau']);
 for(const id of ['bbb','wolf','hammer','snake'])assert(!ids.includes(id));
});
test('new ideas are clearly marked unimplemented',()=>assert(DCC_GAME_ROSTER.some(g=>g.state==='idea-only')));
