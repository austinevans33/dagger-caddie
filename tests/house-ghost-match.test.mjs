import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreHouseGhost} from '../house-ghost-match.js';
test('ghost hole results and score status are ordered',()=>{
 const x=scoreHouseGhost([{hole:1,player:4,ghost:5},{hole:2,player:5,ghost:4}],9);
 assert.equal(x.status,'active');assert.equal(x.lead,0);
 assert.deepEqual(x.history.map(h=>h.result),['golfer','ghost']);
});
test('early clinch ends match and rejects extra holes',()=>{
 const holes=Array.from({length:5},(_,i)=>({hole:i+1,player:4,ghost:5}));
 const x=scoreHouseGhost(holes,9);assert.equal(x.status,'golfer-wins');
 assert.equal(x.history[4].clinched,true);
 assert.throws(()=>scoreHouseGhost([...holes,{hole:6,player:4,ghost:5}],9),/already decided/);
});
test('not a fictional shot-by-shot simulator',()=>{
 const x=scoreHouseGhost([{player:4,ghost:4}],18);
 assert.equal(x.holesPlayed,1);assert.equal(x.status,'active');
 assert.equal(Object.hasOwn(x,'winnings'),false);
});
