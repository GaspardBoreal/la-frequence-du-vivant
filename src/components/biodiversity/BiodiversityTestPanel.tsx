import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, ChevronDown, ChevronUp, Navigation, Bird, Leaf, TreeDeciduous, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBiodiversityData } from '@/hooks/useBiodiversityData';
import { useSpeciesTranslationBatch } from '@/hooks/useSpeciesTranslation';
import SpeciesGalleryDetailModal from './SpeciesGalleryDetailModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type KingdomFilter = 'all' | 'birds' | 'plants' | 'fungi';

// Helper to detect birds - robust detection using source, family and genus
const isBirdSpecies = (species: { family?: string; scientificName: string; source?: string }) => {
  // 1. If source is eBird, it's always a bird
  if (species.source === 'ebird') return true;
  
  // 2. Check known bird families
  const birdFamilies = ['Paridae', 'Turdidae', 'Fringillidae', 'Corvidae', 'Picidae', 'Strigidae', 'Accipitridae', 'Anatidae', 'Ardeidae', 'Columbidae', 'Passeridae', 'Muscicapidae', 'Sittidae', 'Certhiidae', 'Troglodytidae', 'Sylviidae', 'Regulidae', 'Aegithalidae', 'Hirundinidae', 'Motacillidae', 'Prunellidae', 'Emberizidae', 'Carduelidae', 'Oriolidae', 'Laniidae', 'Sturnidae', 'Phasianidae', 'Rallidae', 'Charadriidae', 'Scolopacidae', 'Laridae', 'Alcidae', 'Apodidae', 'Meropidae', 'Upupidae', 'Alcedinidae', 'Cuculidae', 'Caprimulgidae', 'Falconidae', 'Pandionidae', 'Tytonidae', 'Phalacrocoracidae', 'Podicipedidae', 'Gaviidae', 'Procellariidae', 'Sulidae', 'Ciconiidae', 'Threskiornithidae', 'Phoenicopteridae', 'Gruidae', 'Otididae', 'Recurvirostridae', 'Haematopodidae', 'Burhinidae', 'Glareolidae', 'Pteroclidae', 'Psittacidae'];
  if (birdFamilies.includes(species.family || '')) return true;
  
  // 3. Fallback: check known bird genera from scientific name
  const knownBirdGenera = [
    'Turdus', 'Columba', 'Certhia', 'Parus', 'Passer', 'Corvus', 'Cyanistes',
    'Erithacus', 'Pica', 'Dendrocopos', 'Picus', 'Buteo', 'Falco', 'Strix',
    'Athene', 'Ardea', 'Anas', 'Aythya', 'Cygnus', 'Motacilla', 'Sturnus',
    'Garrulus', 'Phoenicurus', 'Sylvia', 'Phylloscopus', 'Regulus', 'Aegithalos',
    'Sitta', 'Troglodytes', 'Hirundo', 'Delichon', 'Apus', 'Cuculus',
    'Streptopelia', 'Fringilla', 'Carduelis', 'Chloris', 'Emberiza', 'Larus',
    'Vanellus', 'Gallinula', 'Fulica', 'Podiceps', 'Phalacrocorax', 'Alcedo',
    'Merops', 'Upupa', 'Accipiter', 'Milvus', 'Circus', 'Aquila', 'Pandion',
    'Tyto', 'Asio', 'Bubo', 'Caprimulgus', 'Jynx', 'Oriolus', 'Lanius',
    'Cinclus', 'Prunella', 'Anthus', 'Saxicola', 'Oenanthe', 'Luscinia',
    'Ficedula', 'Muscicapa', 'Locustella', 'Acrocephalus', 'Hippolais',
    'Cisticola', 'Cettia', 'Panurus', 'Remiz', 'Periparus', 'Lophophanes',
    'Poecile', 'Nucifraga', 'Pyrrhocorax', 'Coloeus', 'Pyrrhula', 'Coccothraustes',
    'Serinus', 'Linaria', 'Acanthis', 'Loxia', 'Pinicola', 'Carpodacus',
    'Perdix', 'Coturnix', 'Phasianus', 'Tetrao', 'Lagopus', 'Bonasa',
    'Grus', 'Ciconia', 'Platalea', 'Nycticorax', 'Egretta', 'Bubulcus',
    'Botaurus', 'Ixobrychus', 'Rallus', 'Porzana', 'Crex', 'Haematopus',
    'Recurvirostra', 'Himantopus', 'Charadrius', 'Pluvialis', 'Arenaria',
    'Calidris', 'Tringa', 'Actitis', 'Numenius', 'Limosa', 'Scolopax',
    'Gallinago', 'Phalaropus', 'Stercorarius', 'Chroicocephalus', 'Hydrocoloeus',
    'Ichthyaetus', 'Gelochelidon', 'Hydroprogne', 'Thalasseus', 'Sterna',
    'Sternula', 'Chlidonias', 'Rissa', 'Uria', 'Alca', 'Fratercula',
    'Cepphus', 'Gavia', 'Fulmarus', 'Puffinus', 'Calonectris', 'Hydrobates',
    'Morus', 'Sula', 'Pelecanus', 'Phoenicopterus', 'Anser', 'Branta',
    'Tadorna', 'Mareca', 'Spatula', 'Netta', 'Bucephala', 'Mergellus',
    'Mergus', 'Clangula', 'Melanitta', 'Somateria', 'Oxyura'
  ];
  const genus = species.scientificName.split(' ')[0];
  return knownBirdGenera.includes(genus);
};

