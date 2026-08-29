import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListenHistory } from "../../history/useListenHistory";
import type { TrackSummary } from "../../history/types";
import { 
  cardVariants, 
  cardArtworkOverlayVariants, 
  cardPlayButtonVariants,
  sectionCardItemVariants 
} from "../../motion/variants";

interface ListenAgainSectionProps {
  currentTrack: any;
  isPlaying: boolean;
  onPlayTrack: (track: any, contextQueue: any[]) => void;
  onPlayAll: (tracks: any[]) => void;
  profileName?: string;
}

/**
 * ListenAgainSection Component
 * Renders a horizontal scroll list of familiar, highly-played tracks.
 */
export const ListenAgainSection: React.FC<ListenAgainSectionProps> = ({
  currentTrack,
  isPlaying,
  onPlayTrack,
  onPlayAll,
  profileName
}) => {
  const { listenAgainTracks } = useListenHistory();

  // Hide the section entirely when fewer than 3 unique track summaries exist
  if (listenAgainTracks.length < 3) return null;

  // Map TrackSummary back to play-compatible catalog track objects
  const playCompatibleQueue = listenAgainTracks.map(t => ({
    id: t.trackId,
    title: t.title,
    artist: t.artist,
    artistId: t.artistId,
    album: t.album,
    albumId: t.albumId,
    thumbnail: t.artwork,
    genres: t.genres,
    energy: t.energy,
    valence: t.valence,
    danceability: t.danceability,
    acousticness: t.acousticness,
    tempo: t.tempo,
    durationMs: t.totalListenedMs / t.totalPlays // approximation or duration fallback
  }));

  const handlePlayAllClick = () => {
    onPlayAll(playCompatibleQueue);
  };

  return (
    <section className="relative px-gutter" aria-label="Listen again">
      {/* Section Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant/20">
              <span className="material-symbols-outlined text-[12px] text-text-primary">person</span>
            </div>
            <span className="text-text-tertiary text-label-md uppercase tracking-widest font-bold">
              {profileName ? `${profileName.split(" ")[0]}'s Taste` : "Listen again"}
            </span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-text-primary">Listen again</h2>
        </div>
        <button 
          onClick={handlePlayAllClick}
          className="border border-outline-variant hover:bg-surface-container-high transition-colors text-label-md font-bold px-4 py-1.5 rounded-full active:scale-95 duration-100 text-text-primary"
        >
          Play all
        </button>
      </div>

      {/* Background Glows */}
      <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-purple-600/5 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Horizontal List Scroll Container */}
      <div className="flex gap-6 overflow-x-auto hide-scrollbar snap-x-mandatory scroll-smooth pb-4 -mx-2 px-2">
        <AnimatePresence>
          {listenAgainTracks.map((trackSummary, idx) => {
            const isCurrentTrack = currentTrack?.id === trackSummary.trackId;
            return (
              <ListenAgainCard
                key={trackSummary.trackId}
                trackSummary={trackSummary}
                index={idx}
                isCurrentTrack={isCurrentTrack}
                isPlaying={isPlaying}
                onClick={() => {
                  // Map summary to track shape for execution
                  const trackObj = playCompatibleQueue[idx];
                  onPlayTrack(trackObj, playCompatibleQueue);
                }}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
};

interface ListenAgainCardProps {
  trackSummary: TrackSummary;
  index: number;
  isCurrentTrack: boolean;
  isPlaying: boolean;
  onClick: () => void;
}

/**
 * ListenAgainCard Component
 * Displays a single item card with track thumbnail, metadata, play count, and hover overlays.
 */
const ListenAgainCard: React.FC<ListenAgainCardProps> = ({
  trackSummary,
  index,
  isCurrentTrack,
  isPlaying,
  onClick
}) => {
  // Stagger entry animations
  const staggerDelay = index * 0.06;

  return (
    <motion.div
      variants={sectionCardItemVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay: staggerDelay }}
      className="flex-shrink-0 snap-start group cursor-pointer w-[160px] md:w-[180px] xl:w-[200px]"
      onClick={onClick}
    >
      <motion.div
        variants={cardVariants}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        className="rounded-xl overflow-hidden mb-3 relative bg-surface-container-high aspect-square w-full"
      >
        {/* Artwork Thumbnail */}
        <img 
          alt={trackSummary.title} 
          className="w-full h-full object-cover" 
          src={trackSummary.artwork} 
        />
        
        {/* Play/Pause Overlay */}
        <motion.div 
          variants={cardArtworkOverlayVariants} 
          className="absolute inset-0 bg-black/40 flex items-center justify-center"
        />

        <motion.div 
          variants={cardPlayButtonVariants} 
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform duration-100">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isCurrentTrack && isPlaying ? "pause" : "play_arrow"}
            </span>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Song Metadata Titles */}
      <div className="px-1 w-full overflow-hidden">
        <h4 className={`font-body-md text-body-md truncate font-bold ${isCurrentTrack ? "text-primary-container" : "text-text-primary"}`}>
          {trackSummary.title}
        </h4>
        <p className="font-label-md text-label-md text-text-secondary truncate mt-0.5">
          {trackSummary.artist}
        </p>
        <p className="text-[11px] font-medium text-text-tertiary mt-1 select-none">
          {trackSummary.totalPlays === 1 ? "Played once" : `Played ${trackSummary.totalPlays} times`}
        </p>
      </div>
    </motion.div>
  );
};
