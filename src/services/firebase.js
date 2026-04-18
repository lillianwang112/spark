import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

let app;
let db;
let auth;

export function initFirebase() {
  try {
    if (!firebaseConfig.apiKey) return false;
    if (!app) {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);
    }
    return true;
  } catch (err) {
    console.warn('[Firebase] Init failed:', err.message);
    return false;
  }
}

function requireAuth() {
  if (!auth) throw new Error('Firebase auth is not initialized');
  return auth;
}

export function subscribeToAuthChanges(callback) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}

export async function ensureGuestSession() {
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser;
  const result = await signInAnonymously(auth);
  return result.user;
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(requireAuth(), provider);
  return result.user;
}

export async function signInWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(requireAuth(), email, password);
  return result.user;
}

export async function createEmailAccount(email, password) {
  const result = await createUserWithEmailAndPassword(requireAuth(), email, password);
  return result.user;
}

export async function signOutUser() {
  if (!auth) return;
  await signOut(auth);
}

export async function saveUserProfile(uid, profile) {
  if (!db || !uid) return;
  await setDoc(doc(db, 'users', uid, 'data', 'profile'), profile, { merge: true });
}

export async function loadUserProfile(uid) {
  if (!db || !uid) return null;
  const snap = await getDoc(doc(db, 'users', uid, 'data', 'profile'));
  return snap.exists() ? snap.data() : null;
}

export async function replaceTracks(uid, tracks) {
  if (!db || !uid) return;
  await Promise.all((tracks || []).map((track) =>
    setDoc(doc(db, 'tracks', uid, 'nodes', track.id), track, { merge: true })
  ));
}

export async function loadTracks(uid) {
  if (!db || !uid) return [];
  const snap = await getDocs(collection(db, 'tracks', uid, 'nodes'));
  return snap.docs.map((d) => d.data());
}

export async function cacheNodeData(pathHash, ageGroup, data) {
  if (!db) return;
  try {
    await setDoc(doc(db, 'nodes', pathHash, 'cache', ageGroup), data, { merge: true });
  } catch {
    // non-critical cache write
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

// ── Shared AI response cache — shared across all users ──
// Keyed by "{type}:{cacheKey}" — allows instant delivery of pre-warmed content
export async function getSharedAICache(docId) {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'aiCache', docId));
    return snap.exists() ? snap.data().value : null;
  } catch {
    return null;
  }
}

export async function setSharedAICache(docId, value) {
  if (!db) return;
  try {
    await setDoc(doc(db, 'aiCache', docId), {
      value,
      generatedAt: new Date().toISOString(),
    });
  } catch {
    // non-critical
  }
}
