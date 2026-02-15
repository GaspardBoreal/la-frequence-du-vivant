import React from 'react';

const BotanicalLeaf = ({ className = '', flip = false }: { className?: string; flip?: boolean }) => (
  <svg
    className={className}
    viewBox="0 0 120 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ transform: flip ? 'scaleX(-1)' : undefined }}
  >
    <path
      d="M60 10C60 10 20 60 20 120C20 160 40 190 60 190C80 190 100 160 100 120C100 60 60 10 60 10Z"
      fill="currentColor"
      fillOpacity="0.08"
    />
    <path
      d="M60 30L60 180"
      stroke="currentColor"
      strokeOpacity="0.15"
      strokeWidth="1"
    />
    <path
      d="M60 60C45 70 30 90 28 110"
      stroke="currentColor"
      strokeOpacity="0.1"
      strokeWidth="0.8"
    />
    <path
      d="M60 80C75 90 90 100 92 120"
      stroke="currentColor"
      strokeOpacity="0.1"
      strokeWidth="0.8"
    />
    <path
      d="M60 100C42 112 32 130 30 145"
      stroke="currentColor"
      strokeOpacity="0.1"
      strokeWidth="0.8"
    />
    <path
      d="M60 120C78 130 88 145 90 155"
      stroke="currentColor"
      strokeOpacity="0.1"
      strokeWidth="0.8"
    />
  </svg>
);

export default BotanicalLeaf;
