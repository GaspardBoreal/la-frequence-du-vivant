import React from 'react';
import L from 'leaflet';
import { Marker, Popup, Tooltip, Circle, Polyline, useMapEvents } from 'react-leaflet';
import type { Consultation } from '@/hooks/propriete/useGardenClinique';
import {
  STATUS_COLOR,
  STATUS_LABEL,
  KIND_LABEL,
  isActive,
  exposedNeighbors,
  fmtDistance,
  type FocusPoint,
  type ContagionChain,
  type NeighborPoint,
} from '@/lib/gardenSpread';

/* ── Pastille vivante : ce qui bat attend un geste ────────────────────── */

const focusIcon = (p: FocusPoint, opts: { dim?: boolean; placing?: boolean }) => {
  const c = p.consultation;
  const color = STATUS_COLOR[c.status];
  const sev = Math.min(5, Math.max(1, c.severity || 1));
  const size = 30 + sev * 3;
  const r = size / 2;
  const pending = p.actionsTotal - p.actionsDone;
  const ratio = p.actionsTotal ? p.actionsDone / p.actionsTotal : 0;
  const circ = 2 * Math.PI * (r - 3);
  const beat = isActive(c) && pending > 0;

  return L.divIcon({
    className: 'ds-clinique-marker',
    iconSize: [size, size],
    iconAnchor: [r, r],
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;opacity:${opts.dim ? 0.4 : 1};transition:opacity .2s;">
        ${
          beat
            ? `<span style="position:absolute;inset:-6px;border-radius:999px;border:2px solid ${color};opacity:.55;animation:dsFocusPulse 1.8s ease-out infinite;"></span>`
            : ''
        }
        <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="position:absolute;inset:0;filter:drop-shadow(0 2px 6px rgba(20,30,15,.4));">
          <circle cx="${r}" cy="${r}" r="${r - 6}" fill="${color}" fill-opacity="0.92" stroke="#f7f2e6" stroke-width="2"/>
          <circle cx="${r}" cy="${r}" r="${r - 3}" fill="none" stroke="rgba(247,242,230,.35)" stroke-width="2.6"/>
          <circle cx="${r}" cy="${r}" r="${r - 3}" fill="none" stroke="#f7f2e6" stroke-width="2.6"
            stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - ratio)}"
            transform="rotate(-90 ${r} ${r})" stroke-linecap="round"/>
        </svg>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:${10 + sev}px;line-height:1;">
          ${c.status === 'gueri' ? '✓' : c.status === 'perdu' ? '†' : '✳'}
        </div>
        ${
          pending > 0 && isActive(c)
            ? `<div style="position:absolute;right:-4px;bottom:-4px;min-width:15px;height:15px;padding:0 3px;border-radius:999px;background:#f7f2e6;border:1.4px solid ${color};color:#33291c;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;">${pending}</div>`
            : ''
        }
      </div>
      <style>@keyframes dsFocusPulse{0%{transform:scale(.85);opacity:.6}70%{transform:scale(1.5);opacity:0}100%{opacity:0}}</style>`,
  });
};

const btn = (bg: string, fg: string): React.CSSProperties => ({
  width: '100%',
  marginTop: 6,
  borderRadius: 999,
  border: 'none',
  background: bg,
  color: fg,
  padding: '6px 8px',
  fontSize: 11,
  fontWeight: 700,
  cursor: 'pointer',
});

/** Capte le clic carte pendant le mode « poser un foyer ». */
const PlaceCatcher: React.FC<{ onPick: (lat: number, lng: number) => void }> = ({ onPick }) => {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
};

interface Props {
  points: FocusPoint[];
  chains: ContagionChain[];
  neighbors: NeighborPoint[];
  showHalos: boolean;
  showHealed: boolean;
  draggable?: boolean;
  /** Consultation en attente de pose : le prochain clic carte la positionne. */
  placingId?: string | null;
  onPlace?: (id: string, lat: number, lng: number) => void;
  onMove?: (id: string, lat: number, lng: number) => void;
  onOpen?: (c: Consultation) => void;
  onDoneAction?: (p: FocusPoint) => void;
}

/**
 * Couche « État sanitaire » : les foyers de la Clinique posés sur le plan,
 * avec leur halo de propagation et les chaînes de contagion.
 */
export const CliniqueLayer: React.FC<Props> = ({
  points,
  chains,
  neighbors,
  showHalos,
  showHealed,
  draggable,
  placingId,
  onPlace,
  onMove,
  onOpen,
  onDoneAction,
}) => {
  const visible = points.filter((p) => showHealed || isActive(p.consultation));

  return (
    <>
      {placingId && onPlace && (
        <PlaceCatcher onPick={(lat, lng) => onPlace(placingId, lat, lng)} />
      )}

      {showHalos &&
        visible
          .filter((p) => isActive(p.consultation))
          .map((p) => (
            <Circle
              key={`halo-${p.consultation.id}`}
              center={[p.lat, p.lng]}
              radius={p.radiusM}
              pathOptions={{
                color: STATUS_COLOR[p.consultation.status],
                weight: 1,
                opacity: 0.5,
                fillOpacity: 0.08,
                dashArray: '4 5',
              }}
              interactive={false}
            />
          ))}

      {showHalos &&
        chains.flatMap((ch) =>
          ch.links.map(([a, b], i) => (
            <Polyline
              key={`chain-${ch.id}-${i}`}
              positions={[
                [a.lat, a.lng],
                [b.lat, b.lng],
              ]}
              pathOptions={{ color: 'hsl(4 68% 48%)', weight: 2, dashArray: '2 6', opacity: 0.75 }}
              interactive={false}
            />
          )),
        )}

      {visible.map((p) => {
        const c = p.consultation;
        const exposed = exposedNeighbors(p, neighbors);
        const chain = chains.find((ch) => ch.members.some((m) => m.consultation.id === c.id));
        return (
          <Marker
            key={`focus-${c.id}`}
            position={[p.lat, p.lng]}
            icon={focusIcon(p, { dim: !!placingId })}
            draggable={!!draggable && !placingId}
            zIndexOffset={isActive(c) ? 600 : 200}
            eventHandlers={{
              dragend: (e: any) => {
                const ll = e.target.getLatLng();
                onMove?.(c.id, ll.lat, ll.lng);
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -14]}>
              <span style={{ fontSize: 11 }}>
                {c.subject_label} — {STATUS_LABEL[c.status]}
                {p.pathogen ? ` · ${p.pathogen}` : ''}
              </span>
            </Tooltip>
            <Popup>
              <div style={{ minWidth: 232 }}>
                <p
                  style={{
                    margin: 0,
                    fontFamily: 'Playfair Display, Georgia, serif',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#2f5d3a',
                  }}
                >
                  {c.subject_label}
                </p>
                <p style={{ margin: '2px 0 6px', fontSize: 11, color: '#33291c', opacity: 0.75 }}>
                  {STATUS_LABEL[c.status]} · étendue {c.severity ?? 0}/5
                  {p.pathogen ? ` · ${p.pathogen}` : ''}
                </p>

                {p.lastPhotoUrl && (
                  <img
                    src={p.lastPhotoUrl}
                    alt={c.subject_label}
                    style={{
                      width: '100%',
                      height: 96,
                      objectFit: 'cover',
                      borderRadius: 8,
                      marginBottom: 6,
                    }}
                  />
                )}

                {isActive(c) && (
                  <p style={{ margin: '0 0 6px', fontSize: 10.5, fontStyle: 'italic', color: '#33291c', opacity: 0.7 }}>
                    Halo de {fmtDistance(p.radiusM)} — {KIND_LABEL[p.kind]}.
                  </p>
                )}

                {chain && (
                  <p
                    style={{
                      margin: '0 0 6px',
                      padding: '4px 6px',
                      borderRadius: 8,
                      background: 'rgba(190,60,45,.12)',
                      fontSize: 10.5,
                      color: '#7a2318',
                    }}
                  >
                    {chain.members.length} foyers de {chain.pathogen} en chaîne — traiter d’un seul
                    tenant.
                  </p>
                )}

                {exposed.length > 0 && (
                  <p style={{ margin: '0 0 6px', fontSize: 10.5, color: '#33291c', opacity: 0.8 }}>
                    Exposés :{' '}
                    {exposed.map((n) => `${n.label} (${n.distanceM} m)`).join(' · ')}
                  </p>
                )}

                {p.nextAction ? (
                  <div
                    style={{
                      borderTop: '1px solid rgba(47,93,58,.18)',
                      paddingTop: 6,
                      fontSize: 11,
                      color: '#33291c',
                    }}
                  >
                    <strong style={{ color: '#2f5d3a' }}>Prochain geste</strong> ·{' '}
                    {p.nextAction.volet === 'curatif' ? 'curatif' : 'préventif'}
                    <div style={{ marginTop: 2 }}>{p.nextAction.label}</div>
                    {p.nextAction.window && (
                      <div style={{ opacity: 0.65, fontSize: 10 }}>{p.nextAction.window}</div>
                    )}
                    {onDoneAction && (
                      <button type="button" onClick={() => onDoneAction(p)} style={btn('#2f5d3a', '#f7f2e6')}>
                        Geste fait ✓
                      </button>
                    )}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 10.5, fontStyle: 'italic', opacity: 0.65 }}>
                    {p.actionsTotal
                      ? 'Tous les gestes sont réalisés.'
                      : 'Aucune prescription — ouvrez la consultation.'}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => onOpen?.(c)}
                  style={btn('rgba(47,93,58,.12)', '#2f5d3a')}
                >
                  Ouvrir la consultation ›
                </button>

                {draggable && (
                  <p style={{ margin: '6px 0 0', fontSize: 10, fontStyle: 'italic', opacity: 0.55 }}>
                    Glissez la pastille pour corriger sa position.
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

export default CliniqueLayer;
