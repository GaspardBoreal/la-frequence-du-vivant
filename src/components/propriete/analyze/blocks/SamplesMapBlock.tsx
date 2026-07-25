import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Plus, X, MapPin, Info, Move3D } from 'lucide-react';
import { AnalyzeCard } from '../AnalyzeCard';
import { RichMap } from '@/components/maps';
import type { SoilSample } from '@/hooks/propriete/usePropertySoil';
import {
  useProprieteParcelles,
  centroidOfParcelles,
} from '@/hooks/propriete/usePropertyParcelles';

const LABELS = ['A', 'B', 'C', 'D', 'E'];
const MAX_SAMPLES = 5;



const makeIcon = (letter: string, active: boolean) =>
  L.divIcon({
    className: 'soil-sample-marker',
    iconSize: [38, 46],
    iconAnchor: [19, 42],
    html: `
      <div style="position:relative;width:38px;height:46px;">
        <div style="
          position:absolute;inset:0;
          filter: drop-shadow(0 3px 6px rgba(30,40,20,.35));
        ">
          <svg viewBox="0 0 38 46" width="38" height="46" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 45 C 6 30 3 20 3 15 A 16 16 0 1 1 35 15 C 35 20 32 30 19 45 Z"
              fill="${active ? '#FAF8F3' : '#f0ebe0'}"
              stroke="#2f5d3a" stroke-width="2.2"/>
          </svg>
        </div>
        <div style="
          position:absolute;left:0;right:0;top:6px;
          text-align:center;
          font-family: 'Playfair Display', Georgia, serif;
          font-weight:700;font-size:16px;
          color:#2f5d3a;
        ">${letter}</div>
        ${active ? `<span style="
          position:absolute;left:50%;top:14px;transform:translate(-50%,-50%);
          width:36px;height:36px;border-radius:50%;
          background: rgba(47,93,58,.22);
          animation: soil-sample-pulse 1.8s ease-out infinite;
        "></span>` : ''}
      </div>
    `,
  });

/** Small controller that runs inside the map to update view when parent centre changes. */
const ViewController: React.FC<{ center: [number, number]; zoom?: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    map.setView(center, zoom ?? map.getZoom(), { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1]]);
  return null;
};

/** Click handler that adds a new sample point (unless max reached). */
const AddOnClick: React.FC<{
  onAdd: (lat: number, lng: number) => void;
  disabled: boolean;
}> = ({ onAdd, disabled }) => {
  useMapEvents({
    click: (e) => {
      if (disabled) return;
      onAdd(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

/** Auto-distribute default sample coords around the centre when none exist yet. */
const seedSampleCoords = (
  samples: SoilSample[],
  center: [number, number] | null,
): SoilSample[] => {
  if (!center) return samples;
  const hasAnyCoord = samples.some((s) => s.lat != null && s.lng != null);
  if (hasAnyCoord) return samples;
  // Triangle représentatif ~30 m autour du centre
  const deg = 0.00027; // ~30 m
  const points: Array<[number, number]> = [
    [center[0] + deg * 0.9, center[1] - deg * 0.9],
    [center[0] + deg * 0.9, center[1] + deg * 0.9],
    [center[0] - deg * 1.1, center[1]],
    [center[0] - deg * 0.4, center[1] + deg * 1.4],
    [center[0] - deg * 0.4, center[1] - deg * 1.4],
  ];
  return samples.map((s, i) => ({
    ...s,
    lat: s.lat ?? points[i % points.length][0],
    lng: s.lng ?? points[i % points.length][1],
  }));
};

export const SamplesMapBlock: React.FC<{
  proprieteId?: string;
  proprieteCenter?: [number, number] | null;
  samples: SoilSample[];
  onUpdate: (id: string, patch: Partial<SoilSample>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  /** Optional: set field on a sample after auto-seeding. */
  onBulkSet?: (next: SoilSample[]) => void;
  index?: number;
}> = ({
  proprieteId,
  proprieteCenter,
  samples,
  onUpdate,
  onAdd,
  onRemove,
  onBulkSet,
  index = 0,
}) => {
  const { data: parcelles = [] } = useProprieteParcelles(proprieteId);
  const parcCenter = useMemo(() => centroidOfParcelles(parcelles), [parcelles]);
  const center: [number, number] = parcCenter ?? proprieteCenter ?? [45.0, 0.5];

  const { waypoints } = usePropertySpeciesPool(proprieteId);
  const [showWaypoints, setShowWaypoints] = useState(true);
  const [kingdomFilter, setKingdomFilter] = useState<KingdomFilter>('all');

  const wpStats = useMemo(() => {
    const c: Record<string, number> = { Plantae: 0, Animalia: 0, Fungi: 0, Other: 0 };
    for (const w of waypoints) c[kingdomFrom(w.kingdom)]++;
    return c;
  }, [waypoints]);

  const visibleWaypoints = useMemo(() => {
    if (!showWaypoints) return [];
    return waypoints.filter((w) =>
      kingdomFilter === 'all' ? true : kingdomFrom(w.kingdom) === kingdomFilter,
    );
  }, [waypoints, showWaypoints, kingdomFilter]);

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Seed default coordinates once the centre is known
  useEffect(() => {
    if (!onBulkSet) return;
    if (!parcCenter && !proprieteCenter) return;
    const missing = samples.some((s) => s.lat == null || s.lng == null);
    if (!missing) return;
    onBulkSet(seedSampleCoords(samples, center));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parcCenter?.[0], parcCenter?.[1], proprieteCenter?.[0], proprieteCenter?.[1]]);

  const parcelleBounds = useMemo<Array<[number, number]>>(() => {
    return parcelles
      .filter((p) => p.centroid_lat != null && p.centroid_lng != null)
      .map((p) => [p.centroid_lat as number, p.centroid_lng as number]);
  }, [parcelles]);

  const bounds = useMemo<Array<[number, number]> | undefined>(() => {
    const pts: Array<[number, number]> = [...parcelleBounds];
    for (const s of samples) {
      if (s.lat != null && s.lng != null) pts.push([s.lat, s.lng]);
    }
    for (const w of visibleWaypoints) pts.push([w.lat, w.lng]);
    return pts.length >= 2 ? pts : undefined;
  }, [samples, parcelleBounds, visibleWaypoints]);

  const disabledAdd = samples.length >= MAX_SAMPLES;

  const handleAdd = (lat: number, lng: number) => {
    const nextIndex = samples.length;
    if (nextIndex >= MAX_SAMPLES) return;
    // Append then patch its coords in the next tick.
    onAdd();
    const newId = LABELS[nextIndex] || String.fromCharCode(65 + nextIndex);
    setTimeout(() => onUpdate(newId, { lat, lng }), 0);
  };

  return (
    <AnalyzeCard
      number={2}
      category="Étape 2 · Prélèvements"
      title="3 à 5 échantillons représentatifs"
      subtitle="Positionnez chaque prélèvement sur la carte de votre propriété. Glissez pour ajuster, cliquez sur la carte pour ajouter un point."
      index={index}
    >
      <style>{`@keyframes soil-sample-pulse{0%{transform:translate(-50%,-50%) scale(.6);opacity:.9}70%{transform:translate(-50%,-50%) scale(2.2);opacity:0}100%{opacity:0}}`}</style>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[hsl(var(--ds-forest-deep))]/70 mb-2">
        <span className="inline-flex items-center gap-1"><Move3D className="w-3 h-3" /> Glissez les pastilles</span>
        <span className="opacity-40">•</span>
        <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> Cliquez la carte pour ajouter</span>
        <span className="ml-auto font-semibold text-[hsl(var(--ds-forest))]">{samples.length} / {MAX_SAMPLES}</span>
      </div>

      {waypoints.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <button
            onClick={() => setShowWaypoints((v) => !v)}
            className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border transition-all ${
              showWaypoints
                ? 'bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))] border-[hsl(var(--ds-forest-deep))]'
                : 'bg-transparent text-[hsl(var(--ds-forest-deep))] border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-forest))]/50'
            }`}
          >
            <Sprout className="w-3 h-3" /> Vivant observé
            <span className="opacity-70">· {waypoints.length}</span>
          </button>
          {showWaypoints && (['all', 'Plantae', 'Animalia', 'Fungi'] as KingdomFilter[]).map((k) => (
            <button
              key={k}
              onClick={() => setKingdomFilter(k)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                kingdomFilter === k
                  ? 'bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] border-[hsl(var(--ds-forest))]'
                  : 'bg-transparent text-[hsl(var(--ds-forest-deep))]/80 border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-forest))]/50'
              }`}
            >
              {k === 'all' ? 'Tous' : k}
              {k !== 'all' && <span className="ml-1 opacity-60">· {wpStats[k] ?? 0}</span>}
            </button>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-5 gap-4">
        <div className="md:col-span-3 space-y-1.5">
        <div className="rounded-2xl overflow-hidden border border-[hsl(var(--ds-line))]" style={{ height: 400 }}>
          <RichMap
            center={center}
            zoom={18}
            bounds={bounds}
            controls={{ zoom: true, style: true, geolocate: false, cadastre: true }}
            maxZoom={22}
            height="100%"
          >
            <ViewController center={center} />
            <AddOnClick onAdd={handleAdd} disabled={disabledAdd} />
            {samples.map((s) =>
              s.lat != null && s.lng != null ? (
                <Marker
                  key={s.id}
                  position={[s.lat, s.lng]}
                  icon={makeIcon(s.label, hoveredId === s.id)}
                  draggable
                  eventHandlers={{
                    dragend: (e) => {
                      const ll = (e.target as L.Marker).getLatLng();
                      onUpdate(s.id, { lat: ll.lat, lng: ll.lng });
                    },
                    mouseover: () => setHoveredId(s.id),
                    mouseout: () => setHoveredId(null),
                  }}
                />
              ) : null,
            )}
            {visibleWaypoints.map((w) => {
              const color = KINGDOM_COLORS[kingdomFrom(w.kingdom)] || KINGDOM_COLORS.Other;
              return (
                <Marker key={`wp-${w.id}`} position={[w.lat, w.lng]} icon={wpIcon(color)}>
                  <Popup>
                    <div style={{ minWidth: 160 }}>
                      {w.photoUrl && (
                        <img
                          src={w.photoUrl}
                          alt={w.scientificName}
                          style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6, marginBottom: 4 }}
                        />
                      )}
                      <div style={{ fontWeight: 600, fontSize: 12 }}>
                        {w.commonName || w.scientificName}
                      </div>
                      <div style={{ fontSize: 10, fontStyle: 'italic', color: '#666' }}>
                        {w.scientificName}
                      </div>
                      {w.observationDate && (
                        <div style={{ fontSize: 10, marginTop: 4, color: '#888' }}>
                          <Camera style={{ display: 'inline', width: 10, height: 10, marginRight: 2 }} />
                          {new Date(w.observationDate).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </RichMap>
        </div>
        <div className="flex items-center justify-center gap-4 text-[10px] text-[hsl(var(--ds-forest-deep))]/60">
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--ds-cream))] border border-[hsl(var(--ds-forest))]" /> Prélèvement</span>
          {waypoints.length > 0 && (
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: KINGDOM_COLORS.Plantae }} /> Observation marcheur</span>
          )}
        </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          {samples.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              onMouseEnter={() => setHoveredId(s.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`flex items-center gap-2.5 rounded-xl border p-2.5 transition ${
                hoveredId === s.id
                  ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))]/8'
                  : 'border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60'
              }`}
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] flex items-center justify-center font-serif font-bold shadow-sm">
                {s.label}
              </div>
              <div className="flex-1 min-w-0">
                <input
                  value={s.location ?? ''}
                  onChange={(e) => onUpdate(s.id, { location: e.target.value })}
                  placeholder="Emplacement (ex. sous le tilleul…)"
                  className="w-full bg-transparent border-none outline-none text-sm text-[hsl(var(--ds-forest-deep))] placeholder:text-[hsl(var(--ds-forest))]/40"
                />
                {s.lat != null && s.lng != null && (
                  <div className="text-[10px] text-[hsl(var(--ds-forest))]/50 mt-0.5">
                    {s.lat.toFixed(5)}, {s.lng.toFixed(5)}
                  </div>
                )}
              </div>
              {samples.length > 3 && (
                <button
                  onClick={() => onRemove(s.id)}
                  aria-label="Retirer le prélèvement"
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[hsl(var(--ds-forest))]/50 hover:text-[hsl(var(--ds-forest-deep))] hover:bg-[hsl(var(--ds-forest))]/10 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          ))}

          {samples.length < MAX_SAMPLES && (
            <button
              onClick={onAdd}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-[hsl(var(--ds-forest))]/40 bg-transparent p-2.5 text-xs font-semibold text-[hsl(var(--ds-forest-deep))] hover:bg-[hsl(var(--ds-forest))]/5 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter un prélèvement (max {MAX_SAMPLES})
            </button>
          )}

          {parcelles.length === 0 && (
            <div className="flex items-start gap-2 rounded-xl bg-[hsl(var(--ds-forest))]/8 border border-[hsl(var(--ds-line))] p-2.5 text-[11px] text-[hsl(var(--ds-forest-deep))]/75 leading-snug">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>
                Astuce : renseignez vos parcelles cadastrales dans l’onglet <strong>Portrait › Cadastre</strong> pour recentrer automatiquement la carte sur votre propriété.
              </span>
            </div>
          )}
        </div>
      </div>
    </AnalyzeCard>
  );
};

export default SamplesMapBlock;
