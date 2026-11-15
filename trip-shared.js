import {createTrip} from './trip-roster.js';
import {cupStandings} from './trip-cup.js';

const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
export function sharedCupTrip(draft, rows) {
 const trip=createTrip({tripId:draft.id,name:draft.name,players:draft.players,rounds:draft.rounds});
 for(const round of trip.rounds){
  for(const group of round.groups){
   group.scores=Array(18).fill(null);
   for(const row of rows){
    if(row.groupKey===round.id+'~'+group.id)group.scores[row.hole-1]=row.strokes;
   }
  }
 }
 return {trip,standings:cupStandings(trip)};
}

// Construct with the existing Firebase app's Firestore instance and modular SDK.
// Each score update touches one group/hole document, so unrelated holes can sync
// independently. Standings are computed from score documents on every device.
export function sharedTripStore(db, sdk){
 const {collection,doc,getDoc,onSnapshot,runTransaction,setDoc,writeBatch}=sdk;
 const paths=tripId=>['cupTrips',tripId];
 const ref=(tripId,...rest)=>doc(db,...paths(tripId),...rest);
 return {
  async publish(draft,hostUid,keepers){
   const {trip}=sharedCupTrip(draft,[]);
   const active=trip.rounds.filter(round=>round.status==='active');
   if(!active.length||trip.rounds.length>10||draft.rounds.some(round=>round.games?.length||
     round.groups.some(group=>group.scores?.some(Boolean))))throw Error('Start an unscored round before sharing.');
   const batch=writeBatch(db);
   batch.set(ref(trip.id),{hostUid,draft:JSON.stringify(trip)});
   for(const round of active){
    for(const group of round.groups){
     if(group.playerIds.length<2)continue;
     const key=round.id+'~'+group.id;
     const keeperUid=keepers[key]??hostUid;
     batch.set(ref(trip.id,'groups',key),{keeperUid,players:group.playerIds});
    }
   }
   await batch.commit();
  },
  grant(tripId,uid){return setDoc(ref(tripId,'members',uid),{uid});},
  async load(tripId){
   const snapshot=await getDoc(ref(tripId));
   if(!snapshot.exists())throw Error('Trip unavailable.');
   return JSON.parse(snapshot.data().draft);
  },
  async assignedGroups(tripId,draft,uid){
   const choices=draft.rounds.filter(round=>round.status==='active').flatMap(round=>round.groups
    .filter(group=>group.playerIds.length>=2).map((group,index)=>({
     roundId:round.id,groupId:group.id,label:round.name+' · Score group '+(index+1)
    })));
   const matches=await Promise.all(choices.map(async choice=>{
    const group=await getDoc(ref(tripId,'groups',choice.roundId+'~'+choice.groupId));
    return group.data()?.keeperUid===uid?choice:null;
   }));
   return matches.filter(Boolean);
  },
  watch(tripId,draft,onUpdate,onError){
   return onSnapshot(collection(db,...paths(tripId),'holes'),{includeMetadataChanges:true},snap=>{
    onUpdate({...sharedCupTrip(draft,snap.docs.map(row=>row.data())),fromCache:snap.metadata.fromCache});
   },onError);
  },
  save(tripId,{roundId,groupId,hole,expected,strokes}){
   if(!Number.isInteger(hole)||hole<1||hole>18||!Array.isArray(strokes)||
      strokes.length<2||strokes.length>4||Array.from(strokes).some(n=>!Number.isInteger(n)||n<1||n>20)){
    throw Error('Enter a valid score for each golfer.');
   }
   const groupKey=roundId+'~'+groupId;
   const score=ref(tripId,'holes',groupKey+'~'+hole);
   return runTransaction(db,async tx=>{
    const snapshot=await tx.get(score);
    const prior=snapshot.exists()?snapshot.data().strokes:null;
    if(same(prior,strokes))return;
    if(!same(prior,expected))throw Error('This hole changed. Review the latest scores before correcting it.');
    tx.set(score,{groupKey,hole,strokes,holeKey:String(hole)});
   });
  }
 };
}
