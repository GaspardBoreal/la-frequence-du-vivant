import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Loader2, Compass, List, Map as MapIcon, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useDetecteurZonesBlanches, ZoneResult } from '@/hooks/useDetecteurZonesBlanches';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const ITEMS_PER_PAGE = 4;

// ─── Recenter helper ───
const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  React.useEffect(() => { map.setView([lat, lng], 11); }, [lat, lng, map]);
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
  const { results, isLoading, remainingSearches, searchByGPS, searchByAddress } = useDetecteurZonesBlanches();

  const handleAddressSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    searchByAddress(address);
  };

  const handleGPS = () => {
    setPage(0);
    searchByGPS();
  };

  const exhausted = remainingSearches <= 0;

  const sortedZones = useMemo(() => {
    if (!results) return [];
    return [...results.zones].sort((a, b) => a.distance_km - b.distance_km);
  }, [results]);

  const totalPages = Math.ceil(sortedZones.length / ITEMS_PER_PAGE);
  const pagedZones = sortedZones.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

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
          <p className="text-xs text-stone-400 leading-tight">Trouvez les territoires inexplorés près de vous</p>
        </div>
      </div>

      {exhausted ? (
        <div className="text-center py-8 px-4">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
            <Eye className="w-5 h-5 text-amber-500" />
          </div>
          <p className="font-crimson text-stone-600 text-base italic leading-relaxed max-w-sm mx-auto">
            Vos trois explorations ont été lancées.<br />
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
            <span className="text-sm text-stone-500 font-crimson italic">Exploration des territoires en cours…</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {results && !isLoading && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <div className="border-t border-stone-200/60 pt-5 mt-2">
              {/* Summary + Toggle */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-stone-600">
                  <strong className="text-emerald-700 text-base">{results.blank_count}</strong>{' '}
                  <span className="text-stone-500">zone{results.blank_count > 1 ? 's' : ''} blanche{results.blank_count > 1 ? 's' : ''}</span>
                  <span className="text-stone-300 mx-1.5">·</span>
                  <span className="text-stone-400">{results.total_scanned} points scannés</span>
                </p>

                {/* View toggle */}
                <div className="flex rounded-xl overflow-hidden border border-stone-200" style={{ background: 'rgba(245,245,244,0.6)' }}>
                  <ToggleBtn active={viewMode === 'list'} onClick={() => setViewMode('list')} icon={<List className="w-3.5 h-3.5" />} label="Liste" />
                  <ToggleBtn active={viewMode === 'map'} onClick={() => setViewMode('map')} icon={<MapIcon className="w-3.5 h-3.5" />} label="Carte" />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {viewMode === 'list' ? (
                  <motion.div key="list" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.25 }}>
                    <div className="space-y-2">
                      {pagedZones.map((zone, i) => (
                        <ZoneListItem key={`${zone.lat}-${zone.lng}`} zone={zone} index={i} />
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
                        zoom={11}
                        scrollWheelZoom={false}
                        style={{ height: '100%', width: '100%' }}
                        attributionControl={false}
                      >
                        <RecenterMap lat={results.center.lat} lng={results.center.lng} />
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

                        {/* Center marker */}
                        <Marker position={[results.center.lat, results.center.lng]} icon={centerIcon}>
                          <Tooltip direction="top" offset={[0, -12]} className="leaflet-tooltip-custom">
                            <span className="text-xs font-medium">Votre position</span>
                          </Tooltip>
                        </Marker>

                        {/* Zone markers */}
                        {sortedZones.map((zone) => (
                          <CircleMarker
                            key={`${zone.lat}-${zone.lng}`}
                            center={[zone.lat, zone.lng]}
                            radius={zone.is_blank ? 10 : 7}
                            pathOptions={{
                              fillColor: zone.is_blank ? '#f59e0b' : '#10b981',
                              color: 'white',
                              weight: 2.5,
                              opacity: 1,
                              fillOpacity: 0.85,
                            }}
                          >
                            <Tooltip direction="top" offset={[0, -8]}>
                              <div className="text-xs leading-tight">
                                <strong>{zone.label || `${zone.lat.toFixed(3)}, ${zone.lng.toFixed(3)}`}</strong>
                                <br />
                                {zone.distance_km} km
                              </div>
                            </Tooltip>
                            <Popup>
                              <ZonePopupContent zone={zone} />
                            </Popup>
                          </CircleMarker>
                        ))}
                      </MapContainer>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-5 mt-3 px-1">
                      <LegendDot color="#f59e0b" label="Zone blanche" />
                      <LegendDot color="#10b981" label="Documentée" />
                      <LegendDot color="#3b82f6" label="Votre position" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
const ZoneListItem = ({ zone, index }: { zone: ZoneResult; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.06, duration: 0.3 }}
    className="group flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all duration-200 hover:shadow-md cursor-default"
    style={{
      background: zone.is_blank ? 'rgba(254,243,199,0.25)' : 'rgba(209,250,229,0.2)',
      border: `1px solid ${zone.is_blank ? 'rgba(251,191,36,0.18)' : 'rgba(16,185,129,0.15)'}`,
    }}
  >
    {/* Status dot */}
    <div
      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
      style={{
        background: zone.is_blank ? '#f59e0b' : '#10b981',
        boxShadow: zone.is_blank ? '0 0 8px rgba(245,158,11,0.3)' : '0 0 8px rgba(16,185,129,0.3)',
      }}
    />

    {/* Content */}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-stone-700 truncate group-hover:text-stone-900 transition-colors">
        {zone.label || `${zone.lat.toFixed(3)}, ${zone.lng.toFixed(3)}`}
      </p>
      <p className="text-[11px] text-stone-400 mt-0.5">
        {zone.is_blank ? 'Aucune observation recensée' : `${zone.observations} observation${zone.observations > 1 ? 's' : ''}`}
      </p>
    </div>

    {/* Distance pill */}
    <span
      className="shrink-0 text-xs font-bold px-3 py-1 rounded-full"
      style={{
        background: zone.is_blank ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.1)',
        color: zone.is_blank ? '#b45309' : '#047857',
      }}
    >
      {zone.distance_km} km
    </span>
  </motion.div>
);

// ─── Map popup content ───
const ZonePopupContent = ({ zone }: { zone: ZoneResult }) => (
  <div className="min-w-[180px] p-1">
    <div className="flex items-center gap-2 mb-2">
      <div
        className="w-2.5 h-2.5 rounded-full"
        style={{ background: zone.is_blank ? '#f59e0b' : '#10b981' }}
      />
      <span className="font-semibold text-sm text-stone-800">
        {zone.label || `${zone.lat.toFixed(3)}, ${zone.lng.toFixed(3)}`}
      </span>
    </div>
    <div className="space-y-1 text-xs text-stone-500">
      <p>📍 {zone.distance_km} km du point de recherche</p>
      <p>{zone.is_blank ? '⚠️ Aucune observation recensée' : `✅ ${zone.observations} observation${zone.observations > 1 ? 's' : ''}`}</p>
      <p className="text-[10px] text-stone-300 pt-1">{zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}</p>
    </div>
  </div>
);

// ─── Legend dot ───
const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-1.5">
    <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
    <span className="text-[11px] text-stone-400">{label}</span>
  </div>
);

export default DetecteurZonesBlanches;
