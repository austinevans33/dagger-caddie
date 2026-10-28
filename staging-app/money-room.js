import {installLedgerSettlement} from './ledger-settlement.js';
installLedgerSettlement(window);
import {firebaseConfig} from './firebase-config.js';
import {createRoomSession,singleFlight,invitationFrom} from './room-session.js';
import {createInvitationSharing} from './invitation-qr.js';
import {rememberRoom,forgetRoom,recoverRoom,readWithDeadline} from './room-recovery.js';
const roomStore={getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value),removeItem:key=>localStorage.removeItem(key)};
const invitationSharing=createInvitationSharing();

const $=id=>document.getElementById(id);
const status=t=>{$('roomStatus').textContent=t;};
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>(v>=0?'+':'−')+'$'+Math.abs(v).toFixed(2);
const isConfigured=firebaseConfig&&firebaseConfig.apiKey&&firebaseConfig.projectId;
let db=null,auth=null,functions=null,room=null,roomId='',invite='',roomUnsub=null,user=null,host=false,session=null;
let connectionVersion=0,actionVersion=0,navigationVersion=0,authInitialized=false;
document.addEventListener('click',event=>{
 if(!event.isTrusted)return;
 if(event.target.closest?.('[id^="tab-"]'))navigationVersion++;
 if(event.target.closest?.('#roomSetup > summary'))actionVersion++;
},true);
document.addEventListener('input',event=>{if(event.isTrusted&&(event.target.closest?.('#roomSetup')||event.target.id==='roomQuickName'))actionVersion++;},true);
function assertOperation(version,uid){session.assertIdentity(uid);if(version!==actionVersion)throw Error('A newer room action has taken over.');}


