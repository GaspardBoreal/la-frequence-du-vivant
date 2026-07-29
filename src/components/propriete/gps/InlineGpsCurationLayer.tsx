import React from 'react';
import { Marker, Polyline, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { InlineGpsCuration } from '@/hooks/propriete/useInlineGpsCuration';
import { SNAP_RADIUS_M } from '@/hooks/propriete/useInlineGpsCuration';

/** Marqueur « point soulevé » : halo doré pulsé, cible au centre. */
const liftedIcon = L.divIcon({
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  html: `<div style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    background:#C9A227;color:#1e2a20;font-size:15px;line-height:1;font-weight:700;
    box-shadow:0 0 0 4px rgba(250,248,243,.92),0 0 0 9px rgba(201,162,39,.45),0 8px 18px rgba(0,0,0,.35);
    animation:inlineGpsPulse 1.6s ease-in-out infinite;cursor:grab;">✥</div>
  <style>@keyframes inlineGpsPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}</style>`,
});

/** Position d'origine, laissée en fantôme tant que rien n'est enregistré. */
const ghostIcon = L.divIcon({
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  html: `<div style="width:14px;height:14px;border-radius:50%;background:rgba(180,70,47,.35);
    border:1.5px dashed #b4462f;"></div>`,
});

const ClickToPlace: React.FC<{ onPick: (lat: number, lng: number) => void }> = ({ onPick }) => {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
};

/**
 * Couche de repositionnement en place, à insérer comme enfant d'une carte
 * (`RichMap`, `MapContainer`…). Ne modifie jamais la vue : ni recentrage,
 * ni changement de zoom — l'utilisateur garde exactement son cadrage.
 */
export const InlineGpsCurationLayer: React.FC<{ curation: InlineGpsCuration }> = ({ curation }) => {
  const { active, draft, origin, move, snapped } = curation;
  if (!active || !draft || !origin) return null;

  const moved = draft[0] !== origin[0] || draft[1] !== origin[1];

  return (
    <>
      <ClickToPlace onPick={move} />

      {moved && (
        <>
          <Marker position={origin} icon={ghostIcon} interactive={false} />
          <Polyline
            positions={[origin, draft]}
            pathOptions={{ color: '#C9A227', weight: 2, dashArray: '5 6', opacity: 0.95 }}
          />
        </>
      )}

      {snapped && (
        <Circle
          center={draft}
          radius={SNAP_RADIUS_M / 4}
          pathOptions={{ color: '#2f5d3a', weight: 1.5, fillOpacity: 0.12 }}
        />
      )}

      <Marker
        position={draft}
        icon={liftedIcon}
        draggable
        zIndexOffset={1000}
        eventHandlers={{
          dragend: (e: any) => {
            const ll = e.target.getLatLng();
            move(ll.lat, ll.lng);
          },
        }}
      />
    </>
  );
};

export default InlineGpsCurationLayer;
