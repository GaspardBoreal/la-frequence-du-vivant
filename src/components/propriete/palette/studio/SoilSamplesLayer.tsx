import React from 'react';
import L from 'leaflet';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import type { SoilSample } from '@/hooks/propriete/usePropertySoil';
import { type TextureResultId } from '@/components/propriete/analyze/textureTests';
import { openSampleCore } from '@/components/propriete/analyze/sample/sampleDrawerStore';
import { usePropertyTestMedias } from '@/hooks/propriete/usePropertyTestMedias';
import {
  completionRingSvg,
  strataState,
} from '@/components/propriete/analyze/sample/strataGlyphs';
import type { SoilBlockId } from '@/components/propriete/analyze/media/soilTestCatalog';
import {
  StrataSeal,
  StrataCompletionLine,
} from '@/components/propriete/analyze/sample/StrataSeal';


/** Teinte de l'anneau selon la texture dominante du prélèvement. */
const TEXTURE_RING: Record<TextureResultId, string> = {
  sable: '#d8b26a',
  limon: '#a98c52',
  argile: '#a4644a',
};

const NEUTRAL_RING = '#8a8577';

export const sampleRingColor = (s: SoilSample): string =>
  s.texture_result ? TEXTURE_RING[s.texture_result] : NEUTRAL_RING;

/* L'arc de pH est désormais intégré à l'anneau de complétude (sceau des 4 strates). */

const makeCoreIcon = (
  s: SoilSample,
  opts: { linked: boolean; dim: boolean; evidence?: number },
) => {
  const ring = sampleRingColor(s);
  const size = 46;
  const done = strataState(s).filter((x) => x.done).length;
  return L.divIcon({
    className: 'ds-soil-core-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;opacity:${opts.dim ? 0.45 : 1};transition:opacity .2s;">
        <svg viewBox="0 0 46 46" width="${size}" height="${size}" style="position:absolute;inset:0;filter:drop-shadow(0 2px 5px rgba(30,40,20,.35));">
          <circle cx="23" cy="23" r="13" fill="#3a2f22" stroke="${ring}" stroke-width="2.4"/>
          ${completionRingSvg(s, { cx: 23, cy: 23, r: 18, width: 3.2 })}
          ${opts.linked ? '<circle cx="23" cy="23" r="21.6" fill="none" stroke="#c9a227" stroke-width="1.4" stroke-dasharray="3 3"/>' : ''}
        </svg>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:14px;color:#f4efe4;letter-spacing:.5px;">${s.label}</div>
        ${
          opts.evidence
            ? `<div style="position:absolute;right:-2px;bottom:-2px;min-width:15px;height:15px;padding:0 3px;border-radius:999px;background:#f7f2e6;border:1.4px solid #3a2f22;color:#3a2f22;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;">${opts.evidence}</div>`
            : ''
        }
        ${
          done === 4
            ? '<div style="position:absolute;left:-2px;top:-2px;width:11px;height:11px;border-radius:999px;background:#2f7d4f;border:1.4px solid #f7f2e6;"></div>'
            : ''
        }
      </div>
    `,
  });
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
  const { data: medias = [] } = usePropertyTestMedias(proprieteId);
  const evidenceBySample = React.useMemo(() => {
    const m: Record<string, number> = {};
    medias.forEach((x) => {
      m[x.sample_id] = (m[x.sample_id] ?? 0) + 1;
    });
    return m;
  }, [medias]);

  const placed = samples.filter((s) => s.lat != null && s.lng != null);
  if (!placed.length) return null;

  const open = (id: string, block?: SoilBlockId) =>
    openSampleCore(id, samples, proprieteId, block);

  return (
    <>
      {placed.map((s) => {
        const linked = linkedIds.includes(s.id);
        const evidence = evidenceBySample[s.id] ?? 0;
        const strata = strataState(s);
        const done = strata.filter((x) => x.done).length;
        return (
          <Marker
            key={`soil-${s.id}`}
            position={[s.lat as number, s.lng as number]}
            icon={makeCoreIcon(s, { linked, dim: !!focusLinked && !linked, evidence })}
            draggable={!!draggable}
            zIndexOffset={linked ? 500 : 200}
            eventHandlers={{
              dragend: (e: any) => {
                const ll = e.target.getLatLng();
                onMove?.(s.id, ll.lat, ll.lng);
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -16]}>
              <span style={{ fontSize: 11 }}>
                Prélèvement {s.label}
                {s.location ? ` · ${s.location}` : ''} — {done}/4 strates
              </span>
            </Tooltip>
            <Popup>
              <div style={{ minWidth: 210 }}>
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

                {/* Sceau des 4 strates — lecture immédiate du niveau de tests */}
                <div style={{ margin: '8px 0 4px' }}>
                  <StrataSeal
                    sample={s}
                    size="popup"
                    onSelect={(block) => open(s.id, block)}
                  />
                </div>
                <StrataCompletionLine sample={s} evidence={evidence} />
                {done === 0 && (
                  <p style={{ margin: '4px 0 0', fontSize: 10.5, fontStyle: 'italic', opacity: 0.65 }}>
                    Aucun test noté — complétez l’étape « J’analyse le sol ».
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
