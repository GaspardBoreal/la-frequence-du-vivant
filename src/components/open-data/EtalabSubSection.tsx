
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { MarcheTechnoSensible } from '../../utils/googleSheetsApi';
import { RegionalTheme } from '../../utils/regionalThemes';
import { useSentinelHub } from '../../hooks/useSentinelHub';
import PoeticSatelliteHero from '../satellite/PoeticSatelliteHero';
import SatelliteVisualizationPanel from '../satellite/SatelliteVisualizationPanel';
import NDVITimeSeriesChart from '../satellite/NDVITimeSeriesChart';

interface EtalabSubSectionProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
}

const EtalabSubSection: React.FC<EtalabSubSectionProps> = ({ marche, theme }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  console.log('🔍 EtalabSubSection INIT:', { 
    marcheVille: marche.ville,
    coordinates: { lat: marche.latitude, lng: marche.longitude }
  });
  
  const {
    satelliteImage,
    ndviTimeSeries,
    isLoading,
    selectedDate,
    setSelectedDate,
    visualizationType,
    setVisualizationType,
    generateHaiku,
    refetch
  } = useSentinelHub(marche.latitude || 0, marche.longitude || 0);

  console.log('🔍 Hook data:', {
    hasImage: !!satelliteImage,
    hasTimeSeries: !!ndviTimeSeries,
    isLoading,
    selectedDate,
    visualizationType
  });

  const currentNDVI = (() => {
    if (!ndviTimeSeries || !ndviTimeSeries.dates || !selectedDate) {
      return undefined;
    }
    const dateIndex = ndviTimeSeries.dates.indexOf(selectedDate);
    return dateIndex >= 0 ? ndviTimeSeries.ndviValues[dateIndex] : undefined;
  })();

  const currentSeason = (() => {
    const month = new Date(selectedDate).getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer'; 
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  })();

  const haiku = currentNDVI ? generateHaiku(currentNDVI, currentSeason) : undefined;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      {(() => {
        try {
          console.log('🔍 Rendering PoeticSatelliteHero...');
          return (
            <PoeticSatelliteHero
              satelliteImage={satelliteImage}
              isLoading={isLoading}
              currentNDVI={currentNDVI}
              haiku={haiku}
              onRefresh={refetch}
            />
          );
        } catch (error) {
          console.error('❌ Error in PoeticSatelliteHero:', error);
          return <div className="p-4 bg-red-100 rounded">Erreur PoeticSatelliteHero: {error?.message}</div>;
        }
      })()}

      {/* Expandable Observatory Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-full shadow-lg text-lg"
        >
          <Sparkles className="h-6 w-6 mr-3" />
          {isExpanded ? 'Réduire l\'Observatoire' : 'Ouvrir l\'Observatoire Vivant'}
        </Button>
      </motion.div>

      {/* Simplified Observatory Interface */}
      {isExpanded && (
        <div className="space-y-8">
          {/* Temporary simplified interface to avoid render loops */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 border-2 border-indigo-200/50">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-crimson font-bold text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text">
                Dashboard 4D - Espace × Temps × Biodiversité
              </h3>
              
              <p className="text-slate-600 max-w-2xl mx-auto">
                Fusion des données satellites avec les observations terrain pour créer une symphonie visuelle 
                de la vie en mouvement sur {marche.ville}.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-white/60 rounded-xl p-4">
                  <div className="text-sm text-slate-600">Évolution NDVI</div>
                  <div className="text-2xl font-bold text-green-600">
                    {currentNDVI ? `+${((currentNDVI - 0.3) * 100).toFixed(0)}%` : '---'}
                  </div>
                </div>
                
                <div className="bg-white/60 rounded-xl p-4">
                  <div className="text-sm text-slate-600">Passages Satellites</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {ndviTimeSeries?.dates.length || 0}
                  </div>
                </div>
                
                <div className="bg-white/60 rounded-xl p-4">
                  <div className="text-sm text-slate-600">Saison Poétique</div>
                  <div className="text-2xl font-bold text-purple-600 capitalize">
                    {currentSeason === 'spring' && 'Printemps'}
                    {currentSeason === 'summer' && 'Été'}
                    {currentSeason === 'autumn' && 'Automne'}
                    {currentSeason === 'winter' && 'Hiver'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Access Sentinel Hub */}
          <div className="text-center pt-6">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-full shadow-lg"
              onClick={() => window.open('https://apps.sentinel-hub.com/eo-browser/', '_blank')}
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Explorer Sentinel Hub
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EtalabSubSection;
