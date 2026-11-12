import test from 'node:test';
import assert from 'node:assert/strict';
import {shotgunOrder,normalizeHolePars,recordCaptainScore,teamStanding,leaderboard} from '../scripts/tournament-scoring.mjs';
const pars=normalizeHolePars(Array.from({length:18},(_,i)=>({number:i+1,par:4})));
const team=(id,startHole=4)=>({id,name:id,captainId:'captain-'+id,startHole,revision:0,scores:{}});
test('18-hole shotgun start hole 4 ends 1,2,3 and has no repeated holes',()=>{
 const o=shotgunOrder(4);assert.deepEqual(o,[4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,1,2,3]);
 assert.equal(new Set(o).size,18);
});
test('9-hole native course wraps from 7 to 1',()=>assert.deepEqual(shotgunOrder(7,9),[7,8,9,1,2,3,4,5,6]));
test('reject invalid shotgun holes',()=>{assert.throws(()=>shotgunOrder(10,9));assert.throws(()=>shotgunOrder(0));});
test('only assigned captain can submit and only the actual next hole',()=>{
 let t=team('A');
 assert.equal(recordCaptainScore({team:t,actorId:'spectator',hole:4,strokes:3,expectedRevision:0}).reason,'not-captain');
 assert.equal(recordCaptainScore({team:t,actorId:'captain-A',hole:1,strokes:3,expectedRevision:0}).reason,'out-of-order');
 const a=recordCaptainScore({team:t,actorId:'captain-A',hole:4,strokes:3,expectedRevision:0});
 assert.equal(a.ok,true);t=a.team;assert.equal(t.revision,1);
 assert.equal(recordCaptainScore({team:t,actorId:'captain-A',hole:4,strokes:3,expectedRevision:1}).reason,'already-scored');
 assert.equal(recordCaptainScore({team:t,actorId:'captain-A',hole:5,strokes:3,expectedRevision:0}).reason,'stale-revision');
 assert.equal(recordCaptainScore({team:t,actorId:'captain-A',hole:5,strokes:0,expectedRevision:1}).reason,'invalid-score');
 assert.equal(recordCaptainScore({team:{...t,locked:true},actorId:'captain-A',hole:5,strokes:3,expectedRevision:1}).reason,'locked');
});
test('leaderboard uses course hole par, supports shotgun team and ties',()=>{
 const a={...team('A',4),scores:{4:3,5:4}};
 const c={...team('C',12),scores:{12:3,13:4}};
 const b={...team('B',1),scores:{1:4}};
 const rows=leaderboard([b,c,a],pars);
 assert.deepEqual(rows.map(r=>r.id),['A','C','B']);
 assert.deepEqual(rows.map(r=>r.rank),[1,1,3]);
 assert.equal(rows[0].thru,5);assert.equal(rows[1].thru,13);assert.equal(rows[2].nextHole,2);
});
test('never pretend to know score relative to par when a played hole is not verified',()=>{
 const partial=normalizeHolePars([{number:4,par:4}]);
 const standing=teamStanding({...team('A'),scores:{4:4,5:3}},partial);
 assert.equal(standing.relative,null);
 assert.equal(standing.played,2);
 assert.equal(leaderboard([{...team('A'),scores:{4:4,5:3}}],partial)[0].rank,null);
});
test('36 teams can be ranked without mutating inputs or another team scores',()=>{
 const teams=Array.from({length:36},(_,i)=>({...team('Team '+String(i+1).padStart(2,'0'),i%18+1)}));
 const before=JSON.stringify(teams);
 const rows=leaderboard(teams,pars);
 assert.equal(rows.length,36);assert.equal(new Set(rows.map(r=>r.id)).size,36);assert.equal(JSON.stringify(teams),before);
});
