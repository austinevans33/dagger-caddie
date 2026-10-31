import {mountSoloScorecard} from './solo-scorecard-ui.js?v=coverage-15';
import {readSoloCard} from './solo-scorecard.js?v=premium-paper-9';
import {buildCaddyTarget} from './caddy-target-policy.js';
import {getRoundEnvironment} from './round-environment.js?v=coverage-15';
import {readActiveRound} from './starters-desk-session.js';
import {sameCourseSelection} from './course-identity.js';
import {createCaddyCourseBriefing} from './caddy-course-briefing.js';
import {needsCaddyEnvironmentRefresh,safeCaddyEnvironment} from './caddy-environment-policy.js';
import {createShotRecordContext} from './shot-record-context.js';
import {describeCaddyConditions,mountCaddyConditions} from './caddy-conditions-ui.js';
import {mountStartersDesk} from './starters-desk-ui.js?v=coverage-15';
import {firebaseConfig} from './firebase-config.js';
import {
  getFirestore,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
const $=id=>document.getElementById(id);
const caddies={keith:'Keith',reginald:'Reginald',vinny:'Vinny',kyle:'Kyle'};
/* Frontend-only Caddy layout. Injected here to preserve frozen R160 index.html. */
const daggerAdviceStyle = document.createElement('style');
daggerAdviceStyle.textContent = `
.dcc-advice-card{display:grid;gap:10px;min-width:0}
.dcc-advice-card section{min-width:0}
.dcc-advice-label{font-size:10px;font-weight:800;letter-spacing:.13em;opacity:.75;margin-bottom:5px}
.dcc-advice-copy{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.45}
.dcc-advice-club{padding:17px 18px;border-radius:12px;background:#143a2f;color:#f7efd9;border:1px solid #b99a5d}
.dcc-advice-club .dcc-advice-label{color:#e1bf78;opacity:1}
.dcc-advice-club .dcc-advice-copy{font-size:clamp(23px,5vw,32px);font-weight:800;line-height:1.13;letter-spacing:-.025em}
.dcc-advice-detail{padding:0 2px}
.dcc-advice-hilarity{border-left:3px solid #b99a5d;padding:10px 12px;background:rgba(185,154,93,.12);border-radius:0 8px 8px 0}
.dcc-advice-hilarity .dcc-advice-copy{font-style:italic}
@media(max-width:480px){.dcc-advice-card{gap:9px}.dcc-advice-club{padding:14px 15px}}
`;
document.head.append(daggerAdviceStyle);

// New visits begin on Play. Keep room invitation deep links untouched.
if (!window.location.search && !window.location.hash) {
  document.getElementById('tab-play')?.click();
}

let conversation=[],working=false,authPromise=null;
let activeRoundEnvironment=null;
let roundEnvironmentFetchedAt=0;
let roundEnvironmentLoading=null;
let roundEnvironmentLoadingSelection=null;
let conditionsUI=null;
function renderCaddyConditions(loading=false){
 if(!conditionsUI)return;
 const active=readActiveRound(localStorage);
 const selectedHole=readSoloCard(localStorage)?.hole;
 const safe=safeCaddyEnvironment(active,activeRoundEnvironment,roundEnvironmentFetchedAt);
 conditionsUI.render(describeCaddyConditions(active?{...active,holeNumber:selectedHole||active.selection.holeNumber}:null,safe,{fetchedAt:roundEnvironmentFetchedAt,loading}));
 conditionsUI.setLoading(loading);
}
async function refreshCaddyRoundEnvironment(){
 const active=readActiveRound(localStorage);
 if(!active){activeRoundEnvironment=null;roundEnvironmentFetchedAt=0;renderCaddyConditions();return null;}
 // Share in-flight requests only for the same course and tee, never a previous round.
 if(roundEnvironmentLoading&&roundEnvironmentLoadingSelection&&sameCourseSelection(active.selection,roundEnvironmentLoadingSelection))return roundEnvironmentLoading;
 const selection=active.selection;
 renderCaddyConditions(true);
 const pending=getRoundEnvironment({storage:localStorage}).then(result=>{
  const current=readActiveRound(localStorage);
  if(current&&result.selection&&sameCourseSelection(current.selection,result.selection)&&result.state!=='selection-changed'){
   activeRoundEnvironment=result;
   roundEnvironmentFetchedAt=Date.now();
   renderCaddyConditions();
   document.dispatchEvent(new CustomEvent('dcc:round-environment',{detail:result}));
   return result;
  }
  if(!current){activeRoundEnvironment=null;roundEnvironmentFetchedAt=0;}
  return null;
 }).catch(()=>{const current=readActiveRound(localStorage);if(current&&sameCourseSelection(current.selection,selection)){activeRoundEnvironment=null;roundEnvironmentFetchedAt=0;}return null;});
 roundEnvironmentLoading=pending;
 roundEnvironmentLoadingSelection=selection;
 try{return await pending;}
 finally{if(roundEnvironmentLoading===pending){roundEnvironmentLoading=null;roundEnvironmentLoadingSelection=null;}renderCaddyConditions();}
}
document.addEventListener('dcc:course-cleared',()=>{activeRoundEnvironment=null;roundEnvironmentFetchedAt=0;renderCaddyConditions();});
document.addEventListener('dcc:course-selected',()=>{activeRoundEnvironment=null;roundEnvironmentFetchedAt=0;renderCaddyConditions();void refreshCaddyRoundEnvironment();});
document.addEventListener('dcc:round-environment',event=>{
 const incoming=event.detail,active=readActiveRound(localStorage);
 if(active&&incoming?.selection&&sameCourseSelection(active.selection,incoming.selection)){activeRoundEnvironment=incoming;roundEnvironmentFetchedAt=Date.now();renderCaddyConditions();}
});
conditionsUI=mountCaddyConditions({onRefresh:refreshCaddyRoundEnvironment});
document.addEventListener('dcc:solo-hole-change',()=>renderCaddyConditions());
renderCaddyConditions();
let latestMemoryCandidate = null;

let shotQuality = null;
let shotHorizontal = null;
let shotVertical = null;

function refreshShotClubs() {
  const select = document.getElementById('aiShotClub');
  if (!select) return;

  const previous = select.value;
  let clubs = [];

  try {
    const saved = JSON.parse(
      localStorage.getItem('dagger_profile') || '[]'
    );

    if (Array.isArray(saved)) {
      clubs = saved
        .filter(club =>
          club &&
          typeof club.name === 'string' &&
          club.name.trim()
        )
        .map(club => club.name.trim());
    }
  } catch (error) {
    console.warn('Could not read saved golf bag:', error);
  }

  select.replaceChildren(
    new Option(
      clubs.length ? 'Select club' : 'No clubs in bag',
      ''
    )
  );

  [...new Set(clubs)].forEach(name => {
    select.add(new Option(name, name));
  });

  if (clubs.includes(previous)) {
    select.value = previous;
  }
}

refreshShotClubs();

// Refresh the list whenever the golfer opens the selector.
document.getElementById('aiShotClub')
  .addEventListener('focus', refreshShotClubs);

// Also refresh after returning to the app.
window.addEventListener('pageshow', refreshShotClubs);


const shotReport = {
  quality: document.querySelectorAll('#aiShotQuality [data-quality]'),
  miss: document.querySelectorAll('#aiShotMiss [data-miss]'),
  record: document.getElementById('aiRecordShot'),
  status: document.getElementById('aiShotStatus')
};

function updateShotReport() {
  shotReport.quality.forEach(button => {
    const selected = button.dataset.quality === shotQuality;
    button.style.background = selected ? '#b79c62' : '';
    button.style.color = selected ? '#143126' : '';
    button.setAttribute('aria-pressed', String(selected));
  });

  shotReport.miss.forEach(button => {
    const selected =
      button.dataset.miss === shotHorizontal ||
      button.dataset.miss === shotVertical;

    button.style.background = selected ? '#b79c62' : '';
    button.style.color = selected ? '#143126' : '';
    button.setAttribute('aria-pressed', String(selected));
  });

  shotReport.record.disabled = !shotQuality;

  const details = [shotQuality, shotHorizontal, shotVertical].filter(Boolean);

  shotReport.status.textContent = shotQuality
    ? 'Selected: ' + details.join(' · ') + '. Ready to record.'
    : 'Select Good or Bad, then optionally select where it missed.';
}

shotReport.quality.forEach(button => {
  button.addEventListener('click', () => {
    shotQuality = button.dataset.quality;
    updateShotReport();
  });
});

shotReport.miss.forEach(button => {
  button.addEventListener('click', () => {
    const miss = button.dataset.miss;

    if (miss === 'Left' || miss === 'Right') {
      shotHorizontal = shotHorizontal === miss ? null : miss;
    } else {
      shotVertical = shotVertical === miss ? null : miss;
    }

    updateShotReport();
  });
});

updateShotReport();

shotReport.record.addEventListener('click', () => {
  if (!shotQuality) return;

  const activeShotRound=readActiveRound(localStorage);
  const shotHole=Number(readSoloCard(localStorage)?.hole??activeShotRound?.selection?.holeNumber);
  const shotCourseContext=createShotRecordContext(activeShotRound,shotHole,activeRoundEnvironment,roundEnvironmentFetchedAt);
  const report = {
    result: [shotQuality, shotHorizontal, shotVertical]
      .filter(Boolean).join(' · '),
    quality: shotQuality,
    horizontal: shotHorizontal,
    vertical: shotVertical,
    
club: document.getElementById('aiShotClub').value || 'Club not selected',
yards: Number(document.getElementById('aiShotYards').value) || null,
caddie: activeCaddie(),
source: 'ai-chat',
courseContext:shotCourseContext,
date: new Date().toISOString()

  };

  try {
    const key = 'dagger_shot_log';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');

    if (!Array.isArray(existing)) {
      throw new Error('Shot history is invalid.');
    }

    existing.push(report);
    localStorage.setItem(key, JSON.stringify(existing));

    shotQuality = null;
shotHorizontal = null;
shotVertical = null;

document.getElementById('aiShotYards').value = '';

updateShotReport();

    shotReport.status.textContent =
      'Shot recorded: ' + report.result +
      '. Saved to this device.';
  } catch (error) {
    shotReport.status.textContent =
      'Could not record shot: ' + error.message;
  }
});


const abuseSelect = document.getElementById('aiAbuseLevel');
const savedAbuse = localStorage.getItem('dagger_ai_abuse');
abuseSelect.value = ['1','2','3'].includes(savedAbuse) ? savedAbuse : '3';
abuseSelect.addEventListener('change', () => {
  localStorage.setItem('dagger_ai_abuse', abuseSelect.value);
});
let memoryDb = null;

async function getMemoryDb() {
  if (memoryDb) return memoryDb;

  const { initializeApp, getApps } = await import(
    'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'
  );

  const app = getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig);

  memoryDb = getFirestore(app);
  return memoryDb;
}
const URL=`https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/caddieChat`;
const ui={
  status:$('aiStatus'),
  history:$('aiHistory'),
  field:$('aiInput'),
  send:$('aiSend'),
  mic:$('aiMic'),
  speak:$('aiSpeak'),
  saveMemory:$('aiSaveMemory')
};

