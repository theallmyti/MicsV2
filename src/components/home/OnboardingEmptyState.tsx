import React from 'react';

interface OnboardingEmptyStateProps {
  onExplore: () => void;
}

export const OnboardingEmptyState: React.FC<OnboardingEmptyStateProps> = ({ onExplore }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-[#161616] border border-white/5 rounded-2xl w-full text-center py-12 my-4">
      {/* Icon: music note, 48px, color #3f3f3f */}
      <span 
        className="material-symbols-outlined text-[48px] text-[#3f3f3f] mb-4 select-none"
        style={{ fontVariationSettings: "'FILL' 0" }}
      >
        music_note
      </span>
      
      {/* Title: Welcome to Mics, 16px white, font-weight 600 */}
      <h3 className="text-[16px] text-white font-semibold mb-2">
        Welcome to Mics
      </h3>
      
      {/* Subtitle: 14px, color #aaaaaa */}
      <p className="text-[14px] text-[#aaaaaa] mb-6 max-w-sm leading-relaxed">
        Play some songs to get personalized recommendations.
      </p>
      
      {/* Button: Explore music pill button */}
      <button 
        onClick={onExplore}
        className="px-6 py-2 bg-white text-black font-semibold text-[14px] rounded-full hover:bg-opacity-90 active:scale-95 transition-all duration-150"
      >
        Explore music
      </button>
    </div>
  );
};

export default OnboardingEmptyState;
