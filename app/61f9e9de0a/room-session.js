// Authentication and operation coordination only; no presentation changes.
export function createRoomSession(auth, signInGuest) {
  let pending = null;
  return {
    async current() {
      await auth.authStateReady();
      if (auth.currentUser) return auth.currentUser;
      if (!pending) {
        pending = signInGuest(auth).then(result => auth.currentUser || result.user)
          .finally(() => { pending = null; });
      }
      return pending;
    },
    assertIdentity(uid) {
      if (!uid || auth.currentUser?.uid !== uid) throw Error('Account changed. Try again with your current account.');
    }
  };
}

export function singleFlight(action) {
  let pending = null;
  return (...args) => {
    if (!pending) pending = Promise.resolve().then(() => action(...args)).finally(() => { pending = null; });
    return pending;
  };
}

export function invitationFrom(input) {
  const text = String(input || '').trim();
  let id, code;
  const compact = /^([0-9a-f]{32}):([0-9a-f]{16})$/.exec(text);
  if (compact) return {id:compact[1],code:compact[2]};
  try { const url = new URL(text); id = url.searchParams.get('room'); code = url.searchParams.get('invite'); }
  catch { [id, code] = text.split(':'); }
  if (!/^[0-9a-f]{32}$/.test(id || '') || !/^[0-9a-f]{16}$/.test(code || '')) return null;
  return {id, code};
}
