import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Agentation } from "agentation";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  pageVariants,
  cardVariants,
  cardPlayButtonVariants,
  cardArtworkOverlayVariants,
  speedDialTileVariants,
  speedDialRemoveButtonVariants,
  speedDialTileExitVariants,
  playerBarVariants,
  trackInfoVariants,
  artworkVariants,
  playPauseIconVariants,
  playPauseButtonVariants,
  likeButtonVariants,
  likeParticleVariants,
  progressBarThumbVariants,
  progressFillVariants,
  equalizerBarVariants,
  nowPlayingExpandVariants,
  nowPlayingArtworkVariants,
  nowPlayingBackgroundVariants,
  lyricsLineVariants,
  lyricsScrollVariants,
  queuePanelVariants,
  queueItemVariants,
  toastVariants,
  modalOverlayVariants,
  modalCardVariants,
  sidebarItemActiveIndicatorVariants,
  chipVariants,
  shimmerVariants,
  waveformBarVariants,
  vinylRotationVariants,
  contextMenuVariants,
  contextMenuItemVariants,
  sectionHeaderVariants,
  sectionCardStaggerVariants,
  sectionCardItemVariants
} from './motion/variants';
import { 
  useReducedMotion,
  useDominantColor,
  useAudioAnalyser,
  useSpringCounter,
  useLyricsSync
} from './motion/hooks';
import { enrichTrack } from './recommendation/types';
import { useRecommendations } from './recommendation/useRecommendations';
import { recordListenEvent } from './recommendation/listenStore';
import { ListenAgainSection } from './components/home/ListenAgain';
import { playbackStore } from './history/playbackStore';
import { historyStore } from './history/store';
import { useListenHistory } from './history/useListenHistory';
import { scoreTrackAgainstHistory } from './history/homeInfluence';
import { playerStatePersistence } from './player/playerStatePersistence';
const leftPathVariants = {
  play: { d: "M 8,5 L 13.5,8.5 L 13.5,15.5 L 8,19 Z" },
  pause: { d: "M 6,5 L 10,5 L 10,19 L 6,19 Z" }
};

const rightPathVariants = {
  play: { d: "M 13.5,8.5 L 19,12 L 19,12 L 13.5,15.5 Z" },
  pause: { d: "M 14,5 L 18,5 L 18,19 L 14,19 Z" }
};


