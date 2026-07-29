import React from 'react';
import type { ProprieteParcelle } from '@/hooks/propriete/usePropertyParcelles';
import type { ProprieteZone } from '@/hooks/propriete/usePropertyZones';
import type { ProprieteObjet } from '@/hooks/propriete/usePropertyObjets';
import { toolByKey } from '@/lib/ouvrageRecoKb';
import { measureFor, fmtMeasure, fmtArea, geometryAreaM2 } from '@/components/propriete/palette/studio/geoMetrics';

type LngLat = [number, number];

const W = 1000;
const H = 620;
const PAD = 46;

/** Aplatit Polygon / MultiPolygon en anneaux [lng, lat]. */
function ringsOf(geometry: any): LngLat[][] {
  if (!geometry) return [];
  const g = geometry.type === 'Feature' ? geometry.geometry : geometry;
  if (!g?.type) return [];
  if (g.type === 'Polygon') return (g.coordinates ?? []) as LngLat[][];
  if (g.type === 'MultiPolygon')
    return ((g.coordinates ?? []) as LngLat[][][]).flatMap((poly) => poly);
  if (g.type === 'GeometryCollection')
    return ((g.geometries ?? []) as any[]).flatMap((x) => ringsOf(x));
  return [];
}

function lineOf(geometry: any): LngLat[] {
  const g = geometry?.type === 'Feature' ? geometry.geometry : geometry;
  if (g?.type === 'LineString') return (g.coordinates ?? []) as LngLat[];
  if (g?.type === 'MultiLineString')
    return ((g.coordinates ?? []) as LngLat[][]).flat() as LngLat[];
  return [];
}

