import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Loader2, Compass, List, Map as MapIcon, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useDetecteurZonesBlanches, ZoneResult, SpeciesSample, ZoneResolution } from '@/hooks/useDetecteurZonesBlanches';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const ITEMS_PER_PAGE = 4;

// ─── Intensity spectrum ───
interface IntensityLevel {
  level: number;
  name: string;
  color: string;
  bgLight: string;
  borderLight: string;
  phrase: string;
}

const INTENSITY_LEVELS: IntensityLevel[] = [
  { level: 0, name: 'Silence', color: '#f59e0b', bgLight: 'rgba(254,243,199,0.3)', borderLight: 'rgba(251,191,36,0.2)', phrase: 'Ce territoire attend ses premiers explorateurs' },
  { level: 1, name: 'Murmure', color: '#84cc16', bgLight: 'rgba(236,252,203,0.3)', borderLight: 'rgba(132,204,22,0.2)', phrase: 'Un léger frémissement de données — tout reste à découvrir' },
  { level: 2, name: 'Souffle', color: '#22c55e', bgLight: 'rgba(220,252,231,0.3)', borderLight: 'rgba(34,197,94,0.2)', phrase: 'Le vivant commence à se manifester ici' },
  { level: 3, name: 'Chœur', color: '#059669', bgLight: 'rgba(209,250,229,0.25)', borderLight: 'rgba(5,150,105,0.18)', phrase: 'Un chœur d\'espèces résonne sur ce territoire' },
  { level: 4, name: 'Symphonie', color: '#1a3a2a', bgLight: 'rgba(26,58,42,0.08)', borderLight: 'rgba(26,58,42,0.12)', phrase: 'Une symphonie du vivant — richement documenté' },
];

function getIntensityLevel(observations: number): IntensityLevel {
  if (observations === 0) return INTENSITY_LEVELS[0];
  if (observations <= 50) return INTENSITY_LEVELS[1];
  if (observations <= 500) return INTENSITY_LEVELS[2];
  if (observations <= 5000) return INTENSITY_LEVELS[3];
  return INTENSITY_LEVELS[4];
}

function getRelativeIntensityLevel(observations: number, min: number, max: number): IntensityLevel {
  if (observations === 0) return INTENSITY_LEVELS[0];
  if (max === min) return INTENSITY_LEVELS[2];
  const ratio = (observations - min) / (max - min);
  if (ratio <= 0.15) return INTENSITY_LEVELS[1];
  if (ratio <= 0.35) return INTENSITY_LEVELS[2];
  if (ratio <= 0.65) return INTENSITY_LEVELS[3];
  return INTENSITY_LEVELS[4];
}

function getProportionalRadius(observations: number, maxObs: number, resolution?: ZoneResolution): number {
  const baseMax = resolution === 'nano' ? 10 : resolution === 'zoom' ? 13 : 18;
  const baseMin = resolution === 'nano' ? 4 : resolution === 'zoom' ? 5 : 6;
  if (observations === 0) return resolution === 'nano' ? 5 : resolution === 'zoom' ? 6 : 8;
  if (maxObs <= 0) return baseMin + 2;
  const ratio = Math.max(0.15, observations / maxObs);
  return baseMin + ratio * (baseMax - baseMin);
}

// ─── Signal bars SVG ───
const SignalBars = ({ level, size = 20 }: { level: number; size?: number }) => {
  const barHeights = [0.3, 0.5, 0.75, 1];
  const intensity = INTENSITY_LEVELS[level];
  return (
    <div className="relative flex items-end gap-[2px]" style={{ width: size, height: size }}>
      {barHeights.map((h, i) => {
        const active = i < level;
        const isSilence = level === 0;
        return (
          <div
            key={i}
            className={isSilence && i === 0 ? 'animate-pulse' : ''}
            style={{
              width: size / 5.5,
              height: `${h * 100}%`,
              borderRadius: 2,
              background: active ? intensity.color : isSilence ? 'rgba(245,158,11,0.2)' : 'rgba(214,211,199,0.35)',
              transition: 'background 0.3s',
            }}
          />
        );
      })}
    </div>
  );
};