const MOCK_ARTISTS = {
  'the midnight soul': {
    name: 'The Midnight Soul',
    img: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&h=400&fit=crop&q=80',
    subscribers: '4.2M',
    listeners: '12M',
    tracks: [
      { id: '2g5y74q1P7c', title: 'Moonlight Echoes', artist: 'The Midnight Soul', album: 'Neon Dreams', duration: 225, thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop&q=80' },
      { id: 'neV3EPWRLIY', title: 'Velvet Shadows', artist: 'The Midnight Soul', album: 'Velvet Shadows', duration: 252, thumbnail: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&h=400&fit=crop&q=80' },
      { id: 'r9-V4Drc7tA', title: 'Midnight Drive', artist: 'The Midnight Soul', album: 'Single', duration: 200, thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop&q=80' },
      { id: '7-x3Y1S3b0s', title: 'Celestial Bloom', artist: 'The Midnight Soul', album: 'Neon Dreams', duration: 302, thumbnail: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=400&h=400&fit=crop&q=80' }
    ],
    albums: [
      { id: 'neon-dreams', title: 'Neon Dreams', artist: 'The Midnight Soul', year: '2023', type: 'Album', thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&h=400&fit=crop&q=80' },
      { id: 'velvet-shadows-album', title: 'Velvet Shadows', artist: 'The Midnight Soul', year: '2021', type: 'Album', thumbnail: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&h=400&fit=crop&q=80' },
      { id: 'urban-solitude', title: 'Urban Solitude', artist: 'The Midnight Soul', year: '2019', type: 'Album', thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=400&fit=crop&q=80' },
      { id: 'the-quiet-storm', title: 'The Quiet Storm', artist: 'The Midnight Soul', year: '2018', type: 'Album', thumbnail: 'https://images.unsplash.com/photo-1487180142328-054b783fc471?w=400&h=400&fit=crop&q=80' }
    ],
    singles: [
      { id: 'midnight-drive-single', title: 'Midnight Drive', artist: 'The Midnight Soul', year: '2023', type: 'Single', thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop&q=80' },
      { id: 'city-lights-single', title: 'City Lights', artist: 'The Midnight Soul', year: '2022', type: 'Single', thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=400&fit=crop&q=80' },
      { id: 'after-hours-single', title: 'After Hours', artist: 'The Midnight Soul', year: '2022', type: 'Single', thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop&q=80' }
    ]
  },
  'echo chamber': {
    name: 'Echo Chamber',
    img: 'https://images.unsplash.com/photo-1516280440614-37939bbacd6a?w=400&h=400&fit=crop&q=80',
    subscribers: '1.2M',
    listeners: '4.5M',
    tracks: [
      { id: '3tmd-ClpJKA', title: 'Ethereal Echoes', artist: 'Echo Chamber', album: 'Chamber Vibes', duration: 280, thumbnail: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=400&fit=crop&q=80' }
    ],
    albums: [
      { id: 'chamber-vibes', title: 'Chamber Vibes', artist: 'Echo Chamber', year: '2022', type: 'Album', thumbnail: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=400&fit=crop&q=80' }
    ],
    singles: []
  },
  'lia moon': {
    name: 'Lia Moon',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&q=80',
    subscribers: '890K',
    listeners: '3M',
    tracks: [
      { id: '7-x3Y1S3b0s', title: 'Moonlight Shadow', artist: 'Lia Moon', album: 'Lia Moods', duration: 180, thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&q=80' }
    ],
    albums: [
      { id: 'lia-moods', title: 'Lia Moods', artist: 'Lia Moon', year: '2023', type: 'Album', thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&q=80' }
    ],
    singles: []
  },
  'vance rivers': {
    name: 'Vance Rivers',
    img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&q=80',
    subscribers: '2.5M',
    listeners: '9M',
    tracks: [
      { id: 'neV3EPWRLIY', title: 'River Reflections', artist: 'Vance Rivers', album: 'Flow', duration: 250, thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&q=80' }
    ],
    albums: [
      { id: 'flow-album', title: 'Flow', artist: 'Vance Rivers', year: '2021', type: 'Album', thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&q=80' }
    ],
    singles: []
  },
  'silas grey': {
    name: 'Silas Grey',
    img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=400&fit=crop&q=80',
    subscribers: '3.1M',
    listeners: '11M',
    tracks: [
      { id: 'r9-V4Drc7tA', title: 'Silas Solitude', artist: 'Silas Grey', album: 'Grey Skies', duration: 230, thumbnail: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=400&fit=crop&q=80' }
    ],
    albums: [
      { id: 'grey-skies-album', title: 'Grey Skies', artist: 'Silas Grey', year: '2023', type: 'Album', thumbnail: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=400&fit=crop&q=80' }
    ],
    singles: []
  },
  'the weeknd': {
    name: 'The Weeknd',
    img: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop&q=80',
    subscribers: '32.1M',
    listeners: '108M',
    tracks: [
      { id: 'R9U0o0uI1x8', title: 'Alone Again', artist: 'The Weeknd', album: 'After Hours (Deluxe)', duration: 250, thumbnail: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop&q=80' },
      { id: 'FstLrs4T-iI', title: 'Too Late', artist: 'The Weeknd', album: 'After Hours (Deluxe)', duration: 239, thumbnail: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop&q=80' },
      { id: '5wBvE639_tM', title: 'Hardest To Love', artist: 'The Weeknd', album: 'After Hours (Deluxe)', duration: 211, thumbnail: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop&q=80' },
      { id: '3KzO_V_Wb08', title: 'Scared To Live', artist: 'The Weeknd', album: 'After Hours (Deluxe)', duration: 191, thumbnail: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop&q=80' },
      { id: '2Z2hS_t7654', title: 'Snowchild', artist: 'The Weeknd', album: 'After Hours (Deluxe)', duration: 247, thumbnail: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop&q=80' },
      { id: 'Vd6199w6K9E', title: 'Escape from LA', artist: 'The Weeknd', album: 'After Hours (Deluxe)', duration: 355, thumbnail: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop&q=80' }
    ],
    albums: [
      { id: 'after-hours-deluxe', title: 'After Hours (Deluxe)', artist: 'The Weeknd', year: '2020', type: 'Album', thumbnail: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop&q=80' }
    ],
    singles: []
  }
};

const MOCK_ALBUMS = {
  'after-hours-deluxe': {
    title: 'After Hours (Deluxe)',
    artist: 'The Weeknd',
    type: 'Album',
    year: '2020',
    thumbnail: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=640&h=640&fit=crop&q=80',
    tracks: [
      { id: 'R9U0o0uI1x8', title: 'Alone Again', artist: 'The Weeknd', album: 'After Hours (Deluxe)', duration: 250, thumbnail: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=640&h=640&fit=crop&q=80' },
      { id: 'FstLrs4T-iI', title: 'Too Late', artist: 'The Weeknd', album: 'After Hours (Deluxe)', duration: 239, thumbnail: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=640&h=640&fit=crop&q=80' },
      { id: '5wBvE639_tM', title: 'Hardest To Love', artist: 'The Weeknd', album: 'After Hours (Deluxe)', duration: 211, thumbnail: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=640&h=640&fit=crop&q=80' },
      { id: '3KzO_V_Wb08', title: 'Scared To Live', artist: 'The Weeknd', album: 'After Hours (Deluxe)', duration: 191, thumbnail: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=640&h=640&fit=crop&q=80' },
      { id: 'RzfGZ1S-I28', title: 'Snowchild', artist: 'The Weeknd', album: 'After Hours (Deluxe)', duration: 247, thumbnail: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=640&h=640&fit=crop&q=80' },
      { id: 'Vd6199w6K9E', title: 'Escape from LA', artist: 'The Weeknd', album: 'After Hours (Deluxe)', duration: 355, thumbnail: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=640&h=640&fit=crop&q=80' }
    ]
  },
  'neon-dreams': {
    title: 'Neon Dreams',
    artist: 'The Midnight Soul',
    type: 'Album',
    year: '2023',
    thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=640&h=640&fit=crop&q=80',
    tracks: [
      { id: '2g5y74q1P7c', title: 'Moonlight Echoes', artist: 'The Midnight Soul', album: 'Neon Dreams', duration: 225, thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=640&h=640&fit=crop&q=80' },
      { id: '7-x3Y1S3b0s', title: 'Celestial Bloom', artist: 'The Midnight Soul', album: 'Neon Dreams', duration: 302, thumbnail: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=640&h=640&fit=crop&q=80' }
    ]
  },
  'velvet-shadows-album': {
    title: 'Velvet Shadows',
    artist: 'The Midnight Soul',
    type: 'Album',
    year: '2021',
    thumbnail: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=640&h=640&fit=crop&q=80',
    tracks: [
      { id: 'neV3EPWRLIY', title: 'Velvet Shadows', artist: 'The Midnight Soul', album: 'Velvet Shadows', duration: 252, thumbnail: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=640&h=640&fit=crop&q=80' }
    ]
  },
  'cyberpunk-essentials': {
    title: 'Cyberpunk Essentials',
    artist: 'Mics',
    type: 'Playlist',
    year: '2024',
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=640&h=640&fit=crop&q=80',
    tracks: [
      { id: '2g5y74q1P7c', title: 'Neon Horizon', artist: 'Electric Dream', album: 'Cyberpunk Essentials', duration: 210, thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=640&h=640&fit=crop&q=80' },
      { id: 'r9-V4Drc7tA', title: 'Techno Pulse', artist: 'Circuitry', album: 'Cyberpunk Essentials', duration: 250, thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=640&h=640&fit=crop&q=80' }
    ]
  },
  'midnight-melancholy': {
    title: 'Midnight Melancholy',
    artist: 'Mics',
    type: 'Playlist',
    year: '2024',
    thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=640&h=640&fit=crop&q=80',
    tracks: [
      { id: 'neV3EPWRLIY', title: 'Midnight Jazz Essentials', artist: 'Mics', album: 'Midnight Melancholy', duration: 180, thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=640&h=640&fit=crop&q=80' }
    ]
  },
  'lo-fi-coding-beats': {
    title: 'Lo-Fi Coding Beats',
    artist: 'Mics',
    type: 'Playlist',
    year: '2024',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=640&h=640&fit=crop&q=80',
    tracks: [
      { id: '7-x3Y1S3b0s', title: 'Unplugged Sessions', artist: 'Acoustic Soul', album: 'Lo-Fi Coding Beats', duration: 180, thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=640&h=640&fit=crop&q=80' },
      { id: '3tmd-ClpJKA', title: 'Ethereal Echoes', artist: 'Cloud Walker', album: 'Lo-Fi Coding Beats', duration: 280, thumbnail: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=640&h=640&fit=crop&q=80' }
    ]
  }
};
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:3001`;

const resolveThumbnails = (data) => {
  if (!data) return data;
  const baseUrl = API_BASE_URL;
  
  const fixUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('/api/')) {
      return `${baseUrl}${url}`;
    }
    if (url.startsWith('http://localhost:3001/api/')) {
      return url.replace('http://localhost:3001/api/', `${baseUrl}/api/`);
    }
    return url;
  };

  const fixTrack = (track) => {
    if (!track) return track;
    return {
      ...track,
      thumbnail: fixUrl(track.thumbnail)
    };
  };

  if (Array.isArray(data)) {
    return data.map(item => {
      if (item.contents && Array.isArray(item.contents)) {
        return {
          ...item,
          contents: item.contents.map(fixTrack)
        };
      }
      return fixTrack(item);
    });
  } else if (typeof data === 'object') {
    if (data.contents && Array.isArray(data.contents)) {
      return {
        ...data,
        contents: data.contents.map(fixTrack)
      };
    }
    if (data.tracks && Array.isArray(data.tracks)) {
      return {
        ...data,
        thumbnail: fixUrl(data.thumbnail),
        tracks: data.tracks.map(fixTrack)
      };
    }
    if (data.url) {
      return {
        ...data,
        url: fixUrl(data.url)
      };
    }
    return fixTrack(data);
  }
  return data;
};

const SEARCH_HISTORY_KEY = "mics_search_history";
const MAX_HISTORY_ITEMS = 20; // store 20, display 7

const loadSearchHistory = () => {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!raw) {
      const sampleHistory = [
        { query: "om shanti om",      searchedAt: Date.now() - 1000 * 60 * 5   },
        { query: "raabta",            searchedAt: Date.now() - 1000 * 60 * 18  },
        { query: "ghungroo",          searchedAt: Date.now() - 1000 * 60 * 45  },
        { query: "dhan dhana dhan",   searchedAt: Date.now() - 1000 * 60 * 120 },
        { query: "for a reason remix",searchedAt: Date.now() - 1000 * 60 * 200 },
        { query: "wishes",            searchedAt: Date.now() - 1000 * 60 * 300 },
        { query: "laila main laila",  searchedAt: Date.now() - 1000 * 60 * 480 },
      ];
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(sampleHistory));
      return sampleHistory;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const saveSearchQuery = (query) => {
  if (!query.trim()) return;
  try {
    const existing = loadSearchHistory().filter(
      item => item.query.toLowerCase() !== query.toLowerCase()
    );
    const updated = [
      { query: query.trim(), searchedAt: Date.now() },
      ...existing,
    ].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch {}
};

const deleteSearchHistoryItem = (query) => {
  try {
    const updated = loadSearchHistory().filter(
      item => item.query.toLowerCase() !== query.toLowerCase()
    );
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch {}
};

const clearSearchHistory = () => {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch {}
};

const trendingSearches = [
  "Arijit Singh new songs",
  "Lo-fi beats to study",
  "Bollywood hits 2024",
  "AR Rahman classics",
  "Workout playlist",
];

function YourApp({ initialPlayerState }) {
  // Navigation & Tab state
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'explore' | 'library' | 'profile'
  const [profileName, setProfileName] = useState(() => localStorage.getItem('mics_profile_name') || '');
  const [profileUsername, setProfileUsername] = useState(() => localStorage.getItem('mics_profile_username') || '');
  const [profileBio, setProfileBio] = useState(() => localStorage.getItem('mics_profile_bio') || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editNameVal, setEditNameVal] = useState(profileName);
  const [editUsernameVal, setEditUsernameVal] = useState(profileUsername);
  const [editBioVal, setEditBioVal] = useState(profileBio);

  const handleStartEditProfile = () => {
    setEditNameVal(profileName);
    setEditUsernameVal(profileUsername);
    setEditBioVal(profileBio);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    if (editNameVal.trim()) {
      setProfileName(editNameVal.trim());
      localStorage.setItem('mics_profile_name', editNameVal.trim());
    }
    if (editUsernameVal.trim()) {
      setProfileUsername(editUsernameVal.trim());
      localStorage.setItem('mics_profile_username', editUsernameVal.trim());
    }
    setProfileBio(editBioVal);
    localStorage.setItem('mics_profile_bio', editBioVal);
    setIsEditingProfile(false);
  };

  const handleCardMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  const [activeChip, setActiveChip] = useState('Energize');
  const [activeContextTab, setActiveContextTab] = useState('All');
  const [libraryFilter, setLibraryFilter] = useState('All');
  const [libraryViewMode, setLibraryViewMode] = useState('grid'); // 'grid' | 'list'
  
  // Artist View state
  const [activeArtist, setActiveArtist] = useState(null); // stores active artist details object
  const [artistTracks, setArtistTracks] = useState([]);
  const [artistLoading, setArtistLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Album Details View state
  const [activeAlbum, setActiveAlbum] = useState(null); // stores active album details object
  const [albumTracks, setAlbumTracks] = useState([]);
  const [albumLoading, setAlbumLoading] = useState(false);

  // Expanded Player state
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [playerLayout, setPlayerLayout] = useState('standard'); // 'standard' | 'cinematic'
  const [collapsedBurstKey, setCollapsedBurstKey] = useState(0);
  const [expandedBurstKey, setExpandedBurstKey] = useState(0);
  const [activePlayerTab, setActivePlayerTab] = useState('up-next'); // 'up-next' | 'lyrics' | 'related'
  const [lyrics, setLyrics] = useState([]);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [upNextQueue, setUpNextQueue] = useState(() => 
    playbackStore.queueIndex !== -1 ? playbackStore.queue.slice(playbackStore.queueIndex + 1) : []
  );
  const [upNextLoading, setUpNextLoading] = useState(false);
  const [playHistory, setPlayHistory] = useState(() => 
    playbackStore.queueIndex !== -1 ? playbackStore.queue.slice(0, playbackStore.queueIndex) : []
  );

  // Create Playlist Modal state
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [playlistSongSearch, setPlaylistSongSearch] = useState('');
  const [playlistAddedSongs, setPlaylistAddedSongs] = useState([]);

  // Audio playback state
  const [currentTrack, setCurrentTrack] = useState(() => playbackStore.currentTrack);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => playbackStore.positionMs / 1000);
  const [duration, setDuration] = useState(() => playbackStore.currentTrack ? playbackStore.currentTrack.durationMs / 1000 : 0);
  const [volume, setVolume] = useState(() => playbackStore.currentTrack ? Math.round(playbackStore.volume * 100) : 66);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(() => playbackStore.shuffle);
  const [repeatMode, setRepeatMode] = useState(() => playbackStore.repeat);
  const [isRestored, setIsRestored] = useState(() => playbackStore.isRestored);
  const [isBuffering, setIsBuffering] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Dynamic content states
  const [sections, setSections] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState(() => loadSearchHistory());
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Helper to collect all unique local songs/tracks
  const getAllLocalSongs = () => {
    const songs = [];
    const seenIds = new Set();
    
    const addSong = (song) => {
      if (!song || !song.id || seenIds.has(song.id)) return;
      seenIds.add(song.id);
      songs.push(song);
    };

    // Add library items
    if (Array.isArray(libraryItems)) {
      libraryItems.forEach(item => {
        if (item && (item.type === 'Song' || !item.type)) {
          addSong(item);
        }
      });
    }

    // Add default library items
    if (Array.isArray(defaultLibraryItems)) {
      defaultLibraryItems.forEach(item => {
        if (item && (item.type === 'Song' || !item.type)) {
          addSong(item);
        }
      });
    }

    // Add items from sections
    if (Array.isArray(sections)) {
      sections.forEach(sec => {
        if (sec && Array.isArray(sec.contents)) {
          sec.contents.forEach(item => {
            if (item && (item.type === 'Song' || item.type === 'track' || (!item.type && item.artist))) {
              addSong(item);
            }
          });
        }
      });
    }

    // Add new releases
    if (Array.isArray(newReleases)) {
      newReleases.forEach(item => {
        addSong(item);
      });
    }

    return songs;
  };

  const getOriginalCasing = (lowerStr) => {
    // Check local history
    const histMatch = searchHistory.find(h => h.query.toLowerCase() === lowerStr);
    if (histMatch) return histMatch.query;

    // Check trending
    const trendMatch = trendingSearches.find(t => t.toLowerCase() === lowerStr);
    if (trendMatch) return trendMatch;

    // Check local songs
    const localSongs = getAllLocalSongs();
    const songMatch = localSongs.find(s => s.title?.toLowerCase() === lowerStr || s.artist?.toLowerCase() === lowerStr);
    if (songMatch) {
      if (songMatch.title?.toLowerCase() === lowerStr) return songMatch.title;
      if (songMatch.artist?.toLowerCase() === lowerStr) return songMatch.artist;
    }

    return lowerStr.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getCompletions = (query) => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    
    const candidates = new Set();
    
    // 1. History items
    searchHistory.forEach(h => candidates.add(h.query.toLowerCase()));
    
    // 2. Trending searches
    trendingSearches.forEach(t => candidates.add(t.toLowerCase()));
    
    // 3. Catalog items
    const localSongs = getAllLocalSongs();
    localSongs.forEach(song => {
      if (song.title) candidates.add(song.title.toLowerCase());
      if (song.artist) candidates.add(song.artist.toLowerCase());
    });
    if (Array.isArray(libraryItems)) {
      libraryItems.forEach(item => {
        if (item.title) candidates.add(item.title.toLowerCase());
        if (item.artist) candidates.add(item.artist.toLowerCase());
      });
    }

    const matches = Array.from(candidates).filter(c => c.includes(q));
    
    matches.sort((a, b) => {
      const aStarts = a.startsWith(q);
      const bStarts = b.startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b);
    });

    const completions = [];
    const addedCompletions = new Set();

    for (const match of matches) {
      if (completions.length >= 4) break;
      const displayMatch = getOriginalCasing(match);
      
      if (!addedCompletions.has(displayMatch.toLowerCase())) {
        completions.push({ type: 'completion', text: displayMatch });
        addedCompletions.add(displayMatch.toLowerCase());
      }
      
      if (match === q || match.startsWith(q + ' ')) {
        const variants = ['song', 'lyrics', 'dance', 'remix'];
        for (const variant of variants) {
          if (completions.length >= 4) break;
          const varText = `${displayMatch} ${variant}`;
          if (!addedCompletions.has(varText.toLowerCase())) {
            completions.push({ type: 'completion', text: varText });
            addedCompletions.add(varText.toLowerCase());
          }
        }
      }
    }

    if (completions.length < 4) {
      const displayQuery = query;
      const variants = ['song', 'lyrics', 'dance', 'remix'];
      for (const variant of variants) {
        if (completions.length >= 4) break;
        const varText = `${displayQuery} ${variant}`;
        if (!addedCompletions.has(varText.toLowerCase())) {
          completions.push({ type: 'completion', text: varText });
          addedCompletions.add(varText.toLowerCase());
        }
      }
    }

    return completions.slice(0, 4);
  };

  const getArtistAvatar = (artistName) => {
    const found = relatedArtists.find(a => a.name.toLowerCase() === artistName.toLowerCase());
    if (found && found.img) return found.img;
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&q=80';
  };

  const getArtists = (query) => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const seenArtists = new Set();
    const artists = [];

    relatedArtists.forEach(art => {
      if (art.name.toLowerCase().includes(q) && !seenArtists.has(art.name.toLowerCase())) {
        seenArtists.add(art.name.toLowerCase());
        artists.push({
          type: 'artist',
          name: art.name,
          thumbnail: art.img
        });
      }
    });

    const localSongs = getAllLocalSongs();
    localSongs.forEach(song => {
      if (song.artist && song.artist.toLowerCase().includes(q) && !seenArtists.has(song.artist.toLowerCase())) {
        seenArtists.add(song.artist.toLowerCase());
        artists.push({
          type: 'artist',
          name: song.artist,
          thumbnail: getArtistAvatar(song.artist)
        });
      }
    });

    return artists.slice(0, 2);
  };

  const getMatchingSongs = (query) => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const localSongs = getAllLocalSongs();
    const matched = [];
    const seenSongIds = new Set();

    localSongs.forEach(song => {
      if (song.title && song.title.toLowerCase().includes(q) && !seenSongIds.has(song.id)) {
        seenSongIds.add(song.id);
        matched.push({
          type: 'song',
          id: song.id,
          title: song.title,
          artist: song.artist || 'Unknown Artist',
          thumbnail: song.thumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=80&h=80&fit=crop&q=80',
          duration: song.duration
        });
      }
    });

    return matched.slice(0, 3);
  };

  const getSuggestionsFlatList = () => {
    const completions = getCompletions(searchQuery);
    const artists = getArtists(searchQuery);
    const songs = getMatchingSongs(searchQuery);

    const flatList = [];
    if (completions.length > 0) flatList.push(...completions);
    if (artists.length > 0) flatList.push(...artists);
    if (songs.length > 0) flatList.push(...songs);
    return flatList;
  };

  const getEmptyStateFlatList = () => {
    const list = [];
    if (searchHistory && searchHistory.length > 0) {
      list.push(...searchHistory.slice(0, 7).map(item => ({ type: 'recent', query: item.query })));
    }
    list.push(...trendingSearches.map(item => ({ type: 'trending', query: item })));
    return list;
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    setSuggestionsLoading(true);
    const handler = setTimeout(() => {
      const completions = getCompletions(searchQuery);
      const artists = getArtists(searchQuery);
      const songs = getMatchingSongs(searchQuery);

      const groups = [];
      if (completions.length > 0) {
        groups.push({
          title: 'Query completions',
          items: completions
        });
      }
      if (artists.length > 0) {
        groups.push({
          title: 'Artists matching query',
          items: artists
        });
      }
      if (songs.length > 0) {
        groups.push({
          title: 'Songs matching query',
          items: songs
        });
      }

      setSuggestions(groups);
      setSuggestionsLoading(false);
    }, 200);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, searchHistory]);

  const audioRef = useRef(null);
  const searchWrapperRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchDropdownRef = useRef(null);

  // Click outside detection to close the dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchWrapperRef.current && 
        !searchWrapperRef.current.contains(e.target) &&
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(e.target)
      ) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Keyboard navigation & search execution handler
  const handleKeyDown = (e) => {
    const flatList = searchQuery.trim() ? getSuggestionsFlatList() : getEmptyStateFlatList();

    if (e.key === 'Escape') {
      if (searchQuery) {
        setSearchQuery('');
        setHighlightedIndex(-1);
        setIsSearching(false);
        setSearchResults([]);
      } else {
        setSearchFocused(false);
        setHighlightedIndex(-1);
        searchInputRef.current?.blur();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!searchFocused) {
        setSearchFocused(true);
        return;
      }
      setHighlightedIndex(prev => {
        if (flatList.length === 0) return -1;
        const next = prev + 1;
        if (next >= flatList.length) return 0; // wrap to first item
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => {
        if (prev <= 0) {
          return -1;
        }
        return prev - 1;
      });
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < flatList.length) {
        e.preventDefault();
        const item = flatList[highlightedIndex];
        if (item.type === 'completion' || item.type === 'recent' || item.type === 'trending') {
          const queryToSearch = item.text || item.query;
          triggerSearch(queryToSearch);
        } else if (item.type === 'artist') {
          triggerSearch(item.name);
        } else if (item.type === 'song') {
          triggerSearch(item.title);
        }
      } else if (searchQuery.trim()) {
        e.preventDefault();
        triggerSearch(searchQuery);
      }
    }
  };

  const highlightQueryText = (text, query) => {
    if (!query) return <span>{text}</span>;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    if (index === -1) {
      return <span className="font-normal text-text-secondary">{text}</span>;
    }
    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);
    return (
      <span className="font-normal text-text-secondary">
        {before}
        <strong className="font-bold text-white">{match}</strong>
        {after}
      </span>
    );
  };

  const renderEmptyState = () => {
    const flatList = getEmptyStateFlatList();
    const recentCount = searchHistory ? Math.min(searchHistory.length, 7) : 0;

    return (
      <div>
        {recentCount > 0 && (
          <div>
            <div className="flex items-center justify-between px-4 py-2 text-[11px] font-bold text-text-tertiary tracking-wider uppercase">
              <span>Recent searches</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  clearSearchHistory();
                  setSearchHistory([]);
                  setHighlightedIndex(-1);
                }}
                aria-label="Clear all search history"
                className="text-[12px] text-text-secondary hover:text-white hover:underline lowercase font-normal normal-case"
              >
                Clear all
              </button>
            </div>
            {searchHistory.slice(0, 7).map((item, idx) => {
              const isHighlighted = idx === highlightedIndex;
              return (
                <div
                  key={`recent-${item.query}-${idx}`}
                  role="option"
                  aria-selected={isHighlighted}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => triggerSearch(item.query)}
                  className={`h-12 px-4 flex items-center gap-3 cursor-pointer transition-colors duration-150 ${
                    isHighlighted ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[18px] text-text-tertiary select-none`}>
                    history
                  </span>
                  <span className="flex-1 text-[14px] text-text-primary truncate font-normal">
                    {item.query}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSearchHistoryItem(item.query);
                      const updated = loadSearchHistory();
                      setSearchHistory(updated);
                      setHighlightedIndex(-1);
                    }}
                    aria-label={`Remove ${item.query} from search history`}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-text-tertiary hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[17px]">delete</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div>
          <div className="px-4 py-2 text-[11px] font-bold text-text-tertiary tracking-wider uppercase">
            Trending
          </div>
          {trendingSearches.map((item, idx) => {
            const flatIdx = recentCount + idx;
            const isHighlighted = flatIdx === highlightedIndex;
            return (
              <div
                key={`trending-${item}-${idx}`}
                role="option"
                aria-selected={isHighlighted}
                onMouseEnter={() => setHighlightedIndex(flatIdx)}
                onClick={() => triggerSearch(item)}
                className={`h-12 px-4 flex items-center gap-3 cursor-pointer transition-colors duration-150 ${
                  isHighlighted ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <span className={`material-symbols-outlined text-[18px] select-none ${
                  isHighlighted ? 'text-white' : 'text-text-secondary'
                }`}>
                  trending_up
                </span>
                <span className="flex-1 text-[14px] text-text-primary truncate font-normal">
                  {item}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSkeletonState = () => {
    const widths = ['w-3/5', 'w-3/4', 'w-[65%]'];
    return (
      <div className="flex flex-col gap-2 py-2">
        {widths.map((w, idx) => (
          <div key={`skel-${idx}`} className="h-12 px-4 flex items-center gap-3">
            <div className="w-[18px] h-[18px] rounded-full shrink-0 animate-shimmer" />
            <div className={`h-3.5 rounded ${w} animate-shimmer`} />
          </div>
        ))}
      </div>
    );
  };

  const renderSuggestionsState = () => {
    let globalItemIdx = 0;
    
    return (
      <div className="flex flex-col">
        {suggestions.map((group, groupIdx) => {
          const isLastGroup = groupIdx === suggestions.length - 1;
          
          return (
            <div key={`group-${group.title}`}>
              {group.items.map((item) => {
                const currentIdx = globalItemIdx;
                globalItemIdx++;
                const isHighlighted = currentIdx === highlightedIndex;
                
                return (
                  <div
                    key={`sugg-item-${currentIdx}`}
                    role="option"
                    aria-selected={isHighlighted}
                    onMouseEnter={() => setHighlightedIndex(currentIdx)}
                    onClick={() => {
                      if (item.type === 'completion') {
                        triggerSearch(item.text);
                      } else if (item.type === 'artist') {
                        triggerSearch(item.name);
                      } else if (item.type === 'song') {
                        triggerSearch(item.title);
                      }
                    }}
                    className={`h-12 px-4 flex items-center gap-3 cursor-pointer transition-colors duration-150 ${
                      isHighlighted ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    {item.type === 'completion' && (
                      <span className={`material-symbols-outlined text-[18px] select-none ${
                        isHighlighted ? 'text-white' : 'text-text-secondary'
                      }`}>
                        search
                      </span>
                    )}
                    {item.type === 'artist' && (
                      <img 
                        src={item.thumbnail} 
                        alt={item.name} 
                        className="w-6 h-6 rounded-full object-cover shrink-0" 
                      />
                    )}
                    {item.type === 'song' && (
                      <img 
                        src={item.thumbnail} 
                        alt={item.title} 
                        className="w-8 h-8 rounded object-cover shrink-0" 
                      />
                    )}

                    <div className="flex-1 min-w-0 truncate text-[14px]">
                      {item.type === 'completion' && highlightQueryText(item.text, searchQuery)}
                      {item.type === 'artist' && highlightQueryText(item.name, searchQuery)}
                      {item.type === 'song' && highlightQueryText(item.title, searchQuery)}
                    </div>

                    {item.type === 'completion' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchQuery(item.text);
                          setHighlightedIndex(-1);
                          searchInputRef.current?.focus();
                        }}
                        aria-label={`Fill ${item.text} into search bar`}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-text-tertiary hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px]">north_west</span>
                      </button>
                    )}
                    {item.type === 'artist' && (
                      <span className="text-[11px] text-text-tertiary font-normal select-none">
                        Artist
                      </span>
                    )}
                    {item.type === 'song' && (
                      <span className="text-[12px] text-text-tertiary font-normal select-none max-w-[120px] truncate">
                        {item.artist}
                      </span>
                    )}
                  </div>
                );
              })}
              
              {!isLastGroup && (
                <div className="border-b border-white/5 my-1" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderNoResultsState = () => {
    const isHighlighted = highlightedIndex === 0;
    return (
      <div className="flex flex-col">
        <div
          role="option"
          aria-selected={isHighlighted}
          onMouseEnter={() => setHighlightedIndex(0)}
          onClick={() => triggerSearch(searchQuery)}
          className={`h-12 px-4 flex items-center gap-3 cursor-pointer transition-colors duration-150 ${
            isHighlighted ? 'bg-white/10' : 'hover:bg-white/5'
          }`}
        >
          <span className={`material-symbols-outlined text-[18px] select-none ${
            isHighlighted ? 'text-white' : 'text-text-secondary'
          }`}>
            search
          </span>
          <span className="text-[14px] text-text-secondary truncate font-normal">
            Search for <strong className="font-bold text-white">"{searchQuery}"</strong>
          </span>
        </div>

        <div className="flex flex-col items-center justify-center py-8">
          <span className="material-symbols-outlined text-[28px] text-[#3f3f3f] select-none">
            search_off
          </span>
          <span className="text-[14px] text-text-secondary text-center mt-2 px-4">
            No results for "{searchQuery}"
          </span>
        </div>
      </div>
    );
  };

  const mainRef = useRef(null);
  const prevTrackRef = useRef(null);

  const { color: ambientColor } = useDominantColor(currentTrack ? currentTrack.thumbnail : null);
  const frequencies = useAudioAnalyser(audioRef, 40);

  const filterChips = [
    'Energize',
    'Moods',
    'Commute',
    'Focus',
    'Workout',
    'Relax',
    'Podcasts'
  ];

  const contextTabs = [
    'All',
    'Songs',
    'Videos',
    'Albums',
    'Artists'
  ];

  const libraryFilterChips = [
    'All',
    'Playlists',
    'Albums',
    'Songs',
    'Artists'
  ];

  const moodCards = [
    { title: 'Energizing', bg: '#1e3a5f', icon: 'bolt' },
    { title: 'Focus', bg: '#1a3a2e', icon: 'psychology' },
    { title: 'Workout', bg: '#3a1a1a', icon: 'fitness_center' },
    { title: 'Party', bg: '#2a1a3a', icon: 'celebration' },
    { title: 'Relaxing', bg: '#1a2a3a', icon: 'spa' }
  ];

  // Default playable Library items mapped to real YouTube IDs
  const defaultLibraryItems = [
    {
      id: '2g5y74q1P7c',
      title: 'Neon Horizon',
      artist: 'Electric Dream',
      type: 'Album',
      thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=640&h=640&fit=crop&q=80',
      duration: 210
    },
    {
      id: 'neV3EPWRLIY',
      title: 'Midnight Jazz Essentials',
      artist: 'Mics',
      type: 'Playlist',
      thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=640&h=640&fit=crop&q=80',
      duration: 3200
    },
    {
      id: 'r9-V4Drc7tA',
      title: 'Techno Pulse',
      artist: 'Circuitry',
      type: 'Album',
      thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=640&h=640&fit=crop&q=80',
      duration: 250
    },
    {
      id: '7-x3Y1S3b0s',
      title: 'Unplugged Sessions',
      artist: 'Acoustic Soul',
      type: 'Album',
      thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=640&h=640&fit=crop&q=80',
      duration: 180
    },
    {
      id: 'gCYcHz2k5x0',
      title: 'Summer Hits 2024',
      artist: 'Mics',
      type: 'Playlist',
      thumbnail: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=640&h=640&fit=crop&q=80',
      duration: 2900
    },
    {
      id: '3tmd-ClpJKA',
      title: 'Ethereal Echoes',
      artist: 'Cloud Walker',
      type: 'Album',
      thumbnail: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=640&h=640&fit=crop&q=80',
      duration: 280
    }
  ];

  // Related Artists Data
  const relatedArtists = [
    {
      name: 'The Weeknd',
      img: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=640&h=640&fit=crop&q=80',
      subscribers: '32.1M',
      listeners: '108M'
    },
    {
      name: 'The Midnight Soul',
      img: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=640&h=640&fit=crop&q=80',
      subscribers: '4.2M',
      listeners: '12M'
    },
    {
      name: 'Echo Chamber',
      img: 'https://images.unsplash.com/photo-1516280440614-37939bbacd6a?w=640&h=640&fit=crop&q=80',
      subscribers: '1.2M',
      listeners: '4.5M'
    },
    {
      name: 'Lia Moon',
      img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=640&h=640&fit=crop&q=80',
      subscribers: '890K',
      listeners: '3M'
    },
    {
      name: 'Vance Rivers',
      img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=640&h=640&fit=crop&q=80',
      subscribers: '2.5M',
      listeners: '9M'
    },
    {
      name: 'Silas Grey',
      img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=640&h=640&fit=crop&q=80',
      subscribers: '3.1M',
      listeners: '11M'
    }
  ];

  // User Playlists state loaded from LocalStorage
  const [playlists, setPlaylists] = useState(() => {
    localStorage.removeItem('mics_playlists');
    const saved = localStorage.getItem('mics_playlists_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  // User Library items state loaded from LocalStorage
  const [libraryItems, setLibraryItems] = useState(() => {
    localStorage.removeItem('mics_library');
    const saved = localStorage.getItem('mics_library_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  // Sync Library Items and Playlists to LocalStorage
  useEffect(() => {
    localStorage.setItem('mics_library_v2', JSON.stringify(libraryItems));
  }, [libraryItems]);

  useEffect(() => {
    localStorage.setItem('mics_playlists_v2', JSON.stringify(playlists));
  }, [playlists]);

  const [speedDialItems, setSpeedDialItems] = useState(() => {
    // Clear legacy mock-polluted local storage keys
    localStorage.removeItem('mics_speed_dial');
    const saved = localStorage.getItem('mics_speed_dial_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const [isEditingSpeedDial, setIsEditingSpeedDial] = useState(false);
  const [speedDialDraft, setSpeedDialDraft] = useState([]);
  const [trackMenu, setTrackMenu] = useState(null); // { track, x, y, contextQueue }

  const handleOpenTrackMenu = (e, track, contextQueue = null) => {
    if (!track) return;
    e.stopPropagation();
    e.preventDefault();
    
    let x = e.clientX;
    let y = e.clientY;
    
    const menuWidth = 220;
    const menuHeight = 160;
    
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 16;
    }
    if (x < 16) {
      x = 16;
    }
    
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 16;
    }
    if (y < 16) {
      y = 16;
    }
    
    setTrackMenu({ track, x, y, contextQueue });
  };

  const handleTogglePinSpeedDial = (track) => {
    if (!track || !track.id) return;
    const isPinned = speedDialItems.some(item => item.id === track.id);
    if (isPinned) {
      setSpeedDialItems(prev => prev.filter(item => item.id !== track.id));
      if (isEditingSpeedDial) {
        setSpeedDialDraft(prev => prev.filter(item => item.id !== track.id));
      }
    } else {
      const newItem = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        thumbnail: track.thumbnail || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`,
        duration: track.duration || 0
      };
      setSpeedDialItems(prev => [...prev, newItem]);
      if (isEditingSpeedDial) {
        setSpeedDialDraft(prev => [...prev, newItem]);
      }
    }
  };

  // Synchronize speedDialItems to localStorage
  useEffect(() => {
    localStorage.setItem('mics_speed_dial_v2', JSON.stringify(speedDialItems));
  }, [speedDialItems]);

  // Sync draft when edit mode is toggled
  useEffect(() => {
    if (isEditingSpeedDial) {
      setSpeedDialDraft([...speedDialItems]);
    }
  }, [isEditingSpeedDial, speedDialItems]);

  const handleSaveSpeedDial = () => {
    setSpeedDialItems(speedDialDraft);
    setIsEditingSpeedDial(false);
  };

  const handleCancelSpeedDial = () => {
    setIsEditingSpeedDial(false);
  };

  const handleRemoveSpeedDialItem = (id) => {
    setSpeedDialDraft(prev => prev.filter(item => item.id !== id));
  };

  // --- RECOMMENDATION SYSTEM INTEGRATION ---
  const [catalog, setCatalog] = useState(() => {
    const initialTracks = [
      ...defaultLibraryItems,
      ...Object.values(MOCK_ARTISTS).flatMap(a => a.tracks || [])
    ];
    const unique = [];
    const seen = new Set();
    initialTracks.forEach(t => {
      const enriched = enrichTrack(t);
      if (enriched.id && !seen.has(enriched.id)) {
        seen.add(enriched.id);
        unique.push(enriched);
      }
    });
    return unique;
  });

  useEffect(() => {
    const newTracks = [
      ...sections.flatMap(s => s.contents || []),
      ...searchResults,
      ...libraryItems,
      ...speedDialItems
    ];
    
    setCatalog(prev => {
      const seen = new Set(prev.map(t => t.id));
      const toAdd = [];
      newTracks.forEach(t => {
        if (t && t.id && !seen.has(t.id)) {
          seen.add(t.id);
          toAdd.push(enrichTrack(t));
        }
      });
      if (toAdd.length > 0) {
        return [...prev, ...toAdd];
      }
      return prev;
    });
  }, [sections, searchResults, libraryItems, speedDialItems]);

  const catalogTracksRef = useRef({});
  useEffect(() => {
    const lookup = {};
    catalog.forEach(t => {
      lookup[t.id] = t;
    });
    catalogTracksRef.current = lookup;
  }, [catalog]);

  const {
    profile,
    listenHistory,
    mixedForYou: rawMixedForYou,
    quickPicks: rawQuickPicks,
    forgottenFavorites,
    discoveryPicks: rawDiscoveryPicks,
    getMoodMatch,
    getSimilarTo,
    getListenersAlsoLike,
    getAutoplayNext,
    refreshRecommendations
  } = useRecommendations(catalog);
  // --- END RECOMMENDATION SYSTEM ---

  const { influenceParams, profile: newProfile } = useListenHistory();
  const hoursListened = useMemo(() => {
    if (!newProfile) return 0;
    return Math.round((newProfile.totalListenedMs / (1000 * 60 * 60)) * 10) / 10;
  }, [newProfile]);

  // Personalize lists using influenceParams and newProfile
  const mixedForYou = useMemo(() => {
    if (!rawMixedForYou || rawMixedForYou.length === 0) return [];
    if (!influenceParams || !newProfile) return rawMixedForYou;
    return [...rawMixedForYou]
      .map(track => {
        const boost = scoreTrackAgainstHistory(track, influenceParams, newProfile);
        return { track, score: boost };
      })
      .sort((a, b) => b.score - a.score)
      .map(item => item.track);
  }, [rawMixedForYou, influenceParams, newProfile]);

  const quickPicks = useMemo(() => {
    if (!rawQuickPicks || rawQuickPicks.length === 0) return [];
    if (!influenceParams || !newProfile) return rawQuickPicks;
    return [...rawQuickPicks]
      .map(track => {
        const boost = scoreTrackAgainstHistory(track, influenceParams, newProfile);
        return { track, score: boost };
      })
      .sort((a, b) => b.score - a.score)
      .map(item => item.track);
  }, [rawQuickPicks, influenceParams, newProfile]);

  const discoveryPicks = useMemo(() => {
    if (!rawDiscoveryPicks || rawDiscoveryPicks.length === 0) return [];
    if (!influenceParams || !newProfile) return rawDiscoveryPicks;
    return [...rawDiscoveryPicks]
      .map(track => {
        const boost = scoreTrackAgainstHistory(track, influenceParams, newProfile);
        return { track, score: boost };
      })
      .sort((a, b) => b.score - a.score)
      .map(item => item.track);
  }, [rawDiscoveryPicks, influenceParams, newProfile]);

  // Sync history tracker with current track changes
  useEffect(() => {
    if (currentTrack) {
      playbackStore.triggerTrackChange(currentTrack, playbackStore.getContext());
    } else {
      playbackStore.triggerTrackChange(null, 'unknown');
    }
  }, [currentTrack]);

  // Sync play state
  useEffect(() => {
    playbackStore.triggerPlayStateChange(isPlaying);
  }, [isPlaying]);

  // Sync position (seek/scrub) to store
  useEffect(() => {
    playbackStore.triggerPositionChange(Math.floor(currentTime * 1000));
  }, [currentTime]);

  // Sync volume to store
  useEffect(() => {
    playbackStore.triggerVolumeChange(isMuted ? 0 : volume / 100);
  }, [volume, isMuted]);

  // Sync shuffle state to store
  useEffect(() => {
    playbackStore.triggerShuffleChange(isShuffle);
  }, [isShuffle]);

  // Sync repeat state to store
  useEffect(() => {
    playbackStore.triggerRepeatChange(repeatMode);
  }, [repeatMode]);

  // Sync queue state to store
  useEffect(() => {
    const fullQueue = [];
    if (playHistory && playHistory.length > 0) {
      fullQueue.push(...playHistory);
    }
    if (currentTrack) {
      fullQueue.push(currentTrack);
    }
    if (upNextQueue && upNextQueue.length > 0) {
      fullQueue.push(...upNextQueue);
    }
    const idx = playHistory ? playHistory.length : 0;
    playbackStore.triggerQueueChange(fullQueue, idx);
  }, [playHistory, currentTrack, upNextQueue]);

  // Toast Notification Trigger
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Re-resolving and play/pause handler
  const handlePlayPauseClick = async () => {
    if (!currentTrack) return;
    
    if (isRestored) {
      setIsBuffering(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/info/${currentTrack.id}`);
        if (!res.ok) {
          throw new Error("Track unavailable");
        }
        const data = await res.json();
        if (!data || !data.id) {
          throw new Error("Track malformed");
        }
        
        setIsBuffering(false);
        setIsRestored(false);
        playbackStore.isRestored = false;
        
        if (audioRef.current) {
          if (playbackStore.positionMs > 0) {
            audioRef.current.currentTime = playbackStore.positionMs / 1000;
          }
          audioRef.current.play().catch(e => console.warn(e));
        }
        setIsPlaying(true);
      } catch (err) {
        showToast("Couldn't resume — track unavailable");
        setIsBuffering(false);
        setIsRestored(false);
        playbackStore.isRestored = false;
        playerStatePersistence.clearSavedState();
        setCurrentTrack(null);
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleToggleShuffle = () => {
    const newVal = !isShuffle;
    setIsShuffle(newVal);
    playbackStore.triggerShuffleChange(newVal);
  };

  const handleToggleRepeat = () => {
    let nextMode = 'off';
    if (repeatMode === 'off') nextMode = 'all';
    else if (repeatMode === 'all') nextMode = 'one';
    else nextMode = 'off';
    setRepeatMode(nextMode);
    playbackStore.triggerRepeatChange(nextMode);
  };

  // Fetch sections from YTMusic Home proxy on load, with trending fallback
  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/home`);
        if (res.ok) {
          const rawData = await res.json();
          const data = resolveThumbnails(rawData);
          if (data && data.length > 0) {
            setSections(data);
            
            // Extract New Releases if present
            const nrSection = data.find(s => s.title.toLowerCase().includes('new release'));
            if (nrSection) {
              setNewReleases(nrSection.contents || []);
            } else {
              // Get fallback from trending
              fetchTrendingFallback(data);
            }
            
            // Default select the first track for display if none is loaded yet
            const firstSong = data.find(s => s.contents && s.contents.length > 0)?.contents?.[0];
            if (firstSong && !playbackStore.currentTrack) {
              setCurrentTrack(firstSong);
            }
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to load home sections, trying trending fallback...', e);
      }

      // Fallback
      fetchTrendingFallback();
    };

    const fetchTrendingFallback = async (existingSections = []) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/trending`);
        if (res.ok) {
          const rawData = await res.json();
          const data = resolveThumbnails(rawData);
          if (data && data.length > 0) {
            if (existingSections.length === 0) {
              const trendingSections = [
                {
                  title: "Quick picks",
                  contents: data.slice(0, 6)
                },
                {
                  title: "Listen again",
                  contents: data.slice(6, 12)
                },
                {
                  title: "New releases",
                  contents: data.slice(12, 18)
                }
              ];
              setSections(trendingSections);
            }
            setNewReleases(data.slice(12, 18));
            if (!playbackStore.currentTrack) {
              setCurrentTrack(data[0]);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load trending fallback:', e);
      }
      setLoading(false);
    };

    loadHomeData();
  }, []);

  // Fetch Artist Songs Dynamically on artist change
  useEffect(() => {
    if (!activeArtist) return;
    
    const mockKey = activeArtist.name.toLowerCase();
    const mockArtist = MOCK_ARTISTS[mockKey];
    
    if (mockArtist) {
      setArtistTracks(mockArtist.tracks || []);
      setArtistLoading(false);
      setScrollOffset(0);
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }
      return;
    }

    const fetchArtistSongs = async () => {
      setArtistLoading(true);
      // Reset scroll offset when opening a new artist
      setScrollOffset(0);
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(activeArtist.name)}`);
        if (res.ok) {
          const data = await res.json();
          setArtistTracks(resolveThumbnails(data) || []);
        }
      } catch (e) {
        console.error('Failed to load artist tracks:', e);
      }
      setArtistLoading(false);
    };
    fetchArtistSongs();
  }, [activeArtist]);

  // Fetch Album Songs Dynamically on album change
  useEffect(() => {
    if (!activeAlbum) return;
    
    const albumKey = activeAlbum.id || activeAlbum.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const mockAlbum = MOCK_ALBUMS[albumKey];
    
    if (mockAlbum) {
      setAlbumTracks(mockAlbum.tracks || []);
      setAlbumLoading(false);
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }
      return;
    }
    
    const fetchAlbumTracks = async () => {
      setAlbumLoading(true);
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(activeAlbum.title)}`);
        if (res.ok) {
          const data = await res.json();
          setAlbumTracks(resolveThumbnails(data) || []);
        }
      } catch (e) {
        console.error('Failed to load album tracks:', e);
      }
      setAlbumLoading(false);
    };
    fetchAlbumTracks();
  }, [activeAlbum]);

  // Guard: suppress spurious pause events fired by load() during track changes
  const isLoadingTrackRef = useRef(false);

  // Sync Audio Playback and Track Selection
  useEffect(() => {
    if (!audioRef.current) return;

    const trackChanged = !prevTrackRef.current || prevTrackRef.current.id !== currentTrack?.id;
    prevTrackRef.current = currentTrack;

    if (trackChanged && currentTrack) {
      // Mark loading so the auto-fired pause event from load() doesn't flip isPlaying to false
      isLoadingTrackRef.current = true;
      audioRef.current.load();
    }

    if (isPlaying) {
      audioRef.current.play().catch(e => {
        console.warn("Playback error:", e);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [currentTrack, isPlaying]);

  // Helper for local queue fallback
  const getLocalFallbackQueue = () => {
    if (activeAlbum && albumTracks.length > 0) {
      return albumTracks;
    }
    if (activeArtist && artistTracks.length > 0) {
      return artistTracks;
    }
    if (isSearching && searchResults.length > 0) {
      return searchResults;
    }
    return sections.flatMap(s => s.contents || []);
  };

  // ===== Queue helpers =====
  // Fetch YT Music Up Next for a given video ID and append/replace queue
  const fetchUpNext = async (videoId, replace = false) => {
    try {
      setUpNextLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/upnext/${videoId}`);
      if (res.ok) {
        const rawData = await res.json();
        const data = resolveThumbnails(rawData);
        if (data && data.length > 0) {
          setUpNextQueue(prev => replace ? data : [...prev, ...data.filter(d => !prev.some(p => p.id === d.id))]);
        } else if (replace) {
          setUpNextQueue(getLocalFallbackQueue());
        }
      } else if (replace) {
        setUpNextQueue(getLocalFallbackQueue());
      }
    } catch (err) {
      console.error('Error fetching up next:', err);
      if (replace) setUpNextQueue(getLocalFallbackQueue());
    } finally {
      setUpNextLoading(false);
    }
  };

  // When a new track starts: push old track to history, replace queue with YT Up Next for this track
  useEffect(() => {
    if (!currentTrack) {
      setLyrics([]);
      setUpNextQueue([]);
      setPlayHistory([]);
      return;
    }

    // Fetch lyrics
    const fetchLyrics = async () => {
      setLyricsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/lyrics/${currentTrack.id}`);
        if (res.ok) {
          const data = await res.json();
          setLyrics(data || []);
        } else {
          setLyrics([]);
        }
      } catch {
        setLyrics([]);
      }
      setLyricsLoading(false);
    };
    fetchLyrics();

    // Only replace the queue when we explicitly start a new context (not when navigating within the queue)
    // This flag is set by handlePlayTrack and cleared here
    if (currentTrack.__freshContext) {
      fetchUpNext(currentTrack.id, true);
    } else {
      // Queue is already correct (we popped the head). Refill when running low.
      setUpNextQueue(prev => {
        if (prev.length <= 3) {
          fetchUpNext(currentTrack.id, false);
        }
        return prev;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack]);

  // Ambient color is extracted dynamically using the useDominantColor hook at the top.

  // Sync Volume
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted, currentTrack]);

  // Audio Event Handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleAudioPlay = () => {
    // Audio is genuinely playing — clear the loading guard and sync state
    isLoadingTrackRef.current = false;
    setIsPlaying(true);
  };

  const handleAudioEnded = () => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.warn(e));
      }
      setCurrentTime(0);
      playbackStore.triggerPositionChange(0);
    } else {
      handleNextTrack();
    }
  };

  const fetchAutoplaySuggestions = async (videoId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/upnext/${videoId}`);
      if (res.ok) {
        const rawData = await res.json();
        const data = resolveThumbnails(rawData);
        if (data && data.length > 0) {
          setUpNextQueue(prev => {
            const filtered = data.filter(d => d.id !== videoId && !prev.some(p => p.id === d.id));
            return [...prev, ...filtered];
          });
        }
      }
    } catch (err) {
      console.error('Error fetching autoplay suggestions:', err);
    }
  };

  // Track Action Triggers
  const handlePlayTrack = (track, contextQueue = null, context = 'unknown') => {
    if (!track) return;
    setIsRestored(false);
    playbackStore.isRestored = false;
    playbackStore.setContext(context);

    // Determine the queue
    if (contextQueue && Array.isArray(contextQueue) && contextQueue.length > 0) {
      const idx = contextQueue.findIndex(t => t.id === track.id);
      if (idx !== -1) {
        setCurrentTrack({ ...track, __freshContext: false });
        setIsPlaying(true);
        
        // Upcoming queue is everything after the clicked song
        const upcoming = contextQueue.slice(idx + 1);
        setUpNextQueue(upcoming);

        // History is everything before the clicked song
        const past = contextQueue.slice(0, idx);
        setPlayHistory(past);

        // Fetch autoplay suggestions based on the last song in the context queue
        const seedId = upcoming.length > 0 ? upcoming[upcoming.length - 1].id : track.id;
        fetchAutoplaySuggestions(seedId);
        return;
      }
    }

    // Fallback: single track play, clear queue and history, and fetch recommendations for this track
    setUpNextQueue([]);
    setPlayHistory([]);
    setCurrentTrack({ ...track, __freshContext: true });
    setIsPlaying(true);
  };

  // Add/Remove item from Library Liked list
  const handleToggleLike = (track) => {
    if (!track) return;
    const exists = libraryItems.some(item => item.id === track.id);
    if (exists) {
      setLibraryItems(prev => prev.filter(item => item.id !== track.id));
    } else {
      const newItem = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        type: 'Song',
        thumbnail: track.thumbnail || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`,
        duration: track.duration || 0
      };
      setLibraryItems(prev => [newItem, ...prev]);
    }
    playbackStore.triggerLikeToggle(track.id, !exists);
  };

  // Toggle favorite of currentTrack
  const isCurrentTrackLiked = libraryItems.some(item => item.id === currentTrack?.id);

  // Playback timer & tracking for recommendation model training
  const playTimerRef = useRef({
    trackId: null,
    startedAt: 0,
    segmentStart: null,
    accumulatedMs: 0,
    likedDuring: false,
    context: 'recommendation'
  });

  useEffect(() => {
    const current = playTimerRef.current;
    
    // Log previous track if it played for at least 1.5s
    if (current.trackId && current.trackId !== currentTrack?.id) {
      let totalMs = current.accumulatedMs;
      if (current.segmentStart) {
        totalMs += (Date.now() - current.segmentStart);
      }
      if (totalMs > 1500) {
        const matchedTrack = catalogTracksRef.current[current.trackId];
        const trackDurationMs = matchedTrack ? matchedTrack.durationMs : 200000;
        const completionRate = Math.min(1.0, totalMs / (trackDurationMs || 200000));
        const event = {
          trackId: current.trackId,
          startedAt: current.startedAt,
          durationListenedMs: totalMs,
          completionRate,
          context: current.context,
          likedDuring: current.likedDuring,
          skipped: completionRate < 0.35
        };
        recordListenEvent(event, catalogTracksRef.current);
        refreshRecommendations();
      }
      
      // Start tracking new track
      if (currentTrack) {
        const ctx = isSearching ? 'search' : (activeTab === 'library' ? 'library' : 'recommendation');
        playTimerRef.current = {
          trackId: currentTrack.id,
          startedAt: Date.now(),
          segmentStart: isPlaying ? Date.now() : null,
          accumulatedMs: 0,
          likedDuring: isCurrentTrackLiked,
          context: ctx
        };
      } else {
        playTimerRef.current = {
          trackId: null,
          startedAt: 0,
          segmentStart: null,
          accumulatedMs: 0,
          likedDuring: false,
          context: 'recommendation'
        };
      }
    } else {
      // Toggle play segments
      if (isPlaying) {
        if (!current.segmentStart && currentTrack) {
          current.segmentStart = Date.now();
        }
      } else {
        if (current.segmentStart) {
          current.accumulatedMs += (Date.now() - current.segmentStart);
          current.segmentStart = null;
        }
      }
    }
  }, [currentTrack, isPlaying]);

  // Update likedDuring status in playTimerRef dynamically if liked during playback
  useEffect(() => {
    if (currentTrack && playTimerRef.current.trackId === currentTrack.id) {
      if (isCurrentTrackLiked) {
        playTimerRef.current.likedDuring = true;
      }
    }
  }, [isCurrentTrackLiked, currentTrack]);

  // Queue Navigation — pop-based, history-aware
  const handleNextTrack = () => {
    setIsRestored(false);
    playbackStore.isRestored = false;

    if (upNextQueue.length === 0) {
      if (repeatMode === 'all' && playHistory.length > 0) {
        const fullList = [...playHistory];
        if (currentTrack) {
          fullList.push(currentTrack);
        }
        setPlayHistory([]);
        setUpNextQueue(fullList.slice(1));
        setCurrentTrack(fullList[0]);
        setIsPlaying(true);
      }
      return;
    }
    playbackStore.setContext('queue');
    const [next, ...rest] = upNextQueue;
    // Push current track to history before advancing
    if (currentTrack) {
      setPlayHistory(prev => [...prev, currentTrack]);
    }
    // next track is already from YT Up Next — no __freshContext flag,
    // so the useEffect will just refill when low
    setUpNextQueue(rest);
    setCurrentTrack(next);
    setIsPlaying(true);
  };

  const handlePrevTrack = () => {
    setIsRestored(false);
    playbackStore.isRestored = false;

    if (playHistory.length === 0) return;
    playbackStore.setContext('queue');
    const prev = [...playHistory];
    const lastTrack = prev.pop();
    setPlayHistory(prev);
    // Put current track back at the front of the queue
    if (currentTrack) {
      setUpNextQueue(q => [currentTrack, ...q]);
    }
    setCurrentTrack(lastTrack);
    setIsPlaying(true);
  };

  // Seek Progress
  const handleProgressBarClick = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Trigger search fetch
  const triggerSearch = async (query) => {
    if (!query || !query.trim()) return;
    const trimmed = query.trim();
    saveSearchQuery(trimmed);
    setSearchHistory(loadSearchHistory());
    setSearchQuery(trimmed);
    setIsSearching(true);
    setActiveArtist(null); // Close artist details view when searching
    setActiveAlbum(null); // Close album details view when searching
    setSearchFocused(false); // Close dropdown
    setHighlightedIndex(-1); // Reset highlight index
    searchInputRef.current?.blur(); // Blur input on search execution
    try {
      const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(resolveThumbnails(data) || []);
      }
    } catch (err) {
      console.error('Search query failed:', err);
    }
  };

  // Open Artist Profile
  const handleOpenArtist = async (name) => {
    setActiveAlbum(null); // Close album details view
    setIsPlayerExpanded(false); // Collapse player
    const found = relatedArtists.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (found) {
      setActiveArtist(found);
    } else {
      // Create profile structure and update picture later from API
      setActiveArtist({
        name,
        img: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=640&h=640&fit=crop&q=80',
        subscribers: '1.2M',
        listeners: '4.8M'
      });
      try {
        const res = await fetch(`${API_BASE_URL}/api/artist-image?q=${encodeURIComponent(name)}`);
        if (res.ok) {
          const imgData = await res.json();
          if (imgData.url) {
            setActiveArtist(prev => prev && prev.name === name ? { ...prev, img: resolveThumbnails(imgData).url } : prev);
          }
        }
      } catch (e) {}
    }
    setIsSearching(false);
  };

  // Open Album / Playlist Details
  const handleOpenAlbum = (album) => {
    const albumId = album.id || album.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const mockAlbum = MOCK_ALBUMS[albumId];
    setActiveAlbum({
      id: albumId,
      title: album.title,
      artist: album.artist || 'Mics',
      thumbnail: album.thumbnail || (mockAlbum ? mockAlbum.thumbnail : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=640&h=640&fit=crop&q=80'),
      type: album.type || 'Playlist',
      year: album.year || '2024'
    });
    setActiveArtist(null);
    setIsSearching(false);
    setIsPlayerExpanded(false); // Collapse player
  };

  // Create Playlist Action — opens modal
  const handleCreatePlaylist = () => {
    console.log('handleCreatePlaylist called! Setting showPlaylistModal to true');
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    setPlaylistSongSearch('');
    setPlaylistAddedSongs([]);
    setShowPlaylistModal(true);
  };

  const handleConfirmCreatePlaylist = () => {
    const name = newPlaylistName.trim() || 'My Playlist';
    setPlaylists(prev => [...prev, name]);
    setLibraryItems(prev => [
      {
        id: `playlist-${Date.now()}`,
        title: name,
        artist: 'You',
        type: 'Playlist',
        thumbnail: playlistAddedSongs[0]?.thumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=640&h=640&fit=crop&q=80',
        duration: 0
      },
      ...prev
    ]);
    setShowPlaylistModal(false);
  };

  // Scroll handler for Artist Profile Zoom
  const handleScroll = (e) => {
    setScrollOffset(e.currentTarget.scrollTop);
  };

  // Format Helper "m:ss"
  const formatTime = (secs) => {
    if (isNaN(secs) || secs === Infinity) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Library Filtering Logic
  const getFilteredLibraryItems = () => {
    if (libraryFilter === 'All') {
      return libraryItems;
    }
    if (libraryFilter === 'Playlists') {
      return libraryItems.filter(item => item.type === 'Playlist');
    }
    if (libraryFilter === 'Albums') {
      return libraryItems.filter(item => item.type === 'Album');
    }
    if (libraryFilter === 'Songs') {
      return libraryItems.filter(item => item.type === 'Song');
    }
    if (libraryFilter === 'Artists') {
      const uniqueArtists = Array.from(new Set(libraryItems.map(item => item.artist)));
      return uniqueArtists.map(artist => ({
        id: `artist-${artist}`,
        title: artist,
        artist: 'Artist',
        type: 'Artist',
        thumbnail: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=640&h=640&fit=crop&q=80'
      }));
    }
    return libraryItems;
  };

  const filteredItems = getFilteredLibraryItems();

  const mockKey = activeArtist?.name?.toLowerCase() || '';
  const mockArtist = MOCK_ARTISTS[mockKey];
  const albumsToRender = mockArtist ? mockArtist.albums : artistTracks.slice(0, 4).map((track, idx) => ({
    id: track.id,
    title: track.title,
    artist: activeArtist?.name || 'Unknown Artist',
    thumbnail: track.thumbnail,
    type: 'Album',
    year: 2024 - idx
  }));
  const singlesToRender = mockArtist ? mockArtist.singles : artistTracks.slice(Math.min(4, artistTracks.length - 1)).map((track, idx) => ({
    id: track.id,
    title: track.title,
    artist: activeArtist?.name || 'Unknown Artist',
    thumbnail: track.thumbnail,
    type: 'Single',
    year: 2024 - idx
  }));

  return (
    <div className="bg-bg-base text-text-primary overflow-hidden h-screen flex flex-col font-body-md select-none">
      {/* Hidden Audio Element */}
      {currentTrack && (
        <audio
          crossOrigin="anonymous"
          ref={audioRef}
          src={`${API_BASE_URL}/api/stream/${currentTrack.id}`}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={handleAudioPlay}
          onEnded={handleAudioEnded}
        />
      )}

      {/* Top Navigation */}
      <header className="bg-bg-nav flex justify-between items-center px-gutter w-full sticky top-0 z-50 h-nav-height">
        <div className="flex items-center gap-4">
          {isPlayerExpanded ? (
            <span 
              onClick={() => setIsPlayerExpanded(false)}
              className="material-symbols-outlined text-text-primary cursor-pointer icon-btn icon-btn-sm hover:bg-surface-container-highest"
            >
              arrow_back
            </span>
          ) : (
            <span className="material-symbols-outlined text-text-primary cursor-pointer icon-btn icon-btn-sm hover:bg-surface-container-highest">
              menu
            </span>
          )}
          <div 
            onClick={() => {
              setSearchQuery('');
              setIsSearching(false);
              setSearchResults([]);
              setActiveArtist(null);
              setActiveAlbum(null);
              setActiveTab('home');
              setIsPlayerExpanded(false);
            }}
            className="text-headline-md font-headline-md font-black text-text-primary flex items-center gap-1 cursor-pointer active:scale-95 transition-transform duration-150"
          >
            <span 
              className="material-symbols-outlined text-primary" 
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              play_circle
            </span>
            Mics
          </div>
        </div>
        
        <div className="flex-1 max-w-2xl px-8 hidden md:block">
          <div 
            ref={searchWrapperRef}
            className={`relative w-full flex items-center transition-all duration-200 border rounded-full ${
              searchFocused 
                ? 'border-[rgba(255,255,255,0.35)] bg-[#121212] shadow-[0_0_0_3px_rgba(255,255,255,0.06)]' 
                : 'border-[rgba(255,255,255,0.1)] bg-[#121212]'
            }`}
          >
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary select-none">
              search
            </span>
            <input 
              ref={searchInputRef}
              role="combobox"
              aria-expanded={searchFocused}
              aria-autocomplete="list"
              aria-controls="search-dropdown"
              className="w-full bg-transparent border-none py-2 pl-12 pr-10 text-body-lg focus:ring-0 outline-none text-text-primary placeholder-text-secondary font-normal" 
              placeholder="Search songs, albums, artists, podcasts" 
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim()) {
                  setIsSearching(false);
                  setSearchResults([]);
                }
              }}
              onFocus={() => {
                setSearchFocused(true);
                setHighlightedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
            />
            {searchQuery && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setHighlightedIndex(-1);
                  setIsSearching(false);
                  setSearchResults([]);
                  searchInputRef.current?.focus();
                }}
                aria-label="Clear search text"
                className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#aaaaaa] hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}

            <AnimatePresence>
              {searchFocused && (
                <motion.div
                  ref={searchDropdownRef}
                  id="search-dropdown"
                  role="listbox"
                  aria-live="polite"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ 
                    duration: (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) ? 0 : (searchFocused ? 0.18 : 0.12), 
                    ease: "easeOut" 
                  }}
                  className="absolute left-0 right-0 top-full mt-1 max-h-[480px] overflow-y-auto bg-[#1a1a1a] border border-[rgba(255,255,255,0.12)] rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.7)] z-[200] py-2 search-scrollbar"
                >
                  {/* Empty Input state */}
                  {!searchQuery.trim() && renderEmptyState()}

                  {/* Debounce / Loading State */}
                  {searchQuery.trim() && suggestionsLoading && renderSkeletonState()}

                  {/* Suggestions State */}
                  {searchQuery.trim() && !suggestionsLoading && suggestions.length > 0 && renderSuggestionsState()}

                  {/* No Results State */}
                  {searchQuery.trim() && !suggestionsLoading && suggestions.length === 0 && renderNoResultsState()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="material-symbols-outlined text-text-primary icon-btn icon-btn-sm hover:bg-surface-container-highest">
            settings
          </button>
          <div 
            onClick={() => {
              setActiveTab('profile');
              setActiveArtist(null);
              setActiveAlbum(null);
              setIsSearching(false);
              setIsPlayerExpanded(false);
            }}
            className="w-8 h-8 rounded-full ml-2 cursor-pointer border border-outline-variant active:scale-95 transition-transform duration-150 flex items-center justify-center bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[20px] text-text-primary">person</span>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className={`flex flex-1 overflow-hidden ${isPlayerExpanded ? 'h-[calc(100vh-56px)]' : 'h-[calc(100vh-128px)]'}`}>
        {/* Sidebar Navigation */}
        {!isPlayerExpanded && (
          <aside className="hidden md:flex flex-col gap-stack-sm h-full w-sidebar-width bg-bg-nav pt-4 overflow-y-auto shrink-0 border-r border-outline-variant/10">
          <nav className="flex flex-col px-3 gap-1 relative">
            <button 
              onClick={() => {
                setActiveTab('home');
                setIsSearching(false);
                setSearchQuery('');
                setSearchResults([]);
                setActiveArtist(null);
                setActiveAlbum(null);
                setIsPlayerExpanded(false);
              }}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors w-full relative ${
                activeTab === 'home' && !isSearching && !activeArtist && !activeAlbum
                  ? 'text-text-primary font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {activeTab === 'home' && !isSearching && !activeArtist && !activeAlbum && (
                <motion.div 
                  layoutId="sidebar-active-indicator" 
                  className="absolute inset-0 bg-surface-container-highest rounded-xl -z-10"
                  {...sidebarItemActiveIndicatorVariants}
                />
              )}
              <span className="material-symbols-outlined">home</span>
              <span className="font-label-lg text-label-lg z-10">Home</span>
            </button>
            
            <button 
              onClick={() => {
                setActiveTab('explore');
                setIsSearching(false);
                setSearchQuery('');
                setSearchResults([]);
                setActiveArtist(null);
                setActiveAlbum(null);
                setIsPlayerExpanded(false);
              }}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors w-full relative ${
                activeTab === 'explore' && !isSearching && !activeArtist && !activeAlbum
                  ? 'text-text-primary font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {activeTab === 'explore' && !isSearching && !activeArtist && !activeAlbum && (
                <motion.div 
                  layoutId="sidebar-active-indicator" 
                  className="absolute inset-0 bg-surface-container-highest rounded-xl -z-10"
                  {...sidebarItemActiveIndicatorVariants}
                />
              )}
              <span className="material-symbols-outlined" style={activeTab === 'explore' ? { fontVariationSettings: "'FILL' 1" } : {}}>explore</span>
              <span className="font-label-lg text-label-lg z-10">Explore</span>
            </button>
            
            <button 
              onClick={() => {
                setActiveTab('library');
                setIsSearching(false);
                setSearchQuery('');
                setSearchResults([]);
                setActiveArtist(null);
                setActiveAlbum(null);
                setIsPlayerExpanded(false);
              }}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors w-full relative ${
                activeTab === 'library' && !isSearching && !activeArtist && !activeAlbum
                  ? 'text-text-primary font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {activeTab === 'library' && !isSearching && !activeArtist && !activeAlbum && (
                <motion.div 
                  layoutId="sidebar-active-indicator" 
                  className="absolute inset-0 bg-surface-container-highest rounded-xl -z-10"
                  {...sidebarItemActiveIndicatorVariants}
                />
              )}
              <span className="material-symbols-outlined" style={activeTab === 'library' ? { fontVariationSettings: "'FILL' 1" } : {}}>library_music</span>
              <span className="font-label-lg text-label-lg z-10">Library</span>
            </button>

            <button 
              onClick={() => {
                setActiveTab('profile');
                setIsSearching(false);
                setSearchQuery('');
                setSearchResults([]);
                setActiveArtist(null);
                setActiveAlbum(null);
                setIsPlayerExpanded(false);
              }}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors w-full relative ${
                activeTab === 'profile' && !isSearching && !activeArtist && !activeAlbum
                  ? 'text-text-primary font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {activeTab === 'profile' && !isSearching && !activeArtist && !activeAlbum && (
                <motion.div 
                  layoutId="sidebar-active-indicator" 
                  className="absolute inset-0 bg-surface-container-highest rounded-xl -z-10"
                  {...sidebarItemActiveIndicatorVariants}
                />
              )}
              <span className="material-symbols-outlined" style={activeTab === 'profile' ? { fontVariationSettings: "'FILL' 1" } : {}}>person</span>
              <span className="font-label-lg text-label-lg z-10">Profile</span>
            </button>
          </nav>
          
          <div className="mx-6 my-4 h-px bg-outline-variant opacity-30"></div>
          
          <div className="flex flex-col px-4 gap-1">
            <button 
              onClick={handleCreatePlaylist}
              className="text-text-secondary flex items-center gap-4 px-4 py-3 hover:bg-surface-container-high transition-colors rounded-xl w-full text-left active:scale-95 duration-150"
            >
              <span className="material-symbols-outlined">add</span>
              <span className="font-label-lg text-label-lg">New Playlist</span>
            </button>
            <div className="mt-4 px-4">
              <div className="text-label-md font-label-md text-text-tertiary uppercase tracking-wider mb-2 font-bold">Your Playlists</div>
              <div className="flex flex-col gap-3">
                {playlists.map((playlist, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleOpenAlbum({
                      title: playlist,
                      artist: 'Mics',
                      type: 'Playlist',
                      year: '2024'
                    })}
                    className="text-body-md text-text-secondary hover:text-text-primary transition-colors truncate text-left w-full active:scale-95 duration-150"
                  >
                    {playlist}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
        )}

        <AnimatePresence mode="wait">
        {isPlayerExpanded ? (
          /* EXPANDED NOW PLAYING VIEW */
          <motion.div 
            key="expanded-player"
            variants={nowPlayingExpandVariants}
            initial="collapsed"
            animate="expanded"
            exit="exit"
            className="relative flex-1 overflow-hidden h-full bg-bg-base"
          >
            {/* Background Blur Overlay */}
            <motion.div 
              className="absolute inset-0 z-0 opacity-60 pointer-events-none"
              variants={nowPlayingBackgroundVariants}
              custom={ambientColor}
              animate="animate"
            />
            
            <main className="relative z-10 h-full flex flex-col md:flex-row max-w-7xl mx-auto px-gutter py-8 gap-12 items-center md:items-start overflow-y-auto md:overflow-hidden">
              {/* Left Column: Player Core */}
              <div className={`w-full ${playerLayout === 'cinematic' ? 'md:w-[568px]' : 'md:w-[450px]'} flex flex-col items-center md:items-start animate-fade-in shrink-0 transition-all duration-300`}>
                {/* Artwork */}
                {playerLayout === 'cinematic' ? (
                  <motion.div 
                    layoutId="now-playing-artwork"
                    className="relative group mb-8 w-full md:w-[568px] aspect-video overflow-hidden rounded-2xl shadow-2xl bg-black/40 border border-white/10"
                  >
                    {/* Blurry Ambient background */}
                    <div className="absolute inset-0 z-0 opacity-45 blur-2xl scale-125 pointer-events-none select-none">
                      <img 
                        src={currentTrack ? currentTrack.thumbnail : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=640&h=640&fit=crop&q=80'} 
                        className="w-full h-full object-cover" 
                        alt=""
                      />
                    </div>
                    {/* Centered Artwork */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[320px] h-[320px] max-w-[90%] max-h-[90%] aspect-square rounded-xl overflow-hidden shadow-xl border border-white/15">
                      <img 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" 
                        src={currentTrack ? currentTrack.thumbnail : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=640&h=640&fit=crop&q=80'}
                        alt={currentTrack ? currentTrack.title : 'Album artwork'}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    layoutId="now-playing-artwork"
                    className="relative group mb-8 w-[360px] h-[360px] md:w-[420px] md:h-[420px] overflow-hidden rounded-xl shadow-2xl"
                  >
                    <img 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" 
                      src={currentTrack ? currentTrack.thumbnail : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=640&h=640&fit=crop&q=80'}
                      alt={currentTrack ? currentTrack.title : 'Album artwork'}
                    />
                  </motion.div>
                )}
                
                {/* Track Info */}
                <div className="w-full mb-6">
                  <div className="flex justify-between items-end">
                    <div className="min-w-0 flex-1 pr-4">
                      <h1 className="font-headline-lg text-headline-lg mb-1 truncate">{currentTrack ? currentTrack.title : 'No track selected'}</h1>
                      <p className="font-body-lg text-body-lg text-text-secondary truncate">
                        {currentTrack ? currentTrack.artist : 'Unknown Artist'} {currentTrack?.album ? `• ${currentTrack.album}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0 items-center">
                      <div className="relative flex items-center justify-center">
                        <motion.button 
                          variants={likeButtonVariants}
                          animate={isCurrentTrackLiked ? "liked" : "unliked"}
                          onClick={() => {
                            if (currentTrack) {
                              if (!isCurrentTrackLiked) {
                                setExpandedBurstKey(prev => prev + 1);
                              }
                              handleToggleLike(currentTrack);
                            }
                          }}
                          className="p-2 hover:bg-surface-container-highest rounded-full active:scale-95 flex items-center justify-center"
                          style={{
                            color: isCurrentTrackLiked ? "#ff5540" : "#ffffff"
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: isCurrentTrackLiked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                        </motion.button>
                        {isCurrentTrackLiked && (
                          <div key={expandedBurstKey} className="absolute pointer-events-none flex items-center justify-center">
                            {[...Array(6)].map((_, i) => {
                              const angle = (i * 60 * Math.PI) / 180;
                              return (
                                <motion.div
                                  key={i}
                                  variants={likeParticleVariants(angle)}
                                  initial="initial"
                                  animate="burst"
                                  className="absolute w-1.5 h-1.5 rounded-full bg-[#ff5540]"
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <button className="p-2 hover:bg-surface-container-highest rounded-full transition-colors active:scale-95 duration-150 flex items-center justify-center">
                        <span className="material-symbols-outlined text-text-primary">add_circle</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Audio Visualizer Waveform */}
                <div className="w-full h-12 flex items-end justify-between gap-[3px] mb-4 px-1">
                  {frequencies.map((freq, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-gradient-to-t from-[#ff5540]/20 to-[#ff5540] rounded-t-sm"
                      style={{
                        height: `${freq * 100}%`,
                        minHeight: '4px',
                        transition: 'height 0.05s ease-out'
                      }}
                    />
                  ))}
                </div>
                
                {/* Progress Bar */}
                <div className="w-full mb-8">
                  <div 
                    onClick={handleProgressBarClick}
                    className="relative h-1 w-full bg-white/10 rounded-full cursor-pointer group"
                  >
                    <div 
                      className="absolute top-0 left-0 h-full bg-primary-container rounded-full"
                      style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    ></div>
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary-container rounded-full scale-0 group-hover:scale-100 transition-transform"
                      style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%`, transform: 'translate(-50%, -50%)' }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 font-label-md text-text-tertiary">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
                
                {/* Main Controls */}
                <div className="flex items-center justify-center md:justify-start gap-8 w-full">
                  <button 
                    onClick={handleToggleShuffle}
                    className={`transition-colors active:scale-95 duration-150 ${
                      isShuffle ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined">shuffle</span>
                  </button>
                  <button 
                    onClick={handlePrevTrack}
                    className="text-text-primary hover:scale-110 transition-transform active:scale-95 duration-150"
                  >
                    <span className="material-symbols-outlined">skip_previous</span>
                  </button>
                  <button 
                    onClick={handlePlayPauseClick}
                    disabled={isBuffering}
                    className="bg-white text-black w-16 h-16 rounded-full flex items-center justify-center hover:scale-105 transition-transform active:scale-95 duration-150"
                  >
                    <span
                      className={`material-symbols-outlined select-none ${isBuffering ? 'animate-spin' : ''}`}
                      style={{ fontSize: 32, color: '#000', fontVariationSettings: "'FILL' 1" }}
                    >
                      {isBuffering ? 'autorenew' : isPlaying ? 'pause' : 'play_arrow'}
                    </span>
                  </button>
                  <button 
                    onClick={handleNextTrack}
                    className="text-text-primary hover:scale-110 transition-transform active:scale-95 duration-150"
                  >
                    <span className="material-symbols-outlined">skip_next</span>
                  </button>
                  <button 
                    onClick={handleToggleRepeat}
                    className={`transition-colors active:scale-95 duration-150 ${
                      repeatMode !== 'off' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined">
                      {repeatMode === 'one' ? 'repeat_one' : 'repeat'}
                    </span>
                  </button>
                  <button 
                    onClick={() => setPlayerLayout(prev => prev === 'standard' ? 'cinematic' : 'standard')}
                    className="text-text-secondary hover:text-text-primary transition-colors active:scale-95 duration-150 ml-auto hidden md:block"
                    title={playerLayout === 'standard' ? "Switch to Cinematic Layout" : "Switch to Standard Layout"}
                  >
                    <span className="material-symbols-outlined">
                      {playerLayout === 'standard' ? 'picture_in_picture' : 'image'}
                    </span>
                  </button>
                </div>
              </div>
              
              {/* Right Column: Tabs & Content */}
              <div className="flex-grow w-full h-[350px] md:h-full flex flex-col bg-surface-container-low/40 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/5">
                {/* Tabs Header */}
                <div className="flex border-b border-white/10 shrink-0">
                  <button 
                    onClick={() => setActivePlayerTab('up-next')}
                    className={`flex-1 py-4 font-label-lg transition-all ${
                      activePlayerTab === 'up-next' 
                        ? 'text-text-primary border-b-2 border-primary-container bg-white/5 font-bold' 
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    UP NEXT
                  </button>
                  <button 
                    onClick={() => setActivePlayerTab('lyrics')}
                    className={`flex-1 py-4 font-label-lg transition-all ${
                      activePlayerTab === 'lyrics' 
                        ? 'text-text-primary border-b-2 border-primary-container bg-white/5 font-bold' 
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    LYRICS
                  </button>

                </div>
                
                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto lyrics-scrollbar p-6">
                  {activePlayerTab === 'up-next' && (
                    <div className="flex flex-col gap-2">
                      {upNextLoading ? (
                        <div className="flex py-12 justify-center">
                          <span className="material-symbols-outlined animate-spin text-primary-container">autorenew</span>
                        </div>
                      ) : !currentTrack && upNextQueue.length === 0 ? (
                        <p className="text-text-secondary text-body-lg">Queue is empty.</p>
                      ) : (
                        <>
                          {currentTrack && (
                            <div className="flex flex-col mb-4">
                              <p className="text-text-tertiary text-[11px] uppercase tracking-wider font-bold mb-2">Now playing</p>
                              <div className="flex items-center gap-4 p-2 rounded-xl bg-surface-container-highest/40 border border-white/5">
                                <div 
                                  style={{width:48,height:48,minWidth:48,minHeight:48}}
                                  className="relative flex-shrink-0 bg-surface-container-high rounded-lg overflow-hidden"
                                >
                                  <img 
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover opacity-60"
                                    src={currentTrack.thumbnail}
                                    alt={currentTrack.title}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                    <div className="flex items-end gap-[2px] w-4 h-4 justify-center">
                                      {equalizerBarVariants.map((variant, idx) => (
                                        <motion.div
                                          key={idx}
                                          variants={variant}
                                          animate={isPlaying ? "animate" : { scaleY: 0.3 }}
                                          className="w-[3px] h-full bg-primary-container origin-bottom rounded-[1px]"
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                  <h4 className="font-body-md text-body-md truncate text-primary-container font-bold">{currentTrack.title}</h4>
                                  <p className="font-label-md text-label-md text-text-secondary truncate">{currentTrack.artist}</p>
                                </div>
                                <span className="font-label-md text-label-md text-primary-container">{formatTime(duration || currentTrack.duration || 0)}</span>
                              </div>
                            </div>
                          )}

                          {upNextQueue.length > 0 && (
                            <div className="flex flex-col gap-2">
                              <p className="text-text-tertiary text-[11px] uppercase tracking-wider font-bold mb-1">Next up</p>
                              {upNextQueue.map((track, trackIdx) => {
                                return (
                                  <div 
                                    key={track.id || trackIdx}
                                    onClick={() => {
                                      const idx = upNextQueue.findIndex(t => t.id === track.id);
                                      if (idx !== -1) {
                                        const nextTrack = upNextQueue[idx];
                                        const upcoming = upNextQueue.slice(idx + 1);
                                        setUpNextQueue(upcoming);
                                        if (currentTrack) {
                                          setPlayHistory(prev => [...prev, currentTrack, ...upNextQueue.slice(0, idx)]);
                                        } else {
                                          setPlayHistory(prev => [...prev, ...upNextQueue.slice(0, idx)]);
                                        }
                                        setCurrentTrack({ ...nextTrack, __freshContext: false });
                                        setIsPlaying(true);
                                      }
                                    }}
                                    className="flex items-center gap-4 p-2 rounded-xl group cursor-pointer hover:bg-surface-container-highest transition-colors"
                                  >
                                    <div 
                                      style={{width:48,height:48,minWidth:48,minHeight:48}}
                                      className="relative flex-shrink-0 bg-surface-container-high rounded-lg overflow-hidden"
                                    >
                                      <img 
                                        width={48}
                                        height={48}
                                        className="w-full h-full object-cover"
                                        src={track.thumbnail}
                                        alt={track.title}
                                      />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                      <h4 className="font-body-md text-body-md truncate text-text-primary">{track.title}</h4>
                                      <p className="font-label-md text-label-md text-text-secondary truncate">{track.artist}</p>
                                    </div>
                                    <span className="font-label-md text-label-md text-text-tertiary">{formatTime(track.duration)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  
                  {activePlayerTab === 'lyrics' && (
                    <div className="space-y-6 py-4 flex flex-col items-start">
                      {lyricsLoading ? (
                        <div className="flex w-full py-12 justify-center">
                          <span className="material-symbols-outlined animate-spin text-primary-container">autorenew</span>
                        </div>
                      ) : lyrics.length === 0 ? (
                        <p className="text-text-secondary text-body-lg py-4">Lyrics not available for this track.</p>
                      ) : (
                        lyrics.map((line, lineIdx) => (
                          <p 
                            key={lineIdx}
                            className="text-[24px] md:text-[28px] font-bold text-text-secondary leading-tight hover:text-text-primary transition-all duration-300 cursor-default"
                          >
                            {line}
                          </p>
                        ))
                      )}
                    </div>
                  )}
                  
                  {activePlayerTab === 'related' && (
                    <div className="grid grid-cols-2 gap-6">
                      <div 
                        onClick={() => currentTrack && handleOpenArtist(currentTrack.artist)}
                        className="group cursor-pointer"
                      >
                        <div className="aspect-square w-full rounded-xl overflow-hidden mb-2 bg-surface-container-high relative">
                          <img 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            src={currentTrack?.thumbnail || 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=640&h=640&fit=crop&q=80'}
                            alt={currentTrack?.artist || 'Artist'}
                          />
                        </div>
                        <p className="font-body-md text-body-md text-text-primary font-bold group-hover:underline">Artist Profile</p>
                        <p className="font-label-md text-label-md text-text-secondary truncate">{currentTrack?.artist || 'Unknown Artist'}</p>
                      </div>
                      
                      <div 
                        onClick={() => {
                          if (currentTrack) {
                            handleOpenAlbum({
                              title: currentTrack.album || currentTrack.title,
                              artist: currentTrack.artist,
                              thumbnail: currentTrack.thumbnail,
                              type: currentTrack.album ? 'Album' : 'Song'
                            });
                          }
                        }}
                        className="group cursor-pointer"
                      >
                        <div className="aspect-square w-full rounded-xl overflow-hidden mb-2 bg-surface-container-high relative">
                          <img 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            src={currentTrack?.thumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=640&h=640&fit=crop&q=80'}
                            alt={currentTrack?.album || 'Album'}
                          />
                        </div>
                        <p className="font-body-md text-body-md text-text-primary font-bold group-hover:underline">Appears On</p>
                        <p className="font-label-md text-label-md text-text-secondary truncate">{currentTrack?.album || 'Single'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </main>
          </motion.div>
        ) : (
          /* Main Content Area */
          <motion.main 
            key="main-dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            ref={mainRef}
            onScroll={activeArtist ? handleScroll : undefined}
            className="flex-1 overflow-y-auto bg-bg-base relative"
          >
            <div 
              className={`${(activeArtist || activeAlbum) ? 'pb-32' : 'px-gutter pb-32 pt-6 flex flex-col gap-12'}`}
            >
            {activeArtist ? (
              /* ARTIST PROFILE VIEW */
              <div className="flex flex-col gap-12">
                {/* Artist Hero Banner */}
                <section className="relative w-full h-[320px] overflow-hidden">
                  <div className="absolute inset-0">
                    <img 
                      alt="Artist Cover" 
                      className="w-full h-full object-cover object-center transition-transform duration-75 origin-center" 
                      style={{ transform: `scale(${1 + scrollOffset / 2000})` }}
                      src={activeArtist.img}
                    />
                    <div className="absolute inset-0 artist-hero-gradient"></div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full p-gutter flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                      <h1 className="font-display-lg text-[56px] leading-[64px] font-black text-text-primary mb-2">
                        {activeArtist.name}
                      </h1>
                      <p className="font-body-lg text-body-lg text-text-secondary">
                        {activeArtist.subscribers || '1.5M'} Subscribers • {activeArtist.listeners || '5.2M'} monthly listeners
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          if (artistTracks.length > 0) {
                            // Pick random song
                            const randIdx = Math.floor(Math.random() * artistTracks.length);
                            handlePlayTrack(artistTracks[randIdx], artistTracks);
                          }
                        }}
                        className="bg-text-primary text-on-secondary-fixed font-bold px-8 py-3 rounded-full hover:opacity-90 transition-opacity flex items-center gap-2 active:scale-95 duration-150"
                      >
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>shuffle</span>
                        SHUFFLE
                      </button>
                      <button 
                        onClick={() => setIsSubscribed(!isSubscribed)}
                        className={`font-bold px-8 py-3 rounded-full transition-colors active:scale-95 duration-150 border ${
                          isSubscribed 
                            ? 'bg-transparent border-white/20 text-text-secondary hover:bg-white/5' 
                            : 'border-outline-variant text-text-primary hover:bg-white/10'
                        }`}
                      >
                        {isSubscribed ? 'SUBSCRIBED' : 'SUBSCRIBE'}
                      </button>
                      <button className="p-3 rounded-full border border-outline-variant text-text-primary hover:bg-white/10 transition-colors active:scale-95 duration-150">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </div>
                  </div>
                </section>

                <div className="px-gutter flex flex-col gap-12">
                  {/* Top Songs Section */}
                  <section>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="font-headline-lg text-headline-lg text-text-primary">Top Songs</h2>
                      <button 
                        onClick={() => triggerSearch(`${activeArtist.name} top songs`)}
                        className="text-text-secondary font-label-lg text-label-lg hover:text-text-primary active:scale-95 duration-150"
                      >
                        SEE ALL
                      </button>
                    </div>
                    
                    {artistLoading ? (
                      <div className="flex py-10 items-center justify-center">
                        <span className="material-symbols-outlined animate-spin text-primary-container">autorenew</span>
                      </div>
                    ) : artistTracks.length === 0 ? (
                      <p className="text-text-secondary text-body-lg py-4">No top songs found.</p>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-1">
                        {artistTracks.slice(0, 4).map((track, trackIdx) => (
                          <div 
                            key={track.id}
                            onClick={() => handlePlayTrack(track, artistTracks, 'artist_page')}
                            className={`flex items-center gap-4 p-2 rounded-xl transition-colors group cursor-pointer ${
                              currentTrack?.id === track.id ? 'bg-surface-container-high' : 'hover:bg-surface-container-high'
                            }`}
                          >
                            <span className="text-text-tertiary font-body-md text-body-md w-4 text-center">
                              {trackIdx + 1}
                            </span>
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-high" style={{width:48,height:48}}>
                              <img 
                                alt={track.title} 
                                className="w-full h-full object-cover" 
                                src={track.thumbnail}
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-body-md text-body-md text-text-primary truncate">{track.title}</p>
                              <p className="font-label-md text-label-md text-text-secondary truncate">
                                {track.album || 'Single'} • {formatTime(track.duration)}
                              </p>
                            </div>
                            <div className="hidden group-hover:flex items-center gap-4 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <span 
                                onClick={() => handleToggleLike(track)}
                                className={`material-symbols-outlined text-text-secondary hover:text-text-primary cursor-pointer active:scale-95 duration-150 ${
                                  libraryItems.some(i => i.id === track.id) ? 'text-primary-container' : ''
                                }`}
                                style={{ fontVariationSettings: libraryItems.some(i => i.id === track.id) ? "'FILL' 1" : "'FILL' 0" }}
                              >
                                thumb_up
                              </span>
                              <span 
                                onClick={(e) => handleOpenTrackMenu(e, track, artistTracks)}
                                className="material-symbols-outlined text-text-secondary hover:text-text-primary cursor-pointer"
                              >
                                more_vert
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Albums Section */}
                  <section>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="font-headline-lg text-headline-lg text-text-primary">Albums</h2>
                      <div className="flex gap-2">
                        <button className="w-10 h-10 flex items-center justify-center rounded-full border border-outline-variant hover:bg-surface-container-highest active:scale-95 duration-150">
                          <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <button className="w-10 h-10 flex items-center justify-center rounded-full border border-outline-variant hover:bg-surface-container-highest active:scale-95 duration-150">
                          <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex overflow-x-auto gap-gutter pb-4 hide-scrollbar">
                      {albumsToRender.map((album, idx) => (
                        <div 
                          key={album.id || idx} 
                          onClick={() => handleOpenAlbum(album)}
                          className="flex-shrink-0 w-44 group cursor-pointer"
                        >
                          <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-surface-container-high">
                            <img 
                              alt={album.title} 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                              src={album.thumbnail}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black">
                                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                              </div>
                            </div>
                          </div>
                          <h3 className="font-body-md text-body-md text-text-primary truncate font-bold">{album.title}</h3>
                          <p className="font-label-md text-label-md text-text-secondary">{album.year} • {album.type}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Singles Section */}
                  <section>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="font-headline-lg text-headline-lg text-text-primary">Singles</h2>
                      <button 
                        onClick={() => triggerSearch(`${activeArtist.name} singles`)}
                        className="text-text-secondary font-label-lg text-label-lg hover:text-text-primary active:scale-95 duration-150"
                      >
                        SEE ALL
                      </button>
                    </div>
                    <div className="flex overflow-x-auto gap-gutter pb-4 hide-scrollbar">
                      {singlesToRender.map((single, idx) => (
                        <div 
                          key={single.id || idx} 
                          onClick={() => handleOpenAlbum(single)}
                          className="flex-shrink-0 w-44 group cursor-pointer"
                        >
                          <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-surface-container-high">
                            <img 
                              alt={single.title} 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                              src={single.thumbnail}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black">
                                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                              </div>
                            </div>
                          </div>
                          <h3 className="font-body-md text-body-md text-text-primary truncate font-bold">{single.title}</h3>
                          <p className="font-label-md text-label-md text-text-secondary">{single.year} • {single.type}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Fans Might Also Like */}
                  <section className="mb-12">
                    <h2 className="font-headline-lg text-headline-lg text-text-primary mb-6">Fans might also like</h2>
                    <div className="flex overflow-x-auto gap-10 pb-4 hide-scrollbar">
                      {relatedArtists.map((artist) => (
                        <div 
                          key={artist.name} 
                          onClick={() => handleOpenArtist(artist.name)}
                          className="flex flex-col items-center gap-3 group cursor-pointer"
                        >
                          <div className="w-40 h-40 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary-container transition-all active:scale-95 duration-150" style={{width:160,height:160}}>
                            <img 
                              alt={artist.name} 
                              className="w-full h-full object-cover" 
                              src={artist.img}
                            />
                          </div>
                          <div className="text-center">
                            <p className="font-body-md text-body-md text-text-primary group-hover:underline">{artist.name}</p>
                            <p className="font-label-md text-label-md text-text-secondary">{artist.subscribers} subscribers</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            ) : activeAlbum ? (
              /* ALBUM DETAILS VIEW */
              <div className="flex flex-col gap-8">
                {/* Hero Section */}
                <section className="hero-gradient h-[280px] flex items-end px-gutter pb-8 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row gap-8 items-end z-10 w-full animate-fade-in">
                    <div className="shrink-0 rounded-lg overflow-hidden shadow-2xl bg-surface-container-high" style={{width:260,height:260}}>
                      <img 
                        alt="Album artwork" 
                        className="w-full h-full object-cover" 
                        src={activeAlbum.thumbnail} 
                      />
                    </div>
                    <div className="flex flex-col gap-4 mb-2 flex-grow min-w-0">
                      <h1 className="font-display-lg text-[44px] leading-[52px] font-black text-text-primary tracking-tight truncate">
                        {activeAlbum.title}
                      </h1>
                      <div className="flex flex-wrap items-center gap-2 text-text-secondary font-label-lg text-label-lg">
                        <span 
                          className="hover:underline cursor-pointer text-text-primary font-bold" 
                          onClick={() => handleOpenArtist(activeAlbum.artist)}
                        >
                          {activeAlbum.artist}
                        </span>
                        <span>•</span>
                        <span>{activeAlbum.type}</span>
                        <span>•</span>
                        <span>{activeAlbum.year}</span>
                        <span>•</span>
                        <span>{albumTracks.length} songs</span>
                      </div>
                      <div className="flex flex-wrap gap-stack-md mt-2 items-center">
                        <button 
                          onClick={() => albumTracks.length > 0 && handlePlayTrack(albumTracks[0], albumTracks, 'album_page')}
                          className="bg-text-primary text-bg-base font-bold px-6 py-2 rounded-full flex items-center gap-2 hover:opacity-90 transition-all scale-100 active:scale-95 duration-150"
                        >
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                          <span>Play</span>
                        </button>
                        <button 
                          onClick={() => {
                            if (albumTracks.length > 0) {
                              const randIdx = Math.floor(Math.random() * albumTracks.length);
                              handlePlayTrack(albumTracks[randIdx], albumTracks, 'album_page');
                            }
                          }}
                          className="bg-surface-container-highest text-text-primary border border-outline-variant font-bold px-6 py-2 rounded-full flex items-center gap-2 hover:bg-surface-container-high transition-all scale-100 active:scale-95 duration-150"
                        >
                          <span className="material-symbols-outlined">shuffle</span>
                          <span>Shuffle</span>
                        </button>
                        <button 
                          onClick={() => {
                            albumTracks.forEach(t => handleToggleLike(t));
                          }}
                          className="material-symbols-outlined text-text-primary border border-outline-variant icon-btn icon-btn-sm flex items-center justify-center hover:bg-surface-container-high transition-colors active:scale-95 duration-150"
                        >
                          add_circle
                        </button>
                        <button className="material-symbols-outlined text-text-primary border border-outline-variant icon-btn icon-btn-sm flex items-center justify-center hover:bg-surface-container-high transition-colors active:scale-95 duration-150">
                          more_vert
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
                
                {/* Track List Section */}
                <section className="px-gutter pt-4">
                  {albumLoading ? (
                    <div className="flex py-12 items-center justify-center">
                      <span className="material-symbols-outlined animate-spin text-primary-container">autorenew</span>
                    </div>
                  ) : albumTracks.length === 0 ? (
                    <p className="text-text-secondary text-body-lg py-4">No tracks found.</p>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead className="border-b border-surface-container-high text-text-secondary">
                        <tr>
                          <th className="py-3 px-4 font-label-lg text-label-lg w-12">#</th>
                          <th className="py-3 px-4 font-label-lg text-label-lg">Title</th>
                          <th className="py-3 px-4 font-label-lg text-label-lg hidden md:table-cell">Album</th>
                          <th className="py-3 px-4 font-label-lg text-label-lg text-right w-24">
                            <span className="material-symbols-outlined">schedule</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-transparent">
                        {albumTracks.map((track, idx) => {
                          const isActive = currentTrack?.id === track.id;
                          return (
                            <tr 
                              key={track.id || idx} 
                              onClick={() => handlePlayTrack(track, albumTracks, 'album_page')} 
                              className={`group transition-colors cursor-pointer rounded-lg ${
                                isActive ? 'bg-surface-container-high' : 'hover:bg-surface-container-high'
                              }`}
                            >
                              <td className={`py-4 px-4 relative ${isActive ? 'text-primary-container' : 'text-text-secondary'}`}>
                                {isActive ? (
                                  <div className="flex items-end gap-[2px] w-4 h-4 justify-center py-[2px]">
                                    {equalizerBarVariants.map((variant, idx) => (
                                      <motion.div
                                        key={idx}
                                        variants={variant}
                                        animate={isPlaying ? "animate" : { scaleY: 0.3 }}
                                        className="w-[3px] h-full bg-primary-container origin-bottom rounded-[1px]"
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <>
                                    <span className="group-hover:hidden">{idx + 1}</span>
                                    <span className="material-symbols-outlined absolute left-4 top-4 text-text-primary hidden group-hover:block" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                                  </>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex flex-col">
                                  <span className={`font-bold ${isActive ? 'text-primary-container' : 'text-text-primary'}`}>{track.title}</span>
                                  <span className="text-text-secondary text-label-md">{track.artist}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-text-secondary hidden md:table-cell truncate max-w-xs">{track.album || activeAlbum.title}</td>
                              <td className="py-4 px-4 text-right relative min-w-[85px]" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-2">
                                  <span className="group-hover:hidden text-text-secondary">{formatTime(track.duration)}</span>
                                  <button 
                                    onClick={(e) => handleOpenTrackMenu(e, track, albumTracks)}
                                    className="hidden group-hover:flex p-1.5 hover:bg-white/10 rounded-full active:scale-95 duration-100 items-center justify-center text-text-secondary hover:text-text-primary"
                                  >
                                    <span className="material-symbols-outlined text-lg">more_vert</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </section>
              </div>
            ) : isSearching ? (
              /* Search results grid */
              <section>
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <p className="text-text-tertiary text-label-md uppercase tracking-widest font-bold">Search results</p>
                    <h2 className="font-headline-lg text-headline-lg">Tracks matching "{searchQuery}"</h2>
                  </div>
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearching(false);
                      setSearchResults([]);
                    }}
                    className="border border-outline-variant hover:bg-surface-container-high transition-colors text-label-md font-bold px-4 py-1.5 rounded-full active:scale-95 duration-150"
                  >
                    Clear Search
                  </button>
                </div>
                
                {searchResults.length === 0 ? (
                  <p className="text-text-secondary text-body-lg py-4 animate-pulse">Loading tracks...</p>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-x-8 gap-y-2">
                    {searchResults.map((track) => (
                      <div 
                        key={track.id}
                        onClick={() => handlePlayTrack(track, searchResults, 'search_result')}
                        className={`flex items-center gap-4 p-2 rounded-xl transition-colors group cursor-pointer ${
                          currentTrack?.id === track.id ? 'bg-surface-container-highest' : 'hover:bg-surface-container-highest'
                        }`}
                      >
                        <div className="relative rounded-lg overflow-hidden flex-shrink-0" style={{width:48,height:48}}>
                          <img 
                            alt={track.title} 
                            className="w-full h-full object-cover" 
                            src={track.thumbnail}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                            <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                              play_arrow
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body-lg text-body-lg truncate text-text-primary">{track.title}</p>
                          <p 
                            className="font-body-md text-body-md truncate text-text-secondary hover:underline cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenArtist(track.artist);
                            }}
                          >
                            {track.artist}
                          </p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className={`p-2 rounded-full active:scale-95 duration-150 ${
                              libraryItems.some(i => i.id === track.id) ? 'text-primary-container' : 'text-text-secondary hover:bg-white/10'
                            }`}
                            onClick={() => handleToggleLike(track)}
                          >
                            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: libraryItems.some(i => i.id === track.id) ? "'FILL' 1" : "'FILL' 0" }}>
                              favorite
                            </span>
                          </button>
                          <button 
                            onClick={(e) => handleOpenTrackMenu(e, track)}
                            className="p-2 hover:bg-white/10 rounded-full active:scale-95 duration-150"
                          >
                            <span className="material-symbols-outlined text-text-secondary">more_vert</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ) : activeTab === 'explore' ? (
              /* EXPLORE VIEW */
              <section className="max-w-6xl mx-auto w-full">
                <h1 className="font-headline-lg text-headline-lg text-text-primary mb-8 tracking-tight" style={{ fontSize: '22px' }}>
                  Search Mics
                </h1>
                <h2 className="font-headline-md text-headline-md text-text-primary mb-6">Browse by mood &amp; moments</h2>
                
                {/* Mood moment cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {moodCards.map((mood) => (
                    <div 
                      key={mood.title}
                      onClick={() => triggerSearch(`${mood.title} Music`)}
                      className="h-20 rounded-xl flex items-center px-4 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all duration-150 relative overflow-hidden group shadow-lg" 
                      style={{ backgroundColor: mood.bg }}
                    >
                      <span className="font-headline-md text-headline-md text-text-primary z-10">{mood.title}</span>
                      <div className="absolute right-[-10%] bottom-[-10%] opacity-20 group-hover:opacity-40 transition-opacity duration-200">
                        <span className="material-symbols-outlined text-[56px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {mood.icon}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Featured New Releases */}
                <div className="mt-16">
                  <div className="flex justify-between items-end mb-6">
                    <h2 className="font-headline-lg text-headline-lg text-text-primary">New releases</h2>
                    <button 
                      onClick={() => triggerSearch("New releases music")}
                      className="text-text-secondary hover:text-text-primary text-label-lg font-label-lg transition-colors border border-outline-variant px-3 py-1 rounded-full active:scale-95 duration-150"
                    >
                      See all
                    </button>
                  </div>
                  
                  {loading ? (
                    <div className="flex justify-center py-10">
                      <span className="material-symbols-outlined animate-spin text-primary-container">autorenew</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                      {newReleases.map((release, idx) => (
                        <div key={idx} onClick={() => {
                          if (release.type === 'ALBUM' || release.type === 'PLAYLIST' || release.playlistId) {
                            handleOpenAlbum({
                              id: release.id || release.playlistId,
                              title: release.title,
                              artist: release.artist,
                              thumbnail: release.thumbnail,
                              type: release.playlistId ? 'Playlist' : 'Album',
                              year: '2024'
                            });
                          } else {
                            const songReleases = newReleases.filter(r => r.type !== 'ALBUM' && r.type !== 'PLAYLIST' && !r.playlistId);
                            handlePlayTrack(release, songReleases);
                          }
                        }} className="group cursor-pointer">
                          <div className="aspect-square w-full rounded-xl overflow-hidden mb-3 shadow-2xl relative bg-surface-container-high">
                            <img 
                              alt={release.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                              src={release.thumbnail}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                            </div>
                          </div>
                          <h3 className="font-body-md text-text-primary line-clamp-1">{release.title}</h3>
                          <p 
                            className="font-label-md text-label-md text-text-secondary line-clamp-1 hover:underline cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenArtist(release.artist);
                            }}
                          >
                            {release.artist}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            ) : activeTab === 'library' ? (
              /* LIBRARY VIEW */
              <section className="max-w-7xl mx-auto w-full px-gutter py-8">
                {/* Library Header */}
                <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-primary-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-4xl">library_music</span>
                    </div>
                    <div>
                      <h1 className="text-headline-lg font-headline-lg text-text-primary">Library</h1>
                      <p className="text-body-md font-body-md text-text-secondary">Your collection of music and podcasts</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleCreatePlaylist}
                    className="bg-text-primary text-bg-base font-label-lg text-label-lg px-6 py-2.5 rounded-full hover:bg-secondary transition-colors flex items-center gap-2 active:scale-95 duration-150"
                  >
                    <span className="material-symbols-outlined">add</span>
                    New playlist
                  </button>
                </header>

                {/* Filter Chips */}
                <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
                  {['All', 'Playlists', 'Albums', 'Songs', 'Artists'].map((filter) => {
                    const isActive = libraryFilter === filter;
                    return (
                      <button
                        key={filter}
                        onClick={() => setLibraryFilter(filter)}
                        className={`h-8 px-4 rounded-full text-label-md font-label-md transition-colors whitespace-nowrap active:scale-95 duration-150 ${
                          isActive 
                            ? 'bg-text-primary text-bg-base font-bold' 
                            : 'border border-outline-variant bg-white/10 hover:bg-white/20 text-text-primary'
                        }`}
                      >
                        {filter}
                      </button>
                    );
                  })}
                </div>

                {/* View Toggle & Sort */}
                <div className="flex items-center justify-between mb-6 border-b border-surface-variant/20 pb-4">
                  <div className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-label-lg font-label-lg text-text-secondary">Recent activity</span>
                    <span className="material-symbols-outlined text-text-secondary">arrow_drop_down</span>
                  </div>
                  <div className="flex items-center gap-2 bg-surface-container rounded-full p-1">
                    <button 
                      onClick={() => setLibraryViewMode('grid')}
                      className={`p-1.5 rounded-full transition-all ${libraryViewMode === 'grid' ? 'bg-surface-variant text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                      <span className="material-symbols-outlined">grid_view</span>
                    </button>
                    <button 
                      onClick={() => setLibraryViewMode('list')}
                      className={`p-1.5 rounded-full transition-all ${libraryViewMode === 'list' ? 'bg-surface-variant text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                      <span className="material-symbols-outlined">list</span>
                    </button>
                  </div>
                </div>

                {libraryFilter === 'Songs' && filteredItems.length === 0 ? (
                  /* Library Empty State */
                  <div className="flex flex-col items-center justify-center pt-24 text-center">
                    <span className="material-symbols-outlined text-[60px] text-text-tertiary mb-6">music_note</span>
                    <h2 className="font-headline-lg text-headline-lg text-text-primary mb-2">Your library is empty</h2>
                    <p className="font-body-lg text-body-lg text-text-secondary mb-8">Songs you save will appear here</p>
                    <button 
                      onClick={() => setActiveTab('explore')}
                      className="bg-white text-black px-8 py-3 rounded-full font-label-lg text-label-lg font-bold hover:bg-secondary-fixed transition-colors active:scale-95 duration-150"
                    >
                      Find songs
                    </button>
                  </div>
                ) : libraryViewMode === 'grid' ? (
                  /* Library Grid View */
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-8">
                    {/* New Playlist Card (shown in All or Playlists filter) */}
                    {(libraryFilter === 'All' || libraryFilter === 'Playlists') && (
                      <div onClick={handleCreatePlaylist} className="group cursor-pointer">
                        <div className="aspect-square w-full bg-surface-container border-2 border-dashed border-outline-variant/30 rounded-xl flex flex-col items-center justify-center gap-4 hover:bg-surface-container-high transition-colors">
                          <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-text-primary text-3xl">add</span>
                          </div>
                          <span className="text-body-md font-body-md text-text-primary">New playlist</span>
                        </div>
                      </div>
                    )}

                    {filteredItems.map((item, idx) => (
                      <div 
                        key={item.id || idx} 
                        onClick={() => {
                          if (item.type === 'Artist') {
                            handleOpenArtist(item.title);
                          } else if (item.type === 'Album' || item.type === 'Playlist') {
                            handleOpenAlbum(item);
                          } else {
                            handlePlayTrack(item, filteredItems.filter(i => i.type === 'Song'), 'library_song');
                          }
                        }}
                        className="group cursor-pointer"
                      >
                        <div className={`relative aspect-square w-full mb-3 overflow-hidden bg-surface-container shadow-lg transition-all duration-300 group-hover:scale-[1.02] ${
                          item.type === 'Artist' ? 'rounded-full' : 'rounded-xl'
                        }`}>
                          <img 
                            className="w-full h-full object-cover" 
                            src={item.thumbnail} 
                            alt={item.title}
                          />
                          {item.type !== 'Artist' && (
                            <>
                              {/* Dark overlay + icon on hover (or playing state) */}
                              <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-200 ${
                                currentTrack?.id === item.id
                                  ? 'opacity-100'
                                  : 'opacity-0 group-hover:opacity-100'
                              }`}>
                                {currentTrack?.id === item.id ? (
                                  // Currently playing: show equalizer bars, pause on hover
                                  <div className="relative w-12 h-12 flex items-center justify-center">
                                    {/* Equalizer bars (hidden on hover of the whole card) */}
                                    <div className="flex items-end gap-[3px] h-5 group-hover:opacity-0 transition-opacity">
                                      {[1, 0.6, 0.85, 0.4].map((h, i) => (
                                        <div
                                          key={i}
                                          className="w-1 bg-white rounded-full"
                                          style={{
                                            height: `${h * 100}%`,
                                            animation: isPlaying ? `equalizerBar ${0.8 + i * 0.15}s ease-in-out infinite alternate` : 'none',
                                            opacity: isPlaying ? 1 : 0.5,
                                          }}
                                        />
                                      ))}
                                    </div>
                                    {/* Pause icon on hover */}
                                    <span
                                      className="absolute material-symbols-outlined text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                      style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}
                                    >
                                      {isPlaying ? 'pause' : 'play_arrow'}
                                    </span>
                                  </div>
                                ) : (
                                  // Not playing: white circle play button rising up
                                  <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                        <h3 className="font-body-md text-body-md text-text-primary mb-1 truncate font-bold">{item.title}</h3>
                        <p className="font-label-md text-label-md text-text-secondary">
                          {item.type === 'Artist' ? 'Artist' : `${item.type} • ${item.artist}`}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Library List View */
                  <div className="flex flex-col gap-2">
                    {/* New Playlist Row (shown in All or Playlists filter) */}
                    {(libraryFilter === 'All' || libraryFilter === 'Playlists') && (
                      <div 
                        onClick={handleCreatePlaylist} 
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer group"
                      >
                        <div className="w-12 h-12 bg-surface-container border border-dashed border-outline-variant/30 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                          <span className="material-symbols-outlined text-text-primary text-2xl">add</span>
                        </div>
                        <div>
                          <span className="text-body-md font-body-md text-text-primary font-bold">New playlist</span>
                          <p className="text-label-md font-label-md text-text-secondary">Create a new collection</p>
                        </div>
                      </div>
                    )}

                    {filteredItems.map((item, idx) => (
                      <div 
                        key={item.id || idx} 
                        onClick={() => {
                          if (item.type === 'Artist') {
                            handleOpenArtist(item.title);
                          } else if (item.type === 'Album' || item.type === 'Playlist') {
                            handleOpenAlbum(item);
                          } else {
                            handlePlayTrack(item, filteredItems.filter(i => i.type === 'Song'), 'library_song');
                          }
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-container-highest/40 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`relative flex-shrink-0 overflow-hidden bg-surface-container shadow-md ${
                            item.type === 'Artist' ? 'rounded-full' : 'rounded-lg'
                          }`} style={{width:48,height:48}}>
                            <img 
                              className="w-full h-full object-cover" 
                              src={item.thumbnail} 
                              alt={item.title}
                            />
                            {item.type !== 'Artist' && (
                              <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-200 ${
                                currentTrack?.id === item.id
                                  ? 'opacity-100'
                                  : 'opacity-0 group-hover:opacity-100'
                              }`}>
                                {currentTrack?.id === item.id ? (
                                  <div className="relative w-full h-full flex items-center justify-center">
                                    <div className="flex items-end gap-[2px] h-4 group-hover:opacity-0 transition-opacity">
                                      {[1, 0.6, 0.85, 0.4].map((h, i) => (
                                        <div
                                          key={i}
                                          className="w-[3px] bg-white rounded-full"
                                          style={{
                                            height: `${h * 100}%`,
                                            animation: isPlaying ? `equalizerBar ${0.8 + i * 0.15}s ease-in-out infinite alternate` : 'none',
                                            opacity: isPlaying ? 1 : 0.5,
                                          }}
                                        />
                                      ))}
                                    </div>
                                    <span
                                      className="absolute material-symbols-outlined text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                      style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}
                                    >
                                      {isPlaying ? 'pause' : 'play_arrow'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-body-md text-body-md text-text-primary truncate font-bold">{item.title}</h3>
                            <p className="font-label-md text-label-md text-text-secondary truncate">
                              {item.type === 'Artist' ? 'Artist' : `${item.type} • ${item.artist}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 pr-2" onClick={(e) => e.stopPropagation()}>
                          {item.duration > 0 && (
                            <span className="font-label-md text-label-md text-text-tertiary">{formatTime(item.duration)}</span>
                          )}
                          {item.type !== 'Artist' && item.type !== 'Album' && item.type !== 'Playlist' ? (
                            <button 
                              onClick={(e) => handleOpenTrackMenu(e, item, filteredItems.filter(i => i.type === 'Song'))}
                              className="p-1.5 hover:bg-white/10 rounded-full active:scale-95 duration-100 flex items-center justify-center text-text-secondary"
                            >
                              <span className="material-symbols-outlined text-lg opacity-0 group-hover:opacity-100 transition-opacity">more_vert</span>
                            </button>
                          ) : (
                            <span className="w-8"></span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ) : activeTab === 'profile' ? (
              /* PROFILE VIEW */
              <section className="max-w-4xl mx-auto w-full profile-hero-gradient rounded-3xl" style={{ minHeight: '80vh' }}>
                {/* Hero Section */}
                <div className="relative w-full h-[260px] rounded-3xl overflow-hidden mb-8 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
                  {/* Ambient blobs */}
                  <div className="absolute -top-10 -right-10 w-72 h-72 bg-red-700/20 blur-[100px] rounded-full pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-72 h-64 bg-blue-800/20 blur-[100px] rounded-full pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-base/90 via-bg-base/30 to-transparent" />

                  {/* Profile info */}
                  <div className="absolute bottom-0 left-0 right-0 px-8 pb-6 flex items-end gap-6">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl bg-gradient-to-br from-red-700 to-blue-900 flex items-center justify-center">
                        <span className="material-symbols-outlined text-5xl text-white/60" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                      </div>
                      <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-bg-base" />
                    </div>

                    {/* Name & bio */}
                    {isEditingProfile ? (
                      <div className="flex-1 flex flex-col gap-2 pb-1">
                        <input
                          className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-lg font-bold backdrop-blur-sm focus:outline-none focus:border-white/40 w-full max-w-xs"
                          value={editNameVal}
                          onChange={e => setEditNameVal(e.target.value)}
                          placeholder="Your name"
                        />
                        <input
                          className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white/70 text-sm backdrop-blur-sm focus:outline-none focus:border-white/40 w-full max-w-xs"
                          value={editUsernameVal}
                          onChange={e => setEditUsernameVal(e.target.value)}
                          placeholder="@username"
                        />
                        <textarea
                          className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white/60 text-sm backdrop-blur-sm focus:outline-none focus:border-white/40 w-full max-w-sm resize-none"
                          rows={2}
                          value={editBioVal}
                          onChange={e => setEditBioVal(e.target.value)}
                          placeholder="A short bio..."
                        />
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={handleSaveProfile}
                            className="bg-white text-black px-5 py-1.5 rounded-full text-sm font-bold hover:bg-secondary-fixed transition-colors active:scale-95 duration-150"
                          >Save</button>
                          <button
                            onClick={() => setIsEditingProfile(false)}
                            className="bg-white/10 text-white px-5 py-1.5 rounded-full text-sm font-bold hover:bg-white/20 transition-colors active:scale-95 duration-150"
                          >Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col gap-1 pb-2">
                        <h1 className="text-2xl font-bold text-white leading-tight">{profileName || "Your Name"}</h1>
                        <p className="text-white/60 text-sm">{profileUsername || "@username"}</p>
                        <p className="text-white/50 text-sm max-w-md line-clamp-2">{profileBio || "No bio added yet."}</p>
                      </div>
                    )}

                    {/* Edit button */}
                    {!isEditingProfile && (
                      <div className="flex gap-2 mb-2 flex-shrink-0">
                        <button
                          onClick={handleStartEditProfile}
                          className="flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-full text-sm text-white hover:bg-white/20 transition-all active:scale-95 duration-150 backdrop-blur-sm"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                          Edit profile
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("Are you sure you want to clear your listening history? This will reset all personalized recommendations.")) {
                              historyStore.clear();
                              alert("Listening history has been cleared.");
                            }
                          }}
                          className="flex items-center gap-2 bg-red-600/20 border border-red-500/30 px-4 py-2 rounded-full text-sm text-red-400 hover:bg-red-600/30 transition-all active:scale-95 duration-150 backdrop-blur-sm"
                        >
                          <span className="material-symbols-outlined text-base">delete_sweep</span>
                          Clear History
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: 'Hours listened', value: String(hoursListened), icon: 'headphones', color: 'from-red-700/30 to-red-900/10' },
                    { label: 'Songs liked', value: String(libraryItems.filter(i => i.type === 'Song').length), icon: 'favorite', color: 'from-pink-700/30 to-pink-900/10' },
                    { label: 'Artists followed', value: String(libraryItems.filter(i => i.type === 'Artist').length), icon: 'person', color: 'from-blue-700/30 to-blue-900/10' },
                    { label: 'Playlists', value: String(libraryItems.filter(i => i.type === 'Playlist').length), icon: 'queue_music', color: 'from-purple-700/30 to-purple-900/10' },
                  ].map(stat => (
                    <div key={stat.label} className={`glass rounded-2xl p-5 flex flex-col gap-3 bg-gradient-to-br ${stat.color} achievement-border`}>
                      <div className="flex items-center justify-between">
                        <span className="material-symbols-outlined text-white/40 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <p className="text-xs text-white/50 mt-0.5">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Weekly Activity */}
                <div className="glass rounded-2xl p-6 mb-8">
                  <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-5">Weekly Activity</h2>
                  <div className="flex items-end gap-3 h-28">
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => {
                      const heights = [0, 0, 0, 0, 0, 0, 0];
                      const isToday = i === new Date().getDay() - 1;
                      return (
                        <div key={day} className="flex-1 flex flex-col items-center gap-2">
                          <div
                            className={`w-full rounded-t-lg transition-all duration-500 ${isToday ? 'bg-primary-container' : 'bg-white/10 hover:bg-white/20'}`}
                            style={{ height: `${heights[i]}%` }}
                          />
                          <span className={`text-xs font-medium ${isToday ? 'text-primary-container' : 'text-white/30'}`}>{day}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Achievements */}
                <div className="mb-8">
                  <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Achievements</h2>
                  <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                    {[
                      { icon: 'music_note', label: 'First Song', desc: 'Played your first song', color: '#FF6B6B', unlocked: libraryItems.some(i => i.type === 'Song') },
                      { icon: 'album', label: 'Album Lover', desc: 'Saved 5 albums', color: '#4ECDC4', unlocked: libraryItems.filter(i => i.type === 'Album').length >= 5 },
                      { icon: 'headphones', label: 'Marathon', desc: '100+ hours listened', color: '#45B7D1', unlocked: false },
                      { icon: 'star', label: 'Curator', desc: 'Created first playlist', color: '#FFA07A', unlocked: playlists.length > 0 },
                      { icon: 'diversity_3', label: 'Explorer', desc: 'Discovered 20 artists', color: '#98D8C8', unlocked: libraryItems.filter(i => i.type === 'Artist').length >= 20 },
                    ].map(a => (
                      <div
                        key={a.label}
                        className={`flex-shrink-0 glass rounded-2xl p-4 flex flex-col items-center gap-2 w-32 transition-all duration-200 ${a.unlocked ? 'hover:scale-105' : 'opacity-40 grayscale'} achievement-border`}
                      >
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center mb-1"
                          style={{ background: a.unlocked ? `${a.color}22` : 'rgba(255,255,255,0.05)', border: `1px solid ${a.unlocked ? a.color + '44' : 'rgba(255,255,255,0.1)'}` }}
                        >
                          <span className="material-symbols-outlined text-2xl" style={{ color: a.unlocked ? a.color : '#666', fontVariationSettings: "'FILL' 1" }}>{a.icon}</span>
                        </div>
                        <p className="text-xs font-bold text-white text-center">{a.label}</p>
                        <p className="text-[10px] text-white/40 text-center leading-tight">{a.desc}</p>
                        {!a.unlocked && <span className="material-symbols-outlined text-sm text-white/20">lock</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Artists */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest">Top Artists</h2>
                    <button
                      onClick={() => setActiveTab('explore')}
                      className="text-xs text-white/40 hover:text-white/70 transition-colors"
                    >Explore more →</button>
                  </div>
                  {(() => {
                    const topArtists = Array.from(new Set(libraryItems.map(item => item.artist)))
                      .filter(Boolean)
                      .filter(name => name !== 'Mics')
                      .map(name => {
                        const mock = MOCK_ARTISTS[name.toLowerCase()];
                        return {
                          name,
                          img: mock?.img || null,
                          listeners: mock?.listeners || '0'
                        };
                      });
                    return topArtists.length === 0 ? (
                      <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center">
                        <span className="material-symbols-outlined text-4xl text-white/20">person</span>
                        <p className="text-white/40 text-sm">No top artists yet. Start listening to save artists!</p>
                      </div>
                    ) : (
                      <div className="flex gap-5 overflow-x-auto hide-scrollbar pb-2">
                        {topArtists.slice(0, 5).map((artist, i) => (
                          <div
                            key={artist.name}
                            onClick={() => handleOpenArtist(artist.name)}
                            className="flex-shrink-0 flex flex-col items-center gap-3 w-24 cursor-pointer group"
                          >
                            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-white/30 transition-all duration-200 group-hover:scale-105 bg-gradient-to-br from-red-700/20 to-blue-900/20 flex items-center justify-center">
                              {artist.img ? (
                                <img src={artist.img} alt={artist.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="material-symbols-outlined text-3xl text-white/40">person</span>
                              )}
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                              </div>
                            </div>
                            <div className="text-center w-full">
                              <p className="text-xs font-bold text-white line-clamp-1">{artist.name}</p>
                              {artist.listeners !== '0' && (
                                <p className="text-[10px] text-white/40">{artist.listeners} listeners</p>
                              )}
                            </div>
                            {i === 0 && <span className="text-[9px] bg-primary-container/30 text-primary-container border border-primary-container/30 rounded-full px-2 py-0.5 font-bold">#1</span>}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Top Albums */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest">Saved Albums</h2>
                  </div>
                  {libraryItems.filter(i => i.type === 'Album' || i.type === 'Playlist').length === 0 ? (
                    <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center">
                      <span className="material-symbols-outlined text-4xl text-white/20">album</span>
                      <p className="text-white/40 text-sm">No saved albums yet</p>
                      <button
                        onClick={() => setActiveTab('explore')}
                        className="text-xs bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 rounded-full text-white transition-all active:scale-95 duration-150"
                      >
                        Explore albums
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {libraryItems.filter(i => i.type === 'Album' || i.type === 'Playlist').slice(0, 8).map((item, idx) => (
                        <div
                          key={item.id || idx}
                          onClick={() => handleOpenAlbum(item)}
                          className="group cursor-pointer glass rounded-2xl p-3 hover:bg-white/5 transition-all duration-200 hover:scale-[1.02] achievement-border"
                        >
                          <div className="aspect-square w-full rounded-xl overflow-hidden mb-3 relative">
                            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                            </div>
                          </div>
                          <h3 className="text-xs font-bold text-white line-clamp-1">{item.title}</h3>
                          <p className="text-[10px] text-white/40 line-clamp-1">{item.artist}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            ) : (
              /* HOME VIEW: API-driven sections list */
              <>
                {/* Skeleton loader — shows while API data is still loading */}
                {loading && sections.length === 0 && quickPicks.length === 0 && (
                  <div className="px-gutter pt-8 pb-12 flex flex-col gap-10 animate-pulse">
                    {/* Speed Dial skeleton */}
                    <div>
                      <div className="h-6 w-40 bg-white/5 rounded-lg mb-2" />
                      <div className="h-4 w-64 bg-white/5 rounded mb-5" />
                      <div className="flex gap-4">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="w-[160px] h-[160px] rounded-xl bg-white/5 flex-shrink-0" />
                        ))}
                      </div>
                    </div>
                    {/* Quick Picks skeleton */}
                    <div>
                      <div className="h-4 w-32 bg-white/5 rounded mb-1" />
                      <div className="h-7 w-44 bg-white/5 rounded mb-5" />
                      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-x-8 gap-y-2">
                        {[1,2,3,4,5,6].map(i => (
                          <div key={i} className="flex items-center gap-4 p-2">
                            <div className="w-16 h-16 rounded-lg bg-white/5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="h-4 w-3/4 bg-white/5 rounded mb-2" />
                              <div className="h-3 w-1/2 bg-white/5 rounded" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Mixed For You skeleton */}
                    <div>
                      <div className="h-4 w-48 bg-white/5 rounded mb-1" />
                      <div className="h-7 w-40 bg-white/5 rounded mb-5" />
                      <div className="flex gap-6">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="flex-shrink-0" style={{width:180}}>
                            <div className="w-[180px] h-[180px] rounded-xl bg-white/5 mb-3" />
                            <div className="h-4 w-3/4 bg-white/5 rounded mb-1" />
                            <div className="h-3 w-1/2 bg-white/5 rounded" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {/* Speed Dial Section */}
                <div className="speed-dial-section px-gutter pt-8 pb-4 animate-fade-in">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-[20px] font-bold text-white">Speed Dial</h2>
                      <p className="text-text-secondary text-sm">Your most-played, always one tap away</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {isEditingSpeedDial ? (
                        <div className="flex items-center gap-4">
                          <button onClick={handleSaveSpeedDial} className="text-primary-container hover:opacity-80 transition-opacity font-bold">Done</button>
                          <button onClick={handleCancelSpeedDial} className="text-text-secondary hover:text-text-primary transition-colors">Cancel</button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setIsEditingSpeedDial(true)}
                          className="p-2 hover:bg-surface-container-high rounded-full transition-colors active:scale-95 duration-100 flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-text-primary">edit</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className={`flex gap-4 overflow-x-auto hide-scrollbar pb-4 group/row ${isEditingSpeedDial ? 'wobble-mode' : ''}`}>
                    {(isEditingSpeedDial ? speedDialDraft : speedDialItems).map((track) => (
                      <motion.div 
                        key={track.id} 
                        onClick={() => {
                          if (!isEditingSpeedDial) {
                            handlePlayTrack(track, speedDialItems, 'speed_dial');
                          }
                        }}
                        variants={speedDialTileVariants}
                        initial="rest"
                        whileHover="hover"
                        whileTap="tap"
                        animate={isEditingSpeedDial ? "editMode" : (currentTrack?.id === track.id && isPlaying ? "playing" : "rest")}
                        className="speed-dial-tile flex-shrink-0 w-[160px] h-[160px] rounded-xl overflow-hidden relative group cursor-pointer bg-surface-container-high"
                      >
                        <img 
                          className="w-full h-full object-cover select-none pointer-events-none" 
                          src={track.thumbnail} 
                          alt={track.title}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
                        
                        {!isEditingSpeedDial && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="w-[52px] h-[52px] bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                              <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="absolute bottom-3 left-3 right-3 truncate select-none pointer-events-none">
                          <p className="text-[13px] font-bold text-white leading-tight truncate">{track.title}</p>
                          <p className="text-[11px] text-text-secondary truncate">{track.artist}</p>
                        </div>

                        {isEditingSpeedDial ? (
                          <motion.button 
                            variants={speedDialRemoveButtonVariants}
                            initial="hidden"
                            animate="visible"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSpeedDialItem(track.id);
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 rounded-full transition-colors z-20 flex items-center justify-center active:scale-95 duration-100"
                          >
                            <span className="material-symbols-outlined text-white text-sm">close</span>
                          </motion.button>
                        ) : (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLike(track);
                            }}
                            className={`absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center active:scale-95 duration-100 ${
                              libraryItems.some(i => i.id === track.id) ? 'text-primary-container opacity-100' : 'text-white'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: libraryItems.some(i => i.id === track.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                          </button>
                        )}
                      </motion.div>
                    ))}
                    
                  </div>
                </div>

                {/* Mood Mix Section */}
                {false && (
                  <section className="px-gutter pt-4">
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <p className="text-text-tertiary text-label-md uppercase tracking-widest font-bold">Personalized Mood Mix</p>
                        <h2 className="font-headline-lg text-headline-lg">{activeChip} Mix</h2>
                      </div>
                      <button 
                        onClick={() => {
                          const key = activeChip.toLowerCase() === 'moods' ? 'moody' : (activeChip.toLowerCase() === 'podcasts' ? 'podcast' : activeChip.toLowerCase());
                          const mix = getMoodMatch(key);
                          if (mix.length > 0) handlePlayTrack(mix[0], mix, 'home_mood');
                        }}
                        className="border border-outline-variant hover:bg-surface-container-high transition-colors text-label-md font-bold px-4 py-1.5 rounded-full active:scale-95 duration-100"
                      >
                        Play Mix
                      </button>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-x-8 gap-y-2">
                      {(() => {
                        const key = activeChip.toLowerCase() === 'moods' ? 'moody' : (activeChip.toLowerCase() === 'podcasts' ? 'podcast' : activeChip.toLowerCase());
                        const mix = getMoodMatch(key);
                        if (mix.length === 0) {
                          return <p className="text-text-secondary text-body-md col-span-3 py-4">Listen to more songs to unlock this mood mix!</p>;
                        }
                        return mix.slice(0, 6).map((track) => (
                          <motion.div 
                            key={track.id}
                            onClick={() => handlePlayTrack(track, mix, 'home_mood')}
                            variants={cardVariants}
                            initial="rest"
                            whileHover="hover"
                            whileTap="tap"
                            className={`flex items-center gap-4 p-2 rounded-xl transition-colors group cursor-pointer ${
                              currentTrack?.id === track.id ? 'bg-surface-container-highest' : 'hover:bg-surface-container-highest'
                            }`}
                          >
                            <div className="relative rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-high" style={{width:64,height:64}}>
                              <img alt={track.title} className="w-full h-full object-cover" src={track.thumbnail} />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-body-lg text-body-lg truncate text-text-primary font-bold">{track.title}</p>
                              <p className="font-body-md text-body-md truncate text-text-secondary">{track.artist}</p>
                            </div>
                          </motion.div>
                        ));
                      })()}
                    </div>
                  </section>
                )}

                {/* Quick Picks Section */}
                <section className="px-gutter pt-4">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-text-tertiary text-label-md uppercase tracking-widest font-bold">Start Radio from a song</p>
                      <h2 className="font-headline-lg text-headline-lg">Quick Picks</h2>
                    </div>
                    <button 
                      onClick={() => {
                        const items = quickPicks.length > 0 ? quickPicks : (sections.find(s => s.title.toLowerCase().includes('quick'))?.contents || []);
                        if (items.length > 0) handlePlayTrack(items[0], items, 'home_quick_picks');
                      }}
                      className="border border-outline-variant hover:bg-surface-container-high transition-colors text-label-md font-bold px-4 py-1.5 rounded-full active:scale-95 duration-150"
                    >
                      Play all
                    </button>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-x-8 gap-y-2">
                    {(() => {
                      const items = quickPicks.length > 0 ? quickPicks : (sections.find(s => s.title.toLowerCase().includes('quick'))?.contents || []);
                      return items.slice(0, 6).map((track) => (
                        <motion.div 
                          key={track.id}
                          onClick={() => handlePlayTrack(track, items, 'home_quick_picks')}
                          variants={cardVariants}
                          initial="rest"
                          whileHover="hover"
                          whileTap="tap"
                          className={`flex items-center gap-4 p-2 rounded-xl transition-colors group cursor-pointer ${
                            currentTrack?.id === track.id ? 'bg-surface-container-highest' : 'hover:bg-surface-container-highest'
                          }`}
                        >
                          <div className="relative rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-high" style={{width:64,height:64}}>
                            <img alt={track.title} className="w-full h-full object-cover" src={track.thumbnail} />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-body-lg text-body-lg truncate text-text-primary font-bold">{track.title}</p>
                            <p 
                              className="font-body-md text-body-md truncate text-text-secondary hover:underline cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenArtist(track.artist);
                              }}
                            >
                              {track.artist}
                            </p>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
                            <button 
                              className={`p-2 rounded-full active:scale-95 duration-150 ${
                                libraryItems.some(i => i.id === track.id) ? 'text-primary-container' : 'text-text-secondary hover:bg-white/10'
                              }`}
                              onClick={() => handleToggleLike(track)}
                            >
                              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: libraryItems.some(i => i.id === track.id) ? "'FILL' 1" : "'FILL' 0" }}>
                                favorite
                              </span>
                            </button>
                            <button 
                              onClick={(e) => handleOpenTrackMenu(e, track, items)}
                              className="p-2 hover:bg-white/10 rounded-full active:scale-95 duration-150"
                            >
                              <span className="material-symbols-outlined text-text-secondary">more_vert</span>
                            </button>
                          </div>
                        </motion.div>
                      ));
                    })()}
                  </div>
                </section>

                {/* Listen Again Section */}
                <ListenAgainSection 
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  onPlayTrack={(track, queue) => handlePlayTrack(track, queue, 'home_listen_again')}
                  onPlayAll={(queue) => {
                    if (queue.length > 0) {
                      handlePlayTrack(queue[0], queue, 'home_listen_again');
                    }
                  }}
                  profileName={profileName}
                />

                {/* Mixed For You Section */}
                <section className="px-gutter">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <p className="text-text-tertiary text-label-md uppercase tracking-widest font-bold">Curated for your taste</p>
                      <h2 className="font-headline-lg text-headline-lg">Mixed For You</h2>
                    </div>
                  </div>
                  <div className="flex gap-6 overflow-x-auto hide-scrollbar">
                    {mixedForYou.slice(0, 10).map((album, idx) => {
                      const isLiked = libraryItems.some(i => i.id === album.id);
                      return (
                        <motion.div 
                          key={album.id || idx} 
                        onClick={() => handlePlayTrack(album, mixedForYou, 'home_mixed_for_you')}
                          variants={cardVariants}
                          initial="rest"
                          whileHover="hover"
                          whileTap="tap"
                          className="flex-shrink-0 group cursor-pointer" style={{width:180}}
                        >
                          <div className="rounded-xl overflow-hidden mb-3 relative bg-surface-container-high" style={{width:180,height:180}}>
                            <img alt={album.title} className="w-full h-full object-cover" src={album.thumbnail} />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-lg">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                              </div>
                            </div>
                          </div>
                          <h4 className="font-body-md text-body-md text-text-primary line-clamp-1">{album.title}</h4>
                          <p 
                            className="font-label-md text-label-md text-text-tertiary hover:underline cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenArtist(album.artist);
                            }}
                          >
                            {album.artist}
                          </p>
                        </motion.div>
                      );
                    })}
                    {mixedForYou.length === 0 && (
                      <div className="w-full h-[180px] bg-surface-container-low rounded-xl flex items-center justify-center">
                        <p className="text-text-secondary">Start playing tracks to get personalized mixes!</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Discovery Section */}
                <section className="px-gutter">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <p className="text-text-tertiary text-label-md uppercase tracking-widest font-bold">New sounds and fresh releases</p>
                      <h2 className="font-headline-lg text-headline-lg">Discovery</h2>
                    </div>
                  </div>
                  <div className="flex gap-6 overflow-x-auto hide-scrollbar">
                    {(() => {
                      const items = discoveryPicks.length > 0 ? discoveryPicks : newReleases;
                      return items.slice(0, 10).map((album, idx) => (
                        <motion.div 
                          key={album.id || idx} 
                          onClick={() => {
                            if (album.type === 'ALBUM' || album.type === 'PLAYLIST' || album.playlistId) {
                              handleOpenAlbum({
                                id: album.id || album.playlistId,
                                title: album.title,
                                artist: album.artist,
                                thumbnail: album.thumbnail,
                                type: album.playlistId ? 'Playlist' : 'Album',
                                year: '2024'
                              });
                            } else {
                              const songItems = items.filter(i => i.type !== 'ALBUM' && i.type !== 'PLAYLIST' && !i.playlistId);
                              handlePlayTrack(album, songItems, 'home_new_releases');
                            }
                          }}
                          variants={cardVariants}
                          initial="rest"
                          whileHover="hover"
                          whileTap="tap"
                          className="flex-shrink-0 group cursor-pointer" style={{width:180}}
                        >
                          <div className="rounded-xl overflow-hidden mb-3 relative bg-surface-container-high" style={{width:180,height:180}}>
                            <img alt={album.title} className="w-full h-full object-cover" src={album.thumbnail} />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-lg">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                              </div>
                            </div>
                          </div>
                          <h4 className="font-body-md text-body-md text-text-primary line-clamp-1">{album.title}</h4>
                          <p 
                            className="font-label-md text-label-md text-text-tertiary hover:underline cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenArtist(album.artist);
                            }}
                          >
                            {album.artist}
                          </p>
                        </motion.div>
                      ));
                    })()}
                  </div>
                </section>

                {/* Curated Mixed For You Banner */}
                <section className="px-gutter">
                  <div 
                    onClick={() => {
                      if (mixedForYou.length > 0) {
                        handlePlayTrack(mixedForYou[0], mixedForYou, 'home_mixed_for_you');
                      } else {
                        const allSongs = sections.flatMap(s => s.contents || []);
                        const allSongTracks = allSongs.filter(s => s.type !== 'ALBUM' && s.type !== 'PLAYLIST' && !s.playlistId);
                        if (allSongTracks.length > 0) handlePlayTrack(allSongTracks[0], allSongTracks, 'home_feed');
                      }
                    }}
                    className="w-full h-[240px] rounded-2xl relative overflow-hidden group cursor-pointer bg-gradient-to-br from-primary-container/40 to-tertiary-container/20 border border-white/5 transition-all duration-300 hover:border-white/10"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-base/80 to-transparent"></div>
                    <div className="absolute inset-0 p-8 flex flex-col justify-end gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black group-hover:scale-105 transition-transform duration-200">
                          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                            play_arrow
                          </span>
                        </div>
                        <h3 className="font-display-lg text-display-lg leading-tight">Mixed for you</h3>
                      </div>
                      <p className="text-body-lg text-text-secondary max-w-xl">
                        A personalized selection of tracks based on your recent listening, curated daily just for you.
                      </p>
                    </div>
                    {/* Abstract Background Decoration */}
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary-container/30 blur-[100px] rounded-full"></div>
                    <div className="absolute right-40 top-10 w-60 h-60 bg-tertiary/20 blur-[80px] rounded-full"></div>
                  </div>
                </section>
              </>
            )}
            </div>
        </motion.main>
        )}
        </AnimatePresence>
      </div>

      {/* Bottom Player Bar */}
      {!isPlayerExpanded && (
        <footer className="fixed bottom-0 left-0 w-full z-50 bg-bg-player backdrop-blur-md bg-opacity-80 h-player-height border-t border-white/5 flex flex-col items-center">
        {/* Progress Bar at top of container */}
        <div 
          onClick={handleProgressBarClick}
          className="absolute top-0 left-0 w-full h-[3px] bg-white/10 hover:h-[5px] group cursor-pointer overflow-hidden transition-all"
        >
          <div 
            className="h-full bg-primary-container transition-all relative"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary-container rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150"></div>
          </div>
        </div>
        
        <div className="flex justify-between items-center px-gutter w-full h-full">
          {/* Left: Song Info */}
          <div className="flex items-center gap-4 w-1/3 min-w-0">
            <motion.div 
              layoutId="now-playing-artwork"
              onClick={() => setIsPlayerExpanded(true)}
              className="rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-high cursor-pointer hover:scale-105 transition-transform" style={{width:56,height:56}}
            >
              <img 
                alt="Playing album art" 
                className="w-full h-full object-cover" 
                src={currentTrack ? currentTrack.thumbnail : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=640&h=640&fit=crop&q=80'}
              />
            </motion.div>
            <div 
              onClick={() => setIsPlayerExpanded(true)}
              className="min-w-0 cursor-pointer group/title"
            >
              <div className="font-body-md text-text-primary font-bold truncate group-hover/title:underline flex items-center gap-2">
                <span className="truncate">{currentTrack ? currentTrack.title : 'No track selected'}</span>
                {isRestored && (
                  <span 
                    className="flex items-center shrink-0 select-none font-medium"
                    style={{
                      height: '18px',
                      padding: '0 8px',
                      borderRadius: '9999px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      fontSize: '11px',
                      color: '#aaaaaa',
                      lineHeight: '16px'
                    }}
                  >
                    Resume
                  </span>
                )}
              </div>
              <div className="font-label-md text-text-secondary truncate">
                {currentTrack ? `${currentTrack.artist} • ${formatTime(currentTime)} / ${formatTime(duration)}` : 'Select a track to listen'}
              </div>
            </div>
            {currentTrack && (
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <button className="material-symbols-outlined icon-btn icon-btn-sm text-text-secondary hover:text-text-primary">thumb_down</button>
                <div className="relative flex items-center justify-center">
                  <motion.button 
                    variants={likeButtonVariants}
                    animate={isCurrentTrackLiked ? "liked" : "unliked"}
                    onClick={() => {
                      if (!isCurrentTrackLiked) {
                        setCollapsedBurstKey(prev => prev + 1);
                      }
                      handleToggleLike(currentTrack);
                    }}
                    className="material-symbols-outlined icon-btn icon-btn-sm active:scale-95 flex items-center justify-center"
                    style={{ 
                      fontVariationSettings: isCurrentTrackLiked ? "'FILL' 1" : "'FILL' 0",
                      color: isCurrentTrackLiked ? "#ff5540" : "#aaaaaa"
                    }}
                  >
                    favorite
                  </motion.button>
                  {isCurrentTrackLiked && (
                    <div key={collapsedBurstKey} className="absolute pointer-events-none flex items-center justify-center">
                      {[...Array(6)].map((_, i) => {
                        const angle = (i * 60 * Math.PI) / 180;
                        return (
                          <motion.div
                            key={i}
                            variants={likeParticleVariants(angle)}
                            initial="initial"
                            animate="burst"
                            className="absolute w-1.5 h-1.5 rounded-full bg-[#ff5540]"
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
                <button 
                  onClick={(e) => handleOpenTrackMenu(e, currentTrack, currentTrack ? [currentTrack, ...upNextQueue] : null)}
                  className="material-symbols-outlined icon-btn icon-btn-sm text-text-secondary hover:text-text-primary"
                >
                  more_vert
                </button>
              </div>
            )}
          </div>
          
          {/* Center: Controls */}
          <div className="flex items-center gap-8 justify-center w-1/3">
            <button 
              onClick={handleToggleShuffle}
              className={`material-symbols-outlined icon-btn icon-btn-sm transition-colors duration-150 ${
                isShuffle ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              shuffle
            </button>
            <button 
              onClick={handlePrevTrack}
              className="material-symbols-outlined icon-btn icon-btn-md text-text-primary"
            >
              skip_previous
            </button>
            
            <button 
              onClick={handlePlayPauseClick}
              disabled={!currentTrack}
              className={`w-10 h-10 bg-text-primary rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-md ${
                !currentTrack ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <span
                className={`material-symbols-outlined select-none ${isBuffering ? 'animate-spin' : ''}`}
                style={{ fontSize: 22, color: '#000', fontVariationSettings: "'FILL' 1" }}
              >
                {isBuffering ? 'autorenew' : isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>
            
            <button 
              onClick={handleNextTrack}
              className="material-symbols-outlined icon-btn icon-btn-md text-text-primary"
            >
              skip_next
            </button>
            <button 
              onClick={handleToggleRepeat}
              className={`material-symbols-outlined icon-btn icon-btn-sm transition-colors duration-150 ${
                repeatMode !== 'off' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {repeatMode === 'one' ? 'repeat_one' : 'repeat'}
            </button>
          </div>
          
          {/* Right: Secondary Controls */}
          <div className="flex items-center gap-4 justify-end w-1/3">
            <div className="flex items-center gap-2 group cursor-pointer">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="material-symbols-outlined icon-btn icon-btn-sm text-text-secondary group-hover:text-text-primary"
              >
                {isMuted || volume === 0 ? 'volume_off' : volume < 40 ? 'volume_down' : 'volume_up'}
              </button>
              <div 
                className="w-24 h-1 bg-white/20 rounded-full relative overflow-hidden"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const val = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                  setVolume(Math.min(100, Math.max(0, val)));
                  setIsMuted(false);
                }}
              >
                <div 
                  className="absolute inset-0 bg-text-primary transition-colors"
                  style={{ width: `${isMuted ? 0 : volume}%` }}
                ></div>
              </div>
            </div>
            <button 
              onClick={() => setIsPlayerExpanded(true)}
              className="material-symbols-outlined icon-btn icon-btn-sm text-text-secondary hover:text-text-primary"
            >
              expand_less
            </button>
          </div>
        </div>
      </footer>
      )}

      {/* BottomNavBar Shell (Mobile) */}
      {!isPlayerExpanded && (
        <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-between items-center px-gutter bg-bg-player backdrop-blur-md bg-opacity-60 h-player-height border-t border-white/5 shadow-2xl">
        <button 
          onClick={() => {
            setActiveTab('home');
            setIsSearching(false);
            setSearchQuery('');
            setSearchResults([]);
            setActiveArtist(null);
            setActiveAlbum(null);
            setIsPlayerExpanded(false);
          }}
          className={`flex flex-col items-center justify-center gap-1 w-full ${
            activeTab === 'home' && !isSearching && !activeArtist && !activeAlbum ? 'text-text-primary font-bold scale-105' : 'text-text-secondary'
          }`}
        >
          <span className="material-symbols-outlined" style={activeTab === 'home' && !isSearching && !activeArtist && !activeAlbum ? { fontVariationSettings: "'FILL' 1" } : {}}>home</span>
          <span className="font-label-md text-label-md">Home</span>
        </button>
        
        <button 
          onClick={() => {
            setActiveTab('explore');
            setIsSearching(false);
            setSearchQuery('');
            setSearchResults([]);
            setActiveArtist(null);
            setActiveAlbum(null);
            setIsPlayerExpanded(false);
          }}
          className={`flex flex-col items-center justify-center gap-1 w-full ${
            activeTab === 'explore' && !isSearching && !activeArtist && !activeAlbum ? 'text-text-primary font-bold scale-105' : 'text-text-secondary'
          }`}
        >
          <span className="material-symbols-outlined" style={activeTab === 'explore' && !isSearching && !activeArtist && !activeAlbum ? { fontVariationSettings: "'FILL' 1" } : {}}>explore</span>
          <span className="font-label-md text-label-md">Explore</span>
        </button>
        
        <button 
          onClick={() => {
            setActiveTab('profile');
            setIsSearching(false);
            setSearchQuery('');
            setSearchResults([]);
            setActiveArtist(null);
            setActiveAlbum(null);
            setIsPlayerExpanded(false);
          }}
          className={`flex flex-col items-center justify-center gap-1 w-full ${
            activeTab === 'profile' && !isSearching && !activeArtist && !activeAlbum ? 'text-text-primary font-bold scale-105' : 'text-text-secondary'
          }`}
        >
          <span className="material-symbols-outlined" style={activeTab === 'profile' && !isSearching && !activeArtist && !activeAlbum ? { fontVariationSettings: "'FILL' 1" } : {}}>person</span>
          <span className="font-label-md text-label-md">Profile</span>
        </button>

        <button 
          onClick={() => {
            setActiveTab('library');
            setIsSearching(false);
            setSearchQuery('');
            setSearchResults([]);
            setActiveArtist(null);
            setActiveAlbum(null);
            setIsPlayerExpanded(false);
          }}
          className={`flex flex-col items-center justify-center gap-1 w-full ${
            activeTab === 'library' && !isSearching && !activeArtist && !activeAlbum ? 'text-text-primary font-bold scale-105' : 'text-text-secondary'
          }`}
        >
          <span className="material-symbols-outlined" style={activeTab === 'library' && !isSearching && !activeArtist && !activeAlbum ? { fontVariationSettings: "'FILL' 1" } : {}}>library_music</span>
          <span className="font-label-md text-label-md">Library</span>
        </button>
      </nav>
      )}

      {/* Global Track Context Menu */}
      <AnimatePresence>
        {trackMenu && (
          <div 
            className="fixed inset-0 z-[100]" 
            onClick={() => setTrackMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setTrackMenu(null); }}
          >
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={contextMenuVariants}
              style={{ top: trackMenu.y, left: trackMenu.x }}
              className="fixed bg-[#161616] border border-white/10 rounded-xl p-1.5 shadow-2xl min-w-[210px] z-[101] backdrop-blur-md bg-opacity-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-2 border-b border-white/5 mb-1 max-w-[210px]">
                <p className="text-xs font-semibold text-white truncate">{trackMenu.track.title}</p>
                <p className="text-[10px] text-text-secondary truncate">{trackMenu.track.artist}</p>
              </div>
              
              <button 
                onClick={() => {
                  handlePlayTrack(trackMenu.track, trackMenu.contextQueue, trackMenu.contextQueue ? 'queue' : 'unknown');
                  setTrackMenu(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-primary hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                <span>Play Now</span>
              </button>

              <button 
                onClick={() => {
                  handleTogglePinSpeedDial(trackMenu.track);
                  setTrackMenu(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-primary hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {speedDialItems.some(item => item.id === trackMenu.track.id) ? 'do_not_disturb_on' : 'push_pin'}
                </span>
                <span>
                  {speedDialItems.some(item => item.id === trackMenu.track.id) ? 'Unpin from Speed Dial' : 'Pin to Speed Dial'}
                </span>
              </button>

              <button 
                onClick={() => {
                  handleToggleLike(trackMenu.track);
                  setTrackMenu(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-primary hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: libraryItems.some(item => item.id === trackMenu.track.id) ? "'FILL' 1" : "'FILL' 0", color: libraryItems.some(item => item.id === trackMenu.track.id) ? '#ff5540' : 'inherit' }}>
                  favorite
                </span>
                <span>
                  {libraryItems.some(item => item.id === trackMenu.track.id) ? 'Remove from Library' : 'Add to Library'}
                </span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Create Playlist Modal ─── */}
      <AnimatePresence>
        {showPlaylistModal && (
          <motion.div
            key="playlist-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setShowPlaylistModal(false)}
            />
            {/* Ambient glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[120px] opacity-30" style={{ backgroundColor: 'rgba(255, 85, 64, 0.2)' }} />
              <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] rounded-full blur-[100px] opacity-20" style={{ backgroundColor: 'rgba(72, 143, 255, 0.1)' }} />
            </div>

            {/* Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative bg-surface-container/90 backdrop-blur-xl border border-white/10 rounded-[24px] w-full max-w-[700px] max-h-[90vh] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Top section: cover + name/desc */}
              <div className="p-8 pb-4 flex gap-8">
                {/* Cover placeholder */}
                <div className="w-[170px] h-[170px] rounded-xl bg-gradient-to-br from-surface-container-highest to-surface-variant flex-shrink-0 relative group overflow-hidden cursor-pointer">
                  {playlistAddedSongs[0] ? (
                    <img src={playlistAddedSongs[0].thumbnail} alt="cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-text-secondary">
                      <span className="material-symbols-outlined text-5xl mb-2">music_note</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-white mb-1">add_a_photo</span>
                    <span className="text-label-md text-white font-medium">Add Cover</span>
                  </div>
                </div>

                {/* Name + desc */}
                <div className="flex-1 flex flex-col gap-4">
                  <input
                    autoFocus
                    type="text"
                    value={newPlaylistName}
                    onChange={e => setNewPlaylistName(e.target.value)}
                    placeholder="My Playlist"
                    className="bg-transparent border-none p-0 text-[28px] font-bold text-text-primary placeholder-text-tertiary focus:ring-0 w-full outline-none"
                  />
                  <textarea
                    value={newPlaylistDesc}
                    onChange={e => setNewPlaylistDesc(e.target.value)}
                    placeholder="Describe your vibe..."
                    rows={3}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 text-body-md text-text-primary placeholder-text-secondary focus:bg-white/10 focus:border-white/20 focus:ring-0 transition-all resize-none outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 bg-surface-variant/50 hover:bg-surface-variant px-4 py-2 rounded-full border border-white/5 transition-colors text-label-md text-text-primary">
                      <span className="material-symbols-outlined text-sm">public</span>
                      Public
                      <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Song search + suggestions */}
              <div className="px-8 pb-4 flex flex-col gap-4 overflow-hidden flex-1">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">search</span>
                  <input
                    type="text"
                    value={playlistSongSearch}
                    onChange={e => setPlaylistSongSearch(e.target.value)}
                    placeholder="Add songs"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-body-md text-text-primary placeholder-text-secondary focus:bg-white/10 focus:ring-0 transition-all outline-none"
                  />
                </div>

                <div className="flex-1 overflow-y-auto pr-1" style={{ maxHeight: 220 }}>
                  {/* Added songs */}
                  {playlistAddedSongs.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-label-md font-bold text-text-tertiary uppercase tracking-wider mb-2">Added</h4>
                      <div className="space-y-1">
                        {playlistAddedSongs.map(track => (
                          <div key={track.id} className="flex items-center gap-4 p-2 rounded-xl bg-white/5">
                            <img src={track.thumbnail} alt={track.title} className="w-10 h-10 rounded-lg object-cover" />
                            <div className="flex-1 min-w-0">
                              <p className="text-body-md font-medium text-text-primary truncate">{track.title}</p>
                              <p className="text-label-md text-text-secondary truncate">{track.artist}</p>
                            </div>
                            <button
                              onClick={() => setPlaylistAddedSongs(prev => prev.filter(t => t.id !== track.id))}
                              className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                            >
                              <span className="material-symbols-outlined text-text-secondary text-sm">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions from library or current queue */}
                  <h4 className="text-label-md font-bold text-text-tertiary uppercase tracking-wider mb-2">Suggested for you</h4>
                  <div className="space-y-1">
                    {libraryItems
                      .filter(i => i && i.type === 'Song')
                      .filter(i => !playlistAddedSongs.some(a => a && a.id === i.id))
                      .filter(i => {
                        if (!playlistSongSearch) return true;
                        const titleMatch = i.title && typeof i.title === 'string' && i.title.toLowerCase().includes(playlistSongSearch.toLowerCase());
                        const artistMatch = i.artist && typeof i.artist === 'string' && i.artist.toLowerCase().includes(playlistSongSearch.toLowerCase());
                        return titleMatch || artistMatch;
                      })
                      .slice(0, 8)
                      .map(track => (
                        <div key={track.id} className="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 transition-all group">
                          <img src={track.thumbnail} alt={track.title} className="w-10 h-10 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="text-body-md font-medium text-text-primary truncate">{track.title}</p>
                            <p className="text-label-md text-text-secondary truncate">{track.artist}</p>
                          </div>
                          <button
                            onClick={() => setPlaylistAddedSongs(prev => [...prev, track])}
                            className="px-4 py-1.5 rounded-full border border-white/10 hover:border-white/30 text-label-md transition-all text-text-primary whitespace-nowrap"
                          >
                            Add
                          </button>
                        </div>
                      ))
                    }
                    {libraryItems.filter(i => i && i.type === 'Song').length === 0 && (
                      <p className="text-label-md text-text-secondary py-4 text-center">Like some songs first to add them here!</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="p-6 border-t border-white/5 flex justify-end gap-4">
                <button
                  onClick={() => setShowPlaylistModal(false)}
                  className="px-6 py-2.5 rounded-full text-label-lg font-medium text-text-primary hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCreatePlaylist}
                  className="px-8 py-2.5 rounded-full bg-text-primary text-bg-base text-label-lg font-bold hover:opacity-90 transition-all active:scale-95 duration-150"
                >
                  Create Playlist
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            variants={toastVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed bottom-24 left-6 z-[300] bg-[#1f1f1f] border border-white/10 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3"
          >
            <span className="material-symbols-outlined text-[#ff5540]">error</span>
            <span className="text-body-md font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App({ initialPlayerState }) {
  return (
    <>
      <YourApp initialPlayerState={initialPlayerState} />
      {process.env.NODE_ENV === "development" && <Agentation />}
    </>
  );
}
