import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Eye, Users, Clock, MapPin, Activity } from 'lucide-react';
import { BiodiversityIntelligenceData, BiodiversitySignal, TerritorialAlert } from '../../types/biodiversityIntelligence';
import GaspardBorealNarratives from './GaspardBorealNarratives';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface BiodiversityTransitionRadarProps {
  intelligenceData: BiodiversityIntelligenceData;
  activeYear: number;
  onSpeciesSelect?: (species: string) => void;
  onYearChange?: (year: number) => void;
}

const BiodiversityTransitionRadar: React.FC<BiodiversityTransitionRadarProps> = ({
  intelligenceData,
  activeYear,
  onSpeciesSelect,
  onYearChange
}) => {
  const [selectedSignal, setSelectedSignal] = useState<BiodiversitySignal | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<TerritorialAlert | null>(null);
  const [activeTab, setActiveTab] = useState('signals');

  const { signals, territorialAlerts, ecosystemTransition, citizenContributions, gaspardNarratives } = intelligenceData;

  // Categorize signals by type
  const signalsByType = {
    new_arrival: signals.filter(s => s.signalType === 'new_arrival'),
    population_decline: signals.filter(s => s.signalType === 'population_decline'),
    range_shift: signals.filter(s => s.signalType === 'range_shift'),
    phenology_change: signals.filter(s => s.signalType === 'phenology_change')
  };

  const getSignalColor = (type: string) => {
    switch (type) {
      case 'new_arrival': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'population_decline': return 'text-red-600 bg-red-50 border-red-200';
      case 'range_shift': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'phenology_change': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'new_arrival': return <TrendingUp className="h-4 w-4" />;
      case 'population_decline': return <TrendingDown className="h-4 w-4" />;
      case 'range_shift': return <MapPin className="h-4 w-4" />;
      case 'phenology_change': return <Clock className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getSignalLabel = (type: string) => {
    switch (type) {
      case 'new_arrival': return 'Nouvelles arrivées';
      case 'population_decline': return 'Déclin populationnel';
      case 'range_shift': return 'Déplacement territorial';
      case 'phenology_change': return 'Changement phénologique';
      default: return type;
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-300';
      case 'warning': return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'info': return 'text-blue-600 bg-blue-100 border-blue-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const SignalsView = () => (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center bg-emerald-50 border-emerald-200">
          <div className="text-2xl font-bold text-emerald-600">{signalsByType.new_arrival.length}</div>
          <div className="text-xs text-emerald-700">Arrivées</div>
        </Card>
        <Card className="p-4 text-center bg-red-50 border-red-200">
          <div className="text-2xl font-bold text-red-600">{signalsByType.population_decline.length}</div>
          <div className="text-xs text-red-700">Déclins</div>
        </Card>
        <Card className="p-4 text-center bg-blue-50 border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{signalsByType.range_shift.length}</div>
          <div className="text-xs text-blue-700">Migrations</div>
        </Card>
        <Card className="p-4 text-center bg-orange-50 border-orange-200">
          <div className="text-2xl font-bold text-orange-600">{signalsByType.phenology_change.length}</div>
          <div className="text-xs text-orange-700">Phénologie</div>
        </Card>
      </div>

      {/* Signals List */}
      <div className="space-y-3">
        {filteredData.signals.map((signal, index) => (
          <motion.div
            key={`${signal.species}-${signal.signalType}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`border rounded-xl p-4 hover:shadow-lg cursor-pointer transition-all ${getSignalColor(signal.signalType)}`}
            onClick={() => setSelectedSignal(signal)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getSignalIcon(signal.signalType)}
                <div>
                  <div className="font-semibold">{signal.species}</div>
                  <div className="text-xs opacity-70">{getSignalLabel(signal.signalType)}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium">
                    Force: {Math.round(signal.strength * 100)}%
                  </div>
                  <div className="text-xs opacity-70">
                    Tendance: {signal.trend === 'increasing' ? '↗️' : signal.trend === 'decreasing' ? '↘️' : '→'}
                  </div>
                </div>
                
                {signal.prediction.migrationDirection && (
                  <Badge variant="outline" className="text-xs">
                    {signal.prediction.estimatedDistance}km {signal.prediction.migrationDirection}
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const AlertsView = () => (
    <div className="space-y-4">
      {filteredData.alerts.map((alert, index) => (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`border rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg ${getAlertSeverityColor(alert.severity)}`}
          onClick={() => setSelectedAlert(alert)}
        >
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-5 w-5 mt-1 flex-shrink-0" />
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{alert.title}</h3>
                <Badge variant="outline" className={`text-xs ${getAlertSeverityColor(alert.severity)}`}>
                  {alert.severity}
                </Badge>
              </div>
              
              <p className="text-sm opacity-80 mb-3">{alert.description}</p>
              
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {alert.timeline}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {alert.stakeholders.length} acteur(s)
                </span>
                {alert.species && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {alert.species.length} espèce(s)
                  </span>
                )}
              </div>
              
              {alert.actionRequired && (
                <Badge className="bg-orange-600 text-white mt-2 text-xs">
                  Action requise
                </Badge>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const EcosystemView = () => (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 border-emerald-200">
        <h3 className="text-xl font-bold text-emerald-800 mb-4">Transition Écosystémique</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-lg font-semibold text-green-700">Aujourd'hui</div>
            <div className="text-sm text-green-600">{ecosystemTransition.currentType}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-orange-700">2035</div>
            <div className="text-sm text-orange-600">{ecosystemTransition.futureType2035}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-700">2045</div>
            <div className="text-sm text-red-600">{ecosystemTransition.futureType2045}</div>
          </div>
        </div>
        
        <div className="bg-white/60 rounded-lg p-4">
          <div className="text-sm font-medium mb-2">Probabilité de transition</div>
          <div className="w-full bg-emerald-200 rounded-full h-3">
            <div 
              className="bg-emerald-600 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${ecosystemTransition.transitionProbability * 100}%` }}
            ></div>
          </div>
          <div className="text-xs text-emerald-700 mt-1">
            {Math.round(ecosystemTransition.transitionProbability * 100)}% de probabilité
          </div>
        </div>
        
        <div className="mt-4">
          <h4 className="font-semibold text-emerald-800 mb-2">Actions de conservation prioritaires</h4>
          <div className="space-y-2">
            {ecosystemTransition.conservationActions.map((action, index) => (
              <div key={index} className="bg-white/60 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{action.action}</span>
                  <Badge variant="outline" className={`text-xs ${
                    action.priority === 'immediate' ? 'border-red-300 text-red-600' :
                    action.priority === 'short_term' ? 'border-orange-300 text-orange-600' :
                    'border-blue-300 text-blue-600'
                  }`}>
                    {action.priority}
                  </Badge>
                </div>
                <div className="text-xs text-gray-600 mt-1">{action.expectedOutcome}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );

  const CitizenView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 text-center bg-blue-50 border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{citizenContributions.totalObservations}</div>
          <div className="text-xs text-blue-700">Observations totales</div>
        </Card>
        <Card className="p-4 text-center bg-green-50 border-green-200">
          <div className="text-2xl font-bold text-green-600">{citizenContributions.validatedObservations}</div>
          <div className="text-xs text-green-700">Validées</div>
        </Card>
        <Card className="p-4 text-center bg-purple-50 border-purple-200">
          <div className="text-2xl font-bold text-purple-600">{citizenContributions.topContributors.length}</div>
          <div className="text-xs text-purple-700">Contributeurs actifs</div>
        </Card>
      </div>
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Contributeurs</h3>
        <div className="space-y-3">
          {citizenContributions.topContributors.map((contributor, index) => (
            <div key={contributor.username} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-sm font-bold text-blue-600">#{index + 1}</div>
                <div>
                  <div className="font-medium">{contributor.username}</div>
                  <div className="text-xs text-gray-600">{contributor.observations} observations</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-green-600">
                  {Math.round(contributor.validationScore * 100)}% validité
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  // Filter data based on active year
  const getYearFilteredData = () => {
    console.log('🎯 Filtering data for year:', activeYear, 'Total signals:', signals.length);
    
    if (activeYear === 2025) {
      const filtered = {
        signals: signals.filter(s => s.prediction.likelihood2035 > 0.3),
        alerts: territorialAlerts.filter(a => a.timeline === '0-2years' || a.timeline === '2-5years')
      };
      console.log('📊 2025 data:', filtered);
      return filtered;
    } else if (activeYear === 2035) {
      const filtered = {
        signals: signals.filter(s => s.prediction.likelihood2035 > 0.5),
        alerts: territorialAlerts.filter(a => a.timeline === '2-5years' || a.timeline === '5-10years')
      };
      console.log('📊 2035 data:', filtered);
      return filtered;
    } else if (activeYear === 2045) {
      const filtered = {
        signals: signals.filter(s => s.prediction.likelihood2045 > 0.4),
        alerts: territorialAlerts.filter(a => a.timeline === '5-10years' || a.timeline === '10-20years')
      };
      console.log('📊 2045 data:', filtered);
      return filtered;
    }
    
    console.log('📊 Default data (all):', { signals: signals.length, alerts: territorialAlerts.length });
    return { signals, alerts: territorialAlerts };
  };

  const filteredData = getYearFilteredData();

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 border-2 border-blue-200/50">
      {/* Header with Temporal Navigation */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text mb-2">
              Intelligence Biodiversité {activeYear}
            </h2>
            <p className="text-blue-700">
              Détection précoce et prédiction des changements écologiques
            </p>
          </div>
          
          {/* Temporal Slider - Always Visible */}
          <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-xl p-4 border-2 border-blue-300 shadow-lg">
            <Clock className="h-6 w-6 text-blue-600" />
            <div className="text-sm font-medium text-blue-700">Navigation temporelle:</div>
            <div className="flex gap-2">
              {[2025, 2035, 2045].map((year) => (
                <button
                  key={year}
                  onClick={() => {
                    console.log('🕐 Year button clicked:', year);
                    if (onYearChange) {
                      onYearChange(year);
                    } else {
                      console.warn('⚠️ onYearChange not provided');
                    }
                  }}
                  className={`px-5 py-3 rounded-lg font-bold transition-all transform hover:scale-105 ${
                    activeYear === year
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl'
                      : 'bg-white text-blue-700 hover:bg-blue-100 border-2 border-blue-200'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              Active: {activeYear}
            </div>
          </div>
        </div>
        
        {/* Year-specific indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/60 rounded-lg p-3 border border-blue-200">
            <div className="text-sm text-blue-600">Signaux détectés</div>
            <div className="text-2xl font-bold text-blue-800">{filteredData.signals.length}</div>
          </div>
          <div className="bg-white/60 rounded-lg p-3 border border-blue-200">
            <div className="text-sm text-blue-600">Alertes territoriales</div>
            <div className="text-2xl font-bold text-blue-800">{filteredData.alerts.length}</div>
          </div>
          <div className="bg-white/60 rounded-lg p-3 border border-blue-200">
            <div className="text-sm text-blue-600">Espèces analysées</div>
            <div className="text-2xl font-bold text-blue-800">{intelligenceData.climateThresholds.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="signals">Signaux</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
          <TabsTrigger value="ecosystem">Écosystème</TabsTrigger>
          <TabsTrigger value="citizen">Citoyens</TabsTrigger>
          <TabsTrigger value="narratives">📖 Récits</TabsTrigger>
        </TabsList>
        
        <TabsContent value="signals">
          <SignalsView />
        </TabsContent>
        
        <TabsContent value="alerts">
          <AlertsView />
        </TabsContent>
        
        <TabsContent value="ecosystem">
          <EcosystemView />
        </TabsContent>
        
        <TabsContent value="citizen">
          <CitizenView />
        </TabsContent>
        
        <TabsContent value="narratives">
          <GaspardBorealNarratives
            narratives={gaspardNarratives || []}
            onNarrativeSelect={(narrative) => console.log('Selected narrative:', narrative)}
          />
        </TabsContent>
      </Tabs>

      {/* Signal Detail Modal */}
      <AnimatePresence>
        {selectedSignal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedSignal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                {getSignalIcon(selectedSignal.signalType)}
                <div>
                  <h3 className="text-xl font-bold">{selectedSignal.species}</h3>
                  <p className="text-sm text-gray-600">{getSignalLabel(selectedSignal.signalType)}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-700">Force du signal</div>
                  <div className="text-lg font-bold">{Math.round(selectedSignal.strength * 100)}%</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-700">Prédictions</div>
                  <div className="text-sm space-y-1">
                    <div>2035: {Math.round(selectedSignal.prediction.likelihood2035 * 100)}% de probabilité</div>
                    <div>2045: {Math.round(selectedSignal.prediction.likelihood2045 * 100)}% de probabilité</div>
                  </div>
                </div>
                
                {selectedSignal.prediction.migrationDirection && (
                  <div>
                    <div className="text-sm font-medium text-gray-700">Migration estimée</div>
                    <div className="text-sm">
                      {selectedSignal.prediction.estimatedDistance}km vers le {selectedSignal.prediction.migrationDirection}
                    </div>
                  </div>
                )}
                
                <div>
                  <div className="text-sm font-medium text-gray-700">Observations</div>
                  <div className="text-sm">{selectedSignal.observations.length} observation(s) récente(s)</div>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-6"
                onClick={() => setSelectedSignal(null)}
              >
                Fermer
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert Detail Modal */}
      <AnimatePresence>
        {selectedAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedAlert(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
                <div>
                  <h3 className="text-xl font-bold">{selectedAlert.title}</h3>
                  <Badge className={`${getAlertSeverityColor(selectedAlert.severity)} mt-1`}>
                    {selectedAlert.severity}
                  </Badge>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">{selectedAlert.description}</p>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-700">Chronologie</div>
                  <div className="text-sm">{selectedAlert.timeline}</div>
                </div>
                
                {selectedAlert.species && (
                  <div>
                    <div className="text-sm font-medium text-gray-700">Espèces concernées</div>
                    <div className="text-sm">{selectedAlert.species.join(', ')}</div>
                  </div>
                )}
                
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Actions recommandées par acteur</div>
                  <div className="space-y-2">
                    {selectedAlert.stakeholders.map((stakeholder, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <div className="font-medium text-sm capitalize">
                          {stakeholder.type.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-gray-600 mb-1">
                          Urgence: {stakeholder.urgency.replace('_', ' ')}
                        </div>
                        <ul className="text-xs space-y-1">
                          {stakeholder.recommendedActions.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-blue-500">•</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-6"
                onClick={() => setSelectedAlert(null)}
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

export default BiodiversityTransitionRadar;