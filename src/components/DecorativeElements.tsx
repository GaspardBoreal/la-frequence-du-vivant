
import React from 'react';

interface DecorativeElementsProps {
  className?: string;
}

const DecorativeElements: React.FC<DecorativeElementsProps> = ({ className = "" }) => {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {/* Nuages flottants */}
      <div className="absolute top-10 left-1/4 animate-float">
        <svg width="80" height="40" viewBox="0 0 80 40" fill="none" className="opacity-20">
          <path d="M20 30C12 30 6 24 6 17C6 10 12 4 20 4C24 4 27 6 29 9C31 7 34 6 37 6C44 6 50 12 50 19C50 26 44 32 37 32H20Z" fill="white"/>
        </svg>
      </div>
      
      <div className="absolute top-6 right-1/3 animate-float" style={{animationDelay: '2s'}}>
        <svg width="100" height="50" viewBox="0 0 100 50" fill="none" className="opacity-15">
          <path d="M25 40C15 40 7 32 7 22C7 12 15 4 25 4C30 4 34 7 36 11C39 8 43 7 47 7C56 7 64 15 64 24C64 33 56 41 47 41H25Z" fill="white"/>
        </svg>
      </div>

      {/* Oiseaux stylisés */}
      <div className="absolute top-20 right-1/4 animate-pulse-gentle">
        <svg width="20" height="12" viewBox="0 0 20 12" fill="none" className="opacity-30">
          <path d="M2 6C2 6 6 2 10 6C14 2 18 6 18 6" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
      </div>
      
      <div className="absolute top-32 right-1/5 animate-pulse-gentle" style={{animationDelay: '1s'}}>
        <svg width="16" height="10" viewBox="0 0 16 10" fill="none" className="opacity-25">
          <path d="M2 5C2 5 5 2 8 5C11 2 14 5 14 5" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
      </div>

      {/* Ondes sonores */}
      <div className="absolute bottom-20 left-1/3 animate-pulse-gentle">
        <svg width="40" height="20" viewBox="0 0 40 20" fill="none" className="opacity-20">
          <path d="M5 10C5 10 10 5 15 10C20 15 25 10 25 10C30 5 35 10 35 10" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M5 15C5 15 10 10 15 15C20 20 25 15 25 15C30 10 35 15 35 15" stroke="currentColor" strokeWidth="1" fill="none"/>
        </svg>
      </div>

      {/* Silhouettes d'arbres */}
      <div className="absolute bottom-0 left-0 right-0 opacity-10">
        <svg width="100%" height="100" viewBox="0 0 800 100" fill="none" preserveAspectRatio="none">
          <path d="M0 100L0 60C50 40 100 70 150 50C200 30 250 60 300 40C350 20 400 50 450 30C500 10 550 40 600 20C650 5 700 30 750 15C775 8 800 20 800 20V100H0Z" fill="currentColor"/>
        </svg>
      </div>
    </div>
  );
};

export default DecorativeElements;
