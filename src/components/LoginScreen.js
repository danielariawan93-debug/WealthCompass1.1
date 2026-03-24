import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, SL, Chip, Bar, TInput, TSelect, TBtn, Donut, InfoBtn, LineChart } from '../components/ui';
import { fMoney, fM, parseVal, getIDR, FREQ_MULT, LS, LS2, getWealthSegment } from '../utils/helpers';

function LoginScreen({ onLogin, T }) {
  const [mode, setMode] = useState("login"); // login | register
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = () => {
    setError("");
    if (!form.email || !form.password) {
      setError("Email dan password wajib diisi.");
      return;
    }
    if (mode === "register" && !form.name) {
      setError("Nama wajib diisi.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      try {
        const users = JSON.parse(localStorage.getItem("wc_users") || "{}");
        if (mode === "register") {
          if (users[form.email]) {
            setError("Email sudah terdaftar.");
            setLoading(false);
            return;
          }
          users[form.email] = { password: form.password, name: form.name };
          localStorage.setItem("wc_users", JSON.stringify(users));
          localStorage.setItem(
            "wc_session",
            JSON.stringify({ email: form.email, name: form.name })
          );
          onLogin({ email: form.email, name: form.name });
          // DEFAULT THEME USER BARU
          setTheme(THEMES.dark);
        } else {
          const u = users[form.email];
          if (!u || u.password !== form.password) {
            setError("Email atau password salah.");
            setLoading(false);
            return;
          }
          localStorage.setItem(
            "wc_session",
            JSON.stringify({ email: form.email, name: u.name })
          );
          onLogin({ email: form.email, name: u.name });

          // LOAD THEME USER
          const userTheme = loadCustomTheme(form.email);
          if (userTheme) {
            setTheme(userTheme);
          } else {
            setTheme(THEMES.dark);
          }
        }
      } catch {
        onLogin({ email: form.email, name: form.name });
      }
      setLoading(false);
    }, 600);
  };

  const handleBiometric = () => {
    if (!window.PublicKeyCredential) {
      setError("Biometric tidak didukung browser ini.");
      return;
    }
    setError("");
    // In production: WebAuthn navigator.credentials.get() flow
    // For prototype: simulate success after 1s
    setLoading(true);
    setTimeout(() => {
      try {
        const session = JSON.parse(
          localStorage.getItem("wc_session") || "null"
        );
        if (session) {
          onLogin(session);
        } else {
          setError("Tidak ada sesi tersimpan. Login dengan email dulu.");
        }
      } catch {
        setError("Biometric gagal. Coba login manual.");
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              color: T.accent,
              fontSize: 32,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: "bold",
              letterSpacing: 2,
            }}
          >
            WEALTH◎COMPASS
          </div>
          <div
            style={{
              color: T.muted,
              fontSize: 11,
              letterSpacing: 3,
              marginTop: 4,
            }}
          >
            PORTFOLIO INTELLIGENCE
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 20,
            padding: 28,
            boxShadow: `0 24px 60px ${T.shadow}`,
          }}
        >
          {/* Tab toggle */}
          <div
            style={{
              display: "flex",
              background: T.surface,
              borderRadius: 10,
              padding: 4,
              marginBottom: 24,
            }}
          >
            {[
              ["login", "Masuk"],
              ["register", "Daftar"],
            ].map(([m, l]) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 8,
                  border: "none",
                  background: mode === m ? T.accent : "none",
                  color: mode === m ? "#000" : T.muted,
                  cursor: "pointer",
                  fontWeight: mode === m ? "bold" : "normal",
                  fontSize: 13,
                  transition: "all 0.2s",
                }}
              >
                {l}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "register" && (
              <div>
                <div
                  style={{ color: T.textSoft, fontSize: 11, marginBottom: 5 }}
                >
                  Nama Lengkap
                </div>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Your Name"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: T.inputBg,
                    border: `1px solid ${T.border}`,
                    color: T.text,
                    borderRadius: 10,
                    padding: "11px 14px",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>
            )}
            <div>
              <div style={{ color: T.textSoft, fontSize: 11, marginBottom: 5 }}>
                Email
              </div>
              <input
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="Trial@example.com"
                type="email"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: T.inputBg,
                  border: `1px solid ${T.border}`,
                  color: T.text,
                  borderRadius: 10,
                  padding: "11px 14px",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>
            <div>
              <div style={{ color: T.textSoft, fontSize: 11, marginBottom: 5 }}>
                Password
              </div>
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  value={form.password}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="Min. 6 karakter"
                  type={showPass ? "text" : "password"}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: T.inputBg,
                    border: `1px solid ${T.border}`,
                    color: T.text,
                    borderRadius: 10,
                    padding: "11px 40px 11px 14px",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
                <button
                  onClick={() => setShowPass((p) => !p)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: T.muted,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {error && (
              <div
                style={{
                  padding: "9px 12px",
                  background: T.redDim,
                  border: `1px solid ${T.red}33`,
                  borderRadius: 9,
                  color: T.red,
                  fontSize: 12,
                }}
              >
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%",
                padding: 13,
                borderRadius: 11,
                border: "none",
                background: loading ? T.border : T.accent,
                color: loading ? T.muted : "#000",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "bold",
                fontSize: 14,
                marginTop: 4,
                transition: "all 0.2s",
              }}
            >
              {loading
                ? "⏳ Memproses..."
                : mode === "login"
                ? "Masuk →"
                : "Buat Akun →"}
            </button>

            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                margin: "4px 0",
              }}
            >
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <span style={{ color: T.muted, fontSize: 11 }}>atau</span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>

            {/* Biometric */}
            <button
              onClick={handleBiometric}
              disabled={loading}
              style={{
                width: "100%",
                padding: 13,
                borderRadius: 11,
                border: `1px solid ${T.border}`,
                background: T.surface,
                color: T.text,
                cursor: "pointer",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: 16 }}>👆</span>
              <span>
                Login dengan Biometrik (Fitur ini sedang dalam pengembangan)
              </span>
            </button>
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            color: T.muted,
            fontSize: 10,
            marginTop: 20,
            lineHeight: 1.8,
          }}
        >
          Data tersimpan di perangkat Anda · Aman & Private
          <br />
          ⚠️ Bukan layanan investasi resmi
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
