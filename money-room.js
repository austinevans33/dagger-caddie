import {firebaseConfig} from './firebase-config.js';

const $=id=>document.getElementById(id);
const status=t=>{$('roomStatus').textContent=t;};
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>(v>=0?'+':'−')+'$'+Math.abs(v).toFixed(2);
const isConfigured=firebaseConfig&&firebaseConfig.apiKey&&firebaseConfig.projectId;
let db=null,auth=null,functions=null,room=null,roomId='',invite='',roomUnsub=null,user=null,host=false;

function compute(model){
 const players=model.players||[];const n=players.length,holes=model.holes||{};
 let totals=Array(n).fill(0),carry=1,matchDiff=0,vegasSum=0,settled=0;
 const rows=Object.keys(holes).map(Number).sort((a,b)=>a-b);
 for(const hole of rows){
   const scores=holes[hole]; if(!Array.isArray(scores)||scores.length!==n||scores.some(s=>!Number.isInteger(s)||s<1))continue;
   settled++;
   if(model.format==='skins'){
     const low=Math.min(...scores),winners=scores.map((x,i)=>x===low?i:-1).filter(i=>i>=0);
     if(winners.length===1){const win=winners[0];totals[win]+=(n-1)*model.stake*carry;for(let i=0;i<n;i++)if(i!==win)totals[i]-=model.stake*carry;carry=1;}else carry++;
   } else if(model.format==='hole'){
     if(scores[0]!==scores[1]){let win=scores[0]<scores[1]?0:1;totals[win]+=model.stake;totals[1-win]-=model.stake;matchDiff+=win===0?1:-1;}
   } else if(model.format==='vegas'){
     const a=Math.min(scores[0],scores[1])*10+Math.max(scores[0],scores[1]);const b=Math.min(scores[2],scores[3])*10+Math.max(scores[2],scores[3]);
     const diff=(b-a)*model.stake;totals[0]+=diff/2;totals[1]+=diff/2;totals[2]-=diff/2;totals[3]-=diff/2;vegasSum+=b-a;
   }
 }
 if(model.format==='nassau'&&n===2){
   for(const [from,to] of [[1,9],[10,18],[1,18]]){let diff=0,count=0;
     for(let h=from;h<=to;h++){const scores=holes[h];if(!scores||scores.length!==2)continue;count++;diff+=scores[0]<scores[1]?1:scores[0]>scores[1]?-1:0;}
     if(count>0&&diff!==0){totals[diff>0?0:1]+=model.stake;totals[diff>0?1:0]-=model.stake;}
   }
 }
 return {totals,carry,settled,matchDiff,vegasSum};
}
function roomLabel(){const me=user?.uid||'';return (me===room?.hostUid?'Scorekeeper':'Read-only member');}
function render(){
 if(!room)return;
 host=!!(user?.uid===room.hostUid);
 $('roomScoreSection').hidden=false;
 $('roomWho').textContent=`${room.name||'Dagger Money Room'} · ${roomLabel()} · ${room.players.join(' / ')} · ${room.format.toUpperCase()} · $${room.stake} unit${room.archived?' · ARCHIVED':''}`;
 $('roomHostName').value=room.hostName||'Scorekeeper';
 $('roomHole').innerHTML=Array.from({length:18},(_,i)=>`<option value="${i+1}">Hole ${i+1}</option>`).join('');
 const pending=Array.from({length:18},(_,i)=>i+1).find(i=>!room.holes?.[i])||18;
 $('roomHole').value=String(pending);
 $('roomScoreHead').innerHTML='<tr><th>Player</th><th>Strokes</th></tr>';
 const h=Number($('roomHole').value);buildInputs(h);
 const x=compute(room);
 $('roomStandings').textContent=room.players.map((name,i)=>`${name}: ${money(x.totals[i])}`).join(' · ')+(room.format==='skins'?` · ${x.carry} skin(s) in next pot`:'')+` · ${x.settled} holes scored`;
 $('roomAudit').textContent=room.lastChange?`Last updated ${new Date(room.lastChange).toLocaleString()} by ${room.lastEditor||'scorekeeper'}. Score history includes the current official value for each hole.`:'';
 $('roomSaveHole').disabled=!host||room.archived;
 $('roomFinish').disabled=!host||room.archived;
 $('roomHole').disabled=!host||room.archived;
 }
