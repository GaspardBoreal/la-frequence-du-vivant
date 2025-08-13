import React from 'react';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';

interface BioacousticTooltipProps {
  marche: MarcheTechnoSensible;
  position: { x: number; y: number };
  visible: boolean;
}

const BioacousticTooltip: React.FC<BioacousticTooltipProps> = ({ 
  marche, 
  position, 
  visible 
}) => {
  if (!visible) return null;

  // Smart positioning system for mobile
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
  const tooltipWidth = Math.min(320, viewportWidth * 0.9);
  const tooltipHeight = 180; // Estimated height
  const padding = 10;
  
  // Calculate if tooltip would overflow on each side
  const wouldOverflowRight = position.x + tooltipWidth / 2 > viewportWidth - padding;
  const wouldOverflowLeft = position.x - tooltipWidth / 2 < padding;
  const wouldOverflowBottom = position.y + tooltipHeight > viewportHeight - padding;
  const wouldOverflowTop = position.y - tooltipHeight < padding;
  
  // Determine optimal positioning
  let left: number;
  let top: number;
  let arrowPosition = 'center'; // 'left', 'right', or 'center'
  
  // Horizontal positioning
  if (wouldOverflowRight) {
    left = viewportWidth - tooltipWidth - padding;
    arrowPosition = 'right';
  } else if (wouldOverflowLeft) {
    left = padding;
    arrowPosition = 'left';
  } else {
    left = position.x - tooltipWidth / 2;
    arrowPosition = 'center';
  }
  
  // Vertical positioning
  if (wouldOverflowBottom) {
    top = position.y - tooltipHeight - 20; // Position above marker
  } else if (wouldOverflowTop) {
    top = position.y + 20; // Position below marker
  } else {
    top = position.y - tooltipHeight / 2;
  }
  
  const adjustedPosition = { left, top, arrowPosition };

  return (
    <div 
      className="bioacoustic-adaptive-tooltip"
      style={{
        position: 'fixed',
        left: adjustedPosition.left,
        top: adjustedPosition.top,
        width: tooltipWidth,
        zIndex: 1000,
        pointerEvents: 'none',
        willChange: 'transform, opacity',
      }}
    >
      {/* Main hologram container */}
      <div className="hologram-container">
        {/* Holographic backdrop */}
        <div className="hologram-backdrop" />
        
        {/* Content container */}
        <div className="hologram-content">
          {/* Header with march name */}
          <div className="hologram-header">
            <h3 className="hologram-title">
              {marche.nomMarche || marche.ville}
            </h3>
          </div>
          
          {/* Territorial info grid */}
          <div className="territorial-grid">
            <div className="territory-item">
              <span className="territory-label">Ville</span>
              <span className="territory-value">{marche.ville}</span>
            </div>
            
            <div className="territory-item">
              <span className="territory-label">Département</span>
              <span className="territory-value">{marche.departement || 'N/A'}</span>
            </div>
            
            <div className="territory-item">
              <span className="territory-label">Région</span>
              <span className="territory-value">{marche.region || 'N/A'}</span>
            </div>
          </div>
          
          {/* Holographic particles */}
          <div className="hologram-particles">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i} 
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: `${3 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Projection lines */}
        <div className="projection-lines">
          <div className="line line-1" />
          <div className="line line-2" />
          <div className="line line-3" />
        </div>
      </div>

      <style>{`
        .bioacoustic-adaptive-tooltip {
          width: 100%;
          height: auto;
          min-height: 120px;
        }

        .hologram-container {
          position: relative;
          width: 100%;
          height: auto;
          animation: bio-growth 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .hologram-backdrop {
          position: absolute;
          inset: 0;
          background: linear-gradient(145deg, 
            rgba(134, 239, 172, 0.88), 
            rgba(110, 231, 183, 0.92)
          );
          border: 1.5px solid rgba(196, 181, 253, 0.6);
          border-radius: 20px 12px 20px 8px;
          backdrop-filter: blur(8px);
          box-shadow: 
            0 12px 30px rgba(134, 239, 172, 0.15),
            0 4px 16px rgba(196, 181, 253, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            inset 0 -1px 0 rgba(134, 239, 172, 0.1);
          animation: gentle-breath 4s ease-in-out infinite;
        }

        .hologram-backdrop::before {
          content: '';
          position: absolute;
          inset: -1px;
          background: linear-gradient(45deg, 
            rgba(196, 181, 253, 0.2), 
            rgba(134, 239, 172, 0.15), 
            rgba(196, 181, 253, 0.2)
          );
          border-radius: 21px 13px 21px 9px;
          filter: blur(4px);
          z-index: -1;
          animation: soft-glow 6s ease-in-out infinite;
        }

        .hologram-content {
          position: relative;
          padding: 0;
          z-index: 2;
          width: 100%;
          box-sizing: border-box;
        }

        .hologram-header {
          margin-bottom: 0;
          text-align: left;
          padding: 16px;
          border-radius: 20px 12px 0 0;
        }

        .hologram-title {
          font-size: 18px;
          font-weight: 600;
          color: rgba(34, 34, 34, 0.95);
          text-shadow: 
            0 0 8px rgba(255, 255, 255, 0.4), 
            0 1px 2px rgba(134, 239, 172, 0.3);
          margin: 0;
          line-height: 1.3;
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
        }

        .territorial-grid {
          display: grid;
          gap: 8px;
          background: rgba(255, 255, 255, 0.95);
          padding: 16px;
          border-radius: 0 0 20px 8px;
          backdrop-filter: blur(2px);
        }

        .territory-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 6px 0;
          border-bottom: 1px solid rgba(34, 34, 34, 0.15);
          min-height: 24px;
          transition: all 0.3s ease;
        }

        .territory-item:last-child {
          border-bottom: none;
        }

        .territory-item:hover {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          transform: scale(1.01);
        }

        .territory-label {
          font-size: 13px;
          color: rgba(55, 65, 81, 0.8);
          text-transform: uppercase;
          letter-spacing: 0.6px;
          text-shadow: none;
          font-weight: 500;
          flex-shrink: 0;
          margin-right: 12px;
        }

        .territory-value {
          font-size: 13px;
          font-weight: 600;
          color: rgba(31, 41, 55, 0.95);
          text-shadow: none;
          text-align: right;
          flex: 1;
          word-wrap: break-word;
          overflow-wrap: break-word;
          line-height: 1.2;
        }

        .hologram-particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: 18px 10px 18px 6px;
          overflow: hidden;
        }

        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: rgba(134, 239, 172, 0.6);
          border-radius: 50%;
          animation: gentle-spore-float linear infinite;
          box-shadow: 
            0 0 4px rgba(134, 239, 172, 0.4),
            0 0 2px rgba(255, 255, 255, 0.2);
        }

        .particle:nth-child(2n) {
          background: rgba(196, 181, 253, 0.5);
          box-shadow: 
            0 0 3px rgba(196, 181, 253, 0.3),
            0 0 1px rgba(255, 255, 255, 0.15);
        }

        .projection-lines {
          position: absolute;
          ${adjustedPosition.arrowPosition === 'left' ? 'left: 20px;' : 
            adjustedPosition.arrowPosition === 'right' ? 'right: 20px;' : 
            'left: 50%; transform: translateX(-50%);'}
          bottom: -20px;
          width: 1px;
          height: 20px;
        }

        .line {
          position: absolute;
          background: linear-gradient(
            to bottom,
            rgba(134, 239, 172, 0.6),
            rgba(196, 181, 253, 0.3),
            transparent
          );
          animation: gentle-pulse 3s ease-in-out infinite;
          border-radius: 0.5px;
        }

        .line-1 {
          left: 0;
          width: 1px;
          height: 100%;
          animation-delay: 0s;
        }

        .line-2 {
          left: -2px;
          width: 1px;
          height: 80%;
          animation-delay: 0.5s;
          opacity: 0.6;
        }

        .line-3 {
          left: 2px;
          width: 1px;
          height: 60%;
          animation-delay: 1s;
          opacity: 0.4;
        }

        @keyframes bio-growth {
          0% {
            opacity: 0;
            transform: scale(0.85) translateY(8px);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.03) translateY(-2px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes gentle-spore-float {
          0% {
            transform: translateY(110%) scale(0) rotate(0deg);
            opacity: 0;
          }
          20% {
            opacity: 0.7;
            transform: translateY(90%) scale(1) rotate(15deg);
          }
          80% {
            opacity: 0.3;
            transform: translateY(20%) scale(0.9) rotate(330deg);
          }
          100% {
            transform: translateY(0%) scale(0) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes gentle-pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scaleY(0.95);
          }
          50% {
            opacity: 0.6;
            transform: scaleY(1.1);
          }
        }

        @keyframes gentle-breath {
          0%, 100% {
            border-color: rgba(196, 181, 253, 0.6);
            box-shadow: 
              0 12px 30px rgba(134, 239, 172, 0.15),
              0 4px 16px rgba(196, 181, 253, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
            transform: scale(1);
          }
          50% {
            border-color: rgba(196, 181, 253, 0.7);
            box-shadow: 
              0 16px 40px rgba(134, 239, 172, 0.2),
              0 6px 20px rgba(196, 181, 253, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.25);
            transform: scale(1.005);
          }
        }

        @keyframes soft-glow {
          0%, 100% {
            opacity: 0.3;
            filter: blur(4px) hue-rotate(0deg);
          }
          50% {
            opacity: 0.5;
            filter: blur(6px) hue-rotate(5deg);
          }
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          .hologram-content {
            padding: 12px;
          }
          
          .hologram-title {
            font-size: 16px;
          }
          
          .territory-label {
            font-size: 11px;
            letter-spacing: 0.5px;
          }
          
          .territory-value {
            font-size: 11px;
          }
          
          .territorial-grid {
            gap: 6px;
          }
          
          .territory-item {
            padding: 4px 0;
            min-height: 20px;
          }
        }
        
        @media (max-width: 480px) {
          .hologram-content {
            padding: 10px;
          }
          
          .hologram-title {
            font-size: 14px;
          }
          
          .territory-label {
            font-size: 10px;
          }
          
          .territory-value {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default BioacousticTooltip;