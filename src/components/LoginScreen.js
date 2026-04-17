import React, { useState, useEffect } from 'react';

const WPLogo = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="0.5" y="0.5" width="23" height="23" rx="5" fill="#0d1117" stroke="#f59e0b" strokeWidth="1.2"/>
    <polyline points="0.5,13 2,13 2.8,10.5 3.8,15.5 4.6,13 5.5,13" stroke="#f59e0b" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"/>
    <polyline points="5,5.5 7,16.5 9.5,10 12,16.5 14,5.5" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="15" y1="5.5" x2="15" y2="17" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M15,5.5 Q21.5,5.5 21.5,9.25 Q21.5,13 15,13" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <polyline points="21.5,13 22,13 22.5,11 23,15 23.5,13" stroke="#f59e0b" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"/>
  </svg>
);
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBUKtd-3swn6ZDA3lqHa8nAnNPvZ3d7Va0",
  authDomain: "wealthcompass-fee04.firebaseapp.com",
  projectId: "wealthcompass-fee04",
  storageBucket: "wealthcompass-fee04.firebasestorage.app",
  messagingSenderId: "803676982970",
  appId: "1:803676982970:web:f31ccd09d4021b60e0bc83"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth };

function LoginScreen({ onLogin, T, keepSignIn, setKeepSignIn }) {
  const [mode, setMode] = useState('login'); // login | register | forgot
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [checking, setChecking] = useState(true);

  // Auto-login jika sudah ada sesi Firebase
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      const isGoogle = user?.providerData?.some(p => p.providerId === 'google.com');
      if (user && (user.emailVerified || isGoogle)) {
        const userData = {
          email: user.email,
          name: user.displayName || user.email.split('@')[0],
          photo: user.photoURL,
          uid: user.uid,
        };
        localStorage.setItem('wc_session', JSON.stringify(userData));
        onLogin(userData);
      }
      setChecking(false);
    });
    return () => unsub();
  }, []);

  const handleEmailSubmit = async () => {
    setError('');
    setInfo('');
    if (mode === 'forgot') {
      if (!form.email) { setError('Masukkan email Anda.'); return; }
    } else {
      if (!form.email || !form.password) { setError('Email dan password wajib diisi.'); return; }
      if (mode === 'register' && !form.name) { setError('Nama wajib diisi.'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Format email tidak valid.'); return; }
      if (form.password.length < 6) { setError('Password minimal 6 karakter.'); return; }
    }

    setLoading(true);
    try {
      if (mode === 'forgot') {
      try {
        await sendPasswordResetEmail(auth, form.email);
        setInfo('Email reset password sudah dikirim. Cek inbox Anda.');
        setError('');
      } catch (e) {
        setError('Email tidak ditemukan atau terjadi kesalahan.');
      }
      setLoading(false);
      return;
    }
    if (mode === 'register') {
        const result = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(result.user, { displayName: form.name });
        await sendEmailVerification(result.user);
        await auth.signOut();
        setInfo('✓ Akun dibuat! Cek email kamu untuk verifikasi sebelum login.');
        setMode('login');
        setForm(p => ({ ...p, password: '' }));
      } else {
        const result = await signInWithEmailAndPassword(auth, form.email, form.password);
        if (!result.user.emailVerified) {
          await auth.signOut();
          setError('Email belum diverifikasi. Cek inbox kamu.');
          setLoading(false);
          return;
        }
        const userData = {
          email: result.user.email,
          name: result.user.displayName || result.user.email.split('@')[0],
          photo: result.user.photoURL,
          uid: result.user.uid,
        };
        localStorage.setItem('wc_session', JSON.stringify(userData));
        onLogin(userData);
      }
    } catch (e) {
      const msg = {
        'auth/email-already-in-use': 'Email sudah terdaftar.',
        'auth/user-not-found': 'Email tidak ditemukan.',
        'auth/wrong-password': 'Password salah.',
        'auth/invalid-credential': 'Email atau password salah.',
        'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi nanti.',
      };
      setError(msg[e.code] || `Error: ${e.code}`);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userData = {
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        photo: user.photoURL,
        uid: user.uid,
      };
      localStorage.setItem('wc_session', JSON.stringify(userData));
      onLogin(userData);
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        setError('Login Google gagal. Coba lagi.');
      }
    }
    setLoading(false);
  };

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T?.bg || '#07090c' }}>
        <div style={{ color: '#9aa3b0', fontSize: 13 }}>Memuat...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <WPLogo size={80} />
          </div>
          <div style={{ color: T.accent, fontSize: 18, fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 'bold', letterSpacing: 3 }}>
            WEALTH PULSE
          </div>
          <div style={{ color: T.muted, fontSize: 11, letterSpacing: 3, marginTop: 4 }}>
            PORTFOLIO INTELLIGENCE
          </div>
        </div>

        {/* Card */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: 28, boxShadow: `0 24px 60px ${T.shadow}` }}>

          {/* Tab toggle */}
          <div style={{ display: 'flex', background: T.surface, borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {[['login', 'Masuk'], ['register', 'Daftar'], ['forgot', 'Lupa Password']].map(([m, l]) => (
              <button key={m} onClick={() => { setMode(m); setError(''); setInfo(''); }}
                style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: mode === m ? T.accent : 'none', color: mode === m ? '#000' : T.muted, cursor: 'pointer', fontWeight: mode === m ? 'bold' : 'normal', fontSize: 13, transition: 'all 0.2s' }}>
                {l}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Nama - hanya saat register */}
            {mode === 'register' && (
              <div>
                <div style={{ color: T.textSoft, fontSize: 11, marginBottom: 5 }}>Nama Lengkap</div>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Nama kamu"
                  style={{ width: '100%', boxSizing: 'border-box', background: T.inputBg, border: `1px solid ${T.border}`, color: T.text, borderRadius: 10, padding: '11px 14px', fontSize: 13, outline: 'none' }} />
              </div>
            )}

            {/* Email */}
            <div>
              <div style={{ color: T.textSoft, fontSize: 11, marginBottom: 5 }}>Email</div>
              <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="email@contoh.com" type="email"
                style={{ width: '100%', boxSizing: 'border-box', background: T.inputBg, border: `1px solid ${T.border}`, color: T.text, borderRadius: 10, padding: '11px 14px', fontSize: 13, outline: 'none' }} />
            </div>

            {/* Password - hidden for forgot mode */}
            {mode !== 'forgot' && <div>
              <div style={{ color: T.textSoft, fontSize: 11, marginBottom: 5 }}>Password</div>
              <div style={{ position: 'relative', width: '100%' }}>
                <input value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
                  placeholder="Min. 6 karakter" type={showPass ? 'text' : 'password'}
                  style={{ width: '100%', boxSizing: 'border-box', background: T.inputBg, border: `1px solid ${T.border}`, color: T.text, borderRadius: 10, padding: '11px 40px 11px 14px', fontSize: 13, outline: 'none' }} />
                <button onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 14 }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>}

            {/* Error */}
            {error && (
              <div style={{ padding: '9px 12px', background: T.redDim, border: `1px solid ${T.red}33`, borderRadius: 9, color: T.red, fontSize: 12 }}>
                {error}
              </div>
            )}

            {/* Info (verifikasi email) */}
            {info && (
              <div style={{ padding: '9px 12px', background: T.greenDim, border: `1px solid ${T.green}33`, borderRadius: 9, color: T.green, fontSize: 12 }}>
                {info}
              </div>
            )}

            {/* Keep sign in checkbox - only shown on login/register mode */}
            {mode !== 'forgot' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', marginTop: 2 }}>
                <input
                  type="checkbox"
                  checked={keepSignIn ?? true}
                  onChange={e => setKeepSignIn && setKeepSignIn(e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: T.accent, cursor: 'pointer', flexShrink: 0 }}
                />
                <span style={{ fontSize: 12, color: T.textSoft }}>
                  Tetap masuk <span style={{ color: T.muted, fontSize: 11 }}>(jika tidak dicentang, logout otomatis setelah 1 jam tidak aktif)</span>
                </span>
              </label>
            )}

            {/* Tombol submit */}
            <button onClick={handleEmailSubmit} disabled={loading}
              style={{ width: '100%', padding: 13, borderRadius: 11, border: 'none', background: loading ? T.border : T.accent, color: loading ? T.muted : '#000', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: 14, marginTop: 4, transition: 'all 0.2s' }}>
              {loading ? '⏳ Memproses...' : mode === 'login' ? 'Masuk →' : mode === 'forgot' ? 'Kirim Email Reset →' : 'Buat Akun →'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <span style={{ color: T.muted, fontSize: 11 }}>atau</span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>

            {/* Google Login */}
            <button onClick={handleGoogleLogin} disabled={loading}
              style={{ width: '100%', padding: 13, borderRadius: 11, border: `1px solid ${T.border}`, background: T.surface, color: T.text, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s', opacity: loading ? 0.7 : 1 }}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Masuk dengan Google
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', color: T.muted, fontSize: 10, marginTop: 20, lineHeight: 1.8 }}>
          Data tersimpan aman · ⚠️ Bukan layanan investasi resmi
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
