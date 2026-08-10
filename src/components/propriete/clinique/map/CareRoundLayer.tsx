import React from 'react';
import L from 'leaflet';
import { Marker, Polyline } from 'react-leaflet';
import type { CareRound } from '@/lib/gardenSpread';

const stepIcon = (n: number) =>
  L.divIcon({
    className: 'ds-care-step',
    iconSize: [20, 20],
    iconAnchor: [10, 26],
    html: `<div style="width:20px;height:20px;border-radius:999px;background:#f7f2e6;border:2px solid #2f5d3a;
      color:#2f5d3a;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 5px rgba(20,30,15,.35);">${n}</div>`,
  });

/** Itinéraire de soin : l'ordre dans lequel marcher, tracé sur le plan. */
export const CareRoundLayer: React.FC<{ round: CareRound }> = ({ round }) => {
  if (round.stops.length < 1) return null;
  const path = round.stops.map((s) => [s.lat, s.lng] as [number, number]);
  return (
    <>
      {path.length > 1 && (
        <Polyline
          positions={path}
          pathOptions={{ color: '#2f5d3a', weight: 2.5, opacity: 0.85, dashArray: '1 7', lineCap: 'round' }}
          interactive={false}
        />
      )}
      {round.stops.map((s, i) => (
        <Marker
          key={`step-${s.consultation.id}`}
          position={[s.lat, s.lng]}
          icon={stepIcon(i + 1)}
          interactive={false}
          zIndexOffset={800}
        />
      ))}
    </>
  );
};

export default CareRoundLayer;
