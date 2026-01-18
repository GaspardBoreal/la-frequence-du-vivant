import React, { useState } from 'react';
import { Database, ExternalLink, Shield, BookOpen, AlertTriangle, Copy, Check, Thermometer, Droplets, Calculator } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';

interface MethodologyDialogProps {
  open: boolean;
  onClose: () => void;
  apiUrl: string;
  latitude: number;
  longitude: number;
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
  dataSource: 'real' | 'estimated';
}

const MethodologyDialog: React.FC<MethodologyDialogProps> = ({
  open,
  onClose,
  apiUrl,
  latitude,
  longitude,
  methodology,
  dataSource
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-950 border-emerald-500/20 text-white max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-emerald-300 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Transparence Méthodologique
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Section Sources de données */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide flex items-center gap-2">
                <Database className="h-4 w-4" />
                Source des Données Météorologiques
              </h3>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${dataSource === 'real' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span className="font-medium">
                      {dataSource === 'real' ? 'Open-Meteo Archive API' : 'Estimation géographique'}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    dataSource === 'real' 
                      ? 'bg-emerald-500/20 text-emerald-300' 
                      : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {dataSource === 'real' ? 'Données réelles' : 'Modèle estimatif'}
                  </span>
                </div>
                
                <div className="relative">
                  <code className="block text-xs bg-slate-900 p-3 rounded-lg text-emerald-200 break-all font-mono">
                    {apiUrl}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyToClipboard}
                    className="absolute top-1 right-1 h-7 w-7 p-0 text-white/50 hover:text-white"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                
                <a
                  href={apiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 hover:underline"
                >
                  Ouvrir l'API dans un nouvel onglet
                  <ExternalLink className="h-3 w-3" />
                </a>

                {methodology?.rawDataSummary && (
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10">
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
                        <Thermometer className="h-3 w-3" />
                        Température moyenne
                      </div>
                      <div className="text-lg font-semibold text-white">
                        {methodology.rawDataSummary.tempAvg.toFixed(1)}°C
                      </div>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
                        <Droplets className="h-3 w-3" />
                        Précipitations annuelles
                      </div>
                      <div className="text-lg font-semibold text-white">
                        {Math.round(methodology.rawDataSummary.precipTotal)} mm
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Section Formules de calcul */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Formules de Calcul des Projections
              </h3>
              <div className="space-y-2">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="text-xs text-white/50 mb-2">Gradient thermique altitudinal</div>
                  <code className="text-sm text-blue-200 font-mono">
                    T = T_base - (altitude × 0.0065°C/m)
                  </code>
                  {methodology?.altitude && (
                    <div className="text-xs text-white/40 mt-2">
                      → Altitude estimée : {methodology.altitude}m = -{(methodology.altitude * 0.0065).toFixed(1)}°C
                    </div>
                  )}
                </div>
                
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="text-xs text-white/50 mb-2">Effet modérateur océanique</div>
                  <code className="text-sm text-blue-200 font-mono">
                    effet = exp(-distance_océan / 300km)
                  </code>
                  {methodology?.oceanDistance !== undefined && (
                    <div className="text-xs text-white/40 mt-2">
                      → Distance à l'Atlantique : ~{Math.round(methodology.oceanDistance)}km
                    </div>
                  )}
                </div>
                
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="text-xs text-white/50 mb-2">Gradient latitudinal</div>
                  <code className="text-sm text-blue-200 font-mono">
                    ΔT = (latitude - 46°N) × -0.6°C/degré
                  </code>
                  <div className="text-xs text-white/40 mt-2">
                    → Position : {latitude.toFixed(2)}°N = {((latitude - 46) * -0.6).toFixed(1)}°C
                  </div>
                </div>
              </div>
            </section>

            {/* Section Scénarios GIEC */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Scénarios GIEC Utilisés
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-amber-300">2035</span>
                    <span className="text-xs bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded-full">
                      SSP2-4.5
                    </span>
                  </div>
                  <div className="text-sm text-white/70">
                    Scénario intermédiaire
                  </div>
                  <ul className="text-xs text-white/50 mt-2 space-y-1">
                    <li>• Réchauffement : +1.5 à +2.0°C</li>
                    <li>• Précipitations été : -5 à -10%</li>
                    <li>• Jours de chaleur : ×2.2</li>
                  </ul>
                </div>
                
                <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-red-300">2045</span>
                    <span className="text-xs bg-red-500/20 text-red-200 px-2 py-0.5 rounded-full">
                      SSP5-8.5
                    </span>
                  </div>
                  <div className="text-sm text-white/70">
                    Scénario pessimiste
                  </div>
                  <ul className="text-xs text-white/50 mt-2 space-y-1">
                    <li>• Réchauffement : +2.5 à +3.5°C</li>
                    <li>• Précipitations été : -15 à -20%</li>
                    <li>• Jours de chaleur : ×3.5</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section Références */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">
                Références Scientifiques
              </h3>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10 space-y-2">
                <ul className="text-sm text-white/60 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">•</span>
                    <span>IPCC AR6 WG1 - Climate Change 2021: The Physical Science Basis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">•</span>
                    <a 
                      href="https://open-meteo.com/en/docs/historical-weather-api" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      Documentation Open-Meteo Historical Weather API
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">•</span>
                    <span>Météo-France - Projections climatiques régionalisées DRIAS</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Avertissement */}
            <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-200/90">
                <strong className="text-amber-300">Avertissement :</strong> Ces projections sont des estimations basées sur des modèles climatiques. 
                Elles comportent des incertitudes inhérentes aux prévisions à long terme et ne constituent pas des prédictions exactes.
                L'objectif est de sensibiliser aux tendances générales du changement climatique.
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default MethodologyDialog;
