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
            rgba(16, 185, 129, 0.96), 
            rgba(5, 150, 105, 0.98)
          );
          border: 2px solid rgba(168, 85, 247, 0.8);
          border-radius: 20px 12px 20px 8px;
          backdrop-filter: blur(12px);
          box-shadow: 
            0 20px 50px rgba(16, 185, 129, 0.3),
            0 8px 32px rgba(168, 85, 247, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 rgba(16, 185, 129, 0.2);
          animation: living-breath 3s ease-in-out infinite;
        }

        .hologram-backdrop::before {
          content: '';
          position: absolute;
          inset: -2px;
          background: linear-gradient(45deg, 
            rgba(168, 85, 247, 0.4), 
            rgba(16, 185, 129, 0.3), 
            rgba(168, 85, 247, 0.4)
          );
          border-radius: 22px 14px 22px 10px;
          filter: blur(8px);
          z-index: -1;
          animation: bio-glow 4s ease-in-out infinite;
        }

        .hologram-content {
          position: relative;
          padding: 16px;
          z-index: 2;
          width: 100%;
          box-sizing: border-box;
        }

        .hologram-header {
          margin-bottom: 12px;
          text-align: left;
        }

        .hologram-title {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          text-shadow: 
            0 0 20px rgba(255, 255, 255, 0.9), 
            0 0 12px rgba(16, 185, 129, 0.8),
            0 2px 6px rgba(0, 0, 0, 0.3);
          margin: 0;
          line-height: 1.3;
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
        }

        .territorial-grid {
          display: grid;
          gap: 8px;
          margin-top: 4px;
        }

        .territory-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 6px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          min-height: 24px;
          transition: all 0.3s ease;
        }

        .territory-item:last-child {
          border-bottom: none;
        }

        .territory-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          transform: scale(1.02);
        }

        .territory-label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.9);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          text-shadow: 0 0 10px rgba(168, 85, 247, 0.6);
          font-weight: 600;
          flex-shrink: 0;
          margin-right: 12px;
        }

        .territory-value {
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          text-shadow: 
            0 0 15px rgba(255, 255, 255, 0.8),
            0 1px 3px rgba(0, 0, 0, 0.3);
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
          width: 3px;
          height: 3px;
          background: rgba(16, 185, 129, 0.9);
          border-radius: 50%;
          animation: spore-float linear infinite;
          box-shadow: 
            0 0 12px rgba(16, 185, 129, 0.8),
            0 0 6px rgba(255, 255, 255, 0.4);
        }

        .particle:nth-child(2n) {
          background: rgba(168, 85, 247, 0.7);
          box-shadow: 
            0 0 10px rgba(168, 85, 247, 0.6),
            0 0 4px rgba(255, 255, 255, 0.3);
        }

        .projection-lines {
          position: absolute;
          ${adjustedPosition.arrowPosition === 'left' ? 'left: 20px;' : 
            adjustedPosition.arrowPosition === 'right' ? 'right: 20px;' : 
            'left: 50%; transform: translateX(-50%);'}
          bottom: -20px;
          width: 2px;
          height: 20px;
        }

        .line {
          position: absolute;
          background: linear-gradient(
            to bottom,
            rgba(16, 185, 129, 0.9),
            rgba(168, 85, 247, 0.5),
            transparent
          );
          animation: bio-pulse 2.5s ease-in-out infinite;
          border-radius: 1px;
        }

        .line-1 {
          left: 0;
          width: 2px;
          height: 100%;
          animation-delay: 0s;
        }

        .line-2 {
          left: -3px;
          width: 1px;
          height: 80%;
          animation-delay: 0.4s;
          opacity: 0.7;
        }

        .line-3 {
          left: 3px;
          width: 1px;
          height: 60%;
          animation-delay: 0.8s;
          opacity: 0.5;
        }

        @keyframes bio-growth {
          0% {
            opacity: 0;
            transform: scale(0.7) translateY(15px);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.08) translateY(-3px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes spore-float {
          0% {
            transform: translateY(120%) scale(0) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translateY(100%) scale(1) rotate(20deg);
          }
          85% {
            opacity: 0.6;
            transform: translateY(10%) scale(0.8) rotate(340deg);
          }
          100% {
            transform: translateY(-10%) scale(0) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes bio-pulse {
          0%, 100% {
            opacity: 0.4;
            transform: scaleY(0.9) scaleX(1);
          }
          50% {
            opacity: 0.9;
            transform: scaleY(1.3) scaleX(1.2);
          }
        }

        @keyframes living-breath {
          0%, 100% {
            border-color: rgba(168, 85, 247, 0.8);
            box-shadow: 
              0 20px 50px rgba(16, 185, 129, 0.3),
              0 8px 32px rgba(168, 85, 247, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
            transform: scale(1);
          }
          50% {
            border-color: rgba(168, 85, 247, 0.9);
            box-shadow: 
              0 25px 60px rgba(16, 185, 129, 0.4),
              0 12px 40px rgba(168, 85, 247, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.15);
            transform: scale(1.01);
          }
        }

        @keyframes bio-glow {
          0%, 100% {
            opacity: 0.6;
            filter: blur(8px) hue-rotate(0deg);
          }
          50% {
            opacity: 0.8;
            filter: blur(12px) hue-rotate(10deg);
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