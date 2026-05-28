# Graph Report - .  (2026-05-28)

## Corpus Check
- Large corpus: 71 files · ~583,437 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 142 nodes · 170 edges · 20 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `HistoryStore` - 14 edges
2. `PlaybackStore` - 13 edges
3. `ListenTracker` - 6 edges
4. `PlayerStatePersistence` - 6 edges
5. `BrowserQueue` - 4 edges
6. `proxyThumb()` - 3 edges
7. `getBestThumbnail()` - 3 edges
8. `mapYTMusicTrack()` - 3 edges
9. `getAudioUrlViaPuppeteer()` - 3 edges
10. `loadSearchHistory()` - 3 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Affinity Component"
Cohesion: 0.1
Nodes (5): deleteSearchHistoryItem(), loadSearchHistory(), saveSearchQuery(), defaultEnergyForHour(), getSectionInfluenceParams()

### Community 1 - "Server Component"
Cohesion: 0.15
Nodes (9): boot(), BrowserQueue, getAudioUrlViaPuppeteer(), getBestThumbnail(), initYTMusic(), mapYouTubeSrTrack(), mapYTMusicTrack(), parseDuration() (+1 more)

### Community 2 - "Store Component"
Cohesion: 0.2
Nodes (1): HistoryStore

### Community 3 - "Playbackstore Component"
Cohesion: 0.15
Nodes (1): PlaybackStore

### Community 4 - "Engine Component"
Cohesion: 0.22
Nodes (0): 

### Community 5 - "Scoring Component"
Cohesion: 0.25
Nodes (0): 

### Community 6 - "Tracker Component"
Cohesion: 0.47
Nodes (1): ListenTracker

### Community 7 - "Hooks Component"
Cohesion: 0.33
Nodes (0): 

### Community 8 - "Reanimated Component"
Cohesion: 0.53
Nodes (4): useMobileCardStyle(), useMobileWobbleStyle(), withSpringMock(), withTimingMock()

### Community 9 - "Playerstatepersistence Component"
Cohesion: 0.33
Nodes (1): PlayerStatePersistence

### Community 10 - "Listenstore Component"
Cohesion: 0.6
Nodes (3): getHistoryMap(), getListenHistory(), recordListenEvent()

### Community 11 - "Profilebuilder Component"
Cohesion: 0.67
Nodes (2): applyTimeDecay(), buildUserProfile()

### Community 12 - "Similarity Component"
Cohesion: 0.83
Nodes (3): computeAudioSimilarity(), computeGenreOverlap(), computeTrackSimilarity()

### Community 13 - "Supabase Component"
Cohesion: 0.67
Nodes (0): 

### Community 14 - "Authpage Component"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "Test Component"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Test Component"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Test Component"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Test Component"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Vite Component"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Authpage Component`** (2 nodes): `AuthPage.jsx`, `AuthPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Test Component`** (1 nodes): `test-measure.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Test Component`** (1 nodes): `test-puppeteer.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Test Component`** (1 nodes): `test_js.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Test Component`** (1 nodes): `test_url.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Component`** (1 nodes): `vite.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HistoryStore` connect `Store Component` to `Affinity Component`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `PlaybackStore` connect `Playbackstore Component` to `Affinity Component`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `PlayerStatePersistence` connect `Playerstatepersistence Component` to `Affinity Component`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Should `Affinity Component` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._