export default function BiodiversityTestPanel() {
  const [latitude, setLatitude] = useState<number>(44.85);
  const [longitude, setLongitude] = useState<number>(0.48);
  const [radius, setRadius] = useState<number>(5);
  const [dateFilter, setDateFilter] = useState<'recent' | 'medium'>('recent');
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [showDebugJson, setShowDebugJson] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<KingdomFilter>('all');
  const [selectedSpecies, setSelectedSpecies] = useState<{
    name: string;
    scientificName: string;
    count: number;
    kingdom: string;
    photos?: string[];
  } | null>(null);

  const { data, isLoading, error, refetch } = useBiodiversityData({
    latitude: isSearchEnabled ? latitude : 0,
    longitude: isSearchEnabled ? longitude : 0,
    radius,
    dateFilter,
    mode: 'interactive',
  });

  // Prepare species for batch translation
  const speciesToTranslate = useMemo(() => {
    if (!data?.species) return [];
    return data.species.map(sp => ({
      scientificName: sp.scientificName,
      commonName: sp.commonName
    }));
  }, [data?.species]);

  const { data: translations, isLoading: translationsLoading } = useSpeciesTranslationBatch(speciesToTranslate);

  // Create a map for quick translation lookup
  const translationMap = useMemo(() => {
    if (!translations) return new Map();
    return new Map(translations.map(t => [t.scientificName, t]));
  }, [translations]);

  // Filter species based on active filter
  const filteredSpecies = useMemo(() => {
    if (!data?.species) return [];
    return data.species.filter(sp => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'birds') return sp.kingdom === 'Animalia' && isBirdSpecies(sp);
      if (activeFilter === 'plants') return sp.kingdom === 'Plantae';
      if (activeFilter === 'fungi') return sp.kingdom === 'Fungi';
      return true;
    });
  }, [data?.species, activeFilter]);

  // IMPORTANT: compute displayed counters from the exact same predicates used for filtering
  // This avoids mismatches when the backend summary uses a different taxonomy mapping.
  const computedCounts = useMemo(() => {
    const all = data?.species ?? [];
    const birds = all.filter(sp => sp.kingdom === 'Animalia' && isBirdSpecies(sp)).length;
    const plants = all.filter(sp => sp.kingdom === 'Plantae').length;
    const fungi = all.filter(sp => sp.kingdom === 'Fungi').length;
    return {
      total: all.length,
      birds,
      plants,
      fungi,
    };
  }, [data?.species]);

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

  const handleSpeciesClick = (sp: typeof data.species[0], frenchName: string) => {
    setSelectedSpecies({
      name: frenchName,
      scientificName: sp.scientificName,
      count: sp.observations,
      kingdom: sp.kingdom,
      photos: sp.photos
    });
  };

  const getDisplayName = (sp: typeof data.species[0]) => {
    const translation = translationMap.get(sp.scientificName);
    return translation?.commonName || sp.commonName;
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
            {/* Summary cards - now clickable filters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* All species */}
              <button
                onClick={() => setActiveFilter('all')}
                className={cn(
                  "bg-slate-900/80 rounded-xl border-2 p-4 text-center transition-all duration-200 hover:bg-slate-800/80",
                  activeFilter === 'all' 
                    ? "border-white ring-2 ring-white/20" 
                    : "border-slate-700 hover:border-slate-500"
                )}
              >
                <Sparkles className={cn(
                  "h-5 w-5 mx-auto mb-1",
                  activeFilter === 'all' ? "text-white" : "text-slate-400"
                )} />
                <div className="text-3xl font-bold text-white mb-1">
                  {computedCounts.total.toLocaleString('fr-FR')}
                </div>
                <div className="text-sm text-slate-400">Toutes</div>
              </button>

              {/* Birds */}
              <button
                onClick={() => setActiveFilter('birds')}
                className={cn(
                  "bg-slate-900/80 rounded-xl border-2 p-4 text-center transition-all duration-200 hover:bg-slate-800/80",
                  activeFilter === 'birds' 
                    ? "border-emerald-400 ring-2 ring-emerald-400/20" 
                    : "border-emerald-800/50 hover:border-emerald-600"
                )}
              >
                <Bird className={cn(
                  "h-5 w-5 mx-auto mb-1",
                  activeFilter === 'birds' ? "text-emerald-300" : "text-emerald-400"
                )} />
                <div className="text-2xl font-bold text-emerald-400">{computedCounts.birds}</div>
                <div className="text-xs text-slate-400">Oiseaux</div>
              </button>

              {/* Plants */}
              <button
                onClick={() => setActiveFilter('plants')}
                className={cn(
                  "bg-slate-900/80 rounded-xl border-2 p-4 text-center transition-all duration-200 hover:bg-slate-800/80",
                  activeFilter === 'plants' 
                    ? "border-green-400 ring-2 ring-green-400/20" 
                    : "border-green-800/50 hover:border-green-600"
                )}
              >
                <Leaf className={cn(
                  "h-5 w-5 mx-auto mb-1",
                  activeFilter === 'plants' ? "text-green-300" : "text-green-400"
                )} />
                <div className="text-2xl font-bold text-green-400">{computedCounts.plants}</div>
                <div className="text-xs text-slate-400">Plantes</div>
              </button>

              {/* Fungi */}
              <button
                onClick={() => setActiveFilter('fungi')}
                className={cn(
                  "bg-slate-900/80 rounded-xl border-2 p-4 text-center transition-all duration-200 hover:bg-slate-800/80",
                  activeFilter === 'fungi' 
                    ? "border-amber-400 ring-2 ring-amber-400/20" 
                    : "border-amber-800/50 hover:border-amber-600"
                )}
              >
                <TreeDeciduous className={cn(
                  "h-5 w-5 mx-auto mb-1",
                  activeFilter === 'fungi' ? "text-amber-300" : "text-amber-400"
                )} />
                <div className="text-2xl font-bold text-amber-400">{computedCounts.fungi}</div>
                <div className="text-xs text-slate-400">Champignons</div>
              </button>
            </div>

            {/* Filter indicator */}
            {activeFilter !== 'all' && (
              <div className="text-center text-sm text-slate-400">
                Affichage de <span className="text-white font-medium">{filteredSpecies.length}</span> espèces filtrées
              </div>
            )}

            {/* Top species list */}
            <div className="bg-slate-900/80 rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                🏆 {activeFilter === 'all' ? 'Top 10 espèces' : `Espèces (${filteredSpecies.length})`}
              </h3>
              
              {translationsLoading && (
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des noms français...
                </div>
              )}

              <div className="space-y-1">
                {filteredSpecies.slice(0, activeFilter === 'all' ? 10 : 50).map((sp, i) => {
                  const frenchName = getDisplayName(sp);
                  const translation = translationMap.get(sp.scientificName);
                  const isTranslated = translation?.source === 'local';
                  
                  return (
                    <button
                      key={sp.id}
                      onClick={() => handleSpeciesClick(sp, frenchName)}
                      className="w-full flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer text-left group"
                    >
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 text-white text-sm font-bold shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium truncate group-hover:text-emerald-300 transition-colors">
                            {frenchName}
                          </span>
                          {isTranslated && (
                            <span className="text-xs text-emerald-500">🇫🇷</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 italic truncate">{sp.scientificName}</div>
                      </div>
                      <div className="text-sm text-slate-400 shrink-0">{sp.observations} obs.</div>
                      {sp.audioUrl && (
                        <span className="text-emerald-400 text-xs shrink-0">🔊</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {filteredSpecies.length === 0 && (
                <p className="text-slate-500 text-center py-4">Aucune espèce trouvée pour ce filtre</p>
              )}
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

      {/* Species Detail Modal */}
      <SpeciesGalleryDetailModal
        species={selectedSpecies}
        isOpen={!!selectedSpecies}
        onClose={() => setSelectedSpecies(null)}
      />
    </section>
  );
}
