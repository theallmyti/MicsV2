import React, { useState } from 'react';

/* ─────────────────────────────────────────────────────────────────
   Inline styles that mirror the HTML mockup's <style> block.
   Tailwind is NOT available here (Vite/React project), so we
   replicate every rule with React inline styles + a small <style>
   tag injected once via a helper component.
───────────────────────────────────────────────────────────────── */

// Design-token colours (matches the Tailwind config in the mockup)
const C = {
  bgBase: '#0f0f0f',
  bgElevated: '#1f1f1f',
  bgInput: '#121212',
  bgOverlay: '#282828',
  bgNav: '#030303',
  surfaceVariant: '#353534',
  primary: '#ffb4a8',
  primaryContainer: '#ff5540',
  onPrimaryContainer: '#5c0000',
  error: '#ffb4ab',
  textPrimary: '#ffffff',
  textSecondary: '#aaaaaa',
  textTertiary: '#717171',
};

// Inject global CSS once (font, body, input focus ring, strength bar)
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      body {
        background-color: ${C.bgBase};
        color: ${C.textPrimary};
        font-family: 'Roboto Flex', sans-serif;
        min-height: 100vh;
      }

      .material-symbols-outlined {
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        font-family: 'Material Symbols Outlined';
        font-style: normal;
        line-height: 1;
        display: inline-block;
        text-transform: none;
        letter-spacing: normal;
        word-wrap: normal;
        white-space: nowrap;
        direction: ltr;
        user-select: none;
      }

      .auth-form-input {
        width: 100%;
        height: 48px;
        padding: 0 16px;
        border-radius: 12px;
        background-color: ${C.bgInput};
        border: 1px solid ${C.surfaceVariant};
        color: ${C.textPrimary};
        font-family: 'Roboto Flex', sans-serif;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
      }
      .auth-form-input::placeholder { color: ${C.textTertiary}; }
      .auth-form-input:focus {
        border-color: ${C.primary};
        background-color: ${C.bgOverlay};
        box-shadow: 0 0 0 1px ${C.primary};
      }
      .auth-form-input.error { border-color: ${C.error}; }

      .auth-password-wrap { position: relative; }
      .auth-password-wrap .auth-form-input { padding-right: 48px; }
      .auth-eye-btn {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        color: ${C.textSecondary};
        display: flex;
        align-items: center;
        transition: color 0.2s;
      }
      .auth-eye-btn:hover { color: ${C.textPrimary}; }

      .strength-bar {
        height: 4px;
        border-radius: 2px;
        background-color: ${C.surfaceVariant};
        overflow: hidden;
      }
      .strength-progress {
        height: 100%;
        width: 0%;
        transition: width 0.3s ease, background-color 0.3s ease;
        border-radius: 2px;
      }

      .auth-google-btn {
        width: 100%;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        background: #ffffff;
        color: #1f1f1f;
        border: none;
        border-radius: 999px;
        font-family: 'Roboto Flex', sans-serif;
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 0.1px;
        cursor: pointer;
        transition: background-color 0.15s ease, transform 0.1s ease;
      }
      .auth-google-btn:hover  { background-color: #e2e2e2; }
      .auth-google-btn:active { transform: scale(0.98); }

      .auth-submit-btn {
        width: 100%;
        height: 48px;
        border-radius: 999px;
        border: none;
        cursor: pointer;
        font-family: 'Roboto Flex', sans-serif;
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 0.1px;
        background-color: ${C.primaryContainer};
        color: ${C.onPrimaryContainer};
        transition: filter 0.15s ease, transform 0.1s ease;
        margin-top: 16px;
      }
      .auth-submit-btn:hover   { filter: brightness(1.1); }
      .auth-submit-btn:active  { transform: scale(0.98); }
      .auth-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

      .auth-spinner {
        display: inline-block;
        animation: spin 1s linear infinite;
        font-size: 18px;
        vertical-align: middle;
        margin-right: 6px;
      }
      @keyframes spin { to { transform: rotate(360deg); } }

      .auth-toggle-link {
        background: none;
        border: none;
        cursor: pointer;
        color: ${C.primary};
        font-family: 'Roboto Flex', sans-serif;
        font-size: 14px;
        font-weight: 700;
        margin-left: 4px;
        padding: 0;
      }
      .auth-toggle-link:hover { text-decoration: underline; }

      .auth-divider {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .auth-divider-line {
        flex: 1;
        height: 1px;
        background-color: ${C.surfaceVariant};
      }
    `}</style>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Password strength helper
───────────────────────────────────────────────────────────────── */
function getStrength(val) {
  let s = 0;
  if (val.length > 5) s += 25;
  if (val.length > 8) s += 25;
  if (/[A-Z]/.test(val)) s += 25;
  if (/[0-9]/.test(val)) s += 25;
  return s;
}
function strengthMeta(s) {
  if (s <= 25) return { label: 'Weak password', color: '#ffb4ab' };
  if (s <= 75) return { label: 'Good password', color: '#fbbc05' };
  return { label: 'Strong password', color: '#acc7ff' };
}

/* ─────────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────────── */
export default function AuthPage({ onAuth }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // Shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Sign-up only
  const [termsChecked, setTermsChecked] = useState(false);

  // ── validation ──────────────────────────────────────────────────
  function validate() {
    let valid = true;
    if (!email || !email.includes('@')) {
      setEmailError('Please enter a valid email address');
      valid = false;
    } else {
      setEmailError('');
    }
    return valid;
  }

  // ── toggle sign-in ↔ create account ─────────────────────────────
  function toggleMode() {
    setIsSignUp(v => !v);
    setEmailError('');
    setGlobalError('');
    setPassword('');
  }

  // ── form submit ──────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setGlobalError('');
    setLoading(true);
    try {
      const result = isSignUp
        ? await onAuth({ action: 'register', email, password, username: email.split('@')[0], displayName: email.split('@')[0] })
        : await onAuth({ action: 'login', email, password });
      if (!result?.success) {
        setGlobalError(result?.error || (isSignUp ? 'Registration failed.' : 'Login failed. Check your credentials.'));
      }
    } catch {
      setGlobalError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── password strength (sign-up only) ────────────────────────────
  const strength = isSignUp ? getStrength(password) : 0;
  const { label: strengthLabel, color: strengthColor } = strengthMeta(strength);

  // ── render ───────────────────────────────────────────────────────
  return (
    <>
      <GlobalStyles />

      {/* Page wrapper */}
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: C.bgBase,
        position: 'relative',
        overflowY: 'auto',
      }}>

        {/* ── Top nav (logo only) ── */}
        <header style={{
          position: 'fixed',
          top: 0,
          width: '100%',
          height: 56,
          backgroundColor: C.bgNav,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          zIndex: 50,
          gap: 8,
        }}>
          <span
            className="material-symbols-outlined"
            style={{ color: C.primary, fontSize: 30, fontVariationSettings: "'FILL' 1" }}
          >play_circle</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: C.textPrimary, letterSpacing: '-0.5px' }}>
            YouTube Music
          </span>
        </header>

        {/* ── Main canvas ── */}
        <main style={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          paddingTop: 'calc(56px + 24px)',
        }}>

          {/* Auth card */}
          <div style={{
            width: '100%',
            maxWidth: 400,
            backgroundColor: C.bgElevated,
            borderRadius: 12,
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}>

            {/* ── Header ── */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span
                className="material-symbols-outlined"
                style={{ color: C.primary, fontSize: 48, marginBottom: 8, fontVariationSettings: "'FILL' 1" }}
              >play_circle</span>
              <h1 style={{ fontSize: 32, fontWeight: 700, lineHeight: '40px', color: C.textPrimary }}>
                {isSignUp ? 'Create account' : 'Sign in'}
              </h1>
              <p style={{ fontSize: 14, lineHeight: '20px', color: C.textSecondary }}>
                {isSignUp ? 'Start your musical journey today' : 'to continue to YouTube Music'}
              </p>
            </div>

            {/* ── Global error ── */}
            {globalError && (
              <div style={{
                background: 'rgba(255,180,171,0.1)',
                border: `1px solid rgba(255,180,171,0.35)`,
                borderRadius: 8,
                padding: '10px 14px',
                color: C.error,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                ⚠️ {globalError}
              </div>
            )}

            {/* ── Google button ── */}
            <button className="auth-google-btn" type="button" onClick={() => setGlobalError('Google sign-in not configured yet.')}>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285f4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34a853" />
                <path d="M3.964 10.71a5.41 5.41 0 0 1-.282-1.71c0-.6.102-1.183.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#fbbc05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#ea4335" />
              </svg>
              Continue with Google
            </button>

            {/* ── Divider ── */}
            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span style={{ fontSize: 12, color: C.textTertiary, textTransform: 'uppercase', letterSpacing: 1 }}>or</span>
              <div className="auth-divider-line" />
            </div>

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label htmlFor="auth-email" style={{ fontSize: 12, color: C.textSecondary, paddingLeft: 4 }}>
                  Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                  className={`auth-form-input${emailError ? ' error' : ''}`}
                  autoComplete="email"
                />
                {emailError && (
                  <span style={{ color: C.error, fontSize: 12, paddingLeft: 4, marginTop: 2 }}>
                    {emailError}
                  </span>
                )}
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label htmlFor="auth-password" style={{ fontSize: 12, color: C.textSecondary, paddingLeft: 4 }}>
                  Password
                </label>
                <div className="auth-password-wrap">
                  <input
                    id="auth-password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="auth-form-input"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPass(v => !v)}
                    aria-label="Toggle password visibility"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                      {showPass ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>

                {/* Sign-up extras */}
                {isSignUp && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Strength bar */}
                    <div className="strength-bar">
                      <div
                        className="strength-progress"
                        style={{ width: `${strength}%`, backgroundColor: strengthColor }}
                      />
                    </div>
                    <p style={{ fontSize: 11, color: C.textTertiary, fontWeight: 400 }}>
                      {password ? strengthLabel : 'Password strength'}
                    </p>

                    {/* Terms checkbox */}
                    <label style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      cursor: 'pointer',
                      marginTop: 4,
                    }}>
                      <input
                        type="checkbox"
                        checked={termsChecked}
                        onChange={e => setTermsChecked(e.target.checked)}
                        style={{ marginTop: 2, width: 16, height: 16, accentColor: C.primary, flexShrink: 0 }}
                      />
                      <span style={{ fontSize: 14, color: C.textSecondary, lineHeight: '18px' }}>
                        I agree to the Terms of Service and Privacy Policy.
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading || (isSignUp && !termsChecked)}
              >
                {loading ? (
                  <>
                    <span className="auth-spinner material-symbols-outlined" style={{ fontSize: 18 }}>
                      progress_activity
                    </span>
                    {isSignUp ? 'Creating account…' : 'Signing in…'}
                  </>
                ) : (
                  isSignUp ? 'Create account' : 'Sign in'
                )}
              </button>
            </form>

            {/* ── Footer toggle ── */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: C.textSecondary }}>
                {isSignUp ? 'Already have an account?' : 'New to Mics?'}
                <button className="auth-toggle-link" onClick={toggleMode}>
                  {isSignUp ? 'Sign in' : 'Create account'}
                </button>
              </p>
            </div>
          </div>
        </main>

        {/* ── Atmospheric gradient footer ── */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          height: 307,
          pointerEvents: 'none',
          zIndex: -1,
          background: 'linear-gradient(to top, rgba(255,85,64,0.12), transparent)',
          opacity: 0.5,
        }} />
      </div>
    </>
  );
}
