import React from 'react';
import L from 'leaflet';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import type { SoilSample } from '@/hooks/propriete/usePropertySoil';
import { RESULT_SHORT, type StructureResultId } from '@/components/propriete/analyze/structureTests';
import { TEXTURE_SHORT, type TextureResultId } from '@/components/propriete/analyze/textureTests';
import { classifyPh } from '@/components/propriete/analyze/phTests';
import { scoreLife, LIFE_CLASS_MAP } from '@/components/propriete/analyze/lifeTests';
import { openSampleCore } from '@/components/propriete/analyze/sample/sampleDrawerStore';


/** Teinte de l'anneau selon la texture dominante du prélèvement. */
const TEXTURE_RING: Record<TextureResultId, string> = {
  sable: '#d8b26a',
  limon: '#a98c52',
  argile: '#a4644a',
};

const NEUTRAL_RING = '#8a8577';

export const sampleRingColor = (s: SoilSample): string =>
  s.texture_result ? TEXTURE_RING[s.texture_result] : NEUTRAL_RING;

/** Arc de pH (4 → 9) dessiné autour de la carotte. */
const phArc = (ph: number | null | undefined): string => {
  if (typeof ph !== 'number') return '';
  const t = Math.min(1, Math.max(0, (ph - 4) / 5));
  const r = 17;
  const start = -220;
  const end = start + 260 * t;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const x1 = 20 + r * Math.cos(rad(start));
  const y1 = 20 + r * Math.sin(rad(start));
  const x2 = 20 + r * Math.cos(rad(end));
  const y2 = 20 + r * Math.sin(rad(end));
  const large = end - start > 180 ? 1 : 0;
  const color = classifyPh(ph).color;
  return `<path d="M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" opacity="0.95"/>`;
};

