
import { firebaseConfig } from './firebase-config.js';

import { initializeApp, getApps } from
  'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';

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

if (locker) {
  const panel = document.createElement('div');
  panel.style.cssText =
    'margin:16px 0;padding:14px;border:1px solid #b79c62;' +
    'border-radius:14px;background:#f3ead7;';

  const heading = document.createElement('h3');
  heading.textContent = 'Saved Golfer Memories';

  const intro = document.createElement('p');
  intro.className = 'muted';
  intro.textContent =
    'Facts you approved for your caddies to remember. ' +
    'Stored in your cloud golfer profile.';

  const refresh = document.createElement('button');
  refresh.type = 'button';
  refresh.className = 'btn-secondary';
  refresh.textContent = 'Refresh Saved Memories';

  const status = document.createElement('p');
  status.className = 'status';
  status.setAttribute('role', 'status');
  status.textContent = 'Checking golfer account…';

  const list = document.createElement('div');
  list.style.marginTop = '10px';

  panel.append(heading, intro, refresh, status, list);

  const stats = document.getElementById('lockerStats');

  if (stats && stats.parentElement === locker) {
    locker.insertBefore(panel, stats);
  } else {
    locker.append(panel);
  }

  let busy = false;

  function currentGolfer() {
    const user = auth.currentUser;
    return user && !user.isAnonymous ? user : null;
  }

  function setStatus(message) {
    status.textContent = message;
  }

  function setBusy(value) {
    busy = value;
    refresh.disabled = value;
  }

  async function loadMemories() {
    if (busy) return;

    setBusy(true);
    list.replaceChildren();

    try {
      await auth.authStateReady();

      const user = currentGolfer();

      if (!user) {
        setStatus(
          'Sign in under Club → Golfer Account to see saved memories.'
        );
        return;
      }

      const snapshot = await getDoc(
        doc(db, 'golfers', user.uid)
      );

      if (auth.currentUser?.uid !== user.uid) {
        throw new Error('Golfer account changed. Refresh again.');
      }

      if (!snapshot.exists()) {
        setStatus('No cloud golfer profile found yet.');
        return;
      }

      const data = snapshot.data();
      const memories = Array.isArray(data.memories)
        ? data.memories.filter(item => typeof item === 'string')
        : [];

      if (!memories.length) {
        setStatus('No saved memories yet. Talk to a caddie and tap Save Memory.');
        return;
      }

      setStatus(
        memories.length + ' saved golfer ' +
        (memories.length === 1 ? 'memory' : 'memories')
      );

      memories.forEach(memory => {
        const item = document.createElement('div');
        item.style.cssText =
          'padding:10px;margin:8px 0;border:1px solid #d2c19d;' +
          'border-radius:10px;background:#fffaf0;';

        const text = document.createElement('p');
        text.style.cssText =
          'font-size:14px;margin:0 0 10px;overflow-wrap:anywhere;';
        text.textContent = memory;

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'btn-ghost';
        remove.textContent = 'Delete This Memory';
        remove.style.cssText =
          'font-size:12px;padding:9px;background:#f5e2dc;' +
          'color:#7c342c;border-color:#c89b8f;';

        remove.addEventListener('click', async () => {
          if (busy) return;

          const confirmed = window.confirm(
            'Permanently delete this memory?\n\n' + memory
          );

          if (!confirmed) return;

          setBusy(true);
          remove.disabled = true;

          try {
            const activeUser = currentGolfer();

            if (!activeUser || activeUser.uid !== user.uid) {
              throw new Error('Golfer account changed. Delete canceled.');
            }

            const reference = doc(db, 'golfers', user.uid);

            await runTransaction(db, async transaction => {
              const snapshot = await transaction.get(reference);

              if (!snapshot.exists()) {
                throw new Error('Cloud golfer profile not found.');
              }

              if (auth.currentUser?.uid !== user.uid) {
                throw new Error('Golfer account changed. Delete canceled.');
              }

              const saved = snapshot.data().memories;

              if (!Array.isArray(saved) || !saved.includes(memory)) {
                throw new Error('Memory is no longer saved.');
              }

              transaction.update(reference, {
                memories: saved.filter(entry => entry !== memory),
                updatedAt: serverTimestamp()
              });
            });

            setStatus('Memory deleted from your cloud profile.');
          } catch (error) {
            setStatus('Delete failed: ' + error.message);
          } finally {
            setBusy(false);
            await loadMemories();
          }
        });

        item.append(text, remove);
        list.append(item);
      });

    } catch (error) {
      setStatus('Could not load memories: ' + error.message);
    } finally {
      setBusy(false);
    }
  }

  refresh.addEventListener('click', loadMemories);

  onAuthStateChanged(auth, () => {
    if (!busy) loadMemories();
  });
}