function compute(model){
 const players=model.players||[];const n=players.length,holes=model.holes||{},stake=Number(model.stake)||0;
 const totals=Array(n).fill(0),ledger=[];let carry=1,settled=0;
 let cumulativeMatch=0;
 const segs=[{from:1,to:9,finished:false},{from:10,to:18,finished:false},{from:1,to:18,finished:false}];
 for(let hole=1;hole<=18;hole++){
   const scores=holes[hole];const valid=Array.isArray(scores)&&scores.length===n&&scores.every(v=>Number.isInteger(v)&&v>=1&&v<=20);
   let event='—';
   if(valid){
     settled++;
     if(model.format==='skins'){
       const low=Math.min(...scores), winners=scores.map((x,i)=>x===low?i:-1).filter(i=>i>=0);
       if(winners.length===1){const win=winners[0],pot=stake*carry;totals[win]+=(n-1)*pot;for(let i=0;i<n;i++)if(i!==win)totals[i]-=pot;event=players[win]+' · '+carry+' skin'+(carry===1?'':'s');carry=1;}
       else{event='Tie · carry '+carry+' → '+(carry+1);carry++;}
     } else if(model.format==='hole'){
       if(scores[0]===scores[1])event='Halved';else{const w=scores[0]<scores[1]?0:1;totals[w]+=stake;totals[1-w]-=stake;cumulativeMatch+=w===0?1:-1;event=players[w]+' wins';}
     } else if(model.format==='vegas'){
       const a=Math.min(scores[0],scores[1])*10+Math.max(scores[0],scores[1]),b=Math.min(scores[2],scores[3])*10+Math.max(scores[2],scores[3]);const diff=(b-a)*stake;
       totals[0]+=diff/2;totals[1]+=diff/2;totals[2]-=diff/2;totals[3]-=diff/2;event=a+'–'+b+' · '+(diff===0?'Tie':diff>0?'Team 1':'Team 2');
     } else if(model.format==='nassau'){
       event=scores[0]===scores[1]?'Halved':players[scores[0]<scores[1]?0:1]+' wins hole';
     }
   }
   // Nassau settlements are provisional until all holes in a segment are entered.
   if(model.format==='nassau'&&n===2){
     for(const seg of segs){if(seg.to!==hole)continue;let diff=0,count=0;for(let k=seg.from;k<=seg.to;k++){const v=holes[k];if(Array.isArray(v)&&v.length===2&&v.every(x=>Number.isInteger(x)&&x>=1&&x<=20)){count++;diff+=v[0]<v[1]?1:v[0]>v[1]?-1:0;}}
       if(count===seg.to-seg.from+1){seg.finished=true;if(diff!==0){const w=diff>0?0:1;totals[w]+=stake;totals[1-w]-=stake;event+=' · Nassau segment settled';}}}}
   ledger.push({hole,scores:valid?scores:null,event,totals:[...totals],carry});
 }
 return {totals,carry,settled,ledger,matchDiff:cumulativeMatch};
}
function roomLabel(){const me=user?.uid||'';return (me===room?.hostUid?'Scorekeeper':'Read-only member');}
function render(){
 if(!room)return;
 host=!!(user?.uid===room.hostUid);
 invitationSharing.prepare(roomLink());
 if(user?.uid&&roomId&&invite){
  if(!room.archived&&!rememberRoom(roomStore,{uid:user.uid,id:roomId,invite,name:($('roomMe').value.trim()||room.hostName||'Guest').slice(0,24)}))status('Live room connected. Save your invitation link; this browser cannot remember the room.');
 }
 $('roomScoreSection').hidden=false;
 $('roomEditor').hidden=!host; $('roomSpectator').hidden=host;
 $('roomInvitationBanner').hidden=true;
 $('roomSetup').open=false;
 
  // THE ACTION — Clear live match identity and role.
  const roleName = host ? 'OFFICIAL SCOREKEEPER' : 'LIVE SPECTATOR';
  const matchState = room.archived ? 'MATCH ARCHIVED' : 'MATCH IN PROGRESS';

  $('roomWho').textContent =
    `${matchState} · ${roleName}\n` +
    `${room.players.join(' vs ')}\n` +
    `${room.format.toUpperCase()} · $${room.stake} per unit`;

  $('roomWho').style.whiteSpace = 'pre-line';
  $('roomWho').style.background = host ? '#193d2d' : '#eee3cd';
  $('roomWho').style.color = host ? '#fff4dc' : '#193d2d';
  $('roomWho').style.border = '1px solid #b79c62';
  $('roomWho').style.borderLeft = '4px solid #b79c62';
  $('roomWho').style.fontWeight = '700';
  $('roomWho').style.lineHeight = '1.9';
  $('roomWho').style.padding = '14px';

 $('roomHostName').value=room.hostName||'Scorekeeper';
 $('roomHole').innerHTML=Array.from({length:18},(_,i)=>`<option value="${i+1}">Hole ${i+1}</option>`).join('');
 const pending=Array.from({length:18},(_,i)=>i+1).find(i=>!room.holes?.[i])||18;
 $('roomHole').value=String(pending);
 $('roomScoreHead').innerHTML='<tr><th>Player</th><th>Strokes</th></tr>';
 const h=Number($('roomHole').value);buildInputs(h);
 const x=compute(room);
 $('roomStandings').textContent=room.players.map((name,i)=>`${name}: ${money(x.totals[i])}`).join(' · ')+(room.format==='skins'?` · ${x.carry} skin(s) in next pot`:'')+` · ${x.settled} holes scored`;
 $('roomFormatDisplay').textContent=room.format.toUpperCase();$('roomStakeDisplay').textContent='$'+room.stake;$('roomNextDisplay').textContent=String(pending);
 const lead=x.totals.reduce((a,v,i)=>v>x.totals[a]?i:a,0);
 const leader=room.players[lead], loser=room.players.reduce((a,n,i)=>x.totals[i]<x.totals[a]?i:a,0);
 const banter= x.settled===0?'The committee is awaiting the first score. Keith suggests everyone finish warming up their excuses.':
     x.totals.every(v=>v===0)?'Keith: Nobody has won anything yet. This is a remarkable amount of administration for absolutely no profit.':
     'Keith: '+leader+' has the lead. '+room.players[loser]+', your golf is currently a charitable donation with a dress code.';
 $('roomCaddieBanter').textContent=banter;
 $('roomTotalsCards').innerHTML=room.players.map((name,i)=>`<div class="betbox"><strong>${esc(name)}</strong><span style="font-size:17px">${money(x.totals[i])}</span></div>`).join('');
 $('roomLedgerHead').innerHTML='<tr><th>Hole</th>'+room.players.map(n=>'<th>'+esc(n)+'</th>').join('')+'<th>Result</th>'+room.players.map(n=>'<th>'+esc(n)+' $</th>').join('')+'</tr>';
 $('roomLedgerBody').innerHTML=x.ledger.map(row=>'<tr><td>'+row.hole+'</td>'+room.players.map((_,i)=>'<td>'+(row.scores?row.scores[i]:'—')+'</td>').join('')+'<td>'+esc(row.event)+'</td>'+room.players.map((_,i)=>'<td>'+(row.scores?money(row.totals[i]):'—')+'</td>').join('')+'</tr>').join('');
 // A DOM card for each of 18 holes. No narrow multi-column table on iPhone.
   const ledgerRoot=$('roomLedgerCards');
  ledgerRoot.replaceChildren();

  // Keep completed holes visible and unplayed holes collapsible.
  const futureHoles = document.createElement('details');
  futureHoles.className = 'ledger-detail';
  futureHoles.style.marginTop = '12px';

  const futureSummary = document.createElement('summary');
  futureSummary.textContent = 'Show unplayed holes';
  futureHoles.append(futureSummary);

  const futureList = document.createElement('div');
  futureList.className = 'ledger-cards';
  futureHoles.append(futureList);
 for(const row of x.ledger){
  const card=document.createElement('article');card.className='ledger-hole'+(row.scores?'':' pending');card.setAttribute('role','listitem');
  const header=document.createElement('div');header.className='ledger-hole-head';
  const number=document.createElement('strong');number.textContent='Hole '+row.hole;
  const event=document.createElement('span');event.textContent=row.scores?row.event:'Not scored';header.append(number,event);card.append(header);
  if(row.scores){
   room.players.forEach((name,i)=>{const line=document.createElement('div');line.className='ledger-line';const player=document.createElement('span');player.textContent=name;const strokes=document.createElement('span');strokes.textContent=row.scores[i]+' strokes';line.append(player,strokes);card.append(line);});
   const balance=document.createElement('div');balance.className='ledger-balances';
   room.players.forEach((name,i)=>{const chip=document.createElement('span');chip.textContent=name+': '+money(row.totals[i]);balance.append(chip);});card.append(balance);
  }else{const msg=document.createElement('div');msg.className='game-note';msg.textContent='Awaiting scores';card.append(msg);}
     if (row.scores) {
     ledgerRoot.append(card);
   } else {
     futureList.append(card);
   }
 }
  if (futureList.children.length) {
    futureSummary.textContent =
      'Show ' + futureList.children.length + ' unplayed holes';
    ledgerRoot.append(futureHoles);
  }

  if (!ledgerRoot.querySelector('.ledger-hole:not(.pending)')) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'game-note';
    emptyMessage.textContent =
      'The official ledger is ready. Record the first hole to begin.';
    ledgerRoot.prepend(emptyMessage);
  }
 $('roomAudit').textContent=room.lastChange?`Last updated ${new Date(room.lastChange).toLocaleString()} by ${room.lastEditor||'scorekeeper'}. Score history includes the current official value for each hole.`:'';
 $('roomSaveHole').disabled=!host||room.archived;
 $('roomFinish').disabled=!host||room.archived;
 $('roomHole').disabled=!host||room.archived;
 }
