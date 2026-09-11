import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { historyStore } from './history/store'
import { listenTracker } from './history/tracker'
import { playbackStore } from './history/playbackStore'
import { playerStatePersistence } from './player/playerStatePersistence'

// ── Init stores (sync, before render) ─────────────────────────────
historyStore.hydrate()
const savedPlayerState = playerStatePersistence.loadSavedState()
if (savedPlayerState) playbackStore.initFromSavedState(savedPlayerState)
listenTracker.init(playbackStore, historyStore)
playerStatePersistence.init(playbackStore)

// ─────────────────────────────────────────────────────────────────
// Render
// ─────────────────────────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <React.StrictMode>
    <App initialPlayerState={savedPlayerState} />
  </React.StrictMode>
)

// Dev tools
if (import.meta.env.DEV) {
  window.historyStore = historyStore
  window.playbackStore = playbackStore
  window.listenTracker = listenTracker
  window.playerStatePersistence = playerStatePersistence
}
