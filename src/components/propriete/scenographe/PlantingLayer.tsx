import React from 'react';
import { Circle, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { STRATES } from '@/lib/plantSpread';
import type { Planting } from '@/hooks/propriete/useOuvrageScenarios';

interface Props {
  plantings: Planting[];
  /** Facteur de croissance appliqué au halo (An 0 / An 3 / An 10). */
  growth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, lat: number, lng: number) => void;
  readOnly?: boolean;
}

const pastille = (p: Planting, selected: boolean) => {
  const info = STRATES[p.strate];
  const size = selected ? 34 : 28;
  const inner = p.photoUrl
    ? `<img src="${p.photoUrl}" alt="" style="width:100%;height:100%;object-fit:cover" loading="lazy"/>`
    : `<span style="font-size:${size / 2}px;line-height:1">${info.glyph}</span>`;
  return L.divIcon({
    className: 'scenographe-pastille',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="
        width:${size}px;height:${size}px;border-radius:9999px;overflow:hidden;
        display:flex;align-items:center;justify-content:center;
        background:#fdfaf3;
        border:2px solid ${selected ? '#c8a24a' : info.color};
        box-shadow:0 2px 8px rgba(20,40,30,.35)${selected ? ',0 0 0 4px rgba(200,162,74,.28)' : ''};
        transition:box-shadow .18s ease;
      ">${inner}</div>`,
  });
};

/**
 * Couche « plan de plantation » : chaque espèce posée porte le halo de son
 * envergure adulte à l'échelle réelle de la carte. C'est ce halo — et non la
 * pastille — qui dit la vérité du projet : recouvrement, vides, concurrences.
 */
export const PlantingLayer: React.FC<Props> = ({
  plantings,
  growth,
  selectedId,
  onSelect,
  onMove,
  readOnly,
}) => (
  <>
    {plantings.map((p) => {
      const info = STRATES[p.strate];
      const radius = Math.max(0.15, (p.spreadM * growth) / 2);
      const selected = selectedId === p.id;
      return (
        <React.Fragment key={p.id}>
          <Circle
            center={[p.lat, p.lng]}
            radius={radius}
            pathOptions={{
              color: info.color,
              weight: selected ? 2 : 1,
              opacity: selected ? 0.95 : 0.6,
              fillColor: info.color,
              fillOpacity: selected ? 0.3 : 0.18,
            }}
            eventHandlers={{ click: () => onSelect(p.id) }}
          />
          <Marker
            position={[p.lat, p.lng]}
            icon={pastille(p, selected)}
            draggable={!readOnly}
            eventHandlers={{
              click: () => onSelect(p.id),
              dragend: (e: any) => {
                const ll = e.target.getLatLng();
                onMove(p.id, ll.lat, ll.lng);
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -16]} opacity={0.95}>
              <span className="text-[11px] font-medium">
                {p.commonNameFr || p.scientificName}
              </span>
              <span className="block text-[10px] opacity-70">
                {info.label} · Ø {(p.spreadM * growth).toFixed(1)} m
              </span>
            </Tooltip>
          </Marker>
        </React.Fragment>
      );
    })}
  </>
);

export default PlantingLayer;