function buildInputs(h){const scores=room?.holes?.[h]||[];$('roomScoreRows').innerHTML='';(room?.players||[]).forEach((name,i)=>{const tr=document.createElement('tr'),first=document.createElement('td'),td=document.createElement('td'),input=document.createElement('input'),wrap=document.createElement('div');first.textContent=name;input.type='number';input.min='1';input.max='20';input.inputMode='numeric';input.dataset.player=String(i);input.value=scores[i]||'';input.disabled=!host||room.archived;wrap.className='room-score-step';
const step=(sign)=>{const b=document.createElement('button');b.type='button';b.textContent=sign===1?'+':'−';b.disabled=!host||room.archived;b.setAttribute('aria-label',(sign===1?'Increase ':'Decrease ')+name+' score');b.onclick=()=>{input.value=String(Math.max(1,Math.min(20,(Number(input.value)||4)+sign)));};return b;};wrap.append(step(-1),input,step(1));td.append(wrap);tr.append(first,td);$('roomScoreRows').append(tr);});}
$('roomHole').onchange=()=>{if(room)buildInputs(Number($('roomHole').value));};
function archiveLocal(){if(!room)return;const k='dagger_room_archives',old=JSON.parse(localStorage.getItem(k)||'[]');const item={...room,roomId,ended:Date.now(),payouts:compute(room).totals};const i=old.findIndex(v=>v.roomId===roomId);if(i>=0)old[i]=item;else old.push(item);localStorage.setItem(k,JSON.stringify(old));}
function roomLink(){const url=new URL(window.location.href);url.search='';url.hash='';url.searchParams.set('room',roomId);url.searchParams.set('invite',invite);return url.toString();}
function parseInvite(input){return invitationFrom(input)||{id:'',code:''};}
const rand=(size)=>{const a=new Uint8Array(size);crypto.getRandomValues(a);return [...a].map(b=>b.toString(16).padStart(2,'0')).join('');};
async function connect(id){if(roomUnsub)roomUnsub();roomId=id;const version=++connectionVersion;
 const {doc,onSnapshot}=functions;
 roomUnsub=onSnapshot(doc(db,'rooms',id),snap=>{if(version!==connectionVersion||auth.currentUser?.uid!==user?.uid)return;if(!snap.exists()){status('Room not found, or access denied.');return;}room=snap.data();if(room.archived&&!snap.metadata?.hasPendingWrites&&!snap.metadata?.fromCache)forgetRoom(roomStore,user.uid,roomId);status('LIVE · Updates delivered across connected phones · '+roomLabel());render();},err=>{if(version===connectionVersion)status('Could not subscribe: '+err.message);});
}
async function create(){const attempt=++actionVersion;try{
 if(!session)throw Error('Live syncing is not configured. Follow SETUP_FIREBASE.md.');
 user=await session.current();const operationUid=user.uid;
 const me=$('roomMe').value.trim();const others=$('roomPlayers').value.split(',').map(x=>x.trim()).filter(Boolean);const players=[me,...others];
 const format=$('roomFormat').value,needed=format==='vegas'?4:format==='hole'||format==='nassau'?2:null;
 if(!me||players.length<2||players.length>4||new Set(players.map(n=>n.toLowerCase())).size!==players.length)throw Error('Enter 2–4 distinct golfer names including yourself.');
 if(needed&&players.length!==needed)throw Error(`${format} requires ${needed} players.`);
 const stake=Number($('roomStake').value);if(!Number.isFinite(stake)||stake<0||stake>10000)throw Error('Invalid stake.');
 const {doc,setDoc}=functions;const id=rand(16),code=rand(8);const model={name:'Dagger Country Club Money Room',hostUid:user.uid,hostName:me,players,format,stake,invite:code,holes:{},archived:false,created:Date.now(),lastChange:Date.now(),lastEditor:me};
 await setDoc(doc(db,'rooms',id),model);assertOperation(attempt,operationUid);await setDoc(doc(db,'rooms',id,'members',user.uid),{uid:user.uid,name:me,invite:code,joined:Date.now()});assertOperation(attempt,operationUid);invite=code;room=model;$('roomCode').value=id+':'+code;await connect(id);status('Money Room created. You are the ONLY scorekeeper. Share the invitation link.');
 }catch(e){if(attempt===actionVersion)status('Could not create room: '+e.message);}}
