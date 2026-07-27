import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Marker, Popup, GeoJSON, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Filter, Camera, Maximize2, Minimize2, X, Crosshair, ShieldCheck } from 'lucide-react';
import { RevealPhotoLightbox } from './RevealPhotoLightbox';
import { RevealObservationList } from './RevealObservationList';
import { useRevealIndex } from './useRevealIndex';


import { supabase } from '@/integrations/supabase/client';
import { AnalyzeCard } from '@/components/propriete/analyze/AnalyzeCard';
import { RichMap } from '@/components/maps';
import { PLANT_INDICATORS } from '@/lib/plantIndicatorKb';
import { usePropertySpeciesPool } from '@/hooks/propriete/usePropertySpeciesPool';
import { useFrenchSpeciesNamesAuto } from '@/hooks/useFrenchSpeciesNamesAuto';
import { usePropertySpeciesCount } from '@/hooks/propriete/usePropertySpeciesCount';
import { KINGDOM_LABELS_FR_SHORT, KINGDOM_ORDER, normalizeKingdom, type KingdomKey } from '@/lib/kingdomLabels';
import { haversineM } from '@/utils/geoDistance';
import {
  useProprieteParcelles,
  useCanCurateParcelles,
} from '@/hooks/propriete/usePropertyParcelles';
import { buildGeofence, evaluateGeofence, GEOFENCE_LABELS } from '@/lib/geofence';
import GpsControlConsole, { type GpsCandidate } from '@/components/propriete/gps/GpsControlConsole';


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
  const { waypoints: rawWaypoints, curation } = usePropertySpeciesPool(proprieteId);
  const { data: parcelles } = useProprieteParcelles(proprieteId);
  const { data: canCurate } = useCanCurateParcelles(proprieteId);

  const { data: propriete } = useQuery({
    queryKey: ['propriete-coords', proprieteId],
    enabled: !!proprieteId,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('proprietes')
        .select('latitude, longitude, nom, geofence_buffer_m')
        .eq('id', proprieteId!)
        .maybeSingle();
      return data as any;
    },
  });

  const bufferM = Number((propriete as any)?.geofence_buffer_m ?? 25);

  /**
   * Géofence cadastral : chaque observation est située par rapport aux parcelles
   * de la propriété (tampon paramétrable). Sans parcelle renseignée, aucun point
   * n'est jugé — on n'écarte jamais de donnée par défaut.
   */
  const fence = useMemo(() => buildGeofence(parcelles ?? []), [parcelles]);
  const parcelRings = useMemo(() => fence.rings, [fence]);


  const annotated = useMemo<GpsCandidate[]>(
    () =>
      rawWaypoints.map((w) => {
        const ev = evaluateGeofence(fence, w.lat, w.lng, bufferM);
        return { ...w, geofenceStatus: ev.status, geofenceDistanceM: ev.distanceM };
      }),
    [rawWaypoints, fence, bufferM],
  );

  /**
   * Les observations écartées par un curateur sont déjà retirées par la RPC
   * (donc partout : propriété, marches, explorations, événements, exports).
   * On garde ce filtre en ceinture-bretelles pour les caches encore chauds.
   */
  const waypoints = useMemo(
    () => annotated.filter((w) => w.overrideStatus !== 'excluded'),
    [annotated],
  );

  const excludedCount = curation.excluded + (annotated.length - waypoints.length);
  const repositionedCount = curation.repositioned;
  const outsideCount = waypoints.filter((w) => w.geofenceStatus === 'outside').length;


  // Même résolveur FR que le bandeau « Empreinte biodiversité » (source unique)
  const frInput = useMemo(() => {
    const seen = new Map<string, { scientificName: string; commonName: string | null }>();
    for (const w of waypoints) {
      const sci = (w.scientificName || '').trim();
      if (!sci || seen.has(sci)) continue;
      seen.set(sci, { scientificName: sci, commonName: w.commonName || null });
    }
    return Array.from(seen.values());
  }, [waypoints]);
  const { data: frNames } = useFrenchSpeciesNamesAuto(frInput);
  const displayNameFor = (w: { scientificName?: string | null; commonName?: string | null }) => {
    const sci = (w.scientificName || '').trim();
    return frNames?.get(sci)?.displayName || w.commonName || sci || '—';
  };
  // Référence de cohérence : même compteur que le bandeau « Empreinte biodiversité »
  const speciesRef = usePropertySpeciesCount(proprieteId);



  const [kingdom, setKingdom] = useState<KingdomFilter>('all');
  const [onlyKb, setOnlyKb] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'marcheur' | 'inaturalist'>('all');
  const [perimeter, setPerimeter] = useState<'all' | 'inside' | 'outside'>('all');
  const [refitNonce, setRefitNonce] = useState(0);
  const [gpsConsole, setGpsConsole] = useState(false);
  const [showParcels, setShowParcels] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const rowRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());

  /** Sélection carte → la liste défile jusqu'à la ligne correspondante. */
  useEffect(() => {
    if (!selectedId) return;
    const el = rowRefs.current.get(selectedId);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId]);



  /** Parcelles enregistrées de la propriété (mêmes données que Portrait → Cadastre). */
  const drawnParcelles = useMemo(
    () => (parcelles ?? []).filter((p) => p.geometry?.coordinates),
    [parcelles],
  );

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
      if (perimeter === 'inside' && w.geofenceStatus === 'outside') return false;
      if (perimeter === 'outside' && w.geofenceStatus !== 'outside') return false;
      if (onlyKb) {
        const n = norm(w.scientificName);
        const g = n.split(/\s+/)[0];
        if (!kbKeys.has(n) && !kbKeys.has(g)) return false;
      }
      return true;
    });
  }, [waypoints, kingdom, onlyKb, kbKeys, sourceFilter, perimeter]);

  /**
   * Index vivant (recherche « nom contient », tags, tri) partagé avec le bandeau :
   * la carte s'aligne dessus pour ne jamais afficher plus que la liste.
   */
  const revealIndex = useRevealIndex(filtered, displayNameFor);
  const { matched, matchedIds, isActive: indexActive } = revealIndex;




  /**
   * Cadrage : on écarte les points isolés (au-delà du 95e percentile de distance
   * au centroïde) pour que quelques observations lointaines n'étirent pas le cadre.
   * Ces points restent affichés, ils ne pilotent simplement pas le fit initial.
   * Quand une recherche / un tag est actif, on cadre sur les seules correspondances.
   */
  const bounds = useMemo<Array<[number, number]>>(() => {
    const zoomOnMatches = indexActive && matched.length > 0;
    const source = zoomOnMatches ? matched : filtered;
    const pts: Array<[number, number]> = source.map((w) => [w.lat, w.lng]);
    if (!zoomOnMatches && propriete?.latitude != null && propriete?.longitude != null) {
      pts.push([propriete.latitude, propriete.longitude]);
    }
    let core = pts;
    if (pts.length > 6) {
      const cLat = pts.reduce((s, p) => s + p[0], 0) / pts.length;
      const cLng = pts.reduce((s, p) => s + p[1], 0) / pts.length;
      const withD = pts.map((p) => ({
        p,
        d: haversineM(cLat, cLng, p[0], p[1]),
      }));
      const sorted = [...withD].sort((a, b) => a.d - b.d);
      const cut = sorted[Math.floor(sorted.length * 0.95)]?.d ?? Infinity;
      const kept = withD.filter((x) => x.d <= cut).map((x) => x.p);
      if (kept.length >= 2) core = kept;
    }
    // Les sommets des parcelles enregistrées sont inclus dans le cadre d'ensemble.
    if (!zoomOnMatches && showParcels && drawnParcelles.length > 0) {
      core = [...core, ...parcelRings.flatMap((ring) => ring.map((c) => [c[1], c[0]] as [number, number]))];
    }
    // Perturbation infime (~10 cm) pour forcer un nouveau cadrage sur demande.
    if (refitNonce > 0 && core.length > 0) {
      core = [...core];
      core[0] = [core[0][0] + (refitNonce % 2) * 1e-6, core[0][1]];
    }
    return core;
  }, [filtered, matched, indexActive, propriete, refitNonce, showParcels, drawnParcelles, parcelRings]);



  const center: [number, number] =
    propriete?.latitude != null && propriete?.longitude != null
      ? [propriete.latitude, propriete.longitude]
      : filtered[0]
      ? [filtered[0].lat, filtered[0].lng]
      : [45.0, 0.5];

  const iconFor = (color: string, source: 'marcheur' | 'inaturalist', dimmed = false) =>
    L.divIcon({
      className: `reveal-wp-marker${dimmed ? ' reveal-wp-marker--dim' : ''}`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      html:
        source === 'marcheur'
          ? `<div style="width:16px;height:16px;border-radius:50%;background:${color};${dimmed ? 'opacity:.18;' : 'box-shadow:0 0 0 2px #FAF8F3, 0 2px 6px rgba(0,0,0,.3);'}"></div>`
          : `<div style="width:16px;height:16px;border-radius:50%;background:${color}33;border:2px dashed ${color};box-sizing:border-box;${dimmed ? 'opacity:.18;' : 'box-shadow:0 1px 4px rgba(0,0,0,.25);'}"></div>`,
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

  // Total affiché : espèces distinctes actuellement mises en avant sur la carte
  const visibleSpecies = useMemo(
    () => speciesBucket(indexActive ? matched : filtered).size,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered, matched, indexActive],
  );


  // Garde-fou : espèces localisables sur la carte vs total du bandeau du haut
  const localizedSpecies = useMemo(
    () => speciesBucket(waypoints).size,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [waypoints],
  );
  const refTotal = speciesRef.total;

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

      <span className="mx-1 h-4 w-px bg-[hsl(var(--ds-line))]" aria-hidden />
      {([
        ['all', 'Toutes sources'],
        ['marcheur', '📷 Marcheurs'],
        ['inaturalist', '🌐 iNaturalist'],
      ] as Array<['all' | 'marcheur' | 'inaturalist', string]>).map(([v, label]) => (
        <button
          key={v}
          onClick={() => setSourceFilter(v)}
          className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
            sourceFilter === v
              ? 'bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] border-[hsl(var(--ds-forest))]'
              : 'bg-transparent text-[hsl(var(--ds-forest-deep))] border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-forest))]/50'
          }`}
        >
          {label}
        </button>
      ))}

      {!fence.empty && (
        <>
          <span className="mx-1 h-4 w-px bg-[hsl(var(--ds-line))]" aria-hidden />
          {([
            ['all', 'Périmètre : tout'],
            ['inside', '📍 Dans le périmètre'],
            ['outside', `⚠︎ Hors périmètre${outsideCount ? ` · ${outsideCount}` : ''}`],
          ] as Array<['all' | 'inside' | 'outside', string]>).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setPerimeter(v)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                perimeter === v
                  ? 'bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))] border-[hsl(var(--ds-forest-deep))]'
                  : 'bg-transparent text-[hsl(var(--ds-forest-deep))] border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-forest))]/50'
              }`}
            >
              {label}
            </button>
          ))}
        </>
      )}

      {drawnParcelles.length > 0 && (
        <button
          onClick={() => setShowParcels((v) => !v)}
          className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
            showParcels
              ? 'bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] border-[hsl(var(--ds-forest))]'
              : 'bg-transparent text-[hsl(var(--ds-forest-deep))] border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-forest))]/50'
          }`}
        >
          ▱ Périmètre · {drawnParcelles.length} parcelle{drawnParcelles.length > 1 ? 's' : ''}
        </button>
      )}



      {canCurate && (
        <button
          onClick={() => setGpsConsole(true)}
          className="text-[11px] px-2.5 py-1 rounded-full border border-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-forest-deep))] flex items-center gap-1 hover:bg-[hsl(var(--ds-forest-deep))] hover:text-[hsl(var(--ds-cream))] transition"
        >
          <ShieldCheck className="w-3 h-3" /> Contrôle GPS
          {(outsideCount > 0 || excludedCount > 0) && (
            <span className="opacity-70">· {outsideCount + excludedCount}</span>
          )}
        </button>
      )}



      <span className="ml-auto text-[11px] font-semibold text-[hsl(var(--ds-forest))] text-right">
        {visibleSpecies} espèces
        <span className="ml-1 font-normal opacity-60">
          · {indexActive ? `${matched.length} / ${filtered.length}` : filtered.length} obs.
        </span>

        {refTotal > 0 && (
          <span className="block font-normal opacity-55 text-[10px]">
            {localizedSpecies} / {refTotal} espèces localisées
          </span>
        )}
        {(excludedCount > 0 || repositionedCount > 0) && (
          <span className="block font-normal opacity-55 text-[10px]">
            {excludedCount > 0 && (
              <>
                {excludedCount} écartée{excludedCount > 1 ? 's' : ''}
              </>
            )}
            {excludedCount > 0 && repositionedCount > 0 && ' · '}
            {repositionedCount > 0 && (
              <>
                {repositionedCount} repositionnée{repositionedCount > 1 ? 's' : ''}
              </>
            )}
            {' par curation (partout)'}
          </span>
        )}
      </span>


    </div>
  );


  const mapNode = (heightPx: number | string) => (
    <div className="relative rounded-2xl overflow-hidden border border-[hsl(var(--ds-line))]" style={{ height: heightPx }}>
      <RichMap
        center={center}
        zoom={15}
        bounds={bounds.length > 1 ? bounds : undefined}
        fitMaxZoom={16}
        fitPadding={[60, 60]}
        controls={{ zoom: true, style: true, geolocate: false, cadastre: true }}
        maxZoom={22}
        height="100%"
      >
        {showParcels &&
          drawnParcelles.map((p) => (
            <GeoJSON
              key={`parcelle-${p.id}`}
              data={p.geometry as any}
              style={{ color: '#2f5d3a', weight: 2.5, opacity: 0.9, fillColor: '#10b981', fillOpacity: 0.08 }}
            >
              <Tooltip sticky>
                <span style={{ fontSize: 11 }}>
                  {[p.section, p.numero].filter(Boolean).join(' ') || p.parcel_id}
                  {p.commune_nom ? ` · ${p.commune_nom}` : ''}
                  {p.contenance_m2 ? ` · ${p.contenance_m2.toLocaleString('fr-FR')} m²` : ''}
                </span>
              </Tooltip>
            </GeoJSON>
          ))}

        {filtered.map((w) => {
          const color = KINGDOM_COLORS[kingdomFrom(w.kingdom)] || KINGDOM_COLORS.others;
          // Hors correspondance : point fantôme, non cliquable, pour garder le contexte.
          const dim = indexActive && !matchedIds.has(w.id);
          return (
            <Marker
              key={w.id}
              position={[w.lat, w.lng]}
              icon={iconFor(color, w.source, dim)}
              opacity={dim ? 0.35 : 1}
              interactive={!dim}
              zIndexOffset={dim ? -500 : 0}
              ref={(m) => {
                if (m) markerRefs.current.set(w.id, m as unknown as L.Marker);
                else markerRefs.current.delete(w.id);
              }}
              eventHandlers={{ click: () => setSelectedId(w.id) }}
            >

              <Popup>
                <div style={{ minWidth: 160 }}>
                  {w.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setLightboxId(w.id)}
                      title="Agrandir la photo"
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: 0,
                        border: 'none',
                        background: 'none',
                        cursor: 'zoom-in',
                      }}
                    >
                      <img
                        src={w.photoUrl}
                        alt={w.scientificName}
                        style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6, marginBottom: 4 }}
                      />
                      <span style={{ fontSize: 10, color: '#2f5d3a', display: 'block', marginBottom: 4 }}>
                        🔍 Cliquer pour agrandir
                      </span>
                    </button>
                  )}

                  <div style={{ fontWeight: 600, fontSize: 12 }}>
                    {displayNameFor(w)}
                  </div>
                  <div style={{ fontSize: 10, fontStyle: 'italic', color: '#666' }}>
                    {w.scientificName}
                  </div>
                  <div style={{ fontSize: 10, marginTop: 4, color: '#666' }}>
                    {w.source === 'marcheur'
                      ? '📷 Observation marcheur'
                      : `🌐 Observation citoyenne${w.observerName ? ` · ${w.observerName}` : ''}`}
                  </div>
                  {w.geofenceStatus === 'outside' && (
                    <div style={{ fontSize: 10, marginTop: 2, color: '#b4462f' }}>
                      ⚠︎ {GEOFENCE_LABELS.outside}
                      {w.geofenceDistanceM ? ` · ${w.geofenceDistanceM} m` : ''}
                    </div>
                  )}
                  {w.overrideStatus === 'repositioned' && (
                    <div style={{ fontSize: 10, marginTop: 2, color: '#2f5d3a' }}>
                      ✎ Position corrigée par un curateur
                    </div>
                  )}

                  {w.observationDate && (
                    <div style={{ fontSize: 10, marginTop: 2, color: '#888' }}>
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

      {/* Recadrer sur l'ensemble des observations */}
      <button
        type="button"
        onClick={() => setRefitNonce((n) => n + 1)}
        aria-label="Recadrer la carte sur les observations"
        title="Recadrer"
        className="absolute top-14 left-3 z-[400] w-9 h-9 rounded-full bg-[hsl(var(--ds-cream))] text-[hsl(var(--ds-forest-deep))] border border-[hsl(var(--ds-line))] flex items-center justify-center shadow-lg hover:bg-[hsl(var(--ds-forest))] hover:text-[hsl(var(--ds-cream))] transition"
      >
        <Crosshair className="w-4 h-4" />
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
            Cliquez un point pour voir la photo, puis la vignette pour l'agrandir. En plein écran, un
            bandeau latéral liste toutes les observations.
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

                <div className="flex-1 min-h-0 flex">
                  <RevealObservationList
                    items={filtered}
                    selectedId={selectedId}
                    colorFor={(w) => KINGDOM_COLORS[kingdomFrom(w.kingdom)] || KINGDOM_COLORS.others}
                    displayNameFor={displayNameFor}
                    onSelect={(w) => {
                      setSelectedId(w.id);
                      markerRefs.current.get(w.id)?.openPopup();
                    }}
                    onZoomPhoto={(w) => {
                      setSelectedId(w.id);
                      setLightboxId(w.id);
                    }}
                    rowRefs={rowRefs}
                  />
                  <div className="flex-1 min-w-0 p-3 md:p-4">{mapNode('100%')}</div>
                </div>

              </motion.div>
            </AnimatePresence>,
            document.body,
          )}
        </>
      )}

      {canCurate && (
        <GpsControlConsole
          open={gpsConsole}
          onClose={() => setGpsConsole(false)}
          proprieteId={proprieteId}
          candidates={annotated}
          parcelRings={parcelRings}
          center={center}
          displayNameFor={displayNameFor}
        />
      )}

      <AnimatePresence>
        {lightboxId && (
          <RevealPhotoLightbox
            items={filtered}
            currentId={lightboxId}
            onChange={(id) => {
              setLightboxId(id);
              setSelectedId(id);
            }}
            onClose={() => setLightboxId(null)}
            displayNameFor={displayNameFor}
          />
        )}
      </AnimatePresence>
    </AnalyzeCard>


  );
};

