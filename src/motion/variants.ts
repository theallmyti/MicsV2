/**
 * @file variants.ts
 * @description Framer Motion Variant Registry for the Mics music platform.
 * Imports timing and ease parameters from timing tokens to deliver consistent micro-animations.
 */

import { Duration, Ease, motionSafe } from "./tokens.ts";

// VARIANT SET 1 — Page / Route Transitions
export const pageVariants = {
  initial: motionSafe({ opacity: 0, y: 12 }),
  animate: motionSafe({ opacity: 1, y: 0, transition: { duration: Duration.base / 1000, ease: Ease.enter } }),
  exit: motionSafe({ opacity: 0, y: -8, transition: { duration: Duration.fast / 1000, ease: Ease.exit } }),
};

// VARIANT SET 2 — Card Hover (Album / Playlist / Quick Pick cards)
export const cardVariants = {
  rest: { scale: 1, boxShadow: "0 0px 0px rgba(0,0,0,0)" },
  hover: motionSafe({ 
    scale: 1.03, 
    boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
    transition: { duration: Duration.fast / 1000, ease: Ease.enter } 
  }),
  tap: motionSafe({ scale: 0.97, transition: { duration: Duration.instant / 1000 } }),
};

export const cardPlayButtonVariants = {
  rest: { opacity: 0, scale: 0.8 },
  hover: motionSafe({ opacity: 1, scale: 1.0, transition: { duration: Duration.fast / 1000, ease: Ease.enter } }),
};

export const cardArtworkOverlayVariants = {
  rest: { opacity: 0 },
  hover: motionSafe({ opacity: 1, transition: { duration: Duration.fast / 1000 } }),
};

