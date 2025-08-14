import React, { useState, useEffect } from 'react';
import { useBiodiversityData } from '../hooks/useBiodiversityData';
import { useLexiconData } from '../hooks/useLexiconData';
import { useLatestSnapshotsForMarche } from '../hooks/useSnapshotData';
import { BiodiversitySpecies } from '../types/biodiversity';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ChevronDown, ChevronUp, Leaf, Bird, Bug, Thermometer, Droplets, Home } from 'lucide-react';

interface BioacousticTooltipProps {
  marche: {
    id: string;
    nomMarche?: string;
    nom_marche?: string;
    ville: string;
    departement: string;
    region: string;
    latitude: number;
    longitude: number;
  };
  position: { x: number; y: number };
  visible: boolean;
  radius?: number;
  onClose?: () => void;
}

const BioacousticTooltip: React.FC<BioacousticTooltipProps> = ({ 
  marche, 
  position, 
  visible,
  radius = 0.5,
  onClose 
}) => {
  const [showBiodiversity, setShowBiodiversity] = useState(false);
  
  const { data: biodiversityData, isLoading: biodiversityLoading } = useBiodiversityData({
    latitude: marche.latitude,
    longitude: marche.longitude,
    radius: radius,
    dateFilter: 'recent'
  });

  const { data: lexiconData, isLoading: lexiconLoading } = useLexiconData(
    marche.latitude,
    marche.longitude
  );

  const { data: snapshots, isLoading: snapshotsLoading } = useLatestSnapshotsForMarche(marche.id);

  if (!visible) return null;

  // Smart positioning system for mobile
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
  const tooltipWidth = Math.min(380, viewportWidth * 0.9);
  const tooltipHeight = showBiodiversity ? 400 : 180;
  const padding = 10;
  
  // Calculate if tooltip would overflow on each side
  const wouldOverflowRight = position.x + tooltipWidth / 2 > viewportWidth - padding;
  const wouldOverflowLeft = position.x - tooltipWidth / 2 < padding;
  const wouldOverflowBottom = position.y + tooltipHeight > viewportHeight - padding;
  const wouldOverflowTop = position.y - tooltipHeight < padding;
  
  // Determine optimal positioning
  let left: number;
  let top: number;
  let arrowPosition = 'center';
  
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
    top = position.y - tooltipHeight - 20;
  } else if (wouldOverflowTop) {
    top = position.y + 20;
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
        pointerEvents: 'auto',
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
              {marche.nom_marche || marche.nomMarche || marche.ville}
            </h3>
          </div>
          
          {/* Territorial info grid */}
          <div className="territorial-grid">
            <div className="territory-item">
              <span className="territory-label">Commune</span>
              <span className="territory-value">{marche.ville}</span>
            </div>
            <div className="territory-item">
              <span className="territory-label">Département</span>
              <span className="territory-value">{marche.departement}</span>
            </div>
            <div className="territory-item">
              <span className="territory-label">Région</span>
              <span className="territory-value">{marche.region}</span>
            </div>
            <div className="territory-item">
              <span className="territory-label">Coordonnées</span>
              <span className="territory-value">
                {marche.latitude?.toFixed(4)}, {marche.longitude?.toFixed(4)}
              </span>
            </div>
            
            {lexiconData?.data && (
              <>
                <div className="territory-item">
                  <span className="territory-label">Surface</span>
                  <span className="territory-value">
                    {lexiconData.data.surface_ha ? `${lexiconData.data.surface_ha} ha` : 'N/A'}
                  </span>
                </div>
                {lexiconData.data.culture_type && (
                  <div className="territory-item">
                    <span className="territory-label">Culture</span>
                    <span className="territory-value">{lexiconData.data.culture_type}</span>
                  </div>
                )}
                {lexiconData.data.certification_bio && (
                  <div className="territory-item">
                    <span className="territory-label">Bio</span>
                    <span className="territory-value">✓ Certifié</span>
                  </div>
                )}
              </>
            )}

            {/* Biodiversity & Dynamic Section */}
            <div className="biodiversity-section">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBiodiversity(!showBiodiversity)}
                className="biodiversity-toggle"
              >
                <Leaf className="w-4 h-4 mr-2" />
                Biodiversité et dynamique locale
                {showBiodiversity ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
              </Button>

              {showBiodiversity && (
                <div className="biodiversity-details">
                  {/* Biodiversité locale */}
                  <div className="biodiversity-group">
                    <h4 className="biodiversity-subtitle">
                      <Bird className="w-4 h-4 mr-1" />
                      Biodiversité locale ({radius < 1 ? `${Math.round(radius * 1000)}m` : `${radius}km`})
                    </h4>
                    <div className="biodiversity-grid">
                      <div className="bio-item">
                        <span className="bio-label">FLORE</span>
                        <span className="bio-value">
                          {biodiversityData?.summary.plants || snapshots?.biodiversity?.plants_count || 0}
                        </span>
                      </div>
                      <div className="bio-item">
                        <span className="bio-label">FAUNE</span>
                        <span className="bio-value">
                          {biodiversityData?.summary.birds || snapshots?.biodiversity?.birds_count || 0}
                        </span>
                      </div>
                      <div className="bio-item">
                        <span className="bio-label">AUTRES</span>
                        <span className="bio-value">
                          {((biodiversityData?.summary.fungi || 0) + (biodiversityData?.summary.others || 0)) || ((snapshots?.biodiversity?.fungi_count || 0) + (snapshots?.biodiversity?.others_count || 0))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Relevés météorologiques */}
                  {snapshots?.weather && (
                    <div className="biodiversity-group">
                      <h4 className="biodiversity-subtitle">
                        <Thermometer className="w-4 h-4 mr-1" />
                        Relevés météorologiques
                      </h4>
                      <div className="weather-grid">
                        <div className="weather-item">
                          <span className="weather-label">Température</span>
                          <span className="weather-value">
                            Moy: {snapshots.weather.temperature_avg?.toFixed(1)}°C | 
                            Min: {snapshots.weather.temperature_min?.toFixed(1)}°C | 
                            Max: {snapshots.weather.temperature_max?.toFixed(1)}°C
                          </span>
                        </div>
                        <div className="weather-item">
                          <span className="weather-label">Humidité</span>
                          <span className="weather-value">
                            Moy: {snapshots.weather.humidity_avg?.toFixed(0)}% | 
                            Min: {snapshots.weather.humidity_min?.toFixed(0)}% | 
                            Max: {snapshots.weather.humidity_max?.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Transactions immobilières */}
                  {snapshots?.realEstate && snapshots.realEstate.transactions_count > 0 && (
                    <div className="biodiversity-group">
                      <h4 className="biodiversity-subtitle">
                        <Home className="w-4 h-4 mr-1" />
                        Transactions immobilières
                      </h4>
                      <div className="real-estate-summary">
                        <div className="estate-item">
                          <span className="estate-label">Nombre de transactions</span>
                          <span className="estate-value">{snapshots.realEstate.transactions_count}</span>
                        </div>
                        {snapshots.realEstate.avg_price_m2 && (
                          <div className="estate-item">
                            <span className="estate-label">Prix moyen/m²</span>
                            <span className="estate-value">{snapshots.realEstate.avg_price_m2.toFixed(0)}€</span>
                          </div>
                        )}
                      </div>
                      {snapshots.realEstate.transactions_data && Array.isArray(snapshots.realEstate.transactions_data) && (
                        <div className="transactions-list">
                          {snapshots.realEstate.transactions_data.slice(0, 3).map((transaction: any, index: number) => (
                            <div key={index} className="transaction-item">
                              <span className="transaction-date">{transaction.date || 'N/A'}</span>
                              <span className="transaction-type">{transaction.type || 'N/A'}</span>
                              <span className="transaction-price">{transaction.montant ? `${transaction.montant.toLocaleString()}€` : 'N/A'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
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
          max-width: 180px;
        }

        .biodiversity-section {
          margin-top: 16px;
          border-top: 1px solid rgba(209, 213, 219, 0.3);
          padding-top: 16px;
        }

        .biodiversity-toggle {
          width: 100%;
          justify-content: flex-start;
          padding: 8px 12px;
          background: rgba(34, 197, 94, 0.1);
          color: rgba(34, 197, 94, 0.9);
          border-radius: 8px;
          transition: all 0.2s ease;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .biodiversity-toggle:hover {
          background: rgba(34, 197, 94, 0.15);
        }

        .biodiversity-details {
          margin-top: 12px;
          padding: 12px;
          background: rgba(248, 250, 252, 0.8);
          border-radius: 8px;
          border: 1px solid rgba(226, 232, 240, 0.5);
        }

        .biodiversity-group {
          margin-bottom: 16px;
        }

        .biodiversity-group:last-child {
          margin-bottom: 0;
        }

        .biodiversity-subtitle {
          font-size: 12px;
          font-weight: 600;
          color: rgba(75, 85, 99, 0.9);
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .biodiversity-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .bio-item {
          text-align: center;
          padding: 8px 4px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 6px;
          border: 1px solid rgba(226, 232, 240, 0.5);
        }

        .bio-label {
          display: block;
          font-size: 10px;
          font-weight: 500;
          color: rgba(107, 114, 128, 0.8);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }

        .bio-value {
          display: block;
          font-size: 16px;
          font-weight: 700;
          color: rgba(59, 130, 246, 0.9);
        }

        .weather-grid {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .weather-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 8px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 6px;
          border: 1px solid rgba(226, 232, 240, 0.5);
        }

        .weather-label {
          font-size: 11px;
          font-weight: 500;
          color: rgba(75, 85, 99, 0.8);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .weather-value {
          font-size: 11px;
          font-weight: 600;
          color: rgba(37, 99, 235, 0.9);
        }

        .real-estate-summary {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 12px;
        }

        .estate-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 8px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 6px;
          border: 1px solid rgba(226, 232, 240, 0.5);
        }

        .estate-label {
          font-size: 11px;
          font-weight: 500;
          color: rgba(75, 85, 99, 0.8);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .estate-value {
          font-size: 11px;
          font-weight: 600;
          color: rgba(168, 85, 247, 0.9);
        }

        .transactions-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .transaction-item {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 4px;
          font-size: 10px;
        }

        .transaction-date, .transaction-type, .transaction-price {
          color: rgba(55, 65, 81, 0.8);
          font-weight: 500;
        }

        .transaction-price {
          text-align: right;
          font-weight: 600;
          color: rgba(168, 85, 247, 0.9);
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