function buildInputs(h){const scores=room?.holes?.[h]||[];$('roomScoreRows').innerHTML='';(room?.players||[]).forEach((name,i)=>{const tr=document.createElement('tr'),first=document.createElement('td'),td=document.createElement('td'),input=document.createElement('input');first.textContent=name;input.type='number';input.min='1';input.max='20';input.inputMode='numeric';input.dataset.player=String(i);input.value=scores[i]||'';input.disabled=!host||room.archived;td.append(input);tr.append(first,td);$('roomScoreRows').append(tr);});}
$('roomHole').onchange=()=>{if(room)buildInputs(Number($('roomHole').value));};
function archiveLocal(){if(!room)return;const k='dagger_room_archives',old=JSON.parse(localStorage.getItem(k)||'[]');const item={...room,roomId,ended:Date.now(),payouts:compute(room).totals};const i=old.findIndex(v=>v.roomId===roomId);if(i>=0)old[i]=item;else old.push(item);localStorage.setItem(k,JSON.stringify(old));}
function roomLink(){const url=new URL(window.location.href);url.searchParams.set('room',roomId);url.searchParams.set('invite',invite);return url.toString();}
function parseInvite(input){let s=input.trim();try{const url=new URL(s);return {id:url.searchParams.get('room')||'',code:url.searchParams.get('invite')||''};}catch{}let [id,code]=s.split(':');return{id:id||'',code:code||''};}
const rand=(size)=>{const a=new Uint8Array(size);crypto.getRandomValues(a);return [...a].map(b=>b.toString(16).padStart(2,'0')).join('');};
async function connect(id){if(roomUnsub)roomUnsub();roomId=id;
 const {doc,onSnapshot}=functions;
 roomUnsub=onSnapshot(doc(db,'rooms',id),snap=>{if(!snap.exists()){status('Room not found, or access denied.');return;}room=snap.data();status('LIVE · Updates delivered across connected phones · '+roomLabel());render();},err=>status('Could not subscribe: '+err.message));
}
async function create(){try{
 if(!db)throw Error('Live syncing is not configured. Follow SETUP_FIREBASE.md.');
 const me=$('roomMe').value.trim();const others=$('roomPlayers').value.split(',').map(x=>x.trim()).filter(Boolean);const players=[me,...others];
 const format=$('roomFormat').value,needed=format==='vegas'?4:format==='hole'||format==='nassau'?2:null;
 if(!me||players.length<2||players.length>4||new Set(players.map(n=>n.toLowerCase())).size!==players.length)throw Error('Enter 2–4 distinct golfer names including yourself.');
 if(needed&&players.length!==needed)throw Error(`${format} requires ${needed} players.`);
 const stake=Number($('roomStake').value);if(!Number.isFinite(stake)||stake<0||stake>10000)throw Error('Invalid stake.');
 const {doc,setDoc}=functions;const id=rand(16),code=rand(8);const model={name:'Dagger Country Club Money Room',hostUid:user.uid,hostName:me,players,format,stake,invite:code,holes:{},archived:false,created:Date.now(),lastChange:Date.now(),lastEditor:me};
 await setDoc(doc(db,'rooms',id),model);await setDoc(doc(db,'rooms',id,'members',user.uid),{uid:user.uid,name:me,invite:code,joined:Date.now()});invite=code;room=model;$('roomCode').value=id+':'+code;await connect(id);status('Money Room created. You are the ONLY scorekeeper. Share the invitation link.');
 }catch(e){status('Could not create room: '+e.message);}}
async function join(){try{
 if(!db)throw Error('Live syncing is not configured. Follow SETUP_FIREBASE.md.');
 const {id,code}=parseInvite($('roomCode').value);if(!/^[0-9a-f]{32}$/.test(id)||!/^[0-9a-f]{16}$/.test(code))throw Error('Paste the full invitation link or ID:code.');
 const name=$('roomMe').value.trim()||'Guest';if(name.length>24)throw Error('Name is too long.');
 const {doc,setDoc}=functions;await setDoc(doc(db,'rooms',id,'members',user.uid),{uid:user.uid,name,invite:code,joined:Date.now()});invite=code;await connect(id);status('Joined room. You can watch the scorekeeper update each hole.');
 }catch(e){status('Unable to join: '+e.message);}}
$('roomCreate').onclick=create;$('roomJoin').onclick=join;
$('roomCopy').onclick=async()=>{if(!roomId){status('Create or join a room first.');return;}try{if(navigator.share)await navigator.share({title:'Dagger Money Room',url:roomLink()});else await navigator.clipboard.writeText(roomLink());}catch{status('Copy the room link manually: '+roomLink());}};
$('roomSaveHole').onclick=async()=>{try{if(!host||room.archived)throw Error('Only the active scorekeeper may edit.');const hole=Number($('roomHole').value);const scores=[...$('roomScoreRows').querySelectorAll('input')].map(e=>Number(e.value));if(scores.some(n=>!Number.isInteger(n)||n<1||n>20))throw Error('Enter a valid stroke score for every player.');const holes={...(room.holes||{}),[hole]:scores};await functions.updateDoc(functions.doc(db,'rooms',roomId),{holes,lastEditor:room.hostName,lastChange:Date.now()});status('Hole '+hole+' recorded and sent to connected members.');}catch(e){status('Save failed: '+e.message);}};
$('roomFinish').onclick=async()=>{if(!host||room.archived)return;if(!confirm('Archive this match for everyone? Future edits will be locked.'))return;try{await functions.updateDoc(functions.doc(db,'rooms',roomId),{archived:true,lastChange:Date.now()});archiveLocal();status('Match archived. Scorekeeper can no longer edit it.');}catch(e){status('Archive failed: '+e.message);}};
async function init(){if(!isConfigured){status('Local mode · Live sync is not configured. See SETUP_FIREBASE.md. Local games and Betting still work.');return;}
 try{
 const appMod=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js');
 const authMod=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js');
 const fsMod=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js');
 const app=appMod.initializeApp(firebaseConfig);auth=authMod.getAuth(app);db=fsMod.getFirestore(app);functions=fsMod;
 user=(await authMod.signInAnonymously(auth)).user;
 status('Live sync ready. Create a Money Room, or paste an invite and join.');
 const url=new URL(window.location.href);let id=url.searchParams.get('room'),code=url.searchParams.get('invite');if(id&&code){$('roomCode').value=id+':'+code;status('Invite detected. Enter your name and tap Join room.');}
 }catch(e){status('Live sync unavailable: '+e.message+'. Check Firebase setup and network.');}}
init();
