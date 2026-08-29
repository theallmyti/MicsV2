/**
 * @file tokens.ts
 * @description Global Motion Token System defining timings, ease configurations, and spring variables for Mics.
 * Ensures consistent transitions across all interactive web and mobile surfaces.
 */

export const Duration = {
  instant:   100,   // icon swaps, toggle state flips
  fast:      200,   // button hover, ripple, chip select
  base:      300,   // card transitions, panel slides, route changes
  slow:      500,   // Now Playing expand/collapse, modal enter/exit
  ambient:   800,   // album art background color shift
  crawl:    1200,   // waveform intro, splash screen
} as const;

export const Ease = {
  default:  [0.4, 0, 0.2, 1],          // material standard
  enter:    [0.0, 0, 0.2, 1],          // decelerate — elements arriving
  exit:     [0.4, 0, 1.0, 1],          // accelerate — elements leaving
  spring:   { type: "spring", stiffness: 400, damping: 28 },   // bouncy: like button, FAB
  springGentle: { type: "spring", stiffness: 200, damping: 30 }, // gentle: card expand
  springSnappy: { type: "spring", stiffness: 600, damping: 35 }, // snappy: speed dial tile
} as const;

/**
 * motionSafe
 * Returns the animation configuration object if prefers-reduced-motion is NOT active.
 * Otherwise, returns an empty object so the animation degrades to instant state swaps.
 * @param animation - Framer Motion variant configuration object
 */
export const motionSafe = <T extends object>(animation: T): T => {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? {} as any : animation;
  }
  return animation;
};
