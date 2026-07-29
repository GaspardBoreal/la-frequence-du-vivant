import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  useSetGpsOverride,
  useClearGpsOverride,
  type GpsOverrideKind,
} from '@/hooks/propriete/useGpsOverrides';
import {
  evaluateGeofence,
  nearestPointOnGeofence,
  type Geofence,
  type GeofenceStatus,
} from '@/lib/geofence';
import { haversineM } from '@/utils/geoDistance';
import type { ObservationPopupWaypoint } from '@/components/propriete/species/ObservationPopupCard';

export const SNAP_RADIUS_M = 25;

interface Options {
  proprieteId?: string;
  /** Périmètre cadastral, pour l'aimantation et le verdict « dans la parcelle ». */
  fence?: Geofence;
  /** Résolveur de nom français partagé (bandeau de confirmation). */
  displayNameFor?: (w: { scientificName?: string | null; commonName?: string | null }) => string;
}

export interface InlineGpsCuration {
  /** Observation en cours de repositionnement, `null` hors mode curation. */
  target: ObservationPopupWaypoint | null;
  active: boolean;
  /** Position provisoire (non enregistrée). */
  draft: [number, number] | null;
  origin: [number, number] | null;
  distanceM: number;
  status: GeofenceStatus;
  snapped: boolean;
  label: string;
  saving: boolean;
  start: (w: ObservationPopupWaypoint) => void;
  move: (lat: number, lng: number) => void;
  cancel: () => void;
  save: () => Promise<void>;
  exclude: () => Promise<void>;
}

/**
 * Curation GPS « sur place » : on repositionne une observation directement
 * dans la carte où l'on se trouve, sans changer de vue ni perdre le zoom.
 *
 * La donnée source (iNaturalist / Pl@ntNet) n'est jamais réécrite : on empile
 * une correction durable dans `observation_gps_overrides` avec la position
 * d'origine conservée, annulable d'un clic.
 */
export function useInlineGpsCuration({
  proprieteId,
  fence,
  displayNameFor,
}: Options): InlineGpsCuration {
  const [target, setTarget] = useState<ObservationPopupWaypoint | null>(null);
  const [draft, setDraft] = useState<[number, number] | null>(null);
  const [snapped, setSnapped] = useState(false);
  const setOverride = useSetGpsOverride();
  const clearOverride = useClearGpsOverride();

  const origin = useMemo<[number, number] | null>(
    () => (target ? [target.originalLat ?? target.lat, target.originalLng ?? target.lng] : null),
    [target],
  );

  const start = useCallback((w: ObservationPopupWaypoint) => {
    setTarget(w);
    setDraft([w.lat, w.lng]);
    setSnapped(false);
  }, []);

  const cancel = useCallback(() => {
    setTarget(null);
    setDraft(null);
    setSnapped(false);
  }, []);

  /** Pose du point : aimantation douce sur la parcelle si l'on est en limite. */
  const move = useCallback(
    (lat: number, lng: number) => {
      if (!fence || fence.empty) {
        setDraft([lat, lng]);
        setSnapped(false);
        return;
      }
      const ev = evaluateGeofence(fence, lat, lng, SNAP_RADIUS_M);
      if (ev.status === 'edge') {
        const near = nearestPointOnGeofence(fence, lat, lng);
        if (near) {
          setDraft([near.lat, near.lng]);
          setSnapped(true);
          return;
        }
      }
      setDraft([lat, lng]);
      setSnapped(false);
    },
    [fence],
  );

  const distanceM = useMemo(() => {
    if (!origin || !draft) return 0;
    return Math.round(haversineM(origin[0], origin[1], draft[0], draft[1]));
  }, [origin, draft]);

  const status: GeofenceStatus = useMemo(() => {
    if (!draft || !fence || fence.empty) return 'unknown';
    return evaluateGeofence(fence, draft[0], draft[1], SNAP_RADIUS_M).status;
  }, [draft, fence]);

  const label = useMemo(() => {
    if (!target) return '';
    if (displayNameFor) return displayNameFor(target);
    return target.commonName || target.scientificName || '—';
  }, [target, displayNameFor]);

  const save = useCallback(async () => {
    if (!target || !draft) return;
    if (!target.overrideTargetKey) {
      toast.error('Observation non identifiable — curation impossible');
      return;
    }
    const key = target.overrideTargetKey;
    const kind = (target.overrideKind || 'observation') as GpsOverrideKind;
    await setOverride.mutateAsync({
      kind,
      key,
      status: 'repositioned',
      lat: draft[0],
      lon: draft[1],
      originalLat: origin?.[0] ?? target.lat,
      originalLon: origin?.[1] ?? target.lng,
      reason: 'Repositionnement sur place (carte)',
      proprieteId: proprieteId ?? null,
    });
    toast.success(`${label} · position corrigée (${distanceM} m)`, {
      description: 'La donnée source reste intacte.',
      action: {
        label: 'Annuler',
        onClick: () => clearOverride.mutate({ kind, key }),
      },
    });
    cancel();
  }, [target, draft, origin, proprieteId, label, distanceM, setOverride, clearOverride, cancel]);

  const exclude = useCallback(async () => {
    if (!target?.overrideTargetKey) {
      toast.error('Observation non identifiable — curation impossible');
      return;
    }
    const key = target.overrideTargetKey;
    const kind = (target.overrideKind || 'observation') as GpsOverrideKind;
    await setOverride.mutateAsync({
      kind,
      key,
      status: 'excluded',
      originalLat: origin?.[0] ?? target.lat,
      originalLon: origin?.[1] ?? target.lng,
      reason: 'Écartée depuis la carte',
      proprieteId: proprieteId ?? null,
    });
    toast.success(`${label} · observation écartée`, {
      action: { label: 'Annuler', onClick: () => clearOverride.mutate({ kind, key }) },
    });
    cancel();
  }, [target, origin, proprieteId, label, setOverride, clearOverride, cancel]);

  /** Échap annule, Entrée enregistre. */
  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        cancel();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [target, cancel, save]);

  return {
    target,
    active: !!target,
    draft,
    origin,
    distanceM,
    status,
    snapped,
    label,
    saving: setOverride.isPending,
    start,
    move,
    cancel,
    save,
    exclude,
  };
}

export default useInlineGpsCuration;
