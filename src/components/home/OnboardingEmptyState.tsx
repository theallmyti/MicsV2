import React from 'react';

interface OnboardingEmptyStateProps {
  onExplore: () => void;
}

export const OnboardingEmptyState: React.FC<OnboardingEmptyStateProps> = ({ onExplore }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-surface-container border border-border-subtle rounded-3xl w-full text-center py-14 my-4 shadow-sm">
      {/* Icon: music note */}
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
        <span 
          className="material-symbols-outlined text-[36px] select-none"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          music_note
        </span>
      </div>
      
      {/* Title */}
      <h3 className="text-xl text-text-primary font-bold mb-2">
        Welcome to Mics
      </h3>
      
      {/* Subtitle */}
      <p className="text-body-md text-text-secondary mb-6 max-w-sm leading-relaxed">
        Play some songs to get personalized recommendations curated just for your vibe.
      </p>
      
      {/* Button */}
      <button 
        onClick={onExplore}
        className="px-6 py-2.5 bg-primary text-white font-bold text-sm rounded-full hover:bg-primary/90 active:scale-95 transition-all duration-150 shadow-md shadow-primary/25"
      >
        Explore music
      </button>
    </div>
  );
};

export default OnboardingEmptyState;
