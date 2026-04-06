import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Leaf, Sparkles, Bug, Flower2, TreeDeciduous } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import { useExplorationBiodiversitySummary } from '@/hooks/useExplorationBiodiversitySummary';
import 'leaflet/dist/leaflet.css';

const EVENT_TYPE_HEX: Record<string, string> = {
  agroecologique: '#10b981',
  eco_poetique: '#8b5cf6',
  eco_tourisme: '#f59e0b',
};

// Haversine distance in km
const haversine = (coords: [number, number][]) => {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const [lat1, lon1] = coords[i - 1];
    const [lat2, lon2] = coords[i];
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return total;
};

interface PastEventExpandedViewProps {
  explorationId: string;
  eventType?: string | null;
}

const PastEventExpandedView: React.FC<PastEventExpandedViewProps> = ({ explorationId, eventType }) => {
  const [activeTab, setActiveTab] = useState<'carte' | 'taxons'>('carte');
  const { data, isLoading } = useExplorationBiodiversitySummary(explorationId);

  const accentColor = EVENT_TYPE_HEX[eventType || ''] || '#78716c';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="w-5 h-5 border-2 border-stone-300 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const tabs = [
    { key: 'carte' as const, label: 'Carte', icon: Map },
    { key: 'taxons' as const, label: 'Taxons', icon: Leaf },
  ];

  return (
    <div className="space-y-2">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-stone-100 dark:bg-stone-800/40 rounded-lg p-0.5">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-medium py-1.5 rounded-md transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-800 dark:text-stone-100'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
            }`}
            style={activeTab === tab.key ? { borderBottom: `2px solid ${accentColor}` } : undefined}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'carte' ? (
          <motion.div
            key="carte"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <MapView data={data} accentColor={accentColor} />
          </motion.div>
        ) : (
          <motion.div
            key="taxons"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <TaxonsView data={data} accentColor={accentColor} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Map sub-view ──────────────────────────────────────────────
const MapView: React.FC<{
  data: NonNullable<ReturnType<typeof useExplorationBiodiversitySummary>['data']>;
  accentColor: string;
}> = ({ data, accentColor }) => {
  const geoSteps = data.speciesByMarche.filter(m => m.latitude && m.longitude);
  if (geoSteps.length === 0) {
    return (
      <p className="text-stone-400 dark:text-stone-500 text-xs text-center py-4">
        Aucune donnée géographique disponible
      </p>
    );
  }

  const coords: [number, number][] = geoSteps
    .sort((a, b) => a.order - b.order)
    .map(m => [m.latitude!, m.longitude!]);

  const center: [number, number] = [
    coords.reduce((s, c) => s + c[0], 0) / coords.length,
    coords.reduce((s, c) => s + c[1], 0) / coords.length,
  ];

  const distKm = haversine(coords);

  return (
    <div className="space-y-1.5">
      <div className="rounded-lg overflow-hidden border border-stone-200 dark:border-stone-600/30 h-40 md:h-48">
        <MapContainer
          center={center}
          zoom={12}
          scrollWheelZoom={false}
          className="h-full w-full [&_.leaflet-tile-pane]:brightness-[0.85] [&_.leaflet-tile-pane]:contrast-[1.1] [&_.leaflet-tile-pane]:saturate-[0.3]"
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png" />
          <Polyline
            positions={coords}
            pathOptions={{ color: accentColor, weight: 3, dashArray: '8,6', opacity: 0.8 }}
          />
          {geoSteps.sort((a, b) => a.order - b.order).map((step, i) => (
            <CircleMarker
              key={step.marcheId}
              center={[step.latitude!, step.longitude!]}
              radius={10}
              pathOptions={{
                color: accentColor,
                fillColor: accentColor,
                fillOpacity: 0.85,
                weight: 2,
              }}
            >
              <Tooltip permanent direction="center" className="past-step-label">
                <span className="text-[10px] font-bold text-white">{i + 1}</span>
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
        <style>{`
          .past-step-label {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .past-step-label .leaflet-tooltip-content {
            display: flex;
            align-items: center;
            justify-content: center;
          }
        `}</style>
      </div>
      <div className="flex items-center justify-center gap-2 text-[10px] text-stone-500 dark:text-stone-400">
        <span>{geoSteps.length} étape{geoSteps.length > 1 ? 's' : ''}</span>
        <span>·</span>
        <span>~{distKm.toFixed(1)} km</span>
        <span>·</span>
        <span>{data.totalSpecies} espèce{data.totalSpecies > 1 ? 's' : ''}</span>
      </div>
    </div>
  );
};

// ── Taxons sub-view ───────────────────────────────────────────
const TaxonsView: React.FC<{
  data: NonNullable<ReturnType<typeof useExplorationBiodiversitySummary>['data']>;
  accentColor: string;
}> = ({ data, accentColor }) => {
  const kingdoms = [
    { label: 'Total', value: data.totalSpecies, icon: Leaf, color: accentColor },
    { label: 'Faune', value: data.speciesByKingdom.birds, icon: Bug, color: '#10b981' },
    { label: 'Flore', value: data.speciesByKingdom.plants, icon: Flower2, color: '#22c55e' },
    { label: 'Champi.', value: data.speciesByKingdom.fungi, icon: TreeDeciduous, color: '#a855f7' },
    { label: 'Autres', value: data.speciesByKingdom.others, icon: Sparkles, color: '#f59e0b' },
  ];

  const top3 = data.topSpecies.slice(0, 3);

  return (
    <div className="space-y-3">
      {/* Kingdom counters */}
      <div className="grid grid-cols-5 gap-1.5">
        {kingdoms.map(k => (
          <div
            key={k.label}
            className="flex flex-col items-center gap-0.5 rounded-lg bg-white/80 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-600/20 py-2 px-1"
          >
            <k.icon className="w-3.5 h-3.5" style={{ color: k.color }} />
            <span className="text-sm font-bold text-stone-800 dark:text-stone-100">{k.value}</span>
            <span className="text-[9px] text-stone-500 dark:text-stone-400 leading-none">{k.label}</span>
          </div>
        ))}
      </div>

      {/* Top 3 species */}
      {top3.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Top 3 espèces
          </p>
          <div className="space-y-1">
            {top3.map((sp, i) => (
              <div
                key={sp.scientificName + i}
                className="flex items-center gap-2.5 rounded-md bg-white/60 dark:bg-stone-800/30 border border-stone-100 dark:border-stone-700/30 p-1.5"
              >
                {sp.photos && sp.photos.length > 0 ? (
                  <img
                    src={sp.photos[0]}
                    alt={sp.name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-stone-200 dark:border-stone-600"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    <Leaf className="w-3.5 h-3.5" style={{ color: accentColor }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-stone-800 dark:text-stone-100 truncate">
                    {sp.commonNameFr || sp.name}
                  </p>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 italic truncate">
                    {sp.scientificName}
                  </p>
                </div>
                <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400 flex-shrink-0">
                  ×{sp.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <p className="text-[10px] text-center text-stone-400 dark:text-stone-500 italic pt-1">
        ✨ Rejoignez la prochaine aventure pour observer ces espèces
      </p>
    </div>
  );
};

export default PastEventExpandedView;
