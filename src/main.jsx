import React, { useState, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AuthPage from './AuthPage.jsx'
import { historyStore } from './history/store'
import { listenTracker } from './history/tracker'
import { playbackStore } from './history/playbackStore'
import { playerStatePersistence } from './player/playerStatePersistence'
import { ConvexProvider, ConvexReactClient, useQuery, useAction } from 'convex/react'
import { api } from '../convex/_generated/api'

// ── Session key ────────────────────────────────────────────────────
const SESSION_TOKEN_KEY = 'mics_session_token'

// ── Convex client ──────────────────────────────────────────────────
const convexUrl = import.meta.env.VITE_CONVEX_URL
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null

// ── Init stores (sync, before render) ─────────────────────────────
historyStore.hydrate()
const savedPlayerState = playerStatePersistence.loadSavedState()
if (savedPlayerState) playbackStore.initFromSavedState(savedPlayerState)
listenTracker.init(playbackStore, historyStore)
playerStatePersistence.init(playbackStore)

// ─────────────────────────────────────────────────────────────────
// AuthGate: validates session token via Convex, shows auth or app
// ─────────────────────────────────────────────────────────────────
function AuthGate() {
  const [sessionToken, setSessionToken] = useState(
    () => localStorage.getItem(SESSION_TOKEN_KEY)
  )
  const [authChecked, setAuthChecked] = useState(false)

  // Convex hooks — always called, never conditional
  const registerAction = useAction(api.auth.register)
  const loginAction = useAction(api.auth.login)

  // Validate token against cloud Convex on every load
  const me = useQuery(
    api.auth.getMe,
    sessionToken ? { token: sessionToken } : 'skip'
  )

  // Once the query resolves (undefined = loading, null = invalid, obj = valid)
  useEffect(() => {
    if (me === undefined) return // still loading

    if (me === null && sessionToken) {
      // Token exists in localStorage but is invalid/expired in cloud DB → clear it
      console.log('[Auth] Stale token cleared')
      localStorage.removeItem(SESSION_TOKEN_KEY)
      setSessionToken(null)
    }

    setAuthChecked(true)
  }, [me, sessionToken])

  // If no token at all, we know immediately
  useEffect(() => {
    if (!sessionToken) setAuthChecked(true)
  }, [])

  const handleAuth = useCallback(async ({ action, email, password, username, displayName }) => {
    try {
      let result
      if (action === 'login') {
        result = await loginAction({ email, password })
      } else {
        result = await registerAction({ email, username, password, displayName })
      }

      if (result?.token) {
        localStorage.setItem(SESSION_TOKEN_KEY, result.token)
        setSessionToken(result.token)
        setAuthChecked(true)
        return { success: true, user: result.user }
      }
      return { success: false, error: 'No token received from server' }
    } catch (err) {
      const msg =
        err?.data?.message ||
        err?.message?.replace('Uncaught Error: ', '') ||
        'Something went wrong'
      return { success: false, error: msg }
    }
  }, [loginAction, registerAction])

  const handleLogout = useCallback(async () => {
    if (sessionToken) {
      try {
        await convex.mutation(api.auth.logout, { token: sessionToken })
      } catch {}
    }
    localStorage.removeItem(SESSION_TOKEN_KEY)
    setSessionToken(null)
    setAuthChecked(false)
    setTimeout(() => setAuthChecked(true), 50)
  }, [sessionToken])

  // Loading spinner while validating token
  if (!authChecked || (sessionToken && me === undefined)) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{
          width: 48, height: 48,
          border: '3px solid rgba(225,29,72,0.2)',
          borderTopColor: '#e11d48',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', margin: 0 }}>
          Connecting to Mics…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // Not authenticated → show login page
  if (!sessionToken || !me) {
    return <AuthPage onAuth={handleAuth} />
  }

  // Authenticated → show music app with user context
  return (
    <App
      initialPlayerState={savedPlayerState}
      sessionToken={sessionToken}
      convexUser={me}
      onLogout={handleLogout}
    />
  )
}

// ─────────────────────────────────────────────────────────────────
// Render
// ─────────────────────────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById('root'))

if (convex) {
  root.render(
    <React.StrictMode>
      <ConvexProvider client={convex}>
        <AuthGate />
      </ConvexProvider>
    </React.StrictMode>
  )
} else {
  // No Convex configured → run without auth
  root.render(
    <React.StrictMode>
      <App initialPlayerState={savedPlayerState} />
    </React.StrictMode>
  )
}

// Dev tools
if (import.meta.env.DEV) {
  window.historyStore = historyStore
  window.playbackStore = playbackStore
  window.listenTracker = listenTracker
  window.playerStatePersistence = playerStatePersistence
}
