import { getApps, initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

// Reuse existing Firebase app (initialized by LoginScreen)
// Only initialize if not already done
const firebaseConfig = {
  apiKey: "AIzaSyBUKtd-3swn6ZDA3lqHa8nAnNPvZ3d7Va0",
  authDomain: "wealthcompass-fee04.firebaseapp.com",
  projectId: "wealthcompass-fee04",
  storageBucket: "wealthcompass-fee04.firebasestorage.app",
  messagingSenderId: "803676982970",
  appId: "1:803676982970:web:f31ccd09d4021b60e0bc83",
};
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// localStorage key per email
function getAccountKey(email) {
  return "wc_data_" + btoa(email).replace(/=/g, "");
}

// Save to localStorage (sync, always works offline)
function saveAccountData(email, data) {
  try {
    localStorage.setItem(getAccountKey(email), JSON.stringify({ ...data, _savedAt: Date.now() }));
  } catch (e) {
    console.warn("Save failed", e);
  }
}

// Load from localStorage (sync)
function loadAccountData(email) {
  try {
    const raw = localStorage.getItem(getAccountKey(email));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Save to Firestore (async, cloud sync)
async function saveAccountDataCloud(uid, data) {
  if (!uid) return;
  try {
    await setDoc(doc(db, "users", uid), { data, updatedAt: Date.now() }, { merge: true });
  } catch (e) {
    console.warn("Firestore save failed:", e.message);
  }
}

// Load from Firestore (async, returns { data, updatedAt } or null if not found/offline)
async function loadAccountDataCloud(uid) {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const docData = snap.data();
      return { data: docData.data || null, updatedAt: docData.updatedAt || 0 };
    }
    return null;
  } catch (e) {
    console.warn("Firestore load failed:", e.message);
    return null;
  }
}

const DEFAULT_ACCOUNT_STATE = {
  assets: [],
  debts: [],
  goals: [],
  riskProfile: null,
  isPro: false,
  isProPlus: false,
  uploadCount: 0,
  settings: {
    language: "id",
    notifications: true,
    userName: "",
    modules: { realAssets: false },
  },
  proExpiry: null,
  dispCur: "IDR",
  theme: "dark",
  customPresetId: "midnight",
};

export {
  getAccountKey,
  saveAccountData,
  loadAccountData,
  saveAccountDataCloud,
  loadAccountDataCloud,
  DEFAULT_ACCOUNT_STATE,
};
