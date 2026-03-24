import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBUKtd-3swn6ZDA3LqHa8nAnNPvz3d7Va0",
  authDomain: "wealthcompass-fee04.firebaseapp.com",
  projectId: "wealthcompass-fee04",
  storageBucket: "wealthcompass-fee04.firebasestorage.app",
  messagingSenderId: "803676982978",
  appId: "1:803676982978:web:f31ccd89d4021b68e8bc83"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth };

function LoginScreen({ onLogin, T }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, provider);
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
        setError('Login gagal. Coba lagi.');
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T?.bg || '#07090c', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: 380, background: T?.card || '#131920', borderRadius: 20, padding: '40px 32px', border: `1px solid ${T?.border || '#1c2636'}`, textAlign: 'center' }}>
        
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 32, fontFamily: "'Playfair Display', Georgia, serif", color: T?.accent || '#d4a843', letterSpacing: 3, fontWeight: 'bold' }}>WEALTH</div>
          <div style={{ fontSize: 10, color: T?.muted || '#4d5866', letterSpacing: 5, marginTop: 4 }}>COMPASS</div>
          <div style={{ width: 36, height: 2, background: T?.accent || '#d4a843', margin: '12px auto 0', borderRadius: 1 }} />
        </div>

        <div style={{ color: T?.textSoft || '#9aa3b0', fontSize: 13, lineHeight: 1.8, marginBottom: 32 }}>
          Kelola kekayaan Anda dengan cerdas.<br />
          <span style={{ color: T?.muted || '#4d5866', fontSize: 11 }}>Mulai perjalanan financial freedom.</span>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{ width: '100%', padding: '14px 20px', borderRadius: 12, border: `1px solid ${T?.border || '#1c2636'}`, background: T?.surface || '#0d1117', color: T?.text || '#ddd8cf', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: loading ? 0.7 : 1 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Menghubungkan...' : 'Masuk dengan Google'}
        </button>

        {error && (
          <div style={{ marginTop: 16, padding: '10px 14px', background: '#f26b6b18', border: '1px solid #f26b6b33', borderRadius: 9, color: '#f26b6b', fontSize: 12 }}>
            {error}
          </div>
        )}

        <div style={{ color: T?.muted || '#4d5866', fontSize: 10, marginTop: 28, lineHeight: 1.7 }}>
          Dengan masuk, Anda menyetujui Syarat & Ketentuan<br />dan Kebijakan Privasi WealthCompass.
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
