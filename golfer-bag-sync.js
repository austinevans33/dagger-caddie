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

section.style.background = '#173528';
section.style.color = '#f3e9d3';
section.style.border = '1px solid #b79c62';
section.style.borderRadius = '14px';

section.classList.add('dcc-cloud-utility');


section.innerHTML = `
  <h3>Cloud Golf Bag</h3>

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

  <button id="downloadCloudBag"
          type="button"
          class="btn-secondary"
          style="margin-top:8px;"
          disabled>
    Download Cloud Bag to This Device
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
  const maintenance = locker.querySelector('.dcc-locker-maintenance');

  if (maintenance) {
    maintenance.append(section);
  } else {
    locker.append(section);
  }
}

const $ = id => document.getElementById(id);

const uploadButton = $('uploadCloudBag');
const checkButton = $('checkCloudBag');
const downloadButton = $('downloadCloudBag');
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
      'LOCAL BAG · ' + bag.length + ' clubs ready for backup';
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
  downloadButton.disabled = busy || !signedIn;
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
      'CLOUD BACKUP FOUND · ' + clubs.length +
      ' clubs saved to your golfer account.';


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
downloadButton.addEventListener('click', async () => {
  if (busy) return;

  busy = true;
  updateButtons();

  try {
    const user = activeMember();
    const uid = user.uid;

    status.textContent = 'Loading cloud golf bag...';

    const snapshot = await getDoc(doc(db, 'golfers', uid));

    if (auth.currentUser?.uid !== uid) {
      throw new Error('Account changed. Download canceled.');
    }

    if (!snapshot.exists()) {
      throw new Error('No cloud golfer profile found.');
    }

    const cloudClubs = snapshot.data().clubs;

    if (!Array.isArray(cloudClubs) ||
        cloudClubs.length === 0 ||
        cloudClubs.length > 30) {
      throw new Error('Cloud golf bag is empty or invalid.');
    }

    const validated = cloudClubs.map((club, index) => {
      if (!club ||
          typeof club.name !== 'string' ||
          !club.name.trim() ||
          club.name.length > 100) {
        throw new Error('Invalid cloud club #' + (index + 1));
      }

      const saved = {name: club.name.trim()};

      for (const field of ['carry', 'manualCarry']) {
        if (club[field] != null) {
          const value = Number(club[field]);

          if (!Number.isFinite(value) ||
              value < 0 ||
              value > 400) {
            throw new Error(
              'Invalid cloud distance for ' + club.name
            );
          }

          saved[field] = value;
        }
      }

      if (saved.carry == null &&
          saved.manualCarry == null) {
        throw new Error(
          'No carry distance for ' + club.name
        );
      }

      return saved;
    });

    const existingRaw = localStorage.getItem('dagger_profile');
    const existing = existingRaw
      ? JSON.parse(existingRaw)
      : [];

    if (!Array.isArray(existing)) {
      throw new Error('Existing local bag is invalid.');
    }

    const proceed = window.confirm(
      'DOWNLOAD CLOUD BAG?\n\n' +
      describeBag(validated) +
      '\n\nThis will replace the local club list on ' +
      'THIS DEVICE ONLY.\n\n' +
      'Your old local bag will be backed up first. ' +
      'Your cloud data and Handicap Index stay unchanged.'
    );

    if (!proceed) {
      status.textContent = 'Download canceled. No changes made.';
      return;
    }

    if (auth.currentUser?.uid !== uid) {
      throw new Error('Account changed. Download canceled.');
    }

    // Preserve any existing club details not included
    // in the cloud record, matching by club name.
    const merged = validated.map(cloudClub => {
      const old = existing.find(
        c => c?.name === cloudClub.name
      );

      return {
        ...(old || {}),
        ...cloudClub
      };
    });

    // Backup and replacement use separate keys.
    // If the replacement fails, restore the old bag.
    const backupKey = 'dagger_profile_backup_before_cloud';
    const previousBackup = localStorage.getItem(backupKey);

    try {
      localStorage.setItem(
        backupKey,
        existingRaw || '[]'
      );

      localStorage.setItem(
        'dagger_profile',
        JSON.stringify(merged)
      );
    } catch (error) {
      if (existingRaw === null) {
        localStorage.removeItem('dagger_profile');
      } else {
        localStorage.setItem('dagger_profile', existingRaw);
      }

      if (previousBackup === null) {
        localStorage.removeItem(backupKey);
      } else {
        localStorage.setItem(backupKey, previousBackup);
      }

      throw error;
    }

    status.textContent =
      'Cloud bag downloaded. Reloading the golf tools...';

    window.location.reload();

  } catch (error) {
    status.textContent =
      'Download issue: ' + error.message;
  } finally {
    busy = false;
    updateButtons();
  }
});
// Keep the local preview current when returning to the app.
window.addEventListener('focus', updateButtons);