// VARIANT SET 3 — Speed Dial Tile
export const speedDialTileVariants = {
  rest: { scale: 1, rotate: 0 },
  hover: motionSafe({ scale: 1.05, transition: Ease.springSnappy }),
  tap: motionSafe({ scale: 0.95, transition: { duration: Duration.instant / 1000 } }),
  playing: motionSafe({ scale: 1 }),
  editMode: motionSafe({ 
    rotate: ["-0.5deg", "0.5deg"],
    transition: { rotate: { duration: 0.28, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" } } 
  }),
};

export const speedDialRemoveButtonVariants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: motionSafe({ opacity: 1, scale: 1.0, transition: Ease.spring }),
};

export const speedDialTileExitVariants = {
  exit: motionSafe({ opacity: 0, scale: 0.7, transition: { duration: Duration.fast / 1000, ease: Ease.exit } }),
};

// VARIANT SET 4 — Player Bar
export const playerBarVariants = {
  hidden: { y: 72, opacity: 0 },
  visible: motionSafe({ y: 0, opacity: 1, transition: { duration: Duration.slow / 1000, ease: Ease.enter } }),
};

export const trackInfoVariants = {
  initial: { opacity: 0, x: 16 },
  animate: motionSafe({ opacity: 1, x: 0, transition: { duration: Duration.base / 1000, ease: Ease.enter } }),
  exit: motionSafe({ opacity: 0, x: -16, transition: { duration: Duration.fast / 1000, ease: Ease.exit } }),
};

export const artworkVariants = {
  initial: { opacity: 0, scale: 0.88, rotate: -3 },
  animate: motionSafe({ 
    opacity: 1, 
    scale: 1.0, 
    rotate: 0,
    transition: { duration: Duration.base / 1000, ease: Ease.enter } 
  }),
  exit: motionSafe({ opacity: 0, scale: 1.05, rotate: 3, transition: { duration: Duration.fast / 1000, ease: Ease.exit } }),
};

// VARIANT SET 5 — Play / Pause Button Morph
export const playPauseIconVariants = {
  play: motionSafe({ pathLength: 1, opacity: 1, transition: { duration: Duration.fast / 1000, ease: Ease.enter } }),
  pause: motionSafe({ pathLength: 1, opacity: 1, transition: { duration: Duration.fast / 1000, ease: Ease.enter } }),
};

export const playPauseButtonVariants = {
  rest: { scale: 1 },
  pressed: motionSafe({ scale: 0.88, transition: { duration: Duration.instant / 1000 } }),
  release: motionSafe({ scale: 1, transition: Ease.spring }),
};

// VARIANT SET 6 — Like / Heart Button
export const likeButtonVariants = {
  unliked: { scale: 1, color: "#aaaaaa" },
  liked: motionSafe({ 
    scale: [1, 1.4, 1.0],
    color: "#ff5540",
    transition: { 
      scale: { duration: Duration.fast / 1000, ease: "easeOut" },
      color: { duration: Duration.instant / 1000 } 
    } 
  }),
};

// Particle burst on like — returns config given angle
export const likeParticleVariants = (angle: number) => ({
  initial: { x: 0, y: 0, opacity: 1, scale: 1 },
  burst: motionSafe({ 
    x: Math.cos(angle) * 28, 
    y: Math.sin(angle) * 28,
    opacity: 0, 
    scale: 0,
    transition: { duration: Duration.base / 1000, ease: Ease.exit } 
  }),
});

// VARIANT SET 7 — Progress Bar / Seek Bar
export const progressBarThumbVariants = {
  hidden: { opacity: 0, scale: 0.4 },
  visible: motionSafe({ opacity: 1, scale: 1.0, transition: { duration: Duration.fast / 1000, ease: Ease.enter } }),
};

export const progressFillVariants = {
  layout: true,
  transition: { duration: 0.5, ease: "linear" },
};

// VARIANT SET 8 — Equalizer Bars (Currently Playing Indicator)
export const equalizerBarVariants = [
  { animate: motionSafe({ scaleY: [0.3, 1.0, 0.5, 0.8, 0.3], transition: { duration: 1.1, repeat: Infinity, ease: "easeInOut" } }) },
  { animate: motionSafe({ scaleY: [0.7, 0.3, 1.0, 0.4, 0.7], transition: { duration: 0.9, repeat: Infinity, ease: "easeInOut", delay: 0.15 } }) },
  { animate: motionSafe({ scaleY: [0.5, 0.8, 0.3, 1.0, 0.5], transition: { duration: 1.3, repeat: Infinity, ease: "easeInOut", delay: 0.3 } }) },
];

// VARIANT SET 9 — Now Playing Full Screen Expand / Collapse
export const nowPlayingExpandVariants = {
  collapsed: { y: "100%", borderRadius: "24px 24px 0 0" },
  expanded: motionSafe({ 
    y: "0%",   
    borderRadius: "0px",
    transition: { duration: Duration.slow / 1000, ease: Ease.enter } 
  }),
  exit: motionSafe({ y: "100%", transition: { duration: Duration.base / 1000, ease: Ease.exit } }),
};

export const nowPlayingArtworkVariants = {
  collapsed: { width: "56px", height: "56px", borderRadius: "4px" },
  expanded: motionSafe({ 
    width: "280px", 
    height: "280px", 
    borderRadius: "12px",
    transition: { duration: Duration.slow / 1000, ease: Ease.springGentle } 
  }),
};

export const nowPlayingBackgroundVariants = {
  animate: (color: string) => motionSafe({
    background: `radial-gradient(ellipse at 50% 0%, rgba(${color}, 0.35) 0%, #0f0f0f 75%)`,
    transition: { duration: Duration.ambient / 1000, ease: Ease.default },
  }),
};

// VARIANT SET 10 — Lyrics Mode
export const lyricsLineVariants = {
  past: motionSafe({ opacity: 0.25, scale: 0.94, y: 0, filter: "blur(0.5px)", transition: { duration: Duration.base / 1000 } }),
  active: motionSafe({ opacity: 1.0, scale: 1.02, y: 0, filter: "blur(0px)", transition: { duration: Duration.base / 1000, ease: Ease.enter } }),
  upcoming: motionSafe({ opacity: 0.45, scale: 0.96, y: 0, filter: "blur(0.3px)", transition: { duration: Duration.base / 1000 } }),
};

export const lyricsScrollVariants = {
  transition: motionSafe({ duration: Duration.base / 1000, ease: Ease.default }),
};

// VARIANT SET 11 — Queue Panel Slide
export const queuePanelVariants = {
  hiddenMobile: { y: "100%" },
  visibleMobile: motionSafe({ y: "0%", transition: { duration: Duration.slow / 1000, ease: Ease.enter } }),
  exitMobile: motionSafe({ y: "100%", transition: { duration: Duration.base / 1000, ease: Ease.exit } }),
  
  hiddenDesktop: { x: "100%", opacity: 0 },
  visibleDesktop: motionSafe({ x: "0%", opacity: 1, transition: { duration: Duration.base / 1000, ease: Ease.enter } }),
  exitDesktop: motionSafe({ x: "100%", opacity: 0, transition: { duration: Duration.fast / 1000, ease: Ease.exit } }),
};

export const queueItemVariants = {
  initial: { opacity: 0, height: 0, x: 24 },
  animate: motionSafe({ opacity: 1, height: 56, x: 0, transition: { duration: Duration.base / 1000, ease: Ease.enter } }),
  exit: motionSafe({ opacity: 0, height: 0, x: -24, transition: { duration: Duration.fast / 1000, ease: Ease.exit } }),
};

// VARIANT SET 12 — Toast Notifications
export const toastVariants = {
  initial: { opacity: 0, y: 16, scale: 0.95 },
  animate: motionSafe({ opacity: 1, y: 0, scale: 1.0, transition: { duration: Duration.fast / 1000, ease: Ease.enter } }),
  exit: motionSafe({ opacity: 0, y: 8, scale: 0.95, transition: { duration: Duration.fast / 1000, ease: Ease.exit } }),
};

// VARIANT SET 13 — Modal (Create Playlist, Add to Speed Dial)
export const modalOverlayVariants = {
  hidden: { opacity: 0 },
  visible: motionSafe({ opacity: 1, transition: { duration: Duration.fast / 1000 } }),
  exit: motionSafe({ opacity: 0, transition: { duration: Duration.fast / 1000 } }),
};

export const modalCardVariants = {
  hidden: { opacity: 0, scale: 0.93, y: 16 },
  visible: motionSafe({ 
    opacity: 1, 
    scale: 1.0, 
    y: 0,
    transition: { duration: Duration.base / 1000, ease: Ease.springGentle } 
  }),
  exit: motionSafe({ opacity: 0, scale: 0.95, y: 12, transition: { duration: Duration.fast / 1000, ease: Ease.exit } }),
};

// VARIANT SET 14 — Sidebar Navigation Active State
export const sidebarItemActiveIndicatorVariants = {
  layout: true,
  layoutId: "sidebar-active-indicator",
  transition: motionSafe({ ...Ease.springGentle }),
};

// VARIANT SET 15 — Chip / Filter Chip Select
export const chipVariants = {
  inactive: { backgroundColor: "rgba(255,255,255,0.08)", color: "#aaaaaa", scale: 1 },
  active: motionSafe({ 
    backgroundColor: "#ffffff", 
    color: "#000000", 
    scale: 1.0,
    transition: { duration: Duration.fast / 1000, ease: Ease.enter } 
  }),
  tap: motionSafe({ scale: 0.94, transition: { duration: Duration.instant / 1000 } }),
};

// VARIANT SET 16 — Skeleton Shimmer
export const shimmerVariants = {
  animate: motionSafe({
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: { duration: 1.8, repeat: Infinity, ease: "linear" },
  }),
};

// VARIANT SET 17 — Waveform Visualizer
export const waveformBarVariants = {
  animate: (height: number) => motionSafe({
    scaleY: height,
    transition: { duration: 0.08, ease: "linear" },
  }),
};

// VARIANT SET 18 — Now Playing Artwork Rotation (Vinyl Mode)
export const vinylRotationVariants = {
  playing: motionSafe({ rotate: 360, transition: { duration: 12, repeat: Infinity, ease: "linear" } }),
  paused: { rotate: 0, transition: { duration: Duration.slow / 1000 } },
};

// VARIANT SET 19 — Context Menu
export const contextMenuVariants = {
  hidden: { opacity: 0, scale: 0.92, y: -8, transformOrigin: "top center" },
  visible: motionSafe({ opacity: 1, scale: 1.0, y: 0, transition: { duration: Duration.fast / 1000, ease: Ease.enter } }),
  exit: motionSafe({ opacity: 0, scale: 0.95, y: -4, transition: { duration: Duration.instant / 1000, ease: Ease.exit } }),
};

export const contextMenuItemVariants = {
  container: { transition: { staggerChildren: 0.03 } },
  item: {
    hidden: { opacity: 0, x: -8 },
    visible: motionSafe({ opacity: 1, x: 0, transition: { duration: Duration.fast / 1000 } }),
  },
};

// VARIANT SET 20 — Scroll-triggered Section Headers
export const sectionHeaderVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: motionSafe({ opacity: 1, y: 0, transition: { duration: Duration.base / 1000, ease: Ease.enter } }),
};

export const sectionCardStaggerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

export const sectionCardItemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: motionSafe({ opacity: 1, y: 0, scale: 1.0, transition: { duration: Duration.base / 1000, ease: Ease.enter } }),
};
