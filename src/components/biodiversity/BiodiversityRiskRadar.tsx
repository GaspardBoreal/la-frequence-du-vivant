import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRight, MapPin, AlertCircle, Sparkles } from 'lucide-react';
import { BiodiversityProjection } from '../../types/climate';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface BiodiversityRiskRadarProps {
  projections: BiodiversityProjection[];
  activeYear: number;
  onSpeciesSelect?: (species: BiodiversityProjection) => void;
}

const BiodiversityRiskRadar: React.FC<BiodiversityRiskRadarProps> = ({
  projections,
  activeYear,
  onSpeciesSelect
}) => {
  const [selectedSpecies, setSelectedSpecies] = useState<BiodiversityProjection | null>(null);
  const [viewMode, setViewMode] = useState<'radar' | 'list'>('radar');

  // Filter species by status and current year
  const getSpeciesByStatus = (status: BiodiversityProjection['status']) => {
    return projections.filter(p => p.status === status);
  };

  const atRiskSpecies = getSpeciesByStatus('at-risk');
  const emergingSpecies = getSpeciesByStatus('emerging');
  const migratingSpecies = getSpeciesByStatus('migrating');
  const stableSpecies = getSpeciesByStatus('stable');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'at-risk': return 'text-red-600 bg-red-50 border-red-200';
      case 'emerging': return 'text-green-600 bg-green-50 border-green-200';
      case 'migrating': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'stable': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'at-risk': return <TrendingDown className="h-4 w-4" />;
      case 'emerging': return <TrendingUp className="h-4 w-4" />;
      case 'migrating': return <ArrowRight className="h-4 w-4" />;
      case 'stable': return <Sparkles className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'at-risk': return 'En danger';
      case 'emerging': return 'Émergente';
      case 'migrating': return 'Migration';
      case 'stable': return 'Stable';
      default: return status;
    }
  };

  // Radar view component
  const RadarView = () => (
    <div className="grid grid-cols-2 gap-8">
      {/* At Risk Species */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-semibold">Espèces à risque</h3>
          </div>
          <Badge variant="destructive">{atRiskSpecies.length}</Badge>
        </div>
        
        <div className="space-y-2">
          {atRiskSpecies.map((species, index) => (
            <motion.div
              key={species.species}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-red-50 border border-red-200 rounded-lg p-3 hover:bg-red-100 cursor-pointer transition-colors"
              onClick={() => setSelectedSpecies(species)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-red-800">{species.commonName}</div>
                  <div className="text-xs text-red-600 italic">{species.species}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-red-600">
                    Confiance: {Math.round(species.confidence * 100)}%
                  </div>
                  {species.migrationDistance && (
                    <div className="text-xs text-red-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      +{species.migrationDistance}km nord
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Emerging Species */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-green-600">
            <TrendingUp className="h-5 w-5" />
            <h3 className="font-semibold">Nouvelles espèces</h3>
          </div>
          <Badge variant="default" className="bg-green-600">{emergingSpecies.length}</Badge>
        </div>
        
        <div className="space-y-2">
          {emergingSpecies.map((species, index) => (
            <motion.div
              key={species.species}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-green-50 border border-green-200 rounded-lg p-3 hover:bg-green-100 cursor-pointer transition-colors"
              onClick={() => setSelectedSpecies(species)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-green-800">{species.commonName}</div>
                  <div className="text-xs text-green-600 italic">{species.species}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-green-600">
                    Confiance: {Math.round(species.confidence * 100)}%
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-300 mt-1">
                    Opportunité
                  </Badge>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  // List view component
  const ListView = () => (
    <div className="space-y-3">
      {projections.map((species, index) => (
        <motion.div
          key={species.species}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`border rounded-lg p-4 hover:shadow-md cursor-pointer transition-all ${getStatusColor(species.status)}`}
          onClick={() => setSelectedSpecies(species)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(species.status)}
              <div>
                <div className="font-medium">{species.commonName}</div>
                <div className="text-xs opacity-70 italic">{species.species}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                {getStatusLabel(species.status)}
              </Badge>
              
              <div className="text-right">
                <div className="text-xs opacity-70">
                  Confiance: {Math.round(species.confidence * 100)}%
                </div>
                {species.migrationDistance && (
                  <div className="text-xs opacity-60 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    +{species.migrationDistance}km
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-3xl p-8 border-2 border-emerald-200/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text">
            Radar Biodiversité {activeYear}
          </h2>
          <p className="text-emerald-700 mt-2">
            Analyse prédictive des impacts climatiques sur les espèces locales
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'radar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('radar')}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Vue Radar
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Vue Liste
          </Button>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{atRiskSpecies.length}</div>
          <div className="text-xs text-red-700">À risque</div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{emergingSpecies.length}</div>
          <div className="text-xs text-green-700">Émergentes</div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-600">{migratingSpecies.length}</div>
          <div className="text-xs text-orange-700">En migration</div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{stableSpecies.length}</div>
          <div className="text-xs text-blue-700">Stables</div>
        </div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {viewMode === 'radar' ? <RadarView /> : <ListView />}
        </motion.div>
      </AnimatePresence>

      {/* Species Detail Modal */}
      <AnimatePresence>
        {selectedSpecies && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedSpecies(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                {getStatusIcon(selectedSpecies.status)}
                <div>
                  <h3 className="text-xl font-bold">{selectedSpecies.commonName}</h3>
                  <p className="text-sm text-gray-600 italic">{selectedSpecies.species}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Statut:</span>
                  <Badge className={getStatusColor(selectedSpecies.status)}>
                    {getStatusLabel(selectedSpecies.status)}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Confiance:</span>
                  <span className="text-sm">{Math.round(selectedSpecies.confidence * 100)}%</span>
                </div>
                
                {selectedSpecies.migrationDistance && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Migration:</span>
                    <span className="text-sm">+{selectedSpecies.migrationDistance}km vers le nord</span>
                  </div>
                )}
                
                {selectedSpecies.story && (
                  <div className="bg-gray-50 rounded-lg p-3 mt-4">
                    <p className="text-sm text-gray-700 italic">"{selectedSpecies.story}"</p>
                  </div>
                )}
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setSelectedSpecies(null)}
              >
                Fermer
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BiodiversityRiskRadar;