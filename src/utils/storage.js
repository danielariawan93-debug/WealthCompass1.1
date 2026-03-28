import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

// Firebase config (same as LoginScreen)
const firebaseConfig = {
  apiKey: "AIzaSyBUKtd-3swn6ZDA3lqHa8nAnNPvZ3d7Va0",
  authDomain: "wealthcompass-fee04.firebaseapp.com",
  projectId: "wealthcompass-fee04",
  storageBucket: "wealthcompass-fee04.appspot.com",
  messagingSenderId: "1087459978452",
  appId: "1:1087459978452:web:4a4e2e3e3e3e3e3e3e3e3e",
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
    localStorage.setItem(getAccountKey(email), JSON.stringify(data));
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
  try {
    await setDoc(doc(db, "users", uid), { data, updatedAt: Date.now() }, { merge: true });
  } catch (e) {
    console.warn("Firestore save failed (offline?)", e);
  }
}

// Load from Firestore (async, returns null if not found/offline)
async function loadAccountDataCloud(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) return snap.data().data || null;
    return null;
  } catch (e) {
    console.warn("Firestore load failed (offline?)", e);
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