// DCC 5.2 — Autofill explicit target yardage from golfer messages.

function autofillShotYardage(message) {
  const text = String(message || '').trim();
  
  // Only recognize distances explicitly described as the target.
  const patterns = [
    /\b(?:i'm|im|we're|were)\s+(\d{1,3})\s*(?:yards?|yds?)?\s*out\b/i,
    /\b(\d{1,3})\s*(?:yards?|yds?)?\s*(?:out|to the (?:pin|flag|hole|green))\b/i,
    /\b(?:distance to (?:the )?(?:pin|flag|hole|green)|yards to target)\s*(?:is|:)?\s*(\d{1,3})\b/i
  ];

  const match = patterns
    .map(pattern => text.match(pattern))
    .find(Boolean);

  if (!match) return;

  const yards = Number(match[1]);
  if (yards < 1 || yards > 700) return;

  const shotYards = document.getElementById('aiShotYards');
  const riskYards = document.getElementById('riskYards');

  if (shotYards) shotYards.value = String(yards);
  if (riskYards) riskYards.value = String(yards);
}

// DCC 5.2 — Suggest a club from the golfer's explicit choice.
function autofillShotClub(message) {
  const text = String(message || '').toLowerCase();
  
const spokenNumbers = {
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  ten: '10'
};

const normalized = text.replace(
  /\b(one|two|three|four|five|six|seven|eight|nine|ten)(?=[\s-]+(?:iron|hybrid|wood)\b)/g,
  word => spokenNumbers[word]
);

  const select = document.getElementById('aiShotClub');
  if (!select) return;

  // Only act when the golfer describes choosing or using a club.
  
const choice = normalized.match(
  /\b(?:hitting|playing|using|taking|hit|played|used|take)\s+(?:my|the|a|an)?\s*(\d{1,2})[\s-]*(iron|hybrid|wood)\b/i
);


  if (!choice) return;

  refreshShotClubs();

  const number = choice[1];
  const type = choice[2].toLowerCase();

  
const option = Array.from(select.options).find(opt => {
  const name = opt.value.toLowerCase().trim();

  const aliases = {
    iron: ['iron', 'i'],
    hybrid: ['hybrid', 'h'],
    wood: ['wood', 'w']
  };

  return aliases[type].some(alias => {
    const pattern = new RegExp(
      '(?:^|[^a-z0-9])' +
      number +
      '[\\s-]*' +
      alias +
      '(?![a-z0-9])',
      'i'
    );

    return pattern.test(name);
  });
});


  if (option) {
    select.value = option.value;
  }
}

