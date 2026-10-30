// STAGING ONLY — Dagger Country Club. Public browser config; never use in production.
export const firebaseConfig = {
  apiKey: "AIzaSyDMHw9h6nb3siGZ35tx-9VveItJXnzJoFY",
  authDomain: "dagger-country-club-staging.firebaseapp.com",
  projectId: "dagger-country-club-staging",
  storageBucket: "dagger-country-club-staging.firebasestorage.app",
  messagingSenderId: "882602607714",
  appId: "1:882602607714:web:e9fec98e6675cd1b84bd3b"
};
// Endpoint requires a separately deployed staging Cloud Function.
export const caddyFunctionUrl = `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/caddieChat`;
