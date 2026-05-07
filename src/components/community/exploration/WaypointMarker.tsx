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

  let best: { after: string; ordre: number; dist: number } | null = null;
  for (let i = 0; i < geoMarches.length - 1; i++) {
    const a = geoMarches[i]; const b = geoMarches[i + 1];
    const seg = [a, ...(byAfter.get(a.id) || []), b];
    for (let k = 0; k < seg.length - 1; k++) {
      const p1 = seg[k]; const p2 = seg[k + 1];
      // Approx distance from (lat,lng) to segment via projection (planar approx)
      const dist = pointToSegmentKm(lat, lng, p1.latitude, p1.longitude, p2.latitude, p2.longitude);
      if (!best || dist < best.dist) {
        best = { after: a.id, ordre: k, dist };
      }
    }
  }
  return best ? { after_marche_id: best.after, ordre: best.ordre } : null;
}

function pointToSegmentKm(plat: number, plng: number, alat: number, alng: number, blat: number, blng: number) {
  // Treat lat/lng as small-area planar
  const ax = alng, ay = alat, bx = blng, by = blat, px = plng, py = plat;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return haversineKm(py, px, cy, cx);
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