async function join(){
 const attempt=++actionVersion;
 let stage='validation';
 try{
  if(!session)throw Error('Live syncing is not configured. Follow SETUP_FIREBASE.md.');
 user=await session.current();const operationUid=user.uid;
  const {id,code}=parseInvite($('roomCode').value);
  if(!/^[0-9a-f]{32}$/.test(id)||!/^[0-9a-f]{16}$/.test(code))throw Error('Paste the complete invitation link or ID:code.');
  const name=$('roomMe').value.trim()||'Guest';if(name.length>24)throw Error('Name is too long.');
  if(!user?.uid)throw Error('Anonymous authentication did not finish. Reload the app.');
  stage='member-registration';status('Verifying invitation and registering your membership…');
  const {doc,setDoc,getDoc}=functions;
  const memberRef=doc(db,'rooms',id,'members',user.uid);
  await setDoc(memberRef,{uid:operationUid,name,invite:code,joined:Date.now()});
  assertOperation(attempt,operationUid);
  stage='room-access';status('Membership accepted. Opening the live scorecard…');
  const snapshot=await getDoc(doc(db,'rooms',id));
  assertOperation(attempt,operationUid);
  if(!snapshot.exists())throw Error('Room not found. Ask the scorekeeper for a new invitation.');
  invite=code;roomId=id;room=snapshot.data();
  await connect(id);status('Membership verified. Connecting live updates…');
 }catch(e){
  if(attempt!==actionVersion)return;
  let hint='';
  if(e.code==='permission-denied'||/permissions/i.test(e.message)){
   hint=stage==='member-registration'?' The invite may be old or the member security rules may need updating. Confirm that your host sent the link for the currently active room.':' The membership was accepted, but the room read was denied. Check the published Firestore rules.';
  }
  status('Unable to join ('+stage+'): '+e.message+hint+' · If this continues, send this exact message to the caddie developer.');
 }
}
const createOnce=singleFlight(create),joinOnce=singleFlight(join);
$('roomCreate').onclick=createOnce;$('roomJoin').onclick=joinOnce;
$('roomQuickJoin').onclick=()=>{const name=$('roomQuickName').value.trim();if(!name){status('Enter your display name to join.');$('roomQuickName').focus();return;}$('roomMe').value=name;joinOnce();};
const shareInvite=async(qr=false)=>{if(!roomId){status('Create or join a room first.');return;}try{
 const result=await invitationSharing.share(roomLink(),{qr});
 if(result.kind==='link-copy')status('Invitation link copied.');
 if(result.kind==='qr-download')status(result.linkCopied?'QR invitation saved. Invitation link copied.':'QR invitation saved. Copy the room link manually: '+roomLink());
}catch{status('Copy the room link manually: '+roomLink());}};
$('roomCopy').onclick=singleFlight(()=>shareInvite(false));
$('roomShareCurrent').onclick=singleFlight(()=>shareInvite(true));
$('roomLocalArchive').onclick=()=>{if(!room)return;archiveLocal();status('Saved a snapshot in this phone’s local archives.');};
$('roomSaveHole').onclick=async()=>{try{if(!host||!room||room.archived)throw Error('Only the active scorekeeper may edit.');session.assertIdentity(room.hostUid);const hole=Number($('roomHole').value);const scores=[...$('roomScoreRows').querySelectorAll('input')].map(e=>Number(e.value));if(scores.some(n=>!Number.isInteger(n)||n<1||n>20))throw Error('Enter a valid stroke score for every player.');const holes={...(room.holes||{}),[hole]:scores};await functions.updateDoc(functions.doc(db,'rooms',roomId),{holes,lastEditor:room.hostName,lastChange:Date.now()});status('Hole '+hole+' recorded and sent to connected members.');}catch(e){status('Save failed: '+e.message);}};
$('roomFinish').onclick=async()=>{if(!host||!room||room.archived||auth.currentUser?.uid!==room.hostUid)return;if(!confirm('Archive this match for everyone? Future edits will be locked.'))return;try{const closingId=roomId,closingUid=auth.currentUser.uid;await functions.updateDoc(functions.doc(db,'rooms',closingId),{archived:true,lastChange:Date.now()});forgetRoom(roomStore,closingUid,closingId);if(roomId===closingId&&auth.currentUser?.uid===closingUid){archiveLocal();status('Match archived. Scorekeeper can no longer edit it.');}}catch(e){status('Archive failed: '+e.message);}};
async function init(){if(!isConfigured){status('Local mode · Live sync is not configured. See SETUP_FIREBASE.md. Local games and Betting still work.');return;}
 try{
 const appMod=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js');
 const authMod=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js');
 const fsMod=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js');
 const app=appMod.initializeApp(firebaseConfig);auth=authMod.getAuth(app);db=fsMod.getFirestore(app);functions=fsMod;
 session=createRoomSession(auth,authMod.signInAnonymously);
 authMod.onAuthStateChanged(auth,next=>{
   if(user?.uid!==next?.uid){
     if(user?.uid){++actionVersion;forgetRoom(roomStore,user.uid);}
     ++connectionVersion;if(roomUnsub)roomUnsub();roomUnsub=null;
     room=null;roomId='';invite='';host=false;invitationSharing.clear();
     $('roomScoreSection').hidden=true;
     $('roomEditor').hidden=true;
     $('roomSaveHole').disabled=true;$('roomFinish').disabled=true;
   }
   user=next;
   if(next){status('Live sync ready. Create a Money Room, or paste an invite and join.');if(authInitialized)restoreOnce();}
 });
 showIncomingInvitation();
 user=await session.current();
 authInitialized=true;
 const initialAction=actionVersion;
 const restored=await restoreOnce();
 if(restored===false&&actionVersion===initialAction&&!roomId&&!incomingInvitation)status('Live sync ready. Create a Money Room, or paste an invite and join.');
 }catch(e){status('Live sync unavailable: '+e.message+'. Check Firebase setup and network.');}}
