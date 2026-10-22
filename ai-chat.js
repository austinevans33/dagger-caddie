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
let conversation=[],working=false,authPromise=null;
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
const URL='https://us-central1-dagger-caddie-money-room.cloudfunctions.net/caddieChat';
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
