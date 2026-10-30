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
section.classList.add('hidden-panel');


section.innerHTML = `

 
<details class="dcc-account-drawer" style="background:#173528;color:#F3E9D3;border:1px solid #B79C62;border-radius:14px;padding:14px;">

    
<summary style="cursor:pointer;color:#D8BA77;font:700 19px Georgia,serif;padding:6px 0;">
  Member Account · Sign In / Membership
</summary>

    
<div class="dcc-account-body" style="padding:14px;margin-top:12px;border:1px solid #B79C62;border-radius:10px;background:#F5F0E5;color:#143126;">


  
<h2 style="color:#143126;font-family:Georgia,serif;">Membership Office</h2>

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
    </div>
  </details>
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


// DCC STEP 29E — PERSISTENT MEMBER INDICATOR
// Display only. Does not write data or change authentication.
const dccMemberButton = document.createElement('button');
dccMemberButton.type = 'button';
dccMemberButton.id = 'dccMemberIndicator';
dccMemberButton.setAttribute(
  'aria-label',
  'View Dagger Country Club membership account'
);

dccMemberButton.style.cssText = [
  'display:flex',
  'align-items:center',
  'justify-content:space-between',
  'gap:12px',
  'width:100%',
  'margin:0 0 14px',
  'padding:12px 15px',
  'border-radius:13px',
  'border:1px solid #b79c62',
  'background:#173528',
  'color:#f3e9d3',
  'text-align:left',
  'cursor:pointer',
  'box-sizing:border-box'
].join(';');

const dccMemberText = document.createElement('span');
dccMemberText.style.cssText =
  'font:700 12px/1.5 system-ui,sans-serif;overflow-wrap:anywhere';

const dccMemberArrow = document.createElement('span');
dccMemberArrow.textContent = 'ACCOUNT ›';
dccMemberArrow.style.cssText =
  'color:#d8ba77;font:800 10px system-ui,sans-serif;white-space:nowrap';

dccMemberButton.append(dccMemberText, dccMemberArrow);

const dccMast = document.querySelector('.app-shell .mast');

// Approved R163 design has no injected membership-status banner.
// Preserve the account drawer and authentication logic, but do not attach
// this legacy status button to the visible masthead.
// (The existing account control remains in the approved header.)

function dccUpdateMemberIndicator(user) {
  if (!user) {
    dccMemberText.textContent = '○ Membership not connected';
    return;
  }

  if (user.isAnonymous) {
    dccMemberText.textContent = '◐ Guest membership · Secure your account';
    return;
  }

  dccMemberText.textContent =
    '✓ Signed in · ' + (user.email || 'DCC Member');
}

dccMemberButton.addEventListener('click', () => {
  // Use the existing Club navigation and Membership Office.
  document.getElementById('tab-settings')?.click();

  const drawer = document.querySelector('.dcc-account-drawer');
  if (drawer) drawer.open = true;

  drawer?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
});

// DCC STEP 29B — SHARED COMPETITION MEMBER IDENTITY
// Read-only authentication state for future competitions.
// A display name is never proof of competition ownership.

window.dccCompetitionIdentity = Object.freeze({
  uid: null,
  signedIn: false,
  permanent: false,
  ready: false
});


onAuthStateChanged(auth, user => {
  // Preserve the existing account display and controls.
  showAccount(user);

  // DCC STEP 29E — Update the persistent account indicator.
  dccUpdateMemberIndicator(user);


  
window.dccCompetitionIdentity = Object.freeze({
  uid: user?.uid || null,
  signedIn: !!user,
  permanent: !!user && !user.isAnonymous,
  ready: true
});


  // Inform competition interfaces when the account changes.
  window.dispatchEvent(
    new CustomEvent('dcc:competition-identity', {
      detail: window.dccCompetitionIdentity
    })
  );
});


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
