import {firebaseConfig} from './firebase-config.js';

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
  runTransaction,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

const locker = document.getElementById('playersLocker');

const section = document.createElement('div');
section.className = 'notice-card';
section.style.margin = '12px 0';
section.style.padding = '14px';

section.innerHTML = `
  <h3>Cloud Golf Bag</h3>
  <p class="muted">
    Upload this device's golf bag to your permanent
    golfer account. Nothing is automatically
    downloaded or replaced.
  </p>

  <div id="bagSyncPreview"
       class="tiny-print"
       style="white-space:pre-line;margin:10px 0;">
    Checking local bag...
  </div>

  <button id="uploadCloudBag"
          type="button"
          class="btn-primary"
          disabled>
    Upload My Bag to Cloud
  </button>

  <button id="checkCloudBag"
          type="button"
          class="btn-secondary"
          style="margin-top:8px;"
          disabled>
    Check Saved Cloud Bag
  </button>

  <p id="bagSyncStatus"
     class="status"
     role="status"
     aria-live="polite"
     style="margin-top:10px;">
    Waiting for golfer account...
  </p>
`;

if (locker) {
  const profile = document.getElementById('golferHandicap');

  if (profile) {
    const profileSection = profile.closest('.notice-card');
    profileSection?.insertAdjacentElement('afterend', section);
  } else {
    locker.insertAdjacentElement('afterbegin', section);
  }
}

const $ = id => document.getElementById(id);

const uploadButton = $('uploadCloudBag');
const checkButton = $('checkCloudBag');
const preview = $('bagSyncPreview');
const status = $('bagSyncStatus');

let busy = false;

function getLocalBag() {
  const raw = localStorage.getItem('dagger_profile');
  if (!raw) return [];

  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error('The local golf bag is not a valid list.');
  }

  if (parsed.length > 30) {
    throw new Error('Maximum 30 clubs per cloud profile.');
  }

  // Save exactly the club names and relevant carry values.
  // Do not modify the existing local profile.
  return parsed.map((club, index) => {
    if (!club || typeof club !== 'object') {
      throw new Error('Invalid club at position ' + (index + 1));
    }

    if (typeof club.name !== 'string' ||
        !club.name.trim() ||
        club.name.length > 100) {
      throw new Error('Invalid club name at position ' + (index + 1));
    }

    const saved = {name: club.name.trim()};

    for (const field of ['carry', 'manualCarry']) {
      if (club[field] != null) {
        const value = Number(club[field]);

        if (!Number.isFinite(value) ||
            value < 0 ||
            value > 400) {
          throw new Error(
            'Invalid ' + field + ' for ' + club.name
          );
        }

        saved[field] = value;
      }
    }

    return saved;
  });
}
function sameBag(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;

  return a.every((club, i) => {
    const other = b[i];
    if (!other || club.name !== other.name) return false;

    for (const field of ['carry', 'manualCarry']) {
      const x = club[field];
      const y = other[field];

      if (x == null && y == null) continue;
      if (x == null || y == null) return false;
      if (Number(x) !== Number(y)) return false;
    }

    return true;
  });
}
function describeBag(bag) {
  if (!bag.length) return 'No clubs saved on this device.';

  return bag.map(club => {
    const carry = club.manualCarry ?? club.carry;
    return club.name + ': ' +
      (carry == null ? 'carry unknown' : carry + ' yd');
  }).join('\n');
}

function showLocalBag() {
  try {
    const bag = getLocalBag();
    preview.textContent =
      'LOCAL BAG — ' + bag.length + ' clubs\n\n' +
      describeBag(bag);
    return bag;
  } catch (error) {
    preview.textContent = error.message;
    return [];
  }
}

function activeMember() {
  const user = auth.currentUser;

  if (!user || user.isAnonymous) {
    throw new Error('Sign in with your permanent golfer account.');
  }

  return user;
}

