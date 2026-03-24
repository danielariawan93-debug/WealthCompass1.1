function getAccountKey(email) {
  return "wc_data_" + btoa(email).replace(/=/g, "");
}
function saveAccountData(email, data) {
  try {
    localStorage.setItem(getAccountKey(email), JSON.stringify(data));
  } catch (e) {
    console.warn("Save failed", e);
  }
}
function loadAccountData(email) {
  try {
    const raw = localStorage.getItem(getAccountKey(email));
    return raw ? JSON.parse(raw) : null;
  } catch {
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

export { getAccountKey, saveAccountData, loadAccountData, DEFAULT_ACCOUNT_STATE };