const makeCoreIcon = (s: SoilSample, opts: { linked: boolean; dim: boolean }) => {
  const ring = sampleRingColor(s);
  const size = 40;
  return L.divIcon({
    className: 'ds-soil-core-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;opacity:${opts.dim ? 0.45 : 1};transition:opacity .2s;">
        <svg viewBox="0 0 40 40" width="${size}" height="${size}" style="position:absolute;inset:0;filter:drop-shadow(0 2px 5px rgba(30,40,20,.35));">
          <circle cx="20" cy="20" r="13" fill="#3a2f22" stroke="${ring}" stroke-width="2.6"/>
          <circle cx="20" cy="20" r="13" fill="url(#none)" />
          ${phArc(s.ph_value)}
          ${opts.linked ? '<circle cx="20" cy="20" r="18" fill="none" stroke="#c9a227" stroke-width="1.6" stroke-dasharray="3 3"/>' : ''}
        </svg>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:14px;color:#f4efe4;letter-spacing:.5px;">${s.label}</div>
      </div>
    `,
  });
};

const readingLines = (s: SoilSample): Array<[string, string]> => {
  const rows: Array<[string, string]> = [];
  if (s.texture_result) rows.push(['Texture', TEXTURE_SHORT[s.texture_result as TextureResultId]]);
  if (s.structure_result)
    rows.push(['Structure', RESULT_SHORT[s.structure_result as StructureResultId]]);
  if (typeof s.ph_value === 'number')
    rows.push(['pH', `${s.ph_value.toFixed(1)} · ${classifyPh(s.ph_value).short}`]);
  const life = scoreLife(s.life_signs, s.worm_count);
  if ((s.life_signs?.length ?? 0) > 0 || typeof s.worm_count === 'number')
    rows.push([
      'Vie du sol',
      `${LIFE_CLASS_MAP[life.klass].label}${typeof s.worm_count === 'number' ? ` · ${s.worm_count} vers` : ''}`,
    ]);
  return rows;
};

interface Props {
  samples: SoilSample[];
  /** Propriété courante — permet de charger les preuves dans la fiche carotte. */
  proprieteId?: string;
  /** Prélèvements reliés à l'ouvrage en cours d'édition (halo doré). */
  linkedIds?: string[];
  /** Atténue les prélèvements non reliés quand un ouvrage est sélectionné. */
  focusLinked?: boolean;
  draggable?: boolean;
  onMove?: (id: string, lat: number, lng: number) => void;
  /** Rattacher / détacher le prélèvement de l'ouvrage sélectionné. */
  onToggleLink?: (id: string) => void;
}

/**
 * Couche « Carottes de sol » : les prélèvements de l'étape « J'analyse »
 * rendus lisibles dans l'Atelier et dans la carte des emplacements.
 */
export const SoilSamplesLayer: React.FC<Props> = ({
  samples,
  proprieteId,
  linkedIds = [],
  focusLinked,
  draggable,
  onMove,
  onToggleLink,
}) => {

  const placed = samples.filter((s) => s.lat != null && s.lng != null);
  if (!placed.length) return null;

  return (
    <>
      {placed.map((s) => {
        const linked = linkedIds.includes(s.id);
        const rows = readingLines(s);
        return (
          <Marker
            key={`soil-${s.id}`}
            position={[s.lat as number, s.lng as number]}
            icon={makeCoreIcon(s, { linked, dim: !!focusLinked && !linked })}
            draggable={!!draggable}
            zIndexOffset={linked ? 500 : 200}
            eventHandlers={{
              dragend: (e: any) => {
                const ll = e.target.getLatLng();
                onMove?.(s.id, ll.lat, ll.lng);
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -14]}>
              <span style={{ fontSize: 11 }}>
                Prélèvement {s.label}
                {s.location ? ` · ${s.location}` : ''}
              </span>
            </Tooltip>
            <Popup>
              <div style={{ minWidth: 190 }}>
                <p
                  style={{
                    margin: 0,
                    fontFamily: 'Playfair Display, Georgia, serif',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#2f5d3a',
                  }}
                >
                  Prélèvement {s.label}
                </p>
                {s.location && (
                  <p style={{ margin: '2px 0 6px', fontSize: 11, opacity: 0.7 }}>{s.location}</p>
                )}
                {rows.length ? (
                  <table style={{ fontSize: 11, borderSpacing: 0 }}>
                    <tbody>
                      {rows.map(([k, v]) => (
                        <tr key={k}>
                          <td style={{ paddingRight: 8, opacity: 0.6, whiteSpace: 'nowrap' }}>{k}</td>
                          <td style={{ fontWeight: 600 }}>{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ fontSize: 11, fontStyle: 'italic', opacity: 0.65 }}>
                    Tests non renseignés — complétez l’étape « J’analyse le sol ».
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => openSampleCore(s.id, samples, proprieteId)}
                  style={{
                    marginTop: 8,
                    width: '100%',
                    borderRadius: 999,
                    border: 'none',
                    background: '#2f5d3a',
                    color: '#f7f2e6',
                    padding: '6px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '.04em',
                    cursor: 'pointer',
                  }}
                >
                  Ouvrir la fiche carotte ›
                </button>
                {onToggleLink && (
                  <button
                    type="button"
                    onClick={() => onToggleLink(s.id)}
                    style={{
                      marginTop: 6,
                      width: '100%',
                      borderRadius: 999,
                      border: linked ? '1px solid #c9a227' : '1px solid rgba(47,93,58,.35)',
                      background: linked ? 'rgba(201,162,39,.15)' : 'transparent',
                      padding: '4px 8px',
                      fontSize: 11,
                      cursor: 'pointer',
                      color: '#2f5d3a',
                    }}
                  >
                    {linked ? 'Détacher de l’ouvrage' : 'Relier à l’ouvrage sélectionné'}
                  </button>
                )}

                {draggable && (
                  <p style={{ margin: '6px 0 0', fontSize: 10, fontStyle: 'italic', opacity: 0.55 }}>
                    Glissez la carotte pour la repositionner — l’étape « J’analyse » suit.
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

export default SoilSamplesLayer;
