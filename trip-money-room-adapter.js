// Bridge from a verified, finished Money Room to the pure Trip Ledger.
// Explicit player IDs prevent duplicate display names from corrupting payouts.
// This does not read/write Firestore or change any existing Money Room behavior.
export function moneyRoomToTripGame({roomId, room, calculated, playerIds}) {
  if (typeof roomId !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(roomId))
    throw new Error('Invalid Money Room ID');
  if (!room || !Array.isArray(room.players) || !Array.isArray(playerIds) ||
      room.players.length !== playerIds.length || room.players.length < 2 ||
      new Set(playerIds).size !== playerIds.length ||
      playerIds.some(id => typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(id)))
    throw new Error('Explicit player mapping required');
  // Archiving is not proof of a complete round: a 0/18 test was archived in the field.
  const full = Array.from({length:18},(_,i)=>room.holes?.[i+1])
    .every(h => Array.isArray(h) && h.length===playerIds.length &&
      h.every(s=>Number.isInteger(s)&&s>=1&&s<=20));
  if (!room.archived || !full)
    return {id:roomId,status:'active'};
  if (!calculated || !Array.isArray(calculated.totals) ||
      calculated.totals.length !== playerIds.length || calculated.settled !== 18)
    throw new Error('Verified full-round calculation required');
  const netCents={};
  for (let i=0;i<playerIds.length;i++) {
    const raw=calculated.totals[i]*100;
    const rounded=Math.round(raw);
    if (!Number.isFinite(raw) || !Number.isSafeInteger(rounded) ||
        Math.abs(raw-rounded)>1e-7) throw new Error('Non-cent Money Room amount');
    netCents[playerIds[i]]=rounded;
  }
  if (Object.values(netCents).reduce((a,b)=>a+b,0)!==0)
    throw new Error('Money Room settlement not zero-sum');
  return {id:roomId,status:'completed',netCents};
}
