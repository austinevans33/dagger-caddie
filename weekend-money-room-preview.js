import {twoPlayerAction} from './two-player-action.js';
// Read-only bridge: existing authenticated Money Room snapshot -> extra game balances.
// No Firestore writes or claim that this snapshot grants membership.
export function previewWeekendFromRoom({room,games}){
 if(!room||!Array.isArray(room.players)||room.players.length!==2||
 room.players.some(name=>typeof name!=='string'||!name.trim()))throw Error('Two-player room required');
 if(!room.holes||typeof room.holes!=='object'||Array.isArray(room.holes))throw Error('Room scorecard unavailable');
 const holes=Array.from({length:18},(_,i)=>{
  const value=room.holes[i+1];
  if(value===undefined||value===null)return null;
  if(!Array.isArray(value)||value.length!==2||value.some(n=>!Number.isInteger(n)||n<1||n>20))throw Error('Invalid shared hole '+(i+1));
  return [...value];
 });
 const action=twoPlayerAction({names:room.players,holes,games});
 return {...action,recordedHoles:holes.filter(Boolean).length,
  roomArchived:room.archived===true,
  readyForFinal:room.archived===true&&action.completed,
  source:'read-only-money-room-snapshot'};
}