function pointOf(geometry: any): LngLat | null {
  const g = geometry?.type === 'Feature' ? geometry.geometry : geometry;
  if (g?.type === 'Point' && Array.isArray(g.coordinates)) return g.coordinates as LngLat;
  return null;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface Props {
  parcelles?: ProprieteParcelle[];
  zones?: ProprieteZone[];
  objets?: ProprieteObjet[];
  propertyName?: string;
  commune?: string | null;
  completedAt?: string | null;
}

/**
 * Planche « Le plan gravé » — parcelles cadastrales, emplacements lettrés et
 * ouvrages numérotés, projetés en SVG (aucune tuile cartographique : rendu
 * strictement reproductible à l'impression).
 */
export const PalettePlanSchema: React.FC<Props> = ({
  parcelles = [],
  zones = [],
  objets = [],
  propertyName,
  commune,
  completedAt,
}) => {
  const visibleZones = React.useMemo(
    () => zones.filter((z) => z.visible !== false && z.geometry),
    [zones],
  );
  const visibleObjets = React.useMemo(
    () => objets.filter((o) => o.style?.visible !== false && o.geometry),
    [objets],
  );

  const geo = React.useMemo(() => {
    const parcelRings = parcelles.flatMap((p) => ringsOf(p.geometry));
    const zoneRings = visibleZones.map((z) => ringsOf(z.geometry)[0]).filter(Boolean) as LngLat[][];
    const objPolys = visibleObjets.map((o) => ringsOf(o.geometry)[0]).filter(Boolean) as LngLat[][];
    const objLines = visibleObjets.map((o) => lineOf(o.geometry)).filter((l) => l.length > 1);
    const objPoints = visibleObjets
      .map((o) => pointOf(o.geometry))
      .filter(Boolean) as LngLat[];

    const pts: LngLat[] = [
      ...parcelRings.flat(),
      ...zoneRings.flat(),
      ...objPolys.flat(),
      ...objLines.flat(),
      ...objPoints,
    ];
    if (pts.length === 0) return null;

    let minLng = Infinity,
      maxLng = -Infinity,
      minLat = Infinity,
      maxLat = -Infinity;
    for (const [lng, lat] of pts) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
    const cLat = (minLat + maxLat) / 2;
    const cLng = (minLng + maxLng) / 2;
    const k = Math.cos((cLat * Math.PI) / 180) || 1;
    const mPerDegLat = 111320;

    const wM = Math.max((maxLng - minLng) * mPerDegLat * k, 12) * 1.16;
    const hM = Math.max((maxLat - minLat) * mPerDegLat, 12) * 1.16;
    const scale = Math.min((W - PAD * 2) / wM, (H - PAD * 2) / hM);

    const project = ([lng, lat]: LngLat): [number, number] => [
      W / 2 + (lng - cLng) * mPerDegLat * k * scale,
      H / 2 - (lat - cLat) * mPerDegLat * scale,
    ];
    const toPath = (ring: LngLat[]) =>
      ring.map((c, i) => {
        const [x, y] = project(c);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ') + ' Z';
    const toLine = (coords: LngLat[]) =>
      coords.map((c, i) => {
        const [x, y] = project(c);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');

    const centroid = (coords: LngLat[]): LngLat => [
      coords.reduce((s, c) => s + c[0], 0) / coords.length,
      coords.reduce((s, c) => s + c[1], 0) / coords.length,
    ];

    const targetPx = (W - PAD * 2) * 0.2;
    const rawM = targetPx / scale;
    const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
    const stepM = steps.find((s) => s >= rawM) ?? 1000;

    return {
      parcelPaths: parcelRings.map(toPath),
      zoneShapes: visibleZones.map((z, i) => {
        const ring = ringsOf(z.geometry)[0] ?? [];
        const c = ring.length ? project(centroid(ring)) : null;
        return {
          id: z.id,
          letter: LETTERS[i] ?? '·',
          d: ring.length ? toPath(ring) : '',
          color: z.couleur || '#2f7d4f',
          label: c,
        };
      }),
      objShapes: visibleObjets.map((o, i) => {
        const tool = toolByKey(o.outil_key);
        const color = (o.style?.color as string) || tool?.color || '#8a6d3b';
        const ring = ringsOf(o.geometry)[0];
        const line = lineOf(o.geometry);
        const pt = pointOf(o.geometry);
        const anchor = ring?.length
          ? project(centroid(ring))
          : line.length
            ? project(line[Math.floor(line.length / 2)])
            : pt
              ? project(pt)
              : null;
        return {
          id: o.id,
          num: i + 1,
          color,
          d: ring?.length ? toPath(ring) : null,
          line: line.length > 1 ? toLine(line) : null,
          point: pt ? project(pt) : null,
          anchor,
        };
      }),
      stepM,
      barPx: stepM * scale,
      gridPx: Math.max(scale * (stepM / 5), 18),
    };
  }, [parcelles, visibleZones, visibleObjets]);

  const objRows = visibleObjets.map((o, i) => {
    const tool = toolByKey(o.outil_key);
    const unit = tool?.unit ?? 'u';
    return {
      num: i + 1,
      color: (o.style?.color as string) || tool?.color || '#8a6d3b',
      glyph: tool?.glyph ?? '•',
      name: o.nom || tool?.label || 'Ouvrage',
      type: tool?.label ?? o.outil_key,
      measure: fmtMeasure(unit, measureFor(unit, o.geometry)),
    };
  });

  return (
    <section className="palette-plan">
      <header className="flex items-end justify-between gap-3 flex-wrap mb-3">
        <div>
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]">
            Étape 5 · Le plan
          </span>
          <h3 className="mt-1 font-serif italic text-3xl leading-tight text-[hsl(var(--ds-forest-deep))]">
            Emplacements &amp; ouvrages, gravés sur le site
          </h3>
        </div>
        <div className="text-right text-[10px] uppercase tracking-widest text-[hsl(var(--ds-forest-deep))]/65">
          <div>
            {propertyName ?? 'Propriété'}
            {commune ? ` · ${commune}` : ''}
          </div>
          <div>
            {visibleZones.length} emplacement{visibleZones.length > 1 ? 's' : ''} ·{' '}
            {visibleObjets.length} ouvrage{visibleObjets.length > 1 ? 's' : ''}
            {completedAt ? ` · ${new Date(completedAt).toLocaleDateString('fr-FR')}` : ''}
          </div>
        </div>
      </header>

      {!geo ? (
        <div className="rounded-2xl border border-dashed border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 p-8 text-center print-exact">
          <p className="font-serif italic text-lg text-[hsl(var(--ds-forest-deep))]/70">
            Aucun emplacement ni ouvrage n’a encore été tracé dans l’Atelier.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] overflow-hidden print-exact">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img" aria-label="Plan des emplacements et des ouvrages">
            <defs>
              <pattern id="palette-plan-grid" width={geo.gridPx} height={geo.gridPx} patternUnits="userSpaceOnUse">
                <path
                  d={`M ${geo.gridPx} 0 L 0 0 0 ${geo.gridPx}`}
                  fill="none"
                  stroke="#2f5d3a"
                  strokeOpacity="0.08"
                  strokeWidth="1"
                />
              </pattern>
            </defs>

            <rect width={W} height={H} fill="#fbf7ee" />
            <rect width={W} height={H} fill="url(#palette-plan-grid)" />
            <rect x="14" y="14" width={W - 28} height={H - 28} fill="none" stroke="#b08d57" strokeOpacity="0.55" strokeWidth="1" strokeDasharray="6 5" />

            {/* Parcelles cadastrales */}
            {geo.parcelPaths.map((d, i) => (
              <path key={`p-${i}`} d={d} fill="none" stroke="#2f5d3a" strokeOpacity="0.55" strokeWidth="1.6" strokeDasharray="7 5" />
            ))}

            {/* Emplacements */}
            {geo.zoneShapes.map((z) =>
              z.d ? (
                <g key={z.id}>
                  <path d={z.d} fill={z.color} fillOpacity={0.16} stroke={z.color} strokeWidth={2.2} strokeLinejoin="round" />
                  {z.label && (
                    <>
                      <circle cx={z.label[0]} cy={z.label[1]} r="12" fill="#fbf7ee" stroke={z.color} strokeWidth="1.6" />
                      <text x={z.label[0]} y={z.label[1] + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill={z.color} fontFamily="Georgia, serif">
                        {z.letter}
                      </text>
                    </>
                  )}
                </g>
              ) : null,
            )}

            {/* Ouvrages */}
            {geo.objShapes.map((o) => (
              <g key={o.id}>
                {o.d && <path d={o.d} fill={o.color} fillOpacity={0.3} stroke={o.color} strokeWidth={2} strokeLinejoin="round" />}
                {o.line && <path d={o.line} fill="none" stroke={o.color} strokeWidth={3} strokeLinecap="round" />}
                {o.point && <circle cx={o.point[0]} cy={o.point[1]} r="6" fill={o.color} fillOpacity={0.85} stroke="#fbf7ee" strokeWidth="1.4" />}
                {o.anchor && (
                  <>
                    <circle cx={o.anchor[0]} cy={o.anchor[1] - 15} r="9.5" fill={o.color} stroke="#fbf7ee" strokeWidth="1.4" />
                    <text x={o.anchor[0]} y={o.anchor[1] - 11.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fbf7ee" fontFamily="Georgia, serif">
                      {o.num}
                    </text>
                  </>
                )}
              </g>
            ))}

            {/* Flèche du nord */}
            <g transform={`translate(${W - 62}, 52)`}>
              <path d="M0,-24 L7,8 L0,2 L-7,8 Z" fill="#2f5d3a" fillOpacity="0.8" />
              <text x="0" y="24" textAnchor="middle" fontSize="11" fill="#2f5d3a" fontFamily="Georgia, serif">N</text>
            </g>

            {/* Échelle graphique */}
            <g transform={`translate(${PAD}, ${H - 30})`}>
              <line x1="0" y1="0" x2={geo.barPx} y2="0" stroke="#2f5d3a" strokeWidth="2.4" />
              <line x1="0" y1="-5" x2="0" y2="5" stroke="#2f5d3a" strokeWidth="2.4" />
              <line x1={geo.barPx} y1="-5" x2={geo.barPx} y2="5" stroke="#2f5d3a" strokeWidth="2.4" />
              <text x={geo.barPx / 2} y="-9" textAnchor="middle" fontSize="11" fill="#2f5d3a" fontFamily="Georgia, serif">
                {geo.stepM} m
              </text>
            </g>
          </svg>
        </div>
      )}

      {/* Légende en deux colonnes */}
      <div className="mt-3 grid grid-cols-2 gap-4 text-[hsl(var(--ds-forest-deep))]">
        <div className="rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-3 print-exact print-avoid-break">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--ds-forest))] mb-2">
            Emplacements
          </p>
          <ul className="space-y-1">
            {visibleZones.map((z, i) => (
              <li key={z.id} className="flex items-baseline gap-2 text-[11.5px]">
                <span
                  className="mt-[2px] inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold print-exact"
                  style={{ backgroundColor: `${z.couleur || '#2f7d4f'}30`, color: z.couleur || '#2f7d4f' }}
                >
                  {LETTERS[i] ?? '·'}
                </span>
                <span className="font-semibold">{z.nom || 'Emplacement'}</span>
                <span className="opacity-60">
                  {fmtArea(z.surface_m2 ?? geometryAreaM2(z.geometry))}
                </span>
              </li>
            ))}
            {visibleZones.length === 0 && (
              <li className="text-[11.5px] italic opacity-60">Aucun emplacement tracé.</li>
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-3 print-exact print-avoid-break">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--ds-forest))] mb-2">
            Ouvrages de l’Atelier
          </p>
          <ul className="space-y-1">
            {objRows.map((o) => (
              <li key={o.num} className="flex items-baseline gap-2 text-[11.5px]">
                <span
                  className="mt-[2px] inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white print-exact"
                  style={{ backgroundColor: o.color }}
                >
                  {o.num}
                </span>
                <span className="font-semibold">{o.name}</span>
                <span className="opacity-60">
                  {o.type} · {o.measure}
                </span>
              </li>
            ))}
            {objRows.length === 0 && (
              <li className="text-[11.5px] italic opacity-60">Aucun ouvrage dessiné.</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default PalettePlanSchema;
