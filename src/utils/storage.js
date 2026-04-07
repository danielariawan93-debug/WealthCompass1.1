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

// Recursively remove undefined values — Firestore rejects any undefined field
function stripUndefined(obj) {
  if (Array.isArray(obj)) return obj.map(stripUndefined);
  if (obj !== null && typeof obj === "object") {
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) result[k] = stripUndefined(v);
    }
    return result;
  }
  return obj;
}

// Save to Firestore (async, cloud sync)
async function saveAccountDataCloud(uid, data) {
  if (!uid) return;
  try {
    const clean = stripUndefined(data);
    await setDoc(doc(db, "users", uid), { data: clean, updatedAt: Date.now() }, { merge: true });
  } catch (e) {
    console.warn("Firestore save failed:", e.message);
  }
}

// Load from Firestore (async, returns null if not found/offline)
async function loadAccountDataCloud(uid) {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) return snap.data().data || null;
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
  uploadCount: 0,        // Free tier: lifetime upload count
  monthlyUploadCount: 0, // Pro/Pro+: uploads used this month
  monthlyUploadMonth: "", // "2026-03" — resets monthlyUploadCount when month changes
  pulseCredits: 3,       // All new accounts start with 3 free Pulse Credits (lifetime)
  bonusPulse: [],        // [{id, amount, expiresAt, source, earnedAt}] — referral bonus, expires 30d
  referrals: [],         // [{uid, name, email, date, tier}] — users referred by this account
  referredBy: "",        // referral code this user was referred by (set once)
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
  networthSnapshots: [], // [{ts: timestamp, val: IDR net worth}] — synced to Firebase
  ajWallets: [],       // Artha Journey wallets [{id,name,type,initialBalance,icon,color}]
  ajTransactions: [],  // Artha Journey transactions [{id,date,type,category,amount,walletId,...}]
  ajBudgets: [],       // Artha Journey budgets [{id,category,limit,month}]
};

export {
  getAccountKey,
  saveAccountData,
  loadAccountData,
  saveAccountDataCloud,
  loadAccountDataCloud,
  DEFAULT_ACCOUNT_STATE,
};
