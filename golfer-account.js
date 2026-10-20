import { firebaseConfig } from './firebase-config.js';

import {
  initializeApp,
  getApps
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';

import {
  getAuth,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signInAnonymously,
  signInWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';

const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

const auth = getAuth(app);

// Keep golfer accounts signed in across app restarts.
const persistenceReady = setPersistence(
  auth,
  browserLocalPersistence
);

// This module never deletes or overwrites golfer data.
const section = document.createElement('section');
section.className = 'card';
section.dataset.tab = 'settings';

section.innerHTML = `
  <h2>Golfer Account</h2>
  <p class="muted">
    Your permanent Dagger Country Club membership.
    One identity for all four caddies.
  </p>

  <div class="notice-card" id="accountStatus"
       role="status" aria-live="polite">
    Checking membership...
  </div>

  <div id="accountForm">
    <label for="golferEmail">Email address</label>
    <input id="golferEmail"
           type="email"
           autocomplete="email"
           placeholder="you@example.com">

    <label for="golferPassword"
           style="margin-top:12px">
      Password
    </label>
    <input id="golferPassword"
           type="password"
           autocomplete="current-password"
           minlength="6"
           placeholder="At least 6 characters">

    <div class="grid" style="margin-top:12px">
      <button id="golferRegister"
              type="button"
              class="btn-primary">
        Create Account
      </button>
      <button id="golferLogin"
              type="button"
              class="btn-secondary">
        Sign In
      </button>
    </div>

    <p class="tiny-print">
      Creating an account upgrades your current anonymous
      membership when possible. Existing email sign-in
      switches to that account; browser-only golf data
      is not yet synced.
    </p>
  </div>

  <p class="tiny-print" id="accountIdentity"></p>
`;

const settingsPanel =
  document.querySelector('[data-tab="settings"]');

if (settingsPanel) {
  settingsPanel.parentNode.insertBefore(
    section,
    settingsPanel
  );
}

const $ = id => document.getElementById(id);

const status = message => {
  $('accountStatus').textContent = message;
};

function showAccount(user) {
  if (!user) {
    status('Membership not connected.');
    $('accountIdentity').textContent = '';
    return;
  }

  if (user.isAnonymous) {
    status(
      'Guest membership active. Create an account ' +
      'to preserve this Firebase identity.'
    );
    $('accountIdentity').textContent =
      'Guest account ready for upgrade.';
  } else {
    status(
      'Signed in as ' + (user.email || 'Golfer') +
      '. Your permanent membership is active.'
    );
    $('accountIdentity').textContent =
      'Permanent member account connected.';
  }

  $('golferRegister').disabled = !user.isAnonymous;
}

onAuthStateChanged(auth, showAccount);

function credentials() {
  const email = $('golferEmail').value.trim();
  const password = $('golferPassword').value;

  if (!email || !email.includes('@')) {
    throw new Error('Enter a valid email address.');
  }

  if (password.length < 6) {
    throw new Error(
      'Password must contain at least 6 characters.'
    );
  }

  return { email, password };
}

function friendlyError(error) {
  const code = error.code || '';

  if (code === 'auth/email-already-in-use') {
    return 'That email already has an account. ' +
      'Your current guest account remains unchanged.';
  }

  if (code === 'auth/invalid-credential') {
    return 'Email or password was not accepted.';
  }

  if (code === 'auth/weak-password') {
    return 'Choose a stronger password.';
  }

  if (code === 'auth/network-request-failed') {
    return 'Network unavailable. Try again.';
  }

  return error.message || 'Something went wrong.';
}

let busy = false;

async function runAction(action) {
  if (busy) return;

  busy = true;
  $('golferRegister').disabled = true;
  $('golferLogin').disabled = true;

  try {
    const { email, password } = credentials();
    await persistenceReady;

    if (action === 'register') {
      status('Creating your membership...');

      let user = auth.currentUser;

      if (!user) {
        user = (await signInAnonymously(auth)).user;
      }

      if (!user.isAnonymous) {
        throw new Error(
          'You already have a permanent account.'
        );
      }

      const credential =
        EmailAuthProvider.credential(email, password);

      // Linking preserves the existing anonymous UID.
      await linkWithCredential(user, credential);

      status(
        'Membership created! Your existing Firebase ' +
        'identity has been preserved.'
      );

    } else {
      if (auth.currentUser?.isAnonymous) {
        const proceed = window.confirm(
          'Signing in to an existing account changes ' +
          'your Firebase identity. Existing guest-owned ' +
          'Money Rooms may not transfer automatically. ' +
          'Browser-only golf data will remain on this ' +
          'device but is not synced yet. Continue?'
        );

        if (!proceed) {
          status('Sign-in canceled. Guest account retained.');
          return;
        }
      }

      status('Signing in...');

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      status('Welcome back to Dagger Country Club.');
    }

    $('golferPassword').value = '';

  } catch (error) {
    status(friendlyError(error));
  } finally {
    busy = false;
    $('golferLogin').disabled = false;
    $('golferRegister').disabled =
      !auth.currentUser?.isAnonymous;
  }
}

$('golferRegister').addEventListener(
  'click',
  () => runAction('register')
);

$('golferLogin').addEventListener(
  'click',
  () => runAction('login')
);
