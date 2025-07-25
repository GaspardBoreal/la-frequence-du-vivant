
import React from 'react';

interface DecorativeElementsProps {
  className?: string;
}

const DecorativeElements: React.FC<DecorativeElementsProps> = ({ className = "" }) => {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {/* Formes organiques flottantes */}
      <div className="absolute top-20 left-1/4 animate-float opacity-20">
        <svg width="120" height="60" viewBox="0 0 120 60" fill="none">
          <path d="M30 45C18 45 9 36 9 25.5C9 15 18 6 30 6C36 6 40.5 9 43.5 13.5C46.5 10.5 51 9 55.5 9C66 9 75 18 75 28.5C75 39 66 48 55.5 48H30Z" fill="currentColor"/>
        </svg>
      </div>
      
      <div className="absolute top-10 right-1/3 animate-float opacity-15" style={{animationDelay: '3s'}}>
        <svg width="90" height="45" viewBox="0 0 90 45" fill="none">
          <path d="M22.5 36C13.5 36 6.75 29.25 6.75 20.25C6.75 11.25 13.5 4.5 22.5 4.5C27 4.5 30.75 6.75 33 10.125C35.25 7.875 38.25 6.75 41.25 6.75C49.5 6.75 56.25 13.5 56.25 21.75C56.25 30 49.5 36.75 41.25 36.75H22.5Z" fill="currentColor"/>
        </svg>
      </div>

      {/* Particules lumineuses */}
      <div className="absolute top-1/3 left-1/5 animate-pulse-gentle opacity-40">
        <div className="w-2 h-2 bg-accent rounded-full"></div>
      </div>
      
      <div className="absolute top-1/2 right-1/4 animate-pulse-gentle opacity-30" style={{animationDelay: '2s'}}>
        <div className="w-3 h-3 bg-accent rounded-full"></div>
      </div>
      
      <div className="absolute bottom-1/3 left-1/3 animate-pulse-gentle opacity-35" style={{animationDelay: '4s'}}>
        <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
      </div>

      {/* Lignes organiques */}
      <div className="absolute bottom-32 left-1/2 animate-pulse-gentle opacity-25">
        <svg width="60" height="30" viewBox="0 0 60 30" fill="none">
          <path d="M7.5 15C7.5 15 15 7.5 22.5 15C30 22.5 37.5 15 37.5 15C45 7.5 52.5 15 52.5 15" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M7.5 22.5C7.5 22.5 15 15 22.5 22.5C30 30 37.5 22.5 37.5 22.5C45 15 52.5 22.5 52.5 22.5" stroke="currentColor" strokeWidth="1" fill="none"/>
        </svg>
      </div>

      {/* Texture de fond subtile */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full bg-gradient-to-br from-transparent via-accent/10 to-transparent"></div>
      </div>

      {/* Silhouettes végétales en bas */}
      <div className="absolute bottom-0 left-0 right-0 opacity-20">
        <svg width="100%" height="80" viewBox="0 0 800 80" fill="none" preserveAspectRatio="none">
          <path d="M0 80L0 48C40 32 80 56 120 40C160 24 200 48 240 32C280 16 320 40 360 24C400 8 440 32 480 16C520 4 560 28 600 12C640 -2 680 22 720 8C740 2 760 16 800 16V80H0Z" fill="currentColor"/>
        </svg>
      </div>
    </div>
  );
};

export default DecorativeElements;
