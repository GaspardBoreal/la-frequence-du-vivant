import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, TreePine, Volume2 } from 'lucide-react';
import { MarcheTechnoSensible } from '../../utils/googleSheetsApi';
import { RegionalTheme } from '../../utils/regionalThemes';
import { useRealClimateProjections } from '../../hooks/useRealClimateProjections';
import ClimateTimeMachine from '../climate/ClimateTimeMachine';
import BiodiversityRiskRadar from '../biodiversity/BiodiversityRiskRadar';
import TemporalSelector from '../ui/temporal-selector';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import TransparencyBadge from './TransparencyBadge';

interface ProjectionsSubSectionProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
}

const ProjectionsSubSection: React.FC<ProjectionsSubSectionProps> = ({ marche, theme }) => {
  const [activeYear, setActiveYear] = useState(2025);
  const [activeTab, setActiveTab] = useState('climate');
  
  console.log('🔮 ProjectionsSubSection INIT:', { 
    marcheVille: marche.ville,
    coordinates: { lat: marche.latitude, lng: marche.longitude }
  });
  
  const {
    data: projectionsData,
    isLoading,
    error
  } = useRealClimateProjections(marche.latitude || 0, marche.longitude || 0);

  const handleYearChange = (year: number) => {
    setActiveYear(year);
    console.log('🕐 Year changed to:', year);
  };

  // Future Soundscape simulation
  const getCurrentSoundscape = () => {
    if (!projectionsData?.futureSoundscapes) return null;
    
    const yearMapping: Record<number, '2025' | '2035' | '2045'> = {
      2025: '2025',
      2035: '2035', 
      2045: '2045'
    };
    
    const targetYear = yearMapping[activeYear] || '2025';
    return projectionsData.futureSoundscapes.find(s => s.scenario === targetYear || s.year.toString() === targetYear);
  };

  const currentSoundscape = getCurrentSoundscape();

  if (error) {
    return (
      <div className="bg-red-950/50 border border-red-500/30 rounded-xl p-6 text-center">
        <div className="text-red-400 font-medium">
          Erreur lors du chargement des projections climatiques
        </div>
        <p className="text-red-300/70 text-sm mt-2">
          Impossible de générer les données prospectives pour {marche.ville}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section - Immersive Dark Theme */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 border border-emerald-500/20 p-8 mb-8 overflow-hidden"
      >
        {/* Animated particles background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-emerald-400/30 rounded-full"
              animate={{
                y: [0, -300],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 6 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "easeOut"
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: '100%',
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center space-y-6">
          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-block"
          >
            <span className="text-xs text-emerald-400/80 tracking-[0.3em] uppercase font-medium bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
              Projections Open Data 2025 → 2045
            </span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl md:text-4xl font-bold text-transparent bg-gradient-to-r from-white via-emerald-100 to-emerald-300 bg-clip-text"
          >
            Machine à Voyager dans le Temps Climatique
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-emerald-100/70 max-w-2xl mx-auto leading-relaxed"
          >
            Explorez les transformations climatiques de{' '}
            <span className="text-emerald-300 font-semibold">{marche.ville}</span>{' '}
            à travers trois horizons temporels.
          </motion.p>

          {/* Transparency Badge Component */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <TransparencyBadge
              latitude={marche.latitude || 0}
              longitude={marche.longitude || 0}
              dataSource={projectionsData?.dataSource || 'estimated'}
              methodology={projectionsData?.methodology}
            />
          </motion.div>

          {/* Active Year Indicator */}
          <motion.div
            className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-full px-6 py-3 border border-emerald-500/30"
            key={activeYear}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Clock className="h-5 w-5 text-emerald-400" />
            <span className="font-semibold text-emerald-100">
              Vision temporelle active : <span className="text-emerald-300">{activeYear}</span>
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Tabs Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="climate" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Climat Futur
          </TabsTrigger>
          <TabsTrigger value="biodiversity" className="flex items-center gap-2">
            <TreePine className="h-4 w-4" />
            Biodiversité Vision
          </TabsTrigger>
          <TabsTrigger value="soundscape" className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Symphonie du Futur
          </TabsTrigger>
        </TabsList>


        {/* Climate Projections Tab */}
        <TabsContent value="climate" className="space-y-6">
          {projectionsData?.climateProjections ? (
            <ClimateTimeMachine
              projections={projectionsData.climateProjections}
              onYearChange={handleYearChange}
              isLoading={isLoading}
            />
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-blue-200 rounded-lg w-1/2 mx-auto"></div>
                <div className="h-32 bg-blue-200 rounded-xl"></div>
              </div>
              <p className="text-blue-600 mt-4">Génération des projections climatiques...</p>
            </div>
          )}
        </TabsContent>

        {/* Biodiversity Tab */}
        <TabsContent value="biodiversity" className="space-y-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl p-8 border-2 border-green-200/50">
            <TemporalSelector
              activeYear={activeYear}
              onYearChange={handleYearChange}
              title="Biodiversité Vision"
            />
            {projectionsData?.biodiversityProjections ? (
              <BiodiversityRiskRadar
                projections={projectionsData.biodiversityProjections}
                activeYear={activeYear}
              />
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-green-200 rounded-lg w-1/2 mx-auto"></div>
                  <div className="h-32 bg-green-200 rounded-xl"></div>
                </div>
                <p className="text-green-600 mt-4">Analyse des impacts sur la biodiversité...</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Future Soundscapes Tab */}
        <TabsContent value="soundscape" className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-3xl p-8 border-2 border-indigo-200/50">
            <TemporalSelector
              activeYear={activeYear}
              onYearChange={handleYearChange}
              title="Symphonie du Futur"
            />
            <div className="text-center mb-8">
              <p className="text-indigo-700">
                Découvrez comment le paysage sonore de {marche.ville} évoluera avec le climat
              </p>
            </div>

            {currentSoundscape ? (
              <div className="space-y-6">
                {/* Soundscape Characteristics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
                    <div className="text-sm text-indigo-600 mb-1">Diversité Sonore</div>
                    <div className="text-2xl font-bold text-indigo-800">
                      {Math.round(currentSoundscape.soundCharacteristics.diversity * 100)}%
                    </div>
                  </div>
                  
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
                    <div className="text-sm text-indigo-600 mb-1">Pic d'Activité</div>
                    <div className="text-lg font-bold text-indigo-800 capitalize">
                      {currentSoundscape.soundCharacteristics.activity === 'dawn' && 'Aube'}
                      {currentSoundscape.soundCharacteristics.activity === 'day' && 'Jour'}
                      {currentSoundscape.soundCharacteristics.activity === 'dusk' && 'Crépuscule'}
                      {currentSoundscape.soundCharacteristics.activity === 'night' && 'Nuit'}
                    </div>
                  </div>
                  
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
                    <div className="text-sm text-indigo-600 mb-1">Espèces Actives</div>
                    <div className="text-2xl font-bold text-indigo-800">
                      {currentSoundscape.species.filter(s => s.frequency > 0.3).length}
                    </div>
                  </div>
                </div>

                {/* Species Evolution */}
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-indigo-800 mb-4">
                    Évolution des Espèces Sonores
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentSoundscape.species
                      .filter(s => s.frequency > 0.2)
                      .map((species, index) => (
                        <motion.div
                          key={species.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-3 rounded-lg border ${
                            species.newSpecies 
                              ? 'bg-green-50 border-green-200' 
                              : species.frequency < 0.4 
                                ? 'bg-orange-50 border-orange-200'
                                : 'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-800">{species.name}</div>
                              {species.newSpecies && (
                                <div className="text-xs text-green-600 font-medium">✨ Nouvelle espèce</div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold">
                                {Math.round(species.frequency * 100)}%
                              </div>
                              <div className="text-xs text-gray-600">fréquence</div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    }
                  </div>
                </div>

                {/* Dominant Groups */}
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-indigo-800 mb-4">
                    Groupes Dominants {activeYear}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2">
                    {currentSoundscape.soundCharacteristics.dominantGroups.map((group, index) => (
                      <motion.div
                        key={group}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {group}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Future Audio Player Placeholder */}
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 text-center">
                  <Volume2 className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-indigo-800 mb-2">
                    Simulation Audio Future
                  </h3>
                  <p className="text-indigo-600 mb-4">
                    Écoutez la transformation du paysage sonore de {marche.ville} en {activeYear}
                  </p>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                    disabled
                  >
                    🎵 Lecture Future (Bientôt disponible)
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-indigo-200 rounded-lg w-1/2 mx-auto"></div>
                  <div className="h-32 bg-indigo-200 rounded-xl"></div>
                </div>
                <p className="text-indigo-600 mt-4">Génération des paysages sonores futurs...</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white text-center"
      >
        <h3 className="text-xl font-bold mb-2">
          Participez à la Recherche Prospective
        </h3>
        <p className="mb-4 opacity-90">
          Vos observations terrain enrichissent nos modèles prédictifs
        </p>
        <Button 
          variant="secondary" 
          size="lg"
          className="bg-white text-purple-600 hover:bg-gray-100"
        >
          Contribuer aux Données
        </Button>
      </motion.div>
    </div>
  );
};

export default ProjectionsSubSection;