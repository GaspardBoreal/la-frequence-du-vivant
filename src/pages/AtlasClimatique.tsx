import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Thermometer, 
  Map, 
  Clock, 
  Swords, 
  Layers,
  ArrowLeft,
  Globe,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useClimateAtlas } from '@/hooks/useClimateAtlas';
import { ThermoNavigator } from '@/components/climate/ThermoNavigator';
import { FranceClimateMap } from '@/components/climate/FranceClimateMap';
import ClimateTimeMachine from '@/components/climate/ClimateTimeMachine';
import SEOHead from '@/components/SEOHead';

const AtlasClimatique: React.FC = () => {
  const navigate = useNavigate();
  const {
    cities,
    regions,
    thermoState,
    updateThermoLevel,
    setViewMode,
    setYear,
    getCityByLevel,
    getThermometerColor
  } = useClimateAtlas();

  const navigationModes = [
    {
      id: 'thermometer' as const,
      icon: Thermometer,
      title: 'Thermomètre Interactif',
      description: 'Navigation verticale du froid vers l\'extrême chaleur',
      color: 'hsl(0, 85%, 50%)'
    },
    {
      id: 'map' as const,
      icon: Map,
      title: 'Carte Vivante',
      description: 'France interactive avec données géolocalisées',
      color: 'hsl(200, 80%, 60%)'
    },
    {
      id: 'timeline' as const,
      icon: Clock,
      title: 'Machine Temporelle',
      description: 'Voyage entre 2025, 2035 et 2045',
      color: 'hsl(60, 80%, 60%)'
    },
    {
      id: 'battle' as const,
      icon: Swords,
      title: 'Battle Climatique',
      description: 'Comparaison split-screen entre villes',
      color: 'hsl(30, 90%, 55%)'
    },
    {
      id: 'carousel' as const,
      icon: Layers,
      title: 'Carrousel Extrêmes',
      description: 'Navigation 3D entre les territoires',
      color: 'hsl(280, 70%, 60%)'
    }
  ];

  const currentNavMode = navigationModes.find(mode => mode.id === thermoState.viewMode);

  const handleCitySelect = (city: any) => {
    const level = (city.riskScore / 100) * 100;
    updateThermoLevel(level);
  };

  // Génération des projections pour la timeline
  const climateProjections = [
    {
      year: 2025,
      scenario: 'present' as const,
      temperature: { avg: 13.5, min: 5, max: 25, change: 0 },
      precipitation: { total: 650, change: 0 },
      extremeEvents: { heatDays: 25, frostDays: 30, droughtRisk: 'low' as const }
    },
    {
      year: 2035,
      scenario: '2035' as const,
      temperature: { avg: 15.3, min: 7, max: 28, change: 1.8 },
      precipitation: { total: 600, change: -8 },
      extremeEvents: { heatDays: 40, frostDays: 20, droughtRisk: 'medium' as const }
    },
    {
      year: 2045,
      scenario: '2045' as const,
      temperature: { avg: 16.7, min: 9, max: 31, change: 3.2 },
      precipitation: { total: 550, change: -15 },
      extremeEvents: { heatDays: 62, frostDays: 12, droughtRisk: 'high' as const }
    }
  ];

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, 
          hsl(var(--background)) 0%, 
          ${getThermometerColor(thermoState.activeLevel)}10 100%)`
      }}
    >
      <SEOHead
        title="Atlas Climatique France 2045 - Territoires et Réchauffement"
        description="Explorez l'impact du réchauffement climatique sur les villes françaises avec notre atlas interactif. Données Météo France, projections 2025-2045."
        keywords="réchauffement climatique, atlas france, météo france, projections climatiques, villes françaises, 2045"
      />

      {/* Header avec navigation immersive */}
      <motion.header 
        className="relative z-10 p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
            
            <div className="flex items-center gap-3">
              <Globe className="w-8 h-8 text-accent" />
              <div>
                <h1 className="text-2xl font-bold">Atlas Climatique France 2045</h1>
                <p className="text-sm text-muted-foreground">
                  Données officielles Météo-France • Navigation immersive
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {cities.length} villes analysées
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Projections jusqu'en 2045
            </Badge>
          </div>
        </div>
      </motion.header>

      {/* Navigation modes */}
      <motion.div 
        className="relative z-10 px-6 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex justify-center gap-4 max-w-6xl mx-auto">
          {navigationModes.map((mode) => {
            const Icon = mode.icon;
            const isActive = thermoState.viewMode === mode.id;
            
            return (
              <motion.button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`relative p-4 rounded-xl border transition-all ${
                  isActive 
                    ? 'bg-card border-accent shadow-lg' 
                    : 'bg-card/50 border-border hover:bg-card/80'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  boxShadow: isActive ? `0 0 20px ${mode.color}20` : undefined
                }}
              >
                <div className="flex flex-col items-center gap-2 min-w-[120px]">
                  <Icon 
                    className="w-6 h-6" 
                    style={{ color: isActive ? mode.color : undefined }}
                  />
                  <h3 className="font-medium text-sm text-center">{mode.title}</h3>
                  <p className="text-xs text-muted-foreground text-center leading-tight">
                    {mode.description}
                  </p>
                </div>

                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-accent/30"
                    animate={{
                      borderColor: [`${mode.color}30`, `${mode.color}60`, `${mode.color}30`]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Contenu principal avec transitions */}
      <main className="relative z-10 px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={thermoState.viewMode}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5 }}
            >
              {thermoState.viewMode === 'thermometer' && (
                <ThermoNavigator
                  activeLevel={thermoState.activeLevel}
                  selectedCity={thermoState.selectedCity}
                  year={thermoState.year}
                  onLevelChange={updateThermoLevel}
                  onYearChange={setYear}
                  thermometerColor={getThermometerColor(thermoState.activeLevel)}
                />
              )}

              {thermoState.viewMode === 'map' && (
                <FranceClimateMap
                  cities={cities}
                  selectedCity={thermoState.selectedCity}
                  year={thermoState.year}
                  onCitySelect={handleCitySelect}
                />
              )}

              {thermoState.viewMode === 'timeline' && (
                <ClimateTimeMachine
                  projections={climateProjections}
                  onYearChange={(year) => setYear(year as any)}
                />
              )}

              {thermoState.viewMode === 'battle' && (
                <div className="text-center py-20">
                  <h2 className="text-2xl font-bold mb-4">Battle Climatique</h2>
                  <p className="text-muted-foreground">Mode comparaison en développement...</p>
                  <div className="mt-8 grid grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <div className="bg-card border border-border rounded-xl p-6">
                      <h3 className="font-semibold text-destructive">Zone de Danger</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Sélectionnez une ville du Sud exposée aux risques extrêmes
                      </p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-6">
                      <h3 className="font-semibold text-primary">Zone Refuge</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Choisissez une ville du Nord relativement protégée
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {thermoState.viewMode === 'carousel' && (
                <div className="text-center py-20">
                  <h2 className="text-2xl font-bold mb-4">Carrousel des Extrêmes</h2>
                  <p className="text-muted-foreground">Navigation 3D en développement...</p>
                  <div className="mt-8 flex justify-center">
                    <div className="bg-card border border-border rounded-xl p-8 max-w-md">
                      <Layers className="w-12 h-12 mx-auto mb-4 text-accent" />
                      <p className="text-sm text-muted-foreground">
                        Interface immersive pour explorer les territoires français 
                        en 3D selon leur niveau d'exposition climatique
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Background d'ambiance selon le niveau thermique */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-5 z-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, 
            ${getThermometerColor(thermoState.activeLevel)}, 
            transparent 70%)`
        }}
      />
    </div>
  );
};

export default AtlasClimatique;