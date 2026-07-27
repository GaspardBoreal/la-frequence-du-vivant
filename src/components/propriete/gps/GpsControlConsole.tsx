import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Marker, Popup, Polygon, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  X, Crosshair, EyeOff, Check, Undo2, MapPin, ShieldAlert, Leaf, ExternalLink,
  ZoomIn, ChevronLeft, ChevronRight, ListChecks, Copy, Layers, Move,
} from 'lucide-react';
import { useGpsCandidatePhotos, type CandidatePhoto } from '@/hooks/gps/useGpsCandidatePhotos';
import { haversineM } from '@/utils/geoDistance';


import { RichMap } from '@/components/maps';
import { toast } from 'sonner';
import {
  useSetGpsOverride,
  useSetGpsOverridesBatch,
  useClearGpsOverride,
  useGpsOverrides,
  type GpsOverrideKind,
} from '@/hooks/propriete/useGpsOverrides';
import type { PropertyWaypoint } from '@/hooks/propriete/usePropertySpeciesPool';
import type { GeofenceStatus } from '@/lib/geofence';
import { GEOFENCE_LABELS } from '@/lib/geofence';

export interface GpsCandidate extends PropertyWaypoint {
  geofenceStatus: GeofenceStatus;
  geofenceDistanceM: number | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  proprieteId?: string;
  candidates: GpsCandidate[];
  /** Anneaux GeoJSON des parcelles ([lng, lat]) pour dessiner le périmètre */
  parcelRings: Array<Array<[number, number]>>;
  center: [number, number];
  displayNameFor: (w: { scientificName?: string | null; commonName?: string | null }) => string;
}

const STATUS_COLOR: Record<GeofenceStatus, string> = {
  inside: '#2f5d3a',
  edge: '#c99b3a',
  outside: '#b4462f',
  unknown: '#8a8a8a',
};

/** Vignette d'un point de curation (photo réelle, photo d'espèce, ou silhouette). */
const CandidateThumb: React.FC<{
  photo?: CandidatePhoto;
  color: string;
  size?: number;
  onZoom?: () => void;
}> = ({ photo, color, size = 44, onZoom }) => {
  const style = { width: size, height: size };
  if (!photo) {
    return (
      <div
        style={{ ...style, background: `${color}22`, color }}
        className="rounded-lg flex items-center justify-center flex-shrink-0"
      >
        <Leaf className="w-4 h-4 opacity-70" />
      </div>
    );
  }
  return (
    <span
      role={onZoom ? 'button' : undefined}
      title={onZoom ? 'Voir la photo en grand' : undefined}
      onClick={
        onZoom
          ? (e) => {
              e.stopPropagation();
              onZoom();
            }
          : undefined
      }
      className={`group relative rounded-lg overflow-hidden flex-shrink-0 block ${onZoom ? 'cursor-zoom-in' : ''}`}
      style={style}
    >
      <img
        src={photo.url}
        alt=""
        loading="lazy"
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
        }}
      />
      {onZoom && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/35 transition-colors">
          <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </span>
      )}
      {photo.kind === 'species' && (
        <span className="absolute bottom-0 inset-x-0 h-[3px] bg-[hsl(var(--ds-forest))]/70" />
      )}
    </span>
  );
};



