import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Pencil } from 'lucide-react';
import type { ProprieteParcelle } from '@/hooks/propriete/usePropertyParcelles';
import type { SoilSample } from '@/hooks/propriete/usePropertySoil';

type LngLat = [number, number]; // [lng, lat]

/** Aplatit Polygon / MultiPolygon en anneaux de coordonnées [lng, lat]. */
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

interface Props {
  parcelles?: ProprieteParcelle[];
  samples: SoilSample[];
  propertyName?: string;
  printOnly?: boolean;
  onEdit?: () => void;
}

const W = 1000;
const H = 560;
const PAD = 46;

export const SoilSamplesPlan: React.FC<Props> = ({
  parcelles = [],
  samples,
  propertyName,
  printOnly = false,
  onEdit,
}) => {
  const placed = samples.filter((s) => s.lat != null && s.lng != null);

  const geo = React.useMemo(() => {
    const parcelRings: LngLat[][] = parcelles.flatMap((p) => ringsOf(p.geometry));
    const crosses: LngLat[] = parcelles
      .filter((p) => !p.geometry && p.centroid_lat != null && p.centroid_lng != null)
      .map((p) => [p.centroid_lng as number, p.centroid_lat as number]);
    const pts: LngLat[] = [
      ...parcelRings.flat(),
      ...crosses,
      ...placed.map((s) => [s.lng as number, s.lat as number] as LngLat),
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
    const k = Math.cos((cLat * Math.PI) / 180) || 1;

    // Dimensions en mètres (approximation locale)
    const mPerDegLat = 111320;
    let wM = Math.max((maxLng - minLng) * mPerDegLat * k, 12);
    let hM = Math.max((maxLat - minLat) * mPerDegLat, 12);
    // Marge respiratoire de 18 %
    wM *= 1.18;
    hM *= 1.18;

    const innerW = W - PAD * 2;
    const innerH = H - PAD * 2;
    const scale = Math.min(innerW / wM, innerH / hM); // px par mètre
    const cLng = (minLng + maxLng) / 2;

    const project = ([lng, lat]: LngLat): [number, number] => {
      const dxM = (lng - cLng) * mPerDegLat * k;
      const dyM = (lat - cLat) * mPerDegLat;
      return [W / 2 + dxM * scale, H / 2 - dyM * scale];
    };

    const toPath = (ring: LngLat[]) =>
      ring
        .map((c, i) => {
          const [x, y] = project(c);
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ') + ' Z';

    // Échelle graphique : choisir un pas « joli »
    const targetPx = innerW * 0.22;
    const rawM = targetPx / scale;
    const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
    const stepM = steps.find((s) => s >= rawM) ?? 1000;
    const barPx = stepM * scale;

    return {
      paths: parcelRings.map(toPath),
      crosses: crosses.map(project),
      labels: parcelles
        .map((p) => {
          const rings = ringsOf(p.geometry);
          if (rings.length === 0) return null;
          const ring = rings[0];
          const sx = ring.reduce((a, c) => a + c[0], 0) / ring.length;
          const sy = ring.reduce((a, c) => a + c[1], 0) / ring.length;
          const [x, y] = project([sx, sy]);
          const ref = [p.section, p.numero].filter(Boolean).join(' ');
          return ref ? { x, y, ref } : null;
        })
        .filter(Boolean) as { x: number; y: number; ref: string }[],
      pins: placed.map((s) => {
        const [x, y] = project([s.lng as number, s.lat as number]);
        return { id: s.id, label: s.label, location: s.location?.trim() ?? '', x, y };
      }),
      stepM,
      barPx,
      gridPx: Math.max(scale * (stepM / 5), 18),
    };
  }, [parcelles, placed]);

  const header = (
    <div className="flex items-end justify-between gap-3 mb-3 flex-wrap">
      <div>
        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]">
          Le plan
        </span>
        <h3 className="mt-1 font-serif italic text-3xl text-[hsl(var(--ds-forest-deep))] leading-tight">
          Là où la terre a été ouverte
        </h3>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--ds-line))] px-2.5 py-1 text-[10px] uppercase tracking-widest text-[hsl(var(--ds-forest-deep))]/70">
          <MapPin className="w-3 h-3 text-[hsl(var(--ds-gold))]" />
          {placed.length} / {samples.length} géolocalisés
        </span>
        {!printOnly && onEdit && (
          <button
            onClick={onEdit}
            title="Modifier les prélèvements"
            aria-label="Modifier les prélèvements"
            className="p-1.5 rounded border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] text-[hsl(var(--ds-forest-deep))] hover:bg-[hsl(var(--ds-gold))]/15 print:hidden"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  if (!geo) {
    return (
      <section className="mb-8 print-avoid-break analyze-plan">
        {header}
        <div className="rounded-2xl border border-dashed border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 p-8 text-center">
          <p className="font-serif italic text-lg text-[hsl(var(--ds-forest-deep))]/70">
            Aucun prélèvement n'a encore été positionné sur le plan du site.
          </p>
          {!printOnly && onEdit && (
            <button
              onClick={onEdit}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--ds-forest))]/40 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--ds-forest-deep))] hover:bg-[hsl(var(--ds-forest))]/10 transition"
            >
              <MapPin className="w-3.5 h-3.5" /> Positionner les prélèvements
            </button>
          )}
        </div>
      </section>
    );
  }

  const anim = !printOnly;

  return (
    <section className="mb-8 print-avoid-break analyze-plan">
      {header}
      <div className="relative rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] overflow-hidden shadow-[0_8px_30px_-18px_rgba(22,48,32,0.35)] print:shadow-none">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto block"
          role="img"
          aria-label="Plan des parcelles et des points de prélèvement"
        >
          <defs>
            <pattern
              id="soil-plan-grid"
              width={geo.gridPx}
              height={geo.gridPx}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${geo.gridPx} 0 L 0 0 0 ${geo.gridPx}`}
                fill="none"
                stroke="hsl(var(--ds-forest))"
                strokeOpacity="0.09"
                strokeWidth="1"
              />
            </pattern>
            <filter id="soil-plan-shadow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow
                dx="0"
                dy="2.5"
                stdDeviation="2.4"
                floodColor="rgb(30,40,20)"
                floodOpacity="0.35"
              />
            </filter>
          </defs>

          <rect width={W} height={H} fill="hsl(var(--ds-cream))" />
          <rect width={W} height={H} fill="url(#soil-plan-grid)" />
          <rect
            x="14"
            y="14"
            width={W - 28}
            height={H - 28}
            fill="none"
            stroke="hsl(var(--ds-gold))"
            strokeOpacity="0.55"
            strokeWidth="1"
            strokeDasharray="6 5"
          />

          {/* Parcelles */}
          {geo.paths.map((d, i) =>
            anim ? (
              <motion.path
                key={i}
                d={d}
                fill="hsl(var(--ds-forest))"
                fillOpacity={0.14}
                stroke="hsl(var(--ds-forest))"
                strokeWidth={2.6}
                strokeLinejoin="round"
                initial={{ pathLength: 0, fillOpacity: 0 }}
                animate={{ pathLength: 1, fillOpacity: 0.14 }}
                transition={{ duration: 1.1, delay: 0.1 + i * 0.08, ease: 'easeInOut' }}
              />
            ) : (
              <path
                key={i}
                d={d}
                fill="hsl(var(--ds-forest))"
                fillOpacity={0.14}
                stroke="hsl(var(--ds-forest))"
                strokeWidth={2.6}
                strokeLinejoin="round"
              />
            ),
          )}
          {geo.paths.map((d, i) => (
            <path
              key={`halo-${i}`}
              d={d}
              fill="none"
              stroke="hsl(var(--ds-gold))"
              strokeOpacity={0.5}
              strokeWidth={6}
              strokeLinejoin="round"
              style={{ mixBlendMode: 'multiply' }}
            />
          ))}

          {/* Parcelles sans géométrie : petit repère croix */}
          {geo.crosses.map(([x, y], i) => (
            <g key={`cross-${i}`} stroke="hsl(var(--ds-forest))" strokeOpacity={0.5} strokeWidth={1.6}>
              <line x1={x - 7} y1={y} x2={x + 7} y2={y} />
              <line x1={x} y1={y - 7} x2={x} y2={y + 7} />
            </g>
          ))}

          {/* Références cadastrales */}
          {geo.labels.map((l, i) => (
            <text
              key={`ref-${i}`}
              x={l.x}
              y={l.y}
              textAnchor="middle"
              fill="hsl(var(--ds-forest))"
              fillOpacity={0.75}
              style={{
                fontSize: 13,
                letterSpacing: 2.4,
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              {l.ref}
            </text>
          ))}

          {/* Épingles de prélèvement */}
          {geo.pins.map((p, i) => {
            const Wrapper: any = anim ? motion.g : 'g';
            const animProps = anim
              ? {
                  initial: { opacity: 0, y: -22 },
                  animate: { opacity: 1, y: 0 },
                  transition: {
                    delay: 0.5 + i * 0.09,
                    type: 'spring' as const,
                    stiffness: 320,
                    damping: 18,
                  },
                }
              : {};
            const labelLeft = p.x > W * 0.62;
            return (
              <Wrapper key={p.id} {...animProps}>
                {/* fil de rappel + étiquette */}
                {p.location && (
                  <>
                    <line
                      x1={p.x}
                      y1={p.y}
                      x2={labelLeft ? p.x - 18 : p.x + 18}
                      y2={p.y + 8}
                      stroke="hsl(var(--ds-forest))"
                      strokeOpacity={0.45}
                      strokeWidth={1}
                      strokeDasharray="3 3"
                    />
                    <text
                      x={labelLeft ? p.x - 22 : p.x + 22}
                      y={p.y + 12}
                      textAnchor={labelLeft ? 'end' : 'start'}
                      fill="hsl(var(--ds-forest-deep))"
                      fillOpacity={0.8}
                      style={{ fontSize: 12, fontStyle: 'italic' }}
                    >
                      {p.location.length > 28 ? `${p.location.slice(0, 27)}…` : p.location}
                    </text>
                  </>
                )}
                <g transform={`translate(${p.x - 19}, ${p.y - 42})`} filter="url(#soil-plan-shadow)">
                  <path
                    d="M19 45 C 6 30 3 20 3 15 A 16 16 0 1 1 35 15 C 35 20 32 30 19 45 Z"
                    fill="hsl(var(--ds-cream))"
                    stroke="hsl(var(--ds-forest))"
                    strokeWidth={2.2}
                  />
                  <text
                    x={19}
                    y={21}
                    textAnchor="middle"
                    fill="hsl(var(--ds-forest))"
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontWeight: 700,
                      fontSize: 17,
                    }}
                  >
                    {p.label}
                  </text>
                </g>
              </Wrapper>
            );
          })}

          {/* Rose des vents */}
          <g transform={`translate(${W - 62}, 56)`}>
            <circle r="20" fill="none" stroke="hsl(var(--ds-gold))" strokeOpacity={0.6} />
            <path d="M0 -16 L5 4 L0 0 L-5 4 Z" fill="hsl(var(--ds-forest))" />
            <text
              y={-22}
              textAnchor="middle"
              fill="hsl(var(--ds-forest))"
              style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5 }}
            >
              N
            </text>
          </g>

          {/* Échelle graphique */}
          <g transform={`translate(34, ${H - 34})`}>
            <line x1={0} y1={0} x2={geo.barPx} y2={0} stroke="hsl(var(--ds-forest))" strokeWidth={2} />
            <line x1={0} y1={-5} x2={0} y2={5} stroke="hsl(var(--ds-forest))" strokeWidth={2} />
            <line
              x1={geo.barPx}
              y1={-5}
              x2={geo.barPx}
              y2={5}
              stroke="hsl(var(--ds-forest))"
              strokeWidth={2}
            />
            <text
              x={geo.barPx / 2}
              y={-10}
              textAnchor="middle"
              fill="hsl(var(--ds-forest))"
              style={{ fontSize: 11, letterSpacing: 1.2, fontWeight: 600 }}
            >
              {geo.stepM} m
            </text>
          </g>

          {/* Cartouche */}
          <text
            x={W - 34}
            y={H - 30}
            textAnchor="end"
            fill="hsl(var(--ds-forest))"
            fillOpacity={0.7}
            style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}
          >
            {(propertyName ?? 'Propriété').toUpperCase()} · {samples.length} PRÉLÈVEMENTS
          </text>
        </svg>
      </div>
      <p className="mt-2 text-[10.5px] text-[hsl(var(--ds-forest-deep))]/55 text-center">
        Plan orienté au nord · parcelles cadastrales et points de prélèvement A→
        {samples[samples.length - 1]?.label ?? 'C'}
      </p>
    </section>
  );
};

export default SoilSamplesPlan;