const incomingInvitation=invitationFrom(window.location.href);
function focusMoneyRoom(){
 if(navigationVersion)return;
 if(typeof window.switchTab==='function')window.switchTab('bets');else $('tab-bets')?.click();
 $('moneyRoomSection')?.scrollIntoView({block:'start'});
}
function showIncomingInvitation(){
 if(!incomingInvitation||roomId)return;
 $('roomCode').value=incomingInvitation.id+':'+incomingInvitation.code;
 $('roomInvitationBanner').hidden=false;$('roomSetup').open=false;
 focusMoneyRoom();
 status('Invitation ready. Enter your name and tap Join live room.');
}
async function restoreSavedRoom(){
 if(!session||roomId||!auth.currentUser?.uid)return false;
 const uid=auth.currentUser.uid,version=actionVersion;
 const isCurrent=()=>auth.currentUser?.uid===uid&&actionVersion===version&&!roomId;
 try{
  const saved=await recoverRoom({storage:roomStore,uid,incoming:incomingInvitation,isCurrent,readRoom:async id=>{
   status('Reconnecting to your active Money Room…');
   const snapshot=await readWithDeadline(()=>functions.getDocFromServer(functions.doc(db,'rooms',id)));
   return snapshot.exists()?snapshot.data():null;
  }});
  if(!saved||!isCurrent())return false;
  user=auth.currentUser;invite=saved.bookmark.invite;room=saved.room;
  $('roomMe').value=saved.bookmark.name;$('roomCode').value=saved.bookmark.id+':'+invite;
  await connect(saved.bookmark.id);focusMoneyRoom();return true;
 }catch(error){
  if(isCurrent())status('Could not restore the active room: '+error.message+'. Reconnect or use your invitation to rejoin.');
  return null;
 }
}
const restoreOnce=singleFlight(restoreSavedRoom);
window.addEventListener('online',()=>{if(authInitialized&&!roomId)restoreOnce();});
// Restore the correct destination after the original profile initializer runs.
const selector=$('manualclub');
if(selector&&!selector.children.length){
 const ready=new MutationObserver(()=>{ready.disconnect();if(roomId)focusMoneyRoom();else showIncomingInvitation();});
 ready.observe(selector,{childList:true});
}
init();
