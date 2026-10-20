import {firebaseConfig} from './firebase-config.js';
const $=id=>document.getElementById(id);
const caddies={keith:'Keith',reginald:'Reginald',vinny:'Vinny',kyle:'Kyle'};
let conversation=[],working=false,authPromise=null;
const abuseSelect = document.getElementById('aiAbuseLevel');
const savedAbuse = localStorage.getItem('dagger_ai_abuse');
abuseSelect.value = ['1','2','3'].includes(savedAbuse) ? savedAbuse : '3';
abuseSelect.addEventListener('change', () => {
  localStorage.setItem('dagger_ai_abuse', abuseSelect.value);
});
const URL='https://us-central1-dagger-caddie-money-room.cloudfunctions.net/caddieChat';
const ui={status:$('aiStatus'),history:$('aiHistory'),field:$('aiInput'),send:$('aiSend'),mic:$('aiMic'),speak:$('aiSpeak')};
function activeCaddie(){const el=document.querySelector('.staff-pick.active');return el?.dataset?.caddie||'keith';}
function add(role,content){
  const p=document.createElement('div');
  p.className='ai-bubble '+role;
  const label=document.createElement('strong');
  label.textContent=role==='user'?'You':caddies[activeCaddie()]||'Caddie';
  const text=document.createElement('div');
  text.textContent=content;
  p.append(label,text);
  ui.history.append(p);

  if(role==='assistant'){
    requestAnimationFrame(()=>{
      const top=p.getBoundingClientRect().top;
      const containerTop=ui.history.getBoundingClientRect().top;
      ui.history.scrollTop+=top-containerTop-8;
    });
  }else{
    ui.history.scrollTop=ui.history.scrollHeight;
  }
}
function context(){let clubs='';try{const p=JSON.parse(localStorage.getItem('dagger_profile')||'[]');if(Array.isArray(p))clubs=p.map(x=>`${x.name}: ${x.manualCarry??x.carry??'?'} yd`).join(', ').slice(0,1200);}catch{};
let money='';try{money=$('roomStandings')?.textContent?.slice(0,300)||'';}catch{}
return {yardage:$('yards')?.value,lie:document.querySelector('#lieButtons .active')?.textContent||'',wind:document.querySelector('#windButtons .active')?.textContent||'',pin:document.querySelector('#pinButtons .active')?.textContent||'',hazard:document.querySelector('#dangerButtons .active')?.textContent||'',clubs,money};}
async function getAuth(){if(authPromise)return authPromise;authPromise=(async()=>{const [{initializeApp,getApps},{getAuth,signInAnonymously,onAuthStateChanged}]=await Promise.all([import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js')]);const app=getApps().length?getApps()[0]:initializeApp(firebaseConfig);const auth=getAuth(app);if(auth.currentUser)return auth.currentUser;return (await signInAnonymously(auth)).user;})();try{return await authPromise}catch(e){authPromise=null;throw e;}}
function speak(txt){if(!('speechSynthesis'in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(txt);u.rate=.95;u.lang='en-US';window.speechSynthesis.speak(u);}
async function send(){const text=ui.field.value.trim();if(!text||working)return;working=true;ui.send.disabled=true;ui.status.textContent='Your caddie is considering his words…';ui.field.value='';add('user',text);conversation.push({role:'user',content:text});conversation=conversation.slice(-12);
try{const user=await getAuth();const token=await user.getIdToken();const r=await fetch(URL,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({caddie:activeCaddie(),messages:conversation.slice(-12).map(m=>({
  role:m.role,
  content:m.content.slice(0,950)
})),context:context(),abuseLevel:Number(abuseSelect.value)})});const j=await r.json();if(!r.ok)throw Error(j.error||'Could not connect');conversation.push({role:'assistant',content:j.reply});add('assistant',j.reply);ui.status.textContent='Conversation active · Ask a follow-up';if(ui.speak.checked)speak(j.reply);}catch(e){ui.status.textContent='AI not connected: '+e.message+' · Manual caddie remains available.';conversation.pop();}
finally{working=false;ui.send.disabled=false;}}
ui.send.addEventListener('click',send);ui.field.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}});
$('aiReset').addEventListener('click',()=>{conversation=[];ui.history.replaceChildren();ui.status.textContent='New conversation · Ready to listen';window.speechSynthesis?.cancel();});
ui.mic.addEventListener('click',()=>{const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){ui.status.textContent='Speech recognition unavailable in Safari. Type here or use your keyboard microphone.';ui.field.focus();return;}const r=new SR();r.lang='en-US';r.onstart=()=>{ui.status.textContent='● LIVE MICROPHONE — SPEAK NOW';ui.mic.classList.add('listening');};r.onresult=e=>{ui.field.value=e.results[0][0].transcript;ui.status.textContent='Heard you · Tap Send or edit';};r.onerror=e=>{ui.status.textContent='Microphone error: '+e.error+' · Use keyboard dictation';};r.onend=()=>ui.mic.classList.remove('listening');try{r.start()}catch{ui.status.textContent='Microphone unavailable · Type instead';}});
document.querySelectorAll('.staff-pick').forEach(b=>b.addEventListener('click',()=>{$('aiHeading').textContent='Talk to '+caddies[activeCaddie()];conversation=[];ui.history.replaceChildren();ui.status.textContent='New caddie selected · Start talking';}));
