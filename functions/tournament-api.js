'use strict';
// Server-controlled Tournament HQ API. Never let client writes bypass captain authorization.
// Firebase Admin authentication is supplied by callable request.auth; use one Firestore
// transaction per command so revisions and mutation IDs are checked atomically.
const {randomUUID}=require('node:crypto');
const {onCall,HttpsError}=require('firebase-functions/v2/https');

function invalid(message){throw new HttpsError('invalid-argument',message)}
function authUid(request){
 const uid=request.auth?.uid;
 if(!uid||typeof uid!=='string')throw new HttpsError('unauthenticated','Sign in to a golfer account.');
 return uid;
}
function idField(value){
 if(typeof value!=='string'||!/^[a-zA-Z0-9_-]{3,96}$/.test(value))invalid('Invalid event or team identifier.');
 return value;
}
function eventRef(db,eventId){return db.collection('tournaments').doc(idField(eventId))}
function errorForReason(reason){
 const permissions=new Set(['not-director','not-captain','locked']);
 const state=new Set(['stale-revision','duplicate-mutation','already-scored','not-live','not-draft','invalid-transition','full','out-of-order','unchanged','hole-not-recorded','no-teams']);
 const code=permissions.has(reason)?'permission-denied':state.has(reason)?'failed-precondition':'invalid-argument';
 return new HttpsError(code,reason.replaceAll('-',' '));
}
function configureTournamentCallables(admin){
 const db=admin.firestore();
 async function command(request){
  const uid=authUid(request);
  const body=request.data;
  if(!body||typeof body!=='object'||Array.isArray(body))invalid('Invalid tournament request.');
  const {action}=body;
  const domain=await import('./tournament-event.mjs');
  if(action==='create'){
   const id=randomUUID();
   const result=domain.createTournament({id,name:body.name,hostUid:uid,
    courseIdentity:body.courseIdentity,holes:body.holes,teamLimit:body.teamLimit??36,
    mutationId:idField(body.mutationId)});
   if(!result.ok)throw errorForReason(result.reason);
   // A generated ID is unguessable; tournament get reads require a signed-in account.
   const doc=eventRef(db,id);
   await doc.create({...result.event,createdAt:admin.firestore.FieldValue.serverTimestamp()});
   return {ok:true,eventId:id,revision:0};
  }
  if(action==='read'){
   const doc=await eventRef(db,body.eventId).get();
   if(!doc.exists)throw new HttpsError('not-found','Tournament not found.');
   return {ok:true,event:doc.data()};
  }
  if(!['add-team','start','score','correct','finalize'].includes(action))invalid('Unknown tournament action.');
  idField(body.mutationId);
  const ref=eventRef(db,body.eventId);
  return db.runTransaction(async transaction=>{
   const snapshot=await transaction.get(ref);
   if(!snapshot.exists)throw new HttpsError('not-found','Tournament not found.');
   const event=snapshot.data();
   let result;
   switch(action){
    case 'add-team':
     result=domain.addTournamentTeam({event,actorId:uid,teamId:body.teamId,name:body.name,
      captainUid:body.captainUid,startHole:body.startHole,startSlot:body.startSlot||'A',mutationId:body.mutationId});
     break;
    case 'start':
    case 'finalize':
     result=domain.changeTournamentStatus({event,actorId:uid,status:action==='start'?'live':'final',mutationId:body.mutationId});
     break;
    case 'score':
     result=domain.submitTournamentScore({event,actorId:uid,teamId:body.teamId,hole:body.hole,
      strokes:body.strokes,expectedTeamRevision:body.expectedTeamRevision,mutationId:body.mutationId});
     break;
    case 'correct':
     result=domain.correctTournamentScore({event,actorId:uid,teamId:body.teamId,hole:body.hole,
      strokes:body.strokes,reason:body.reason,mutationId:body.mutationId});
     break;
   }
   if(!result.ok)throw errorForReason(result.reason);
   transaction.set(ref,result.event);
   return {ok:true,eventId:event.id,revision:result.event.revision};
  });
 }
 return onCall({region:'us-central1',memory:'256MiB',maxInstances:10,concurrency:20,
  enforceAppCheck:false},command);
}
module.exports={configureTournamentCallables};
