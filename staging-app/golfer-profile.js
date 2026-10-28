import { firebaseConfig } from './firebase-config.js';

import {
  initializeApp,
  getApps
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';

import {
  getAuth,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

// Keep this inside the existing Player's Locker.
// Do not change the current Locker or local golf data.
const locker = document.getElementById('playersLocker');

const section = document.createElement('div');
section.className = 'notice-card';
section.style.margin = '12px 0';
section.style.padding = '14px';

section.style.background = '#173528';
section.style.color = '#f5ead4';
section.style.border = '1px solid #b79c62';
section.style.borderRadius = '14px';


section.innerHTML = `

  <details class="dcc-handicap-details">
   


<summary style="cursor:pointer;list-style:none;color:#f3e9d3;padding:3px 0;">

  <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #536b57;padding-bottom:10px;margin-bottom:12px;">
    <span style="font:700 11px system-ui;letter-spacing:1.5px;color:#d8ba77;">
      DCC / MEMBER RECORD
    </span>
    <span style="font:700 14px Georgia,serif;color:#d8ba77;">
      ◆
    </span>
  </div>

  <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
    <div>
      <div style="font:500 12px system-ui;color:#d8ba77;margin-bottom:4px;">
        Handicap Index
      </div>
      <div id="golferHandicapDisplay" style="font:700 34px Georgia,serif;color:#f3e9d3;line-height:1.1;">
        —
      </div>
    </div>

    <span style="flex-shrink:0;display:inline-block;border:1px solid #b79c62;border-radius:999px;padding:9px 15px;font:700 11px system-ui;letter-spacing:1px;color:#f3e9d3;">
      EDIT ✎
    </span>
  </div>

</summary>



    <div style="padding-top:12px;">

  <label for="golferHandicap">
    Current Handicap Index
  </label>

  <input
    id="golferHandicap"
    type="number"
    inputmode="decimal"
    min="-10"
    max="54"
    step="0.1"
    placeholder="e.g. 12.2"
    disabled
  >

  <p class="tiny-print">
    Enter your official or estimated Handicap Index.
    For plus handicaps, enter a negative number
    (for example, -2.4 represents +2.4).
  </p>

  <button
    id="saveGolferProfile"
    type="button"
    class="btn-primary"
    disabled
  >
    Save Handicap to Golfer Memory
  </button>

  <div
    id="golferProfileStatus"
    class="status"
    role="status"
    aria-live="polite"
    style="margin-top:10px;"
  >
    Connecting to golfer memory...
  </div>

  <p
    id="golferProfileUpdated"
    class="tiny-print"
    style="margin-top:6px;"
  ></p>
  
    </div>
  </details>

`;

if (locker) {
  const heading = locker.querySelector('h2');
  if (heading) {
    heading.insertAdjacentElement('afterend', section);
  } else {
    locker.prepend(section);
  }
}

const $ = id => document.getElementById(id);

const field = $('golferHandicap');
const handicapDisplay = $('golferHandicapDisplay');
const saveButton = $('saveGolferProfile');
const statusField = $('golferProfileStatus');
const updatedField = $('golferProfileUpdated');

const showStatus = message => {
  statusField.textContent = message;
};

let activeUid = null;
let loading = false;

function formatHandicap(value) {
  if (typeof value !== 'number' ||
      !Number.isFinite(value)) {
    return '';
  }

  return value.toFixed(1);
}

function showUpdated(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== 'function') {
    updatedField.textContent = '';
    return;
  }

  updatedField.textContent =
    'Last updated: ' +
    timestamp.toDate().toLocaleString();
}

function setEnabled(enabled) {
  field.disabled = !enabled;
  saveButton.disabled = !enabled;
}

async function loadProfile(user) {
  const uid = user.uid;
  activeUid = uid;
  loading = true;
  setEnabled(false);
  showStatus('Loading your private golfer profile...');

  try {
    const reference = doc(db, 'golfers', uid);
    const snapshot = await getDoc(reference);

    // Ignore a response belonging to a previous login.
    if (activeUid !== uid) return;

    if (snapshot.exists()) {
      const profile = snapshot.data();

      field.value = formatHandicap(profile.handicapIndex);
      showUpdated(profile.handicapUpdatedAt);

      showStatus(
        'Golfer Memory connected. Your saved Handicap ' +
        'Index is ready.'
      );
    } else {
      field.value = '';
      updatedField.textContent = '';

      showStatus(
        'No cloud golfer profile yet. Enter your ' +
        'Handicap Index to create one.'
      );
    }
handicapDisplay.textContent = field.value || '—';
    setEnabled(true);

  } catch (error) {
    if (activeUid !== uid) return;

    showStatus(
      'Could not load Golfer Memory: ' +
      (error.message || 'Unknown error')
    );

    // Never allow saving if existing data cannot be read.
    setEnabled(false);

  } finally {
    if (activeUid === uid) loading = false;
  }
}

onAuthStateChanged(auth, user => {
  activeUid = user?.uid || null;

  if (!user || user.isAnonymous) {
    setEnabled(false);
    field.value = '';
    updatedField.textContent = '';
    handicapDisplay.textContent = '—';

    showStatus(
      'Sign in with your permanent Golfer Account ' +
      'to access shared Golfer Memory.'
    );
    return;
  }

  loadProfile(user);
});

saveButton.addEventListener('click', async () => {
  if (loading || !activeUid) return;

  const user = auth.currentUser;

  if (!user ||
      user.isAnonymous ||
      user.uid !== activeUid) {
    showStatus('Please sign in to your Golfer Account.');
    return;
  }

  const raw = field.value.trim();
  const handicap = Number(raw);

  if (
    raw === '' ||
    !Number.isFinite(handicap) ||
    handicap < -10 ||
    handicap > 54 ||
    Math.round(handicap * 10) !== handicap * 10
  ) {
    showStatus(
      'Enter a valid Handicap Index from -10.0 ' +
      'through 54.0, using one decimal place.'
    );
    return;
  }

  const uid = user.uid;
  loading = true;
  setEnabled(false);
  showStatus('Saving Handicap Index to Golfer Memory...');

  try {
    const reference = doc(db, 'golfers', uid);
    const snapshot = await getDoc(reference);

    if (auth.currentUser?.uid !== uid) {
      throw new Error('Account changed. Save canceled.');
    }

    const changes = {
      handicapIndex: handicap,
      handicapUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (snapshot.exists()) {
      // Change only handicap fields.
      // Never overwrite saved clubs or memories.
      await updateDoc(reference, changes);
    } else {
      // Create the initial profile with the fields
      // required by our Firestore security rules.
      await setDoc(reference, {
        ...changes,
        clubs: [],
        tendencies: [],
        preferences: {},
        memories: []
      });
    }

    if (auth.currentUser?.uid === uid) {
      showStatus('Handicap Index saved to Golfer Memory!');
      await loadProfile(user);
    }

  } catch (error) {
    if (auth.currentUser?.uid === uid) {
      showStatus(
        'Could not save: ' +
        (error.message || 'Unknown error')
      );
      setEnabled(true);
    }
  } finally {
    loading = false;
  }
});
