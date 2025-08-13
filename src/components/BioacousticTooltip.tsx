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

  return (
    <div 
      className="bioacoustic-hologram-tooltip"
      style={{
        position: 'fixed',
        left: position.x - 100, // Center horizontally
        top: position.y - 160, // Position above marker
        zIndex: 1000,
        pointerEvents: 'none',
        transform: 'translate3d(0, 0, 0)', // Force hardware acceleration
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
        .bioacoustic-hologram-tooltip {
          width: 200px;
          max-width: 90vw;
        }

        .hologram-container {
          position: relative;
          transform-style: preserve-3d;
          animation: hologram-materialize 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hologram-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.92);
          border: 2px solid #00ffff;
          border-radius: 12px;
          box-shadow: 
            0 8px 32px rgba(0, 255, 255, 0.3),
            0 0 20px rgba(0, 255, 255, 0.2),
            inset 0 1px 0 rgba(0, 255, 255, 0.1);
          transform: rotateX(5deg) rotateY(-2deg);
          animation: border-pulse 2s ease-in-out infinite;
        }

        .hologram-content {
          position: relative;
          padding: 12px;
          z-index: 2;
        }

        .hologram-header {
          margin-bottom: 8px;
          text-align: center;
        }

        .hologram-title {
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          text-shadow: 0 0 12px rgba(255, 255, 255, 0.8), 0 0 6px #00ffff;
          margin: 0;
          line-height: 1.2;
        }

        .territorial-grid {
          display: grid;
          gap: 6px;
        }

        .territory-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0;
          border-bottom: 1px solid rgba(0, 255, 255, 0.2);
        }

        .territory-item:last-child {
          border-bottom: none;
        }

        .territory-label {
          font-size: 12px;
          color: #00ffff;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          text-shadow: 0 0 6px rgba(0, 255, 255, 0.6);
          font-weight: 500;
        }

        .territory-value {
          font-size: 12px;
          font-weight: 500;
          color: #ffffff;
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
          max-width: 120px;
          text-align: right;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
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

        @keyframes border-pulse {
          0%, 100% {
            border-color: #00ffff;
            box-shadow: 
              0 8px 32px rgba(0, 255, 255, 0.3),
              0 0 20px rgba(0, 255, 255, 0.2),
              inset 0 1px 0 rgba(0, 255, 255, 0.1);
          }
          50% {
            border-color: #00cccc;
            box-shadow: 
              0 8px 32px rgba(0, 255, 255, 0.5),
              0 0 30px rgba(0, 255, 255, 0.4),
              inset 0 1px 0 rgba(0, 255, 255, 0.2);
          }
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          .bioacoustic-hologram-tooltip {
            width: 180px;
          }
          
          .hologram-content {
            padding: 10px;
          }
          
          .hologram-title {
            font-size: 13px;
          }
          
          .territory-label {
            font-size: 9px;
          }
          
          .territory-value {
            font-size: 10px;
            max-width: 100px;
          }
        }
      `}</style>
    </div>
  );
};

export default BioacousticTooltip;