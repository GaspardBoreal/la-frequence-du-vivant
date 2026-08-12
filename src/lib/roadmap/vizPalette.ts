/** Identité de dessin de la Roadmap vivante : trait fin, encre + primaire, jamais de couleur en dur. */

export const VIZ = {
  ink: 'hsl(var(--foreground))',
  soft: 'hsl(var(--muted-foreground))',
  line: 'hsl(var(--border))',
  accent: 'hsl(var(--primary))',
  accentSoft: 'hsl(var(--primary) / 0.35)',
  glow: 'hsl(var(--primary) / 0.12)',
  surface: 'hsl(var(--card))',
} as const;

/** Teinte stable dérivée d'un libellé de domaine (rotation autour de la primaire). */
export function domainHue(domain: string): string {
  let h = 0;
  for (let i = 0; i < domain.length; i += 1) h = (h * 31 + domain.charCodeAt(i)) % 360;
  const rot = (h % 5) * 14 - 28; // ±28° autour de la primaire
  return `hsl(calc(var(--primary-h, 165) + ${rot}) 45% 45%)`;
}

/** Opacité graduée pour une série ordonnée. */
export const seriesOpacity = (i: number, total: number) =>
  0.35 + (total <= 1 ? 0.5 : (i / (total - 1)) * 0.55);

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Chemin lissé (Catmull-Rom → Bézier) pour des courbes de croquis. */
export function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length < 3) return points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  let d = `M${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}