function activeCaddie(){const el=document.querySelector('.staff-pick.active');return el?.dataset?.caddie||'keith';}
// Dagger advice card: visual-only parser. Preserve the full original reply when labels differ.
function renderDaggerAdvice(target, reply) {
  const original = String(reply ?? '');
  const normalized = original.replace(/\r\n/g, '\n');
  const label = /(?:^|\n)\s*(?:\*\*)?\s*(CLUB(?: SELECTION)?|SHOT(?: PLAN)?|WHY|HILARITY|THE CADDY SAYS)\s*(?:\*\*)?\s*[:—-]\s*/gim;
  const matches = [...normalized.matchAll(label)];
  const plain = () => { target.textContent = original; };
  if (!matches.length || !matches.some(m => /^CLUB/i.test(m[1]))) { plain(); return; }
  const sections = {};
  matches.forEach((m, i) => {
    const key = /^CLUB/i.test(m[1]) ? 'club' : /^SHOT/i.test(m[1]) ? 'shot' : /^WHY/i.test(m[1]) ? 'why' : 'hilarity';
    const start = m.index + m[0].length;
    const end = i+1 < matches.length ? matches[i+1].index : normalized.length;
    const value = normalized.slice(start,end).trim();
    if(value) sections[key] = sections[key] ? sections[key]+'\n'+value : value;
  });
  if (!sections.club) { plain(); return; }
  // Keep any introductory prose rather than silently discarding generated advice.
  const intro = normalized.slice(0,matches[0].index).trim();
  const card = document.createElement('div');
  card.className = 'dcc-advice-card';
  const section = (className,heading,value) => {
    if (!value) return;
    const el=document.createElement('section'); el.className=className;
    const h=document.createElement('div');h.className='dcc-advice-label';h.textContent=heading;
    const body=document.createElement('div');body.className='dcc-advice-copy';body.textContent=value;
    el.append(h,body);card.append(el);
  };
  if(intro) section('dcc-advice-intro','CADDY NOTE',intro);
  section('dcc-advice-club','CLUB SELECTION',sections.club);
  section('dcc-advice-detail','SHOT',sections.shot);
  section('dcc-advice-detail','WHY',sections.why);
  section('dcc-advice-hilarity','THE CADDY SAYS',sections.hilarity);
  target.replaceChildren(card);
}
function add(role,content){
  const p=document.createElement('div');
  p.className='ai-bubble '+role;
  const label=document.createElement('strong');
  label.textContent=role==='user'?'You':caddies[activeCaddie()]||'Caddie';
  const text=document.createElement('div');
  if(role==='assistant') renderDaggerAdvice(text,content);
  else text.textContent=content;
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
const holeNumber=Number((readSoloCard(localStorage)?.hole ?? document.getElementById('hole')?.value));
const courseBriefing=createCaddyCourseBriefing(safeCaddyEnvironment(readActiveRound(localStorage),activeRoundEnvironment,roundEnvironmentFetchedAt),holeNumber);
const aim=buildCaddyTarget({remainingYards:$('yards')?.value,lie:document.querySelector('#lieButtons .active')?.textContent||''});
return {aimTarget:aim?.target||'center-green',remainingDistanceSource:aim?.distanceSource||'golfer-needed',courseBriefing:courseBriefing?.slice(0,900)||null,yardage:$('yards')?.value,lie:document.querySelector('#lieButtons .active')?.textContent||'',wind:document.querySelector('#windButtons .active')?.textContent||'',pin:document.querySelector('#pinButtons .active')?.textContent||'',hazard:document.querySelector('#dangerButtons .active')?.textContent||'',clubs,money};}
async function getAuth() {
  if (!authPromise) {
    authPromise = (async () => {
      const [{initializeApp, getApps}, {getAuth}] =
        await Promise.all([
          import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
          import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js')
        ]);

      const app = getApps().length
        ? getApps()[0]
        : initializeApp(firebaseConfig);

      return getAuth(app);
    })();
  }

  try {
    const auth = await authPromise;

    // Wait for Firebase to restore the saved account.
    await auth.authStateReady();

    // Always return the CURRENT identity, not a cached user.
    return auth.currentUser;
  } catch (error) {
    authPromise = null;
    throw error;
  }
}
function speak(txt){if(!('speechSynthesis'in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(txt);u.rate=.95;u.lang='en-US';window.speechSynthesis.speak(u);}
async function send() {
  const text = ui.field.value.trim();
  if (!text || working) return;
  autofillShotYardage(text);
  autofillShotClub(text);

  working = true;
  ui.send.disabled = true;

  // A new question replaces the previous memory candidate.
  latestMemoryCandidate = null;
  ui.saveMemory.disabled = true;

  ui.status.textContent =
    'Your caddie is considering his words…';ui.field.value='';add('user',text);conversation.push({role:'user',content:text});conversation=conversation.slice(-12);
try {
  const user = await getAuth();

  if (!user) {
    throw new Error(
      'Please sign in under Club → Golfer Account.'
    );
  }

  // Restore course and conditions when returning to the app before asking a Caddy.
  const selectedRound=readActiveRound(localStorage);
  if(selectedRound&&needsCaddyEnvironmentRefresh(selectedRound,activeRoundEnvironment,roundEnvironmentFetchedAt)){
   await refreshCaddyRoundEnvironment();
  }
  const token = await user.getIdToken();const r=await fetch(URL,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({caddie:activeCaddie(),messages:conversation.slice(-12).map(m=>({
  role:m.role,
  content:m.content.slice(0,950)
})),context:context(),abuseLevel:Number(abuseSelect.value)})});const j=await r.json();if(!r.ok)throw Error(j.error||'Could not connect');conversation.push({role:'assistant',content:j.reply});
add('assistant',j.reply);

latestMemoryCandidate = {
  golferStatement: text,
  caddieResponse: j.reply
};

ui.saveMemory.disabled = false;

ui.status.textContent =
  'Conversation active · Ask a follow-up';

if (ui.speak.checked) speak(j.reply);

} catch(e) {
  ui.status.textContent =
    'AI not connected: ' + e.message +
    ' · Manual caddie remains available.';

  conversation.pop();
} finally {
  working = false;
  ui.send.disabled = false;
}
}
ui.saveMemory.addEventListener('click', async () => {
  if (!latestMemoryCandidate || working) return;

  const candidate = latestMemoryCandidate;

  const edited = window.prompt(
    'What should your caddies remember?\n\n' +
    'Edit this into one useful, lasting golf fact:',
    candidate.golferStatement.slice(0, 300)
  );

  if (edited === null) return;

  const memory = edited.trim();

  if (!memory || memory.length > 300) {
    ui.status.textContent =
      'Memory must contain 1–300 characters.';
    return;
  }

  if (!window.confirm(
    'Save this to your permanent Golfer Memory?\n\n' +
    memory
  )) return;

  ui.saveMemory.disabled = true;

  try {
    const user = await getAuth();

    if (!user || user.isAnonymous) {
      throw new Error(
        'Sign in to your permanent golfer account first.'
      );
    }

    const db = await getMemoryDb();
const uid = user.uid;
const reference = doc(db, 'golfers', uid);

if ((await getAuth())?.uid !== uid) {
  throw new Error('Account changed. Memory save canceled.');
}

    await runTransaction(db, async transaction => {
      const snapshot = await transaction.get(reference);

      if (!snapshot.exists()) {
        throw new Error('Cloud golfer profile not found.');
      }

      const memories = snapshot.data().memories || [];

      if (!Array.isArray(memories)) {
        throw new Error('Saved memories are invalid.');
      }

      if (memories.length >= 50) {
        throw new Error(
          'Golfer Memory is full (50 memories).'
        );
      }

      if (memories.includes(memory)) {
        throw new Error('That memory is already saved.');
      }

      transaction.update(reference, {
        memories: [...memories, memory],
        updatedAt: serverTimestamp()
      });
    });

    ui.status.textContent =
      'Saved! All four caddies can now use this memory.';

    latestMemoryCandidate = null;

  } catch (error) {
    ui.status.textContent =
      'Memory not saved: ' + error.message;
  } finally {
    ui.saveMemory.disabled =
      latestMemoryCandidate === null;
  }
});
ui.send.addEventListener('click',send);ui.field.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}});
$('aiReset').addEventListener('click', () => {
  conversation = [];
  latestMemoryCandidate = null;
  ui.saveMemory.disabled = true;
  ui.history.replaceChildren();
  ui.status.textContent = 'New conversation · Ready to listen';
  window.speechSynthesis?.cancel();
});
ui.mic.addEventListener('click',()=>{const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){ui.status.textContent='Speech recognition unavailable in Safari. Type here or use your keyboard microphone.';ui.field.focus();return;}const r=new SR();r.lang='en-US';r.onstart=()=>{ui.status.textContent='● LIVE MICROPHONE — SPEAK NOW';ui.mic.classList.add('listening');};r.onresult=e=>{ui.field.value=e.results[0][0].transcript;ui.status.textContent='Heard you · Tap Send or edit';};r.onerror=e=>{ui.status.textContent='Microphone error: '+e.error+' · Use keyboard dictation';};r.onend=()=>ui.mic.classList.remove('listening');try{r.start()}catch{ui.status.textContent='Microphone unavailable · Type instead';}});
document.querySelectorAll('.staff-pick').forEach(b =>
  b.addEventListener('click', () => {
    $('aiHeading').textContent =
      'Talk to ' + caddies[activeCaddie()];

    conversation = [];
    latestMemoryCandidate = null;
    ui.saveMemory.disabled = true;
    ui.history.replaceChildren();
    ui.status.textContent =
      'New caddie selected · Start talking';
  })
);

// Opt-in preview until a verified course/tee catalog is available.
mountStartersDesk();
mountSoloScorecard();
// Reopening Dagger must restore the existing check-in without another selection.
if(readActiveRound(localStorage))refreshCaddyRoundEnvironment();

