// Tournament HQ Firebase client transport.
// Dependency injection keeps it independently testable and prevents accidental
// use of Firestore client-side writes to captain scores, roles or event status.
// The caller supplies the already-initialized Firebase Auth, Functions and Firestore
// instances and SDK bindings. This module never changes an existing DCC app session.
const ACTIONS=new Set(['create','read','add-team','join-team','start','score','correct','finalize']);
function validId(value){return typeof value==='string'&&/^[a-zA-Z0-9_-]{3,96}$/.test(value)}
function safeError(error){
 const code=typeof error?.code==='string'?error.code:'unknown';
 const message=typeof error?.message==='string'?error.message:'Tournament request failed';
 return {code,message};
}
export function createTournamentTransport({auth,functions,firestore,httpsCallable,doc,onSnapshot,mutationId}){
 if(!auth||!functions||!firestore||typeof httpsCallable!=='function'||typeof doc!=='function'||typeof onSnapshot!=='function'||typeof mutationId!=='function')throw new TypeError('Firebase instances and SDK adapters required');
 const command=httpsCallable(functions,'tournamentHQ');
 async function send(action,payload={}){
  if(!ACTIONS.has(action))throw new TypeError('Unknown tournament action');
  const uid=auth.currentUser?.uid;
  if(!validId(uid))return {ok:false,error:{code:'unauthenticated',message:'Sign in before using Tournament HQ'}};
  if(!payload||typeof payload!=='object'||Array.isArray(payload))throw new TypeError('Invalid tournament request');
  if(action!=='create'&&!validId(payload.eventId))throw new TypeError('Tournament event ID required');
  const data={...payload,action};
  if(!['read'].includes(action)&&!validId(data.mutationId)){
   data.mutationId=mutationId();
   if(!validId(data.mutationId))throw new TypeError('Could not create safe mutation ID');
  }
  try{
   const result=await command(data);
   if(result?.data?.ok!==true)return {ok:false,error:{code:'invalid-response',message:'Server did not confirm the operation'}};
   return {ok:true,...result.data};
  }catch(error){return {ok:false,error:safeError(error)}}
 }
 function watch(eventId,onEvent,onError=()=>{}){
  if(!validId(eventId))throw new TypeError('Tournament event ID required');
  if(typeof onEvent!=='function'||typeof onError!=='function')throw new TypeError('Callbacks required');
  if(!validId(auth.currentUser?.uid)){
   onError({code:'unauthenticated',message:'Sign in to watch live tournament standings'});
   return ()=>{};
  }
  const reference=doc(firestore,'tournaments',eventId);
  let active=true;
  const unsub=onSnapshot(reference,snapshot=>{
   if(!active)return;
   if(!snapshot.exists()){
    onError({code:'not-found',message:'Tournament not found'});
    return;
   }
   const event=snapshot.data();
   if(event?.version!==1||event?.id!==eventId||!Array.isArray(event.teams)){
    onError({code:'invalid-event',message:'Unexpected tournament data'});
    return;
   }
   onEvent({...event,syncStatus:snapshot.metadata?.hasPendingWrites?'pending':
    snapshot.metadata?.fromCache?'cached':'live'});
  },error=>{if(active)onError(safeError(error))});
  return ()=>{active=false;unsub()};
 }
 return Object.freeze({send,watch});
}
