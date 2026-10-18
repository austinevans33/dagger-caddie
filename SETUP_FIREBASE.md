# Dagger Caddie 4.9 — Live Money Room setup

**Without this setup, the app remains a normal local-only GitHub Pages app.** The live Money Room buttons will show an honest 'not configured' message. No Firebase account, project, or secret has been created for you.

## Setup on an iPhone (or any browser)

1. Go to https://console.firebase.google.com/ and **Add project**. Use a project name like `dagger-caddie-money-room`.
2. Add a **Web app** (`</>`). Copy the `firebaseConfig` object Firebase provides.
3. In **Build → Authentication → Sign-in method**, enable **Anonymous**. Every phone gets a Firebase anonymous identity; it is **device-specific**, not a portable account.
4. In **Build → Firestore Database**, create a Firestore database in **production mode**. Choose your preferred region. Do **not** leave permissive test rules running.
5. Open the Firestore **Rules** tab; replace its rules with the contents of `firestore.rules` from this ZIP; click **Publish**.
6. Edit `firebase-config.js` in your GitHub repository, replacing `null` with the real web config, e.g. `export const firebaseConfig = { apiKey: '...', authDomain: '...', projectId: '...', appId: '...' };`. Paste the exact values shown in your Firebase console.
7. Commit the `firebase-config.js` change, wait for GitHub Pages to publish, reload in Safari, and check that **Live sync ready** appears under Betting → Money Room.
8. One person enters golfer names, game format and stake and taps **Create room**. That phone is the designated scorekeeper. Share the invite link with others. Each guest joins, enters their name, and sees updates in real time.

### Safeguards and limitations

- **Scorekeeper-only writes:** Firestore rules allow the host to change hole scores or archive the room. Everyone else can only read room results.
- **Room access:** An invite includes a high-entropy room ID and a secret invitation code. Treat links as private; anyone with the link can join and view. It is not a verified identity scheme and is not suitable for sensitive data.
- **Identity persistence:** Anonymous identity is usually retained on the same browser, but clearing Safari storage, private browsing, or switching devices may lose scorekeeper access. **You cannot recover that identity automatically**. Do not clear website data during an active match.
- **Offline:** Firestore may cache information, but the room does not promise conflict-free offline score submissions. Only the scorekeeper enters scores; use paper or local scores as a backup when signal drops.
- **Archive:** Completed rooms are read-only in the database. The scorekeeper's phone also gets a local lifetime record. Other phones can view the archived room, but they don't currently consolidate all online rooms into a cross-device personal lifetime ledger. Building that would require portable accounts and dedicated member archive permissions.
- **Fees:** Firebase has a free quota, but billing/quotas can change. Review current pricing before enabling billing. This app does not accept or move money.
- **Nassau:** In this prototype, front/back/overall are each settled as a single wager after at least one score is recorded in that segment; incomplete rounds therefore show preliminary totals, not final settlement. Confirm final wagers only after each segment is complete.
- **Security:** The Firebase web app configuration is public. Firestore security rules, authentication, and invite entropy protect data; don't put any private service-account credential or AI API key in GitHub.

## Conversational caddie

The **Talk it Through** panel included here runs a local structured interpretation and asks a follow-up for missing distances/required carries. It is **not yet a hosted AI chat**. True model-driven multi-turn conversations require a backend endpoint that secures your AI key, handles usage limits, and sends only the selected golfing context to the AI service. The static GitHub Pages site cannot securely store that key. The existing microphone transcription remains available where the browser supports it.
