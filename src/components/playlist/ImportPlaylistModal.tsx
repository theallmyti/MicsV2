import React, { useState, useEffect } from 'react';
import { usePlaylistImport } from '../../hooks/usePlaylistImport';
import { parsePlaylistUrl, getPlatformLabel } from '../../utils/playlistUrlParser';
import styles from './ImportPlaylistModal.module.css';

interface ImportPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

const errorMessages: Record<string, string> = {
  INVALID_URL:          "That doesn't look like a valid playlist link.",
  PRIVATE_PLAYLIST:     "This playlist is private. Make it public and try again.",
  NOT_FOUND:            "Playlist not found. Double-check the link.",
  RATE_LIMITED:         "We're being rate limited. Wait a moment and try again.",
  UNSUPPORTED_PLATFORM: "Only YouTube Music and Spotify playlists are supported.",
  TIMEOUT:              "The import took too long. Try again.",
  UNKNOWN_ERROR:        "Something went wrong. Please try again.",
};

export const ImportPlaylistModal: React.FC<ImportPlaylistModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [detectedPlatform, setDetectedPlatform] = useState<'youtube_music' | 'spotify' | null>(null);
  const [playlistTitleInput, setPlaylistTitleInput] = useState('');

  const { state, importResult, error, startImport, confirmImport, reset } = usePlaylistImport();

  // Validate URL on change
  useEffect(() => {
    if (!urlInput.trim()) {
      setIsValidUrl(false);
      setDetectedPlatform(null);
      return;
    }
    const parsed = parsePlaylistUrl(urlInput);
    if (parsed) {
      setIsValidUrl(true);
      setDetectedPlatform(parsed.platform);
    } else {
      setIsValidUrl(false);
      setDetectedPlatform(null);
    }
  }, [urlInput]);

  // Set default editable title on success
  useEffect(() => {
    if (state === 'preview' && importResult) {
      setPlaylistTitleInput(importResult.title);
    }
  }, [state, importResult]);

  // Close hook logic
  useEffect(() => {
    if (state === 'saved') {
      if (onImportSuccess) onImportSuccess();
      reset();
      setUrlInput('');
      onClose();
    }
  }, [state, onImportSuccess, onClose, reset]);

  if (!isOpen) return null;

  const handleClose = () => {
    // Disable closing during non-interruptible states
    if (state === 'loading' || state === 'saving') return;
    reset();
    setUrlInput('');
    onClose();
  };

  const handleStartImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidUrl) {
      startImport(urlInput);
    }
  };

  const handleConfirmImport = () => {
    if (playlistTitleInput.trim()) {
      confirmImport(playlistTitleInput.trim());
    }
  };

  const getHumanErrorMessage = () => {
    if (!error) return errorMessages.UNKNOWN_ERROR;
    return errorMessages[error.code] || error.message || errorMessages.UNKNOWN_ERROR;
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.backdrop} onClick={handleClose} />
      
      <div className={styles.modalCard}>
        {/* Header */}
        <div className={styles.header}>
          <h3>
            {state === 'idle' && 'Import playlist'}
            {state === 'loading' && 'Importing playlist...'}
            {state === 'preview' && 'Review & import'}
            {state === 'error' && 'Import failed'}
            {state === 'saving' && 'Saving to library...'}
          </h3>
          <button 
            onClick={handleClose} 
            className={styles.closeButton}
            disabled={state === 'loading' || state === 'saving'}
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        {/* State 1: Idle / Input */}
        {state === 'idle' && (
          <form onSubmit={handleStartImport}>
            <div className={styles.content}>
              <div className={styles.inputGroup}>
                <label htmlFor="playlist-url">Paste a link from YouTube Music or Spotify</label>
                <div className={styles.inputWrapper}>
                  <span className={`material-symbols-outlined ${styles.inputIcon}`}>link</span>
                  <input
                    id="playlist-url"
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://music.youtube.com/playlist?list=..."
                    className={styles.textInput}
                    style={{ fontSize: '16px' }} // IOS zoom prevention
                    autoFocus
                  />
                </div>
                
                {/* Platform detection badge / Invalid URL error */}
                {urlInput.trim() && (
                  <div className={styles.validationInfo}>
                    {isValidUrl && detectedPlatform && (
                      <span className={`${styles.validBadge} ${styles[detectedPlatform]}`}>
                        <span className="material-symbols-outlined text-[14px]">
                          {detectedPlatform === 'spotify' ? 'check_circle' : 'play_circle'}
                        </span>
                        Platform: {getPlatformLabel(detectedPlatform)}
                      </span>
                    )}
                    {!isValidUrl && (
                      <span className={styles.invalidError}>
                        Invalid URL format. Check the link and try again.
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.supportedPlatforms}>
                <p>Supported:</p>
                <div className={styles.platformItem}>
                  <div className={`${styles.platformDot} ${styles.youtube}`} />
                  YouTube Music playlists
                </div>
                <div className={styles.platformItem}>
                  <div className={`${styles.platformDot} ${styles.spotify}`} />
                  Spotify public playlists
                </div>
              </div>
            </div>
            
            <div className={styles.footer}>
              <button 
                type="button" 
                onClick={handleClose} 
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={!isValidUrl} 
                className={styles.primaryBtn}
              >
                Import playlist
              </button>
            </div>
          </form>
        )}

        {/* State 2: Loading */}
        {(state === 'loading' || state === 'saving') && (
          <div className={styles.content}>
            <div className={styles.loadingContainer}>
              <div className={styles.spinner} />
              <div className={styles.loadingText}>
                <h4>
                  {state === 'loading' 
                    ? `Fetching tracks from ${detectedPlatform === 'spotify' ? 'Spotify' : 'YouTube Music'}`
                    : 'Adding songs to library...'
                  }
                </h4>
                <p>This may take a few seconds...</p>
              </div>
              <div className={styles.progressBarContainer}>
                <div className={styles.progressBar} />
              </div>
            </div>
          </div>
        )}

        {/* State 3: Preview */}
        {state === 'preview' && importResult && (
          <>
            <div className={styles.content} style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div className={styles.playlistHeader}>
                {importResult.artwork ? (
                  <img 
                    src={importResult.artwork} 
                    alt={importResult.title} 
                    className={styles.artwork} 
                  />
                ) : (
                  <div className={styles.artwork}>
                    <span className="material-symbols-outlined text-3xl text-text-secondary">music_note</span>
                  </div>
                )}
                <div className={styles.playlistMeta}>
                  <h4 className={styles.playlistTitle}>{importResult.title}</h4>
                  <p className={styles.playlistOwner}>
                    By {importResult.owner || 'Unknown'} • {importResult.trackCount} songs
                  </p>
                  <span className={`${styles.validBadge} ${styles[importResult.platform]}`}>
                    {getPlatformLabel(importResult.platform)}
                  </span>
                </div>
              </div>

              {/* Tracks Preview */}
              <div className={styles.tracksPreviewList}>
                {importResult.tracks.slice(0, 5).map((track, i) => (
                  <div key={track.id || i} className={styles.trackItem}>
                    <span className={`material-symbols-outlined ${styles.trackCheck}`}>check</span>
                    <div className={styles.trackInfo}>
                      <h5 className={styles.trackTitle}>{track.title}</h5>
                      <p className={styles.trackArtist}>{track.artist}</p>
                    </div>
                  </div>
                ))}
                {importResult.trackCount > 5 && (
                  <p className={styles.moreTracksCount}>
                    + {importResult.trackCount - 5} more songs
                  </p>
                )}
              </div>

              {/* Spotify Warn Banner */}
              {importResult.platform === 'spotify' && (
                <div className={styles.warningBanner}>
                  <span className={`material-symbols-outlined ${styles.warningIcon}`}>info</span>
                  <p className={styles.warningText}>
                    Spotify tracks will be saved as metadata only. Connect a music source (like YouTube Music) to search and play them.
                  </p>
                </div>
              )}

              {/* Editable Name Input */}
              <div className={styles.inputGroup}>
                <label htmlFor="playlist-title-input">Playlist name:</label>
                <input
                  id="playlist-title-input"
                  type="text"
                  value={playlistTitleInput}
                  onChange={(e) => setPlaylistTitleInput(e.target.value)}
                  className={styles.textInput}
                  placeholder="Enter playlist name"
                  style={{ paddingLeft: '1rem' }}
                />
              </div>
            </div>

            <div className={styles.footer}>
              <button 
                type="button" 
                onClick={reset} 
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleConfirmImport} 
                disabled={!playlistTitleInput.trim()}
                className={styles.primaryBtn}
              >
                Add to library
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </>
        )}

        {/* State 4: Error */}
        {state === 'error' && (
          <>
            <div className={styles.content}>
              <div className={styles.errorContainer}>
                <span className={`material-symbols-outlined ${styles.errorIcon}`}>error</span>
                <div className={styles.errorText}>
                  <h4>Import failed</h4>
                  <p>{getHumanErrorMessage()}</p>
                </div>
              </div>
            </div>

            <div className={styles.footer}>
              <button 
                type="button" 
                onClick={reset} 
                className={styles.cancelBtn}
              >
                Try a different link
              </button>
              <button 
                type="button" 
                onClick={() => {
                  if (urlInput.trim()) {
                    startImport(urlInput);
                  }
                }} 
                className={styles.primaryBtn}
              >
                Try again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImportPlaylistModal;
