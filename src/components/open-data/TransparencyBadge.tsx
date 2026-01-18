import React, { useState } from 'react';
import { Database, MapPin, Thermometer, Shield, ExternalLink, Mountain } from 'lucide-react';
import { Button } from '../ui/button';
import MethodologyDialog from './MethodologyDialog';

interface TransparencyBadgeProps {
  latitude: number;
  longitude: number;
  dataSource: 'real' | 'estimated';
  methodology?: {
    apiUrl: string;
    altitude: number;
    oceanDistance: number;
    scenariosUsed: string[];
    rawDataSummary: {
      tempAvg: number;
      precipTotal: number;
      dataRange: string;
    };
  };
}

const TransparencyBadge: React.FC<TransparencyBadgeProps> = ({
  latitude,
  longitude,
  dataSource,
  methodology
}) => {
  const [showMethodology, setShowMethodology] = useState(false);
  
  const apiUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}`;
  const isRealData = dataSource === 'real';

  return (
    <>
      <div className="flex flex-wrap justify-center gap-3 mt-6">
        {/* Source de données */}
        <a
          href={apiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm hover:bg-emerald-500/20 transition-all duration-300 group"
        >
          <Database className="h-4 w-4" />
          <span>{isRealData ? 'Open-Meteo Archive API' : 'Estimation géographique'}</span>
          <ExternalLink className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
        </a>

        {/* Coordonnées GPS */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm">
          <MapPin className="h-4 w-4 text-emerald-400" />
          <span>{latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E</span>
        </div>

        {/* Altitude estimée */}
        {methodology?.altitude && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm">
            <Mountain className="h-4 w-4 text-blue-400" />
            <span>~{methodology.altitude}m d'altitude</span>
          </div>
        )}

        {/* Scénarios GIEC */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm">
          <Thermometer className="h-4 w-4" />
          <span>Scénarios SSP2-4.5 / SSP5-8.5</span>
        </div>

        {/* Bouton méthodologie */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMethodology(true)}
          className="text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 border border-amber-500/20"
        >
          <Shield className="h-4 w-4 mr-2" />
          Vérifier la méthodologie
        </Button>
      </div>

      {/* Modal de méthodologie */}
      <MethodologyDialog
        open={showMethodology}
        onClose={() => setShowMethodology(false)}
        apiUrl={apiUrl}
        latitude={latitude}
        longitude={longitude}
        methodology={methodology}
        dataSource={dataSource}
      />
    </>
  );
};

export default TransparencyBadge;
