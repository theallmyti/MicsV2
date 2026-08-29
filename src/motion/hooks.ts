/**
 * @file hooks.ts
 * @description Custom React Hooks for Mics Motion and Audio Analysis.
 * Provides canvas color extraction, AnalyserNode binding, spring counters, and accessibility features.
 */

import { useState, useEffect, useRef, type RefObject } from "react";
import { useMotionValue, useSpring } from "framer-motion";

/**
 * useReducedMotion
 * Detects if the user has enabled reduced motion in their system accessibility options.
 * Subscribes to changes so it updates dynamically if toggled during the session.
 * @returns {boolean} true if reduced motion is enabled, false otherwise.
 */
export const useReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);

    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  return reduced;
};

// Dominant color extraction cache
const colorCache = new Map<string, string>();

/**
 * useDominantColor
 * Draws the target image URL to an off-screen 1x1 canvas to extract the average dominant color.
 * Returns RGB representation ready for CSS gradients, clamped to prevent near-black colors.
 * @param imageUrl - URL of the cover art
 * @returns { color: string, isLoading: boolean } RGB string, e.g. "147, 1, 0"
 */
export const useDominantColor = (imageUrl: string | null): { color: string; isLoading: boolean } => {
  const [color, setColor] = useState("147, 1, 0"); // default fallback crimson
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      setColor("147, 1, 0");
      return;
    }

    if (colorCache.has(imageUrl)) {
      setColor(colorCache.get(imageUrl)!);
      return;
    }

    setIsLoading(true);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, 1, 1);
          const pixel = ctx.getImageData(0, 0, 1, 1).data;
          const [r, g, b] = pixel;

          // Clamp brightness to keep the color visible against a black background
          const minVal = 40;
          const maxVal = 200;
          const nr = Math.max(minVal, Math.min(maxVal, r));
          const ng = Math.max(minVal, Math.min(maxVal, g));
          const nb = Math.max(minVal, Math.min(maxVal, b));

          const resultColor = `${nr}, ${ng}, ${nb}`;
          colorCache.set(imageUrl, resultColor);
          setColor(resultColor);
        }
      } catch (e) {
        console.warn("Failed to extract color from image:", e);
        setColor("147, 1, 0");
      }
      setIsLoading(false);
    };

    img.onerror = () => {
      setColor("147, 1, 0");
      setIsLoading(false);
    };
  }, [imageUrl]);

  return { color, isLoading };
};

/**
 * useAudioAnalyser
 * Configures a Web Audio AnalyserNode linked to the active HTMLAudioElement.
 * Samples frequency bin data to power the waveform visualization at 60fps.
 * @param audioRef - Reference to the HTMLAudioElement
 * @param barCount - Number of equalizer visualizer bars (default: 40)
 * @returns {number[]} array of normalized frequency values (0.05 to 1.0)
 */
export const useAudioAnalyser = (audioRef: RefObject<HTMLAudioElement | null>, barCount = 40): number[] => {
  const [frequencies, setFrequencies] = useState<number[]>(new Array(barCount).fill(0.05));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    let audioContext: AudioContext | null = null;

    const setupAnalyser = () => {
      if (analyserRef.current) return;

      try {
        // Create audio context lazy on play to avoid console warning
        audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 128;
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);

        // Connect the source element to context
        const source = audioContext.createMediaElementSource(audioElement);
        sourceNodeRef.current = source;
        source.connect(analyser);
        analyser.connect(audioContext.destination);
      } catch (e) {
        console.warn("Failed to initialize Web Audio API Analyser:", e);
      }
    };

    const updateFrequencies = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
      const data = dataArrayRef.current;
      const step = Math.floor(data.length / barCount) || 1;
      const nextFreqs = new Array(barCount);

      for (let i = 0; i < barCount; i++) {
        // Average adjacent frequency samples for smoothing
        const sampleIdx = Math.min(i * step, data.length - 1);
        const val = data[sampleIdx];
        // Normalize to range [0.05, 1.0]
        nextFreqs[i] = Math.max(0.05, Math.min(1.0, val / 255));
      }

      setFrequencies(nextFreqs);
      animationFrameIdRef.current = requestAnimationFrame(updateFrequencies);
    };

    const onPlay = () => {
      setupAnalyser();
      if (audioContext && audioContext.state === "suspended") {
        audioContext.resume();
      }
      animationFrameIdRef.current = requestAnimationFrame(updateFrequencies);
    };

    const onPause = () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      // Reset frequencies to flat baseline when paused
      setFrequencies(new Array(barCount).fill(0.05));
    };

    audioElement.addEventListener("play", onPlay);
    audioElement.addEventListener("playing", onPlay);
    audioElement.addEventListener("pause", onPause);
    audioElement.addEventListener("ended", onPause);

    // Initial setup if already playing
    if (!audioElement.paused) {
      onPlay();
    }

    return () => {
      audioElement.removeEventListener("play", onPlay);
      audioElement.removeEventListener("playing", onPlay);
      audioElement.removeEventListener("pause", onPause);
      audioElement.removeEventListener("ended", onPause);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      // Note: intentionally not disconnecting source node because Vite HMR can throw exceptions on reconnect
    };
  }, [audioRef, barCount]);

  return frequencies;
};

/**
 * useSpringCounter
 * Animates a numerical value using a Framer Motion spring configuration.
 * Useful for ticking listener counts, play indices, and time durations.
 * @param value - Numerical value to animate
 * @returns {number} animated value
 */
export const useSpringCounter = (value: number): number => {
  const motionVal = useMotionValue(value);
  const springVal = useSpring(motionVal, { stiffness: 100, damping: 20 });
  const [displayVal, setDisplayVal] = useState(value);

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  useEffect(() => {
    const unsub = springVal.on("change", (latest) => {
      setDisplayVal(Math.round(latest));
    });
    return () => unsub();
  }, [springVal]);

  return displayVal;
};

interface LyricLine {
  text: string;
  startMs: number;
}

/**
 * useLyricsSync
 * Compares current playback position in milliseconds against lyric timings.
 * Returns the index of the currently active lyric line.
 * @param lyrics - Array of LyricLine items
 * @param positionMs - Current playback offset in milliseconds
 * @returns {number} index of the active lyric line
 */
export const useLyricsSync = (lyrics: LyricLine[], positionMs: number): number => {
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (!lyrics || lyrics.length === 0) {
      setActiveIndex(-1);
      return;
    }

    // Find the latest lyric line that has already started
    let targetIndex = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (positionMs >= lyrics[i].startMs) {
        targetIndex = i;
      } else {
        break;
      }
    }
    setActiveIndex(targetIndex);
  }, [lyrics, positionMs]);

  return activeIndex;
};
