import React, { useState } from 'react';
import { Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Sparkles, Trash2, Loader2, Leaf, MapPin } from 'lucide-react';
import {
  ExplorationWaypoint,
  useCollectWaypointBio,
  useDeleteWaypoint,
  useUpdateWaypoint,
  useWaypointBioSnapshots,
  haversineKm,
} from '@/hooks/useExplorationWaypoints';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Small amber dot icon
export const waypointIcon = L.divIcon({
  className: 'waypoint-dot',
  html: `<div style="
    width:7px;height:7px;border-radius:50%;
    background:rgba(217,119,6,0.75);
    border:1px solid rgba(254,243,199,0.55);
    box-shadow:0 0 0 1.5px rgba(217,119,6,0.12);
    transition: transform 120ms ease;
  "></div>`,
  iconSize: [7, 7],
  iconAnchor: [3.5, 3.5],
  popupAnchor: [0, -5],
});

export const waypointDraftIcon = L.divIcon({
  className: 'waypoint-draft',
  html: `<div style="
    width:18px;height:18px;border-radius:50%;
    background:rgba(251,191,36,0.85);
    border:2px dashed rgba(255,255,255,0.9);
    box-shadow:0 0 0 6px rgba(251,191,36,0.2);
    animation: pulse 1.4s ease-in-out infinite;
  "></div><style>@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}</style>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/**
 * Determines on which segment (after_marche_id, ordre) a new point falls.
 * Computes distance from the click to each segment between consecutive geoMarches
 * (including any existing waypoints already in that segment).
 */
export function detectSegmentForPoint(
  lat: number,
  lng: number,
  geoMarches: { id: string; latitude: number; longitude: number }[],
  waypoints: ExplorationWaypoint[],
): { after_marche_id: string; ordre: number } | null {
  if (geoMarches.length < 2) {
    return geoMarches.length === 1 ? { after_marche_id: geoMarches[0].id, ordre: 0 } : null;
  }
  const byAfter = new Map<string, ExplorationWaypoint[]>();
  waypoints.forEach((w) => {
    const arr = byAfter.get(w.after_marche_id) || [];
    arr.push(w); byAfter.set(w.after_marche_id, arr);
  });
  byAfter.forEach((arr) => arr.sort((a, b) => a.ordre - b.ordre));

  // Primary metric: "detour" = d(click,p1) + d(click,p2) - d(p1,p2).
  // ~0 when the click lies between p1 and p2; grows fast otherwise.
  // This favours the segment whose endpoints actually bracket the click,
  // instead of a parallel neighbour that just happens to be perpendicularly close.
  let bestDetour: { after: string; ordre: number; score: number; perp: number } | null = null;
  let bestPerp: { after: string; ordre: number; perp: number; inside: boolean } | null = null;

  for (let i = 0; i < geoMarches.length - 1; i++) {
    const a = geoMarches[i]; const b = geoMarches[i + 1];
    const seg = [a, ...(byAfter.get(a.id) || []), b];
    for (let k = 0; k < seg.length - 1; k++) {
      const p1 = seg[k]; const p2 = seg[k + 1];
      const d1 = haversineKm(lat, lng, p1.latitude, p1.longitude);
      const d2 = haversineKm(lat, lng, p2.latitude, p2.longitude);
      const d12 = haversineKm(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
      const detour = Math.max(0, d1 + d2 - d12);
      const { dist: perp, t } = pointToSegmentKmWithT(lat, lng, p1.latitude, p1.longitude, p2.latitude, p2.longitude);
      const inside = t > 0 && t < 1;
      if (!bestDetour || detour < bestDetour.score) {
        bestDetour = { after: a.id, ordre: k, score: detour, perp };
      }
      if (!bestPerp || perp < bestPerp.perp) {
        bestPerp = { after: a.id, ordre: k, perp, inside };
      }
    }
  }

  // Fallback: if the best detour is large (>150 m) and the click doesn't project
  // inside that segment, defer to the classic perpendicular metric.
  if (bestDetour && bestPerp) {
    const detourTooLarge = bestDetour.score > 0.15;
    const perpInside = bestPerp.inside;
    if (detourTooLarge && perpInside) {
      return { after_marche_id: bestPerp.after, ordre: bestPerp.ordre };
    }
    return { after_marche_id: bestDetour.after, ordre: bestDetour.ordre };
  }
  return null;
}

export type EndpointKind = 'step' | 'waypoint';
export interface CandidateEndpoint {
  kind: EndpointKind;
  id: string;
  latitude: number;
  longitude: number;
}
export interface SegmentCandidate {
  after_marche_id: string;
  ordre: number;
  score: number;
  p1: CandidateEndpoint;
  p2: CandidateEndpoint;
  afterMarcheIndex: number; // 0-based index of after_marche in geoMarches
  kInSegment: number;       // ordre slot inside this main segment
  totalInSegment: number;   // total existing waypoints in the same main segment
}

/**
 * Returns all candidate insertion segments, ranked by detour score (best first).
 * Useful for offering the user a confirmation/correction UI.
 */
export function detectSegmentCandidates(
  lat: number,
  lng: number,
  geoMarches: { id: string; latitude: number; longitude: number }[],
  waypoints: ExplorationWaypoint[],
  limit = 4,
): SegmentCandidate[] {
  if (geoMarches.length < 2) return [];
  const byAfter = new Map<string, ExplorationWaypoint[]>();
  waypoints.forEach((w) => {
    const arr = byAfter.get(w.after_marche_id) || [];
    arr.push(w); byAfter.set(w.after_marche_id, arr);
  });
  byAfter.forEach((arr) => arr.sort((a, b) => a.ordre - b.ordre));

  const candidates: SegmentCandidate[] = [];
  for (let i = 0; i < geoMarches.length - 1; i++) {
    const a = geoMarches[i]; const b = geoMarches[i + 1];
    const wpsHere = byAfter.get(a.id) || [];
    const seg = [a, ...wpsHere, b];
    const segMeta: EndpointKind[] = ['step', ...wpsHere.map(() => 'waypoint' as EndpointKind), 'step'];
    for (let k = 0; k < seg.length - 1; k++) {
      const p1 = seg[k]; const p2 = seg[k + 1];
      const d1 = haversineKm(lat, lng, p1.latitude, p1.longitude);
      const d2 = haversineKm(lat, lng, p2.latitude, p2.longitude);
      const d12 = haversineKm(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
      const score = Math.max(0, d1 + d2 - d12);
      candidates.push({
        after_marche_id: a.id,
        ordre: k,
        score,
        p1: { kind: segMeta[k], id: p1.id, latitude: p1.latitude, longitude: p1.longitude },
        p2: { kind: segMeta[k + 1], id: p2.id, latitude: p2.latitude, longitude: p2.longitude },
        afterMarcheIndex: i,
        kInSegment: k,
        totalInSegment: wpsHere.length,
      });
    }
  }

function pointToSegmentKmWithT(plat: number, plng: number, alat: number, alng: number, blat: number, blng: number) {
  const ax = alng, ay = alat, bx = blng, by = blat, px = plng, py = plat;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  const tClamped = Math.max(0, Math.min(1, t));
  const cx = ax + tClamped * dx, cy = ay + tClamped * dy;
  return { dist: haversineKm(py, px, cy, cx), t };
}


interface CreateHandlerProps {
  active: boolean;
  onPick: (lat: number, lng: number) => void;
}

export function WaypointCreateHandler({ active, onPick }: CreateHandlerProps) {
  useMapEvents({
    click(e) {
      if (!active) return;
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface WaypointMarkerProps {
  waypoint: ExplorationWaypoint;
  canEdit: boolean;
  segmentLabel?: string;
}

export function WaypointMarker({ waypoint, canEdit, segmentLabel }: WaypointMarkerProps) {
  const [popupOpen, setPopupOpen] = useState(false);
  const update = useUpdateWaypoint();
  const del = useDeleteWaypoint();
  const collect = useCollectWaypointBio();
  const { data: snapshot, isLoading } = useWaypointBioSnapshots(popupOpen ? waypoint.id : undefined);

  return (
    <Marker
      position={[waypoint.latitude, waypoint.longitude]}
      icon={waypointIcon}
      draggable={canEdit}
      eventHandlers={{
        popupopen: () => setPopupOpen(true),
        popupclose: () => setPopupOpen(false),
        dragend: (e) => {
          if (!canEdit) return;
          const ll = (e.target as L.Marker).getLatLng();
          update.mutate({
            id: waypoint.id,
            eventId: waypoint.marche_event_id,
            latitude: ll.lat,
            longitude: ll.lng,
          });
        },
      }}
    >
      <Popup minWidth={220}>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-amber-700">
            <Sparkles className="w-3.5 h-3.5" />
            Point intermédiaire
          </div>
          {segmentLabel && (
            <div className="text-[11px] text-muted-foreground">{segmentLabel}</div>
          )}
          <div className="font-mono text-[10px] text-muted-foreground tabular-nums">
            {waypoint.latitude.toFixed(5)}, {waypoint.longitude.toFixed(5)}
          </div>

          <div className="border-t pt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium flex items-center gap-1">
                <Leaf className="w-3 h-3 text-emerald-600" /> Biodiversité (500 m)
              </span>
              {waypoint.biodiversity_synced_at && (
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(waypoint.biodiversity_synced_at), { addSuffix: true, locale: fr })}
                </span>
              )}
            </div>
            {isLoading ? (
              <div className="text-[10px] text-muted-foreground">Chargement…</div>
            ) : snapshot ? (
              <div className="text-[11px]">
                <strong className="text-emerald-700">{snapshot.species_count}</strong> espèces ·{' '}
                <strong>{snapshot.observations_count}</strong> obs.
              </div>
            ) : (
              <div className="text-[10px] text-muted-foreground italic">Aucun relevé encore</div>
            )}
            <button
              onClick={() => collect.mutate(waypoint.id)}
              disabled={collect.isPending || !canEdit}
              className="mt-1.5 w-full px-2 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-medium flex items-center justify-center gap-1 disabled:opacity-50"
            >
              {collect.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Leaf className="w-3 h-3" />}
              {snapshot ? 'Actualiser' : 'Collecter'} via iNaturalist
            </button>
            {canEdit && (
              <label className="flex items-center gap-1.5 mt-1.5 text-[10px] text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={waypoint.include_in_biodiversity}
                  onChange={(e) =>
                    update.mutate({
                      id: waypoint.id,
                      eventId: waypoint.marche_event_id,
                      include_in_biodiversity: e.target.checked,
                    })
                  }
                />
                Compter dans le total de l'événement
              </label>
            )}
          </div>

          {canEdit && (
            <div className="border-t pt-2 flex justify-end">
              <button
                onClick={() => {
                  if (confirm('Supprimer ce point intermédiaire ?')) {
                    del.mutate({ id: waypoint.id, eventId: waypoint.marche_event_id });
                  }
                }}
                className="text-[11px] text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Supprimer
              </button>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
