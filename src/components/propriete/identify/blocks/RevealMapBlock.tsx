import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Filter, Camera, Maximize2, Minimize2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AnalyzeCard } from '@/components/propriete/analyze/AnalyzeCard';
import { RichMap } from '@/components/maps';
import { PLANT_INDICATORS } from '@/lib/plantIndicatorKb';
import { usePropertySpeciesPool } from '@/hooks/propriete/usePropertySpeciesPool';
import { usePropertySpeciesCount } from '@/hooks/propriete/usePropertySpeciesCount';
import { KINGDOM_LABELS_FR_SHORT, KINGDOM_ORDER, normalizeKingdom, type KingdomKey } from '@/lib/kingdomLabels';

const norm = (s: string | null | undefined): string =>
  (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const KINGDOM_COLORS: Record<KingdomKey, string> = {
  plantae: '#2f5d3a',
  animalia: '#c26a3a',
  fungi: '#8a4b8f',
  others: '#8a8a8a',
};

const kingdomFrom = (k?: string | null): KingdomKey => normalizeKingdom(k);

type KingdomFilter = 'all' | KingdomKey;


export const RevealMapBlock: React.FC<{ proprieteId?: string; index?: number }> = ({
  proprieteId,
  index = 0,
}) => {
  const { waypoints } = usePropertySpeciesPool(proprieteId);
  // Référence de cohérence : même compteur que le bandeau « Empreinte biodiversité »
  const speciesRef = usePropertySpeciesCount(proprieteId);

  const { data: propriete } = useQuery({
    queryKey: ['propriete-coords', proprieteId],
    enabled: !!proprieteId,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('proprietes')
        .select('latitude, longitude, nom')
        .eq('id', proprieteId!)
        .maybeSingle();
      return data;
    },
  });

  const [kingdom, setKingdom] = useState<KingdomFilter>('all');
  const [onlyKb, setOnlyKb] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'marcheur' | 'inaturalist'>('all');

  const kbKeys = useMemo(() => {
    const s = new Set<string>();
    for (const p of PLANT_INDICATORS) {
      if (p.latin) s.add(norm(p.latin));
      const g = norm(p.latin).split(/\s+/)[0];
      if (g) s.add(g);
    }
    return s;
  }, []);

  const filtered = useMemo(() => {
    return waypoints.filter((w) => {
      const k = kingdomFrom(w.kingdom);
      if (kingdom !== 'all' && k !== kingdom) return false;
      if (sourceFilter !== 'all' && w.source !== sourceFilter) return false;
      if (onlyKb) {
        const n = norm(w.scientificName);
        const g = n.split(/\s+/)[0];
        if (!kbKeys.has(n) && !kbKeys.has(g)) return false;
      }
      return true;
    });
  }, [waypoints, kingdom, onlyKb, kbKeys, sourceFilter]);


  const bounds = useMemo<Array<[number, number]>>(() => {
    const b: Array<[number, number]> = filtered.map((w) => [w.lat, w.lng]);
    if (propriete?.latitude != null && propriete?.longitude != null) {
      b.push([propriete.latitude, propriete.longitude]);
    }
    return b;
  }, [filtered, propriete]);

  const center: [number, number] =
    propriete?.latitude != null && propriete?.longitude != null
      ? [propriete.latitude, propriete.longitude]
      : filtered[0]
      ? [filtered[0].lat, filtered[0].lng]
      : [45.0, 0.5];

  const iconFor = (color: string, source: 'marcheur' | 'inaturalist') =>
    L.divIcon({
      className: 'reveal-wp-marker',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      html:
        source === 'marcheur'
          ? `<div style="width:16px;height:16px;border-radius:50%;background:${color};box-shadow:0 0 0 2px #FAF8F3, 0 2px 6px rgba(0,0,0,.3);"></div>`
          : `<div style="width:16px;height:16px;border-radius:50%;background:${color}33;border:2px dashed ${color};box-sizing:border-box;box-shadow:0 1px 4px rgba(0,0,0,.25);"></div>`,
    });


  /**
   * Comptage **espèces distinctes** — même méthode que le bandeau
   * « Empreinte biodiversité mesurée ici » (usePropertySpeciesCount) :
   * dédup par nom scientifique normalisé (NFD + lower + trim), règne via
   * normalizeKingdom, un règne identifié l'emporte sur « autres ».
   */
  const speciesBucket = (list: typeof waypoints) => {
    const bucket = new Map<string, KingdomKey>();
    for (const w of list) {
      const key = norm(w.scientificName);
      if (!key) continue;
      const k = kingdomFrom(w.kingdom);
      const existing = bucket.get(key);
      if (!existing || (existing === 'others' && k !== 'others')) bucket.set(key, k);
    }
    return bucket;
  };

  // Pastilles : calculées après le filtre bio-indicatrices, avant le filtre de règne
  const stats = useMemo(() => {
    const base = onlyKb
      ? waypoints.filter((w) => {
          const n = norm(w.scientificName);
          return kbKeys.has(n) || kbKeys.has(n.split(/\s+/)[0]);
        })
      : waypoints;
    const counts: Record<KingdomKey, number> = { plantae: 0, animalia: 0, fungi: 0, others: 0 };
    speciesBucket(base).forEach((k) => {
      counts[k] += 1;
    });
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waypoints, onlyKb, kbKeys]);

  // Total affiché : espèces distinctes actuellement visibles sur la carte
  const visibleSpecies = useMemo(
    () => speciesBucket(filtered).size,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered],
  );


  const hasData = waypoints.length > 0;

  // Esc closes fullscreen + lock body scroll
  useEffect(() => {
    if (!fullscreen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', handler);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  const filtersBar = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 text-[10px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-forest-deep))]/70 mr-1">
        <Filter className="w-3 h-3" /> Filtre
      </div>
      {(['all', ...KINGDOM_ORDER] as KingdomFilter[]).map((k) => (
        <button
          key={k}
          onClick={() => setKingdom(k)}
          className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
            kingdom === k
              ? 'bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] border-[hsl(var(--ds-forest))]'
              : 'bg-transparent text-[hsl(var(--ds-forest-deep))] border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-forest))]/50'
          }`}
        >
          {k === 'all' ? 'Tous' : KINGDOM_LABELS_FR_SHORT[k]}
          {k !== 'all' && <span className="ml-1 opacity-60">· {stats[k] ?? 0}</span>}
        </button>
      ))}
      <button
        onClick={() => setOnlyKb((v) => !v)}
        className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
          onlyKb
            ? 'bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))] border-[hsl(var(--ds-forest-deep))]'
            : 'bg-transparent text-[hsl(var(--ds-forest-deep))] border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-forest))]/50'
        }`}
      >
        🌿 Bio-indicatrices seulement
      </button>
      <span className="ml-auto text-[11px] font-semibold text-[hsl(var(--ds-forest))]">
        {visibleSpecies} espèces
        <span className="ml-1 font-normal opacity-60">· {filtered.length} obs.</span>
      </span>

    </div>
  );

  const mapNode = (heightPx: number | string) => (
    <div className="relative rounded-2xl overflow-hidden border border-[hsl(var(--ds-line))]" style={{ height: heightPx }}>
      <RichMap
        center={center}
        zoom={16}
        bounds={bounds.length > 1 ? bounds : undefined}
        controls={{ zoom: true, style: true, geolocate: false, cadastre: true }}
        maxZoom={22}
        height="100%"
      >
        {filtered.map((w) => {
          const color = KINGDOM_COLORS[kingdomFrom(w.kingdom)] || KINGDOM_COLORS.others;
          return (
            <Marker key={w.id} position={[w.lat, w.lng]} icon={iconFor(color)}>
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

      {/* Fullscreen toggle : top-left to avoid overlapping Géo/Sat/Relief/Cadastre (top-right) */}
      <button
        type="button"
        onClick={() => setFullscreen((v) => !v)}
        aria-label={fullscreen ? 'Quitter le plein écran' : 'Passer en plein écran'}
        className="absolute top-3 left-3 z-[400] w-9 h-9 rounded-full bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] flex items-center justify-center shadow-lg hover:bg-[hsl(var(--ds-forest-deep))] transition"
      >
        {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <AnalyzeCard
      number={2}
      category="Carte des révélations"
      title="Où les marcheurs ont-ils observé le vivant ?"
      subtitle="Chaque point est une observation géolocalisée par un marcheur sur votre propriété."
      index={index}
    >
      {!hasData ? (
        <div className="rounded-2xl border border-dashed border-[hsl(var(--ds-line))] p-6 text-center text-sm italic text-[hsl(var(--ds-forest-deep))]/60">
          <MapPin className="w-6 h-6 mx-auto mb-2 opacity-40" />
          Aucune observation géolocalisée pour l'instant.
          <br />
          <span className="text-xs">Les prochains passages des marcheurs enrichiront cette carte.</span>
        </div>
      ) : (
        <>
          <div className="mb-3">{!fullscreen && filtersBar}</div>

          {!fullscreen ? (
            mapNode(380)
          ) : (
            <div className="rounded-2xl border border-dashed border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/40 h-[380px] flex items-center justify-center text-[hsl(var(--ds-forest-deep))]/50 text-sm">
              Carte affichée en plein écran…
            </div>
          )}

          <div className="mt-2 text-[10px] italic text-[hsl(var(--ds-forest-deep))]/55 text-center">
            Cliquez un point pour voir la photo et la date d'observation.
          </div>

          {/* Fullscreen portal */}
          {fullscreen && createPortal(
            <AnimatePresence>
              <motion.div
                key="reveal-map-fs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[2000] bg-[hsl(var(--ds-cream))] flex flex-col"
                role="dialog"
                aria-modal="true"
                aria-label="Carte des révélations plein écran"
              >
                <header className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/95 backdrop-blur">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] flex items-center justify-center font-serif font-bold shadow-sm">
                    2
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-[hsl(var(--ds-forest))]/70">Carte des révélations</div>
                    <div className="font-serif text-lg text-[hsl(var(--ds-forest-deep))] truncate">
                      Où les marcheurs ont-ils observé le vivant ?
                    </div>
                  </div>
                  <span className="ml-auto text-sm font-semibold text-[hsl(var(--ds-forest))]">
                    {visibleSpecies} espèces
                    <span className="ml-1 font-normal opacity-60">· {filtered.length} obs.</span>
                  </span>

                  <button
                    onClick={() => setFullscreen(false)}
                    aria-label="Fermer le plein écran"
                    className="w-10 h-10 rounded-full bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] flex items-center justify-center hover:bg-[hsl(var(--ds-forest-deep))] transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </header>

                <div className="px-4 md:px-6 py-2.5 border-b border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70">
                  {filtersBar}
                </div>

                <div className="flex-1 min-h-0 p-3 md:p-4">{mapNode('100%')}</div>
              </motion.div>
            </AnimatePresence>,
            document.body,
          )}
        </>
      )}
    </AnalyzeCard>
  );
};

