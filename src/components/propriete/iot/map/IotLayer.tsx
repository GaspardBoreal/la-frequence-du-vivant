import React from 'react';
import L from 'leaflet';
import { Marker, Popup, Tooltip, useMapEvents } from 'react-leaflet';
import type { IotCapteur, IotMesure } from '@/hooks/iot/useIot';
import { sensorHealth, HEALTH_COLOR, fmtMesure, fmtProfondeur, fmtHorodatage } from '@/lib/iot/grandeurs';

const sensorIcon = (c: IotCapteur, opts: { placing?: boolean } = {}) => {
  const h = sensorHealth(c);
  const color = HEALTH_COLOR[h.status];
  const size = 30;
  const r = size / 2;
  const beat = h.status === 'green';
  return L.divIcon({
    className: 'ds-iot-marker',
    iconSize: [size, size],
    iconAnchor: [r, r],
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        ${beat ? `<span style="position:absolute;inset:-6px;border-radius:999px;border:2px solid ${color};opacity:.5;animation:dsIotPulse 2.6s ease-out infinite;"></span>` : ''}
        <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="position:absolute;inset:0;filter:drop-shadow(0 2px 6px rgba(20,30,15,.45));">
          <circle cx="${r}" cy="${r}" r="${r - 5}" fill="${color}" fill-opacity=".95" stroke="#f7f2e6" stroke-width="2"/>
          <path d="M${r - 5} ${r + 4} L${r} ${r - 6} L${r + 5} ${r + 4}" fill="none" stroke="#f7f2e6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="${r}" cy="${r + 5}" r="1.6" fill="#f7f2e6"/>
        </svg>
      </div>
      <style>@keyframes dsIotPulse{0%{transform:scale(.85);opacity:.55}70%{transform:scale(1.6);opacity:0}100%{opacity:0}}</style>`,
  });
};

const PlaceCatcher: React.FC<{ onPick: (lat: number, lng: number) => void }> = ({ onPick }) => {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
};

interface Props {
  capteurs: IotCapteur[];
  latest: Record<string, IotMesure[]>;
  draggable?: boolean;
  placingId?: string | null;
  onPlace?: (id: string, lat: number, lng: number) => void;
  onMove?: (id: string, lat: number, lng: number) => void;
  onOpen?: (c: IotCapteur) => void;
}

/** Les capteurs posés sur le plan du jardin : pastille vivante + dernières mesures. */
export const IotLayer: React.FC<Props> = ({ capteurs, latest, draggable, placingId, onPlace, onMove, onOpen }) => {
  const placed = capteurs.filter((c) => c.lat != null && c.lng != null);

  return (
    <>
      {placingId && onPlace && <PlaceCatcher onPick={(lat, lng) => onPlace(placingId, lat, lng)} />}
      {placed.map((c) => {
        const rows = latest[c.id] ?? [];
        const h = sensorHealth(c);
        return (
          <Marker
            key={c.id}
            position={[c.lat as number, c.lng as number]}
            icon={sensorIcon(c)}
            draggable={!!draggable}
            eventHandlers={{
              dragend: (e: any) => {
                const ll = e.target.getLatLng();
                onMove?.(c.id, ll.lat, ll.lng);
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -14]}>
              {c.nom}
            </Tooltip>
            <Popup>
              <div style={{ minWidth: 190 }}>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{c.nom}</div>
                <div style={{ fontSize: 10, opacity: 0.7 }}>
                  {c.type?.modele} · {h.label}
                </div>
                <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {rows.slice(0, 5).map((m) => (
                    <span
                      key={m.id}
                      style={{ fontSize: 10, background: '#f2efe4', borderRadius: 999, padding: '2px 6px' }}
                    >
                      {fmtProfondeur(m.profondeur_m) ? `${fmtProfondeur(m.profondeur_m)} · ` : ''}
                      {fmtMesure(m.valeur, m.grandeur, m.unite)}
                    </span>
                  ))}
                  {rows.length === 0 && <span style={{ fontSize: 10, fontStyle: 'italic' }}>Aucune mesure</span>}
                </div>
                <div style={{ marginTop: 6, fontSize: 9, opacity: 0.65 }}>{fmtHorodatage(c.last_seen_at)}</div>
                {onOpen && (
                  <button
                    type="button"
                    onClick={() => onOpen(c)}
                    style={{
                      width: '100%', marginTop: 6, borderRadius: 999, border: 'none',
                      background: '#2f4a33', color: '#f7f2e6', padding: '6px 8px',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    Ouvrir la fiche capteur
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

export default IotLayer;
