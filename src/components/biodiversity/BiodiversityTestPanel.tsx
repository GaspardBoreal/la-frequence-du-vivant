import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search, Loader2, ChevronDown, ChevronUp, Navigation, Bird, Leaf, TreeDeciduous } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBiodiversityData } from '@/hooks/useBiodiversityData';
import { toast } from 'sonner';

export default function BiodiversityTestPanel() {
  const [latitude, setLatitude] = useState<number>(44.85);
  const [longitude, setLongitude] = useState<number>(0.48);
  const [radius, setRadius] = useState<number>(5);
  const [dateFilter, setDateFilter] = useState<'recent' | 'medium'>('recent');
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [showDebugJson, setShowDebugJson] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const { data, isLoading, error, refetch } = useBiodiversityData({
    latitude: isSearchEnabled ? latitude : 0,
    longitude: isSearchEnabled ? longitude : 0,
    radius,
    dateFilter,
    mode: 'interactive',
  });

  const handleSearch = () => {
    if (!latitude || !longitude) {
      toast.error('Veuillez entrer des coordonnées valides');
      return;
    }
    setIsSearchEnabled(true);
    refetch();
  };

  const handleGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Géolocalisation non supportée par votre navigateur');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Math.round(pos.coords.latitude * 1000000) / 1000000);
        setLongitude(Math.round(pos.coords.longitude * 1000000) / 1000000);
        setGpsLoading(false);
        toast.success('Position GPS récupérée');
      },
      (err) => {
        setGpsLoading(false);
        toast.error(`Erreur GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <section className="py-12 md:py-16 px-4 bg-gradient-to-b from-slate-950 to-emerald-950/30">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            🔬 Tester la biodiversité locale
          </h2>
          <p className="text-slate-400">
            Entrez des coordonnées ou utilisez votre position GPS pour explorer les espèces autour de vous
          </p>
        </motion.div>

        {/* Input controls */}
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Latitude */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Latitude</label>
              <Input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                className="bg-slate-800 border-slate-600 text-white"
                placeholder="44.8500"
              />
            </div>

            {/* Longitude */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Longitude</label>
              <Input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                className="bg-slate-800 border-slate-600 text-white"
                placeholder="0.4800"
              />
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Période</label>
              <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as 'recent' | 'medium')}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="recent" className="text-white">Récent (30 jours)</SelectItem>
                  <SelectItem value="medium" className="text-white">Moyen (6 mois)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* GPS Button */}
            <div className="flex items-end">
              <Button
                onClick={handleGPS}
                disabled={gpsLoading}
                variant="outline"
                className="w-full border-emerald-600 text-emerald-400 hover:bg-emerald-900/30"
              >
                {gpsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Navigation className="h-4 w-4 mr-2" />
                )}
                Ma position
              </Button>
            </div>
          </div>

          {/* Radius slider */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Rayon de recherche: <span className="text-emerald-400 font-bold">{radius} km</span>
            </label>
            <Slider
              value={[radius]}
              onValueChange={(v) => setRadius(v[0])}
              min={0.5}
              max={25}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0.5 km</span>
              <span>25 km</span>
            </div>
          </div>

          {/* Search button */}
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Recherche en cours...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Rechercher les espèces
              </>
            )}
          </Button>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 mb-6">
            <p className="text-red-400">❌ Erreur: {error.message}</p>
          </div>
        )}

        {/* Results */}
        {data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 rounded-xl border border-slate-700 p-4 text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  {data.summary.totalSpecies.toLocaleString('fr-FR')}
                </div>
                <div className="text-sm text-slate-400">Espèces</div>
              </div>
              <div className="bg-slate-900/80 rounded-xl border border-emerald-800/50 p-4 text-center">
                <Bird className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                <div className="text-2xl font-bold text-emerald-400">{data.summary.birds}</div>
                <div className="text-xs text-slate-400">Oiseaux</div>
              </div>
              <div className="bg-slate-900/80 rounded-xl border border-green-800/50 p-4 text-center">
                <Leaf className="h-5 w-5 text-green-400 mx-auto mb-1" />
                <div className="text-2xl font-bold text-green-400">{data.summary.plants}</div>
                <div className="text-xs text-slate-400">Plantes</div>
              </div>
              <div className="bg-slate-900/80 rounded-xl border border-amber-800/50 p-4 text-center">
                <TreeDeciduous className="h-5 w-5 text-amber-400 mx-auto mb-1" />
                <div className="text-2xl font-bold text-amber-400">{data.summary.fungi}</div>
                <div className="text-xs text-slate-400">Champignons</div>
              </div>
            </div>

            {/* Top 10 species */}
            <div className="bg-slate-900/80 rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">🏆 Top 10 espèces</h3>
              <div className="space-y-3">
                {data.species.slice(0, 10).map((sp, i) => (
                  <div key={sp.id} className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 text-white text-sm font-bold shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">{sp.commonName}</div>
                      <div className="text-xs text-slate-500 italic truncate">{sp.scientificName}</div>
                    </div>
                    <div className="text-sm text-slate-400">{sp.observations} obs.</div>
                    {sp.audioUrl && (
                      <span className="text-emerald-400 text-xs">🔊</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Debug JSON collapsible */}
            <div className="bg-slate-900/80 rounded-xl border border-slate-700">
              <button
                onClick={() => setShowDebugJson(!showDebugJson)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="text-sm font-medium text-slate-300">🔧 Debug JSON</span>
                {showDebugJson ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>
              {showDebugJson && (
                <div className="p-4 pt-0 max-h-96 overflow-auto">
                  <pre className="text-xs text-slate-400 whitespace-pre-wrap break-words">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Methodology info */}
            <div className="text-center text-sm text-slate-500">
              Sources: {data.methodology.sources.join(', ')} • 
              Rayon: {data.location.radius}m • 
              Confiance: {data.methodology.confidence}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