// ─── Spectre de synthèse ───
const SpectreSynthese = ({ zones, activeFilters, onToggle, onReset, getIntensity }: { zones: ZoneResult[]; activeFilters: Set<number>; onToggle: (level: number) => void; onReset: () => void; getIntensity: (obs: number) => IntensityLevel }) => {
  const distribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    zones.forEach(z => { counts[getIntensity(z.observations).level]++; });
    return counts;
  }, [zones, getIntensity]);

  const total = zones.length;
  const allActive = activeFilters.size === 0;

  return (
    <div className="mb-5">
      <p className="text-[11px] uppercase tracking-widest text-stone-400 mb-2.5 font-medium">Spectre du vivant</p>
      <div className="flex rounded-xl overflow-hidden h-8 border border-stone-200/50 shadow-sm">
        {distribution.map((count, i) => {
          if (count === 0) return null;
          const info = INTENSITY_LEVELS[i];
          const pct = (count / total) * 100;
          const isActive = allActive || activeFilters.has(i);
          return (
            <button
              key={i}
              onClick={() => onToggle(i)}
              className="relative flex items-center justify-center transition-all duration-200 group"
              style={{
                width: `${pct}%`,
                background: info.color,
                opacity: isActive ? 1 : 0.3,
                minWidth: count > 0 ? 32 : 0,
              }}
              title={`${info.name} — ${count} zone${count > 1 ? 's' : ''}`}
            >
              <span className="text-white text-[11px] font-bold drop-shadow-sm">{count}</span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <button
          onClick={onReset}
          className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all duration-200 ${
            allActive
              ? 'bg-stone-700 text-white border-stone-700 shadow-sm'
              : 'bg-transparent text-stone-400 border-stone-200 hover:border-stone-300 hover:text-stone-500'
          }`}
        >
          Tous
        </button>
        {INTENSITY_LEVELS.map((info) => {
          const count = distribution[info.level];
          if (count === 0) return null;
          const isActive = activeFilters.has(info.level);
          return (
            <button
              key={info.level}
              onClick={() => onToggle(info.level)}
              className="px-3 py-1 rounded-full text-[11px] font-medium border transition-all duration-200 hover:shadow-sm"
              style={{
                background: isActive ? info.color : 'transparent',
                color: isActive ? 'white' : info.color,
                borderColor: isActive ? info.color : `${info.color}40`,
              }}
            >
              {info.name} ({count})
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Recenter helper ───
const RecenterMap = ({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) => {
  const map = useMap();
  React.useEffect(() => { map.setView([lat, lng], zoom); }, [lat, lng, zoom, map]);
  return null;
};

// ─── Custom center icon ───
const centerIcon = new L.DivIcon({
  className: '',
  html: `<div style="width:18px;height:18px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,0.5);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const DetecteurZonesBlanches = () => {
  const [address, setAddress] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [page, setPage] = useState(0);
  const [activeFilters, setActiveFilters] = useState<Set<number>>(new Set());
  const [relativeMode, setRelativeMode] = useState(false);
  const { results, isLoading, scanPhase, remainingSearches, searchByGPS, searchByAddress } = useDetecteurZonesBlanches();

  const handleAddressSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setActiveFilters(new Set());
    searchByAddress(address);
  };

  const handleGPS = () => {
    setPage(0);
    setActiveFilters(new Set());
    searchByGPS();
  };

  const toggleFilter = (level: number) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
    setPage(0);
  };

  const resetFilters = () => {
    setActiveFilters(new Set());
    setPage(0);
  };

  const exhausted = remainingSearches <= 0;

  const sortedZones = useMemo(() => {
    if (!results) return [];
    return [...results.zones].sort((a, b) => a.distance_km - b.distance_km);
  }, [results]);

  // Compute min/max for relative mode
  const { minObs, maxObs } = useMemo(() => {
    if (!sortedZones.length) return { minObs: 0, maxObs: 0 };
    const nonZero = sortedZones.filter(z => z.observations > 0);
    if (!nonZero.length) return { minObs: 0, maxObs: 0 };
    return {
      minObs: Math.min(...nonZero.map(z => z.observations)),
      maxObs: Math.max(...nonZero.map(z => z.observations)),
    };
  }, [sortedZones]);

  const getIntensity = useMemo(() => {
    return (observations: number): IntensityLevel => {
      if (relativeMode) return getRelativeIntensityLevel(observations, minObs, maxObs);
      return getIntensityLevel(observations);
    };
  }, [relativeMode, minObs, maxObs]);

  const filteredZones = useMemo(() => {
    if (activeFilters.size === 0) return sortedZones;
    return sortedZones.filter(z => activeFilters.has(getIntensity(z.observations).level));
  }, [sortedZones, activeFilters, getIntensity]);

  const totalPages = Math.ceil(filteredZones.length / ITEMS_PER_PAGE);
  const pagedZones = filteredZones.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="mt-10 rounded-2xl p-6 md:p-8"
      style={{
        background: 'rgba(255,255,255,0.82)',
        border: '1px solid rgba(214,211,199,0.4)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
          <Compass className="w-[18px] h-[18px] text-white" />
        </div>
        <div>
          <h3 className="font-crimson text-lg font-bold tracking-tight" style={{ color: '#1a1a18' }}>
            Détecteur de zones blanches
          </h3>
          <p className="text-xs text-stone-400 leading-tight">Cartographiez l'intensité du vivant autour de vous</p>
        </div>
      </div>

      {exhausted ? (
        <div className="text-center py-8 px-4">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
            <Eye className="w-5 h-5 text-amber-500" />
          </div>
          <p className="font-crimson text-stone-600 text-base italic leading-relaxed max-w-sm mx-auto">
            Vos explorations ont été lancées.<br />
            Les territoires silencieux vous attendent — revenez bientôt pour de nouvelles découvertes.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-2">
            <Button
              onClick={handleGPS}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 text-emerald-700 rounded-xl h-11 px-5 transition-all"
            >
              <MapPin className="w-4 h-4" />
              Ma position
            </Button>

            <form onSubmit={handleAddressSearch} className="flex-1 flex gap-2">
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rue, ville..."
                disabled={isLoading}
                className="flex-1 border-stone-200 focus-visible:ring-emerald-500 rounded-xl h-11"
              />
              <Button type="submit" disabled={isLoading || !address.trim()} variant="outline" className="border-emerald-200 hover:bg-emerald-50 text-emerald-700 rounded-xl h-11 w-11 p-0">
                <Search className="w-4 h-4" />
              </Button>
            </form>
          </div>

          <p className="text-[11px] text-stone-400 mb-4 tracking-wide uppercase">
            {remainingSearches === 1 ? 'Dernière recherche disponible' : `${remainingSearches} recherches restantes`}
          </p>
        </>
      )}

      {/* Loading */}
      <AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-100" />
              <Loader2 className="w-12 h-12 text-emerald-500 animate-spin absolute inset-0" />
            </div>
            <span className="text-sm text-stone-500 font-crimson italic">{scanPhase || 'Exploration en cours…'}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {results && !isLoading && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <div className="border-t border-stone-200/60 pt-5 mt-2">
              {/* Spectre de synthèse */}
              <SpectreSynthese zones={sortedZones} activeFilters={activeFilters} onToggle={toggleFilter} onReset={resetFilters} getIntensity={getIntensity} />

              {/* Summary + Toggle + Relative mode */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-stone-600">
                    <strong className="text-amber-600 text-base">{results.blank_count}</strong>{' '}
                    <span className="text-stone-500 font-crimson italic">silence{results.blank_count > 1 ? 's' : ''}</span>
                    <span className="text-stone-300 mx-1.5">·</span>
                    <span className="text-stone-400">{results.total_scanned} points</span>
                    {activeFilters.size > 0 && (
                      <button onClick={resetFilters} className="ml-2 text-[10px] text-emerald-600 underline underline-offset-2 hover:text-emerald-700">
                        tout afficher
                      </button>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Relative mode toggle */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-[11px] text-stone-400 font-medium">Relatif</span>
                    <Switch
                      checked={relativeMode}
                      onCheckedChange={(checked) => {
                        setRelativeMode(checked);
                        setActiveFilters(new Set());
                        setPage(0);
                      }}
                    />
                  </label>

                  {/* View toggle */}
                  <div className="flex rounded-xl overflow-hidden border border-stone-200" style={{ background: 'rgba(245,245,244,0.6)' }}>
                    <ToggleBtn active={viewMode === 'list'} onClick={() => setViewMode('list')} icon={<List className="w-3.5 h-3.5" />} label="Liste" />
                    <ToggleBtn active={viewMode === 'map'} onClick={() => setViewMode('map')} icon={<MapIcon className="w-3.5 h-3.5" />} label="Carte" />
                  </div>
                </div>
              </div>

              {/* Relative mode explanation */}
              {relativeMode && (
                <p className="text-[11px] text-stone-400 italic mb-3 -mt-1">
                  Mode relatif : les niveaux sont calculés par rapport aux min/max locaux ({minObs.toLocaleString('fr-FR')} – {maxObs.toLocaleString('fr-FR')} obs.)
                </p>
              )}

              <AnimatePresence mode="wait">
                {viewMode === 'list' ? (
                  <motion.div key="list" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.25 }}>
                    <div className="space-y-2">
                      {pagedZones.map((zone, i) => (
                        <ZoneListItem key={`${zone.lat}-${zone.lng}`} zone={zone} index={i} getIntensity={getIntensity} />
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
                        <button
                          onClick={() => setPage(p => Math.max(0, p - 1))}
                          disabled={page === 0}
                          className="flex items-center gap-1 text-xs text-stone-500 hover:text-emerald-600 disabled:opacity-30 disabled:hover:text-stone-500 transition-colors"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" /> Précédent
                        </button>
                        <div className="flex gap-1">
                          {Array.from({ length: totalPages }, (_, i) => (
                            <button
                              key={i}
                              onClick={() => setPage(i)}
                              className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                                i === page
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'text-stone-400 hover:bg-stone-100'
                              }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                          disabled={page === totalPages - 1}
                          className="flex items-center gap-1 text-xs text-stone-500 hover:text-emerald-600 disabled:opacity-30 disabled:hover:text-stone-500 transition-colors"
                        >
                          Suivant <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="map" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}>
                    <div className="rounded-xl overflow-hidden border border-stone-200 shadow-sm" style={{ height: 'clamp(300px, 50vw, 420px)' }}>
                      <MapContainer
                        center={[results.center.lat, results.center.lng]}
                        zoom={10}
                        scrollWheelZoom={false}
                        style={{ height: '100%', width: '100%' }}
                        attributionControl={false}
                      >
                        <RecenterMap lat={results.center.lat} lng={results.center.lng} zoom={10} />
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

                        {/* Center marker */}
                        <Marker position={[results.center.lat, results.center.lng]} icon={centerIcon}>
                          <Tooltip direction="top" offset={[0, -12]} className="leaflet-tooltip-custom">
                            <span className="text-xs font-medium">Votre position</span>
                          </Tooltip>
                        </Marker>

                        {/* Zone markers */}
                        {sortedZones.map((zone) => {
                          const intensity = getIntensity(zone.observations);
                          const isFiltered = activeFilters.size > 0 && !activeFilters.has(intensity.level);
                          const radius = getProportionalRadius(zone.observations, maxObs, zone.resolution);
                          const dashArray = zone.resolution === 'nano' ? '2 3' : zone.resolution === 'zoom' ? '4 3' : undefined;
                          return (
                            <CircleMarker
                              key={`${zone.lat}-${zone.lng}`}
                              center={[zone.lat, zone.lng]}
                              radius={radius}
                              pathOptions={{
                                fillColor: intensity.color,
                                color: zone.resolution === 'nano' ? intensity.color : 'white',
                                weight: zone.resolution === 'nano' ? 1.5 : 2.5,
                                opacity: isFiltered ? 0.3 : 1,
                                fillOpacity: isFiltered ? 0.2 : zone.resolution === 'nano' ? 0.65 : 0.85,
                                dashArray,
                                className: intensity.level === 0 && !isFiltered ? 'zone-silence-pulse' : '',
                              }}
                            >
                              <Tooltip direction="top" offset={[0, -8]}>
                                <div className="text-xs leading-tight">
                                  <strong>{zone.label || `${zone.lat.toFixed(3)}, ${zone.lng.toFixed(3)}`}</strong>
                                  <br />
                                  <span style={{ color: intensity.color }}>{intensity.name}</span> · {zone.distance_km} km · <span className="text-stone-400">{zone.resolution === 'nano' ? '🔬 100m' : zone.resolution === 'zoom' ? '🔍 200m' : '📡 600m'}</span>
                                  <br />
                                  <span className="font-bold" style={{ color: intensity.color }}>
                                    {zone.observations === 0 ? 'Aucune observation' : `${zone.observations.toLocaleString('fr-FR')} obs.`}
                                  </span>
                                </div>
                              </Tooltip>
                              <Popup>
                                <ZonePopupContent zone={zone} getIntensity={getIntensity} />
                              </Popup>
                            </CircleMarker>
                          );
                        })}
                      </MapContainer>
                    </div>

                    {/* Interactive legend */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 px-1">
                      <button
                        onClick={resetFilters}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-all duration-200 ${
                          activeFilters.size === 0
                            ? 'bg-stone-700 text-white border-stone-700'
                            : 'bg-transparent text-stone-400 border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        Tous
                      </button>
                      {INTENSITY_LEVELS.map((info) => {
                        const isActive = activeFilters.has(info.level);
                        return (
                          <button
                            key={info.level}
                            onClick={() => toggleFilter(info.level)}
                            className="px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-all duration-200 hover:shadow-sm"
                            style={{
                              background: isActive ? info.color : 'transparent',
                              color: isActive ? 'white' : info.color,
                              borderColor: isActive ? info.color : `${info.color}40`,
                            }}
                          >
                            {info.name}
                          </button>
                        );
                      })}
                      <div className="flex items-center gap-1.5 ml-1">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#3b82f6' }} />
                        <span className="text-[11px] text-stone-400">Votre position</span>
                      </div>
                      <div className="flex items-center gap-3 ml-2 pl-2 border-l border-stone-200">
                        <span className="text-[10px] text-stone-400">📡 600m</span>
                        {results.phases_completed >= 2 && <span className="text-[10px] text-stone-400">🔍 200m</span>}
                        {results.phases_completed >= 3 && <span className="text-[10px] text-stone-400">🔬 100m</span>}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse animation for silence zones on map */}
      <style>{`
        @keyframes silencePulse {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 0.4; }
        }
        .zone-silence-pulse {
          animation: silencePulse 2.5s ease-in-out infinite;
        }
      `}</style>
    </motion.div>
  );
};

// ─── Toggle button ───
const ToggleBtn = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button
    onClick={onClick}
    className={`relative flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium transition-all duration-200 ${
      active ? 'text-white' : 'text-stone-500 hover:text-stone-700'
    }`}
  >
    {active && (
      <motion.div
        layoutId="viewToggle"
        className="absolute inset-0 rounded-[10px] m-[2px]"
        style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
    )}
    <span className="relative z-10 flex items-center gap-1.5">{icon}{label}</span>
  </button>
);

// ─── List item ───
const ZoneListItem = ({ zone, index, getIntensity }: { zone: ZoneResult; index: number; getIntensity: (obs: number) => IntensityLevel }) => {
  const intensity = getIntensity(zone.observations);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="group flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all duration-200 hover:shadow-md cursor-default"
      style={{
        background: intensity.bgLight,
        border: `1px solid ${intensity.borderLight}`,
      }}
    >
      {/* Signal bars */}
      <SignalBars level={intensity.level} size={22} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-stone-700 truncate group-hover:text-stone-900 transition-colors">
            {zone.label || `${zone.lat.toFixed(3)}, ${zone.lng.toFixed(3)}`}
          </p>
          {zone.resolution && zone.resolution !== 'maillage' && (
            <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-400 font-medium">
              {zone.resolution === 'nano' ? '🔬 100m' : '🔍 200m'}
            </span>
          )}
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: intensity.color }}>
          <span className="font-medium">{intensity.name}</span>
          <span className="text-stone-400 ml-1">
            — {zone.observations === 0
              ? intensity.phrase
              : `${zone.observations.toLocaleString('fr-FR')} observation${zone.observations > 1 ? 's' : ''}`}
          </span>
        </p>
        {zone.sample_species && zone.sample_species.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {zone.sample_species.map((sp, i) => (
              <span
                key={i}
                className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border"
                style={{
                  background: `${intensity.color}08`,
                  borderColor: `${intensity.color}25`,
                  color: intensity.color,
                }}
                title={sp.commonName ? `${sp.commonName} (${sp.scientificName})` : sp.scientificName}
              >
                🌿 {sp.commonName || sp.scientificName}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Distance pill */}
      <span
        className="shrink-0 text-xs font-bold px-3 py-1 rounded-full"
        style={{
          background: `${intensity.color}18`,
          color: intensity.color,
        }}
      >
        {zone.distance_km} km
      </span>
    </motion.div>
  );
};

// ─── Map popup content ───
const ZonePopupContent = ({ zone, getIntensity }: { zone: ZoneResult; getIntensity: (obs: number) => IntensityLevel }) => {
  const intensity = getIntensity(zone.observations);
  return (
    <div className="min-w-[200px] p-1">
      <div className="flex items-center gap-2.5 mb-2.5">
        <SignalBars level={intensity.level} size={20} />
        <div>
          <span className="font-semibold text-sm text-stone-800 block leading-tight">
            {zone.label || `${zone.lat.toFixed(3)}, ${zone.lng.toFixed(3)}`}
          </span>
          <span className="text-[11px] font-medium" style={{ color: intensity.color }}>
            {intensity.name} du vivant
          </span>
        </div>
      </div>
      <div className="space-y-1.5 text-xs text-stone-500 border-t border-stone-100 pt-2">
        <p>📍 {zone.distance_km} km du point de recherche</p>
        {zone.observations > 0 && (
          <p className="font-bold text-sm" style={{ color: intensity.color }}>
            {zone.observations.toLocaleString('fr-FR')} observation{zone.observations > 1 ? 's' : ''}
          </p>
        )}
        <p className="italic text-stone-400" style={{ fontSize: 11 }}>
          « {intensity.phrase} »
        </p>
        {zone.sample_species && zone.sample_species.length > 0 && (
          <div className="border-t border-stone-100 pt-1.5 mt-1.5">
            <p className="text-[10px] uppercase tracking-wider text-stone-400 mb-1">Espèces observées</p>
            {zone.sample_species.map((sp, i) => (
              <p key={i} className="text-[11px] text-stone-600">
                🌿 <span className="font-medium">{sp.commonName || sp.scientificName}</span>
                {sp.commonName && <span className="text-stone-400 italic ml-1">({sp.scientificName})</span>}
              </p>
            ))}
          </div>
        )}
        <p className="text-[10px] text-stone-300 pt-0.5">{zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}</p>
      </div>
    </div>
  );
};

export default DetecteurZonesBlanches;