/** Clic carte → callback (mode repositionnement) */
const MapClickCapture: React.FC<{ onPick: (lat: number, lng: number) => void; active: boolean }> = ({
  onPick,
  active,
}) => {
  useMapEvents({
    click(e) {
      if (active) onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

/**
 * Console de contrôle GPS — curation éditoriale des observations mal placées.
 *
 * Principe : la donnée source (iNaturalist / Pl@ntNet) n'est jamais réécrite.
 * On enregistre une surcouche durable (`observation_gps_overrides`) que la
 * lecture applique, et que les synchronisations ne peuvent pas écraser.
 */
export const GpsControlConsole: React.FC<Props> = ({
  open,
  onClose,
  proprieteId,
  candidates,
  parcelRings,
  center,
  displayNameFor,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);
  const [coordsInput, setCoordsInput] = useState('');
  const [spread, setSpread] = useState(true);
  const [repositioning, setRepositioning] = useState(false);
  /** Glisser-déposer : position provisoire d'un marqueur, non encore enregistrée. */
  const [dragDraft, setDragDraft] = useState<
    { id: string; from: [number, number]; to: [number, number]; dragging: boolean } | null
  >(null);
  const [scope, setScope] = useState<'suspects' | 'all'>('suspects');
  const setOverride = useSetGpsOverride();
  const setOverridesBatch = useSetGpsOverridesBatch();
  const clearOverride = useClearGpsOverride();
  const { overrides } = useGpsOverrides();

  /**
   * Corrections déjà enregistrées : les points « écartés » ne remontent plus
   * dans le pool (la base les retire partout), il faut donc les lister depuis
   * la table d'overrides pour pouvoir les annuler.
   */
  const applied = useMemo(
    () =>
      Array.from(overrides.values())
        .filter((o) => !proprieteId || !o.propriete_id || o.propriete_id === proprieteId)
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')),
    [overrides, proprieteId],
  );

  const list = useMemo(() => {
    const base =
      scope === 'suspects'
        ? candidates.filter(
            (c) =>
              c.geofenceStatus === 'outside' ||
              c.overrideStatus ||
              (c.positionalAccuracy != null && c.positionalAccuracy > 250) ||
              c.obscured === true,
          )
        : candidates;
    return [...base].sort(
      (a, b) => (b.geofenceDistanceM ?? 0) - (a.geofenceDistanceM ?? 0),
    );
  }, [candidates, scope]);

  const selected = list.find((c) => c.id === selectedId) || null;

  /** Photos des points : cliché marcheur → cliché iNat de l'observation → photo d'espèce. */
  const { photoFor } = useGpsCandidatePhotos(list);

  /** Visionneuse plein écran : on mémorise l'id du point (légende + navigation). */
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const photoList = useMemo(() => list.filter((c) => photoFor.get(c.id)), [list, photoFor]);
  const lightboxIndex = photoList.findIndex((c) => c.id === lightboxId);
  const lightboxItem = lightboxIndex >= 0 ? photoList[lightboxIndex] : null;

  const openLightbox = (id: string) => {
    setSelectedId(id);
    setLightboxId(id);
  };

  const stepLightbox = (dir: 1 | -1) => {
    if (!photoList.length || lightboxIndex < 0) return;
    const next = photoList[(lightboxIndex + dir + photoList.length) % photoList.length];
    setLightboxId(next.id);
    setSelectedId(next.id);
  };

  /** Bandeau gauche synchronisé avec la sélection carte. */
  const rowRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  useEffect(() => {
    if (!selectedId) return;
    rowRefs.current.get(selectedId)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [selectedId]);

  useEffect(() => {
    if (!lightboxId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxId(null);
      if (e.key === 'ArrowRight') stepLightbox(1);
      if (e.key === 'ArrowLeft') stepLightbox(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });




  const targetOf = (c: GpsCandidate): { kind: GpsOverrideKind; key: string } | null => {
    if (!c.overrideTargetKey) return null;
    return { kind: (c.overrideKind || 'observation') as GpsOverrideKind, key: c.overrideTargetKey };
  };

  const act = async (c: GpsCandidate, status: 'excluded' | 'validated', reason?: string) => {
    const t = targetOf(c);
    if (!t) {
      toast.error('Observation non identifiable — curation impossible');
      return;
    }
    await setOverride.mutateAsync({
      kind: t.kind,
      key: t.key,
      status,
      originalLat: c.originalLat ?? c.lat,
      originalLon: c.originalLng ?? c.lng,
      reason: reason ?? null,
      proprieteId: proprieteId ?? null,
    });
    toast.success(status === 'excluded' ? 'Observation écartée du périmètre' : 'Position validée');
  };

  /* ---------- Sélection multiple ---------- */

  const batch = useMemo(() => list.filter((c) => selectedIds.has(c.id)), [list, selectedIds]);

  const toggleRow = (c: GpsCandidate, shiftKey: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (shiftKey && lastClickedId) {
        const a = list.findIndex((x) => x.id === lastClickedId);
        const b = list.findIndex((x) => x.id === c.id);
        if (a >= 0 && b >= 0) {
          const [from, to] = a < b ? [a, b] : [b, a];
          for (let i = from; i <= to; i++) next.add(list[i].id);
          return next;
        }
      }
      if (next.has(c.id)) next.delete(c.id);
      else next.add(c.id);
      return next;
    });
    setLastClickedId(c.id);
  };

  const normSci = (s?: string | null) =>
    (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  const selectSameSpecies = (c: GpsCandidate) => {
    const key = normSci(c.scientificName) || normSci(displayNameFor(c));
    const ids = list
      .filter((x) => (normSci(x.scientificName) || normSci(displayNameFor(x))) === key)
      .map((x) => x.id);
    setSelectedIds(new Set(ids));
    toast.success(`${ids.length} observation${ids.length > 1 ? 's' : ''} de cette espèce sélectionnée${ids.length > 1 ? 's' : ''}`);
  };

  /** Léger éclatement pour que N points superposés restent distinguables. */
  const offsetOf = (i: number, n: number, lat: number): [number, number] => {
    if (!spread || n <= 1) return [0, 0];
    const r = 5; // mètres
    const a = (2 * Math.PI * i) / n;
    return [
      (r * Math.cos(a)) / 111320,
      (r * Math.sin(a)) / (111320 * Math.cos((lat * Math.PI) / 180) || 1),
    ];
  };

  const repositionMany = async (targets: GpsCandidate[], lat: number, lng: number) => {
    const inputs = targets
      .map((c, i) => {
        const t = targetOf(c);
        if (!t) return null;
        const [dLat, dLng] = offsetOf(i, targets.length, lat);
        return {
          kind: t.kind,
          key: t.key,
          status: 'repositioned' as const,
          lat: lat + dLat,
          lon: lng + dLng,
          originalLat: c.originalLat ?? c.lat,
          originalLon: c.originalLng ?? c.lng,
          reason: 'Repositionnement curateur (lot)',
          proprieteId: proprieteId ?? null,
        };
      })
      .filter(Boolean) as any[];
    if (!inputs.length) {
      toast.error('Observations non identifiables — curation impossible');
      return;
    }
    await setOverridesBatch.mutateAsync(inputs);
    setRepositioning(false);
    setSelectedIds(new Set());
  };

  const actMany = async (targets: GpsCandidate[], status: 'excluded' | 'validated', reason: string) => {
    const inputs = targets
      .map((c) => {
        const t = targetOf(c);
        if (!t) return null;
        return {
          kind: t.kind,
          key: t.key,
          status,
          originalLat: c.originalLat ?? c.lat,
          originalLon: c.originalLng ?? c.lng,
          reason,
          proprieteId: proprieteId ?? null,
        };
      })
      .filter(Boolean) as any[];
    if (!inputs.length) return;
    await setOverridesBatch.mutateAsync(inputs);
    setSelectedIds(new Set());
  };

  const clearMany = async (targets: GpsCandidate[]) => {
    for (const c of targets) {
      const t = targetOf(c);
      if (t) await clearOverride.mutateAsync(t);
    }
    setSelectedIds(new Set());
  };

  const parseCoords = (raw: string): [number, number] | null => {
    const m = raw.trim().replace(/;/g, ',').match(/(-?\d+[.,]?\d*)\s*,\s*(-?\d+[.,]?\d*)/);
    if (!m) return null;
    const lat = Number(m[1].replace(',', '.'));
    const lng = Number(m[2].replace(',', '.'));
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)
      return null;
    return [lat, lng];
  };

  const reposition = async (lat: number, lng: number) => {
    const targets = batch.length ? batch : selected ? [selected] : [];
    if (!targets.length) return;
    await repositionMany(targets, lat, lng);
  };

  const applyCoords = async () => {
    const c = parseCoords(coordsInput);
    if (!c) {
      toast.error('Coordonnées illisibles', { description: 'Format attendu : 44.8123, 0.1456' });
      return;
    }
    await reposition(c[0], c[1]);
    setCoordsInput('');
  };

  const undo = async (c: GpsCandidate) => {
    const t = targetOf(c);
    if (!t) return;
    await clearOverride.mutateAsync(t);
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] bg-[hsl(var(--ds-cream))] flex flex-col"
      >
        <header className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-[hsl(var(--ds-line))]">
          <div className="w-9 h-9 rounded-full bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))] flex items-center justify-center">
            <Crosshair className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-[hsl(var(--ds-forest))]/70">
              Curation
            </div>
            <div className="font-serif text-lg text-[hsl(var(--ds-forest-deep))] truncate">
              Contrôle GPS des observations
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {(['suspects', 'all'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                  scope === s
                    ? 'bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] border-[hsl(var(--ds-forest))]'
                    : 'border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest-deep))]'
                }`}
              >
                {s === 'suspects' ? `À traiter · ${list.length}` : 'Tous les points'}
              </button>
            ))}
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="w-10 h-10 rounded-full bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Protocole — pourquoi et jusqu'où porte une correction */}
        <div className="px-4 md:px-6 py-2 border-b border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-forest))]/5">
          <p className="text-[11px] leading-relaxed text-[hsl(var(--ds-forest-deep))]/75">
            <span className="font-semibold">Protocole —</span> 1· repérer le point douteux · 2·
            le repositionner, l'écarter ou le valider · 3· la correction s'applique aussitôt
            <span className="font-medium"> partout</span> : propriété, marche, exploration,
            événement, compteurs et exports. La donnée iNaturalist d'origine n'est jamais modifiée
            chez le fournisseur ; elle est conservée et restituable à tout moment.
          </p>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[360px_1fr]">
          {/* File d'attente */}
          <aside className="border-r border-[hsl(var(--ds-line))] overflow-y-auto">

            {list.length === 0 && (
              <div className="p-6 text-sm text-[hsl(var(--ds-forest-deep))]/70">
                Aucun point suspect : toutes les observations tombent dans le périmètre.
              </div>
            )}
            {list.length > 0 && (
              <div className="px-4 py-2 border-b border-[hsl(var(--ds-line))]/60 flex items-center gap-2 text-[11px] text-[hsl(var(--ds-forest-deep))]/70">
                <ListChecks className="w-3.5 h-3.5" />
                <span>Cochez pour agir en lot · Maj+clic = plage</span>
                {selectedIds.size > 0 && (
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="ml-auto underline hover:text-[hsl(var(--ds-forest-deep))]"
                  >
                    Tout désélectionner
                  </button>
                )}
              </div>
            )}
            {list.map((c) => (
              <button
                key={c.id}
                ref={(el) => {
                  if (el) rowRefs.current.set(c.id, el);
                  else rowRefs.current.delete(c.id);
                }}
                onClick={() => {
                  setSelectedId(c.id);
                  setRepositioning(false);
                }}
                className={`w-full text-left px-4 py-3 border-b border-[hsl(var(--ds-line))]/60 transition ${
                  selectedIds.has(c.id)
                    ? 'bg-[hsl(var(--ds-gold))]/10'
                    : selectedId === c.id
                    ? 'bg-[hsl(var(--ds-forest))]/10 ring-1 ring-inset ring-[hsl(var(--ds-gold))]/60'
                    : 'hover:bg-black/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    role="checkbox"
                    aria-checked={selectedIds.has(c.id)}
                    title="Sélectionner pour une action groupée"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRow(c, e.shiftKey);
                    }}
                    className={`mt-1 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer ${
                      selectedIds.has(c.id)
                        ? 'bg-[hsl(var(--ds-forest))] border-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))]'
                        : 'border-[hsl(var(--ds-line))]'
                    }`}
                  >
                    {selectedIds.has(c.id) && <Check className="w-3 h-3" />}
                  </span>

                  <CandidateThumb
                    photo={photoFor.get(c.id)}
                    color={STATUS_COLOR[c.geofenceStatus]}
                    onZoom={() => openLightbox(c.id)}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: STATUS_COLOR[c.geofenceStatus] }}
                      />
                      <span className="text-sm font-medium text-[hsl(var(--ds-forest-deep))] truncate">
                        {displayNameFor(c)}
                      </span>
                      {c.overrideStatus && (
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))]">
                          {c.overrideStatus === 'excluded'
                            ? 'écartée'
                            : c.overrideStatus === 'repositioned'
                            ? 'corrigée'
                            : 'validée'}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] text-[hsl(var(--ds-forest-deep))]/60 flex flex-wrap gap-x-2">
                      <span>{GEOFENCE_LABELS[c.geofenceStatus]}</span>
                      {c.geofenceDistanceM ? <span>· {c.geofenceDistanceM} m</span> : null}
                      {c.positionalAccuracy != null && <span>· ±{c.positionalAccuracy} m</span>}
                      {c.obscured && <span>· position floutée</span>}
                      <span>· {c.source === 'marcheur' ? 'marcheur' : 'iNaturalist'}</span>
                      {photoFor.get(c.id)?.kind === 'species' && <span>· photo d'espèce</span>}
                    </div>
                  </div>
                </div>
              </button>

            ))}

            {applied.length > 0 && (
              <div className="border-t border-[hsl(var(--ds-line))] mt-2">
                <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest text-[hsl(var(--ds-forest))]/70">
                  Corrections appliquées · {applied.length}
                </div>
                {applied.map((o) => (
                  <div
                    key={o.id}
                    className="px-4 py-2 border-b border-[hsl(var(--ds-line))]/50 flex items-start gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-medium text-[hsl(var(--ds-forest-deep))]">
                        {o.status === 'excluded'
                          ? 'Écartée du diagnostic'
                          : o.status === 'repositioned'
                          ? 'Position corrigée'
                          : 'Position validée'}
                        <span className="ml-1 font-normal opacity-60">
                          · {o.target_kind === 'observation' ? 'marcheur' : 'iNaturalist'}
                        </span>
                      </div>
                      <div className="text-[10px] text-[hsl(var(--ds-forest-deep))]/55 truncate">
                        {o.reason || 'Sans motif'}
                        {o.original_lat != null && o.original_lon != null && (
                          <>
                            {' '}· origine {Number(o.original_lat).toFixed(5)},{' '}
                            {Number(o.original_lon).toFixed(5)}
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        clearOverride.mutate({ kind: o.target_kind, key: o.target_key })
                      }
                      className="text-[10px] px-2 py-1 rounded-full border border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest-deep))] flex items-center gap-1 flex-shrink-0"
                    >
                      <Undo2 className="w-3 h-3" /> Annuler
                    </button>
                  </div>
                ))}
              </div>
            )}
          </aside>


          {/* Carte + actions */}
          <section className="relative min-h-[380px]">
            <RichMap
              center={selected ? [selected.lat, selected.lng] : center}
              zoom={16}
              bounds={
                list.length > 1
                  ? list.map((c) => [c.lat, c.lng] as [number, number])
                  : undefined
              }
              fitMaxZoom={17}
              fitPadding={[60, 60]}
              controls={{ zoom: true, style: true, geolocate: false, cadastre: true }}
              maxZoom={22}
              height="100%"
            >
              <MapClickCapture active={repositioning} onPick={reposition} />

              {parcelRings.map((ring, i) => (
                <Polygon
                  key={`ring-${i}`}
                  positions={ring.map(([lng, lat]) => [lat, lng] as [number, number])}
                  pathOptions={{ color: '#2f5d3a', weight: 2, fillOpacity: 0.06, dashArray: '4 4' }}
                />
              ))}

              {list.map((c) => (
                <Marker
                  key={c.id}
                  position={[c.lat, c.lng]}
                  eventHandlers={{ click: () => setSelectedId(c.id) }}
                  icon={L.divIcon({
                    className: 'gps-curation-marker',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10],
                    html: `<div style="width:18px;height:18px;border-radius:50%;background:${
                      STATUS_COLOR[c.geofenceStatus]
                    };opacity:${c.overrideStatus === 'excluded' ? 0.35 : 1};box-shadow:0 0 0 ${
                      selectedIds.has(c.id)
                        ? '3px #FAF8F3, 0 0 0 6px #C9A227'
                        : selectedId === c.id
                        ? '4px #FAF8F3, 0 0 0 6px ' + STATUS_COLOR[c.geofenceStatus]
                        : '2px #FAF8F3'
                    };"></div>`,
                  })}
                >
                  <Popup>
                    <div style={{ minWidth: 160 }}>
                      {photoFor.get(c.id) && (
                        <button
                          type="button"
                          onClick={() => openLightbox(c.id)}
                          title="Voir la photo en grand"
                          style={{
                            display: 'block',
                            position: 'relative',
                            width: '100%',
                            padding: 0,
                            border: 'none',
                            background: 'none',
                            cursor: 'zoom-in',
                            marginBottom: 6,
                          }}
                        >
                          <img
                            src={photoFor.get(c.id)!.url}
                            alt=""
                            style={{
                              width: '100%',
                              height: 96,
                              objectFit: 'cover',
                              borderRadius: 6,
                              display: 'block',
                            }}
                          />
                          <span
                            style={{
                              position: 'absolute',
                              right: 6,
                              bottom: 6,
                              background: 'rgba(0,0,0,0.55)',
                              color: '#fff',
                              borderRadius: 999,
                              padding: '2px 6px',
                              fontSize: 9,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                          >
                            <ZoomIn style={{ width: 10, height: 10 }} /> Agrandir
                          </span>
                        </button>
                      )}

                      <div style={{ fontWeight: 600, fontSize: 12 }}>{displayNameFor(c)}</div>
                      <div style={{ fontSize: 10, fontStyle: 'italic', color: '#666' }}>
                        {c.scientificName}
                      </div>
                      <div style={{ fontSize: 10, marginTop: 4, color: '#666' }}>
                        {GEOFENCE_LABELS[c.geofenceStatus]}
                        {c.geofenceDistanceM ? ` · ${c.geofenceDistanceM} m` : ''}
                        {photoFor.get(c.id)?.kind === 'species' ? ' · photo d’espèce' : ''}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => selectSameSpecies(c)}
                          style={{
                            fontSize: 10, padding: '3px 8px', borderRadius: 999,
                            border: '1px solid #d8d2c4', background: 'transparent', cursor: 'pointer',
                          }}
                        >
                          Sélectionner toute l’espèce
                        </button>
                        {batch.length > 0 && (
                          <button
                            type="button"
                            onClick={() => repositionMany(batch, c.lat, c.lng)}
                            style={{
                              fontSize: 10, padding: '3px 8px', borderRadius: 999,
                              border: 'none', background: '#2f5d3a', color: '#FAF8F3', cursor: 'pointer',
                            }}
                          >
                            Placer les {batch.length} sélectionnés ici
                          </button>
                        )}
                      </div>
                    </div>
                  </Popup>

                </Marker>
              ))}
            </RichMap>

            {repositioning && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] px-3 py-1.5 rounded-full bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))] text-[11px] shadow-lg">
                {batch.length > 1
                  ? `Cliquez sur la carte pour poser les ${batch.length} points sélectionnés`
                  : 'Cliquez sur la carte pour poser la position corrigée'}
              </div>
            )}

            {/* Barre d'action groupée */}
            {batch.length > 0 && (
              <div
                className={`absolute left-3 right-3 z-[1001] rounded-2xl border border-[hsl(var(--ds-gold))]/50 bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))] px-4 py-3 shadow-2xl ${
                  selected ? 'bottom-[124px]' : 'bottom-3'
                }`}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[12px] font-medium flex items-center gap-1.5">
                    <ListChecks className="w-4 h-4" /> {batch.length} sélectionné
                    {batch.length > 1 ? 's' : ''}
                  </span>

                  <button
                    onClick={() => setRepositioning((v) => !v)}
                    className={`text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1 border ${
                      repositioning
                        ? 'bg-[hsl(var(--ds-gold))] text-[hsl(var(--ds-forest-deep))] border-transparent'
                        : 'border-[hsl(var(--ds-cream))]/40'
                    }`}
                  >
                    <MapPin className="w-3 h-3" /> Repositionner (clic carte)
                  </button>

                  <div className="flex items-center gap-1">
                    <input
                      value={coordsInput}
                      onChange={(e) => setCoordsInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && applyCoords()}
                      placeholder="44.8123, 0.1456"
                      className="text-[11px] px-2.5 py-1.5 rounded-full bg-[hsl(var(--ds-cream))]/10 border border-[hsl(var(--ds-cream))]/30 placeholder:text-[hsl(var(--ds-cream))]/40 w-[140px] outline-none"
                    />
                    <button
                      onClick={applyCoords}
                      className="text-[11px] px-3 py-1.5 rounded-full border border-[hsl(var(--ds-cream))]/40 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Coller
                    </button>
                  </div>

                  {selected && !selectedIds.has(selected.id) && (
                    <button
                      onClick={() => repositionMany(batch, selected.lat, selected.lng)}
                      className="text-[11px] px-3 py-1.5 rounded-full border border-[hsl(var(--ds-cream))]/40 flex items-center gap-1"
                    >
                      <Crosshair className="w-3 h-3" /> Position du point affiché
                    </button>
                  )}

                  <label className="text-[11px] flex items-center gap-1.5 cursor-pointer opacity-90">
                    <input
                      type="checkbox"
                      checked={spread}
                      onChange={(e) => setSpread(e.target.checked)}
                      className="accent-[hsl(var(--ds-gold))]"
                    />
                    <Layers className="w-3 h-3" /> éclatement 5 m
                  </label>

                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => actMany(batch, 'excluded', 'Hors périmètre propriété (lot)')}
                      className="text-[11px] px-3 py-1.5 rounded-full border border-[hsl(var(--ds-cream))]/40 flex items-center gap-1"
                    >
                      <EyeOff className="w-3 h-3" /> Écarter
                    </button>
                    <button
                      onClick={() => actMany(batch, 'validated', 'Position confirmée par le curateur (lot)')}
                      className="text-[11px] px-3 py-1.5 rounded-full bg-[hsl(var(--ds-cream))] text-[hsl(var(--ds-forest-deep))] flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Valider
                    </button>
                    <button
                      onClick={() => clearMany(batch)}
                      className="text-[11px] px-3 py-1.5 rounded-full border border-[hsl(var(--ds-cream))]/40 flex items-center gap-1"
                    >
                      <Undo2 className="w-3 h-3" /> Annuler correction
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selected && (
              <div className="absolute bottom-3 left-3 right-3 z-[1000] rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/95 backdrop-blur px-4 py-3 shadow-xl">
                <div className="flex items-start gap-3 flex-wrap">
                  <CandidateThumb
                    photo={photoFor.get(selected.id)}
                    color={STATUS_COLOR[selected.geofenceStatus]}
                    size={56}
                    onZoom={() => openLightbox(selected.id)}
                  />
                  <div className="min-w-0">
                    <div className="font-serif text-base text-[hsl(var(--ds-forest-deep))] truncate">
                      {displayNameFor(selected)}
                    </div>
                    <div className="text-[11px] text-[hsl(var(--ds-forest-deep))]/65">
                      {GEOFENCE_LABELS[selected.geofenceStatus]}
                      {selected.geofenceDistanceM ? ` · ${selected.geofenceDistanceM} m du périmètre` : ''}
                      {selected.obscured && ' · coordonnées floutées par iNaturalist'}
                      {photoFor.get(selected.id)?.kind === 'species' && ' · photo d’espèce (pas le cliché du point)'}
                    </div>
                    {photoFor.get(selected.id)?.inatUrl && (
                      <a
                        href={photoFor.get(selected.id)!.inatUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-[11px] underline text-[hsl(var(--ds-forest-deep))]/75"
                      >
                        <ExternalLink className="w-3 h-3" /> Voir sur iNaturalist
                      </a>
                    )}
                    {selected.obscured && (
                      <div className="mt-1 text-[11px] text-[hsl(var(--ds-forest-deep))]/70 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Position volontairement imprécise à la
                        source : un repositionnement reste une estimation éditoriale.
                      </div>
                    )}
                  </div>

                  <div className="ml-auto flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => selectSameSpecies(selected)}
                      className="text-[11px] px-3 py-1.5 rounded-full border border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest-deep))] flex items-center gap-1"
                    >
                      <ListChecks className="w-3 h-3" /> Toute l’espèce
                    </button>
                    <button
                      onClick={() => setRepositioning((v) => !v)}
                      className={`text-[11px] px-3 py-1.5 rounded-full border flex items-center gap-1 ${
                        repositioning
                          ? 'bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))] border-transparent'
                          : 'border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest-deep))]'
                      }`}
                    >
                      <MapPin className="w-3 h-3" /> Repositionner
                    </button>
                    <button
                      onClick={() => act(selected, 'excluded', 'Hors périmètre propriété')}
                      className="text-[11px] px-3 py-1.5 rounded-full border border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest-deep))] flex items-center gap-1"
                    >
                      <EyeOff className="w-3 h-3" /> Écarter
                    </button>
                    <button
                      onClick={() => act(selected, 'validated', 'Position confirmée par le curateur')}
                      className="text-[11px] px-3 py-1.5 rounded-full bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Valider
                    </button>
                    {selected.overrideStatus && (
                      <button
                        onClick={() => undo(selected)}
                        className="text-[11px] px-3 py-1.5 rounded-full border border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest-deep))] flex items-center gap-1"
                      >
                        <Undo2 className="w-3 h-3" /> Annuler
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {lightboxItem && photoFor.get(lightboxItem.id) && (
          <div
            className="fixed inset-0 z-[2000] bg-black/90 flex flex-col items-center justify-center p-6"
            onClick={() => setLightboxId(null)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxId(null); }}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white"
              aria-label="Fermer"
            >
              <X className="w-6 h-6" />
            </button>

            {photoList.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); stepLightbox(-1); }}
                  className="absolute left-3 md:left-6 p-2 text-white/70 hover:text-white"
                  aria-label="Précédent"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); stepLightbox(1); }}
                  className="absolute right-3 md:right-6 p-2 text-white/70 hover:text-white"
                  aria-label="Suivant"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            <img
              src={photoFor.get(lightboxItem.id)!.url}
              alt={displayNameFor(lightboxItem)}
              className="max-h-[74vh] max-w-[88vw] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            <div
              className="mt-4 max-w-[88vw] rounded-2xl bg-black/50 backdrop-blur px-5 py-3 text-center text-white/90"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="font-serif text-lg leading-tight">{displayNameFor(lightboxItem)}</div>
              {lightboxItem.scientificName && (
                <div className="text-[12px] italic text-white/60">{lightboxItem.scientificName}</div>
              )}
              <div className="mt-1 text-[11px] text-white/70">
                {GEOFENCE_LABELS[lightboxItem.geofenceStatus]}
                {lightboxItem.geofenceDistanceM ? ` · ${lightboxItem.geofenceDistanceM} m du périmètre` : ''}
                {` · ${lightboxItem.source === 'marcheur' ? 'marcheur' : 'iNaturalist'}`}
                {photoFor.get(lightboxItem.id)?.kind === 'species'
                  ? ' · photo d’espèce (pas le cliché du point)'
                  : ''}
              </div>
              <div className="mt-2 flex items-center justify-center gap-4 text-[11px] text-white/70">
                {photoList.length > 1 && (
                  <span>{lightboxIndex + 1} / {photoList.length}</span>
                )}
                {photoFor.get(lightboxItem.id)?.inatUrl && (
                  <a
                    href={photoFor.get(lightboxItem.id)!.inatUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 underline hover:text-white"
                  >
                    <ExternalLink className="w-3 h-3" /> Voir sur iNaturalist
                  </a>
                )}
                <span className="hidden md:inline text-white/45">← → naviguer · Échap fermer</span>
              </div>
            </div>
          </div>
        )}

      </motion.div>

    </AnimatePresence>,
    document.body,
  );
};

export default GpsControlConsole;
