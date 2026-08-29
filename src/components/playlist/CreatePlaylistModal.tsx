import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  newPlaylistName: string;
  setNewPlaylistName: (name: string) => void;
  newPlaylistDesc: string;
  setNewPlaylistDesc: (desc: string) => void;
  playlistSongSearch: string;
  setPlaylistSongSearch: (q: string) => void;
  playlistAddedSongs: any[];
  setPlaylistAddedSongs: React.Dispatch<React.SetStateAction<any[]>>;
  libraryItems: any[];
  onConfirm: () => void;
  onOpenImport: () => void;
}

type CreateMode = 'blank' | 'import' | null;

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  newPlaylistName,
  setNewPlaylistName,
  newPlaylistDesc,
  setNewPlaylistDesc,
  playlistSongSearch,
  setPlaylistSongSearch,
  playlistAddedSongs,
  setPlaylistAddedSongs,
  libraryItems,
  onConfirm,
  onOpenImport,
}) => {
  const [mode, setMode] = useState<CreateMode>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setMode(null);
    onClose();
  };

  const handleSelectImport = () => {
    setMode(null);
    onClose();
    onOpenImport();
  };

  return (
    <AnimatePresence>
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
          onClick={handleClose}
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
          className="relative bg-surface-container/90 backdrop-blur-xl border border-white/10 rounded-[24px] w-full max-w-[600px] shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-8 py-6 border-b border-white/5">
            <h3 className="text-[20px] font-bold text-white">
              {mode === null && 'New playlist'}
              {mode === 'blank' && 'Create playlist'}
            </h3>
            <button
              onClick={handleClose}
              className="text-text-secondary hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Mode Selection Cards */}
          {mode === null && (
            <div className="p-8 flex gap-4 justify-between">
              {/* Option 1: Create Blank */}
              <button
                onClick={() => setMode('blank')}
                className="w-[calc(50%-8px)] h-[88px] bg-[#1a1a1a] border border-white/12 hover:border-white/30 rounded-xl flex flex-col items-center justify-center gap-1 group active:bg-white/5 transition-all outline-none"
              >
                <span className="material-symbols-outlined text-2xl text-[#aaaaaa] group-hover:text-white transition-colors">edit</span>
                <span className="text-[13px] text-white font-medium">Create blank</span>
                <span className="text-[11px] text-[#717171]">Start fresh</span>
              </button>

              {/* Option 2: Import from Link */}
              <button
                onClick={handleSelectImport}
                className="w-[calc(50%-8px)] h-[88px] bg-[#1a1a1a] border border-white/12 hover:border-white/30 rounded-xl flex flex-col items-center justify-center gap-1 group active:bg-white/5 transition-all outline-none"
              >
                <span className="material-symbols-outlined text-2xl text-[#aaaaaa] group-hover:text-white transition-colors">link</span>
                <span className="text-[13px] text-white font-medium">Import from link</span>
                <span className="text-[11px] text-[#717171]">Spotify or YT Music</span>
              </button>
            </div>
          )}

          {/* Playlist Form (Blank mode) */}
          {mode === 'blank' && (
            <>
              {/* Top section: cover + name/desc */}
              <div className="p-8 pb-4 flex gap-8">
                {/* Cover placeholder */}
                <div className="w-[140px] h-[140px] rounded-xl bg-gradient-to-br from-surface-container-highest to-surface-variant flex-shrink-0 relative group overflow-hidden cursor-pointer">
                  {playlistAddedSongs[0] ? (
                    <img src={playlistAddedSongs[0].thumbnail} alt="cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-text-secondary">
                      <span className="material-symbols-outlined text-4xl mb-2">music_note</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-white mb-1 text-xl">add_a_photo</span>
                    <span className="text-[11px] text-white font-medium">Add Cover</span>
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
                    className="bg-transparent border-none p-0 text-[24px] font-bold text-text-primary placeholder-text-tertiary focus:ring-0 w-full outline-none"
                  />
                  <textarea
                    value={newPlaylistDesc}
                    onChange={e => setNewPlaylistDesc(e.target.value)}
                    placeholder="Describe your vibe..."
                    rows={2}
                    className="bg-white/5 border border-white/10 rounded-xl p-3 text-body-md text-text-primary placeholder-text-secondary focus:bg-white/10 focus:border-white/20 focus:ring-0 transition-all resize-none outline-none"
                  />
                </div>
              </div>

              {/* Song search + suggestions */}
              <div className="px-8 pb-4 flex flex-col gap-4 overflow-hidden" style={{ maxHeight: 300 }}>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">search</span>
                  <input
                    type="text"
                    value={playlistSongSearch}
                    onChange={e => setPlaylistSongSearch(e.target.value)}
                    placeholder="Add songs"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-12 pr-4 text-body-md text-text-primary placeholder-text-secondary focus:bg-white/10 focus:ring-0 transition-all outline-none"
                  />
                </div>

                <div className="overflow-y-auto pr-1 space-y-4" style={{ maxHeight: 180 }}>
                  {/* Added songs */}
                  {playlistAddedSongs.length > 0 && (
                    <div>
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

                  {/* Suggestions from library */}
                  <div>
                    <h4 className="text-label-md font-bold text-text-tertiary uppercase tracking-wider mb-2">Suggested for you</h4>
                    <div className="space-y-1">
                      {libraryItems
                        .filter(i => i && i.type === 'Song')
                        .filter(i => !playlistAddedSongs.some(a => a && a.id === i.id))
                        .filter(i => {
                          if (!playlistSongSearch) return true;
                          const titleMatch = i.title?.toLowerCase().includes(playlistSongSearch.toLowerCase());
                          const artistMatch = i.artist?.toLowerCase().includes(playlistSongSearch.toLowerCase());
                          return titleMatch || artistMatch;
                        })
                        .slice(0, 5)
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
                        <p className="text-label-md text-text-secondary py-2 text-center">Like some songs first to add them here!</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="p-6 border-t border-white/5 flex justify-end gap-4">
                <button
                  onClick={() => setMode(null)}
                  className="px-6 py-2.5 rounded-full text-label-lg font-medium text-text-primary hover:bg-white/5 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={onConfirm}
                  className="px-8 py-2.5 rounded-full bg-white text-black text-label-lg font-bold hover:opacity-90 transition-all active:scale-95 duration-150"
                >
                  Create Playlist
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreatePlaylistModal;
