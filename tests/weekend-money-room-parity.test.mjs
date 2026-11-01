import test from 'node:test';
import assert from 'node:assert/strict';
import {previewWeekendFromRoom} from '../weekend-money-room-preview.js';
// Independent reference for the two existing Money Room formats.
// Stakes are cents in the new engine and dollars in the legacy room.
function legacyTwoPlayer(holes,format,cents){
 let balance=0,carry=1;
 for(let h=1;h<=18;h++){
  const pair=holes[h];
  if(!pair)continue;
  const winner=pair[0]===pair[1]?-1:pair[0]<pair[1]?0:1;
  if(format==='hole'){if(winner>=0)balance+=(winner===0?1:-1)*cents;}
  else if(winner<0)carry++;
  else{balance+=(winner===0?1:-1)*cents*carry;carry=1;}
 }
 return balance;
}
const games=[{id:'hole',format:'hole',stakeCents:500},{id:'skins',format:'skins',stakeCents:200}];
test('18-hole reference parity for both supported formats',()=>{
 const patterns=[
  Array.from({length:18},()=>[4,5]),
  Array.from({length:18},()=>[4,4]),
  Array.from({length:18},(_,i)=>i%3===0?[4,4]:i%2===0?[5,4]:[4,5])
 ];
 for(const scores of patterns){
  const holes=Object.fromEntries(scores.map((s,i)=>[i+1,s]));
  const result=previewWeekendFromRoom({room:{players:['A','B'],holes,archived:true},games});
  assert.equal(result.readyForFinal,true);
  for(const game of games){
   const actual=result.results.find(r=>r.id===game.id).netCents[0];
   assert.equal(actual,legacyTwoPlayer(holes,game.format,game.stakeCents));
  }
 }
});
test('a score correction produces reference-parity replay',()=>{
 const holes=Object.fromEntries(Array.from({length:18},(_,i)=>[i+1,[4,5]]));
 holes[4]=[5,4];holes[7]=[4,4];holes[8]=[5,4];
 const r=previewWeekendFromRoom({room:{players:['A','B'],holes,archived:false},games});
 for(const game of games)assert.equal(r.results.find(x=>x.id===game.id).netCents[0],legacyTwoPlayer(holes,game.format,game.stakeCents));
 assert.equal(r.readyForFinal,false);
});
