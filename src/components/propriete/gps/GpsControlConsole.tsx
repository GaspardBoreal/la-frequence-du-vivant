import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Marker, Popup, Polygon, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { X, Crosshair, EyeOff, Check, Undo2, MapPin, ShieldAlert, Leaf, ExternalLink } from 'lucide-react';
import { useGpsCandidatePhotos, type CandidatePhoto } from '@/hooks/gps/useGpsCandidatePhotos';

import { RichMap } from '@/components/maps';
import { toast } from 'sonner';
import {
  useSetGpsOverride,
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
  const [repositioning, setRepositioning] = useState(false);
  const [scope, setScope] = useState<'suspects' | 'all'>('suspects');
  const setOverride = useSetGpsOverride();
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

  const reposition = async (lat: number, lng: number) => {
    if (!selected) return;
    const t = targetOf(selected);
    if (!t) {
      toast.error('Observation non identifiable — curation impossible');
      return;
    }
    await setOverride.mutateAsync({
      kind: t.kind,
      key: t.key,
      status: 'repositioned',
      lat,
      lon: lng,
      originalLat: selected.originalLat ?? selected.lat,
      originalLon: selected.originalLng ?? selected.lng,
      reason: 'Repositionnement curateur',
      proprieteId: proprieteId ?? null,
    });
    setRepositioning(false);
    toast.success('Position corrigée');
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
            {list.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedId(c.id);
                  setRepositioning(false);
                }}
                className={`w-full text-left px-4 py-3 border-b border-[hsl(var(--ds-line))]/60 transition ${
                  selectedId === c.id ? 'bg-[hsl(var(--ds-forest))]/10' : 'hover:bg-black/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <CandidateThumb
                    photo={photoFor.get(c.id)}
                    color={STATUS_COLOR[c.geofenceStatus]}
                    onZoom={(url) => setLightbox(url)}
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
                      selectedId === c.id ? '4px #FAF8F3, 0 0 0 6px ' + STATUS_COLOR[c.geofenceStatus] : '2px #FAF8F3'
                    };"></div>`,
                  })}
                >
                  <Popup>
                    <div style={{ minWidth: 150 }}>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{displayNameFor(c)}</div>
                      <div style={{ fontSize: 10, fontStyle: 'italic', color: '#666' }}>
                        {c.scientificName}
                      </div>
                      <div style={{ fontSize: 10, marginTop: 4, color: '#666' }}>
                        {GEOFENCE_LABELS[c.geofenceStatus]}
                        {c.geofenceDistanceM ? ` · ${c.geofenceDistanceM} m` : ''}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </RichMap>

            {repositioning && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] px-3 py-1.5 rounded-full bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))] text-[11px] shadow-lg">
                Cliquez sur la carte pour poser la position corrigée
              </div>
            )}

            {selected && (
              <div className="absolute bottom-3 left-3 right-3 z-[1000] rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/95 backdrop-blur px-4 py-3 shadow-xl">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-serif text-base text-[hsl(var(--ds-forest-deep))] truncate">
                      {displayNameFor(selected)}
                    </div>
                    <div className="text-[11px] text-[hsl(var(--ds-forest-deep))]/65">
                      {GEOFENCE_LABELS[selected.geofenceStatus]}
                      {selected.geofenceDistanceM ? ` · ${selected.geofenceDistanceM} m du périmètre` : ''}
                      {selected.obscured && ' · coordonnées floutées par iNaturalist'}
                    </div>
                    {selected.obscured && (
                      <div className="mt-1 text-[11px] text-[hsl(var(--ds-forest-deep))]/70 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Position volontairement imprécise à la
                        source : un repositionnement reste une estimation éditoriale.
                      </div>
                    )}
                  </div>
                  <div className="ml-auto flex items-center gap-2 flex-wrap">
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
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
};

export default GpsControlConsole;