function updateButtons() {
  const signedIn = !!auth.currentUser &&
    !auth.currentUser.isAnonymous;

  uploadButton.disabled =
    busy || !signedIn || showLocalBag().length === 0;

  checkButton.disabled = busy || !signedIn;
}

onAuthStateChanged(auth, user => {
  if (user && !user.isAnonymous) {
    status.textContent = 'Permanent golfer account connected.';
  } else {
    status.textContent =
      'Sign in with your permanent golfer account first.';
  }

  updateButtons();
});

checkButton.addEventListener('click', async () => {
  if (busy) return;

  busy = true;
  updateButtons();

  try {
    const user = activeMember();
    const uid = user.uid;

    status.textContent = 'Checking cloud golf bag...';

    const snapshot = await getDoc(doc(db, 'golfers', uid));

    if (auth.currentUser?.uid !== uid) {
      throw new Error('Account changed during check.');
    }

    if (!snapshot.exists()) {
      status.textContent = 'No cloud golfer profile exists yet.';
      return;
    }

    const clubs = snapshot.data().clubs || [];

    status.textContent =
      'CLOUD BAG — ' + clubs.length + ' clubs:\n' +
      describeBag(clubs);

    status.style.whiteSpace = 'pre-line';

  } catch (error) {
    status.textContent = 'Check failed: ' + error.message;
  } finally {
    busy = false;
    updateButtons();
  }
});

uploadButton.addEventListener('click', async () => {
  if (busy) return;

  busy = true;
  updateButtons();

  try {
    const user = activeMember();
    const uid = user.uid;
    const bag = getLocalBag();

    if (!bag.length) {
      throw new Error('Local bag is empty. Nothing uploaded.');
    }

    const reference = doc(db, 'golfers', uid);
    const before = await getDoc(reference);

    if (!before.exists()) {
      throw new Error(
        'Save your Handicap Index first to create ' +
        'your cloud golfer profile.'
      );
    }

    const previousClubs = before.data().clubs || [];

    if (previousClubs.length) {
      const proceed = window.confirm(
        'Your cloud profile already contains ' +
        previousClubs.length + ' clubs. Uploading will ' +
        'replace only the cloud club list, not your ' +
        'handicap or memories. Continue?'
      );

      if (!proceed) {
        status.textContent = 'Upload canceled.';
        return;
      }
    } else {
      const proceed = window.confirm(
        'Upload ' + bag.length + ' clubs from this ' +
        'device to your permanent golfer account? ' +
        'Your local bag will not change.'
      );

      if (!proceed) {
        status.textContent = 'Upload canceled.';
        return;
      }
    }

    if (auth.currentUser?.uid !== uid) {
      throw new Error('Account changed. Upload canceled.');
    }

    status.textContent = 'Uploading your bag securely...';

    await runTransaction(db, async transaction => {
      const snapshot = await transaction.get(reference);

      if (!snapshot.exists()) {
        throw new Error('Cloud golfer profile disappeared.');
      }

      // Prevent accidental overwrite if another device
      // changed the cloud bag while we were confirming.
      const currentClubs = snapshot.data().clubs || [];

      if (!sameBag(currentClubs, previousClubs)) {
        throw new Error(
          'Cloud bag changed on another device. ' +
          'Check it again before uploading.'
        );
      }

      transaction.update(reference, {
        clubs: bag,
        updatedAt: serverTimestamp()
      });
    });

    const verified = await getDoc(reference);
    const cloudClubs = verified.data()?.clubs || [];

    if (!sameBag(cloudClubs, bag)) {
      throw new Error(
        'Upload finished but verification was inconclusive.'
      );
    }

    status.textContent =
      'SUCCESS! ' + cloudClubs.length +
      ' clubs verified in your cloud golfer profile.';

  } catch (error) {
    status.textContent = 'Upload issue: ' + error.message;
  } finally {
    busy = false;
    updateButtons();
  }
});

// Keep the local preview current when returning to the app.
window.addEventListener('focus', updateButtons);
