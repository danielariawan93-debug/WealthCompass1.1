import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── THEMES ──────────────────────────────────────────────────────────────────
// Base theme tokens (functional colors — same for all themes)
const BASE_TOKENS = {
  green: "#3ecf8e",
  greenDim: "#3ecf8e18",
  red: "#f26b6b",
  redDim: "#f26b6b18",
  blue: "#5b9cf6",
  blueDim: "#5b9cf618",
  orange: "#f59e0b",
  purple: "#9b7ef8",
};

const THEMES = {
  dark: {
    name: "Dark",
    icon: "🌑",
    bg: "#07090c",
    surface: "#0d1117",
    card: "#131920",
    border: "#1c2636",
    borderLight: "#243040",
    accent: "#d4a843",
    accentDim: "#d4a84318",
    accentSoft: "#d4a84333",
    text: "#ddd8cf",
    textSoft: "#9aa3b0",
    muted: "#4d5866",
    inputBg: "#0d1117",
    shadow: "rgba(0,0,0,0.5)",
    ...BASE_TOKENS,
  },
  light: {
    name: "Light",
    icon: "☀️",
    bg: "#f0f4f8",
    surface: "#ffffff",
    card: "#ffffff",
    border: "#dde3ec",
    borderLight: "#c8d1df",
    accent: "#b8860b",
    accentDim: "#b8860b12",
    accentSoft: "#b8860b28",
    text: "#1a2233",
    textSoft: "#4a5568",
    muted: "#94a3b8",
    inputBg: "#f8fafc",
    shadow: "rgba(0,0,0,0.1)",
    green: "#059669",
    greenDim: "#05966912",
    red: "#dc2626",
    redDim: "#dc262612",
    blue: "#2563eb",
    blueDim: "#2563eb12",
    orange: "#d97706",
    purple: "#7c3aed",
  },
  custom: {
    name: "Custom",
    icon: "🎨",
    bg: "#07090c",
    surface: "#0d1117",
    card: "#131920",
    border: "#1c2636",
    borderLight: "#243040",
    accent: "#7c6af7",
    accentDim: "#7c6af718",
    accentSoft: "#7c6af733",
    text: "#ddd8cf",
    textSoft: "#9aa3b0",
    muted: "#4d5866",
    inputBg: "#0d1117",
    shadow: "rgba(0,0,0,0.5)",
    ...BASE_TOKENS,
  },
};

// 12 Custom theme presets — each defines bg, surface, card, text, accent
const CUSTOM_PRESETS = [
  // [id, name, bg, surface, card, text, accent]
  { id:'midnight',  name:'Midnight Blue', bg:'#060d1a', surface:'#0d1a2e', card:'#112238', text:'#c8d8f0', accent:'#4f9cf8' },
  { id:'forest',    name:'Forest Dark',   bg:'#060f08', surface:'#0c1a0e', card:'#102214', text:'#bfd9c4', accent:'#4caf76' },
  { id:'sepia',     name:'Warm Sepia',    bg:'#150f08', surface:'#1e1609', card:'#27190a', text:'#e8d5b5', accent:'#c8893a' },
  { id:'rose',      name:'Rose Dark',     bg:'#140a10', surface:'#1d0d18', card:'#260f20', text:'#f0c8e0', accent:'#e05090' },
  { id:'slate',     name:'Slate Pro',     bg:'#0a0c10', surface:'#11141c', card:'#161a24', text:'#ccd0dc', accent:'#7c9ef8' },
  { id:'carbon',    name:'Carbon',        bg:'#0d0d0d', surface:'#141414', card:'#1a1a1a', text:'#d4d4d4', accent:'#e0e0e0' },
  { id:'arctic',    name:'Arctic Light',  bg:'#eef5fb', surface:'#ffffff', card:'#f5f9ff', text:'#1a2d42', accent:'#2f7ec4' },
  { id:'cream',     name:'Cream',         bg:'#faf7f0', surface:'#ffffff', card:'#fff9f0', text:'#2d2010', accent:'#9a6820' },
  { id:'sage',      name:'Sage Light',    bg:'#f0f5ef', surface:'#ffffff', card:'#f5faf4', text:'#1a2a1c', accent:'#3a8a50' },
  { id:'lavender',  name:'Lavender',      bg:'#f3f0fa', surface:'#ffffff', card:'#f8f5ff', text:'#1e1635', accent:'#6a44cc' },
  { id:'sunrise',   name:'Sunrise',       bg:'#fdf0e8', surface:'#ffffff', card:'#fff5ee', text:'#2a1508', accent:'#cc5520' },
  { id:'ocean',     name:'Ocean',         bg:'#e8f4f8', surface:'#ffffff', card:'#f0f8fc', text:'#0a2030', accent:'#0880b0' },
];


function applyPreset(preset) {
  const isDark = [
    "midnight",
    "forest",
    "sepia",
    "rose",
    "slate",
    "carbon",
  ].includes(preset.id);
  const baseTokens = isDark
    ? BASE_TOKENS
    : {
        green: "#059669",
        greenDim: "#05966912",
        red: "#dc2626",
        redDim: "#dc262612",
        blue: "#2563eb",
        blueDim: "#2563eb12",
        orange: "#d97706",
        purple: "#7c3aed",
      };
  const accentHex = preset.accent;
  return {
    ...THEMES.custom,
    bg: preset.bg,
    surface: preset.surface,
    card: preset.card,
    inputBg: preset.surface,
    border: isDark
      ? preset.card.replace("#", "") > "444444"
        ? "#ffffff22"
        : "#2a2a3a"
      : "#dde3ec",
    borderLight: isDark ? "#334" : "#c8d1df",
    text: preset.text,
    textSoft: preset.text + "bb",
    muted: preset.text,
    shadow: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.08)",
    accent: accentHex,
    accentDim: accentHex + "22",
    accentSoft: accentHex + "44",
    ...baseTokens,
  };
}

// Load custom theme from localStorage
function loadCustomTheme(email) {
  try {
    const saved = localStorage.getItem(`wc_custom_theme_${email}`);
    if (saved) {
      const preset = CUSTOM_PRESETS.find((p) => p.id === saved);
      if (preset) return applyPreset(preset);
    }
  } catch {}
  return null;
}


export { BASE_TOKENS, THEMES, CUSTOM_PRESETS, applyPreset, loadCustomTheme };
