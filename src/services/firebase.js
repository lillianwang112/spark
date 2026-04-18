import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

let app, db, auth;

// Firebase is optional — app works fully offline without it
export function initFirebase() {
  try {
    if (!firebaseConfig.apiKey) return false;
    app  = initializeApp(firebaseConfig);
    db   = getFirestore(app);
    auth = getAuth(app);
    return true;
  } catch (err) {
    console.warn('[Firebase] Init failed — running in local-only mode:', err.message);
    return false;
  }
}

export function getDB()   { return db; }
export function getAuth_() { return auth; }

// Start anonymous auth — no account needed to explore
export async function initAuth() {
  if (!auth) return null;
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (err) {
    console.warn('[Firebase] Anonymous auth failed:', err.message);
    return null;
  }
}

// Upgrade to Google when user saves first track
export async function upgradeToGoogle() {
  if (!auth) throw new Error('Firebase not initialized');
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

// ── Firestore helpers ──

export async function saveUserProfile(uid, profile) {
  if (!db) return;
  try {
    await setDoc(doc(db, 'users', uid, 'data', 'profile'), profile, { merge: true });
  } catch (err) {
    console.warn('[Firebase] Save profile failed:', err.message);
  }
}

export async function loadUserProfile(uid) {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'data', 'profile'));
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}

export async function saveTrack(uid, track) {
  if (!db) return;
  try {
    await setDoc(doc(db, 'tracks', uid, 'nodes', track.id), track, { merge: true });
  } catch (err) {
    console.warn('[Firebase] Save track failed:', err.message);
  }
}

export async function loadTracks(uid) {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, 'tracks', uid, 'nodes'));
    return snap.docs.map((d) => d.data());
  } catch {
    return [];
  }
}

export async function cacheNodeData(pathHash, ageGroup, data) {
  if (!db) return;
  try {
    await setDoc(doc(db, 'nodes', pathHash, 'cache', ageGroup), data, { merge: true });
  } catch {
    // Non-critical
  }
}

export async function getNodeCache(pathHash, ageGroup) {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'nodes', pathHash, 'cache', ageGroup));
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}
