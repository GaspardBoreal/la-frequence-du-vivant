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

  // Intelligent positioning with viewport detection
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
  const tooltipWidth = Math.min(320, viewportWidth * 0.85);
  
  // Calculate optimal position to stay in viewport
  let adjustedX = position.x;
  let adjustedY = position.y - 20;
  
  // Horizontal overflow prevention
  if (adjustedX + tooltipWidth/2 > viewportWidth - 20) {
    adjustedX = viewportWidth - tooltipWidth/2 - 20;
  } else if (adjustedX - tooltipWidth/2 < 20) {
    adjustedX = tooltipWidth/2 + 20;
  }
  
  // Vertical overflow prevention
  if (adjustedY - 160 < 20) {
    adjustedY = position.y + 60; // Show below marker
  }

  return (
    <div 
      className="bioacoustic-adaptive-tooltip"
      style={{
        position: 'fixed',
        left: adjustedX - tooltipWidth/2,
        top: adjustedY - 140,
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
          animation: tooltip-appear 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hologram-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.95);
          border: 2px solid #00ffff;
          border-radius: 16px;
          box-shadow: 
            0 12px 40px rgba(0, 255, 255, 0.4),
            0 0 30px rgba(0, 255, 255, 0.3),
            inset 0 1px 0 rgba(0, 255, 255, 0.15);
          animation: border-glow 2s ease-in-out infinite;
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
            0 0 15px rgba(255, 255, 255, 0.9), 
            0 0 8px #00ffff,
            0 2px 4px rgba(0, 0, 0, 0.5);
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
          border-bottom: 1px solid rgba(0, 255, 255, 0.3);
          min-height: 24px;
        }

        .territory-item:last-child {
          border-bottom: none;
        }

        .territory-label {
          font-size: 13px;
          color: #00ffff;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          text-shadow: 0 0 8px rgba(0, 255, 255, 0.8);
          font-weight: 600;
          flex-shrink: 0;
          margin-right: 12px;
        }

        .territory-value {
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          text-shadow: 
            0 0 10px rgba(255, 255, 255, 0.8),
            0 1px 2px rgba(0, 0, 0, 0.5);
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
          border-radius: 12px;
          overflow: hidden;
        }

        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: #00ffff;
          border-radius: 50%;
          animation: particle-float linear infinite;
          box-shadow: 0 0 6px rgba(0, 255, 255, 0.8);
        }

        .projection-lines {
          position: absolute;
          bottom: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 1px;
          height: 20px;
        }

        .line {
          position: absolute;
          background: linear-gradient(
            to bottom,
            rgba(0, 255, 255, 0.8),
            transparent
          );
          animation: projection-pulse 2s ease-in-out infinite;
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
          animation-delay: 0.3s;
          opacity: 0.6;
        }

        .line-3 {
          left: 2px;
          width: 1px;
          height: 60%;
          animation-delay: 0.6s;
          opacity: 0.4;
        }

        @keyframes hologram-materialize {
          0% {
            opacity: 0;
            transform: scale(0.8) rotateX(15deg) translateY(20px);
          }
          60% {
            opacity: 0.8;
            transform: scale(1.05) rotateX(3deg) translateY(-5px);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotateX(5deg) translateY(0);
          }
        }

        @keyframes particle-float {
          0% {
            transform: translateY(100%) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 0.5;
          }
          100% {
            transform: translateY(-20px) scale(1);
            opacity: 0;
          }
        }

        @keyframes projection-pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scaleY(0.8);
          }
          50% {
            opacity: 0.8;
            transform: scaleY(1.2);
          }
        }

        @keyframes tooltip-appear {
          0% {
            opacity: 0;
            transform: scale(0.9) translateY(10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes border-glow {
          0%, 100% {
            border-color: #00ffff;
            box-shadow: 
              0 12px 40px rgba(0, 255, 255, 0.4),
              0 0 30px rgba(0, 255, 255, 0.3),
              inset 0 1px 0 rgba(0, 255, 255, 0.15);
          }
          50% {
            border-color: #00cccc;
            box-shadow: 
              0 12px 40px rgba(0, 255, 255, 0.6),
              0 0 40px rgba(0, 255, 255, 0.5),
              inset 0 1px 0 rgba(0, 255, 255, 0.25);
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