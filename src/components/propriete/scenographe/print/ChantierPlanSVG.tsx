import React from 'react';
import { STRATES } from '@/lib/plantSpread';
import { sizeAt } from '@/lib/immersion/growthModel';
import type { Planting } from '@/hooks/propriete/useOuvrageScenarios';

type LngLat = [number, number];

/** Aplatit une géométrie GeoJSON tolérante en un anneau [lng, lat]. */
export function ringOf(geometry: any): LngLat[] {
  const g = geometry?.type === 'Feature' ? geometry.geometry : geometry;
  if (!g?.type) return [];
  if (g.type === 'Polygon') return (g.coordinates?.[0] ?? []) as LngLat[];
  if (g.type === 'MultiPolygon') return ((g.coordinates?.[0]?.[0] ?? []) as LngLat[]);
  if (g.type === 'LineString') return (g.coordinates ?? []) as LngLat[];
  if (g.type === 'Point' && Array.isArray(g.coordinates)) return [g.coordinates as LngLat];
  return [];
}

interface Props {
  /** Emprise de l'ouvrage travaillé. */
  geometry: any;
  /** Emprises voisines, tracées en trait fin pour situer le chantier. */
  neighbours?: any[];
  plantings: Planting[];
  /** Numéro de plan par espèce (nom scientifique → n°). */
  numberOf: Map<string, number>;
  /** Horizon de projection des houppiers, en années. */
  year: number;
  width?: number;
  height?: number;
  /** Rendu compact (vignette de couverture) : pas d'étiquettes. */
  compact?: boolean;
}

/**
 * Plan de plantation gravé en SVG — aucune tuile cartographique, donc un
 * rendu strictement reproductible sur papier : emprise réelle, houppiers
 * projetés à l'échelle, pastilles numérotées renvoyant à la liste.
 */
export const ChantierPlanSVG: React.FC<Props> = ({
  geometry,
  neighbours = [],
  plantings,
  numberOf,
  year,
  width = 1000,
  height = 660,
  compact = false,
}) => {
  const PAD = compact ? 16 : 42;

  const geo = React.useMemo(() => {
    const ring = ringOf(geometry);
    const others = neighbours.map(ringOf).filter((r) => r.length > 1);
    const pts: LngLat[] = [
      ...ring,
      ...plantings.map((p) => [p.lng, p.lat] as LngLat),
    ];
    if (pts.length === 0) return null;

    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
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

    // Marge : la plus grande envergure projetée doit tenir dans le cadre.
    const maxSpread = plantings.reduce((m, p) => Math.max(m, sizeAt(p, year).spreadM), 1);
    const wM = Math.max((maxLng - minLng) * mPerDegLat * k, 4) + maxSpread * 1.4;
    const hM = Math.max((maxLat - minLat) * mPerDegLat, 4) + maxSpread * 1.4;
    const scale = Math.min((width - PAD * 2) / wM, (height - PAD * 2) / hM);

    const project = ([lng, lat]: LngLat): [number, number] => [
      width / 2 + (lng - cLng) * mPerDegLat * k * scale,
      height / 2 - (lat - cLat) * mPerDegLat * scale,
    ];
    return { project, scale, ring, others };
  }, [geometry, neighbours, plantings, year, width, height, PAD]);

  if (!geo) return null;

  const { project, scale, ring, others } = geo;
  const path = (r: LngLat[]) =>
    r.map((c, i) => `${i === 0 ? 'M' : 'L'}${project(c).map((v) => v.toFixed(1)).join(' ')}`).join(' ') + ' Z';

  /** Barre d'échelle : un pas rond en mètres, lisible. */
  const targetPx = width * 0.18;
  const rawM = targetPx / scale;
  const step = [0.5, 1, 2, 5, 10, 20, 50].find((s) => s >= rawM) ?? 100;
  const barPx = step * scale;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ display: 'block' }}
      className="print-exact"
    >
      <defs>
        <pattern id="chantier-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="#e2d9c2" strokeWidth="0.6" />
        </pattern>
      </defs>

      <rect x="0" y="0" width={width} height={height} fill="#fdfbf4" />
      <rect x="0" y="0" width={width} height={height} fill="url(#chantier-grid)" opacity="0.55" />

      {/* Ouvrages voisins : simple repère de situation */}
      {others.map((r, i) => (
        <path key={`n${i}`} d={path(r)} fill="none" stroke="#b9ae94" strokeWidth="1" strokeDasharray="5 5" />
      ))}

      {/* Emprise du chantier */}
      {ring.length > 1 && (
        <path d={path(ring)} fill="rgba(107,124,90,0.07)" stroke="#6b7c5a" strokeWidth="2.2" />
      )}

      {/* Houppiers projetés */}
      {plantings.map((p) => {
        const [x, y] = project([p.lng, p.lat]);
        const info = STRATES[p.strate] ?? STRATES.herbacee;
        const r = Math.max(3, (sizeAt(p, year).spreadM / 2) * scale);
        return (
          <g key={`h-${p.id}`}>
            <circle cx={x} cy={y} r={r} fill={info.color} fillOpacity="0.16" stroke={info.color} strokeWidth="1" strokeOpacity="0.55" />
          </g>
        );
      })}

      {/* Pastilles numérotées, au-dessus des houppiers */}
      {plantings.map((p) => {
        const [x, y] = project([p.lng, p.lat]);
        const info = STRATES[p.strate] ?? STRATES.herbacee;
        const n = numberOf.get(p.scientificName);
        const rr = compact ? 5 : 10;
        return (
          <g key={`p-${p.id}`}>
            <circle cx={x} cy={y} r={rr} fill="#fdfbf4" stroke={info.color} strokeWidth="1.8" />
            {!compact && (
              <text
                x={x}
                y={y + 3.6}
                textAnchor="middle"
                fontSize="10.5"
                fontFamily="Helvetica, Arial, sans-serif"
                fontWeight="700"
                fill={info.color}
              >
                {n ?? '·'}
              </text>
            )}
          </g>
        );
      })}

      {!compact && (
        <>
          {/* Nord */}
          <g transform={`translate(${width - 46}, 40)`}>
            <path d="M0 -20 L7 10 L0 4 L-7 10 Z" fill="#6b7c5a" />
            <text y="26" textAnchor="middle" fontSize="10" fontFamily="Helvetica, Arial, sans-serif" fill="#6b7c5a" letterSpacing="1.5">
              N
            </text>
          </g>

          {/* Échelle */}
          <g transform={`translate(${PAD}, ${height - 24})`}>
            <line x1="0" y1="0" x2={barPx} y2="0" stroke="#4a3f2e" strokeWidth="2" />
            <line x1="0" y1="-4" x2="0" y2="4" stroke="#4a3f2e" strokeWidth="2" />
            <line x1={barPx} y1="-4" x2={barPx} y2="4" stroke="#4a3f2e" strokeWidth="2" />
            <text x={barPx / 2} y="-8" textAnchor="middle" fontSize="10.5" fontFamily="Helvetica, Arial, sans-serif" fill="#4a3f2e">
              {step < 1 ? `${step * 100} cm` : `${step} m`}
            </text>
          </g>
        </>
      )}
    </svg>
  );
};

export default ChantierPlanSVG;
