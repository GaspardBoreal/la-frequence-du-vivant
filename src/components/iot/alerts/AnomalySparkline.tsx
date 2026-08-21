import React from 'react';
import type { PointSerie, RegleMeta } from '@/lib/iot/anomalies';

/**
 * Micro-graphe SVG, sans dépendance : soit la signature schématique d'une
 * règle (fiche explicative), soit les vraies données autour d'une anomalie
 * (ligne d'alerte dépliée). Recharts reste réservé à l'Observatoire.
 */

const W = 120;
const H = 34;
const PAD = 3;

/** Signatures schématiques : la forme parle avant les chiffres. */
const FORMES: Record<RegleMeta['signature'], number[]> = {
  pic: [0.5, 0.48, 0.52, 0.5, 1, 0.49, 0.51, 0.5, 0.48],
  marche: [0.25, 0.26, 0.24, 0.27, 0.8, 0.82, 0.79, 0.81, 0.8],
  plateau: [0.3, 0.45, 0.6, 0.55, 0.55, 0.55, 0.55, 0.55, 0.55],
  trou: [0.5, 0.55, 0.48, 0.52, NaN, NaN, NaN, 0.5, 0.53],
  nuage: [0.45, 0.55, 0.42, 0.58, 0.47, 0.95, 0.5, 0.53, 0.46],
  derive: [0.35, 0.38, 0.44, 0.52, 0.61, 0.7, 0.78, 0.86, 0.92],
  refus: [0.5, NaN, 0.5, NaN, 0.5, NaN, 0.5, NaN, 0.5],
};

const path = (pts: Array<{ x: number; y: number } | null>) => {
  let d = '';
  let pen = false;
  pts.forEach((p) => {
    if (!p) { pen = false; return; }
    d += `${pen ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
    pen = true;
  });
  return d.trim();
};

interface Props {
  /** Signature schématique (fiche de règle). */
  forme?: RegleMeta['signature'];
  /** Vraies données autour de l'anomalie (ligne d'alerte). */
  serie?: PointSerie[];
  className?: string;
  /** Couleur du tracé fautif : jeton du thème. */
  tone?: 'destructive' | 'warning' | 'muted';
}

export const AnomalySparkline: React.FC<Props> = ({ forme, serie, className, tone = 'destructive' }) => {
  const values = React.useMemo<number[]>(() => {
    if (serie?.length) return serie.map((p) => p.v);
    return FORMES[forme ?? 'pic'];
  }, [serie, forme]);

  const fautifs = React.useMemo<boolean[]>(() => {
    if (serie?.length) return serie.map((p) => !!p.fautif);
    const f = FORMES[forme ?? 'pic'];
    const max = Math.max(...f.filter(Number.isFinite));
    return f.map((v) => Number.isFinite(v) && v === max && (forme === 'pic' || forme === 'nuage'));
  }, [serie, forme]);

  const finis = values.filter((v) => Number.isFinite(v));
  const min = finis.length ? Math.min(...finis) : 0;
  const max = finis.length ? Math.max(...finis) : 1;
  const span = max - min || 1;

  const pts = values.map((v, i) =>
    Number.isFinite(v)
      ? {
          x: PAD + (i * (W - 2 * PAD)) / Math.max(1, values.length - 1),
          y: H - PAD - ((v - min) / span) * (H - 2 * PAD),
        }
      : null,
  );

  const stroke =
    tone === 'destructive' ? 'hsl(var(--destructive))' : tone === 'warning' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))';

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className ?? 'h-[34px] w-[120px]'}
      role="img"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <rect x="0" y={H * 0.28} width={W} height={H * 0.44} rx="3" className="fill-muted/40" />
      <path d={path(pts)} fill="none" stroke="hsl(var(--muted-foreground))" strokeOpacity="0.75" strokeWidth="1.4" strokeLinecap="round" />
      {pts.map((p, i) =>
        p && fautifs[i] ? <circle key={i} cx={p.x} cy={p.y} r="2.6" fill={stroke} /> : null,
      )}
    </svg>
  );
};

export default AnomalySparkline;
