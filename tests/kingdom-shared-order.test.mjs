import test from 'node:test';
import assert from 'node:assert/strict';
import {moneyRoomOrder,computeRoomSettlement} from '../app/61f9e9de0a/room-order-contract.js';
import {invitationFrom} from '../app/61f9e9de0a/room-session.js';
import {rememberRoom,readRoomBookmark} from '../app/61f9e9de0a/room-recovery.js';

const legacy='a'.repeat(32), versioned='r2-'+legacy, code='b'.repeat(16);
const rotated={playOrder:{version:2,startHole:18}};

test('versioned room IDs retain entropy and cannot be parsed by the legacy clients',()=>{
 assert.equal(/^[0-9a-f]{32}$/.test(versioned),false);
 assert.deepEqual(invitationFrom(versioned+':'+code),{id:versioned,code});
 assert.deepEqual(invitationFrom('https://test.invalid/?room='+versioned+'&invite='+code),{id:versioned,code});
 assert.deepEqual(invitationFrom(legacy+':'+code),{id:legacy,code});
 assert.equal(invitationFrom('r3-'+legacy+':'+code),null);
 assert.equal(moneyRoomOrder(legacy,rotated),null);
 assert.equal(moneyRoomOrder(versioned,{}),null);
 assert.equal(moneyRoomOrder(versioned,{playOrder:{version:2,startHole:19}}),null);
 const store=new Map();
 const storage={getItem:key=>store.get(key),setItem:(key,value)=>store.set(key,value)};
 assert(rememberRoom(storage,{uid:'host',id:versioned,invite:code,name:'Host'}));
 assert.equal(readRoomBookmark(storage,'host').id,versioned);
 assert.equal(readRoomBookmark(storage,'guest'),null);
});

test('shotgun Nassau pays only completed segments in played order across 18 to 1',()=>{
 const game={...rotated,players:['Host','Guest'],format:'nassau',stake:1,holes:{}};
 const order=moneyRoomOrder(versioned,game);
 assert.deepEqual(order.slice(0,3),[18,1,2]);
 for(const hole of order.slice(0,8))game.holes[hole]=[4,5];
 assert.deepEqual(computeRoomSettlement(game,order).totals,[0,0]);
 game.holes[order[8]]=[4,5];
 const first=computeRoomSettlement(game,order);
 assert.deepEqual(first.totals,[1,-1]);
 assert.equal(first.ledger[8].hole,8);
 assert.match(first.ledger[8].event,/segment settled/);
 for(const hole of order.slice(9))game.holes[hole]=[4,5];
 assert.deepEqual(computeRoomSettlement(game,order).totals,[3,-3]);
 delete game.holes[18];
 assert.deepEqual(computeRoomSettlement(game,order).totals,[1,-1]);
});

test('a missing earlier physical hole blocks carried skins rather than awarding a later one',()=>{
 const game={...rotated,players:['Host','Guest'],format:'skins',stake:1,holes:{1:[4,5]}};
 const order=moneyRoomOrder(versioned,game);
 assert.equal(computeRoomSettlement(game,order).skinsPending,true);
 assert.deepEqual(computeRoomSettlement(game,order).totals,[0,0]);
 game.holes[18]=[4,4];
 assert.deepEqual(computeRoomSettlement(game,order).totals,[2,-2]);
});
